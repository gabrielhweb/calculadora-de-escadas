// Cálculo das medidas/peso do volume de frete, compartilhado entre
// Tabela de Entregas, Lista de Contratos e página de Contrato.

export const parseContractData = (dataStr: any, contractObj?: any) => {
    let parsed: any = null;
    try {
        parsed = typeof dataStr === 'string' ? JSON.parse(dataStr) : dataStr;
        let maxIters = 5;
        while (typeof parsed === 'string' && maxIters > 0) {
            try {
                parsed = JSON.parse(parsed);
            } catch (e) {
                break;
            }
            maxIters--;
        }
        maxIters = 5;
        while (parsed && parsed.contractData && maxIters > 0) {
            let inner = parsed.contractData;
            while (typeof inner === 'string') {
                try {
                    inner = JSON.parse(inner);
                } catch (e) {
                    break;
                }
            }
            parsed = inner;
            maxIters--;
        }
    } catch (e) {
        parsed = null;
    }

    if (!parsed) parsed = {};

    // Dados históricos/retroativos conhecidos para contratos cadastrados manualmente ou migrados
    const KNOWN_CONTRACTS_DATA: Record<string, any> = {
        "fabio chalita m a samra": { steps: 12, structureSteps: 11, stepHeight: 23.77, treadDepth: 12.64, stairWidth: 60, totalHeight: 309, totalLength: 190, wallFixation: "right", treadMaterial: "wood", woodType: "muiracatiara", landings: [{ length: 40, width: 60, price: 1440, type: "articulated", direction: "right", isFlushWithSlab: false, frenchBrackets: 2, hasSideGuardrail: true }] },
        "fabio chalita": { steps: 12, structureSteps: 11, stepHeight: 23.77, treadDepth: 12.64, stairWidth: 60, totalHeight: 309, totalLength: 190, wallFixation: "right", treadMaterial: "wood", woodType: "muiracatiara", landings: [{ length: 40, width: 60, price: 1440, type: "articulated", direction: "right", isFlushWithSlab: false, frenchBrackets: 2, hasSideGuardrail: true }] },
        "mario dos reis filho": { steps: 11, stepHeight: 23.54, treadDepth: 20, stairWidth: 58, totalHeight: 283, totalLength: 225, wallFixation: "right", treadMaterial: "metal" },
        "diego ferreira santos": { steps: 13, stepHeight: 22.14, treadDepth: 20, stairWidth: 60, totalHeight: 310, totalLength: 267, wallFixation: "left", treadMaterial: "metal" },
        "alexandre bergamo de oliveira": { steps: 13, stepHeight: 24.43, treadDepth: 16, stairWidth: 52, totalHeight: 342, totalLength: 215, wallFixation: "frontal", treadMaterial: "metal" },
        "andréa aragão ferreira rovina": { steps: 13, stepHeight: 23.00, treadDepth: 20, stairWidth: 70, totalHeight: 322, totalLength: 267, wallFixation: "right", treadMaterial: "wood", woodType: "muiracatiara" },
        "andrea aragao ferreira rovina": { steps: 13, stepHeight: 23.00, treadDepth: 20, stairWidth: 70, totalHeight: 322, totalLength: 267, wallFixation: "right", treadMaterial: "wood", woodType: "muiracatiara" },
        "joquebede dos santos coelho rodrigues": { steps: 11, stepHeight: 25.17, treadDepth: 13, stairWidth: 60, totalHeight: 302, totalLength: 149, wallFixation: "right", treadMaterial: "metal" },
        "ricardo torres soares": { steps: 13, stepHeight: 22.14, treadDepth: 20, stairWidth: 60, totalHeight: 310, totalLength: 337, wallFixation: "left", treadMaterial: "metal", landings: [{ type: "fixo", width: 70, length: 70, customHeight: "" }] },
        "felipe pagliarde cerezer": { steps: 7, stepHeight: 24.25, treadDepth: 20, stairWidth: 70, totalHeight: 194, totalLength: 144, wallFixation: "right", treadMaterial: "metal" },
        "felipe pagliarde": { steps: 7, stepHeight: 24.25, treadDepth: 20, stairWidth: 70, totalHeight: 194, totalLength: 144, wallFixation: "right", treadMaterial: "metal" },
        "márcia campos nogueira": { steps: 13, stepHeight: 20.93, treadDepth: 20, stairWidth: 60, totalHeight: 293, totalLength: 267, wallFixation: "left", treadMaterial: "metal" },
        "marcia campos nogueira": { steps: 13, stepHeight: 20.93, treadDepth: 20, stairWidth: 60, totalHeight: 293, totalLength: 267, wallFixation: "left", treadMaterial: "metal" },
        "maria helena jara guastamacchia": { steps: 13, structureSteps: 13, stepHeight: 19.57, treadDepth: 20, stairWidth: 70, totalHeight: 274, totalLength: 267, wallFixation: "left", treadMaterial: "metal", customAddress: "Rua das Gilias, 389 - Vila Bela, São Paulo - SP, 03201-070", location: "Vila Bela - São Paulo/SP" },
        "maria helena": { steps: 13, structureSteps: 13, stepHeight: 19.57, treadDepth: 20, stairWidth: 70, totalHeight: 274, totalLength: 267, wallFixation: "left", treadMaterial: "metal", customAddress: "Rua das Gilias, 389 - Vila Bela, São Paulo - SP, 03201-070", location: "Vila Bela - São Paulo/SP" },

    };

    const clientKey = (contractObj?.clientName || '').toLowerCase().trim();
    if (KNOWN_CONTRACTS_DATA[clientKey]) {
        const known = KNOWN_CONTRACTS_DATA[clientKey];
        Object.keys(known).forEach(k => {
            if (parsed[k] === undefined || parsed[k] === null || parsed[k] === '') {
                parsed[k] = known[k];
            }
        });
    }

    // Injeta campos diretos do objeto do contrato se existirem
    if (contractObj) {
        if (contractObj.treadDepth && !parsed.treadDepth && !parsed.pisante) parsed.treadDepth = contractObj.treadDepth;
        if (contractObj.stepHeight && !parsed.stepHeight && !parsed.altura) parsed.stepHeight = contractObj.stepHeight;
        if (contractObj.stairWidth && !parsed.stairWidth && !parsed.largura) parsed.stairWidth = contractObj.stairWidth;
        if (contractObj.totalSteps && !parsed.steps && !parsed.degraus) parsed.steps = contractObj.totalSteps;
        if (contractObj.wallFixation && !parsed.wallFixation) parsed.wallFixation = contractObj.wallFixation;
    }

    return parsed;
};

