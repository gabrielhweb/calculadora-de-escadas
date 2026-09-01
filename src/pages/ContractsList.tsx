import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SavedContract, ContractStatus } from '../types';
import { formatCurrencyBRL } from '../utils';
import { generateContractPDF } from '../utils/contractGenerator';
import { generateUnifiedTechnicalPDF } from '../utils/technicalPdfGenerator';
import { generatePaymentReceiptPDF } from '../utils/paymentReceiptGenerator';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, getDocs, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuth } from '../components/AuthProvider';
import { cleanDuplicateContracts } from '../utils/cleanDuplicates';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  alert(`Erro ao salvar no banco de dados: ${errInfo.error}`);
  throw new Error(JSON.stringify(errInfo));
}

export const ContractsList: React.FC = () => {
    const [contracts, setContracts] = useState<SavedContract[]>([]);
    const { user } = useAuth();
    const navigate = useNavigate();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [editingContract, setEditingContract] = useState<SavedContract | null>(null);
    const [receiptModalOpen, setReceiptModalOpen] = useState(false);
    const [selectedContractForReceipt, setSelectedContractForReceipt] = useState<SavedContract | null>(null);
    const [formData, setFormData] = useState({
        clientName: '',
        totalValue: 0,
        createdAt: '',
        status: 'pendente' as ContractStatus,
        paymentStatus: 'a_receber' as 'a_receber' | 'recebido',
        deliveryStatus: 'em_producao' as 'em_producao' | 'a_entregar',
        contractDataString: '',
        treadDepth: '',
        stepHeight: '',
        stairWidth: '',
        totalSteps: ''
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
            contractDataString: '',
            treadDepth: '',
            stepHeight: '',
            stairWidth: '',
            totalSteps: ''
        });
        setIsModalOpen(true);
    };

    const openEditModal = (contract: SavedContract) => {
        setEditingContract(contract);
        setShowAdvanced(false);
        
        let dataString = '';
        let parsed: any = null;
        if (contract.contractData) {
            try {
                parsed = typeof contract.contractData === 'string' ? JSON.parse(contract.contractData) : contract.contractData;
                while (typeof parsed === 'string') {
                    parsed = JSON.parse(parsed);
                }
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

        const getProp = (key: string) => parsed?.selectedOption?.[key] || parsed?.inputData?.[key] || parsed?.[key];

        setFormData({
            clientName: contract.clientName || '',
            totalValue: contract.totalValue || 0,
            createdAt: dateString,
            status: contract.status || 'pendente',
            paymentStatus: contract.paymentStatus || 'a_receber',
            deliveryStatus: contract.deliveryStatus || 'em_producao',
            contractDataString: dataString,
            treadDepth: getProp('treadDepth') || getProp('treadDepthCm') || getProp('pisante') || '',
            stepHeight: getProp('stepHeight') || getProp('stepHeightCm') || getProp('altura') || '',
            stairWidth: getProp('stairWidth') || getProp('widthCm') || getProp('width') || getProp('largura') || '',
            totalSteps: getProp('steps') || getProp('desiredSteps') || getProp('totalSteps') || getProp('degraus') || ''
        });
        setIsModalOpen(true);
    };

    const handleSaveModal = async () => {
        try {
            let parsedContractData: any = {};
            if (formData.contractDataString.trim()) {
                try {
                    parsedContractData = JSON.parse(formData.contractDataString);
                } catch (e) {
                    alert("Erro no formato da Edição Avançada (JSON inválido). Por favor, corrija antes de salvar.");
                    return;
                }
            }

            // Injetar os valores do formulário (simples) para dentro do JSON de dados
            if (formData.treadDepth) parsedContractData.pisante = Number(formData.treadDepth) || 0;
            if (formData.stepHeight) parsedContractData.altura = Number(formData.stepHeight) || 0;
            if (formData.stairWidth) parsedContractData.largura = Number(formData.stairWidth) || 0;
            if (formData.totalSteps) parsedContractData.degraus = Number(formData.totalSteps) || 0;

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
                totalValue: Number(formData.totalValue) || 0,
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
            handleFirestoreError(error, editingContract ? OperationType.UPDATE : OperationType.CREATE, 'contracts');
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
            handleFirestoreError(error, OperationType.LIST, 'contracts');
        });

        return () => unsubscribe();
    }, [user]);

    const moveContract = async (id: string, newStatus: ContractStatus) => {
        try {
            const contractRef = doc(db, 'contracts', id);
            await updateDoc(contractRef, { status: newStatus });
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, `contracts/${id}`);
        }
    };

    const deleteContract = async (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este contrato da sua timeline?')) {
            try {
                const contractRef = doc(db, 'contracts', id);
                await deleteDoc(contractRef);
                
                // Excluir também da fila de produção
                const q = query(collection(db, 'production_queue'), where('contractId', '==', id));
                try {
                    const querySnapshot = await getDocs(q);
                    querySnapshot.forEach(async (docSnap) => {
                        await deleteDoc(doc(db, 'production_queue', docSnap.id));
                    });
                } catch (error) {
                    handleFirestoreError(error, OperationType.GET, 'production_queue');
                }
            } catch (error) {
                handleFirestoreError(error, OperationType.DELETE, `contracts/${id}`);
            }
        }
    };

    const handleDownload = (contract: SavedContract) => {
        try {
            let parsedData: any = contract.contractData;
            let maxIters = 5;
            while (typeof parsedData === 'string' && maxIters > 0) {
                try { parsedData = JSON.parse(parsedData); } catch(e){ break; }
                maxIters--;
            }
            if (parsedData?.contractData) {
                parsedData = parsedData.contractData;
                maxIters = 5;
                while (typeof parsedData === 'string' && maxIters > 0) {
                    try { parsedData = JSON.parse(parsedData); } catch(e){ break; }
                    maxIters--;
                }
            }
            
            // Hidrata os dados para garantir que a geração do PDF não quebre em contratos manuais
            if (!parsedData) parsedData = {};
            if (!parsedData.userData) parsedData.userData = {};
            if (!parsedData.inputData) parsedData.inputData = {};
            if (!parsedData.selectedOption) parsedData.selectedOption = {};
            if (!parsedData.paymentDetails) parsedData.paymentDetails = {};

            // Injeta dados conhecidos do quadro Kanban caso estejam vazios no JSON
            parsedData.userData.name = parsedData.userData.name || contract.clientName || 'CLIENTE NÃO INFORMADO';
            parsedData.finalStairPrice = parsedData.finalStairPrice || contract.totalValue || 0;

            parsedData.inputData.totalHeight = parsedData.inputData.totalHeight || 0;
            parsedData.selectedOption.totalLength = parsedData.selectedOption.totalLength || 0;
            parsedData.selectedOption.stairWidth = parsedData.selectedOption.stairWidth || parsedData.width || parsedData.largura || 0;
            parsedData.selectedOption.stepHeight = parsedData.selectedOption.stepHeight || parsedData.altura || 0;
            parsedData.selectedOption.treadDepth = parsedData.selectedOption.treadDepth || parsedData.pisante || 0;
            parsedData.selectedOption.structureSteps = parsedData.selectedOption.structureSteps || parsedData.degraus || 0;
            parsedData.finalLandingsPrice = parsedData.finalLandingsPrice || 0;
            parsedData.freightCost = parsedData.freightCost || 0;
            parsedData.tollCost = parsedData.tollCost || 0;
            parsedData.installationCost = parsedData.installationCost || 0;
            parsedData.extrasCost = parsedData.extrasCost || 0;

            generateContractPDF(parsedData);
        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
            alert("Erro ao ler os dados do contrato.");
        }
    };

    const handleDownloadTechnical = (contract: SavedContract) => {
        try {
            let parsedData: any = contract.contractData;
            let maxIters = 5;
            while (typeof parsedData === 'string' && maxIters > 0) {
                try { parsedData = JSON.parse(parsedData); } catch(e){ break; }
                maxIters--;
            }
            if (parsedData?.contractData) {
                parsedData = parsedData.contractData;
                maxIters = 5;
                while (typeof parsedData === 'string' && maxIters > 0) {
                    try { parsedData = JSON.parse(parsedData); } catch(e){ break; }
                    maxIters--;
                }
            }
            
            // Função para extrair independentemente de onde a key estiver
            const searchProp = (obj: any, key: string): any => {
                if (!obj || typeof obj !== 'object') return undefined;
                if (key in obj) return obj[key];
                for (const k in obj) {
                    const res = searchProp(obj[k], key);
                    if (res !== undefined) return res;
                }
                return undefined;
            };

            const getProp = (key: string) => 
                parsedData?.selectedOption?.[key] || 
                parsedData?.inputData?.[key] || 
                parsedData?.[key] ||
                searchProp(parsedData, key);

            const technicalProps = {
                clientName: parsedData?.userData?.name || contract.clientName || 'CLIENTE NÃO INFORMADO',
                totalSteps: getProp('steps') || getProp('desiredSteps') || getProp('totalSteps') || getProp('degraus') || getProp('structureSteps') || 0,
                stepHeightCm: getProp('stepHeight') || getProp('stepHeightCm') || getProp('altura') || 0,
                treadDepthCm: getProp('treadDepth') || getProp('treadDepthCm') || getProp('pisante') || 0,
                widthCm: getProp('stairWidth') || getProp('widthCm') || getProp('width') || getProp('largura') || 0,
                totalLength: getProp('totalLength') || 0,
                landings: getProp('landings') || [],
                stairDirection: getProp('stairDirection') || 'standard',
                wallFixation: getProp('wallFixation') || 'left',
                cutStepType: getProp('cutStepType') || 'left',
                treadMaterial: getProp('treadMaterial') || 'wood',
                address: parsedData?.userData?.address || '',
                zip: parsedData?.userData?.zip || '',
                optionalItems: getProp('optionalItems') || []
            };

            // AUTO-FIX: Se não houver patamar nos dados estruturados, tenta extrair das notas (para os backups antigos)
            if (technicalProps.landings.length === 0 && contract.measurementsNotes) {
                // Procura por algo como "PATAMAR: 1,20M POR 1,65CM"
                const patamarRegex = /PATAMAR.*?([\d,\.]+)\s*[A-Z]*\s*(?:POR|X)\s*([\d,\.]+)\s*[A-Z]*/i;
                const match = contract.measurementsNotes.match(patamarRegex);
                if (match) {
                    let val1 = parseFloat(match[1].replace(',', '.'));
                    let val2 = parseFloat(match[2].replace(',', '.'));
                    
                    // Converte para cm se parece estar em metros (ex: 1.2 vira 120)
                    if (val1 < 10) val1 = val1 * 100;
                    if (val2 < 10) val2 = val2 * 100;

                    technicalProps.landings = [{
                        id: 'legacy-landing',
                        width: val1 / 100, // o PDF generator multiplica por 10 e assume que era cm/m
                        length: val2 / 100, // mantemos compatível com o q ele faria
                    }];
                }
            }
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
                                    {contract.deliveryDate && (
                                        <p className="text-orange-600 dark:text-orange-400 font-semibold mt-1">
                                            Entrega: {contract.deliveryDate.split('-').reverse().join('/')}
                                        </p>
                                    )}
                                    <p className="font-semibold text-highlight mt-1">
                                        {(() => {
                                            let val = contract.totalValue;
                                            if (isNaN(Number(val)) || val === undefined || val === null) {
                                                try {
                                                    let parsedData = typeof contract.contractData === 'string' ? JSON.parse(contract.contractData) : contract.contractData;
                                                    while (typeof parsedData === 'string') parsedData = JSON.parse(parsedData);
                                                    if (parsedData?.totalValue) val = parsedData.totalValue;
                                                    else if (parsedData?.contractData?.totalValue) val = parsedData.contractData.totalValue;
                                                    else if (parsedData?.contractData?.selectedOption?.totalPrice) val = parsedData.contractData.selectedOption.totalPrice;
                                                    else if (parsedData?.finalStairPrice) val = (parsedData.finalStairPrice || 0) + (parsedData.finalLandingsPrice || 0);
                                                } catch(e) { val = 0; }
                                            }
                                            return formatCurrencyBRL(Number(val) || 0);
                                        })()}
                                    </p>
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
                                                onClick={() => handleDownload(contract)}
                                                className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 text-xs py-1.5 rounded font-medium transition-colors"
                                                title="Baixar PDF do Contrato"
                                            >
                                                📄 Contrato
                                            </button>
                                            <button 
                                                onClick={() => handleDownloadTechnical(contract)}
                                                className="flex-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-200 text-xs py-1.5 rounded font-medium transition-colors"
                                                title="Baixar Ficha Técnica (Produção + Matéria Prima)"
                                            >
                                                ⚙️ Ficha Técnica
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedContractForReceipt(contract);
                                                    setReceiptModalOpen(true);
                                                }}
                                                className="flex-1 bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 text-green-700 dark:text-green-200 text-xs py-1.5 rounded font-medium transition-colors"
                                                title="Gerar Recibo de Pagamento"
                                            >
                                                💰 Recibo
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

    const exportDatabase = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(contracts, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "backup_banco_escadas.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
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
                <div className="flex gap-2">
                    <button 
                        onClick={async () => {
                            const confirmed = window.confirm('Deseja realmente limpar contratos duplicados no banco?');
                            if (confirmed) {
                                await cleanDuplicateContracts();
                            }
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors text-sm"
                    >
                        Limpar Duplicados
                    </button>
                    <button 
                        onClick={exportDatabase}
                        className="bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors text-sm"
                    >
                        📦 Exportar Banco (Backup)
                    </button>
                    <button 
                        onClick={openAddModal}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors text-sm"
                    >
                        + Adicionar Pedido Retroativo
                    </button>
                </div>
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

                            <div className="pt-2">
                                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2 border-b border-gray-200 dark:border-gray-700 pb-1">Medidas para a Ficha (Opcional)</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Pisada (cm)</label>
                                        <input 
                                            type="number" step="any"
                                            value={formData.treadDepth}
                                            onChange={(e) => setFormData({...formData, treadDepth: e.target.value})}
                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Altura (cm)</label>
                                        <input 
                                            type="number" step="any"
                                            value={formData.stepHeight}
                                            onChange={(e) => setFormData({...formData, stepHeight: e.target.value})}
                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Largura (cm)</label>
                                        <input 
                                            type="number" step="any"
                                            value={formData.stairWidth}
                                            onChange={(e) => setFormData({...formData, stairWidth: e.target.value})}
                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nº Degraus</label>
                                        <input 
                                            type="number" 
                                            value={formData.totalSteps}
                                            onChange={(e) => setFormData({...formData, totalSteps: e.target.value})}
                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            {/* Sessão de Debug Oculta para ajudar a ver os dados brutos */}
                            <details className="mt-4 border border-gray-300 dark:border-gray-600 rounded p-2 text-xs">
                                <summary className="cursor-pointer text-gray-500 font-bold">Ver Dados Brutos (Debug - Copie para o Desenvolvedor)</summary>
                                <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded overflow-x-auto max-h-64 overflow-y-auto">
                                    {JSON.stringify(editingContract, null, 2)}
                                </pre>
                            </details>
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
                            {editingContract && (editingContract.contractData || formData.contractDataString) ? (
                                <button
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        let parsedData = {};
                                        try {
                                            const dataToParse = formData.contractDataString || editingContract.contractData;
                                            parsedData = typeof dataToParse === 'string' 
                                                ? JSON.parse(dataToParse) 
                                                : dataToParse;
                                            
                                            while (typeof parsedData === 'string') {
                                                parsedData = JSON.parse(parsedData);
                                            }
                                        } catch (e) {
                                            console.error("Erro ao parsear contractData", e);
                                            alert("Erro ao ler os dados do contrato. O formato pode estar corrompido.");
                                            return;
                                        }
                                        navigate('/contrato', { 
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

            {/* Modal de Seleção de Recibo */}
            {receiptModalOpen && selectedContractForReceipt && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm p-6 overflow-hidden">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center">
                            Gerar Recibo
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 text-center">
                            Qual tipo de recibo deseja gerar para <strong>{selectedContractForReceipt.clientName}</strong>?
                        </p>
                        
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => {
                                    generatePaymentReceiptPDF(selectedContractForReceipt, 50);
                                    setReceiptModalOpen(false);
                                }}
                                className="w-full py-3 bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900 dark:hover:bg-blue-800 dark:text-blue-200 rounded-lg font-bold transition-colors"
                            >
                                Recibo de Sinal (50%)
                            </button>
                            
                            <button
                                onClick={() => {
                                    generatePaymentReceiptPDF(selectedContractForReceipt, 100);
                                    setReceiptModalOpen(false);
                                }}
                                className="w-full py-3 bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900 dark:hover:bg-green-800 dark:text-green-200 rounded-lg font-bold transition-colors"
                            >
                                Recibo Integral (100%)
                            </button>
                            
                            <button
                                onClick={() => setReceiptModalOpen(false)}
                                className="mt-4 w-full py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
