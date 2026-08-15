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

    const handleUpdatePaidAmount = async (item: DashboardItem) => {
        if (item.source !== 'queue') return;
        
        const input = prompt(`Qual o valor já pago para esta escada?\n\nExemplos:\n- "1500" para informar que R$ 1.500 foi pago\n- "50%" para informar que metade foi pago\n- Deixe em branco para voltar ao cálculo automático`);
        
        // Se cancelar, não faz nada
        if (input === null) return;

        let newCustomPaidValue = null;
        
        if (input.trim() !== '') {
            if (input.includes('%')) {
                const perc = parseFloat(input.replace('%', '').replace(',', '.'));
                if (!isNaN(perc)) {
                    newCustomPaidValue = (item.value * perc) / 100;
                }
            } else {
                const val = parseFloat(input.replace(/\./g, '').replace(',', '.'));
                if (!isNaN(val)) {
                    newCustomPaidValue = val;
                }
            }
        }

        try {
            await updateDoc(doc(db, 'production_queue', item.id), {
                customPaidValue: newCustomPaidValue
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
            if (item.source === 'queue') {
                await updateDoc(doc(db, 'production_queue', item.id), { deliveryDate: newDate });
                if (item.originalData.contractId) {
                    await updateDoc(doc(db, 'contracts', item.originalData.contractId), { deliveryDate: newDate });
                }
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
                    Fila de Produção
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
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                        {groupItems.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
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
                                                                {item.title}
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
                                                                {item.originalData.location || 'N/A'}
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
                                                                    onClick={(e) => { e.stopPropagation(); handleUpdatePaidAmount(item); }}
                                                                    className={`w-full h-6 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden relative flex items-center justify-center ${item.source === 'queue' ? 'cursor-pointer hover:ring-2 hover:ring-pink-400' : ''}`}
                                                                    title={item.source === 'queue' ? 'Clique para editar o valor pago manualmente' : ''}
                                                                >
                                                                    <div className="absolute top-0 left-0 h-full bg-pink-500 transition-all" style={{ width: `${Math.min(100, Math.max(0, percentPaid))}%`}}></div>
                                                                    <span className="relative z-10 text-[10px] font-bold text-white drop-shadow-md">
                                                                        {percentPaid >= 100 ? '100% PAGO' : percentPaid > 0 ? `${percentPaid.toFixed(0)}% PAGO` : ''}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                {item.source === 'queue' ? (
                                                                    <button 
                                                                        onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                                                                        className={`flex items-center justify-center w-full gap-1 p-1 rounded transition-colors ${isExpanded ? 'bg-gray-200 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                                                    >
                                                                        <span className="font-bold text-green-600 dark:text-green-400 text-xs">{formatCurrencyBRL(item.profit || 0)}</span>
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                                                                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                        </svg>
                                                                    </button>
                                                                ) : (
                                                                    <span className="text-gray-400 text-xs">⚠ N/A</span>
                                                                )}
                                                            </td>
                                                        </tr>

                                                        {/* Expanded Area for Costs */}
                                                        {isExpanded && item.source === 'queue' && (
                                                            <tr>
                                                                <td colSpan={8} className="p-0 border-b border-gray-200 dark:border-gray-700">
                                                                    <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-6 shadow-inner border-y border-indigo-100 dark:border-indigo-800/50">
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
                                                                                                    <td className="px-4 py-2 font-medium text-gray-800 dark:text-gray-200">{cost.name}</td>
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

                                                                            {/* Right: Quick Actions */}
                                                                            <div className="flex-1 flex flex-col">
                                                                                <h4 className="font-bold text-gray-900 dark:text-white mb-4 text-sm">Adicionar Custo Extra</h4>
                                                                                
                                                                                <div className="grid grid-cols-2 gap-2 mb-4">
                                                                                    {QUICK_COSTS.map((qCost, idx) => (
                                                                                        <button 
                                                                                            key={idx}
                                                                                            onClick={() => {
                                                                                                const val = prompt(`Digite o valor para: ${qCost}\n(Apenas números e ponto para centavos. Ex: 150.50)`);
                                                                                                if (val) handleAddCost(item, qCost, val.replace(',','.'));
                                                                                            }}
                                                                                            className="text-xs text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-gray-700 dark:text-gray-300 px-3 py-2 rounded transition-colors"
                                                                                        >
                                                                                            + {qCost}
                                                                                        </button>
                                                                                    ))}
                                                                                </div>

                                                                                <div className="flex gap-2">
                                                                                    <input 
                                                                                        type="text" 
                                                                                        placeholder="Outro gasto..." 
                                                                                        value={newCostName}
                                                                                        onChange={e => setNewCostName(e.target.value)}
                                                                                        className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-indigo-500"
                                                                                    />
                                                                                    <input 
                                                                                        type="number" 
                                                                                        placeholder="R$" 
                                                                                        value={newCostValue}
                                                                                        onChange={e => setNewCostValue(e.target.value)}
                                                                                        className="w-24 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-indigo-500"
                                                                                    />
                                                                                    <button 
                                                                                        onClick={() => handleAddCost(item, newCostName, newCostValue)}
                                                                                        className="bg-indigo-600 text-white px-4 py-2 rounded font-bold hover:bg-indigo-700 transition-colors text-sm whitespace-nowrap"
                                                                                    >
                                                                                        Incluir
                                                                                    </button>
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
        </div>
    );
}
