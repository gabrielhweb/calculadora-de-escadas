import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SavedContract, ContractStatus } from '../types';
import { formatCurrencyBRL } from '../utils';
import { generateContractPDF } from '../utils/contractGenerator';
import { generateUnifiedTechnicalPDF } from '../utils/technicalPdfGenerator';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, getDocs, addDoc } from 'firebase/firestore';
import { useAuth } from '../components/AuthProvider';

export const ContractsList: React.FC = () => {
    const [contracts, setContracts] = useState<SavedContract[]>([]);
    const { user } = useAuth();
    const navigate = useNavigate();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [editingContract, setEditingContract] = useState<SavedContract | null>(null);
    const [formData, setFormData] = useState({
        clientName: '',
        totalValue: 0,
        createdAt: new Date().toISOString().split('T')[0],
        status: 'producao' as ContractStatus,
        paymentStatus: 'a_receber' as 'a_receber' | 'recebido',
        deliveryStatus: 'em_producao' as 'em_producao' | 'a_entregar',
        contractDataString: ''
    });

    const openAddModal = () => {
        setEditingContract(null);
        setShowAdvanced(false);
        setFormData({
            clientName: '',
            totalValue: 0,
            createdAt: new Date().toISOString().split('T')[0],
            status: 'producao',
            paymentStatus: 'a_receber',
            deliveryStatus: 'em_producao',
            contractDataString: ''
        });
        setIsModalOpen(true);
    };

    const openEditModal = (contract: SavedContract) => {
        setEditingContract(contract);
        setShowAdvanced(false);
        
        let dataString = '';
        if (contract.contractData) {
            try {
                const parsed = typeof contract.contractData === 'string' ? JSON.parse(contract.contractData) : contract.contractData;
                dataString = JSON.stringify(parsed, null, 2);
            } catch (e) {
                console.error("Erro ao formatar dados do contrato:", e);
            }
        }

        let dateString = '';
        try {
            if (contract.createdAt) {
                if (typeof (contract.createdAt as any).toDate === 'function') {
                    dateString = (contract.createdAt as any).toDate().toISOString().split('T')[0];
                } else {
                    dateString = new Date(contract.createdAt).toISOString().split('T')[0];
                }
            } else {
                dateString = new Date().toISOString().split('T')[0];
            }
        } catch (e) {
            dateString = new Date().toISOString().split('T')[0];
        }

        setFormData({
            clientName: contract.clientName || '',
            totalValue: contract.totalValue || 0,
            createdAt: dateString,
            status: contract.status || 'pendente',
            paymentStatus: contract.paymentStatus || 'a_receber',
            deliveryStatus: contract.deliveryStatus || 'em_producao',
            contractDataString: dataString
        });
        setIsModalOpen(true);
    };

    const handleSaveModal = async () => {
        try {
            let parsedContractData = null;
            if (formData.contractDataString.trim()) {
                try {
                    parsedContractData = JSON.parse(formData.contractDataString);
                } catch (e) {
                    alert("Erro no formato da Edição Avançada (JSON inválido). Por favor, corrija antes de salvar.");
                    return;
                }
            }

            let finalDate = new Date().toISOString();
            try {
                if (formData.createdAt) {
                    finalDate = new Date(formData.createdAt).toISOString();
                }
            } catch (e) {
                console.error("Data inválida", e);
            }

            const dataToSave: any = {
                clientName: formData.clientName,
                totalValue: Number(formData.totalValue),
                createdAt: finalDate,
                status: formData.status,
            };
            if (formData.paymentStatus !== undefined) dataToSave.paymentStatus = formData.paymentStatus;
            if (formData.deliveryStatus !== undefined) dataToSave.deliveryStatus = formData.deliveryStatus;
            if (user?.uid !== undefined) dataToSave.userId = user.uid;

            if (editingContract) {
                const contractRef = doc(db, 'contracts', editingContract.id);
                await updateDoc(contractRef, { 
                    ...dataToSave,
                    ...(parsedContractData ? { contractData: parsedContractData } : {})
                });
            } else {
                await addDoc(collection(db, 'contracts'), {
                    ...dataToSave,
                    contractData: parsedContractData
                });
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error("Erro ao salvar contrato:", error);
            alert("Erro ao salvar o contrato.");
        }
    };

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
            loadedContracts.sort((a, b) => {
                const getTime = (date: any) => {
                    if (!date) return 0;
                    if (typeof date.toDate === 'function') return date.toDate().getTime();
                    return new Date(date).getTime() || 0;
                };
                return getTime(b.createdAt) - getTime(a.createdAt);
            });
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

    const handleDownloadTechnical = (contractData: any) => {
        try {
            const parsedData = typeof contractData === 'string' ? JSON.parse(contractData) : contractData;
            const technicalProps = {
                clientName: parsedData.userData.name,
                totalSteps: parsedData.selectedOption.steps,
                stepHeightCm: parsedData.selectedOption.stepHeight,
                treadDepthCm: parsedData.selectedOption.treadDepth,
                widthCm: parsedData.selectedOption.stairWidth,
                totalLength: parsedData.selectedOption.totalLength,
                landings: parsedData.selectedOption.landings || [],
                stairDirection: parsedData.inputData.stairDirection,
                wallFixation: parsedData.inputData.wallFixation,
                treadMaterial: parsedData.inputData.treadMaterial,
                address: parsedData.userData.address,
                zip: parsedData.userData.zip,
                optionalItems: parsedData.inputData.optionalItems || []
            };
            generateUnifiedTechnicalPDF(technicalProps);
        } catch (error) {
            console.error("Erro ao gerar PDF Técnico:", error);
            alert("Erro ao ler os dados do contrato para a ficha técnica.");
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

    const [filterDelivery, setFilterDelivery] = useState<'todos' | 'em_producao' | 'a_entregar'>('todos');
    const [filterPayment, setFilterPayment] = useState<'todos' | 'a_receber' | 'recebido'>('todos');

    const renderColumn = (status: ContractStatus, title: string, colorClass: string) => {
        let columnContracts = contracts.filter(c => c.status === status);

        if (status === 'producao') {
            if (filterDelivery !== 'todos') {
                columnContracts = columnContracts.filter(c => (c.deliveryStatus || 'em_producao') === filterDelivery);
            }
            if (filterPayment !== 'todos') {
                columnContracts = columnContracts.filter(c => (c.paymentStatus || 'a_receber') === filterPayment);
            }
        }

        return (
            <div className="flex-1 min-w-[300px] bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 flex flex-col h-full">
                <div className={`flex items-center justify-between mb-4 pb-2 border-b-2 ${colorClass}`}>
                    <h3 className="font-bold text-gray-800 dark:text-white uppercase tracking-wider text-sm">{title}</h3>
                    <span className="bg-white dark:bg-gray-700 text-xs font-bold px-2 py-1 rounded-full text-gray-600 dark:text-gray-300 shadow-sm">
                        {columnContracts.length}
                    </span>
                </div>

                {status === 'producao' && (
                    <div className="flex flex-col gap-2 mb-4">
                        <select 
                            value={filterDelivery} 
                            onChange={(e) => setFilterDelivery(e.target.value as any)}
                            className="text-xs p-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                        >
                            <option value="todos">Todas as Entregas</option>
                            <option value="em_producao">Em Produção</option>
                            <option value="a_entregar">A Entregar</option>
                        </select>
                        <select 
                            value={filterPayment} 
                            onChange={(e) => setFilterPayment(e.target.value as any)}
                            className="text-xs p-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                        >
                            <option value="todos">Todos os Pagamentos</option>
                            <option value="a_receber">A Receber</option>
                            <option value="recebido">Recebido</option>
                        </select>
                    </div>
                )}

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
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => openEditModal(contract)}
                                            className="text-gray-400 hover:text-blue-500 transition-colors"
                                            title="Editar"
                                        >
                                            ✏️
                                        </button>
                                        <button 
                                            onClick={() => deleteContract(contract.id)}
                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                            title="Excluir"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                                    <p>Criado em: {(() => {
                                        try {
                                            if (!contract.createdAt) return 'Data não disponível';
                                            if (typeof (contract.createdAt as any).toDate === 'function') {
                                                return (contract.createdAt as any).toDate().toLocaleDateString('pt-BR');
                                            }
                                            return new Date(contract.createdAt).toLocaleDateString('pt-BR');
                                        } catch (e) {
                                            return 'Data inválida';
                                        }
                                    })()}</p>
                                    <p className="font-semibold text-highlight mt-1">{formatCurrencyBRL(contract.totalValue)}</p>
                                </div>

                                {status === 'producao' && (
                                    <div className="flex gap-2 mb-3">
                                        <span className={`text-xs px-2 py-1 rounded font-medium ${contract.deliveryStatus === 'a_entregar' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {contract.deliveryStatus === 'a_entregar' ? 'A Entregar' : 'Em Produção'}
                                        </span>
                                        <span className={`text-xs px-2 py-1 rounded font-medium ${contract.paymentStatus === 'recebido' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {contract.paymentStatus === 'recebido' ? 'Recebido' : 'A Receber'}
                                        </span>
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-600">
                                    {contract.contractData && (
                                        <>
                                            <button 
                                                onClick={() => handleDownload(contract.contractData)}
                                                className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 text-xs py-1.5 rounded font-medium transition-colors"
                                                title="Baixar PDF do Contrato"
                                            >
                                                📄 Contrato
                                            </button>
                                            <button 
                                                onClick={() => handleDownloadTechnical(contract.contractData)}
                                                className="flex-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-200 text-xs py-1.5 rounded font-medium transition-colors"
                                                title="Baixar Ficha Técnica (Produção + Matéria Prima)"
                                            >
                                                ⚙️ Ficha Técnica
                                            </button>
                                        </>
                                    )}

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
                <button 
                    onClick={openAddModal}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors text-sm"
                >
                    + Adicionar Pedido Retroativo
                </button>
            </header>

            <div className="flex-1 flex gap-6 overflow-x-auto pb-4 custom-scrollbar">
                {renderColumn('falta_assinar', 'Falta Assinar', 'border-yellow-400')}
                {renderColumn('producao', 'Em Produção', 'border-blue-500')}
                {renderColumn('entregue', 'Entregue', 'border-green-500')}
            </div>

            {/* Modal de Edição/Adição */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            {editingContract ? 'Editar Pedido' : 'Adicionar Pedido Retroativo'}
                        </h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Cliente</label>
                                <input 
                                    type="text" 
                                    value={formData.clientName}
                                    onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor Total (R$)</label>
                                <input 
                                    type="number" 
                                    value={formData.totalValue}
                                    onChange={(e) => setFormData({...formData, totalValue: Number(e.target.value)})}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data de Criação</label>
                                <input 
                                    type="date" 
                                    value={formData.createdAt}
                                    onChange={(e) => setFormData({...formData, createdAt: e.target.value})}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status Geral</label>
                                <select 
                                    value={formData.status}
                                    onChange={(e) => setFormData({...formData, status: e.target.value as ContractStatus})}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="falta_assinar">Falta Assinar</option>
                                    <option value="producao">Em Produção</option>
                                    <option value="entregue">Entregue</option>
                                </select>
                            </div>

                            {formData.status === 'producao' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Entrega</label>
                                        <select 
                                            value={formData.deliveryStatus}
                                            onChange={(e) => setFormData({...formData, deliveryStatus: e.target.value as any})}
                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        >
                                            <option value="em_producao">Em Produção</option>
                                            <option value="a_entregar">A Entregar</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pagamento</label>
                                        <select 
                                            value={formData.paymentStatus}
                                            onChange={(e) => setFormData({...formData, paymentStatus: e.target.value as any})}
                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        >
                                            <option value="a_receber">A Receber</option>
                                            <option value="recebido">Recebido</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                                type="button"
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                            >
                                {showAdvanced ? '🔽 Ocultar Edição Avançada' : '▶️ Mostrar Edição Avançada (Corrigir PDFs)'}
                            </button>
                            
                            {showAdvanced && (
                                <div className="mt-3">
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                        Dados Brutos do Contrato (JSON) - Cuidado ao editar!
                                    </label>
                                    <textarea
                                        value={formData.contractDataString}
                                        onChange={(e) => setFormData({...formData, contractDataString: e.target.value})}
                                        className="w-full h-48 p-2 text-xs font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 custom-scrollbar"
                                        spellCheck={false}
                                        placeholder="Cole ou edite o JSON do contrato aqui..."
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1">
                                        Dica: Procure o texto que deseja corrigir (ex: nome, endereço) e altere apenas o conteúdo entre aspas.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex justify-between items-center">
                            {editingContract && editingContract.contractData ? (
                                <button
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        let parsedData = {};
                                        try {
                                            parsedData = typeof editingContract.contractData === 'string' 
                                                ? JSON.parse(editingContract.contractData) 
                                                : editingContract.contractData;
                                        } catch (e) {
                                            console.error("Erro ao parsear contractData", e);
                                            alert("Erro ao ler os dados do contrato. O formato pode estar corrompido.");
                                            return;
                                        }
                                        navigate('/contract', { 
                                            state: { 
                                                isEditing: true, 
                                                editingContractId: editingContract.id,
                                                savedContractData: parsedData
                                            } 
                                        });
                                    }}
                                    className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 dark:text-purple-300 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
                                >
                                    <span>📝</span> Editar no Formulário
                                </button>
                            ) : (
                                <div></div>
                            )}
                            
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={handleSaveModal}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    Salvar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
