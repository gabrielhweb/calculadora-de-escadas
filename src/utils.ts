import { GoogleGenAI } from "@google/genai";

const getBasePrice = (width: number): number => {
  if (width >= 40 && width <= 50) return 410;
  if (width >= 51 && width <= 70) return 425;
  if (width >= 71 && width <= 80) return 440;
  if (width >= 81 && width <= 90) return 490;
  return 425; // Default price if out of range
};

const getMultiplier = (depth: number): number => {
  if (depth <= 20) return 1.0;
  if (depth >= 21 && depth <= 25) return 1.05;
  if (depth >= 26 && depth <= 30) return 1.10;
  return 1.0; // Default multiplier
};

export const calculateTotalPrice = (width: number, depth: number, steps: number): number => {
  const basePrice = getBasePrice(width);
  const multiplier = getMultiplier(depth);
  if (steps <= 0) return 0;
  return basePrice * multiplier * steps;
};

export const calculateFreightCost = (distance: number, fuelPrice: number, consumption: number): number => {
  if (distance <= 0 || fuelPrice <= 0 || consumption <= 0) return 0;
  // Calculate for round trip
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

// --- GEMINI FUNCTION ---

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
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey || apiKey.includes("SUA_CHAVE")) {
        throw new Error('Chave de API inválida ou não configurada no arquivo .env');
    }

    const ai = new GoogleGenAI({ apiKey: apiKey });
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

    // Prompt ajustado para Rota Recomendada
    const prompt = `Calcule a rota de carro entre a origem "${origin}" e o destino "${destination}".
    Use a rota padrão/recomendada pelo Google Maps (evite rotas excessivamente longas ou curtas demais).
    Retorne APENAS um JSON com este formato exato:
    {
      "distancia": (número em km, ex: 120.5),
      "pedagios": (custo total estimado em reais, ex: 45.20)
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: config,
    });

    const text = response.text || "{}";
    let data;
    try {
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
            data = JSON.parse(jsonMatch[0]);
        } else {
            data = JSON.parse(cleanText);
        }
    } catch (e) {
        throw new Error("Não foi possível extrair os dados de rota.");
    }

    const distance = Number(data.distancia) || 0;
    const tolls = Number(data.pedagios) || 0;
    
    return { distance, tolls };

  } catch (error) {
    if (error instanceof Error) {
        if (error.message.includes('API key')) {
             throw new Error('Erro de Configuração: Chave de API inválida.');
        }
        throw new Error(`Erro ao calcular a rota: ${error.message}`);
    }
    throw new Error('Falha na comunicação com a IA.');
  }
};