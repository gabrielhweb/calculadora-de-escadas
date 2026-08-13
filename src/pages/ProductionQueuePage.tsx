import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ProductionOrder, SavedQuote, SavedContract, BoardStage, CustomCost } from '../types';
import { formatCurrencyBRL } from '../utils';
import { useAuth } from '../components/AuthProvider';
import { Link } from 'react-router-dom';

enum OperationType {
  LIST = 'list',
  UPDATE = 'update',
  DELETE = 'delete'
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  console.error('Firestore Error: ', error);
  alert(`Erro ao carregar dados do CRM: ${error}`);
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

const STAGES: { id: BoardStage, label: string, color: string }[] = [
    { id: 'orcamento', label: 'Orçamentos', color: 'bg-blue-100 text-blue-800' },
    { id: 'contrato', label: 'Contratos (Assinar)', color: 'bg-purple-100 text-purple-800' },
    { id: 'corte', label: 'Produção (Corte)', color: 'bg-orange-100 text-orange-800' },
    { id: 'pronta', label: 'Pronta para Instalar', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'concluido', label: 'Concluído', color: 'bg-green-100 text-green-800' }
];

export default function ProductionQueue() {
    const [items, setItems] = useState<DashboardItem[]>([]);
    const [timeFilter, setTimeFilter] = useState<'all' | 'month' | 'week'>('month');
    const [stageFilter, setStageFilter] = useState<'all' | BoardStage>('all');
    const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
    const { user } = useAuth();
    
    // States for custom costs input
    const [newCostName, setNewCostName] = useState('');
    const [newCostValue, setNewCostValue] = useState('');

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
                        q.subtitle = q.originalData.location || `Data de Entrega: ${contractData.deliveryDate}`;
                    }
                }
                return q;
            });

            const all = [...loadedQuotes, ...loadedContracts, ...queueWithSyncedDates];
            all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
    }, [user]);

    // Filtering Logic
    const filteredItems = items.filter(item => {
        // Stage filter
        if (stageFilter !== 'all' && item.stage !== stageFilter) {
            return false;
        }

        // Time filter
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

    // Dashboard Totals (Consider only contracts and queue items for actual revenue/profit)
    const revenueItems = filteredItems.filter(i => i.source === 'queue' || i.source === 'contract');
    const totalRevenue = revenueItems.reduce((acc, i) => acc + (i.value || 0), 0);
    const totalProfit = revenueItems.reduce((acc, i) => acc + (i.profit || 0), 0);
    const totalCost = revenueItems.reduce((acc, i) => acc + (i.cost || 0), 0);

    const handleAddCost = async (item: DashboardItem) => {
        if (!newCostName || !newCostValue) return;
        
        const val = parseFloat(newCostValue);
        if (isNaN(val)) return;

        const newCost: CustomCost = {
            id: Date.now().toString(),
            name: newCostName,
            value: val
        };

        const existingCosts = item.customCosts || [];
        const updatedCosts = [...existingCosts, newCost];
        
        // Recalculate profit and totalCost
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
            setNewCostName('');
            setNewCostValue('');
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
            // Update in production_queue
            await updateDoc(doc(db, 'production_queue', item.id), { deliveryDate: newDate });
            // Sync with contracts collection so it shows in DeliveriesTable
            if (item.originalData.contractId) {
                await updateDoc(doc(db, 'contracts', item.originalData.contractId), { deliveryDate: newDate });
            }
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, 'sync_delivery_date');
        }
    };

    if (!user) {
        return (
            <div className="max-w-7xl mx-auto p-4 sm:p-6 flex flex-col items-center justify-center h-[50vh]">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Acesso Restrito</h2>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    📊 Dashboard Gerencial
                </h1>
                
                <div className="flex gap-2">
                    <select 
                        value={stageFilter}
                        onChange={(e) => setStageFilter(e.target.value as any)}
                        className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-highlight"
                    >
                        <option value="all">Todas as Etapas</option>
                        {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
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
                    <Link to="/custos" className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-200 transition-colors text-sm flex items-center">
                        ⚙️ Custos Base
                    </Link>
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

            {/* List Header */}
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                Andamento de Obras
            </h2>

            {/* Data Grid / List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                {filteredItems.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        Nenhum pedido encontrado para o período selecionado.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredItems.map(item => {
                            const stageConfig = STAGES.find(s => s.id === item.stage) || STAGES[0];
                            const isExpanded = expandedItemId === item.id;

                            return (
                                <div key={item.id} className="flex flex-col transition-colors hover:bg-gray-50 dark:hover:bg-gray-750">
                                    {/* Main Row */}
                                    <div 
                                        className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer"
                                        onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                                    >
                                        <div className="flex-1 flex flex-col sm:flex-row gap-4 sm:items-center">
                                            <div className="w-full sm:w-1/3">
                                                <h3 className="font-bold text-gray-900 dark:text-white">{item.title}</h3>
                                                <div className="flex items-center gap-2 mt-1" onClick={e => e.stopPropagation()}>
                                                    <span className="text-xs font-bold text-gray-400">ENTREGA:</span>
                                                    {item.source === 'queue' ? (
                                                        <input 
                                                            type="date"
                                                            value={item.originalData.deliveryDate || ''}
                                                            onChange={(e) => handleUpdateDeliveryDate(item, e.target.value)}
                                                            className="text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 text-gray-700 dark:text-gray-200 outline-none"
                                                        />
                                                    ) : (
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">N/A</span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="w-full sm:w-1/4">
                                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${stageConfig.color}`}>
                                                    {stageConfig.label}
                                                </span>
                                            </div>

                                            <div className="w-full sm:w-1/4 flex flex-col">
                                                <span className="text-xs text-gray-400 font-bold uppercase">Faturamento</span>
                                                <span className="font-bold text-gray-800 dark:text-gray-200">{formatCurrencyBRL(item.value)}</span>
                                            </div>

                                            <div className="w-full sm:w-1/4 flex flex-col">
                                                <span className="text-xs text-green-500/80 font-bold uppercase">Lucro (Base)</span>
                                                <span className="font-bold text-green-600 dark:text-green-400">{item.profit ? formatCurrencyBRL(item.profit) : 'R$ 0,00'}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {item.source === 'queue' && item.stage !== 'concluido' && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); moveItem(item, 'concluido'); }}
                                                    className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg"
                                                    title="Marcar como Concluído"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            )}
                                            <div className={`p-2 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''} text-gray-400`}>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Costs Area */}
                                    {isExpanded && item.source === 'queue' && (
                                        <div className="bg-gray-100 dark:bg-gray-800/80 p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700">
                                            <h4 className="font-bold text-gray-900 dark:text-white mb-4">Gestão de Custos Desta Escada</h4>
                                            
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                {/* Left: Tabela de Custos */}
                                                <div>
                                                    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                                        <table className="w-full text-sm text-left">
                                                            <thead className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 uppercase">
                                                                <tr>
                                                                    <th className="px-4 py-3">Descrição do Gasto</th>
                                                                    <th className="px-4 py-3 text-right">Valor</th>
                                                                    <th className="px-4 py-3 w-10"></th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                                <tr className="bg-white dark:bg-gray-900">
                                                                    <td className="px-4 py-3 text-gray-800 dark:text-gray-200">Custos Base (Aço, Mad., Impos., Comis.)</td>
                                                                    <td className="px-4 py-3 text-right font-medium text-gray-800 dark:text-gray-200">
                                                                        {formatCurrencyBRL((item.cost || 0) - (item.customCosts?.reduce((a,c)=>a+c.value,0) || 0))}
                                                                    </td>
                                                                    <td className="px-4 py-3"></td>
                                                                </tr>
                                                                {item.customCosts?.map(cost => (
                                                                    <tr key={cost.id} className="bg-white dark:bg-gray-900">
                                                                        <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{cost.name}</td>
                                                                        <td className="px-4 py-3 text-right font-medium text-red-500">{formatCurrencyBRL(cost.value)}</td>
                                                                        <td className="px-4 py-3 text-right">
                                                                            <button onClick={() => handleDeleteCost(item, cost.id)} className="text-red-400 hover:text-red-600">
                                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                                </svg>
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                                <tr className="bg-gray-50 dark:bg-gray-800">
                                                                    <td className="px-4 py-3 font-bold text-gray-900 dark:text-white text-right">CUSTO TOTAL</td>
                                                                    <td className="px-4 py-3 font-black text-red-500 text-right">{formatCurrencyBRL(item.cost || 0)}</td>
                                                                    <td></td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>

                                                {/* Right: Adicionar Gasto & Resultado */}
                                                <div className="flex flex-col gap-6">
                                                    {/* Form */}
                                                    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                                                        <h5 className="font-bold text-sm text-gray-800 dark:text-gray-200 mb-3">Adicionar Gasto Extra</h5>
                                                        <div className="flex flex-col gap-3">
                                                            <input 
                                                                type="text" 
                                                                placeholder="Ex: Pagamento do Instalador, Dobradiças..." 
                                                                value={newCostName}
                                                                onChange={e => setNewCostName(e.target.value)}
                                                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-highlight"
                                                            />
                                                            <div className="flex gap-2">
                                                                <input 
                                                                    type="number" 
                                                                    placeholder="Valor R$" 
                                                                    value={newCostValue}
                                                                    onChange={e => setNewCostValue(e.target.value)}
                                                                    className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-highlight"
                                                                />
                                                                <button 
                                                                    onClick={() => handleAddCost(item)}
                                                                    className="bg-highlight text-white px-4 py-2 rounded font-bold hover:bg-yellow-600 transition-colors"
                                                                >
                                                                    Adicionar
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Resultado */}
                                                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 p-4 rounded-lg shadow-sm">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-sm font-bold text-green-800 dark:text-green-300 uppercase">Lucro Desta Escada</span>
                                                        </div>
                                                        <div className="text-3xl font-black text-green-600 dark:text-green-400">
                                                            {formatCurrencyBRL(item.profit || 0)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Expanded Info for non-queue items */}
                                    {isExpanded && item.source !== 'queue' && (
                                        <div className="bg-gray-100 dark:bg-gray-800/80 p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
                                            Este é um {item.source === 'quote' ? 'Orçamento Salvo' : 'Contrato Pendente'}. Acesse a aba correspondente no menu para gerá-lo como Pedido e gerenciar seus custos.
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
