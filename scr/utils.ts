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

// --- NEW GEMINI FUNCTION ---

/**
 * Gets the user's current geographical coordinates.
 * @returns A promise that resolves to an object with latitude and longitude, or null if permission is denied.
 */
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
        // User denied permission or an error occurred
        resolve(null);
      },
      {
        timeout: 5000 // 5 second timeout
      }
    );
  });
};


/**
 * Calculates driving distance and toll costs between two locations using Gemini with Google Maps Grounding.
 * @param origin The starting point (CEP or address).
 * @param destination The ending point (CEP or address).
 * @returns A promise that resolves to an object with distance in km and toll costs in BRL.
 */
export const getRouteInfoFromGemini = async (origin: string, destination: string): Promise<{ distance: number; tolls: number }> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

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

    const prompt = `Calcule a rota de carro entre a origem "${origin}" e o destino "${destination}". Forneça a distância total em quilômetros e o custo total de pedágio em BRL. Sua resposta deve ser um objeto JSON contendo apenas as chaves "distancia" e "pedagios". Exemplo: {"distancia": 123.4, "pedagios": 56.7}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: config,
    });

    const text = response.text.trim();
    // Find the JSON part of the response, even if it includes markdown backticks
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.error("Gemini response did not contain a valid JSON object:", text);
      throw new Error('Não foi possível extrair os dados de rota da resposta. O formato retornado pela IA é inesperado.');
    }
    
    const jsonString = jsonMatch[0];
    const data = JSON.parse(jsonString);

    const distance = data.distancia;
    const tolls = data.pedagios;

    if (typeof distance !== 'number' || typeof tolls !== 'number') {
      console.error("Parsed JSON does not have the expected numeric properties 'distancia' and 'pedagios':", data);
      throw new Error('A resposta da IA não continha os dados de rota no formato numérico esperado.');
    }
    
    return { distance, tolls };

  } catch (error) {
    console.error("Error fetching route info from Gemini:", error);
    if (error instanceof SyntaxError) {
        throw new Error('Erro ao processar a resposta da IA. O JSON retornado é inválido.');
    }
    if (error instanceof Error) {
        if (error.message.includes('API key')) {
             throw new Error('A chave de API não é válida ou está faltando. Verifique a configuração.');
        }
        throw new Error(`Erro ao calcular a rota: ${error.message}`);
    }
    throw new Error('Falha na comunicação com a IA para calcular a rota.');
  }
};