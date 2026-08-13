import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, where } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { ProductionOrder, SavedQuote, SavedContract, BoardStage } from '../types';
import { formatCurrencyBRL } from '../utils';
import { useAuth } from '../components/AuthProvider';
import { Link } from 'react-router-dom';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  console.error('Firestore Error: ', error);
  alert(`Erro ao carregar dados do CRM: ${error}`);
}

export interface KanbanItem {
  id: string;
  title: string;
  subtitle: string;
  stage: BoardStage;
  value: number;
  source: 'quote' | 'contract' | 'queue';
  profit?: number;
  cost?: number;
  originalData: any;
  createdAt: string;
}

const STAGES: { id: BoardStage, label: string, color: string }[] = [
    { id: 'orcamento', label: 'Orçamentos (Leads)', color: 'border-blue-500 bg-blue-50' },
    { id: 'contrato', label: 'Contratos (Assinar)', color: 'border-purple-500 bg-purple-50' },
    { id: 'corte', label: 'Produção (Corte)', color: 'border-orange-500 bg-orange-50' },
    { id: 'pronta', label: 'Pronta para Instalar', color: 'border-yellow-500 bg-yellow-50' },
    { id: 'concluido', label: 'Concluído / Instalado', color: 'border-green-500 bg-green-50' }
];

