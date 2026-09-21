import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../components/AuthProvider';
import { SavedContract } from '../types';
import { startOfWeek, endOfWeek, isBefore, isWithinInterval, parseISO, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { format as formatTZ } from 'date-fns-tz';

export const DeliveriesTable: React.FC = () => {
    const [contracts, setContracts] = useState<SavedContract[]>([]);
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setContracts([]);
            setLoading(false);
            return;
        }

        const q = query(collection(db, 'contracts'), where('status', '==', 'producao'));
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

        return () => unsubscribe();
    }, [user]);

    const handlePrint = () => {
        window.print();
    };

    const parseContractData = (dataStr: any) => {
        try {
            let parsed = typeof dataStr === 'string' ? JSON.parse(dataStr) : dataStr;
            while (typeof parsed === 'string') {
                parsed = JSON.parse(parsed);
            }
            return parsed;
        } catch (e) {
            return null;
        }
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

    const getMeasurements = (parsedData: any) => {
        if (!parsedData) return '';
        const inputData = parsedData.inputData || parsedData;
        const selectedOption = parsedData.selectedOption || parsedData;
        
        const steps = getProp(parsedData, 'steps') ?? getProp(parsedData, 'desiredSteps') ?? getProp(parsedData, 'degraus');
        const tread = getProp(parsedData, 'treadDepth') ?? getProp(parsedData, 'treadDepthCm') ?? getProp(parsedData, 'pisante');
        const height = getProp(parsedData, 'stepHeight') ?? getProp(parsedData, 'stepHeightCm') ?? getProp(parsedData, 'altura');
        const width = getProp(parsedData, 'stairWidth') ?? getProp(parsedData, 'widthCm') ?? getProp(parsedData, 'largura');
        
        let fixationText = "";
        const wallFix = getProp(parsedData, 'wallFixation');
        const stairGeom = getProp(parsedData, 'stairGeometry');
        
        if (stairGeom === 'hide') {
            fixationText = "SEM FIXAÇÃO";
        } else if (stairGeom && typeof stairGeom === 'string' && stairGeom.includes('Fixação')) {
            fixationText = stairGeom;
        } else if (wallFix === 'frontal') {
            fixationText = "Fixação FRONTAL";
        } else if (wallFix === 'left') {
            fixationText = "Fixação na Parede ESQUERDA";
        } else if (wallFix === 'right') {
            fixationText = "Fixação na Parede DIREITA";
        }
        
        let med = fixationText ? `${fixationText}\n` : '';
        med += `${steps} DEGRAUS\n`;
        med += `PISADA: ${tread}cm\n`;
        med += `ALT: ${height}cm\n`;
        med += `LARGURA: ${width}cm\n`;

        const treadMaterial = getProp(parsedData, 'treadMaterial');
        const woodType = getProp(parsedData, 'woodType');

        if (treadMaterial === 'wood') {
            let wood = 'MADEIRA';
            if (woodType === 'garapeira') wood += ' (GARAPEIRA)';
            if (woodType === 'muiracatiara') wood += ' (MUIRACATIARA)';
            if (woodType === 'ambas') wood += ' (GARAPEIRA/MUIRACATIARA)';
            med += `MATERIAL: ${wood}\n`;
        } else if (treadMaterial === 'chapa_xadrez') {
            med += `MATERIAL: CHAPA XADREZ\n`;
        } else if (treadMaterial === 'chapa_vazada') {
            med += `MATERIAL: CHAPA VAZADA\n`;
        }

        const landings = getProp(parsedData, 'landings');
        if (landings && landings.length > 0) {
            landings.forEach((l: any, idx: number) => {
                const type = l.type === 'articulated' ? 'ARTICULADO' : 'FIXO';
                med += `PATAMAR ${idx + 1} (${type}): ${l.length}cm x ${l.width}cm\n`;
                if (l.hasGuardrail) {
                    const format = l.guardrailFormat || 'normal';
                    const side = l.guardrailSide ? ` [Lado: ${l.guardrailSide}]` : '';
                    const h = l.guardrailHeight || 90;
                    const numSides = format === 'U' ? 3 : format === 'L' ? 2 : 1;
                    
                    const calcSeg = (len: number, override?: number) => {
                        if (!len) return null;
                        let innerL = len - 6;
                        if (innerL < 0) innerL = 0;
                        const baseGaps = Math.max(1, Math.round(innerL / 15));
                        let totalBars = override !== undefined ? override : (baseGaps + 1);
                        totalBars = Math.max(2, totalBars);
                        let exactGap = (innerL - ((totalBars - 2) * 3)) / (totalBars - 1);
                        return { totalBars, exactGap };
                    };

                    let totalOverallBars = 0;
                    let segmentsText: string[] = [];
                    
                    const sideNames = l.guardrailSide ? l.guardrailSide.split(/ e |, /) : [];
                    const sName1 = sideNames[0] ? ` (${sideNames[0]})` : '';
                    const sName2 = sideNames[1] ? ` (${sideNames[1]})` : '';
                    const sName3 = sideNames[2] ? ` (${sideNames[2]})` : '';
                    const totalLinear = (l.guardrailLength || 0) + (numSides >= 2 ? (l.guardrailLength2 || 0) : 0) + (numSides >= 3 ? (l.guardrailLength3 || 0) : 0);
                    
                    const gPrice = l.guardrailPricePerMeter !== undefined ? l.guardrailPricePerMeter : 50;
                    let totalPrice = 0;
                    
                    const seg1 = calcSeg(l.guardrailLength || 0, l.guardrailBarsOverride);
                    if (seg1) {
                        totalOverallBars += seg1.totalBars;
                        const gap1 = l.guardrailGapOverride !== undefined ? l.guardrailGapOverride : parseFloat(seg1.exactGap.toFixed(1));
                        const price1 = Math.round(((seg1.totalBars * (h / 100)) + (2 * ((l.guardrailLength || 0) / 100))) * 10);
                        totalPrice += price1;
                        segmentsText.push(`Lado 1${sName1}: Comp. Linear ${l.guardrailLength || 0}cm (${seg1.totalBars} tubos - vãos ${gap1}cm) - R$ ${price1}`);
                    }
                    if (numSides >= 2) {
                        const seg2 = calcSeg(l.guardrailLength2 || 0, l.guardrailBarsOverride2);
                        if (seg2) {
                            totalOverallBars += seg2.totalBars - 1; // share corner
                            const gap2 = l.guardrailGapOverride2 !== undefined ? l.guardrailGapOverride2 : parseFloat(seg2.exactGap.toFixed(1));
                            const price2 = Math.round(((seg2.totalBars * (h / 100)) + (2 * ((l.guardrailLength2 || 0) / 100))) * 10);
                            totalPrice += price2;
                            segmentsText.push(`Lado 2${sName2}: Comp. Linear ${l.guardrailLength2 || 0}cm (${seg2.totalBars} tubos - vãos ${gap2}cm) - R$ ${price2}`);
                        }
                    }
                    if (numSides >= 3) {
                        const seg3 = calcSeg(l.guardrailLength3 || 0, l.guardrailBarsOverride3);
                        if (seg3) {
                            totalOverallBars += seg3.totalBars - 1; // share corner
                            const gap3 = l.guardrailGapOverride3 !== undefined ? l.guardrailGapOverride3 : parseFloat(seg3.exactGap.toFixed(1));
                            const price3 = Math.round(((seg3.totalBars * (h / 100)) + (2 * ((l.guardrailLength3 || 0) / 100))) * 10);
                            totalPrice += price3;
                            segmentsText.push(`Lado 3${sName3}: Comp. Linear ${l.guardrailLength3 || 0}cm (${seg3.totalBars} tubos - vãos ${gap3}cm) - R$ ${price3}`);
                        }
                    }

                    const totalWithGate = totalLinear + (l.hasGate ? (l.gateLength || 0) : 0);
                    const compText = l.hasGate ? `Comp. Linear G.Corpo: ${totalLinear}cm (Total c/ Portão: ${totalWithGate}cm)` : `Comp. Linear: ${totalLinear}cm`;

                    if (numSides > 1) {
                        med += `  - G. Corpo (F: ${format}): ${compText} | Altura ${h}cm - Total: ${totalOverallBars} tubos - R$ ${totalPrice}\n`;
                        segmentsText.forEach(seg => {
                            med += `    • ${seg}\n`;
                        });
                    } else {
                        const gap1 = seg1 ? (l.guardrailGapOverride !== undefined ? l.guardrailGapOverride : parseFloat(seg1.exactGap.toFixed(1))) : 0;
                        const price1 = seg1 ? Math.round(((seg1.totalBars * (h / 100)) + (2 * ((l.guardrailLength || 0) / 100))) * 10) : 0;
                        med += `  - G. Corpo (F: ${format}): ${compText} | Altura ${h}cm${side} - ${seg1 ? seg1.totalBars : 0} tubos (vãos ${gap1}cm) - R$ ${price1}\n`;
                    }
                }
                if (l.hasGate) {
                    const side = l.gateSide ? ` [Lado: ${l.gateSide}]` : '';
                    const len = l.gateLength || 0;
                    const h = l.gateHeight || 90;
                    
                    let innerL = len - 6;
                    if (innerL < 0) innerL = 0;
                    const baseGaps = Math.max(1, Math.round(innerL / 15));
                    let totalBars = l.gateBarsOverride !== undefined ? l.gateBarsOverride : (baseGaps + 1);
                    totalBars = Math.max(2, totalBars);
                    let exactGap = (innerL - ((totalBars - 2) * 3)) / (totalBars - 1);
                    
                    const gatePrice = Math.round(((totalBars * (h / 100)) + (2 * (len / 100))) * 10);

                    med += `  - Portão: Comp. Linear ${len}cm | Altura ${h}cm${side} - ${totalBars} tubos (vãos ${exactGap.toFixed(1)}cm) - R$ ${gatePrice}\n`;
                }
            });
        }
        
        const optionalItems = getProp(parsedData, 'optionalItems');
        if (optionalItems && optionalItems.length > 0) {
            optionalItems.forEach((opt: any) => {
                med += `EXTRA: ${opt.name}\n`;
            });
        }

        // --- CÁLCULO DE PESO E CUSTO DO AÇO ---
        try {
            const extractNum = (val: any) => {
                if (typeof val === 'number') return val;
                if (typeof val === 'string') {
                    const match = val.replace(',', '.').match(/[\d.]+/);
                    return match ? Number(match[0]) : 0;
                }
                return 0;
            };

            const treadNum = extractNum(tread);
            const heightNum = extractNum(height);
            const widthNum = extractNum(width);
            const stepsNum = extractNum(steps);
            const thicknessM = 3.0 / 1000; // 3mm padrão
            const STEEL_DENSITY = 7850;

            if (treadNum > 0 && heightNum > 0 && widthNum > 0 && stepsNum > 0) {
                // 1. Degraus
                const stepAreaM2 = ((treadNum + 6) / 100) * (widthNum / 100);
                const stepsWeight = stepAreaM2 * thicknessM * stepsNum * STEEL_DENSITY;

                // 2. Patamares
                let landingsAreaM2 = 0;
                if (landings && landings.length > 0) {
                    landings.forEach((l: any) => {
                        const lLen = (Number(l.length) || 0) + 20;
                        const lWid = (Number(l.width) || 0) + 20;
                        landingsAreaM2 += (lLen * lWid) / 10000;
                    });
                }
                const landingsWeight = landingsAreaM2 * (3.34 / 1000) * STEEL_DENSITY;

                // 3. Vigas Laterais
                const stepHypotenuseCm = Math.sqrt(Math.pow(treadNum, 2) + Math.pow(heightNum, 2));
                const redLineCm = stepHypotenuseCm * stepsNum;
                const blueLineCm = (treadNum * heightNum) / stepHypotenuseCm;
                const stringerWidthCm = blueLineCm + 16.5;
                const stringerAreaM2 = (redLineCm / 100) * (stringerWidthCm / 100) * 2;
                const stringerWeight = stringerAreaM2 * thicknessM * STEEL_DENSITY;

                const escadaWeight = stepsWeight + stringerWeight;
                const totalWeightKg = escadaWeight + landingsWeight;
                
                const escadaCost = escadaWeight * 13.80;
                const landingsCost = landingsWeight * 13.80;
                const totalCost = totalWeightKg * 13.80;

                med += `\nPESO APROX. (ESCADA): ${escadaWeight.toFixed(1)} kg\n`;
                med += `CUSTO AÇO (ESCADA): R$ ${escadaCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
                
                if (landingsWeight > 0) {
                    med += `PESO APROX. (PATAMAR): ${landingsWeight.toFixed(1)} kg\n`;
                    med += `CUSTO AÇO (PATAMAR): R$ ${landingsCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
                }
                
                med += `PESO TOTAL: ${totalWeightKg.toFixed(1)} kg\n`;
                med += `CUSTO TOTAL AÇO: R$ ${totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
            }
        } catch (e) {
            console.error("Erro ao calcular peso na tabela", e);
        }
        
        return med;
    };

    const getDefaultAttention = (parsedData: any) => {
        if (!parsedData) return '';
        let att = [];
        
        const landings = getProp(parsedData, 'landings');
        
        if (landings && landings.length > 0) {
            const hasArticulated = landings.some((l:any) => l.type === 'articulated');
            if (hasArticulated) att.push('PATAMAR RETRÁTIL');
            
            landings.forEach((l: any) => {
                if (l.frenchBrackets > 0) {
                    att.push(`(${l.frenchBrackets} mão francesa)`);
                }
            });
        }
        return att.join(' - ');
    };

    const getProp = (parsed: any, key: string) => {
        if (parsed?.selectedOption && parsed.selectedOption[key] !== undefined && parsed.selectedOption[key] !== '') return parsed.selectedOption[key];
        if (parsed?.inputData && parsed.inputData[key] !== undefined && parsed.inputData[key] !== '') return parsed.inputData[key];
        if (parsed && parsed[key] !== undefined && parsed[key] !== '') return parsed[key];
        return undefined;
    };

    const getFreightDimensions = (parsedData: any) => {
        if (!parsedData) return '';
        const extractNum = (val: any) => {
            if (typeof val === 'number') return val;
            if (typeof val === 'string') {
                const match = val.replace(',', '.').match(/[\d.]+/);
                return match ? Number(match[0]) : 0;
            }
            return 0;
        };
        
        const numSteps = extractNum(getProp(parsedData, 'steps') ?? getProp(parsedData, 'desiredSteps') ?? getProp(parsedData, 'degraus'));
        const treadDepthCm = extractNum(getProp(parsedData, 'treadDepth') ?? getProp(parsedData, 'treadDepthCm') ?? getProp(parsedData, 'pisante'));
        const stepHeightCm = extractNum(getProp(parsedData, 'stepHeight') ?? getProp(parsedData, 'stepHeightCm') ?? getProp(parsedData, 'altura'));
        const widthCm = extractNum(getProp(parsedData, 'stairWidth') ?? getProp(parsedData, 'widthCm') ?? getProp(parsedData, 'width') ?? getProp(parsedData, 'largura'));

        if (!numSteps || !treadDepthCm || !stepHeightCm) return '-';

        const optionalItems = getProp(parsedData, 'optionalItems');
        const maxHandrailHeightM = (optionalItems && optionalItems.some((i: any) => i.id === 'corrimao_aco')) ? 0.8 : 0;
        const pontasM = 0.20;
        
        const stepHypotenuseCm = Math.sqrt(Math.pow(treadDepthCm, 2) + Math.pow(stepHeightCm, 2));
        const blueLineCm = (treadDepthCm * stepHeightCm) / stepHypotenuseCm;
        const stringerWidthM = (blueLineCm + 16.5) / 100;
        
        // Matemática solicitada pelo usuário para Largura do Pacote de Frete
        const handrailCm = maxHandrailHeightM > 0 ? 80 : 0;
        const pacoteLarguraM = ((treadDepthCm + 1) + handrailCm + 16.5) / 100;
        const pacoteAlturaM = 0.08;

        const comprimentoMaximoM = (treadDepthCm * numSteps) / 100;
        const totalHeightM = (stepHeightCm * numSteps) / 100;
        const tamanhoViga = Math.sqrt(Math.pow(comprimentoMaximoM, 2) + Math.pow(totalHeightM, 2));
        const diagonalExata = tamanhoViga + maxHandrailHeightM + pontasM;

        // Weight
        const thicknessM = 3.0 / 1000;
        const STEEL_DENSITY = 7850;
        const stepAreaM2 = ((treadDepthCm + 6) / 100) * (widthCm / 100);
        const stepsWeight = stepAreaM2 * thicknessM * numSteps * STEEL_DENSITY;
        let landingsAreaM2 = 0;
        const landings = getProp(parsedData, 'landings');
        if (landings && landings.length > 0) {
            landings.forEach((l: any) => {
                const lLen = (Number(l.length) || 0) + 20;
                const lWid = (Number(l.width) || 0) + 20;
                landingsAreaM2 += (lLen * lWid) / 10000;
            });
        }
        const landingsWeight = landingsAreaM2 * (3.34 / 1000) * STEEL_DENSITY;
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
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white">Tabela de Entregas</h1>
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
                                <th className="p-4 font-bold text-gray-900 dark:text-gray-200 text-sm w-[15%]">CLIENTE</th>
                                <th className="p-4 font-bold text-gray-900 dark:text-gray-200 text-sm w-[20%]">LOCALIZAÇÃO</th>
                                <th className="p-4 font-bold text-gray-900 dark:text-gray-200 text-sm w-[12%]">DATA ENTREGA</th>
                                <th className="p-4 font-bold text-gray-900 dark:text-gray-200 text-sm w-[15%]">FRETE (MEDIDAS)</th>
                                <th className="p-4 font-bold text-gray-900 dark:text-gray-200 text-sm w-[18%]">ATENÇÃO</th>
                                <th className="p-4 font-bold text-gray-900 dark:text-gray-200 text-sm w-[20%]">FABRICAÇÃO</th>
                                <th className="p-4 font-bold text-gray-900 dark:text-gray-200 text-sm w-[7%] print-hidden">AÇÃO</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {contracts.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500 dark:text-gray-400 print-hidden">
                                        Nenhuma entrega em produção no momento.
                                    </td>
                                </tr>
                            ) : (
                                contracts.map(contract => {
                                    const data = parseContractData(contract.contractData);
                                    const address = contract.customAddress !== undefined ? contract.customAddress : getFullAddress(data?.userData);
                                    
                                    const attention = contract.deliveryNotes !== undefined ? contract.deliveryNotes : getDefaultAttention(data);
                                    let freightInfo = getFreightDimensions(data);
                                    if (contract.hingesQty !== undefined 
                                        && contract.hingesQty.trim() !== '-'
                                        && contract.hingesQty.trim() !== ''
                                        && !contract.hingesQty.toLowerCase().includes('dobradiça')
                                        && !contract.hingesQty.includes('QTD VOLUMES')
                                    ) {
                                        freightInfo = contract.hingesQty;
                                    }
                                    const measurements = contract.measurementsNotes || getMeasurements(data);
                                    
                                    const dateColor = getDateColorClass(contract.deliveryDate);
                                    
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
                                                <div className="text-sm font-semibold text-gray-500 print:text-[14px] print:font-bold px-2 mb-2">
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
                                                <div 
                                                    className="editable-cell whitespace-pre-line font-mono text-xs font-bold p-1 rounded bg-slate-100 dark:bg-slate-800 print:bg-white"
                                                    contentEditable
                                                    suppressContentEditableWarning
                                                    onBlur={(e) => {
                                                        if (e.target.innerText !== freightInfo) {
                                                            handleUpdateContract(contract.id, 'hingesQty', e.target.innerText);
                                                        }
                                                    }}
                                                >
                                                    {freightInfo}
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
                                                        if (e.target.innerText !== measurements) {
                                                            handleUpdateContract(contract.id, 'measurementsNotes', e.target.innerText);
                                                        }
                                                    }}
                                                >
                                                    {measurements}
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
