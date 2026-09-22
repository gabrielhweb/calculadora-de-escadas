import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ProductionOrder, SavedQuote, SavedContract, BoardStage, CustomCost } from '../types';
import { formatCurrencyBRL } from '../utils';
import { useAuth } from '../components/AuthProvider';
import { Link } from 'react-router-dom';
import ExtraCostsModal from '../components/ExtraCostsModal';
import { normalizeStr } from '../utils/fixDatabase';

enum OperationType {
  LIST = 'list',
  UPDATE = 'update',
  DELETE = 'delete'
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  console.error(`Firestore Error [${operationType}] on ${path}: `, error);
  // Removido o alert para não travar a tela com erros de permissão de coleções vazias/antigas
}

export interface DashboardItem {
  id: string;
  title: string;
  subtitle: string;
  stage: BoardStage;
  value: number;
  source: 'quote' | 'contract' | 'queue';
  profit?: number;
  cost?: number;
  customCosts?: CustomCost[];
  originalData: any;
  createdAt: string;
}

const STAGES: { id: BoardStage, label: string, color: string, headerColor: string }[] = [
    { id: 'orcamento', label: 'Orçamentos', color: 'bg-yellow-400 text-white', headerColor: 'border-yellow-400 text-yellow-600' },
    { id: 'contrato', label: 'Contrato assinado e pagamento inicial feito', color: 'bg-blue-500 text-white', headerColor: 'border-blue-500 text-blue-600' },
    { id: 'corte', label: 'Enviadas para corte a laser', color: 'bg-purple-600 text-white', headerColor: 'border-purple-600 text-purple-600' },
    { id: 'soldagem', label: 'Etapa Soldagem', color: 'bg-pink-500 text-white', headerColor: 'border-pink-500 text-pink-600' },
    { id: 'pronta', label: 'Escadas prontas', color: 'bg-orange-500 text-white', headerColor: 'border-orange-500 text-orange-600' },
    { id: 'concluido', label: 'Concluído', color: 'bg-green-500 text-white', headerColor: 'border-green-500 text-green-600' }
];

const QUICK_COSTS = [
    "Custo material (Jeferson)",
    "Custo material extra (parafusos..)",
    "Custo pedágio",
    "Custo gasolina",
    "Custo diária",
    "Custo comissão",
    "Custo imposto",
    "Custo alimentação"
];

