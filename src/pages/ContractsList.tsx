import React, { useState, useEffect } from 'react';
import { SavedContract, ContractStatus } from '../types';
import { formatCurrencyBRL } from '../utils';
import { generateContractPDF } from '../utils/contractGenerator';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { useAuth } from '../components/AuthProvider';

export const ContractsList: React.FC = () => {
    const [contracts, setContracts] = useState<SavedContract[]>([]);
    const { user } = useAuth();

    useEffect(() => {
        if (!user) {
            setContracts([]);
            return;
        }

        const q = query(collection(db, 'contracts'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedContracts: SavedContract[] = [];
            snapshot.forEach((doc) => {
                loadedContracts.push({ id: doc.id, ...doc.data() } as SavedContract);
            });
            // Sort by createdAt descending
            loadedContracts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setContracts(loadedContracts);
        }, (error) => {
            console.error("Firestore Error: ", error);
        });

        return () => unsubscribe();
    }, [user]);

    const moveContract = async (id: string, newStatus: ContractStatus) => {
        try {
            const contractRef = doc(db, 'contracts', id);
            await updateDoc(contractRef, { status: newStatus });
        } catch (error) {
            console.error("Erro ao atualizar contrato:", error);
            alert("Erro ao atualizar o status do contrato.");
        }
    };

    const deleteContract = async (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este contrato da sua timeline?')) {
            try {
                const contractRef = doc(db, 'contracts', id);
                await deleteDoc(contractRef);
                
                // Excluir também da fila de produção
                const q = query(collection(db, 'production_queue'), where('contractId', '==', id));
                const querySnapshot = await getDocs(q);
                querySnapshot.forEach(async (docSnap) => {
                    await deleteDoc(doc(db, 'production_queue', docSnap.id));
                });
            } catch (error) {
                console.error("Erro ao excluir contrato:", error);
                alert("Erro ao excluir o contrato.");
            }
        }
    };

    const handleDownload = (contractData: any) => {
        try {
            const parsedData = typeof contractData === 'string' ? JSON.parse(contractData) : contractData;
            generateContractPDF(parsedData);
        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
            alert("Erro ao ler os dados do contrato.");
        }
    };

    if (!user) {
        return (
            <div className="max-w-7xl mx-auto p-4 sm:p-6 flex flex-col items-center justify-center h-[50vh]">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Acesso Restrito</h2>
                <p className="text-gray-500 dark:text-gray-400 text-center">
                    Você precisa fazer login para acessar e gerenciar seus contratos na nuvem.
                </p>
            </div>
        );
    }

    const renderColumn = (status: ContractStatus, title: string, colorClass: string) => {
        const columnContracts = contracts.filter(c => c.status === status);

        return (
            <div className="flex-1 min-w-[300px] bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 flex flex-col h-full">
                <div className={`flex items-center justify-between mb-4 pb-2 border-b-2 ${colorClass}`}>
                    <h3 className="font-bold text-gray-800 dark:text-white uppercase tracking-wider text-sm">{title}</h3>
                    <span className="bg-white dark:bg-gray-700 text-xs font-bold px-2 py-1 rounded-full text-gray-600 dark:text-gray-300 shadow-sm">
                        {columnContracts.length}
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                    {columnContracts.length === 0 ? (
                        <div className="text-center p-6 text-gray-400 dark:text-gray-500 text-sm border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                            Nenhum contrato nesta etapa
                        </div>
                    ) : (
                        columnContracts.map(contract => (
                            <div key={contract.id} className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow group">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-gray-900 dark:text-white truncate pr-2" title={contract.clientName}>
                                        {contract.clientName}
                                    </h4>
                                    <button 
                                        onClick={() => deleteContract(contract.id)}
                                        className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                        title="Excluir"
                                    >
                                        🗑️
                                    </button>
                                </div>
                                
                                <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                                    <p>Criado em: {new Date(contract.createdAt).toLocaleDateString('pt-BR')}</p>
                                    <p className="font-semibold text-highlight mt-1">{formatCurrencyBRL(contract.totalValue)}</p>
                                </div>

                                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-600">
                                    <button 
                                        onClick={() => handleDownload(contract.contractData)}
                                        className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 text-xs py-1.5 rounded font-medium transition-colors"
                                        title="Baixar PDF"
                                    >
                                        📄 PDF
                                    </button>

                                    {status === 'falta_assinar' && (
                                        <button 
                                            onClick={() => moveContract(contract.id, 'producao')}
                                            className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs py-1.5 rounded font-medium transition-colors"
                                        >
                                            Produção ➡️
                                        </button>
                                    )}
                                    {status === 'producao' && (
                                        <>
                                            <button 
                                                onClick={() => moveContract(contract.id, 'falta_assinar')}
                                                className="px-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 text-xs py-1.5 rounded font-medium transition-colors"
                                                title="Voltar"
                                            >
                                                ⬅️
                                            </button>
                                            <button 
                                                onClick={() => moveContract(contract.id, 'entregue')}
                                                className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 text-xs py-1.5 rounded font-medium transition-colors"
                                            >
                                                Entregue ✅
                                            </button>
                                        </>
                                    )}
                                    {status === 'entregue' && (
                                        <button 
                                            onClick={() => moveContract(contract.id, 'producao')}
                                            className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 text-xs py-1.5 rounded font-medium transition-colors"
                                        >
                                            ⬅️ Voltar
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 h-[calc(100vh-80px)] flex flex-col">
            <header className="mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                        Pipeline de Contratos
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Acompanhe o status de cada projeto na sua timeline.</p>
                </div>
            </header>

            <div className="flex-1 flex gap-6 overflow-x-auto pb-4 custom-scrollbar">
                {renderColumn('falta_assinar', 'Falta Assinar', 'border-yellow-400')}
                {renderColumn('producao', 'Em Produção', 'border-blue-500')}
                {renderColumn('entregue', 'Entregue', 'border-green-500')}
            </div>
        </div>
    );
};
