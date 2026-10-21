import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { visitas } = req.body;

    if (!visitas || !Array.isArray(visitas) || visitas.length === 0) {
        return res.status(400).json({
            error: 'O payload deve conter um array "visitas" não vazio com id, latitude e longitude.'
        });
    }

    if (visitas.length === 1) {
        return res.status(200).json({
            api_utilizada: 'nenhuma',
            visitas: visitas
        });
    }

    for (const v of visitas) {
        if (typeof v.latitude !== 'number' || typeof v.longitude !== 'number' || !v.id) {
            return res.status(400).json({
                error: 'Cada visita deve conter id, latitude (numérica) e longitude (numérica).'
            });
        }
    }

    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const mesAno = `${ano}-${mes}`;

    let usoGoogle = 0;
    let usoMapbox = 0;

    // Busca de cotas no Supabase / PostgreSQL (com tolerância se a tabela ainda não tiver sido criada)
    if (supabase) {
        try {
            const { data, error } = await supabase
                .from('controle_cotas_apis')
                .select('mes_ano, uso_google, uso_mapbox')
                .eq('mes_ano', mesAno)
                .single();

            if (error && error.code === 'PGRST116') {
                // Não encontrado, insere inicial
                await supabase.from('controle_cotas_apis').insert({
                    mes_ano: mesAno,
                    uso_google: 0,
                    uso_mapbox: 0
                });
            } else if (data) {
                usoGoogle = data.uso_google || 0;
                usoMapbox = data.uso_mapbox || 0;
            }
        } catch (dbErr) {
            console.warn('[ROTA] Aviso ao ler cotas do banco:', dbErr);
        }
    }

    const googleKey = process.env.GOOGLE_MAPS_API_KEY;
    const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN;

    // =========================================================================
    // PRIORIDADE 1: Google Maps Routes API (Compute Routes)
    // =========================================================================
    if (usoGoogle < 39500 && googleKey) {
        try {
            const origin = {
                location: {
                    latLng: {
                        latitude: visitas[0].latitude,
                        longitude: visitas[0].longitude
                    }
                }
            };

            const destination = {
                location: {
                    latLng: {
                        latitude: visitas[visitas.length - 1].latitude,
                        longitude: visitas[visitas.length - 1].longitude
                    }
                }
            };

            const intermediates = visitas.slice(1, -1).map(v => ({
                location: {
                    latLng: {
                        latitude: v.latitude,
                        longitude: v.longitude
                    }
                }
            }));

            const googlePayload = {
                origin,
                destination,
                intermediates,
                travelMode: 'DRIVE',
                routingPreference: 'TRAFFIC_AWARE_OPTIMAL',
                optimizeWaypointOrder: true
            };

            const googleResponse = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': googleKey,
                    'X-Goog-FieldMask': 'routes.optimizedIntermediateWaypointIndex'
                },
                body: JSON.stringify(googlePayload),
                signal: AbortSignal.timeout(6000)
            });

            if (googleResponse.status === 200) {
                const googleData = await googleResponse.json();
                const intermediateVisits = visitas.slice(1, -1);
                const optimizedIndices = googleData.routes?.[0]?.optimizedIntermediateWaypointIndex || [];

                let visitasOrdenadas = [];
                if (intermediateVisits.length > 0 && optimizedIndices.length === intermediateVisits.length) {
                    const intermediatesOrdenados = optimizedIndices.map(idx => intermediateVisits[idx]);
                    visitasOrdenadas = [visitas[0], ...intermediatesOrdenados, visitas[visitas.length - 1]];
                } else {
                    visitasOrdenadas = [...visitas];
                }

                // Incrementa no banco
                if (supabase) {
                    supabase.rpc('increment_uso_google', { p_mes_ano: mesAno }).catch(() => {
                        supabase.from('controle_cotas_apis').update({ uso_google: usoGoogle + 1 }).eq('mes_ano', mesAno);
                    });
                }

                return res.status(200).json({
                    api_utilizada: 'google',
                    visitas: visitasOrdenadas
                });
            }
        } catch (errGoogle: any) {
            console.warn('[ROTA] Google Routes API falhou ou expirou:', errGoogle?.message);
        }
    }

    // =========================================================================
    // PRIORIDADE 2: Mapbox Optimization API (driving-traffic)
    // =========================================================================
    if (usoMapbox < 99500 && mapboxToken) {
        try {
            const coordinatesString = visitas.map(v => `${v.longitude},${v.latitude}`).join(';');
            const mapboxUrl = `https://api.mapbox.com/optimized-trips/v1/mapbox/driving-traffic/${coordinatesString}?source=first&destination=last&roundtrip=false&access_token=${mapboxToken}`;

            const mapboxResponse = await fetch(mapboxUrl, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                signal: AbortSignal.timeout(6000)
            });

            if (mapboxResponse.status === 200) {
                const mapboxData = await mapboxResponse.json();

                if (mapboxData.code === 'Ok' && Array.isArray(mapboxData.waypoints)) {
                    const mapeado = visitas.map((v, i) => ({
                        visita: v,
                        ordem: mapboxData.waypoints[i]?.waypoint_index ?? i
                    }));

                    mapeado.sort((a, b) => a.ordem - b.ordem);
                    const visitasOrdenadas = mapeado.map(item => item.visita);

                    if (supabase) {
                        supabase.from('controle_cotas_apis').update({ uso_mapbox: usoMapbox + 1 }).eq('mes_ano', mesAno);
                    }

                    return res.status(200).json({
                        api_utilizada: 'mapbox',
                        visitas: visitasOrdenadas
                    });
                }
            }
        } catch (errMapbox: any) {
            console.warn('[ROTA] Mapbox Optimization API falhou ou expirou:', errMapbox?.message);
        }
    }

    // =========================================================================
    // PRIORIDADE 3: OSRM Público
    // =========================================================================
    try {
        const coordinatesString = visitas.map(v => `${v.longitude},${v.latitude}`).join(';');
        const osrmUrl = `https://router.project-osrm.org/trip/v1/driving/${coordinatesString}?source=first&destination=last&roundtrip=false`;

        const osrmResponse = await fetch(osrmUrl, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(8000)
        });

        if (osrmResponse.status === 200) {
            const osrmData = await osrmResponse.json();

            if (osrmData.code === 'Ok' && Array.isArray(osrmData.waypoints)) {
                const mapeado = visitas.map((v, i) => ({
                    visita: v,
                    ordem: osrmData.waypoints[i]?.waypoint_index ?? i
                }));

                mapeado.sort((a, b) => a.ordem - b.ordem);
                const visitasOrdenadas = mapeado.map(item => item.visita);

                return res.status(200).json({
                    api_utilizada: 'osrm',
                    visitas: visitasOrdenadas
                });
            }
        }

        throw new Error(`OSRM retornou status inválido: ${osrmResponse.status}`);
    } catch (errOsrm: any) {
        console.error('[ROTA] Todas as 3 APIs de roteamento falharam:', errOsrm?.message);
        return res.status(200).json({
            api_utilizada: 'osrm',
            visitas: visitas,
            aviso: 'Serviços de roteamento indisponíveis. Ordem original preservada.'
        });
    }
}