export const getProp = (parsed: any, key: string) => {
    if (!parsed) return undefined;
    if (parsed?.selectedOption && parsed.selectedOption[key] !== undefined && parsed.selectedOption[key] !== '') return parsed.selectedOption[key];
    if (parsed?.inputData && parsed.inputData[key] !== undefined && parsed.inputData[key] !== '') return parsed.inputData[key];
    if (parsed && parsed[key] !== undefined && parsed[key] !== '') return parsed[key];
    if (parsed?.userData && parsed.userData[key] !== undefined && parsed.userData[key] !== '') return parsed.userData[key];

    const searchProp = (obj: any, target: string, depth = 0): any => {
        if (!obj || typeof obj !== 'object' || depth > 5) return undefined;
        if (target in obj && obj[target] !== undefined && obj[target] !== '') return obj[target];
        for (const k of Object.keys(obj)) {
            if (obj[k] && typeof obj[k] === 'object') {
                const res = searchProp(obj[k], target, depth + 1);
                if (res !== undefined) return res;
            }
        }
        return undefined;
    };
    return searchProp(parsed, key);
};

export const extractNum = (val: any) => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
        const match = val.replace(',', '.').match(/[\d.]+/);
        return match ? Number(match[0]) : 0;
    }
    return 0;
};

