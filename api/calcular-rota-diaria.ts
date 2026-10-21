import pg from 'pg';

const { Pool } = pg;

let pool: any = null;
function getPool() {
    if (!pool && process.env.DATABASE_URL) {
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
        });
    }
    return pool;
}

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
    let client: any = null;

    const dbPool = getPool();
    if (dbPool) {
        try {
            client = await dbPool.connect();
            let cotaQuery = await client.query(
                'SELECT mes_ano, uso_google, uso_mapbox FROM controle_cotas_apis WHERE mes_ano = $1',
                [mesAno]
            );

            if (cotaQuery.rows.length === 0) {
                await client.query(
                    'INSERT INTO controle_cotas_apis (mes_ano, uso_google, uso_mapbox) VALUES ($1, 0, 0) ON CONFLICT (mes_ano) DO NOTHING',
                    [mesAno]
                );

                cotaQuery = await client.query(
                    'SELECT mes_ano, uso_google, uso_mapbox FROM controle_cotas_apis WHERE mes_ano = $1',
                    [mesAno]
                );
            }

            if (cotaQuery.rows.length > 0) {
                usoGoogle = cotaQuery.rows[0].uso_google;
                usoMapbox = cotaQuery.rows[0].uso_mapbox;
            }
        } catch (dbErr) {
            console.warn('[ROTA] Aviso ao ler cotas do PostgreSQL:', dbErr);
        }
    }

    const googleKey = process.env.GOOGLE_MAPS_API_KEY;
    const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN;

    try {
        // PRIORIDADE 1: Google Maps Routes API
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
                        const intermediatesOrdenados = optimizedIndices.map((idx: number) => intermediateVisits[idx]);
                        visitasOrdenadas = [visitas[0], ...intermediatesOrdenados, visitas[visitas.length - 1]];
                    } else {
                        visitasOrdenadas = [...visitas];
                    }

                    if (client) {
                        await client.query(
                            'UPDATE controle_cotas_apis SET uso_google = uso_google + 1 WHERE mes_ano = $1',
                            [mesAno]
                        );
                    }

                    return res.status(200).json({
                        api_utilizada: 'google',
                        visitas: visitasOrdenadas
                    });
                }
            } catch (errGoogle) {
                // Falha do Google: prossegue para Prioridade 2
            }
        }

        // PRIORIDADE 2: Mapbox Optimization API
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

                        if (client) {
                            await client.query(
                                'UPDATE controle_cotas_apis SET uso_mapbox = uso_mapbox + 1 WHERE mes_ano = $1',
                                [mesAno]
                            );
                        }

                        return res.status(200).json({
                            api_utilizada: 'mapbox',
                            visitas: visitasOrdenadas
                        });
                    }
                }
            } catch (errMapbox) {
                // Falha do Mapbox: prossegue para Prioridade 3
            }
        }

        // PRIORIDADE 3: OSRM Público
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

            throw new Error('OSRM indisponível');
        } catch (errOsrm) {
            return res.status(200).json({
                api_utilizada: 'osrm',
                visitas: visitas
            });
        }
    } finally {
        if (client) {
            client.release();
        }
    }
}
