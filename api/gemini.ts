import { GoogleGenAI } from "@google/genai";
import { requireAuthorizedUser } from './_auth.js';

const extractNumbers = (text: string) => {
    let d = 0, t = 0;
    try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const jsonStr = jsonMatch[0];
            const json = JSON.parse(jsonStr);
            d = Number(json.distancia || json.distance || json.km || 0);
            t = Number(json.pedagios || json.tolls || json.pedagio || json.cost || 0);
            if (!isNaN(d) && d > 0) return { distance: d, tolls: t };
        }
    } catch (e) {
        // Falha silenciosa no JSON
    }

    const distMatch = text.match(/dist[a-zâ-ã]*\s*[:=]?\s*([\d.,]+)\s*(km)?/i) || text.match(/([\d.,]+)\s*km/i);
    const tollMatch = text.match(/ped[a-zâ-ã]*\s*[:=]?\s*(R\$)?\s*([\d.,]+)/i) || text.match(/pedagios?\s*[:=]?\s*([\d.,]+)/i);
    
    if (distMatch) d = parseFloat(distMatch[1].replace(',', '.'));
    if (tollMatch) t = parseFloat(tollMatch[2]?.replace(',', '.') || tollMatch[1]?.replace(',', '.') || '0');
    
    return { distance: d, tolls: t };
};

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// O Gemini às vezes responde "sobrecarregado" (503/429) ou demora: cada pergunta tem
// tempo limite e é repetida uma vez; se a cota da ferramenta Maps acabar, usa a distância do OSRM.
const askGemini = async (ai: GoogleGenAI, model: string, contents: string, config: any, timeoutMs: number) => {
    let timer: any;
    const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`tempo esgotado (${timeoutMs / 1000}s)`)), timeoutMs);
    });
    try {
        const result: any = await Promise.race([ai.models.generateContent({ model, contents, config }), timeout]);
        return (result.text || "") as string;
    } finally {
        clearTimeout(timer);
    }
};

// Plano B sem IA: CEP → endereço (ViaCEP) → coordenadas (OpenStreetMap) → distância real de carro (OSRM,
// o mesmo serviço do "Calcular melhor rota"). Aceita CEP ou endereço escrito.
const fetchJson = async (url: string, timeoutMs = 8000) => {
    const r = await fetch(url, {
        headers: { 'User-Agent': 'ZilinskiEscadas/1.0 (calculadora interna)', 'Accept-Language': 'pt-BR' },
        signal: AbortSignal.timeout(timeoutMs),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status} em ${new URL(url).host}`);
    return r.json();
};

const geocode = async (place: string) => {
    const queries: string[] = [];
    const cep = place.replace(/\D/g, '');
    const isCep = cep.length === 8 && /^[\d\s.-]+$/.test(place.trim());
    let label = place;
    if (isCep) {
        // CEP geral de cidade (ex.: 13300-000) não existe no ViaCEP: aí busca pelo CEP direto no OpenStreetMap
        const v: any = await fetchJson(`https://viacep.com.br/ws/${cep}/json/`).catch(() => ({ erro: true }));
        if (!v.erro) {
            if (v.logradouro) queries.push(`${v.logradouro}, ${v.localidade}, ${v.uf}`);
            queries.push(`${v.localidade}, ${v.uf}`);
            label = `${v.localidade}/${v.uf}`;
        }
    } else {
        queries.push(place);
    }
    const urls = queries.map(q => `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(q)}`);
    if (isCep) urls.push(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&postalcode=${cep.slice(0, 5)}-${cep.slice(5)}`);
    for (const url of urls) {
        const found: any[] = await fetchJson(url);
        if (found[0]) {
            if (label === place && found[0].display_name) label = String(found[0].display_name).split(',').slice(0, 3).join(',');
            return { lat: Number(found[0].lat), lng: Number(found[0].lon), label };
        }
    }
    throw new Error(`não achei as coordenadas de ${place}`);
};

const roadDistanceKm = async (origin: string, destination: string) => {
    const [a, b] = await Promise.all([geocode(origin), geocode(destination)]);
    const route: any = await fetchJson(`https://router.project-osrm.org/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=false`, 10000);
    const meters = route?.routes?.[0]?.distance;
    if (!meters) throw new Error('OSRM sem rota');
    return { km: Math.round(meters / 100) / 10, from: a.label, to: b.label };
};

export const findRoute = async (apiKey: string, origin: string, destination: string, latitude?: number, longitude?: number) => {
    const ai = new GoogleGenAI({ apiKey });

    // TENTATIVA 1: FERRAMENTA GOOGLE MAPS (mais precisa)
    const configWithMaps: any = { tools: [{ googleMaps: {} }] };
    if (latitude && longitude) {
        configWithMaps.toolConfig = { retrievalConfig: { latLng: { latitude, longitude } } };
    }
    const promptMaps = `Atue como um sistema de GPS inteligente (estilo Waze).
        Calcule a rota de carro mais rápida entre a origem "${origin}" e o destino "${destination}" no Brasil.

        Preciso de dois dados exatos:
        1. A distância em quilômetros (apenas ida).
        2. O valor total estimado dos pedágios (apenas ida).

        Responda ESTRITAMENTE com um objeto JSON neste formato:
        { "distancia": 123.5, "pedagios": 45.90 }`;

    for (let i = 0; i < 2; i++) {
        try {
            const text = await askGemini(ai, "gemini-2.5-flash", promptMaps, configWithMaps, 15000);
            console.log("Resposta GPS:", text);
            const data = extractNumbers(text);
            if (data.distance > 0) return data;
        } catch (e: any) {
            const msg = String(e?.message || e);
            console.warn(`Ferramenta Maps falhou (tentativa ${i + 1}):`, msg.slice(0, 300));
            if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) break; // cota acabou: repetir não adianta
            await sleep(1000);
        }
    }

    // TENTATIVA 2: DISTÂNCIA REAL PELO OSRM + PEDÁGIO ESTIMADO PELA IA
    try {
        const road = await roadDistanceKm(origin, destination);
        console.log("Distância OSRM:", road);
        let tolls = 0;
        const promptTolls = `Rota de carro de ${road.from} até ${road.to} (Brasil), ${road.km} km pelas principais rodovias.
        Qual o valor total aproximado dos pedágios, só ida, para carro de passeio? Se não tiver pedágio, 0.
        Retorne só o JSON: { "pedagios": 00.00 }`;
        for (const model of ["gemini-2.5-flash"]) {
            try {
                const text = await askGemini(ai, model, promptTolls, { thinkingConfig: { thinkingBudget: 0 } }, 15000);
                const m = text.match(/"?ped[a-zá]*"?\s*:\s*([\d.]+)/i);
                if (m) { tolls = Number(m[1]) || 0; break; }
            } catch (e: any) {
                console.warn(`Pedágio falhou (${model}):`, String(e?.message || e).slice(0, 200));
            }
        }
        return { distance: road.km, tolls };
    } catch (e: any) {
        console.warn("Distância pelo OSRM falhou:", e?.message || e);
    }

    // TENTATIVA 3: ESTIMATIVA LOGÍSTICA SÓ PELA IA (último recurso)
    const promptEstimate = `Como especialista em logística brasileira, estime a distância rodoviária e o custo aproximado de pedágios (só ida, carro) entre "${origin}" e "${destination}".
        Considere as principais rodovias.

        Retorne só o JSON:
        { "distancia": 00.0, "pedagios": 00.00 }`;

    for (const model of ["gemini-2.5-flash"]) {
        try {
            const text = await askGemini(ai, model, promptEstimate, { thinkingConfig: { thinkingBudget: 0 } }, 12000);
            console.log(`Resposta Estimativa (${model}):`, text);
            const data = extractNumbers(text);
            if (data.distance > 0) return data;
        } catch (e: any) {
            console.warn(`Estimativa falhou (${model}):`, e?.message || e);
        }
    }

    return null;
};

