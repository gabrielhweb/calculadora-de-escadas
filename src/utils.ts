
import { GoogleGenAI } from "@google/genai";

// Fix for TS2580: Cannot find name 'process'
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
  return 425; // Default price if out of range
};

const getMultiplier = (depth: number): number => {
  if (depth <= 20) return 1.0;
  if (depth >= 21 && depth <= 25) return 1.05;
  if (depth >= 26 && depth <= 30) return 1.10;
  if (depth > 30) return 1.20;
  return 1.0; // Default multiplier
};

export const calculateTotalPrice = (width: number, depth: number, steps: number): number => {
  const basePrice = getBasePrice(width);
  const multiplier = getMultiplier(depth);
  if (steps <= 0) return 0;
  return basePrice * multiplier * steps;
};

/**
 * Função necessária para o módulo de Patamar
 */
export const calculateLandingPrice = (width: number, length: number): number => {
  if (length <= 0) return 0;
  const basePrice = getBasePrice(width);
  const sizeFactor = length / 25; 
  return basePrice * sizeFactor * 1.3; 
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
  // Verificação explícita da chave
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey.includes('YOUR_API_KEY')) {
      console.error("ERRO CRÍTICO: API_KEY não encontrada ou inválida.", apiKey);
      throw new Error('Configuração de API pendente no servidor (Vercel).');
  }

  try {
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

    const prompt = `Calcule a rota de carro entre a origem "${origin}" e o destino "${destination}".
    Use a rota padrão/recomendada pelo Google Maps.
    
    IMPORTANTE: Retorne APENAS um objeto JSON válido, sem markdown e sem formatação extra, exatamente assim:
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
    let data = { distancia: 0, pedagios: 0 };
    
    try {
        // Tenta limpar o texto caso venha com markdown (```json ... ```)
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        // Tenta encontrar o JSON mesmo se houver texto em volta
        const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
            data = JSON.parse(jsonMatch[0]);
        } else {
            data = JSON.parse(cleanText);
        }
    } catch (e) {
        // Fallback: Se o JSON falhar, tenta extrair números via Regex
        console.warn("Falha no parsing JSON, tentando regex manual", e);
        
        // Procura por "distancia": 123 ou "distancia": "123"
        const distMatch = text.match(/distancia"?\s*:\s*"?([\d.]+)"?/);
        // Procura por "pedagios": 123 ou "pedagios": "123"
        const tollsMatch = text.match(/pedagios"?\s*:\s*"?([\d.]+)"?/);
        
        if (distMatch) data.distancia = parseFloat(distMatch[1]);
        if (tollsMatch) data.pedagios = parseFloat(tollsMatch[1]);
        
        if (!distMatch && !tollsMatch) {
            console.error("Não foi possível extrair dados da resposta da IA:", text);
            // Se falhou em extrair, lança erro para a UI mostrar
            throw new Error("A IA não retornou dados legíveis. Tente novamente.");
        }
    }

    const distance = Number(data.distancia) || 0;
    const tolls = Number(data.pedagios) || 0;
    
    if (distance === 0) {
        throw new Error("O Google Maps não encontrou rota entre estes CEPs.");
    }

    return { distance, tolls };

  } catch (error: any) {
    console.error('Erro Logística Gemini:', error);
    // Repassa o erro exato para aparecer na tela vermelha
    throw new Error(error.message || 'Erro ao conectar com Google Gemini.');
  }
};
