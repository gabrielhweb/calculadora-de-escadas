import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../components/AuthProvider';
import { SavedContract } from '../types';
import { formatCurrencyBRL } from '../utils';
import { startOfWeek, endOfWeek, isBefore, isWithinInterval, parseISO, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { format as formatTZ } from 'date-fns-tz';
import { parseContractData, getProp, extractNum, isNoStairContract } from '../utils/freightDimensions';
import { resolveFreightInfo, buildFreightQuoteText, getInvoiceValue, copyTextToClipboard, MISSING_INFO } from '../utils/freightQuoteText';
import { resolveClientInfo, normalizeName } from '../utils/clientInfo';
import PageTitle from '../components/PageTitle';

export const DeliveriesTable: React.FC = () => {
    const [contracts, setContracts] = useState<SavedContract[]>([]);
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [queueItems, setQueueItems] = useState<any[]>([]);
    const [savedQuotes, setSavedQuotes] = useState<any[]>([]);
    const [showValues, setShowValues] = useState(true);

    // Orçamentos salvos: usados para achar CPF/CEP/endereço de contratos antigos
    useEffect(() => {
        if (!user) return;
        return onSnapshot(collection(db, 'saved_quotes'), (snap) => {
            const arr: any[] = [];
            snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
            setSavedQuotes(arr);
        });
    }, [user]);

    useEffect(() => {
        if (!user) {
            setContracts([]);
            setLoading(false);
            return;
        }

        const q = query(collection(db, 'contracts'), where('status', '==', 'producao'));
        const q2 = query(collection(db, 'production_queue'));
        const unsub2 = onSnapshot(q2, (snap) => {
            const arr: any[] = [];
            snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
            setQueueItems(arr);
        });

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedContracts: SavedContract[] = [];
            snapshot.forEach((d) => {
                loadedContracts.push({ id: d.id, ...d.data() } as SavedContract);
            });
            // Ordenar pela data de entrega, depois pela data de criação (mais antigos primeiro)
            loadedContracts.sort((a, b) => {
                if (a.deliveryDate && !b.deliveryDate) return -1; // Com data vai pro topo
                if (!a.deliveryDate && b.deliveryDate) return 1;  // Sem data vai pro final
                if (a.deliveryDate && b.deliveryDate) {
                    return a.deliveryDate.localeCompare(b.deliveryDate); // Mais próximos primeiro
                }
                const getTime = (date: any) => {
                    if (!date) return 0;
                    if (typeof date.toDate === 'function') return date.toDate().getTime();
                    return new Date(date).getTime() || 0;
                };
                return getTime(a.createdAt) - getTime(b.createdAt); // Mais antigos primeiro
            });
            setContracts(loadedContracts);
            setLoading(false);
        }, (error) => {
            console.error('Firestore Error:', error);
            setLoading(false);
        });

        return () => { unsubscribe(); unsub2(); };
    }, [user]);

    const handlePrint = () => {
        window.print();
    };


    const getFullAddress = (userData: any) => {
        if (!userData) return '';
        if (userData.address && !userData.street) return userData.address;
        const parts = [
            userData.street,
            userData.number,
            userData.neighborhood,
            userData.city,
            userData.state ? `- ${userData.state}` : '',
            userData.zip ? `CEP: ${userData.zip}` : ''
        ].filter(Boolean);
        return parts.join(', ');
    };


    const translateSide = (s: string) => {
        if (!s || typeof s !== 'string') return '';
        return s
            .replace(/\bleft\b/gi, 'Esquerda')
            .replace(/\bright\b/gi, 'Direita')
            .replace(/\bboth\b/gi, 'Ambos')
            .replace(/\bfrontal\b/gi, 'Frente')
            .replace(/\bfront\b/gi, 'Frente')
            .replace(/\bback\b/gi, 'Atrás')
            .replace(/\brear\b/gi, 'Atrás')
            .replace(/\bstart\b/gi, 'Início')
            .replace(/\bend\b/gi, 'Fim');
    };

    const cleanAndTranslateMeasurements = (text: string): string => {
        if (!text || typeof text !== 'string') return '';
        let cleaned = text;

        // Tradução de termos em inglês
        cleaned = cleaned
            .replace(/FIXAÇÃO NA PAREDE:\s*LEFT/gi, 'FIXAÇÃO NA PAREDE: ESQUERDA')
            .replace(/FIXAÇÃO NA PAREDE:\s*RIGHT/gi, 'FIXAÇÃO NA PAREDE: DIREITA')
            .replace(/FIXAÇÃO NA PAREDE:\s*FRONTAL/gi, 'FIXAÇÃO NA PAREDE: FRONTAL')
            .replace(/\[Lado:\s*left\]/gi, 'Lado: Esquerda')
            .replace(/\[Lado:\s*right\]/gi, 'Lado: Direita')
            .replace(/\[Lado:\s*both\]/gi, 'Lado: Ambos')
            .replace(/\[Lado:\s*frontal\]/gi, 'Lado: Frente')
            .replace(/\[Lado:\s*front\]/gi, 'Lado: Frente')
            .replace(/\[Lado:\s*back\]/gi, 'Lado: Atrás')
            .replace(/\[Lado:\s*rear\]/gi, 'Lado: Atrás')
            .replace(/\(left\)/gi, '(Esquerda)')
            .replace(/\(right\)/gi, '(Direita)')
            .replace(/\(both\)/gi, '(Ambos)')
            .replace(/MATERIAL:\s*WOOD/gi, 'MATERIAL: MADEIRA')
            .replace(/MATERIAL:\s*METAL/gi, 'MATERIAL: METAL')
            .replace(/MATERIAL:\s*STEEL/gi, 'MATERIAL: METAL')
            .replace(/MATERIAL:\s*GLASS/gi, 'MATERIAL: VIDRO');

        // Limpeza de poluição visual (colchetes, setas, base -> comprimento)
        cleaned = cleaned
            .replace(/\[\s*Lado:\s*([^\]]+)\]/gi, 'Lado: $1')
            .replace(/\[\s*ACESSÓRIO AVULSO\s*\]/gi, 'ACESSÓRIO AVULSO')
            .replace(/\[\s*EXTRAS CADASTRADOS\s*\]/gi, 'EXTRAS CADASTRADOS:')
            .replace(/\[\s*PATAMAR\s*(\d+)\s*-\s*([^\]]+)\]/gi, 'PATAMAR $1 ($2)')
            .replace(/Base:\s*([\d,.]+\s*cm)\s*\|\s*Altura:\s*([\d,.]+\s*cm)/gi, 'Comprimento: $1\nAltura: $2')
            .replace(/Base:\s*([\d,.]+\s*cm)/gi, 'Comprimento: $1')
            .replace(/>>\s*/g, '');

        // Remover repetição de informações de portão embutidas no guarda-corpo
        cleaned = cleaned.replace(/\s*\(\+\d+cm\s*Portão\)/gi, '');

        cleaned = cleaned.replace(/-{10,}\n?/g, '');
        cleaned = cleaned.replace(/\[\s*PESOS E MATERIAIS\s*\]\n?/gi, '');

        // Limpar quebras de linha excessivas
        cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

        return cleaned;
    };


    const getLandingsTotalSteel = (parsedData: any) => {
        let totalWeight = 0;
        let totalCost = 0;
        const landings = getProp(parsedData, 'landings') || getProp(parsedData, 'patamares');
        if (landings && landings.length > 0) {
            landings.forEach((l: any) => {
                if (l.isAccessoriesOnly || (Number(l.length) || 0) <= 0 || (Number(l.width) || 0) <= 0) return;
                let lLen = Number(l.length) || 0;
                let lWid = Number(l.width) || 0;
                if (lLen > 250) lLen = lLen / 10;
                if (lWid > 250) lWid = lWid / 10;
                lLen += 20;
                lWid += 20;
                const pArea = (lLen * lWid) / 10000;
                const pWeight = pArea * (3.34 / 1000) * 7850;
                const pCost = pWeight * 13.80;
                totalWeight += pWeight;
                totalCost += pCost;
            });
        }
        return { totalWeight, totalCost };
    };

    const getEscadaMeasurements = (parsedData: any, contractObj?: any) => {
        if (!parsedData && !contractObj) return '';
        if (isNoStairContract(parsedData, contractObj)) return '';

        const inputData = parsedData?.inputData || parsedData;
        const selectedOption = parsedData?.selectedOption || parsedData;
        
        let steps = getProp(parsedData, 'steps') ?? getProp(parsedData, 'desiredSteps') ?? getProp(parsedData, 'totalSteps') ?? getProp(parsedData, 'structureSteps') ?? getProp(parsedData, 'degraus');
        let tread = getProp(parsedData, 'treadDepth') ?? getProp(parsedData, 'treadDepthCm') ?? getProp(parsedData, 'tread') ?? getProp(parsedData, 'pisante') ?? getProp(parsedData, 'pisada');
        let height = getProp(parsedData, 'stepHeight') ?? getProp(parsedData, 'stepHeightCm') ?? getProp(parsedData, 'height') ?? getProp(parsedData, 'altura');
        let width = getProp(parsedData, 'stairWidth') ?? getProp(parsedData, 'widthCm') ?? getProp(parsedData, 'width') ?? getProp(parsedData, 'largura');

        if ((!steps || !tread || !height || !width) && contractObj?.measurementsNotes) {
            const mText = contractObj.measurementsNotes;
            if (!steps) {
                const matchDeg = mText.match(/DEGRAUS:\s*(\d+)/i);
                if (matchDeg) steps = Number(matchDeg[1]);
            }
            if (!tread) {
                const matchPis = mText.match(/PISADA:\s*([\d,.]+)/i);
                if (matchPis) tread = parseFloat(matchPis[1].replace(',', '.'));
            }
            if (!height) {
                const matchAlt = mText.match(/ALTURA:\s*([\d,.]+)/i);
                if (matchAlt) height = parseFloat(matchAlt[1].replace(',', '.'));
            }
            if (!width) {
                const matchLar = mText.match(/LARGURA:\s*([\d,.]+)/i);
                if (matchLar) width = parseFloat(matchLar[1].replace(',', '.'));
            }
        }

        let med = '';
        
        if (steps !== undefined || tread !== undefined) {
            const wallFix = getProp(parsedData, 'wallFixation') || (getProp(parsedData, 'cutStepType')?.includes('right') ? 'right' : (getProp(parsedData, 'cutStepType')?.includes('left') ? 'left' : undefined));
            if (wallFix) {
                const fixMap: Record<string, string> = {
                    left: 'ESQUERDA',
                    right: 'DIREITA',
                    frontal: 'FRONTAL'
                };
                const fix = fixMap[wallFix.toLowerCase()] || wallFix.toUpperCase();
                med += `FIXAÇÃO NA PAREDE: ${fix}\n`;
            }
            if (steps !== undefined) med += `DEGRAUS: ${steps}\n`;
            if (tread !== undefined) med += `PISADA: ${tread}cm\n`;
            if (height !== undefined) med += `ALTURA: ${height}cm\n`;
            if (width !== undefined) med += `LARGURA: ${width}cm\n`;

            const treadMaterial = getProp(parsedData, 'treadMaterial');
            const woodType = getProp(parsedData, 'woodType');
            const cutStepType = getProp(parsedData, 'cutStepType');

            if (treadMaterial === 'wood' || woodType) {
                let wood = 'MADEIRA';
                if (woodType === 'garapeira') wood += ' (GARAPEIRA)';
                else if (woodType === 'muiracatiara') wood += ' (MUIRACATIARA)';
                else if (woodType === 'ambas') wood += ' (GARAPEIRA/MUIRACATIARA)';
                med += `MATERIAL: ${wood}\n`;
            } else if (treadMaterial === 'chapa_xadrez') {
                med += `MATERIAL: CHAPA XADREZ\n`;
            } else if (treadMaterial === 'chapa_vazada' || cutStepType?.includes('hollow')) {
                med += `MATERIAL: CHAPA VAZADA\n`;
            } else if (treadMaterial === 'metal' || treadMaterial === 'steel') {
                med += `MATERIAL: METAL\n`;
            } else if (steps !== undefined) {
                med += `MATERIAL: AÇO CARBONO\n`;
            }

            if (getProp(parsedData, 'hasStairSideBar')) {
                med += `BARRA LATERAL: SIM\n`;
            }
            med += `\n`;
        }

        // --- CÁLCULO DE PESO E CUSTO DO AÇO DA ESCADA ---
        try {
            let treadNum = extractNum(tread);
            let heightNum = extractNum(height);
            let widthNum = extractNum(width);
            let stepsNum = extractNum(steps);
            const thicknessM = 3.0 / 1000;
            const STEEL_DENSITY = 7850;

            if (widthNum > 150) widthNum = widthNum / 10;
            if (treadNum > 60) treadNum = treadNum / 10;
            if (heightNum > 60) heightNum = heightNum / 10;

            let stepsWeight = 0;
            let stringerWeight = 0;
            
            if (treadNum > 0 && heightNum > 0 && widthNum > 0 && stepsNum > 0) {
                const stepAreaM2 = ((treadNum + 6) / 100) * (widthNum / 100);
                stepsWeight = stepAreaM2 * thicknessM * stepsNum * STEEL_DENSITY;

                const stepHypotenuseCm = Math.sqrt(Math.pow(treadNum, 2) + Math.pow(heightNum, 2));
                const blueLineCm = (treadNum * heightNum) / stepHypotenuseCm;
                const stringerWidthM = (blueLineCm + 16.5) / 100;
                const redLineCm = stepHypotenuseCm * stepsNum;
                
                let numBeams = 2;
                const stairGeometry = getProp(parsedData, 'stairGeometry');
                if (stairGeometry === 'Reta Parede Esq/Dir (1 Viga)') numBeams = 1;
                
                const stringerAreaM2 = (redLineCm / 100) * stringerWidthM * numBeams;
                stringerWeight = stringerAreaM2 * thicknessM * STEEL_DENSITY;
            }

            const escadaWeight = stepsWeight + stringerWeight;
            if (escadaWeight > 0) {
                const escadaCost = escadaWeight * 13.80;
                const { totalWeight: landingsWeight, totalCost: landingsCost } = getLandingsTotalSteel(parsedData);
                const totalSteelWeight = escadaWeight + landingsWeight;
                const totalSteelCost = escadaCost + landingsCost;

                med += `PESO ESCADA: ${escadaWeight.toFixed(1)} kg\n`;
                med += `TOTAL DE AÇO: ${totalSteelWeight.toFixed(1)} kg\n`;
                med += `CUSTO AÇO (ESCADA): R$ ${escadaCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
                med += `CUSTO TOTAL AÇO: R$ ${totalSteelCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
            }
        } catch (e) {
            console.error("Erro ao estimar peso/custo na Fila", e);
        }
        
        return med.trim();
    };

    const getAdicionaisMeasurements = (parsedData: any) => {
        if (!parsedData) return '';
        let med = '';
        const landings = getProp(parsedData, 'landings');
        if (landings && landings.length > 0) {
            landings.forEach((l: any, idx: number) => {
                if (l.isAccessoriesOnly) {
                    med += `ACESSÓRIO AVULSO\n`;
                } else {
                    const type = l.type === 'articulated' ? 'ARTICULADO' : 'FIXO';
                    med += `PATAMAR ${idx + 1} (${type})\nMedida: ${l.length || 0}cm x ${l.width || 0}cm\n`;
                    const lLen = (Number(l.length) || 0) + 20;
                    const lWid = (Number(l.width) || 0) + 20;
                    const pArea = (lLen * lWid) / 10000;
                    const pWeight = pArea * (3.34 / 1000) * 7850;
                    const pCost = pWeight * 13.80;
                    if (pWeight > 0) {
                        med += `Peso Patamar: ${pWeight.toFixed(1)} kg\n`;
                        med += `Custo Aço: R$ ${pCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
                    }
                }
                
                if (l.hasGuardrail) {
                    if (med.trim() !== '') med += '\n';

                    const format = (l.guardrailFormat || 'normal').toUpperCase();
                    const h = l.guardrailHeight || 90;
                    const numSides = format === 'U' ? 3 : format === 'L' ? 2 : 1;
                    
                    const calcSeg = (len: number, override?: number) => {
                        if (!len) return null;
                        let innerL = len - 4;
                        if (innerL < 0) innerL = 0;
                        const baseGaps = Math.max(1, Math.round(innerL / 15));
                        let totalBars = override !== undefined ? override : (baseGaps + 1);
                        totalBars = Math.max(2, totalBars);
                        let exactGap = (innerL - ((totalBars - 2) * 3)) / (totalBars - 1);
                        return { totalBars, exactGap };
                    };

                    let totalOverallBars = 0;
                    
                    const sideNames = l.guardrailSide ? l.guardrailSide.split(/ e |, /).map(translateSide) : [];
                    const sName1 = sideNames[0] ? ` (${sideNames[0]})` : '';
                    const sName2 = sideNames[1] ? ` (${sideNames[1]})` : '';
                    const sName3 = sideNames[2] ? ` (${sideNames[2]})` : '';
                    const baseHorizontal = (l.guardrailLength || 0) + (numSides >= 2 ? (l.guardrailLength2 || 0) : 0) + (numSides >= 3 ? (l.guardrailLength3 || 0) : 0);
                    
                    let totalPrice = 0;
                    let trueLinear1 = 0, trueLinear2 = 0, trueLinear3 = 0;
                    
                    const seg1 = calcSeg(l.guardrailLength || 0, l.guardrailBarsOverride);
                    let gap1 = 0;
                    let price1 = 0;
                    if (seg1) {
                        totalOverallBars += seg1.totalBars;
                        gap1 = l.guardrailGapOverride !== undefined ? l.guardrailGapOverride : parseFloat(seg1.exactGap.toFixed(1));
                        trueLinear1 = Math.round((seg1.totalBars * h) + (2 * (l.guardrailLength || 0)));
                        price1 = Math.round((trueLinear1 / 100) * 10);
                        totalPrice += price1;
                    }

                    let seg2 = null, gap2 = 0, price2 = 0;
                    if (numSides >= 2) {
                        seg2 = calcSeg(l.guardrailLength2 || 0, l.guardrailBarsOverride2);
                        if (seg2) {
                            totalOverallBars += seg2.totalBars - 1;
                            gap2 = l.guardrailGapOverride2 !== undefined ? l.guardrailGapOverride2 : parseFloat(seg2.exactGap.toFixed(1));
                            trueLinear2 = Math.round((seg2.totalBars * h) + (2 * (l.guardrailLength2 || 0)));
                            price2 = Math.round((trueLinear2 / 100) * 10);
                            totalPrice += price2;
                        }
                    }

                    let seg3 = null, gap3 = 0, price3 = 0;
                    if (numSides >= 3) {
                        seg3 = calcSeg(l.guardrailLength3 || 0, l.guardrailBarsOverride3);
                        if (seg3) {
                            totalOverallBars += seg3.totalBars - 1;
                            gap3 = l.guardrailGapOverride3 !== undefined ? l.guardrailGapOverride3 : parseFloat(seg3.exactGap.toFixed(1));
                            trueLinear3 = Math.round((seg3.totalBars * h) + (2 * (l.guardrailLength3 || 0)));
                            price3 = Math.round((trueLinear3 / 100) * 10);
                            totalPrice += price3;
                        }
                    }

                    const totalGuardrailLinear = trueLinear1 + trueLinear2 + trueLinear3;
                    const guardrailWeight = (totalGuardrailLinear / 100) * 0.88;

                    if (numSides === 1) {
                        const sideLabel = sideNames[0] ? sideNames[0].toUpperCase() : format;
                        med += `GUARDA-CORPO (${sideLabel})\n`;
                        med += `Comprimento: ${l.guardrailLength || 0}cm\n`;
                        med += `Altura: ${h}cm\n`;
                        med += `Linear: ${trueLinear1}cm\n`;
                        if (seg1) {
                            med += `Tubos: ${seg1.totalBars} un (vãos ${gap1}cm)\n`;
                        } else {
                            med += `Tubos: ${totalOverallBars} un\n`;
                        }
                        // Cálculo de peso preservado no código, mas ocultado da tabela a pedido do usuário:
                        // if (guardrailWeight > 0) med += `Peso Aço: ~${guardrailWeight.toFixed(1)} kg\n`;
                        med += `Custo: R$ ${totalPrice}\n\n`;
                    } else {
                        med += `GUARDA-CORPO (${format})\n\n`;
                        if (seg1) {
                            med += `• Lado 1${sName1}:\n`;
                            med += `Comprimento: ${l.guardrailLength || 0}cm\n`;
                            med += `Altura: ${h}cm\n`;
                            med += `Linear: ${trueLinear1}cm\n`;
                            med += `Tubos: ${seg1.totalBars} un (vãos ${gap1}cm)\n`;
                            med += `Custo: R$ ${price1}\n\n`;
                        }
                        if (numSides >= 2 && seg2) {
                            med += `• Lado 2${sName2}:\n`;
                            med += `Comprimento: ${l.guardrailLength2 || 0}cm\n`;
                            med += `Altura: ${h}cm\n`;
                            med += `Linear: ${trueLinear2}cm\n`;
                            med += `Tubos: ${seg2.totalBars} un (vãos ${gap2}cm)\n`;
                            med += `Custo: R$ ${price2}\n\n`;
                        }
                        if (numSides >= 3 && seg3) {
                            med += `• Lado 3${sName3}:\n`;
                            med += `Comprimento: ${l.guardrailLength3 || 0}cm\n`;
                            med += `Altura: ${h}cm\n`;
                            med += `Linear: ${trueLinear3}cm\n`;
                            med += `Tubos: ${seg3.totalBars} un (vãos ${gap3}cm)\n`;
                            med += `Custo: R$ ${price3}\n\n`;
                        }
                        med += `Total Guarda-Corpo:\n`;
                        med += `Comprimento: ${baseHorizontal}cm\n`;
                        med += `Linear: ${totalGuardrailLinear}cm\n`;
                        med += `Tubos: ${totalOverallBars} un\n`;
                        // Cálculo de peso preservado no código, mas ocultado da tabela a pedido do usuário:
                        // if (guardrailWeight > 0) med += `Peso Aço: ~${guardrailWeight.toFixed(1)} kg\n`;
                        med += `Custo: R$ ${totalPrice}\n\n`;
                    }
                }
                
                if (l.hasGate) {
                    if (med.trim() !== '') med += '\n';
                    const side = l.gateSide ? `Lado: ${translateSide(l.gateSide)}\n` : '';
                    const len = l.gateLength || 0;
                    const h = l.gateHeight || 90;
                    
                    let innerL = len - 6;
                    if (innerL < 0) innerL = 0;
                    const baseGaps = Math.max(1, Math.round(innerL / 15));
                    let totalBars = l.gateBarsOverride !== undefined ? l.gateBarsOverride : (baseGaps + 1);
                    totalBars = Math.max(2, totalBars);
                    let exactGap = (innerL - ((totalBars - 2) * 3)) / (totalBars - 1);

                    const gateTrueLinearFinal = Math.round((totalBars * h) + (2 * len));
                    const gatePriceFinal = Math.round((gateTrueLinearFinal / 100) * 10);
                    const gateWeight = (gateTrueLinearFinal / 100) * 0.88;

                    med += l.gateIsBipartido ? `PORTÃO (BIPARTIDO)\n` : `PORTÃO\n`;
                    if (side) med += side;
                    med += `Medida: ${len}x${h}cm\n`;
                    med += `Linear: ${gateTrueLinearFinal}cm\n`;
                    med += `Tubos: ${totalBars} un (vãos ${exactGap.toFixed(1)}cm)\n`;
                    if (gateWeight > 0) {
                        med += `Peso Aço: ~${gateWeight.toFixed(1)} kg\n`;
                    }
                    med += `Custo: R$ ${gatePriceFinal}\n\n`;
                }
                med += `\n`;
            });
        }
        
        const standaloneGuardrails = getProp(parsedData, 'standaloneGuardrails');
        if (standaloneGuardrails && standaloneGuardrails.length > 0) {
            standaloneGuardrails.forEach((g: any, idx: number) => {
                const matText = g.material === 'glass' ? 'VIDRO' : 'AÇO/FERRO';
                const side = g.side ? `Lado: ${translateSide(g.side)}\n` : '';
                const gLinear = ((g.length || 0) * 2) + (Math.max(1, Math.round((g.length || 0) / 15)) * (g.height || 90));
                const gWeight = (gLinear / 100) * 0.88;
                med += `GUARDA-CORPO AVULSO ${idx + 1} (${matText})\n`;
                if (side) med += side;
                med += `Comprimento: ${g.length || 0}cm\nAltura: ${g.height || 90}cm\n`;
                // Cálculo de peso preservado no código, mas ocultado da tabela a pedido do usuário:
                // if (gWeight > 0) med += `Peso Aço: ~${gWeight.toFixed(1)} kg\n`;
                med += `\n`;
            });
        }

        const optionalItems = getProp(parsedData, 'optionalItems');
        if (optionalItems && optionalItems.length > 0) {
            med += `EXTRAS CADASTRADOS:\n`;
            optionalItems.forEach((opt: any) => {
                let name = opt.name || opt.id || '';
                name = translateSide(name)
                    .replace(/\bcorrimao_aco\b/gi, 'Corrimão de Aço')
                    .replace(/\bfrench_bracket\b/gi, 'Mão Francesa');
                med += `• ${name}\n`;
            });
            med += `\n`;
        }
        return med.trim();
    };

    const getDefaultAttention = (parsedData: any) => {
        if (!parsedData) return '';
        let att = [];
        
        const landings = getProp(parsedData, 'landings');
        
        if (landings && landings.length > 0) {
            const hasArticulated = landings.some((l:any) => l.type === 'articulated' && !l.isAccessoriesOnly);
            if (hasArticulated) att.push('PATAMAR RETRÁTIL');
            
            landings.forEach((l: any) => {
                if (l.frenchBrackets > 0) {
                    att.push(`(${l.frenchBrackets} mão francesa)`);
                }
            });
        }
        return att.join(' - ');
    };

    const ensureWeightAndCost = (measurements: string, data: any, contract: any) => {
        let text = (measurements || '').trim();
        if (text === '-') text = '';

        if (isNoStairContract(data, contract)) {
            // Se não tem escada, limpa qualquer peso ou custo de escada que tenha sido gerado indevidamente
            text = text
                .replace(/PESO ESCADA:\s*[\d,.]+\s*kg\n?/gi, '')
                .replace(/TOTAL DE AÇO:\s*[\d,.]+\s*kg\n?/gi, '')
                .replace(/CUSTO AÇO(?:\s*\(ESCADA\))?:\s*(?:R\$\s*)?[\d,.]+\n?/gi, '')
                .replace(/CUSTO TOTAL AÇO:\s*(?:R\$\s*)?[\d,.]+\n?/gi, '')
                .trim();
            return text;
        }

        // Tenta extrair valores estruturados
        let steps = extractNum(getProp(data, 'steps') ?? getProp(data, 'desiredSteps') ?? getProp(data, 'totalSteps') ?? getProp(data, 'structureSteps') ?? getProp(data, 'degraus') ?? contract?.totalSteps);
        let tread = extractNum(getProp(data, 'treadDepth') ?? getProp(data, 'treadDepthCm') ?? getProp(data, 'tread') ?? getProp(data, 'pisante') ?? getProp(data, 'pisada') ?? contract?.treadDepth);
        let height = extractNum(getProp(data, 'stepHeight') ?? getProp(data, 'stepHeightCm') ?? getProp(data, 'height') ?? getProp(data, 'altura') ?? contract?.stepHeight);
        let width = extractNum(getProp(data, 'stairWidth') ?? getProp(data, 'widthCm') ?? getProp(data, 'width') ?? getProp(data, 'largura') ?? contract?.stairWidth);

        // Fallback: extrair do próprio texto existente de text
        if (!steps && text) {
            const m = text.match(/(?:DEGRAUS:?\s*(\d+)|(\d+)\s*degraus)/i);
            if (m) steps = Number(m[1] || m[2]);
        }
        if (!tread && text) {
            const m = text.match(/(?:PISADA:?\s*([\d,.]+)|PISANTE:?\s*([\d,.]+)|([\d,.]+)\s*cm\s*pisada)/i);
            if (m) tread = parseFloat((m[1] || m[2] || m[3]).replace(',', '.'));
        }
        if (!height && text) {
            const m = text.match(/(?:ALTURA:?\s*([\d,.]+)|([\d,.]+)\s*cm\s*altura)/i);
            if (m) height = parseFloat((m[1] || m[2]).replace(',', '.'));
        }
        if (!width && text) {
            const m = text.match(/(?:LARGURA:?\s*([\d,.]+)|([\d,.]+)\s*cm\s*largura)/i);
            if (m) width = parseFloat((m[1] || m[2]).replace(',', '.'));
        }

        if (height > 50 && steps > 0) {
            height = height / steps;
        }

        if (!height && steps > 0) {
            const totH = extractNum(getProp(data, 'totalHeight') ?? getProp(data, 'alturaTotal'));
            if (totH > 0) height = totH / steps;
            else height = 19;
        }

        if (!tread && steps > 0) {
            tread = 20;
        }

        if (!width && (steps > 0 || tread > 0)) {
            width = 60;
        }

        // Tentar extrair peso da escada pré-existente no texto ou no frete caso falte dados de degraus
        let existingEscadaWeight = 0;
        const matchPeso = text.match(/PESO ESCADA:\s*([\d,.]+)\s*kg/i);
        if (matchPeso) {
            existingEscadaWeight = parseFloat(matchPeso[1].replace(',', '.'));
        }
        if (!existingEscadaWeight && contract?.hingesQty) {
            const mHinges = contract.hingesQty.match(/PESO\s*(?:\(ESCADA\)|ESCADA):\s*([\d,.]+)\s*kg/i);
            if (mHinges) existingEscadaWeight = parseFloat(mHinges[1].replace(',', '.'));
        }

        // Se o texto não tinha degraus mas encontramos degraus
        if ((!text || !text.includes('DEGRAUS:')) && steps > 0 && tread > 0) {
            const fresh = getEscadaMeasurements(data, contract);
            if (fresh) text = fresh;
            else {
                text = `DEGRAUS: ${steps}\nPISADA: ${tread}cm\nALTURA: ${height ? height.toFixed(2) : '19'}cm\nLARGURA: ${width}cm\n`;
            }
        }

        let escadaWeight = 0;
        if (steps > 0 && tread > 0) {
            const h = height > 0 ? height : 19;
            const w = width > 0 ? width : 60;
            const thicknessM = 3.0 / 1000;
            const STEEL_DENSITY = 7850;

            const stepAreaM2 = ((tread + 6) / 100) * (w / 100);
            const stepsWeight = stepAreaM2 * thicknessM * steps * STEEL_DENSITY;

            const stepHypotenuseCm = Math.sqrt(Math.pow(tread, 2) + Math.pow(h, 2));
            const blueLineCm = (tread * h) / stepHypotenuseCm;
            const stringerWidthM = (blueLineCm + 16.5) / 100;
            const redLineCm = stepHypotenuseCm * steps;

            let numBeams = 2;
            const stairGeometry = getProp(data, 'stairGeometry');
            if (stairGeometry === 'Reta Parede Esq/Dir (1 Viga)') numBeams = 1;

            const stringerAreaM2 = (redLineCm / 100) * stringerWidthM * numBeams;
            const stringerWeight = stringerAreaM2 * thicknessM * STEEL_DENSITY;

            escadaWeight = stepsWeight + stringerWeight;
        }

        if (escadaWeight === 0 && existingEscadaWeight > 0) {
            escadaWeight = existingEscadaWeight;
        }

        // Fallback garantido: Se ainda estiver zerado mas tem degraus (ou escada), estima ~7.5kg por degrau
        if (escadaWeight === 0 && steps > 0) {
            escadaWeight = steps * 7.5;
        } else if (escadaWeight === 0 && !isNoStairContract(data, contract) && (contract?.totalValue || 0) > 0) {
            // Estima com base no valor médio de escada (~14 degraus = 105kg)
            escadaWeight = 105;
        }

        if (escadaWeight > 0) {
            const escadaCost = escadaWeight * 13.80;
            const { totalWeight: landingsWeight, totalCost: landingsCost } = getLandingsTotalSteel(data);
            const totalSteelWeight = escadaWeight + landingsWeight;
            const totalSteelCost = escadaCost + landingsCost;

            const pesoEscadaStr = `PESO ESCADA: ${escadaWeight.toFixed(1)} kg`;
            const totalAcoStr = `TOTAL DE AÇO: ${totalSteelWeight.toFixed(1)} kg`;
            const custoEscadaStr = `CUSTO AÇO (ESCADA): R$ ${escadaCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            const custoTotalStr = `CUSTO TOTAL AÇO: R$ ${totalSteelCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

            text = text
                .replace(/PESO\s*(?:ESCADA|\(ESCADA\)|TOTAL DE AÇO|TOTAL)?:\s*[\d,.]+\s*kg\n?/gi, '')
                .replace(/TOTAL DE AÇO:\s*[\d,.]+\s*kg\n?/gi, '')
                .replace(/CUSTO\s*(?:AÇO)?(?:\s*\(ESCADA\))?:\s*(?:R\$\s*)?[\d,.]+\n?/gi, '')
                .replace(/CUSTO TOTAL(?:\s*AÇO)?:\s*(?:R\$\s*)?[\d,.]+\n?/gi, '')
                .trim();

            text = text + `\n${pesoEscadaStr}\n${totalAcoStr}\n${custoEscadaStr}\n${custoTotalStr}`;
        }

        return text;
    };



    const formatDate = (dateString: any) => {
        if (!dateString) return '';
        try {
            let d;
            if (typeof dateString.toDate === 'function') d = dateString.toDate();
            else d = new Date(dateString);
            return d.toLocaleDateString('pt-BR');
        } catch (e) {
            return '';
        }
    };

    const formatDeliveryDate = (dateString?: string) => {
        if (!dateString) return <span className="print-hidden text-gray-500 italic font-normal">Selecionar Data</span>;
        try {
            const date = parseISO(dateString);
            const formatted = formatTZ(date, "dd/MM/yyyy (EEEE)", { locale: ptBR, timeZone: 'UTC' });
            return <span>{formatted}</span>;
        } catch (e) {
            return <span>{dateString}</span>;
        }
    };

    const getDateColorClass = (dateString?: string) => {
        if (!dateString) return 'bg-gray-100 text-gray-500 hover:bg-gray-200';
        try {
            const date = parseISO(dateString);
            const today = startOfDay(new Date());
            const weekStart = startOfWeek(today, { weekStartsOn: 0 }); // Domingo
            const weekEnd = endOfWeek(today, { weekStartsOn: 0 }); // Sábado

            if (isBefore(date, today)) {
                return 'bg-red-100 text-red-800 border-red-300 font-bold'; // Atrasado
            } else if (isWithinInterval(date, { start: weekStart, end: weekEnd })) {
                return 'bg-orange-100 text-orange-800 border-orange-300 font-bold'; // Semana atual
            } else {
                return 'bg-green-50 text-green-700 border-green-200'; // Normal / Futuro
            }
        } catch (e) {
            return 'bg-gray-100 text-gray-700';
        }
    };

    const handleUpdateContract = async (id: string, field: string, value: any) => {
        try {
            const docRef = doc(db, 'contracts', id);
            await updateDoc(docRef, { [field]: value });
        } catch (error) {
            console.error("Erro ao atualizar:", error);
        }
    };

    const handleMarkAsDelivered = async (id: string) => {
        if (window.confirm('Tem certeza que deseja marcar como ENTREGUE? O contrato sairá desta lista.')) {
            try {
                const docRef = doc(db, 'contracts', id);
                await updateDoc(docRef, { status: 'entregue' });
            } catch (error) {
                console.error("Erro ao marcar como entregue:", error);
            }
        }
    };

    const handleAddManualContract = async () => {
        try {
            await addDoc(collection(db, 'contracts'), {
                clientName: 'NOVO CLIENTE (Editar)',
                status: 'producao',
                createdAt: serverTimestamp(),
                contractData: '{}', 
                deliveryNotes: 'Atenção:',
                hingesQty: '-',
                measurementsNotes: '-'
            });
        } catch (error) {
            console.error("Erro ao criar contrato manual", error);
            alert("Erro ao criar cliente manual. Tente novamente.");
        }
    };

    const handleDeleteContract = async (id: string, name?: string) => {
        if (window.confirm(`Tem certeza que deseja excluir o contrato de "${name || 'Cliente'}" da produção?`)) {
            try {
                await deleteDoc(doc(db, 'contracts', id));
            } catch (e) {
                console.error('Erro ao excluir contrato:', e);
                alert('Erro ao excluir contrato.');
            }
        }
    };

    return (
        <div className="max-w-[1400px] mx-auto p-4 sm:p-6 print:p-0">
            <style>
                {`
                @media print {
                    @page { size: landscape; margin: 10mm; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white !important; }
                    .print-hidden { display: none !important; }
                    .print-table { width: 100% !important; border-collapse: collapse; font-size: 11px !important; color: black; }
                    .print-table th, .print-table td { border: 1px solid #000 !important; padding: 4px !important; }
                    .print-table th { background-color: #f3f4f6 !important; font-weight: bold !important; text-align: left; }
                    
                    nav, header, footer { display: none !important; }
                    main { padding: 0 !important; margin: 0 !important; }
                    
                    .editable-cell { border: none !important; outline: none !important; min-height: 20px; white-space: pre-wrap; word-break: break-word; }
                    .date-picker-wrapper input[type="date"] { display: none !important; }
                    .date-display { background: transparent !important; color: black !important; border: none !important; padding: 0 !important; font-weight: bold; }
                }
                .editable-cell {
                    min-height: 40px;
                    padding: 8px;
                    border: 1px dashed transparent;
                    transition: border-color 0.2s;
                    white-space: pre-wrap;
                    word-break: break-word;
                }
                .editable-cell:hover, .editable-cell:focus {
                    border-color: #3b82f6;
                    outline: none;
                    background-color: rgba(59, 130, 246, 0.05);
                }
                .date-picker-wrapper {
                    position: relative;
                    display: inline-block;
                    width: 100%;
                }
                .date-picker-wrapper input[type="date"] {
                    position: absolute;
                    top: 0; left: 0; width: 100%; height: 100%;
                    opacity: 0;
                    cursor: pointer;
                }
                `}
            </style>

            <div className="flex justify-between items-center mb-6 print-hidden">
                <div>
                    <PageTitle info="Entregas programadas, com medidas da escada fechada e texto pronto pra cotar com a transportadora.">
                      Tabela de Entregas
                    </PageTitle>
                    <p className="text-gray-500 dark:text-gray-400">Clique nas observações ou nas datas para alterar. O sistema salvará automaticamente.</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={handleAddManualContract}
                        className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-md flex items-center gap-2 transition-colors"
                    >
                        ➕ Novo Cliente
                    </button>
                    <button 
                        onClick={() => setShowValues(!showValues)}
                        className={`px-4 py-2.5 rounded-lg font-bold shadow-md flex items-center gap-2 transition-colors ${showValues ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300'}`}
                        title="Mostrar ou ocultar valores financeiros na tela e na impressão"
                    >
                        {showValues ? '👁️ Valores Visíveis' : '🙈 Valores Ocultos'}
                    </button>
                    <button 
                        onClick={handlePrint}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-md flex items-center gap-2 transition-colors"
                    >
                        🖨️ Imprimir
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10 print-hidden">Carregando contratos...</div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto print:border-none print:shadow-none print:bg-white print:overflow-visible">
                    <table className="w-full text-left print-table">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="p-4 font-bold text-gray-900 dark:text-gray-200 text-sm w-[12%]">CLIENTE</th>
                                <th className="p-4 font-bold text-gray-900 dark:text-gray-200 text-sm w-[15%]">LOCALIZAÇÃO</th>
                                <th className="p-4 font-bold text-gray-900 dark:text-gray-200 text-sm w-[10%]">DATA ENTREGA</th>
                                <th className="p-4 font-bold text-gray-900 dark:text-gray-200 text-sm w-[12%]">TRANSPORTADORA</th>
                                <th className="p-4 font-bold text-gray-900 dark:text-gray-200 text-sm w-[13%]">ATENÇÃO</th>
                                <th className="p-4 font-bold text-gray-900 dark:text-gray-200 text-sm w-[15%]">FAB. ESCADA</th>
                                <th className="p-4 font-bold text-gray-900 dark:text-gray-200 text-sm w-[15%]">FAB. ADICIONAIS</th>
                                <th className="p-4 font-bold text-gray-900 dark:text-gray-200 text-sm w-[8%] print-hidden">AÇÃO</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {contracts.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-gray-500 dark:text-gray-400 print-hidden">
                                        Nenhuma entrega em produção no momento.
                                    </td>
                                </tr>
                            ) : (
                                contracts.map(contract => {
                                    const data = parseContractData(contract.contractData, contract);
                                    const address = (contract.customAddress !== undefined && contract.customAddress.trim() !== '') ? contract.customAddress : getFullAddress(data?.userData);
                                    
                                    const attention = (contract.deliveryNotes !== undefined && contract.deliveryNotes.trim() !== '' && contract.deliveryNotes.trim() !== '-') 
                                        ? contract.deliveryNotes 
                                        : getDefaultAttention(data);

                                    // 1. Fabricação Escada (garante medidas, peso e custo do aço)
                                    let rawNotes = (contract.measurementsNotes || '').trim();
                                    let measurements = (rawNotes !== '' && rawNotes !== '-' && rawNotes.length > 5)
                                        ? contract.measurementsNotes 
                                        : getEscadaMeasurements(data, contract);

                                    if (!measurements || measurements.trim() === '-' || measurements.trim().length <= 5) {
                                        const freshEscada = getEscadaMeasurements(data, contract);
                                        if (freshEscada) measurements = freshEscada;
                                    }

                                    // Remove itens de adicionais (patamar/guarda-corpo/portão) que possam ter ficado salvos em measurementsNotes antigas
                                    measurements = (measurements || '')
                                        .replace(/(?:PATAMAR|GUARDA-CORPO|PORTÃO|ACESSÓRIO AVULSO)[\s\S]*?(?=(?:PESO ESCADA|TOTAL DE AÇO|CUSTO AÇO|CUSTO TOTAL AÇO|$))/gi, '')
                                        .trim();

                                    measurements = cleanAndTranslateMeasurements(measurements);
                                    measurements = ensureWeightAndCost(measurements, data, contract);

                                    // 2. Fabricação Adicionais (garante peso e custo do patamar/guarda-corpos)
                                    let measurementsAdicionais = (contract.measurementsNotesAdicionais !== undefined && contract.measurementsNotesAdicionais.trim() !== '' && contract.measurementsNotesAdicionais.trim() !== '-')
                                        ? contract.measurementsNotesAdicionais 
                                        : getAdicionaisMeasurements(data);

                                    if (!measurementsAdicionais || measurementsAdicionais.trim() === '-') {
                                        const freshAdic = getAdicionaisMeasurements(data);
                                        if (freshAdic) measurementsAdicionais = freshAdic;
                                    }
                                    measurementsAdicionais = cleanAndTranslateMeasurements(measurementsAdicionais);

                                    // 3. Frete (garante dimensões do pacote e pesos totais sem duplicações)
                                    const freightInfo = resolveFreightInfo(contract, data, measurements);

                                    // 4. Texto para transportadora (editado à mão ou gerado com os dados do contrato)
                                    const clientNorm = normalizeName(contract.clientName || data?.userData?.name);
                                    const clientQueueItem = queueItems.find(q => q.contractId === contract.id || (clientNorm && normalizeName(q.clientName) === clientNorm));
                                    const clientQuoteItem = savedQuotes.find(q => clientNorm && normalizeName(q.clientName) === clientNorm);
                                    const quoteText = (contract.freightQuoteText && contract.freightQuoteText.trim() !== '')
                                        ? contract.freightQuoteText
                                        : buildFreightQuoteText({
                                            userData: resolveClientInfo({ contract, parsedData: data, queueItem: clientQueueItem, quoteItem: clientQuoteItem }),
                                            invoiceValue: getInvoiceValue(data, contract, clientQueueItem),
                                            freightInfo,
                                        });
                                      const dateColor = getDateColorClass(contract.deliveryDate);
                                    
                                    const queueItem = queueItems.find(q => q.contractId === contract.id);
                                    let totalValueFormatted = formatCurrencyBRL(contract.totalValue || 0);
                                    let remainingValueFormatted = "";
                                    let remainingMethodText = "";
                                    
                                    if (queueItem) {
                                        const paid = queueItem.customPaidValue !== undefined && queueItem.customPaidValue !== null
                                            ? queueItem.customPaidValue
                                            : ((queueItem.downPayment || 0) + (queueItem.balanceStatus === 'paid' ? queueItem.balanceDue : 0));
                                        const val = queueItem.value || contract.totalValue || 0;
                                        totalValueFormatted = formatCurrencyBRL(val);
                                        
                                        const remaining = val - paid;
                                        if (remaining > 0) {
                                            remainingValueFormatted = formatCurrencyBRL(remaining);
                                            
                                            if (queueItem.paymentMethod === 'pix') remainingMethodText = "PIX";
                                            else if (queueItem.paymentMethod === 'card') remainingMethodText = "Cartão";
                                            else if (queueItem.paymentMethod === 'hybrid') {
                                                remainingMethodText = queueItem.pixTiming === 'delivery' ? "PIX" : "Cartão";
                                            } else {
                                                remainingMethodText = "Não definido";
                                            }
                                        }
                                    }

                                    return (
                                        <tr key={contract.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors print:hover:bg-white text-gray-800 dark:text-gray-300">
                                            <td className="p-2 align-top">
                                                <div 
                                                    className="font-bold px-2 py-1 text-base print:text-[16px] print:font-black editable-cell"
                                                    contentEditable
                                                    suppressContentEditableWarning
                                                    onBlur={(e) => {
                                                        if (e.target.innerText !== contract.clientName) {
                                                            handleUpdateContract(contract.id, 'clientName', e.target.innerText);
                                                        }
                                                    }}
                                                >
                                                    {contract.clientName}
                                                </div>
                                                <div className={`px-2 mt-1 mb-1 print:mb-0.5 flex flex-col gap-0.5 ${!showValues ? 'hidden print:hidden' : ''}`}>
                                                    <div>
                                                        {contract.paymentStatus === 'recebido' ? (
                                                            <span className="text-xs font-bold text-green-600 dark:text-green-400 print:text-[11px] print:text-gray-800">💰 Recebido</span>
                                                        ) : (
                                                            <span className="text-xs font-bold text-red-500 dark:text-red-400 print:text-[11px] print:text-gray-600">⏳ A Receber</span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs font-bold text-gray-700 dark:text-gray-300 print:text-[11px] print:text-gray-700 mt-1">
                                                        TOTAL: {totalValueFormatted}
                                                    </div>
                                                    {remainingValueFormatted && (
                                                        <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 print:text-[11px] print:text-gray-700">
                                                            A RECEBER: {remainingValueFormatted} ({remainingMethodText})
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-sm font-semibold text-gray-500 print:text-[14px] print:font-bold px-2 mb-2 print:mt-0.5">
                                                    Contrato: {formatDate(contract.createdAt)}
                                                </div>
                                                {/* Caixas de Assinatura (Produção) */}
                                                <div className="mt-2 flex justify-between px-2 print:mt-1 gap-1">
                                                    {['JEF', 'AQUI', 'SOLD', 'PRT'].map(label => (
                                                        <div key={label} className="flex flex-col items-center">
                                                            <span className="text-[9px] font-bold text-gray-700 print:text-black leading-tight">{label}</span>
                                                            <div className="w-5 h-5 border-2 border-gray-400 print:border-black rounded-sm print:w-6 print:h-6 print:border-[2px]"></div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="p-2 align-top text-sm">
                                                <div 
                                                    className="editable-cell"
                                                    contentEditable
                                                    suppressContentEditableWarning
                                                    onBlur={(e) => {
                                                        if (e.target.innerText !== address) {
                                                            handleUpdateContract(contract.id, 'customAddress', e.target.innerText);
                                                        }
                                                    }}
                                                >
                                                    {address}
                                                </div>
                                            </td>
                                            <td className="p-2 align-top text-sm font-semibold">
                                                <div className="flex flex-col gap-1">
                                                    <div className={`date-display px-2 py-1 rounded transition-colors text-center ${dateColor}`}>
                                                        {formatDeliveryDate(contract.deliveryDate)}
                                                    </div>
                                                    <div className="flex items-center gap-1 print-hidden w-full">
                                                        <input 
                                                            type="date" 
                                                            className="border border-gray-300 rounded px-1 py-1 text-xs text-gray-700 bg-white flex-1 cursor-pointer"
                                                            value={contract.deliveryDate || ''}
                                                            onChange={(e) => handleUpdateContract(contract.id, 'deliveryDate', e.target.value)}
                                                        />
                                                        {contract.deliveryDate && (
                                                            <button 
                                                                onClick={() => handleUpdateContract(contract.id, 'deliveryDate', '')}
                                                                className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors flex-shrink-0"
                                                                title="Remover data"
                                                            >
                                                                🗑️
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-2 align-top text-sm">
                                                <div>
                                                    {contract.freightQuoteText && (
                                                        <div className="flex justify-end mb-1 print-hidden">
                                                            <button
                                                                onClick={() => handleUpdateContract(contract.id, 'freightQuoteText', '')}
                                                                className="text-xs px-1.5 py-0.5 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
                                                                title="Descartar edições e gerar de novo com os dados do contrato"
                                                            >
                                                                ↺ Refazer
                                                            </button>
                                                        </div>
                                                    )}
                                                    <div
                                                        key={quoteText}
                                                        className="editable-cell whitespace-pre-line text-xs p-1 rounded bg-indigo-50 dark:bg-indigo-950/40 print:bg-white print:p-0"
                                                        contentEditable
                                                        suppressContentEditableWarning
                                                        onBlur={(e) => {
                                                            if (e.currentTarget.innerText !== quoteText) {
                                                                handleUpdateContract(contract.id, 'freightQuoteText', e.currentTarget.innerText);
                                                            }
                                                        }}
                                                    >
                                                        {quoteText.split(MISSING_INFO).map((part, i) => (
                                                            <React.Fragment key={i}>
                                                                {i > 0 && <span className="bg-red-600 text-white font-black px-1 rounded">{MISSING_INFO}</span>}
                                                                {part}
                                                            </React.Fragment>
                                                        ))}
                                                    </div>
                                                    <button
                                                        onClick={() => copyTextToClipboard(quoteText, 'Texto da transportadora copiado!')}
                                                        className="print-hidden mt-1 w-full text-xs font-bold py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white"
                                                        title="Copiar texto da transportadora"
                                                    >
                                                        📋 Copiar
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="p-2 align-top text-sm text-red-600 dark:text-red-400 print:text-red-600 font-semibold print:!text-red-600 print:font-bold">
                                                <div 
                                                    className="editable-cell" 
                                                    contentEditable 
                                                    suppressContentEditableWarning
                                                    onBlur={(e) => {
                                                        if (e.target.innerText !== attention) {
                                                            handleUpdateContract(contract.id, 'deliveryNotes', e.target.innerText);
                                                        }
                                                    }}
                                                >
                                                    {attention}
                                                </div>
                                            </td>
                                            <td className="p-2 align-top text-xs font-mono">
                                                <div 
                                                    className="editable-cell px-2 py-1 whitespace-pre-wrap"
                                                    contentEditable 
                                                    suppressContentEditableWarning
                                                    onBlur={(e) => {
                                                        const val = e.target.innerText.trim();
                                                        if (val !== (measurements || '-')) {
                                                            handleUpdateContract(contract.id, 'measurementsNotes', val === '-' ? '' : val);
                                                        }
                                                    }}
                                                >
                                                    {measurements || '-'}
                                                </div>
                                            </td>
                                            <td className="p-2 align-top text-xs font-mono">
                                                <div 
                                                    className="editable-cell px-2 py-1 whitespace-pre-wrap"
                                                    contentEditable 
                                                    suppressContentEditableWarning
                                                    onBlur={(e) => {
                                                        const val = e.target.innerText.trim();
                                                        if (val !== (measurementsAdicionais || '-')) {
                                                            handleUpdateContract(contract.id, 'measurementsNotesAdicionais', val === '-' ? '' : val);
                                                        }
                                                    }}
                                                >
                                                    {measurementsAdicionais || '-'}
                                                </div>
                                            </td>
                                            <td className="p-2 align-middle print-hidden flex flex-col gap-2">
                                                <button 
                                                    onClick={() => handleMarkAsDelivered(contract.id)}
                                                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-2 rounded text-xs transition-colors shadow-sm"
                                                    title="Marcar como entregue"
                                                >
                                                    Entregue ✓
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteContract(contract.id, contract.clientName)}
                                                    className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold py-1.5 px-2 rounded text-xs transition-colors shadow-sm"
                                                    title="Excluir contrato duplicado ou cancelado"
                                                >
                                                    Excluir 🗑️
                                                </button>
                                                <label className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-2 rounded text-xs transition-colors shadow-sm cursor-pointer text-center block" title="Anexar Imagem">
                                                    Anexar Imagem
                                                    <input type="file" className="hidden" accept="image/*,video/*" onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            try {
                                                                const { uploadImageToFirebase } = await import('../services/firebaseStorage');
                                                                const url = await uploadImageToFirebase(file, 'projects', contract.id);
                                                                const currentImages = contract.projectImages || [];
                                                                handleUpdateContract(contract.id, 'projectImages', [...currentImages, url]);
                                                                alert('Imagem anexada com sucesso!');
                                                            } catch (err) {
                                                                alert('Erro ao anexar imagem.');
                                                            }
                                                        }
                                                    }} />
                                                </label>
                                                {contract.projectImages && contract.projectImages.length > 0 && (
                                                    <div className="flex gap-1 flex-wrap mt-1">
                                                        {contract.projectImages.map((img: string, idx: number) => (
                                                            <a key={idx} href={img} target="_blank" rel="noreferrer" className="w-8 h-8 rounded border border-gray-300 overflow-hidden inline-block">
                                                                <img src={img} alt="Anexo" className="w-full h-full object-cover" />
                                                            </a>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};