// Lê a nota fiscal (PDF ou foto) do corte a laser e devolve os itens com medida, pra Conferência em Compras
export const readLaserInvoice = async (apiKey: string, fileBase64: string, mimeType: string) => {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Esta é uma nota fiscal (DANFE) de chapas de aço cortadas a laser para escadas.
Responda SOMENTE um JSON, sem texto em volta, neste formato:
{ "number": "19773", "issueDate": "2026-10-29", "total": 2847.75,
  "clientsText": "texto das informações complementares que diz de quais escadas/clientes é (ex.: ESCADAS WAGNER FUIM / JAIR JOSÉ)",
  "installments": [ { "n": "001", "due": "2026-11-13", "value": 711.90 } ],
  "items": [ { "description": "descrição completa", "lengthMm": 3129, "widthMm": 280, "thicknessMm": 3.0, "qty": 2, "kg": 42.58, "total": 587.60 } ] }
Regras: "3.129 X 280MM" quer dizer 3129 por 280 mm (o ponto é milhar). "FQ 2,65" é a espessura 2.65 mm.
"COMP 150MM" num perfil L 60 X 25 quer dizer lengthMm 150 e widthMm 85 (soma das abas). qty é a quantidade de peças (PC), kg é a quantidade em KG da coluna QUANT.
Datas em AAAA-MM-DD. Números com ponto decimal.`;
    const result: any = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: 'user', parts: [{ inlineData: { mimeType, data: fileBase64 } }, { text: prompt }] }],
        config: { responseMimeType: 'application/json', thinkingConfig: { thinkingBudget: 0 } },
    });
    const json = JSON.parse(String(result.text || '').match(/\{[\s\S]*\}/)?.[0] || '{}');
    if (!Array.isArray(json.items) || json.items.length === 0) throw new Error('Não achei itens na nota');
    return json;
};

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    if (!(await requireAuthorizedUser(req, res))) return;

    if (req.body?.invoiceBase64) {
        const apiKey = process.env.API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'Erro de configuração: Chave de API inválida.' });
        try {
            return res.status(200).json(await readLaserInvoice(apiKey, req.body.invoiceBase64, req.body.mimeType || 'application/pdf'));
        } catch (e: any) {
            console.warn('Leitura da nota falhou:', String(e?.message || e).slice(0, 300));
            return res.status(500).json({ error: 'Não consegui ler a nota. Tente de novo ou mande o PDF original.' });
        }
    }

    const { origin, destination, latitude, longitude } = req.body;

    if (!origin || !destination) {
        return res.status(400).json({ error: 'Origin and destination are required' });
    }

    const apiKey = process.env.API_KEY;
    if (!apiKey || apiKey.length < 10 || apiKey.includes('YOUR_API_KEY')) {
        return res.status(500).json({ error: 'Erro de configuração: Chave de API inválida.' });
    }

    const data = await findRoute(apiKey, origin, destination, latitude, longitude);
    if (data) return res.status(200).json(data);

    return res.status(500).json({ error: "Não foi possível traçar a rota automaticamente. Por favor, insira a distância manualmente." });
}
