
import { GoogleGenAI } from "@google/genai";

// Declaração para TypeScript entender o process.env injetado pelo Vite
declare var process: {
  env: {
    API_KEY: string;
    [key: string]: string | undefined;
  }
};

export const getBasePrice = (width: number): number => {
  if (width >= 40 && width <= 50) return 410;
  if (width >= 51 && width <= 70) return 425;
  if (width >= 71 && width <= 80) return 440;
  if (width >= 81 && width <= 90) return 490;
  return 425; 
};

export const getMultiplier = (depth: number): number => {
  if (depth <= 20) return 1.0;
  if (depth >= 21 && depth <= 25) return 1.05;
  if (depth >= 26 && depth <= 30) return 1.10;
  if (depth > 30) return 1.20;
  return 1.0; 
};

export const calculateTotalPrice = (width: number, depth: number, steps: number): number => {
  const basePrice = getBasePrice(width);
  const multiplier = getMultiplier(depth);
  if (steps <= 0) return 0;
  return basePrice * multiplier * steps;
};

export const calculateLandingPrice = (width: number, length: number): number => {
  if (length <= 0) return 0;
  const basePrice = getBasePrice(width);
  const sizeFactor = length / 25; 
  return basePrice * sizeFactor * 1.3; 
};

export const calculateFreightCost = (distance: number, fuelPrice: number, consumption: number): number => {
  if (distance <= 0 || fuelPrice <= 0 || consumption <= 0) return 0;
  const roundTripDistance = distance * 2;
  const totalFuelNeeded = roundTripDistance / consumption;
  return totalFuelNeeded * fuelPrice;
};

export const formatCurrencyBRL = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const getCurrentDateFormatted = (): string => {
  const date = new Date();
  return date.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

// --- GEMINI FUNCTION COM FALLBACK INTELIGENTE ---

const getCurrentLocation = (): Promise<{ latitude: number; longitude: number } | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        resolve(null);
      },
      { timeout: 5000 }
    );
  });
};

// Função auxiliar para extrair números de qualquer resposta (Texto ou JSON)
const extractNumbers = (text: string) => {
    // Tenta capturar formatos variados de resposta via Regex
    const distMatch = text.match(/dist[a-zâ-ã]*\s*[:=]?\s*([\d.,]+)\s*(km)?/i) || text.match(/([\d.,]+)\s*km/i);
    const tollMatch = text.match(/ped[a-zâ-ã]*\s*[:=]?\s*(R\$)?\s*([\d.,]+)/i) || text.match(/pedagios?\s*[:=]?\s*([\d.,]+)/i);
    
    let d = 0, t = 0;
    if (distMatch) d = parseFloat(distMatch[1].replace(',', '.'));
    if (tollMatch) t = parseFloat(tollMatch[2]?.replace(',', '.') || tollMatch[1]?.replace(',', '.') || '0');
    
    // Se regex falhar, tenta parsear como JSON puro
    if (d === 0) {
         try {
             const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
             const jsonStr = clean.match(/\{[\s\S]*\}/)?.[0] || clean;
             const json = JSON.parse(jsonStr);
             d = Number(json.distancia || json.distance || 0);
             t = Number(json.pedagios || json.tolls || json.cost || 0);
         } catch(e) {}
    }
    return { distance: d, tolls: t };
};

export const getRouteInfoFromGemini = async (origin: string, destination: string): Promise<{ distance: number; tolls: number }> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey.length < 10 || apiKey.includes('YOUR_API_KEY')) {
      throw new Error(`ERRO DE CONFIGURAÇÃO: Chave de API inválida.`);
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });

  // TENTATIVA 1: MODO FERRAMENTA (GOOGLE MAPS)
  // Este modo é mais preciso, mas pode falhar se a chave não tiver permissão específica.
  try {
      console.log("Tentativa 1: Google Maps Tool...");
      const configWithMaps: any = { tools: [{ googleMaps: {} }] };
      
      // Tenta adicionar contexto de localização (opcional)
      try {
          const userLoc = await getCurrentLocation();
          if (userLoc) {
              configWithMaps.toolConfig = { retrievalConfig: { latLng: { latitude: userLoc.latitude, longitude: userLoc.longitude } } };
          }
      } catch(e) { console.warn("Localização ignorada", e); }

      const promptMaps = `Use o Google Maps para calcular a rota de carro entre o CEP ${origin} e o CEP ${destination}.
      Se encontrar, responda EXATAMENTE neste formato: "Distancia: X km, Pedagios: R$ Y".
      Se não conseguir, responda apenas "ERRO".`;

      const result = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: promptMaps,
          config: configWithMaps
      });
      
      const text = result.text || "";
      console.log("Resposta Maps:", text);

      if (!text.includes("ERRO") && text.length > 5) {
          const data = extractNumbers(text);
          if (data.distance > 0) return data;
      }
  } catch (e) {
      console.warn("Falha na ferramenta Maps, indo para fallback...", e);
  }

  // TENTATIVA 2: MODO ESTIMATIVA (FALLBACK)
  // Se o Maps falhou (retornou 0 ou erro), pedimos para a IA ESTIMAR usando o conhecimento dela.
  // Isso garante que o usuário sempre receba um valor.
  try {
      console.log("Tentativa 2: Estimativa...");
      const promptEstimate = `Estime a distância rodoviária aproximada entre o CEP ${origin} e o CEP ${destination} no Brasil.
      Responda APENAS com os números no formato JSON:
      { "distancia": 100.5, "pedagios": 20.00 }`;

      const result = await ai.models.generateContent({
          model: "gemini-2.5-flash", // Sem ferramentas, apenas conhecimento textual
          contents: promptEstimate
      });
      
      const text = result.text || "";
      console.log("Resposta Estimativa:", text);
      
      const data = extractNumbers(text);
      if (data.distance > 0) return data;
      
  } catch (e) {
      console.error("Erro fatal na estimativa:", e);
  }

  throw new Error("Não foi possível calcular a rota automaticamente. Por favor, insira a distância manualmente.");
};
