import { GoogleGenAI } from "@google/genai";

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

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { origin, destination, latitude, longitude } = req.body;

    if (!origin || !destination) {
        return res.status(400).json({ error: 'Origin and destination are required' });
    }

    const apiKey = process.env.API_KEY;
    if (!apiKey || apiKey.length < 10 || apiKey.includes('YOUR_API_KEY')) {
        return res.status(500).json({ error: 'Erro de configuração: Chave de API inválida.' });
    }

    const ai = new GoogleGenAI({ apiKey: apiKey });

    // TENTATIVA 1: FERRAMENTA GOOGLE MAPS
    try {
        console.log("Tentativa 1: Buscando rota precisa (Base Google Maps/Waze)...");
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

        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: promptMaps,
            config: configWithMaps
        });
        
        const text = result.text || "";
        console.log("Resposta GPS:", text);

        if (!text.includes("ERRO")) {
            const data = extractNumbers(text);
            if (data.distance > 0) {
                return res.status(200).json(data);
            }
        }
    } catch (e) {
        console.warn("Falha na ferramenta Maps, tentando estimativa logística...", e);
    }

    // TENTATIVA 2: ESTIMATIVA LOGÍSTICA (Fallback)
    try {
        console.log("Tentativa 2: Estimativa baseada em conhecimento...");
        const promptEstimate = `Como especialista em logística brasileira, estime a distância rodoviária e o custo aproximado de pedágios entre CEP ${origin} e CEP ${destination}.
        Considere as principais rodovias.
        
        Retorne JSON:
        { "distancia": 00.0, "pedagios": 00.00 }`;

        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash", 
            contents: promptEstimate
        });
        
        const text = result.text || "";
        console.log("Resposta Estimativa:", text);
        
        const data = extractNumbers(text);
        if (data.distance > 0) {
            return res.status(200).json(data);
        }
        
    } catch (e) {
        console.error("Erro fatal na estimativa:", e);
    }

    return res.status(500).json({ error: "Não foi possível traçar a rota automaticamente. Por favor, insira a distância manualmente." });
}