export const isNoStairContract = (data: any, contractObj?: any): boolean => {
    if (!data && !contractObj) return false;
    
    // 1. Tipo de orçamento explicitamente sem escada
    const qType = getProp(data, 'quoteType') || contractObj?.quoteType;
    if (qType === 'landing' || qType === 'guardrail' || qType === 'gate') return true;
    
    // 2. Adendo ou independente
    if (getProp(data, 'isAdendo') === true || contractObj?.isAdendo === true) return true;
    if (getProp(data, 'isIndependent') === true || contractObj?.isIndependent === true) return true;
    
    // 3. Preços explícitos (escada zerada mas com adicionais ou valor total)
    // Só vale quando o preço da escada foi salvo de fato (contratos antigos não têm esse campo)
    const rawStairPrice = getProp(data, 'finalStairPrice') ?? getProp(data, 'stairPrice') ?? contractObj?.stairPrice;
    const finalStairPrice = extractNum(rawStairPrice);
    const finalLandingsPrice = extractNum(getProp(data, 'finalLandingsPrice') ?? getProp(data, 'landingsPrice') ?? contractObj?.landingsPrice);
    if (rawStairPrice !== undefined && finalStairPrice === 0 && (finalLandingsPrice > 0 || (contractObj?.totalValue || 0) > 0)) return true;

    // 4. Degraus zerados
    const structureSteps = getProp(data, 'structureSteps');
    if (structureSteps !== undefined && extractNum(structureSteps) === 0) return true;
    const totalSteps = getProp(data, 'totalSteps') ?? contractObj?.totalSteps;
    if (totalSteps !== undefined && extractNum(totalSteps) === 0) return true;

    // 5. Descrição do objeto indica patamar/adicionais sem escada
    const objDesc = (getProp(data, 'objectDescriptionText') || contractObj?.objectDescriptionText || '').toLowerCase();
    if (objDesc) {
        const mentionsLandingOrAdic = objDesc.includes('patamar') || objDesc.includes('guarda-corpo') || objDesc.includes('portão') || objDesc.includes('itens avulsos');
        const mentionsStair = objDesc.includes('escada articulada') || objDesc.includes('escada fixa');
        if (mentionsLandingOrAdic && !mentionsStair) return true;
    }

    // 6. Tem patamares e a observação de medidas não tem DEGRAUS nem PISADA
    // Mas se os dados do contrato tiverem degraus cadastrados, NUNCA é contrato sem escada!
    const hasStairData = (extractNum(getProp(data, 'steps') ?? getProp(data, 'desiredSteps') ?? getProp(data, 'totalSteps') ?? getProp(data, 'structureSteps') ?? getProp(data, 'degraus') ?? contractObj?.totalSteps) > 0);
    if (hasStairData) return false;

    const rawNotes = contractObj?.measurementsNotes || '';
    const notesWithoutWeight = rawNotes
        .replace(/PESO\s*(?:ESCADA|TOTAL|AÇO)?:\s*[\d,.]+\s*kg/gi, '')
        .replace(/CUSTO\s*(?:AÇO|TOTAL)?(?:\s*\(ESCADA\))?:\s*(?:R\$\s*)?[\d,.]+/gi, '')
        .trim();
    const hasStairNotes = /DEGRAUS:\s*[1-9]/i.test(notesWithoutWeight) || /PISADA:\s*[1-9]/i.test(notesWithoutWeight);
    
    const landings = getProp(data, 'landings') || getProp(data, 'patamares') || [];
    const hasRealLandings = Array.isArray(landings) && landings.some((l: any) => !l.isAccessoriesOnly);

    if (hasRealLandings && !hasStairNotes && !hasStairData) {
        return true;
    }

    return false;
};

