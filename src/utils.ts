



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



export const getRouteInfoFromGemini = async (origin: string, destination: string): Promise<{ distance: number; tolls: number }> => {
  let userLoc = null;
  try {
      userLoc = await getCurrentLocation();
  } catch(e) { 
      console.warn("Localização ignorada", e); 
  }

  const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({
          origin,
          destination,
          latitude: userLoc?.latitude,
          longitude: userLoc?.longitude
      })
  });

  if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Não foi possível traçar a rota automaticamente. Por favor, insira a distância manualmente.");
  }

  const data = await response.json();
  return data;
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
        if (inputData.wallFixation === 'frontal') {
            fixationText = "Fixação FRONTAL";
        } else {
            fixationText = inputData.wallFixation === 'left' 
                ? "Fixação na Parede ESQUERDA" 
                : "Fixação na Parede DIREITA";
        }
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
    
    let materialText = 'de Metal';
    if (inputData.treadMaterial === 'wood') {
        if (inputData.woodType === 'garapeira') {
            materialText = 'de Madeira (Garapeira)';
        } else if (inputData.woodType === 'muiracatiara') {
            materialText = 'de Madeira (Muiracatiara)';
        } else {
            materialText = 'de Madeira (Garapeira ou Muiracatiara)';
        }
    } else if (inputData.treadMaterial === 'chapa_xadrez') {
        materialText = 'de Chapa Xadrez';
    } else if (inputData.treadMaterial === 'chapa_vazada') {
        materialText = 'de Chapa Vazada';
    }
    
    const text2 = `-Com ${opt.structureSteps} degraus articulados com dimensões de ${stepH} centímetros de altura e pisante ${materialText} de ${tread} centímetros${damperDesc}.`;
    
    let fullText = `${text1}\n${text2}`;

    if (inputData.referenceDoor && inputData.referenceDoor.isActive) {
        fullText += "\nNOTA: Portas/Janelas exibidas nos desenhos técnicos são apenas ilustrativas para referência de espaço. NÃO FABRICAMOS OU FORNECEMOS PORTAS.";
    }

    return fullText;
};