
import { GoogleGenAI } from "@google/genai";

// Declaração para TypeScript entender o process.env injetado pelo Vite
declare var process: {
  env: {
    API_KEY: string;
    [key: string]: string | undefined;
  }
};

const getBasePrice = (width: number): number => {
  if (width >= 40 && width <= 50) return 410;
  if (width >= 51 && width <= 70) return 425;
  if (width >= 71 && width <= 80) return 440;
  if (width >= 81 && width <= 90) return 490;
  return 425; 
};

const getMultiplier = (depth: number): number => {
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

// --- GEMINI FUNCTION COM MAPS GROUNDING ---

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

export const getRouteInfoFromGemini = async (origin: string, destination: string): Promise<{ distance: number; tolls: number }> => {
  // 1. Diagnóstico da Chave
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey.length < 10 || apiKey.includes('YOUR_API_KEY')) {
      console.error("DIAGNÓSTICO: Chave ausente ou inválida. Valor atual:", apiKey);
      throw new Error(`ERRO DE CONFIGURAÇÃO: A chave de API não foi detectada pelo sistema. (Status da Chave: ${apiKey ? 'Inválida/Curta' : 'Ausente'})`);
  }

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey });
    
    // Tenta pegar localização para ajudar na precisão
    const userLocation = await getCurrentLocation();

    const config: any = {
      tools: [{ googleMaps: {} }],
    };
    
    if (userLocation) {
        config.toolConfig = {
            retrievalConfig: {
                latLng: {
                    latitude: userLocation.latitude,
                    longitude: userLocation.longitude,
                }
            }
        };
    }

    // Prompt reforçado
    const prompt = `Use a ferramenta Google Maps para calcular a rota de carro saindo do CEP "${origin}" para o CEP "${destination}" no Brasil.
    
    IMPORTANTE:
    1. Calcule a distância real de condução (driving distance).
    2. Estime o custo de pedágios.
    3. Retorne APENAS um JSON.
    
    Formato JSON:
    {
      "distancia": 123.5,
      "pedagios": 45.20
    }`;

    console.log("Iniciando requisição Gemini com Maps...");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: config,
    });

    console.log("Resposta bruta da IA:", response.text);

    const text = response.text || "{}";
    
    // Verifica se a IA respondeu que não consegue usar o Maps
    if (text.toLowerCase().includes("não consigo") || text.toLowerCase().includes("i cannot") || text.toLowerCase().includes("acesso ao mapa")) {
        throw new Error(`A IA informou que não tem acesso ao Maps. Verifique se a API Key tem o 'Google Maps' ativado no Google AI Studio. Resposta: ${text.substring(0, 50)}...`);
    }

    let data = { distancia: 0, pedagios: 0 };
    
    // Parser JSON robusto
    try {
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
            data = JSON.parse(jsonMatch[0]);
        } else {
             data = JSON.parse(cleanText);
        }
    } catch (e) {
        // Fallback Regex
        const distMatch = text.match(/"?distancia"?\s*:\s*"?([\d.]+)"?/);
        const tollsMatch = text.match(/"?pedagios"?\s*:\s*"?([\d.]+)"?/);
        
        if (distMatch) data.distancia = parseFloat(distMatch[1]);
        if (tollsMatch) data.pedagios = parseFloat(tollsMatch[1]);
    }

    const distance = Number(data.distancia) || 0;
    const tolls = Number(data.pedagios) || 0;
    
    if (distance === 0) {
        throw new Error(`O Google Maps retornou 0km. (Resposta da IA: ${text.substring(0, 100)}...)`);
    }

    return { distance, tolls };

  } catch (error: any) {
    console.error('Erro Detalhado:', error);
    // Repassa a mensagem exata para aparecer na tela vermelha do usuário
    throw new Error(error.message || 'Erro desconhecido na API.');
  }
};