export const getFreightDimensions = (parsedData: any, contractObj?: any, measurementsText?: string) => {
    if (!parsedData && !contractObj && !measurementsText) return '-';
    
    const noStair = isNoStairContract(parsedData, contractObj);

    let numSteps = noStair ? 0 : extractNum(getProp(parsedData, 'steps') ?? getProp(parsedData, 'desiredSteps') ?? getProp(parsedData, 'totalSteps') ?? getProp(parsedData, 'structureSteps') ?? getProp(parsedData, 'degraus') ?? contractObj?.totalSteps);
    let treadDepthCm = noStair ? 0 : extractNum(getProp(parsedData, 'treadDepth') ?? getProp(parsedData, 'treadDepthCm') ?? getProp(parsedData, 'tread') ?? getProp(parsedData, 'pisante') ?? getProp(parsedData, 'pisada') ?? contractObj?.treadDepth);
    let stepHeightCm = noStair ? 0 : extractNum(getProp(parsedData, 'stepHeight') ?? getProp(parsedData, 'stepHeightCm') ?? getProp(parsedData, 'height') ?? getProp(parsedData, 'altura') ?? contractObj?.stepHeight);
    let widthCm = noStair ? 0 : extractNum(getProp(parsedData, 'stairWidth') ?? getProp(parsedData, 'widthCm') ?? getProp(parsedData, 'width') ?? getProp(parsedData, 'largura') ?? contractObj?.stairWidth);

    const sourceText = measurementsText || contractObj?.measurementsNotes || '';
    if (!noStair && (!numSteps || !treadDepthCm || !stepHeightCm) && sourceText) {
        if (!numSteps) {
            const matchDeg = sourceText.match(/(?:DEGRAUS:?\s*(\d+)|(\d+)\s*degraus)/i);
            if (matchDeg) numSteps = Number(matchDeg[1] || matchDeg[2]);
        }
        if (!treadDepthCm) {
            const matchPis = sourceText.match(/(?:PISADA:?\s*([\d,.]+)|PISANTE:?\s*([\d,.]+)|([\d,.]+)\s*cm\s*pisada)/i);
            if (matchPis) treadDepthCm = parseFloat((matchPis[1] || matchPis[2] || matchPis[3]).replace(',', '.'));
        }
        if (!stepHeightCm) {
            const matchAlt = sourceText.match(/(?:ALTURA:?\s*([\d,.]+)|([\d,.]+)\s*cm\s*altura)/i);
            if (matchAlt) stepHeightCm = parseFloat((matchAlt[1] || matchAlt[2]).replace(',', '.'));
        }
        if (!widthCm) {
            const matchLar = sourceText.match(/(?:LARGURA:?\s*([\d,.]+)|([\d,.]+)\s*cm\s*largura)/i);
            if (matchLar) widthCm = parseFloat((matchLar[1] || matchLar[2]).replace(',', '.'));
        }
    }

    if (!noStair && !stepHeightCm && numSteps > 0) {
        const totH = extractNum(getProp(parsedData, 'totalHeight') ?? getProp(parsedData, 'alturaTotal'));
        if (totH > 0) stepHeightCm = totH / numSteps;
    }

    if (!noStair && !widthCm && (numSteps > 0 || treadDepthCm > 0)) {
        widthCm = 60;
    }

    const thicknessM = 3.0 / 1000;
    const STEEL_DENSITY = 7850;

    let landingsAreaM2 = 0;
    const landings = getProp(parsedData, 'landings') || getProp(parsedData, 'patamares');
    if (landings && landings.length > 0) {
        landings.forEach((l: any) => {
            if (l.isAccessoriesOnly || (Number(l.length) || 0) <= 0 || (Number(l.width) || 0) <= 0) return;
            const lLen = (Number(l.length) || 0) + 20;
            const lWid = (Number(l.width) || 0) + 20;
            landingsAreaM2 += (lLen * lWid) / 10000;
        });
    }
    const landingsWeight = landingsAreaM2 * (3.34 / 1000) * STEEL_DENSITY;

    if (noStair || !numSteps || !treadDepthCm || !stepHeightCm) {
        if (landingsWeight > 0 && landings && landings.length > 0) {
            const realLandings = landings.filter((l: any) => !l.isAccessoriesOnly && (Number(l.length) || 0) > 0);
            const maxL = realLandings.length > 0 ? Math.max(...realLandings.map((l: any) => (Number(l.length) || 0) / 100)) : 1;
            const maxW = realLandings.length > 0 ? Math.max(...realLandings.map((l: any) => (Number(l.width) || 0) / 100)) : 1;
            return `COMPRIMENTO: ${(maxL || 1).toFixed(2)}m\nLARGURA: ${(maxW || 1).toFixed(2)}m\nALTURA: 0.15m\nPESO (PATAMAR): ${landingsWeight.toFixed(1)}kg\nPESO TOTAL: ${landingsWeight.toFixed(1)}kg`;
        }
        if (noStair) return '-';
        // Sem nenhuma medida cadastrada: não inventa medidas
        if (!numSteps && !treadDepthCm && !stepHeightCm) return '-';

        // Fallback para escadas com dados resumidos no contrato
        const fallbackSteps = numSteps || 14;
        const fallbackTread = treadDepthCm || 24;
        const fallbackHeight = stepHeightCm || 20;
        const fallbackEscadaWeight = fallbackSteps * 7.5;
        const totalKg = fallbackEscadaWeight + landingsWeight;
        return `COMPRIMENTO: 3.50m\nLARGURA: 0.70m\nALTURA: 0.08m\nPESO (ESCADA): ${fallbackEscadaWeight.toFixed(1)}kg\nPESO TOTAL: ${totalKg.toFixed(1)}kg`;
    }

    const optionalItems = getProp(parsedData, 'optionalItems');
    const maxHandrailHeightM = (optionalItems && optionalItems.some((i: any) => i.id === 'corrimao_aco')) ? 0.8 : 0;
    const pontasM = 0.20;
    
    const stepHypotenuseCm = Math.sqrt(Math.pow(treadDepthCm, 2) + Math.pow(stepHeightCm, 2));
    const blueLineCm = (treadDepthCm * stepHeightCm) / stepHypotenuseCm;
    const stringerWidthM = (blueLineCm + 16.5) / 100;
    
    const handrailCm = maxHandrailHeightM > 0 ? 80 : 0;
    const pacoteLarguraM = ((treadDepthCm + 1) + handrailCm + 16.5) / 100;
    const pacoteAlturaM = 0.08;

    const comprimentoMaximoM = (treadDepthCm * numSteps) / 100;
    const totalHeightM = (stepHeightCm * numSteps) / 100;
    const tamanhoViga = Math.sqrt(Math.pow(comprimentoMaximoM, 2) + Math.pow(totalHeightM, 2));
    const diagonalExata = tamanhoViga + maxHandrailHeightM + pontasM;

    // Weight
    const stepAreaM2 = ((treadDepthCm + 6) / 100) * (widthCm / 100);
    const stepsWeight = stepAreaM2 * thicknessM * numSteps * STEEL_DENSITY;
    const redLineCm = stepHypotenuseCm * numSteps;
    const stringerAreaM2 = (redLineCm / 100) * (stringerWidthM) * 2;
    const stringerWeight = stringerAreaM2 * thicknessM * STEEL_DENSITY;
    
    const escadaWeight = stepsWeight + stringerWeight;
    const totalWeightKg = escadaWeight + landingsWeight;

    let freightText = `COMPRIMENTO: ${diagonalExata.toFixed(2)}m\nLARGURA: ${pacoteLarguraM.toFixed(2)}m\nALTURA: ${pacoteAlturaM.toFixed(2)}m\nPESO (ESCADA): ${escadaWeight.toFixed(1)}kg`;
    if (landingsWeight > 0) {
        freightText += `\nPESO (PATAMAR): ${landingsWeight.toFixed(1)}kg`;
    }
    freightText += `\nPESO TOTAL: ${totalWeightKg.toFixed(1)}kg`;
    
    return freightText;
};
