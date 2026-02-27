

import { GoogleGenAI } from "@google/genai";

// Declaration removed to avoid conflict with global types in vite-env.d.ts

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

// Função auxiliar aprimorada para extrair números de resposta (JSON ou Texto)
const extractNumbers = (text: string) => {
    let d = 0, t = 0;

    // 1. Tenta encontrar e parsear um bloco JSON explícito primeiro
    try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const jsonStr = jsonMatch[0];
            const json = JSON.parse(jsonStr);
            // Aceita variações de chaves
            d = Number(json.distancia || json.distance || json.km || 0);
            t = Number(json.pedagios || json.tolls || json.pedagio || json.cost || 0);
            
            if (!isNaN(d) && d > 0) return { distance: d, tolls: t };
        }
    } catch (e) {
        // Falha silenciosa no JSON, tenta regex
    }

    // 2. Fallback via Regex se o JSON falhar ou não existir
    const distMatch = text.match(/dist[a-zâ-ã]*\s*[:=]?\s*([\d.,]+)\s*(km)?/i) || text.match(/([\d.,]+)\s*km/i);
    const tollMatch = text.match(/ped[a-zâ-ã]*\s*[:=]?\s*(R\$)?\s*([\d.,]+)/i) || text.match(/pedagios?\s*[:=]?\s*([\d.,]+)/i);
    
    if (distMatch) d = parseFloat(distMatch[1].replace(',', '.'));
    if (tollMatch) t = parseFloat(tollMatch[2]?.replace(',', '.') || tollMatch[1]?.replace(',', '.') || '0');
    
    return { distance: d, tolls: t };
};

export const getRouteInfoFromGemini = async (origin: string, destination: string): Promise<{ distance: number; tolls: number }> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey.length < 10 || apiKey.includes('YOUR_API_KEY')) {
      throw new Error(`ERRO DE CONFIGURAÇÃO: Chave de API inválida.`);
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });

  // TENTATIVA 1: FERRAMENTA GOOGLE MAPS (Dados Reais + Lógica Waze)
  try {
      console.log("Tentativa 1: Buscando rota precisa (Base Google Maps/Waze)...");
      const configWithMaps: any = { tools: [{ googleMaps: {} }] };
      
      try {
          const userLoc = await getCurrentLocation();
          if (userLoc) {
              configWithMaps.toolConfig = { retrievalConfig: { latLng: { latitude: userLoc.latitude, longitude: userLoc.longitude } } };
          }
      } catch(e) { console.warn("Localização ignorada", e); }

      // Prompt instruindo a usar a lógica de "melhor rota" similar ao Waze
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
          if (data.distance > 0) return data;
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
      if (data.distance > 0) return data;
      
  } catch (e) {
      console.error("Erro fatal na estimativa:", e);
  }

  throw new Error("Não foi possível traçar a rota automaticamente. Por favor, insira a distância manualmente.");
};

export const generateProposalDescription = (inputData: any, opt: any): string => {
    let descriptionTitle = "Escada articulada lateral em aço carbono";
    let handrailDesc = "e com corrimão de 70 centímetros";
    let damperDesc = ` com ${inputData.dampers} amortecedores de alívio`;

    let fixationText = "";
    
    if (inputData.stairGeometry === 'hide') {
        fixationText = ""; 
    } else if (inputData.stairGeometry && inputData.stairGeometry.includes('Fixação')) {
        fixationText = inputData.stairGeometry; 
    } else {
        fixationText = inputData.stairDirection === 'mirrored' 
            ? "Fixação do Lado ESQUERDO" 
            : "Fixação do Lado DIREITO";
    }

    const geometryText = (inputData.stairGeometry && !inputData.stairGeometry.includes('Fixação') && inputData.stairGeometry !== 'hide') 
        ? `, modelo ${inputData.stairGeometry}` 
        : "";

    if (inputData.hasWheels) {
        descriptionTitle = "Escada articulada com rodinhas em aço carbono";
        damperDesc = ""; 
        
        const sideMap: Record<string, string> = { 
            left: 'apenas no lado esquerdo', 
            right: 'apenas no lado direito', 
            both: 'nos dois lados' 
        };
        const sideText = sideMap[inputData.handrailSide || 'both'] || 'nos dois lados';
        handrailDesc = `e com corrimão articulado ${sideText}`;
    }

    const alturaM = (inputData.totalHeight / 100).toFixed(2).replace('.', ',');
    const compM = (opt.totalLength / 100).toFixed(2).replace('.', ',');
    const widthCm = opt.stairWidth;
    
    let text1 = `${descriptionTitle} com corte à laser`;
    if (fixationText) text1 += `, ${fixationText}`;
    if (geometryText) text1 += `${geometryText}`;
    text1 += `, com medidas de: ${alturaM} metros de altura, ${compM} metros de comprimento, ${widthCm} centímetros de largura ${handrailDesc}.`;

    const stepH = opt.stepHeight.toFixed(2).replace('.', ',');
    const tread = opt.treadDepth.toFixed(2).replace('.', ',');
    
    const materialText = inputData.treadMaterial === 'wood' ? 'de Madeira' : 'de Metal';
    
    const text2 = `-Com ${opt.structureSteps} degraus articulados com dimensões de ${stepH} centímetros de altura e pisante ${materialText} de ${tread} centímetros${damperDesc}.`;
    
    let fullText = `${text1}\n${text2}`;

    if (inputData.referenceDoor && inputData.referenceDoor.isActive) {
        fullText += "\nNOTA: Portas/Janelas exibidas nos desenhos técnicos são apenas ilustrativas para referência de espaço. NÃO FABRICAMOS OU FORNECEMOS PORTAS.";
    }

    return fullText;
};