export default function ProductionQueue() {
    const [items, setItems] = useState<KanbanItem[]>([]);
    const { user } = useAuth();

    useEffect(() => {
        if (!user) return;
        
        let loadedQuotes: KanbanItem[] = [];
        let loadedContracts: KanbanItem[] = [];
        let loadedQueue: KanbanItem[] = [];

        const updateItems = () => {
            const all = [...loadedQuotes, ...loadedContracts, ...loadedQueue];
            all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setItems(all);
        };

        // 1. Fetch Saved Quotes (Only drafts/negotiations go to 'orcamento')
        const qQuotes = query(collection(db, 'saved_quotes'));
        const unSubQuotes = onSnapshot(qQuotes, (snapshot) => {
            loadedQuotes = [];
            snapshot.forEach(docSnap => {
                const data = docSnap.data() as SavedQuote;
                // Consideramos orçamentos na coluna orcamento
                loadedQuotes.push({
                    id: docSnap.id,
                    title: data.clientName || 'Cliente sem nome',
                    subtitle: `Orçamento Salvo`,
                    stage: 'orcamento',
                    value: (data.inputData?.totalHeight || 0) * 100, // Dummy value, na vdd orcamento não salva totalValue solto, mas tem
                    source: 'quote',
                    originalData: data,
                    createdAt: data.createdAt
                });
            });
            updateItems();
        }, (error) => handleFirestoreError(error, OperationType.LIST, 'saved_quotes'));

        // 2. Fetch Contracts
        const qContracts = query(collection(db, 'contracts'));
        const unSubContracts = onSnapshot(qContracts, (snapshot) => {
            loadedContracts = [];
            snapshot.forEach(docSnap => {
                const data = docSnap.data() as SavedContract;
                // Se não tem na queue, assumimos que contratos que ainda não viraram pedido tão em 'contrato'
                // Mas pera, quando salvamos um contrato com addToQueue = true ele já salva na queue.
                // Se ele salvou apenas contrato, vai ser BoardStage 'contrato'.
                // Para evitar duplicatas, não vamos trazer Contracts para cá se eles já estão na fila, ou apenas Contracts 'falta_assinar'
                if (data.status === 'falta_assinar') {
                    loadedContracts.push({
                        id: docSnap.id,
                        title: data.clientName,
                        subtitle: `Contrato a Assinar`,
                        stage: 'contrato',
                        value: data.totalValue || 0,
                        source: 'contract',
                        originalData: data,
                        createdAt: data.createdAt
                    });
                }
            });
            updateItems();
        }, (error) => handleFirestoreError(error, OperationType.LIST, 'contracts'));

        // 3. Fetch Production Queue
        const qQueue = query(collection(db, 'production_queue'));
        const unSubQueue = onSnapshot(qQueue, (snapshot) => {
            loadedQueue = [];
            snapshot.forEach(docSnap => {
                const data = docSnap.data() as ProductionOrder;
                let stage = data.boardStage || 'corte';
                if (data.status === 'completed') stage = 'concluido';

                loadedQueue.push({
                    id: docSnap.id,
                    title: data.clientName,
                    subtitle: data.location || `Entrega: ${data.deliveryDate || 'N/A'}`,
                    stage: stage,
                    value: data.downPayment + data.balanceDue || 0,
                    source: 'queue',
                    profit: data.profit,
                    cost: data.totalCost,
                    originalData: data,
                    createdAt: data.createdAt
                });
            });
            updateItems();
        }, (error) => handleFirestoreError(error, OperationType.LIST, 'production_queue'));

        return () => {
            unSubQuotes();
            unSubContracts();
            unSubQueue();
        };
    }, [user]);

    const moveItem = async (item: KanbanItem, newStage: BoardStage) => {
        try {
            if (item.source === 'queue') {
                const updates: any = { boardStage: newStage };
                if (newStage === 'concluido') {
                    updates.status = 'completed';
                } else {
                    updates.status = 'in_queue';
                }
                await updateDoc(doc(db, 'production_queue', item.id), updates);
            } else if (item.source === 'quote') {
                // If it's a quote being moved to contrato, we should probably redirect to Gerar Contrato page.
                alert('Para mover um Orçamento para Contrato, você deve gerar o contrato a partir dele na página de Orçamentos Salvos.');
            } else if (item.source === 'contract') {
                // Se era um contrato avulso e movemos pra produção, talvez tenhamos que criar um pedido na fila
                alert('Acesse Meus Contratos para gerar a ordem de produção deste contrato.');
            }
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, `move_item`);
        }
    };

    const deleteItem = async (item: KanbanItem) => {
        if (!window.confirm(`Tem certeza que deseja excluir ${item.title}?`)) return;
        
        try {
            if (item.source === 'queue') {
                await deleteDoc(doc(db, 'production_queue', item.id));
                if (item.originalData.contractId) {
                    await deleteDoc(doc(db, 'contracts', item.originalData.contractId));
                }
            } else if (item.source === 'quote') {
                await deleteDoc(doc(db, 'saved_quotes', item.id));
            } else if (item.source === 'contract') {
                await deleteDoc(doc(db, 'contracts', item.id));
            }
        } catch (error) {
            handleFirestoreError(error, OperationType.DELETE, `delete_item`);
        }
    }

    if (!user) {
        return (
            <div className="max-w-7xl mx-auto p-4 sm:p-6 flex flex-col items-center justify-center h-[50vh]">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Acesso Restrito</h2>
            </div>
        );
    }

    return (
        <div className="max-w-[1800px] mx-auto p-4 sm:p-6 overflow-hidden flex flex-col h-[calc(100vh-8rem)]">
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    📊 CRM & Fila de Produção
                </h1>
                <div className="flex gap-4">
                     <Link to="/custos" className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-200 transition-colors">
                        ⚙️ Configurar Custos
                     </Link>
                </div>
            </div>

            <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
                <div className="flex gap-4 min-w-max h-full">
                    {STAGES.map(stage => {
                        const stageItems = items.filter(i => i.stage === stage.id);
                        const totalValue = stageItems.reduce((acc, i) => acc + (i.value || 0), 0);
                        const totalProfit = stageItems.reduce((acc, i) => acc + (i.profit || 0), 0);

                        return (
                            <div key={stage.id} className={`w-80 flex flex-col rounded-xl border-t-4 ${stage.color} bg-gray-50 dark:bg-gray-800/50 shadow-sm overflow-hidden`}>
                                <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/80 sticky top-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <h2 className="font-bold text-gray-800 dark:text-gray-100">{stage.label}</h2>
                                        <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold px-2 py-1 rounded-full">
                                            {stageItems.length}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Vol: {formatCurrencyBRL(totalValue)}</p>
                                        {totalProfit > 0 && (
                                            <p className="text-xs text-green-600 dark:text-green-400 font-bold">Lucro Est: {formatCurrencyBRL(totalProfit)}</p>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto p-2 space-y-3 custom-scrollbar">
                                    {stageItems.map(item => (
                                        <div key={item.id} className="bg-white dark:bg-gray-700 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow cursor-pointer group relative">
                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={(e) => { e.stopPropagation(); deleteItem(item); }} className="text-red-500 hover:text-red-700 bg-red-50 dark:bg-red-900/30 p-1 rounded">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>

                                            <h3 className="font-bold text-sm text-gray-900 dark:text-white pr-6">{item.title}</h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 truncate">{item.subtitle}</p>
                                            
                                            <div className="flex justify-between items-end mt-2 pt-2 border-t border-gray-100 dark:border-gray-600">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] uppercase font-bold text-gray-400">Valor</span>
                                                    <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{formatCurrencyBRL(item.value)}</span>
                                                </div>
                                                {item.profit && item.profit > 0 ? (
                                                    <div className="flex flex-col text-right">
                                                        <span className="text-[10px] uppercase font-bold text-green-500/70">Lucro</span>
                                                        <span className="text-xs font-bold text-green-600 dark:text-green-400">{formatCurrencyBRL(item.profit)}</span>
                                                    </div>
                                                ) : null}
                                            </div>

                                            {/* Action Buttons to Move */}
                                            {item.source === 'queue' && (
                                                <div className="mt-3 flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {stage.id === 'contrato' && (
                                                        <button onClick={() => moveItem(item, 'corte')} className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded font-bold hover:bg-orange-200">
                                                            P/ Corte
                                                        </button>
                                                    )}
                                                    {stage.id === 'corte' && (
                                                        <button onClick={() => moveItem(item, 'pronta')} className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded font-bold hover:bg-yellow-200">
                                                            P/ Pronta
                                                        </button>
                                                    )}
                                                    {stage.id === 'pronta' && (
                                                        <button onClick={() => moveItem(item, 'concluido')} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold hover:bg-green-200">
                                                            Finalizar
                                                        </button>
                                                    )}
                                                    {stage.id !== 'contrato' && stage.id !== 'concluido' && (
                                                        <button onClick={() => moveItem(item, 'contrato')} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-bold hover:bg-gray-200">
                                                            Voltar
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{__html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(156, 163, 175, 0.5);
                    border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: rgba(156, 163, 175, 0.8);
                }
            `}} />
        </div>
    );
}