export default function ProductionQueue() {
    const [items, setItems] = useState<DashboardItem[]>([]);
    const [timeFilter, setTimeFilter] = useState<'all' | 'month' | 'week'>('all');
    const [stageFilter, setStageFilter] = useState<'all' | BoardStage>('all');
    const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
    const { user } = useAuth();
    
    // States for custom costs input
    const [newCostName, setNewCostName] = useState('');
    const [newCostValue, setNewCostValue] = useState('');

    const [paidModalOpen, setPaidModalOpen] = useState(false);
    const [paidModalItem, setPaidModalItem] = useState<DashboardItem | null>(null);
    const [paidModalPercent, setPaidModalPercent] = useState('');
    const [paidModalValue, setPaidModalValue] = useState('');

    const [extraCostsModalOpen, setExtraCostsModalOpen] = useState(false);
    const [extraCostsModalItem, setExtraCostsModalItem] = useState<DashboardItem | null>(null);

    // Global settings for tax/commission
    const [globalSettings, setGlobalSettings] = useState({ taxPercentage: 0, commissionPercentage: 0 });
    const [rawContractsMap, setRawContractsMap] = useState<Record<string, any>>({});

    useEffect(() => {
        if (!user) return;
        getDoc(doc(db, 'settings', 'production_costs')).then(snap => {
            if (snap.exists()) {
                setGlobalSettings({
                    taxPercentage: snap.data().taxPercentage || 0,
                    commissionPercentage: snap.data().commissionPercentage || 0
                });
            }
        }).catch(e => console.error("Error fetching settings", e));
    }, [user]);

    useEffect(() => {
        if (!user) return;
        
        let loadedQuotes: DashboardItem[] = [];
        let loadedContracts: DashboardItem[] = [];
        let loadedQueue: DashboardItem[] = [];
        let rawContractsData: Record<string, any> = {};

        const updateItems = () => {
            const queueWithSyncedDates = loadedQueue.map(q => {
                if (q.originalData.contractId && rawContractsData[q.originalData.contractId]) {
                    const contractData = rawContractsData[q.originalData.contractId];
                    if (contractData.deliveryDate) {
                        q.originalData.deliveryDate = contractData.deliveryDate;
                    }
                    if (contractData.customAddress) {
                        q.originalData.location = contractData.customAddress;
                    } 
                    
                    if (contractData.contractData) {
                        try {
                            const parsed = JSON.parse(contractData.contractData);
                            q.originalData.parsedContractData = parsed;
                            
                            if (!q.originalData.location) {
                                const addr = parsed?.userData?.address;
                                if (addr && (addr.street || addr.city)) {
                                    q.originalData.location = `${addr.street || ''}, ${addr.number || ''} - ${addr.city || ''}`.replace(/^, /, '');
                                }
                            }
                        } catch(e){}
                    }
                    if (contractData.clientName && contractData.clientName !== 'NOVO CLIENTE (Editar)') {
                        q.title = contractData.clientName;
                    }
                    q.subtitle = q.originalData.location || `Data de Entrega: ${contractData.deliveryDate || 'N/A'}`;
                }
                return q;
            });

            const queueContractIds = new Set(loadedQueue.map(q => q.originalData?.contractId).filter(Boolean));
            const missingContracts = Object.keys(rawContractsData).filter(id => {
                const c = rawContractsData[id];
                return c.status === 'producao' && !queueContractIds.has(id);
            }).map(id => {
                const data = rawContractsData[id];
                return {
                    id: id,
                    title: data.clientName,
                    subtitle: 'Retroativo',
                    stage: 'contrato' as any,
                    value: data.totalValue || 0,
                    source: 'contract' as any,
                    originalData: data,
                    createdAt: data.createdAt
                };
            });

            let all = [...loadedQuotes, ...loadedContracts, ...queueWithSyncedDates, ...missingContracts];
            
            // Deduplicate by contractId to avoid ghosts where a contract is in queue and also matched incorrectly
            const seenContracts = new Set();
            const validNames = new Set();
            
            // First pass: collect all names from contracts and queue
            all.forEach(item => {
                if (item.source === 'contract' || item.source === 'queue') {
                    const name = normalizeStr(item.title);
                    if (name && name !== 'sem nome') {
                        validNames.add(name);
                    }
                }
            });

            all = all.filter(item => {
                const name = normalizeStr(item.title);
                
                // If it's a quote, hide it if a contract/queue item already exists with the same name
                if (item.source === 'quote') {
                    if (name && name !== 'sem nome' && validNames.has(name)) {
                        return false;
                    }
                    return true;
                }
                
                const cId = item.originalData?.contractId || item.id;
                if (cId && seenContracts.has(cId)) return false;
                if (cId) seenContracts.add(cId);
                return true;
            });
            
            all.sort((a, b) => {
                const dateA = a.originalData?.deliveryDate;
                const dateB = b.originalData?.deliveryDate;
                
                if (dateA && dateB) {
                    return new Date(dateA).getTime() - new Date(dateB).getTime();
                } else if (dateA) {
                    return -1;
                } else if (dateB) {
                    return 1;
                } else {
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                }
            });
            // COMPUTAR CUSTOS REAIS
            all = all.map(item => {
                let autoCost = 0;
                
                // Garantir pcd com extração profunda (mesma lógica do ContractsList)
                let pcd: any = item.originalData?.parsedContractData;
                if (!pcd && item.originalData?.contractData) {
                    pcd = item.originalData.contractData;
                }
                if (!pcd && item.source === 'quote') {
                    pcd = item.originalData;
                }
                
                let maxIters = 5;
                while (typeof pcd === 'string' && maxIters > 0) {
                    try { pcd = JSON.parse(pcd); } catch(e) { break; }
                    maxIters--;
                }
                if (pcd?.contractData) {
                    pcd = pcd.contractData;
                    maxIters = 5;
                    while (typeof pcd === 'string' && maxIters > 0) {
                        try { pcd = JSON.parse(pcd); } catch(e) { break; }
                        maxIters--;
                    }
                }
                if (item.originalData) item.originalData.parsedContractData = pcd;
                
                let val = item.value || 0;
                if (val === 0) {
                    if (pcd?.totalValue) val = pcd.totalValue;
                    else if (pcd?.selectedOption?.totalPrice) val = pcd.selectedOption.totalPrice;
                    else if (pcd?.finalStairPrice) val = (pcd.finalStairPrice || 0) + (pcd.finalLandingsPrice || 0);
                    else if (item.originalData?.totalValue) val = item.originalData.totalValue;
                }
                item.value = val;
                
                // Calculo de chapas, patamar e tubos
                if (pcd) {
                    const STEEL_PRICE_PER_KG = 13.80;
                    const TUBE_PRICE_PER_METER = 10;
                    let totalTubosLinear = 0;
                    let pesoAcoKg = 0;
                    
                    if (pcd.landings) {
                        pcd.landings.forEach((l: any) => {
                            // Guarda-corpo
                            if (l.hasGuardrail) {
                            const numSides = l.guardrailFormat === 'U' ? 3 : l.guardrailFormat === 'L' ? 2 : 1;
                            const totalLinear = (l.guardrailLength || 0) + (numSides >= 2 ? (l.guardrailLength2 || 0) : 0) + (numSides >= 3 ? (l.guardrailLength3 || 0) : 0);
                            const h = l.guardrailHeight || 90;
                            
                            const innerL1 = Math.max(0, (l.guardrailLength || 0) - 6);
                            const t1 = Math.max(2, Math.max(1, Math.round(innerL1 / 15)) + 1);
                            const hL1 = ((h - 6) / 100) * t1;
                            
                            let hL2 = 0;
                            if (numSides >= 2) {
                                const innerL2 = Math.max(0, (l.guardrailLength2 || 0) - 6);
                                const t2 = Math.max(2, Math.max(1, Math.round(innerL2 / 15)) + 1);
                                hL2 = ((h - 6) / 100) * t2;
                            }
                            
                            let hL3 = 0;
                            if (numSides >= 3) {
                                const innerL3 = Math.max(0, (l.guardrailLength3 || 0) - 6);
                                const t3 = Math.max(2, Math.max(1, Math.round(innerL3 / 15)) + 1);
                                hL3 = ((h - 6) / 100) * t3;
                            }
                            
                            const totalVertical = hL1 + hL2 + hL3;
                            const baseLinear = (totalLinear / 100) * 2; // 2 barras horizontais
                            totalTubosLinear += totalVertical + baseLinear;
                        }
                        
                        // Portão
                        if (l.hasGate && l.gateLength > 0 && l.gateHeight > 0) {
                            const gateLen = l.gateLength;
                            const gateH = l.gateHeight;
                            const innerL = Math.max(0, gateLen - 6);
                            const t = Math.max(2, Math.max(1, Math.round(innerL / 15)) + 1);
                            
                            const horiz = (gateLen / 100) * 2;
                            const vert = ((gateH - 6) / 100) * t;
                            totalTubosLinear += horiz + vert;
                        }
                        });
                    }
                    
                    // Calcular Peso do Aço (Baseado no DeliveriesTable.tsx)
                    const STEEL_DENSITY = 7850;
                    const thicknessM = 3.0 / 1000;
                    
                    const getProp = (parsed: any, key: string) => {
                        if (parsed?.selectedOption && parsed.selectedOption[key] !== undefined && parsed.selectedOption[key] !== '') return parsed.selectedOption[key];
                        if (parsed?.inputData && parsed.inputData[key] !== undefined && parsed.inputData[key] !== '') return parsed.inputData[key];
                        if (parsed && parsed[key] !== undefined && parsed[key] !== '') return parsed[key];
                        return undefined;
                    };
                    
                    const treadNum = Number(getProp(pcd, 'treadDepth')) || Number(getProp(pcd, 'treadDepthCm')) || Number(getProp(pcd, 'pisante')) || 0;
                    const heightNum = Number(getProp(pcd, 'stepHeight')) || Number(getProp(pcd, 'stepHeightCm')) || Number(getProp(pcd, 'altura')) || 0;
                    const widthNum = Number(getProp(pcd, 'stairWidth')) || Number(getProp(pcd, 'widthCm')) || Number(getProp(pcd, 'largura')) || 0;
                    const stepsNum = Number(getProp(pcd, 'structureSteps')) || Number(getProp(pcd, 'steps')) || Number(getProp(pcd, 'desiredSteps')) || Number(getProp(pcd, 'totalSteps')) || Number(getProp(pcd, 'degraus')) || 0;
                    
                    if (treadNum > 0 && heightNum > 0 && widthNum > 0 && stepsNum > 0) {
                        const stepAreaM2 = ((treadNum + 6) / 100) * (widthNum / 100);
                        const stepsWeight = stepAreaM2 * thicknessM * stepsNum * STEEL_DENSITY;
                        
                        let landingsAreaM2 = 0;
                        const landingsList = getProp(pcd, 'landings');
                        if (landingsList && landingsList.length > 0) {
                            landingsList.forEach((l: any) => {
                                const lLen = (Number(l.length) || 0) + 20;
                                const lWid = (Number(l.width) || 0) + 20;
                                landingsAreaM2 += (lLen * lWid) / 10000;
                            });
                        }
                        const landingsWeight = landingsAreaM2 * (3.34 / 1000) * STEEL_DENSITY;
                        
                        const stepHypotenuseCm = Math.sqrt(Math.pow(treadNum, 2) + Math.pow(heightNum, 2));
                        const redLineCm = stepHypotenuseCm * stepsNum;
                        const blueLineCm = (treadNum * heightNum) / stepHypotenuseCm;
                        const stringerWidthCm = blueLineCm + 16.5;
                        const stringerAreaM2 = (redLineCm / 100) * (stringerWidthCm / 100) * 2;
                        const stringerWeight = stringerAreaM2 * thicknessM * STEEL_DENSITY;
                        
                        const escadaWeight = stepsWeight + stringerWeight;
                        pesoAcoKg = escadaWeight + landingsWeight;
                    }
                    
                    autoCost += (totalTubosLinear * TUBE_PRICE_PER_METER) + (pesoAcoKg * STEEL_PRICE_PER_KG);
                }

                // Extras + Legacy
                let extraCostsTotal = 0;
                if (item.originalData?.extraCosts) {
                    extraCostsTotal = item.originalData.extraCosts.reduce((acc: number, c: any) => acc + (c.total || 0), 0);
                }
                
                let legacyCustomTotal = 0;
                if ((item as any).customCosts) {
                    legacyCustomTotal = (item as any).customCosts.reduce((acc: number, c: any) => acc + (c.value || 0), 0);
                }

                // Add built-in costs from the contract if they exist (Freight, Toll, Installation, etc)
                let builtinCosts = 0;
                if (pcd) {
                    builtinCosts += Number(pcd.freightCost) || 0;
                    builtinCosts += Number(pcd.tollCost) || 0;
                    builtinCosts += Number(pcd.installationCost) || 0;
                    builtinCosts += Number(pcd.extrasCost) || 0;
                }
                
                // Taxes & Commissions
                const finalVal = item.value || 0;
                const taxCost = finalVal * (globalSettings.taxPercentage / 100);
                const commCost = finalVal * (globalSettings.commissionPercentage / 100);
                
                const finalTotalCost = autoCost + extraCostsTotal + legacyCustomTotal + builtinCosts + taxCost + commCost;
                const finalProfit = finalVal - finalTotalCost;

                return {
                    ...item,
                    cost: finalTotalCost,
                    profit: finalProfit
                };
            });
            setItems(all);
        };

        const unSubQuotes = onSnapshot(query(collection(db, 'saved_quotes')), (snapshot) => {
            loadedQuotes = [];
            snapshot.forEach(docSnap => {
                const data = docSnap.data() as SavedQuote;
                loadedQuotes.push({
                    id: docSnap.id,
                    title: data.clientName || 'Sem nome',
                    subtitle: `Orçamento Salvo`,
                    stage: 'orcamento',
                    value: (data.inputData?.totalHeight || 0) * 100, 
                    source: 'quote',
                    originalData: data,
                    createdAt: data.createdAt
                });
            });
            updateItems();
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'saved_quotes'));

        const unSubContracts = onSnapshot(query(collection(db, 'contracts')), (snapshot) => {
            loadedContracts = [];
            rawContractsData = {};
            snapshot.forEach(docSnap => {
                const data = docSnap.data() as SavedContract;
                rawContractsData[docSnap.id] = data;
                if (data.status === 'falta_assinar') {
                    loadedContracts.push({
                        id: docSnap.id,
                        title: data.clientName,
                        subtitle: `A Assinar`,
                        stage: 'contrato',
                        value: data.totalValue || 0,
                        source: 'contract',
                        originalData: data,
                        createdAt: data.createdAt
                    });
                }
            });
            setRawContractsMap(rawContractsData);
            updateItems();
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'contracts'));

        const unSubQueue = onSnapshot(query(collection(db, 'production_queue')), (snapshot) => {
            loadedQueue = [];
            snapshot.forEach(docSnap => {
                const data = docSnap.data() as ProductionOrder;
                let stage = data.boardStage || 'corte';
                if (data.status === 'completed') stage = 'concluido';

                loadedQueue.push({
                    id: docSnap.id,
                    title: data.clientName,
                    subtitle: data.location || `Data de Entrega: ${data.deliveryDate || 'N/A'}`,
                    stage: stage,
                    value: (data.downPayment || 0) + (data.balanceDue || 0),
                    source: 'queue',
                    profit: data.profit || 0,
                    cost: data.totalCost || 0,
                    customCosts: data.customCosts || [],
                    originalData: data,
                    createdAt: data.createdAt
                });
            });
            updateItems();
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'production_queue'));

        return () => {
            unSubQuotes();
            unSubContracts();
            unSubQueue();
        };
    }, [user, globalSettings]);

    // Filtering Logic
    const filteredItems = items.filter(item => {
        if (stageFilter !== 'all' && item.stage !== stageFilter) {
            return false;
        }

        if (timeFilter === 'all') return true;
        const itemDate = new Date(item.createdAt);
        const today = new Date();
        
        if (timeFilter === 'month') {
            return itemDate.getMonth() === today.getMonth() && itemDate.getFullYear() === today.getFullYear();
        } else if (timeFilter === 'week') {
            const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
            return itemDate >= firstDayOfWeek;
        }
        return true;
    });

    const revenueItems = filteredItems.filter(i => i.source === 'queue' || i.source === 'contract');
    const totalRevenue = revenueItems.reduce((acc, i) => acc + (i.value || 0), 0);
    const totalProfit = revenueItems.reduce((acc, i) => acc + (i.profit || 0), 0);
    const totalCost = revenueItems.reduce((acc, i) => acc + (i.cost || 0), 0);

    const handleAddCost = async (item: DashboardItem, name: string, strValue: string) => {
        if (!name || !strValue) return;
        const val = parseFloat(strValue);
        if (isNaN(val)) return;

        const newCost: CustomCost = {
            id: Date.now().toString(),
            name: name,
            value: val
        };

        const existingCosts = item.customCosts || [];
        const updatedCosts = [...existingCosts, newCost];
        
        const oldTotalCost = item.cost || 0;
        const newTotalCost = oldTotalCost + val;
        const oldProfit = item.profit || 0;
        const newProfit = oldProfit - val;

        try {
            await updateDoc(doc(db, 'production_queue', item.id), {
                customCosts: updatedCosts,
                totalCost: newTotalCost,
                profit: newProfit
            });
            if (name === newCostName) {
                setNewCostName('');
                setNewCostValue('');
            }
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, 'production_queue');
        }
    };

    const handleDeleteCost = async (item: DashboardItem, costId: string) => {
        const costToRemove = item.customCosts?.find(c => c.id === costId);
        if (!costToRemove) return;

        const updatedCosts = item.customCosts?.filter(c => c.id !== costId) || [];
        const val = costToRemove.value;
        const newTotalCost = (item.cost || 0) - val;
        const newProfit = (item.profit || 0) + val;

        try {
            await updateDoc(doc(db, 'production_queue', item.id), {
                customCosts: updatedCosts,
                totalCost: newTotalCost,
                profit: newProfit
            });
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, 'production_queue');
        }
    };

    const openPaidModal = (item: DashboardItem, currentPercent: number) => {
        if (item.source !== 'queue') return;
        setPaidModalItem(item);
        
        let initialValue = item.originalData.customPaidValue !== undefined && item.originalData.customPaidValue !== null
            ? item.originalData.customPaidValue
            : ((item.originalData.downPayment || 0) + (item.originalData.balanceStatus === 'paid' ? item.originalData.balanceDue : 0));
        
        setPaidModalValue(initialValue > 0 ? initialValue.toString() : '');
        setPaidModalPercent(currentPercent > 0 ? currentPercent.toFixed(2) : '');
        setPaidModalOpen(true);
    };

    const savePaidModal = async (valueToSave: number | null) => {
        if (!paidModalItem) return;
        try {
            await updateDoc(doc(db, 'production_queue', paidModalItem.id), {
                customPaidValue: valueToSave
            });
            setPaidModalOpen(false);
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, 'production_queue');
        }
    };

    const fixQueueLink = async (item: DashboardItem) => {
        try {
            let tVal = Number(item.originalData?.totalValue);
            if (isNaN(tVal)) tVal = 0;
            
            const newOrder: any = {
                contractId: item.id,
                createdAt: new Date().toISOString(),
                clientName: item.title || 'Sem Nome',
                deliveryDate: item.originalData?.deliveryDate || '',
                downPayment: tVal / 2,
                balanceDue: tVal / 2,
                status: 'in_queue',
                boardStage: 'contrato',
                location: item.originalData?.location || item.originalData?.customAddress || 'N/A',
                installments: [],
                paidInstallments: 0
            };
            
            Object.keys(newOrder).forEach(k => {
                if (newOrder[k] === undefined) delete newOrder[k];
            });
            
            await setDoc(doc(db, 'production_queue', Date.now().toString() + '_queue'), newOrder);
            alert("Vínculo criado com sucesso! Agora você pode editar as datas, o estágio e ver a ficha.");
        } catch (e) {
            console.error(e);
            alert("Erro ao criar vínculo com a fila.");
        }
    };

    const moveItem = async (item: DashboardItem, newStage: BoardStage) => {
        try {
            if (item.source === 'queue') {
                const updates: any = { boardStage: newStage };
                if (newStage === 'concluido') updates.status = 'completed';
                else updates.status = 'in_queue';
                await updateDoc(doc(db, 'production_queue', item.id), updates);
            } else {
                alert('Acesse Meus Contratos para gerar a ordem de produção deste contrato.');
            }
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, `move_item`);
        }
    };

    const handleUpdateDeliveryDate = async (item: DashboardItem, newDate: string) => {
        try {
            if (item.source === 'queue') {
                // Atualiza na fila
                await updateDoc(doc(db, 'production_queue', item.id), { deliveryDate: newDate });
                // Tenta atualizar no contrato, se falhar (ex: contrato deletado), ignora
                if (item.originalData.contractId) {
                    try {
                        await updateDoc(doc(db, 'contracts', item.originalData.contractId), { deliveryDate: newDate });
                    } catch (e) {
                        console.warn('Contrato original no encontrado para sincronizar data.', e);
                    }
                }
            } else if (item.source === 'contract') {
                // Se for um contrato rfo (Retroativo)
                await updateDoc(doc(db, 'contracts', item.id), { deliveryDate: newDate });
            }
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, 'sync_delivery_date');
        }
    };

    const handleUpdateField = async (item: DashboardItem, field: 'clientName' | 'location', value: string) => {
        try {
            if (item.source === 'queue') {
                await updateDoc(doc(db, 'production_queue', item.id), { [field]: value });
                if (item.originalData.contractId) {
                    if (field === 'location') {
                        await updateDoc(doc(db, 'contracts', item.originalData.contractId), { customAddress: value });
                    } else if (field === 'clientName') {
                        await updateDoc(doc(db, 'contracts', item.originalData.contractId), { clientName: value });
                    }
                }
            } else if (item.source === 'contract') {
                if (field === 'location') {
                    await updateDoc(doc(db, 'contracts', item.id), { customAddress: value });
                } else if (field === 'clientName') {
                    await updateDoc(doc(db, 'contracts', item.id), { clientName: value });
                }
            }
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, `sync_${field}`);
        }
    };

    const handleDeleteOrder = async (item: DashboardItem) => {
        if (!window.confirm(`Tem certeza que deseja EXCLUIR definitivamente o item "${item.title}" da fila de produção?`)) return;
        try {
            const { deleteDoc } = await import('firebase/firestore');
            if (item.source === 'queue') {
                await deleteDoc(doc(db, 'production_queue', item.id));
            } else if (item.source === 'contract') {
                await deleteDoc(doc(db, 'contracts', item.id));
            } else if (item.source === 'quote') {
                await deleteDoc(doc(db, 'saved_quotes', item.id));
            }
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, 'delete_order');
        }
    };

    if (!user) {
        return (
            <div className="max-w-7xl mx-auto p-4 sm:p-6 flex flex-col items-center justify-center h-[50vh]">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Acesso Restrito</h2>
            </div>
        );
    }

    // Group items by stage
    const groupedItems: Record<string, DashboardItem[]> = {};
    STAGES.forEach(s => groupedItems[s.id] = []);
    filteredItems.forEach(item => {
        if (groupedItems[item.stage]) groupedItems[item.stage].push(item);
    });

    return (
        <div className="max-w-[1400px] mx-auto p-4 sm:p-6 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    Controle de Contratos
                </h1>
                
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={async () => {
                            if (!window.confirm('Calcular frete via IA para TODOS os contratos que ainda não tem frete calculado? Isso pode demorar alguns minutos.')) return;
                            
                            const { getRouteInfoFromGemini } = await import('../utils');
                            const { updateDoc, doc } = await import('firebase/firestore');
                            const { db } = await import('../firebase');
                            
                            let count = 0;
                            let errors = 0;
                            
                            // Get items that don't have freightCost in pcd and have a valid address
                            const toUpdate = items.filter(i => {
                                if (i.source !== 'queue') return false;
                                const pcd = i.originalData?.parsedContractData || i.originalData?.contractData;
                                if (pcd && pcd.freightCost > 0) return false; // Already has it
                                const addr = i.originalData?.location;
                                return addr && addr !== 'N/A' && addr.trim().length > 5;
                            });

                            if (toUpdate.length === 0) {
                                alert('Nenhum contrato antigo elegível para cálculo (ou todos já têm frete).');
                                return;
                            }
                            
                            alert(`Iniciando cálculo para ${toUpdate.length} contratos. Por favor, aguarde e não feche a página!`);

                            for (const item of toUpdate) {
                                try {
                                    const addr = item.originalData.location;
                                    const { distance, tolls } = await getRouteInfoFromGemini('13104-096', addr);
                                    
                                    if (distance > 0) {
                                        const fuelPrice = 6.20;
                                        const consumption = 7;
                                        const distanceCost = (distance * 2 / consumption) * fuelPrice;
                                        const totalTolls = tolls * 2;
                                        const finalFreight = distanceCost + totalTolls;
                                        
                                        const pcd = item.originalData?.parsedContractData || item.originalData?.contractData || {};
                                        pcd.freightCost = finalFreight;
                                        
                                        await updateDoc(doc(db, 'production_queue', item.id), {
                                            contractData: pcd
                                        });
                                        count++;
                                    }
                                } catch(e) {
                                    console.error(e);
                                    errors++;
                                }
                                
                                // Sleep 1.5s to avoid rate limits
                                await new Promise(r => setTimeout(r, 1500));
                            }
                            
                            alert(`Concluído! ${count} fretes calculados com sucesso. ${errors} erros.`);
                            window.location.reload();
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-800 rounded-lg px-4 py-2 text-sm font-bold shadow-sm transition-colors"
                    >
                        Calcular Fretes Antigos (IA)
                    </button>
                    <select 
                        value={stageFilter}
                        onChange={(e) => setStageFilter(e.target.value as any)}
                        className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-highlight"
                    >
                        <option value="all">Todas as Etapas</option>
                        {STAGES.map(s => <option key={s.id} value={s.id} className={`${s.color.split(' ')[0]} ${s.color.split(' ')[1]}`}>{s.label}</option>)}
                    </select>
                    <select 
                        value={timeFilter}
                        onChange={(e) => setTimeFilter(e.target.value as any)}
                        className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-highlight"
                    >
                        <option value="week">Esta Semana</option>
                        <option value="month">Este Mês</option>
                        <option value="all">Período Geral</option>
                    </select>
                </div>
            </div>

            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col">
                    <span className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Pedidos Fechados</span>
                    <span className="text-3xl font-black text-gray-900 dark:text-white">{revenueItems.length}</span>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col">
                    <span className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Faturamento Bruto</span>
                    <span className="text-3xl font-black text-blue-600 dark:text-blue-400">{formatCurrencyBRL(totalRevenue)}</span>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col">
                    <span className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Custos Produção</span>
                    <span className="text-3xl font-black text-red-500 dark:text-red-400">{formatCurrencyBRL(totalCost)}</span>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col">
                    <span className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Lucro Líquido</span>
                    <span className="text-3xl font-black text-green-500 dark:text-green-400">{formatCurrencyBRL(totalProfit)}</span>
                </div>
            </div>

            {/* Board Layout */}
            <div className="flex flex-col gap-8">
                {STAGES.map(stageGroup => {
                    const groupItems = groupedItems[stageGroup.id];
                    if (groupItems.length === 0 && stageFilter !== 'all') return null;

                    return (
                        <div key={stageGroup.id} className="flex flex-col">
                            {/* Group Header */}
                            <div className="flex items-center gap-2 mb-2 px-2">
                                <div className={`w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${stageGroup.color.split(' ')[0]}`}></div>
                                <h3 className={`text-lg font-bold ${stageGroup.headerColor.split(' ')[1]}`}>
                                    {stageGroup.label} <span className="text-gray-400 dark:text-gray-500 text-sm font-normal ml-2">{groupItems.length} Tarefa{groupItems.length !== 1 && 's'}</span>
                                </h3>
                            </div>

                            {/* Table */}
                            <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border-l-4 ${stageGroup.headerColor.split(' ')[0]} border-y border-r border-y-gray-200 border-r-gray-200 dark:border-y-gray-700 dark:border-r-gray-700 overflow-x-auto`}>
                                <table className="w-full text-sm text-left">
                                    <thead className="text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                                        <tr>
                                            <th className="px-4 py-3 font-normal w-10"></th>
                                            <th className="px-4 py-3 font-normal min-w-[200px]">Tarefa</th>
                                            <th className="px-4 py-3 font-normal w-40 text-center">Status</th>
                                            <th className="px-4 py-3 font-normal">Local</th>
                                            <th className="px-4 py-3 font-normal w-32">Data entrega</th>
                                            <th className="px-4 py-3 font-normal text-right">Valor venda</th>
                                            <th className="px-4 py-3 font-normal w-32 text-center">PAGO</th>
                                            <th className="px-4 py-3 font-normal text-center">Lucro</th>
                                            <th className="px-2 py-3 font-normal w-10 text-center">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                        {groupItems.length === 0 ? (
                                            <tr>
                                                <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                                                    Nenhuma tarefa nesta etapa.
                                                </td>
                                            </tr>
                                        ) : (
                                            groupItems.map(item => {
                                                const isExpanded = expandedItemId === item.id;
                                                
                                                // Compute PAGO percentage
                                                let percentPaid = 0;
                                                if (item.source === 'quote') percentPaid = 0;
                                                else if (item.source === 'queue' && item.originalData) {
                                                    const paid = item.originalData.customPaidValue !== undefined && item.originalData.customPaidValue !== null
                                                        ? item.originalData.customPaidValue
                                                        : ((item.originalData.downPayment || 0) + 
                                                          (item.originalData.balanceStatus === 'paid' ? item.originalData.balanceDue : 0));
                                                    percentPaid = item.value > 0 ? (paid / item.value) * 100 : 0;
                                                }

                                                return (
                                                    <React.Fragment key={item.id}>
                                                        {/* Row */}
                                                        <tr className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors group">
                                                            <td className="px-4 py-3">
                                                                <div className="w-4 h-4 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"></div>
                                                            </td>
                                                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                                                <div 
                                                                    contentEditable={item.source === 'queue' || item.source === 'contract'}
                                                                    suppressContentEditableWarning
                                                                    onBlur={(e) => {
                                                                        if (e.target.innerText !== item.title) {
                                                                            handleUpdateField(item, 'clientName', e.target.innerText);
                                                                        }
                                                                    }}
                                                                    className={`px-2 py-1 ${item.source === 'quote' ? '' : 'editable-cell'}`}
                                                                >
                                                                    {item.title}
                                                                </div>
                                                                {item.source === 'contract' && (
                                                                    <button 
                                                                        onClick={() => fixQueueLink(item)}
                                                                        className="ml-2 mt-1 text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded border border-red-200 hover:bg-red-200"
                                                                        title="Falta vínculo com a fila. Clique para corrigir."
                                                                    >
                                                                        Corrigir Vínculo
                                                                    </button>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                {item.source === 'queue' ? (
                                                                    <select 
                                                                        value={item.stage}
                                                                        onChange={(e) => moveItem(item, e.target.value as BoardStage)}
                                                                        className={`w-full py-1.5 px-2 rounded text-center text-xs font-bold shadow-sm outline-none cursor-pointer appearance-none ${stageGroup.color}`}
                                                                    >
                                                                        {STAGES.map(s => <option key={s.id} value={s.id} className="bg-white text-gray-900">{s.label}</option>)}
                                                                    </select>
                                                                ) : (
                                                                    <div className={`w-full py-1.5 px-2 rounded text-center text-xs font-bold shadow-sm ${stageGroup.color}`}>
                                                                        {stageGroup.label}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                                                                <div 
                                                                    contentEditable={item.source === 'queue' || item.source === 'contract'}
                                                                    suppressContentEditableWarning
                                                                    onBlur={(e) => {
                                                                        const currentLoc = item.originalData.location || 'N/A';
                                                                        if (e.target.innerText !== currentLoc && e.target.innerText !== 'N/A') {
                                                                            handleUpdateField(item, 'location', e.target.innerText);
                                                                        }
                                                                    }}
                                                                    className={`px-2 py-1 ${item.source === 'quote' ? '' : 'editable-cell'}`}
                                                                >
                                                                    {item.originalData.location || 'N/A'}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                {item.source === 'queue' ? (
                                                                    <input 
                                                                        type="date"
                                                                        value={item.originalData.deliveryDate || ''}
                                                                        onChange={(e) => handleUpdateDeliveryDate(item, e.target.value)}
                                                                        className="w-full text-xs bg-transparent border-none p-0 focus:ring-0 text-gray-700 dark:text-gray-300 cursor-pointer"
                                                                    />
                                                                ) : (
                                                                    <span className="text-gray-400">-</span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300">
                                                                {formatCurrencyBRL(item.value)}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div 
                                                                    onClick={(e) => { e.stopPropagation(); openPaidModal(item, percentPaid); }}
                                                                    className={`w-full h-6 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden relative flex items-center justify-center ${item.source === 'queue' ? 'cursor-pointer hover:ring-2 hover:ring-pink-400' : ''}`}
                                                                    title={item.source === 'queue' ? 'Clique para editar o valor pago manualmente' : ''}
                                                                >
                                                                    <div className={`absolute top-0 left-0 h-full transition-all ${percentPaid >= 100 ? 'bg-green-500' : 'bg-pink-500'}`} style={{ width: `${Math.min(100, Math.max(0, percentPaid))}%`}}></div>
                                                                    <span className="relative z-10 text-[10px] font-bold text-white drop-shadow-md">
                                                                        {percentPaid >= 100 ? '100% PAGO' : percentPaid > 0 ? `${percentPaid.toFixed(0)}% PAGO` : ''}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <button 
                                                                    onClick={() => {
                                                                        if (item.source === 'queue' || item.source === 'contract') {
                                                                            setExpandedItemId(isExpanded ? null : item.id);
                                                                        }
                                                                    }}
                                                                    className={`flex items-center justify-center w-full gap-1 p-1 rounded transition-colors ${(item.source === 'queue' || item.source === 'contract') ? (isExpanded ? 'bg-gray-200 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer') : 'cursor-default'}`}
                                                                >
                                                                    <span className="font-bold text-green-600 dark:text-green-400 text-xs">
                                                                        {formatCurrencyBRL(item.profit || 0)}
                                                                    </span>
                                                                    {(item.source === 'queue' || item.source === 'contract') && (
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                                                                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                        </svg>
                                                                    )}
                                                                </button>
                                                            </td>
                                                            <td className="px-2 py-3 text-center">
                                                                <button 
                                                                    onClick={() => handleDeleteOrder(item)}
                                                                    className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30"
                                                                    title="Excluir Definitivamente"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                    </svg>
                                                                </button>
                                                            </td>
                                                        </tr>

                                                        {/* Expanded Area for Costs */}
                                                        {isExpanded && item.source === 'queue' && (
                                                            <tr>
                                                                <td colSpan={9} className="p-0 border-b border-gray-200 dark:border-gray-700">
                                                                    <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-6 shadow-inner border-y border-indigo-100 dark:border-indigo-800/50 flex flex-col gap-6">
                                                                        
                                                                        {/* Top: Resumo do Projeto */}
                                                                        {item.originalData?.parsedContractData?.landings && (
                                                                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-indigo-100 dark:border-indigo-800/50">
                                                                                <h4 className="font-bold text-gray-900 dark:text-white mb-3 text-sm flex items-center gap-2">
                                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                                                                                        <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm11 1H6v8l4-2 4 2V6z" clipRule="evenodd" />
                                                                                    </svg>
                                                                                    Resumo de Produção (Tubos)
                                                                                </h4>
                                                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                                                    {item.originalData.parsedContractData.landings.map((l: any, i: number) => {
                                                                                        if (!l.hasGuardrail && !l.hasGate) return null;
                                                                                        
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

                                                                                        let gMed = '';
                                                                                        if (l.hasGuardrail) {
                                                                                            const numSides = l.guardrailFormat === 'U' ? 3 : l.guardrailFormat === 'L' ? 2 : 1;
                                                                                            let totalOverallBars = 0;
                                                                                            let segmentsText: string[] = [];
                                                                                            const sideNames = l.guardrailSide ? l.guardrailSide.split(/ e |, /) : [];
                                                                                            const sName1 = sideNames[0] ? ` (${sideNames[0]})` : '';
                                                                                            const sName2 = sideNames[1] ? ` (${sideNames[1]})` : '';
                                                                                            const sName3 = sideNames[2] ? ` (${sideNames[2]})` : '';
                                                                                            const totalLinear = (l.guardrailLength || 0) + (numSides >= 2 ? (l.guardrailLength2 || 0) : 0) + (numSides >= 3 ? (l.guardrailLength3 || 0) : 0);
                                                                                            
                                                                                            const gPrice = l.guardrailPricePerMeter !== undefined ? l.guardrailPricePerMeter : 50;
                                                                                            const h = l.guardrailHeight || 90;
                                                                                            let totalPrice = 0;
                                                                                            let trueLinear1 = 0, trueLinear2 = 0, trueLinear3 = 0;

                                                                                            const seg1 = calcSeg(l.guardrailLength || 0, l.guardrailBarsOverride);
                                                                                            if (seg1) { 
                                                                                                totalOverallBars += seg1.totalBars; 
                                                                                                const gap1 = l.guardrailGapOverride !== undefined ? l.guardrailGapOverride : parseFloat(seg1.exactGap.toFixed(1));
                                                                                                trueLinear1 = Math.round((seg1.totalBars * h) + (2 * (l.guardrailLength || 0)));
                                                                                                const price1 = Math.round((trueLinear1 / 100) * 10);
                                                                                                totalPrice += price1;
                                                                                                segmentsText.push(`Lado 1${sName1}: Comp. ${l.guardrailLength || 0}cm | Comp. Linear ${trueLinear1}cm | Altura ${h}cm (${seg1.totalBars}t/vãos ${gap1}cm) - R$ ${price1}`); 
                                                                                            }
                                                                                            if (numSides >= 2) { 
                                                                                                const seg2 = calcSeg(l.guardrailLength2 || 0, l.guardrailBarsOverride2); 
                                                                                                if (seg2) { 
                                                                                                    totalOverallBars += seg2.totalBars - 1; 
                                                                                                    const gap2 = l.guardrailGapOverride2 !== undefined ? l.guardrailGapOverride2 : parseFloat(seg2.exactGap.toFixed(1));
                                                                                                    trueLinear2 = Math.round((seg2.totalBars * h) + (2 * (l.guardrailLength2 || 0)));
                                                                                                    const price2 = Math.round((trueLinear2 / 100) * 10);
                                                                                                    totalPrice += price2;
                                                                                                    segmentsText.push(`Lado 2${sName2}: Comp. ${l.guardrailLength2 || 0}cm | Comp. Linear ${trueLinear2}cm | Altura ${h}cm (${seg2.totalBars}t/vãos ${gap2}cm) - R$ ${price2}`); 
                                                                                                } 
                                                                                            }
                                                                                            if (numSides >= 3) { 
                                                                                                const seg3 = calcSeg(l.guardrailLength3 || 0, l.guardrailBarsOverride3); 
                                                                                                if (seg3) { 
                                                                                                    totalOverallBars += seg3.totalBars - 1; 
                                                                                                    const gap3 = l.guardrailGapOverride3 !== undefined ? l.guardrailGapOverride3 : parseFloat(seg3.exactGap.toFixed(1));
                                                                                                    trueLinear3 = Math.round((seg3.totalBars * h) + (2 * (l.guardrailLength3 || 0)));
                                                                                                    const price3 = Math.round((trueLinear3 / 100) * 10);
                                                                                                    totalPrice += price3;
                                                                                                    segmentsText.push(`Lado 3${sName3}: Comp. ${l.guardrailLength3 || 0}cm | Comp. Linear ${trueLinear3}cm | Altura ${h}cm (${seg3.totalBars}t/vãos ${gap3}cm) - R$ ${price3}`); 
                                                                                                } 
                                                                                            }
                                                                                            const totalGuardrailLinear = trueLinear1 + trueLinear2 + trueLinear3;
                                                                                            let gateTrueLinear = 0;
                                                                                            let gateBars = 0;
                                                                                            let gatePriceTotal = 0;

                                                                                            if (l.hasGate && l.gateLength > 0 && l.gateHeight > 0) {
                                                                                                const gateLen = l.gateLength || 0;
                                                                                                const gateH = l.gateHeight || 90;
                                                                                                let innerL = gateLen - 6;
                                                                                                if (innerL < 0) innerL = 0;
                                                                                                const baseGaps = Math.max(1, Math.round(innerL / 15));
                                                                                                gateBars = l.gateBarsOverride !== undefined ? l.gateBarsOverride : (baseGaps + 1);
                                                                                                gateBars = Math.max(2, gateBars);
                                                                                                gateTrueLinear = Math.round((gateBars * gateH) + (2 * gateLen));
                                                                                                gatePriceTotal = Math.round((gateTrueLinear / 100) * 10);
                                                                                            }

                                                                                            const totalWithGate = totalGuardrailLinear + gateTrueLinear;
                                                                                            const compText = l.hasGate ? `Comp. Total ${totalLinear}cm | Comp. Linear G.Corpo: ${totalGuardrailLinear}cm (Total c/ Portão: ${totalWithGate}cm)` : `Comp. Total ${totalLinear}cm | Comp. Linear: ${totalGuardrailLinear}cm`;

                                                                                            if (numSides > 1 || l.hasGate) {
                                                                                                const finalTubes = totalOverallBars + gateBars;
                                                                                                const finalPrice = totalPrice + gatePriceTotal;
                                                                                                gMed = `G. Corpo (F: ${l.guardrailFormat || 'normal'}): ${compText} | Altura ${h}cm - Total ${finalTubes} tubos - R$ ${finalPrice}\n`;
                                                                                                segmentsText.forEach((seg, idx) => {
                                                                                                    gMed += `  • ${seg}\n`;
                                                                                                });
                                                                                            } else {
                                                                                                const gap1 = seg1 ? (l.guardrailGapOverride !== undefined ? l.guardrailGapOverride : parseFloat(seg1.exactGap.toFixed(1))) : 0;
                                                                                                const price1 = seg1 ? Math.round((trueLinear1 / 100) * 10) : 0;
                                                                                                gMed = `G. Corpo: ${compText} | Altura ${h}cm - ${seg1 ? seg1.totalBars : 0} tubos (vãos ${gap1}cm) - R$ ${price1}`;
                                                                                            }
                                                                                        }
                                                                                        
                                                                                        let gateTubes = 0;
                                                                                        let gateGaps = 0;
                                                                                        let gateInnerL = (l.gateLength || 100) - 6;
                                                                                        let gateTrueLinearFinal = 0;
                                                                                        if (gateInnerL < 0) gateInnerL = 0;
                                                                                        if (l.hasGate && l.gateLength > 0 && l.gateHeight > 0) {
                                                                                            const baseGapsGate = Math.max(1, Math.round(gateInnerL / 15));
                                                                                            let gb = l.gateBarsOverride !== undefined ? l.gateBarsOverride : (baseGapsGate + 1);
                                                                                            gb = Math.max(2, gb);
                                                                                            gateTubes = gb;
                                                                                            gateGaps = gateTubes - 1;
                                                                                            gateTrueLinearFinal = Math.round((gateTubes * l.gateHeight) + (2 * l.gateLength));
                                                                                        }

                                                                                        return (
                                                                                            <div key={i} className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded border border-gray-200 dark:border-gray-600">
                                                                                                <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm mb-1">Patamar {i+1} ({l.shape})</p>
                                                                                                {l.hasGuardrail && (
                                                                                                    <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                                                                                                        {gMed}
                                                                                                        {l.guardrailSide && (!l.guardrailFormat || l.guardrailFormat === 'normal' || l.guardrailFormat === 'frente' || l.guardrailFormat === 'atras') && <><br/>Lado: <span className="font-medium">{l.guardrailSide}</span></>}
                                                                                                    </p>
                                                                                                )}
                                                                                                {gateTubes > 0 && (() => {
                                                                                                    const gateLen = l.gateLength || 100;
                                                                                                    const gateH = l.gateHeight || 90;
                                                                                                    const gPrice = Math.round((gateTrueLinearFinal / 100) * 10);
                                                                                                    return (
                                                                                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                                                                            <span className="font-medium">Portãozinho:</span> Comp. {gateLen}cm | Comp. Linear {gateTrueLinearFinal}cm | Altura {gateH}cm - {gateTubes} tubos (vãos {((gateInnerL - ((gateTubes - 2) * 3)) / gateGaps).toFixed(1)}cm) - R$ {gPrice}
                                                                                                            {l.gateSide && <><br/>Lado: <span className="font-medium">{l.gateSide}</span></>}
                                                                                                        </p>
                                                                                                    );
                                                                                                })()}
                                                                                            </div>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        <div className="flex flex-col lg:flex-row gap-8">
                                                                            
                                                                            {/* Left: Costs List */}
                                                                            <div className="flex-1">
                                                                                <h4 className="font-bold text-gray-900 dark:text-white mb-4 text-sm flex items-center gap-2">
                                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                                                                                      <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                                                                                      <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                                                                                    </svg>
                                                                                    Despesas e Custos Registrados
                                                                                </h4>
                                                                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                                                                    <table className="w-full text-sm text-left">
                                                                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                                                                            <tr className="bg-gray-50 dark:bg-gray-800/50">
                                                                                                <td className="px-4 py-2 text-gray-600 dark:text-gray-400">Custos Base Calculadora (Aço, Madeira, Impostos)</td>
                                                                                                <td className="px-4 py-2 text-right font-medium text-gray-800 dark:text-gray-200">
                                                                                                    {formatCurrencyBRL((item.cost || 0) - (item.customCosts?.reduce((a,c)=>a+c.value,0) || 0))}
                                                                                                </td>
                                                                                                <td className="w-10"></td>
                                                                                            </tr>
                                                                                            {item.customCosts?.map(cost => (
                                                                                                <tr key={cost.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                                                                                                    <td className="px-4 py-2 font-medium text-gray-800 dark:text-gray-200">
                                                                                                        <div className="flex items-center gap-2">
                                                                                                            {cost.name}
                                                                                                            {cost.receiptUrl ? (
                                                                                                                <a href={cost.receiptUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-600 text-xs flex items-center gap-1" title="Ver Comprovante">
                                                                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                                                                                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                                                                                                    </svg>
                                                                                                                </a>
                                                                                                            ) : (
                                                                                                                <label className="text-gray-400 hover:text-blue-500 cursor-pointer" title="Anexar Comprovante">
                                                                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                                                                                                    </svg>
                                                                                                                    <input type="file" className="hidden" accept="image/*,application/pdf" onChange={async (e) => {
                                                                                                                        const file = e.target.files?.[0];
                                                                                                                        if (file) {
                                                                                                                            try {
                                                                                                                                const { uploadImageToFirebase } = await import('../services/firebaseStorage');
                                                                                                                                const url = await uploadImageToFirebase(file, 'receipts', cost.id);
                                                                                                                                const newCosts = item.customCosts?.map(c => c.id === cost.id ? { ...c, receiptUrl: url } : c) || [];
                                                                                                                                
                                                                                                                                const { updateDoc, doc } = await import('firebase/firestore');
                                                                                                                                const { db } = await import('../firebase');
                                                                                                                                await updateDoc(doc(db, 'production_queue', item.id), { customCosts: newCosts });
                                                                                                                                alert('Comprovante anexado!');
                                                                                                                            } catch (err) {
                                                                                                                                alert('Erro ao anexar comprovante.');
                                                                                                                            }
                                                                                                                        }
                                                                                                                    }} />
                                                                                                                </label>
                                                                                                            )}
                                                                                                        </div>
                                                                                                    </td>
                                                                                                    <td className="px-4 py-2 text-right text-red-500">{formatCurrencyBRL(cost.value)}</td>
                                                                                                    <td className="px-4 py-2 text-right">
                                                                                                        <button onClick={() => handleDeleteCost(item, cost.id)} className="text-gray-400 hover:text-red-500 p-1">
                                                                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                                                            </svg>
                                                                                                        </button>
                                                                                                    </td>
                                                                                                </tr>
                                                                                            ))}
                                                                                            <tr className="bg-gray-50 dark:bg-gray-800/80">
                                                                                                <td className="px-4 py-3 font-bold text-gray-900 dark:text-white text-right">CUSTO TOTAL</td>
                                                                                                <td className="px-4 py-3 font-black text-red-500 text-right">{formatCurrencyBRL(item.cost || 0)}</td>
                                                                                                <td></td>
                                                                                            </tr>
                                                                                        </tbody>
                                                                                    </table>
                                                                                </div>
                                                                            </div>

                                                                            {/* Right: Quick Actions (Custos Extras) */}
                                                                            <div className="flex-1 flex flex-col border-l border-gray-200 dark:border-gray-700 pl-6">
                                                                                <h4 className="font-bold text-gray-900 dark:text-white mb-4 text-sm flex items-center gap-2">
                                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                                                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                                                                    </svg>
                                                                                    Custos Extras e Material
                                                                                </h4>
                                                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                                                                                    Adicione gastos adicionais específicos deste contrato (ex: parafusos, selante, frete extra).
                                                                                </p>
                                                                                <button 
                                                                                    onClick={() => {
                                                                                        setExtraCostsModalItem(item);
                                                                                        setExtraCostsModalOpen(true);
                                                                                    }}
                                                                                    className="bg-highlight hover:bg-yellow-600 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 mb-6"
                                                                                >
                                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                                                    </svg>
                                                                                    Lançar Custos Extras
                                                                                </button>
                                                                                <div className="flex-1 flex flex-col mt-6">
                                                                                    <h4 className="font-bold text-gray-900 dark:text-white mb-4 text-sm">Fotos da Instalação</h4>
                                                                                    <div className="flex gap-2 flex-wrap mb-2">
                                                                                        {item.originalData.installationImages?.map((img: string, i: number) => (
                                                                                            <a key={i} href={img} target="_blank" rel="noreferrer" className="w-16 h-16 rounded border border-gray-300 overflow-hidden block">
                                                                                                <img src={img} alt="Instalação" className="w-full h-full object-cover" />
                                                                                            </a>
                                                                                        ))}
                                                                                    </div>
                                                                                    <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-bold transition-colors text-sm whitespace-nowrap cursor-pointer text-center">
                                                                                        Anexar Foto
                                                                                        <input type="file" className="hidden" accept="image/*,video/*" onChange={async (e) => {
                                                                                            const file = e.target.files?.[0];
                                                                                            if (file) {
                                                                                                try {
                                                                                                    const { uploadImageToFirebase } = await import('../services/firebaseStorage');
                                                                                                    const url = await uploadImageToFirebase(file, 'installations', item.id);
                                                                                                    const currentImages = item.originalData.installationImages || [];
                                                                                                    const newImages = [...currentImages, url];
                                                                                                    
                                                                                                    const { updateDoc, doc } = await import('firebase/firestore');
                                                                                                    const { db } = await import('../firebase');
                                                                                                    await updateDoc(doc(db, 'production_queue', item.id), { installationImages: newImages });
                                                                                                    if (item.originalData.contractId) {
                                                                                                        await updateDoc(doc(db, 'contracts', item.originalData.contractId), { installationImages: newImages });
                                                                                                    }
                                                                                                    alert('Foto anexada com sucesso!');
                                                                                                } catch (err) {
                                                                                                    alert('Erro ao anexar foto.');
                                                                                                }
                                                                                            }
                                                                                        }} />
                                                                                    </label>
                                                                                </div>
                                                                            </div>
                                                                            
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                })}
            </div>
            {/* Paid Modal */}
            {paidModalOpen && paidModalItem && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Atualizar Valor Pago</h3>
                        
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Porcentagem (%)</label>
                            <input 
                                type="number"
                                placeholder="Ex: 50"
                                value={paidModalPercent}
                                onChange={(e) => {
                                    setPaidModalPercent(e.target.value);
                                    const perc = parseFloat(e.target.value);
                                    if (!isNaN(perc)) {
                                        setPaidModalValue(((paidModalItem.value * perc) / 100).toFixed(2));
                                    } else {
                                        setPaidModalValue('');
                                    }
                                }}
                                className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white outline-none focus:border-pink-500"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Valor Pago (R$)</label>
                            <input 
                                type="number"
                                placeholder={`Ex: ${paidModalItem.value / 2}`}
                                value={paidModalValue}
                                onChange={(e) => {
                                    setPaidModalValue(e.target.value);
                                    const val = parseFloat(e.target.value);
                                    if (!isNaN(val) && paidModalItem.value > 0) {
                                        setPaidModalPercent(((val / paidModalItem.value) * 100).toFixed(2));
                                    } else {
                                        setPaidModalPercent('');
                                    }
                                }}
                                className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white outline-none focus:border-pink-500"
                            />
                        </div>

                        <div className="flex gap-2 mt-4">
                            <button onClick={() => setPaidModalOpen(false)} className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-2 rounded font-bold hover:bg-gray-300 dark:hover:bg-gray-600">Cancelar</button>
                            <button onClick={() => savePaidModal(parseFloat(paidModalValue) || 0)} className="flex-1 bg-pink-500 text-white py-2 rounded font-bold hover:bg-pink-600">Salvar</button>
                        </div>
                        <button onClick={() => savePaidModal(null)} className="mt-2 text-sm text-gray-400 hover:text-pink-500 underline text-center">Voltar para cálculo automático</button>
                    </div>
                </div>
            )}
            {/* Modal de Custos Extras */}
            {extraCostsModalItem && (
                <ExtraCostsModal
                    isOpen={extraCostsModalOpen}
                    item={extraCostsModalItem}
                    onClose={() => setExtraCostsModalOpen(false)}
                    onSave={() => {
                        setExtraCostsModalOpen(false);
                    }}
                />
            )}
        </div>
    );
}
