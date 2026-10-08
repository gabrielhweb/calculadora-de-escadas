



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
    if (inputData.quoteType === 'guardrail') {
        const materialText = inputData.standaloneGuardrails?.[0]?.material === 'glass' ? 'Vidro' : 'Aço/Ferro';
        const lengthCm = inputData.standaloneGuardrails?.reduce((sum: number, g: any) => sum + (Number(g.length) || 0), 0) || 0;
        const lengthM = (lengthCm / 100).toFixed(2).replace('.', ',');
        const qtty = inputData.standaloneGuardrails?.length || 1;
        return `Orçamento para fornecimento de Guarda-Corpos e/ou Portões sob medida.\n- Quantidade de Peças/Sessões: ${qtty} unidades\n- Comprimento Total Projetado: ${lengthM} metros lineares\n- Material: Estrutura em aço carbono com fechamento em ${materialText}.`;
    }
    
    if (inputData.quoteType === 'landing') {
        const materialText = inputData.treadMaterial === 'wood' ? (inputData.woodType || 'Madeira') : 'Aço/Ferro';
        const qtty = inputData.landings?.length || 1;
        
        let desc = `Patamar(es) sob medida em aço carbono com corte à laser.\n- Quantidade de Patamares: ${qtty} unidades\n`;
        inputData.landings?.forEach((landing: any, idx: number) => {
            desc += `- Patamar ${idx + 1}: ${landing.width}cm de largura x ${landing.length}cm de comprimento.\n`;
        });
        desc += `- Material dos Pisantes: ${materialText}.`;
        return desc;
    }

    if (inputData.isAdendo) {
        let desc = "Itens avulsos solicitados:\n";
        if (inputData.landings && inputData.landings.length > 0) {
            const hasOnlyAccessories = inputData.landings.every((l: any) => l.isAccessoriesOnly);
            if (hasOnlyAccessories) {
                const hasGates = inputData.landings.some((l: any) => l.hasGate);
                const hasGuardrails = inputData.landings.some((l: any) => l.hasGuardrail && !l.hasGate);
                if (hasGates && hasGuardrails) {
                    desc = "Orçamento de Guarda-corpos e Portões avulsos.\n";
                } else if (hasGates) {
                    desc = "Orçamento de Portões avulsos.\n";
                } else {
                    desc = "Orçamento de Guarda-corpos avulsos.\n";
                }
            } else {
                inputData.landings.forEach((landing: any) => {
                    if (!landing.isAccessoriesOnly) {
                        desc += `- Patamar Auxiliar (${landing.width}x${landing.length}cm) com base em aço carbono.\n`;
                        if (landing.hasGate) desc += `  + Inclui Portãozinho ${landing.gateLength}x${landing.gateHeight}cm.\n`;
                        if (landing.hasGuardrail) desc += `  + Inclui Guarda-Corpo (${landing.guardrailFormat || 'normal'}).\n`;
                    }
                });
            }
        }
        return desc.trim();
    }
    
    let descriptionTitle = inputData.quoteType === 'landing' ? "Patamar sob medida em aço carbono" : "Escada articulada lateral em aço carbono";
    let hrHeight = inputData.handrailHeight || 80;
    let handrailDesc = inputData.quoteType === 'landing' ? "" : `e com corrimão de ${hrHeight} centímetros`;
    let damperDesc = inputData.quoteType === 'landing' ? "" : ` com ${inputData.dampers} amortecedores de alívio`;

    let fixationText = "";
    if (inputData.isFixedStair) {
        descriptionTitle = "Escada fixa em aço carbono";
        fixationText = "";
        damperDesc = "";
    } else if (inputData.stairGeometry === 'hide') {
        fixationText = ""; 
    } else if (inputData.stairGeometry && inputData.stairGeometry.includes('Fixação')) {
        fixationText = inputData.stairGeometry.toLowerCase().replace('fixação', 'fixação'); 
    } else {
        if (inputData.wallFixation === 'frontal') {
            fixationText = "fixação FRONTAL";
        } else {
            fixationText = inputData.wallFixation === 'left' 
                ? "fixação na parede ESQUERDA" 
                : "fixação na parede DIREITA";
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
        handrailDesc = `e com corrimão articulado ${sideText} de ${hrHeight} centímetros`;
    }

    const alturaM = (inputData.totalHeight / 100).toFixed(2).replace('.', ',');
    const compM = (opt.totalLength / 100).toFixed(2).replace('.', ',');
    const widthCm = opt.stairWidth;
    
    let text1 = `${descriptionTitle} com corte à laser`;
    if (fixationText) text1 += `, ${fixationText}`;
    if (geometryText) text1 += `${geometryText}`;
    if (inputData.quoteType !== 'landing') {
        text1 += `, com medidas de: ${alturaM} metros de altura, ${compM} metros de comprimento, ${widthCm} centímetros de largura ${handrailDesc}.`;
    } else {
        text1 += `, com medidas de: ${alturaM} metros de altura, ${compM} metros de comprimento, ${widthCm} centímetros de largura.`;
    }

    const stepH = opt.stepHeight.toFixed(2).replace('.', ',');
    const tread = opt.treadDepth.toFixed(2).replace('.', ',');
    
    let materialText = 'de metal';
    if (inputData.treadMaterial === 'wood') {
        if (inputData.woodType === 'garapeira') {
            materialText = 'de madeira (Garapeira)';
        } else if (inputData.woodType === 'muiracatiara') {
            materialText = 'de madeira (Muiracatiara)';
        } else {
            materialText = 'de madeira (Garapeira ou Muiracatiara)';
        }
    } else if (inputData.treadMaterial === 'chapa_xadrez') {
        materialText = 'de chapa xadrez';
    } else if (inputData.treadMaterial === 'chapa_vazada') {
        materialText = 'de chapa vazada';
    }
    
    const degrausLabel = inputData.isFixedStair ? 'degraus fixos' : 'degraus articulados';
    const text2 = `-Com ${opt.structureSteps} ${degrausLabel} com dimensões de ${stepH} centímetros de altura e pisante ${materialText} de ${tread} centímetros${damperDesc}.`;
    
    let fullText = `${text1}\n\n${text2}`;

    return fullText;
};