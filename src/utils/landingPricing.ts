import { LandingInfo } from '../types';

const num = (v: any, fallback: number) => {
    if (v === undefined || v === null || v === '') return fallback;
    const n = Number(v);
    return isNaN(n) ? fallback : n;
};

// Metragem de tubo de um vão de guarda-corpo/portão (barras verticais + 2 horizontais)
const calcSegmentMeters = (len: number, height: number, barsOverride?: number) => {
    if (!len) return 0;
    let innerL = len - 6;
    if (innerL < 0) innerL = 0;
    const baseGaps = Math.max(1, Math.round(innerL / 15));
    let totalBars = barsOverride !== undefined ? barsOverride : (baseGaps + 1);
    totalBars = Math.max(2, totalBars);
    return totalBars * (height / 100) + 2 * (len / 100);
};

export const getFrenchBracketsCount = (l: LandingInfo) => {
    if (!l.hasFrenchBrackets) return 0;
    return num(l.frenchBrackets, 2);
};

export const getFrenchBracketsPrice = (l: LandingInfo) => {
    return getFrenchBracketsCount(l) * num(l.frenchBracketPrice, 140);
};

export const getGuardrailPrice = (l: LandingInfo) => {
    if (!l.hasGuardrail) return 0;
    const gFormat = l.guardrailFormat || 'normal';
    const numSides = gFormat === 'U' ? 3 : gFormat === 'L' ? 2 : 1;
    const gHeight = num(l.guardrailHeight, 90);
    const gPricePerMeter = num(l.guardrailPricePerMeter, 50);

    const p1 = l.guardrailPriceOverride !== undefined ? num(l.guardrailPriceOverride, 0) : Math.round(calcSegmentMeters(num(l.guardrailLength, 0), gHeight, l.guardrailBarsOverride) * gPricePerMeter);
    const p2 = numSides >= 2 ? (l.guardrailPriceOverride2 !== undefined ? num(l.guardrailPriceOverride2, 0) : Math.round(calcSegmentMeters(num(l.guardrailLength2, 0), gHeight, l.guardrailBarsOverride2) * gPricePerMeter)) : 0;
    const p3 = numSides >= 3 ? (l.guardrailPriceOverride3 !== undefined ? num(l.guardrailPriceOverride3, 0) : Math.round(calcSegmentMeters(num(l.guardrailLength3, 0), gHeight, l.guardrailBarsOverride3) * gPricePerMeter)) : 0;
    return p1 + p2 + p3;
};

export const getGatePrice = (l: LandingInfo) => {
    if (!l.hasGate) return 0;
    const override = (l as any).gatePriceOverride;
    if (override !== undefined && override !== null && override !== '') return num(override, 0);
    const gateLength = num(l.gateLength, 100);
    const gateHeight = num(l.gateHeight, 90);
    const gatePricePerMeter = num(l.gatePricePerMeter, 50);
    return Math.round(calcSegmentMeters(gateLength, gateHeight, l.gateBarsOverride) * gatePricePerMeter);
};

// Soma de tudo que vai "em cima" do patamar (mão francesa + guarda-corpo + portão)
export const getLandingExtrasPrice = (l: LandingInfo) => {
    return getFrenchBracketsPrice(l) + getGuardrailPrice(l) + getGatePrice(l);
};

// Preço só da chapa. Acessório avulso não tem chapa.
// Preço só da chapa. Acessório avulso não tem chapa.
export const getLandingBasePrice = (l: LandingInfo) => {
    if (l.isAccessoriesOnly) return 0;
    
    // Se o usuário digitou a chapa manualmente (e não está vazio), usa
    if (l.chapaPrice !== undefined && l.chapaPrice !== null && String(l.chapaPrice).trim() !== '') {
        return num(l.chapaPrice, 0);
    }
    
    // Caso contrário, calcula automaticamente: (Comp * Larg / 1000) * Preço Base
    const area = (num(l.length, 0) * num(l.width, 0)) / 1000;
    const computedChapa = Math.round(area * num(l.weightPerSqm, 29));
    
    // Fallback legado
    if (computedChapa === 0 && num(l.price, 0) > 0) return num(l.price, 0);
    
    return computedChapa;
};

// Preço final = chapa + extras. Sempre derivado, nunca depende de clicar em botão.
export const computeLandingPrice = (l: LandingInfo) => {
    return getLandingBasePrice(l) + getLandingExtrasPrice(l);
};

// Texto " + Guarda-Corpo + Portão + 2 Mãos Francesas" para propostas/contratos
export const describeLandingExtras = (l: LandingInfo) => {
    let txt = '';
    if (l.hasGuardrail) {
        const gFormat = l.guardrailFormat || 'normal';
        const formatTxt = gFormat === 'U' ? ' em U' : gFormat === 'L' ? ' em L' : '';
        txt += ` + Guarda-Corpo${formatTxt}`;
    }
    if (l.hasGate) txt += ' + Portão';
    const mf = getFrenchBracketsCount(l);
    if (mf > 0) txt += ` + ${mf} ${mf === 1 ? 'Mão Francesa' : 'Mãos Francesas'}`;
    return txt;
};

export const sumAllLandingsPrice = (landings: LandingInfo[] = []) => landings.reduce((acc, l) => acc + (Number(l?.price) || 0), 0);
export const sumRealLandingsPrice = (landings: LandingInfo[] = []) => landings.reduce((acc, l) => acc + (l?.isAccessoriesOnly ? 0 : (Number(l?.price) || 0)), 0);
export const sumAccessoriesPrice = (landings: LandingInfo[] = []) => landings.reduce((acc, l) => acc + (l?.isAccessoriesOnly ? (Number(l?.price) || 0) : 0), 0);
