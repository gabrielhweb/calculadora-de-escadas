import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SavedContract, ContractStatus } from '../types';
import { formatCurrencyBRL } from '../utils';
import { generateContractPDF } from '../utils/contractGenerator';
import { generateUnifiedTechnicalPDF } from '../utils/technicalPdfGenerator';
import { generateGuardrailsOnlyPDF } from '../utils/productionPdfGenerator';
import { generatePaymentReceiptPDF } from '../utils/paymentReceiptGenerator';
import { parseContractData } from '../utils/freightDimensions';
import { resolveClientInfo, normalizeName } from '../utils/clientInfo';
import { resolveFreightInfo, buildFreightQuoteText, getInvoiceValue, copyTextToClipboard, MISSING_INFO } from '../utils/freightQuoteText';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, getDocs, addDoc, setDoc } from 'firebase/firestore';
import { FABIO_CHALITA_CONTRACT_DATA } from '../data/fabioChalitaContract';
import { MARIA_HELENA_CONTRACT_DATA } from '../data/mariaHelenaContract';
import { db, auth } from '../firebase';
import { useAuth } from '../components/AuthProvider';

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
        totalSteps: '',
        wallFixation: 'left' as 'left' | 'right' | 'frontal'
    });

    
    const FIX_DATA = [
      { clientName: "Fabio Chalita M A Samra", steps: 12, structureSteps: 11, stepHeightCm: 23.77, treadDepthCm: 12.64, widthCm: 60, totalLength: 190, wallFixation: "right", treadMaterial: "wood", woodType: "muiracatiara", landings: [{ length: 40, width: 60, price: 1440, type: "articulated", direction: "right", isFlushWithSlab: false, frenchBrackets: 2, hasSideGuardrail: true }], totalValue: 7463.25 },
      { clientName: "Diego Ferreira Santos", steps: 13, stepHeightCm: 22.14, treadDepthCm: 20.00, widthCm: 60, totalLength: 267, wallFixation: "left", treadMaterial: "metal", landings: [], totalValue: 6327 },
      { clientName: "Alexandre Bergamo de Oliveira", steps: 13, stepHeightCm: 24.43, treadDepthCm: 16.00, widthCm: 52, totalLength: 215, wallFixation: "frontal", treadMaterial: "metal", landings: [], totalValue: 7215.25 },
      { clientName: "Andréa Aragão Ferreira Rovina", steps: 13, stepHeightCm: 23.00, treadDepthCm: 20.00, widthCm: 70, totalLength: 267, wallFixation: "right", treadMaterial: "wood", landings: [], totalValue: 7476.50 },
      { clientName: "Joquebede dos Santos Coelho Rodrigues", steps: 11, stepHeightCm: 25.17, treadDepthCm: 13.00, widthCm: 60, totalLength: 149, wallFixation: "right", treadMaterial: "metal", landings: [], totalValue: 5529 },
      { clientName: "Ricardo Torres Soares", steps: 13, stepHeightCm: 22.14, treadDepthCm: 20.00, widthCm: 60, totalLength: 337, wallFixation: "left", treadMaterial: "metal", landings: [{width: 70, length: 70}], totalValue: 7894.50 },
      { clientName: "Felipe Pagliarde Cerezer", steps: 7, stepHeightCm: 24.25, treadDepthCm: 20.00, widthCm: 70, totalLength: 144, wallFixation: "right", treadMaterial: "metal", landings: [], totalValue: 3724 },
      { clientName: "Márcia Campos Nogueira", steps: 13, stepHeightCm: 20.93, treadDepthCm: 20.00, widthCm: 60, totalLength: 267, wallFixation: "left", treadMaterial: "metal", landings: [], totalValue: 7039.50 },
      { clientName: "Mario dos Reis Filho", steps: 11, stepHeightCm: 23.54, treadDepthCm: 20.00, widthCm: 58, totalLength: 225, wallFixation: "right", treadMaterial: "metal", landings: [], totalValue: 5771.25 },
      { clientName: "Maria Helena Jara Guastamacchia", steps: 13, structureSteps: 13, stepHeightCm: 19.57, treadDepthCm: 20.00, widthCm: 70, totalLength: 267, wallFixation: "left", treadMaterial: "metal", landings: [], totalValue: 7251.35 }
    ];

    const handleFixContractData = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'contracts'));
            let updated = 0;
            querySnapshot.forEach(async (docSnap) => {
                const c = docSnap.data();
                const fix = FIX_DATA.find(f => f.clientName === c.clientName);
                if (fix && !c.contractData) {
                    await updateDoc(doc(db, 'contracts', docSnap.id), {
                        contractData: JSON.stringify(fix)
                    });
                    updated++;
                }
            });
            alert("Corrigido " + FIX_DATA.length + " contratos. Atualize a página!");
        } catch(e) {
            console.error(e);
            alert("Erro");
        }
    };
    const INJECT_DATA = [
        { name: "Fabio Chalita M A Samra", data: { steps: 12, structureSteps: 11, stepHeight: 23.77, treadDepth: 12.64, stairWidth: 60, totalHeight: 309, totalLength: 190, wallFixation: "right", treadMaterial: "wood", woodType: "muiracatiara", landings: [{ length: 40, width: 60, price: 1440, type: "articulated", direction: "right", isFlushWithSlab: false, frenchBrackets: 2, hasSideGuardrail: true }] } },
        { name: "Diego Ferreira Santos", data: { steps: 13, stepHeight: 22.14, treadDepth: 20, stairWidth: 60, totalHeight: 310, totalLength: 267, wallFixation: "left", treadMaterial: "metal" } },
        { name: "Alexandre Bergamo de Oliveira", data: { steps: 13, stepHeight: 24.43, treadDepth: 16, stairWidth: 52, totalHeight: 342, totalLength: 215, wallFixation: "front", treadMaterial: "metal" } },
        { name: "Andréa Aragão Ferreira Rovina", data: { steps: 13, stepHeight: 23.00, treadDepth: 20, stairWidth: 70, totalHeight: 322, totalLength: 267, wallFixation: "right", treadMaterial: "wood", woodType: "Muiracatiara" } },
        { name: "Joquebede", data: { steps: 11, stepHeight: 25.17, treadDepth: 13, stairWidth: 60, totalHeight: 302, totalLength: 149, wallFixation: "right", treadMaterial: "metal" } },
        { name: "Ricardo Torres Soares", data: { steps: 13, stepHeight: 22.14, treadDepth: 20, stairWidth: 60, totalHeight: 310, totalLength: 337, wallFixation: "left", treadMaterial: "metal", landings: [{ type: "fixo", width: 70, length: 70, customHeight: "" }] } },
        { name: "Felipe Pagliarde", data: { steps: 7, stepHeight: 24.25, treadDepth: 20, stairWidth: 70, totalHeight: 194, totalLength: 144, wallFixation: "right", treadMaterial: "metal" } },
        { name: "Márcia Campos Nogueira", data: { steps: 13, stepHeight: 20.93, treadDepth: 20, stairWidth: 60, totalHeight: 293, totalLength: 267, wallFixation: "left", treadMaterial: "metal" } },
        { name: "Mario dos Reis Filho", data: { steps: 11, stepHeight: 23.54, treadDepth: 20, stairWidth: 58, totalHeight: 283, totalLength: 225, wallFixation: "right", treadMaterial: "metal" } }
    ];

    const fetchContracts = () => {};

    const handleInjectData = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'contracts'));
            let updated = 0;
            querySnapshot.forEach(async (docSnap) => {
                const docData = docSnap.data();
                const match = INJECT_DATA.find(i => docData.clientName && docData.clientName.toLowerCase().includes(i.name.toLowerCase()));
                if (match && !docData.contractData) {
                    const fakeContractData = {
                        inputData: { totalHeight: match.data.totalHeight },
                        selectedOption: {
                            steps: match.data.steps,
                            stepHeight: match.data.stepHeight,
                            treadDepth: match.data.treadDepth,
                            stairWidth: match.data.stairWidth,
                            totalLength: match.data.totalLength,
                            wallFixation: match.data.wallFixation,
                            treadMaterial: match.data.treadMaterial,
                            woodType: match.data.woodType || 'Garapeira',
                            landings: match.data.landings || [],
                            cutStepType: 'left',
                            stairDirection: 'standard'
                        }
                    };
                    await updateDoc(doc(db, 'contracts', docSnap.id), {
                        contractData: JSON.stringify(fakeContractData),
                        contractDataString: JSON.stringify(fakeContractData),
                        treadDepth: match.data.treadDepth.toString(),
                        stepHeight: match.data.stepHeight.toString(),
                        stairWidth: match.data.stairWidth.toString(),
                        totalSteps: match.data.steps.toString()
                    });
                    updated++;
                }
            });
            setTimeout(() => {
                if (updated > 0) {
                    alert(`Sucesso! ${updated} contratos foram preenchidos automaticamente com as medidas lidas dos PDFs!\nAgora os botões de Ficha Técnica vão funcionar perfeitamente.`);
                    fetchContracts();
                } else {
                    alert("Nenhum contrato vazio encontrado para injetar.");
                }
            }, 2000);
        } catch (e) {
            console.error(e);
            alert("Erro ao injetar dados");
        }
    };

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
            totalSteps: '',
            wallFixation: 'left'
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

        const getProp = (key: string) => {
            if (parsed?.selectedOption && parsed.selectedOption[key] !== undefined && parsed.selectedOption[key] !== '') return parsed.selectedOption[key];
            if (parsed?.inputData && parsed.inputData[key] !== undefined && parsed.inputData[key] !== '') return parsed.inputData[key];
            if (parsed && parsed[key] !== undefined && parsed[key] !== '') return parsed[key];
            return undefined;
        };

        const tDepth = getProp('treadDepth') ?? getProp('treadDepthCm') ?? getProp('pisante');
        const sHeight = getProp('stepHeight') ?? getProp('stepHeightCm') ?? getProp('altura');
        const sWidth = getProp('stairWidth') ?? getProp('widthCm') ?? getProp('width') ?? getProp('largura');
        const sSteps = getProp('steps') ?? getProp('desiredSteps') ?? getProp('totalSteps') ?? getProp('degraus');

        let val = contract.totalValue;
        if (isNaN(Number(val)) || val === undefined || val === null || val === 0) {
            if (parsed?.totalValue) val = parsed.totalValue;
            else if (parsed?.contractData?.totalValue) val = parsed.contractData.totalValue;
            else if (parsed?.contractData?.selectedOption?.totalPrice) val = parsed.contractData.selectedOption.totalPrice;
            else if (parsed?.finalStairPrice) val = (parsed.finalStairPrice || 0) + (parsed.finalLandingsPrice || 0);
        }
        val = Number(val) || 0;

        const wFix = (getProp('wallFixation') || (getProp('cutStepType')?.includes('right') ? 'right' : 'left')) as 'left' | 'right' | 'frontal';

        setFormData({
            clientName: contract.clientName || '',
            totalValue: val,
            createdAt: dateString,
            status: contract.status || 'pendente',
            paymentStatus: contract.paymentStatus || 'a_receber',
            deliveryStatus: contract.deliveryStatus || 'em_producao',
            contractDataString: dataString,
            treadDepth: tDepth !== undefined && tDepth !== null ? String(tDepth) : '',
            stepHeight: sHeight !== undefined && sHeight !== null ? String(sHeight) : '',
            stairWidth: sWidth !== undefined && sWidth !== null ? String(sWidth) : '',
            totalSteps: sSteps !== undefined && sSteps !== null ? String(sSteps) : '',
            wallFixation: wFix || 'left'
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

            if (formData.wallFixation) {
                parsedContractData.wallFixation = formData.wallFixation;
                if (!parsedContractData.inputData) parsedContractData.inputData = {};
                parsedContractData.inputData.wallFixation = formData.wallFixation;
                const currentCut = parsedContractData.inputData.cutStepType || parsedContractData.cutStepType || '';
                const isHollow = currentCut.startsWith('hollow') || parsedContractData.inputData.treadMaterial === 'wood' || parsedContractData.inputData.treadMaterial === 'chapa_vazada';
                if (formData.wallFixation === 'right') {
                    parsedContractData.cutStepType = isHollow ? 'hollow_right' : 'right';
                    parsedContractData.inputData.cutStepType = isHollow ? 'hollow_right' : 'right';
                } else if (formData.wallFixation === 'left') {
                    parsedContractData.cutStepType = isHollow ? 'hollow_left' : 'left';
                    parsedContractData.inputData.cutStepType = isHollow ? 'hollow_left' : 'left';
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
        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const loadedContracts: SavedContract[] = [];
            let foundAlexandre = false;
            let foundFabio = false;
            let foundMariaHelena = false;

            snapshot.forEach((docSnap) => {
                const docData = docSnap.data();
                // Ignorar documentos que são produtos ou outras entidades
                if (docData.isProduct || docData.isPurchaseOrder) return;

                const cName = (docData.clientName || '').toLowerCase().trim();
                if (cName.includes('alexandre bergamo')) {
                    foundAlexandre = true;
                    let needsUpdate = false;
                    const updates: any = {};
                    if (docData.status === 'pendente' || !docData.status) {
                        updates.status = 'producao';
                        docData.status = 'producao';
                        needsUpdate = true;
                    }
                    if (!docData.totalValue || Number(docData.totalValue) <= 230) {
                        updates.totalValue = 7215.25;
                        docData.totalValue = 7215.25;
                        needsUpdate = true;
                    }
                    if (!docData.contractData) {
                        const fix = FIX_DATA.find(f => f.clientName === "Alexandre Bergamo de Oliveira");
                        if (fix) {
                            updates.contractData = JSON.stringify(fix);
                            updates.totalSteps = String(fix.steps);
                            updates.stepHeight = String(fix.stepHeightCm);
                            updates.treadDepth = String(fix.treadDepthCm);
                            updates.stairWidth = String(fix.widthCm);
                            updates.wallFixation = fix.wallFixation;
                            updates.treadMaterial = fix.treadMaterial;
                            needsUpdate = true;
                        }
                    }
                    if (needsUpdate) {
                        updateDoc(doc(db, 'contracts', docSnap.id), updates).catch(() => {});
                    }
                }
                
                if (cName.includes('fabio chalita') || cName.includes('chalita')) {
                    foundFabio = true;
                    let needsUpdate = false;
                    const updates: any = {};
                    if (docData.status === 'pendente' || !docData.status) {
                        updates.status = 'producao';
                        docData.status = 'producao';
                        needsUpdate = true;
                    }
                    if (!docData.totalValue || Number(docData.totalValue) === 0) {
                        updates.totalValue = 7463.25;
                        docData.totalValue = 7463.25;
                        needsUpdate = true;
                    }
                    if (!docData.contractData) {
                        updates.contractData = JSON.stringify(FABIO_CHALITA_CONTRACT_DATA);
                        updates.contractDataString = JSON.stringify(FABIO_CHALITA_CONTRACT_DATA);
                        updates.totalSteps = "12";
                        updates.structureSteps = "11";
                        updates.stepHeight = "23.77";
                        updates.treadDepth = "12.64";
                        updates.stairWidth = "60";
                        updates.wallFixation = "right";
                        updates.treadMaterial = "wood";
                        updates.woodType = "muiracatiara";
                        needsUpdate = true;
                    }
                    if (needsUpdate) {
                        updateDoc(doc(db, 'contracts', docSnap.id), updates).catch(() => {});
                    }
                }

                if (cName.includes('maria helena') || cName.includes('guastamacchia')) {
                    foundMariaHelena = true;
                    let needsUpdate = false;
                    const updates: any = {};
                    if (docData.status === 'pendente' || !docData.status) {
                        updates.status = 'producao';
                        docData.status = 'producao';
                        needsUpdate = true;
                    }
                    if (!docData.totalValue || Number(docData.totalValue) === 0) {
                        updates.totalValue = 7251.35;
                        docData.totalValue = 7251.35;
                        needsUpdate = true;
                    }
                    if (!docData.contractData) {
                        updates.contractData = JSON.stringify(MARIA_HELENA_CONTRACT_DATA);
                        updates.contractDataString = JSON.stringify(MARIA_HELENA_CONTRACT_DATA);
                        updates.totalSteps = "13";
                        updates.structureSteps = "13";
                        updates.stepHeight = "19.57";
                        updates.treadDepth = "20.00";
                        updates.stairWidth = "70";
                        updates.wallFixation = "left";
                        updates.treadMaterial = "metal";
                        needsUpdate = true;
                    }
                    if (needsUpdate) {
                        updateDoc(doc(db, 'contracts', docSnap.id), updates).catch(() => {});
                    }
                }

                loadedContracts.push({ id: docSnap.id, ...docData } as SavedContract);
            });

            // Se Alexandre Bergamo não estiver em contracts, busca na production_queue ou restaura automaticamente
            if (!foundAlexandre) {
                try {
                    const queueSnap = await getDocs(collection(db, 'production_queue'));
                    let alexDoc = queueSnap.docs.find(d => (d.data().clientName || '').toLowerCase().includes('alexandre bergamo'));
                    
                    const fix = FIX_DATA.find(f => f.clientName === "Alexandre Bergamo de Oliveira");
                    const newAlexContract: any = {
                        clientName: "Alexandre Bergamo de Oliveira",
                        totalValue: 7215.25,
                        downPayment: 3607.63,
                        balanceDue: 3607.62,
                        status: 'producao',
                        deliveryStatus: 'em_producao',
                        paymentStatus: 'a_receber',
                        customAddress: "Jardim Residencial Chácara Ondina - Sorocaba",
                        location: "Jardim Residencial Chácara Ondina - Sorocaba",
                        totalSteps: String(fix?.steps || 13),
                        stepHeight: String(fix?.stepHeightCm || 24.43),
                        treadDepth: String(fix?.treadDepthCm || 16.00),
                        stairWidth: String(fix?.widthCm || 52),
                        wallFixation: fix?.wallFixation || 'frontal',
                        treadMaterial: fix?.treadMaterial || 'metal',
                        createdAt: alexDoc?.data()?.createdAt || new Date().toISOString(),
                        contractData: JSON.stringify(fix || {
                            steps: 13, stepHeightCm: 24.43, treadDepthCm: 16.00, widthCm: 52, totalLength: 215, wallFixation: "frontal", treadMaterial: "metal", landings: [], totalValue: 7215.25
                        })
                    };

                    const docRef = await addDoc(collection(db, 'contracts'), newAlexContract);
                    if (alexDoc) {
                        await updateDoc(doc(db, 'production_queue', alexDoc.id), {
                            contractId: docRef.id,
                            downPayment: 3607.63,
                            balanceDue: 3607.62
                        });
                    }
                    loadedContracts.push({ id: docRef.id, ...newAlexContract } as SavedContract);
                } catch(e) {
                    console.error("Erro ao auto-restaurar Alexandre Bergamo em contracts:", e);
                }
            }

            // Se Fabio Chalita não estiver em contracts, busca na production_queue ou restaura automaticamente
            if (!foundFabio) {
                try {
                    const queueSnap = await getDocs(collection(db, 'production_queue'));
                    let fabioDoc = queueSnap.docs.find(d => {
                        const name = (d.data().clientName || '').toLowerCase();
                        return name.includes('fabio chalita') || name.includes('chalita');
                    });
                    
                    const newFabioContract: any = {
                        clientName: "Fabio Chalita M A Samra",
                        totalValue: 7463.25,
                        baseTotalValue: 7463.25,
                        interestValue: 0,
                        downPayment: 3731.63,
                        balanceDue: 3731.62,
                        status: 'producao',
                        deliveryStatus: 'em_producao',
                        paymentStatus: 'a_receber',
                        customAddress: "Rua Ypês, 92 - Salto de Baixo, Extrema - MG, 37647-364",
                        location: "Salto de Baixo - Extrema/MG",
                        totalSteps: "12",
                        structureSteps: "11",
                        stepHeight: "23.77",
                        treadDepth: "12.64",
                        stairWidth: "60",
                        wallFixation: "right",
                        treadMaterial: "wood",
                        woodType: "muiracatiara",
                        createdAt: "2026-10-16T12:32:19.000Z",
                        contractData: JSON.stringify(FABIO_CHALITA_CONTRACT_DATA),
                        contractDataString: JSON.stringify(FABIO_CHALITA_CONTRACT_DATA),
                        userId: user?.uid || 'system'
                    };

                    const docRef = await addDoc(collection(db, 'contracts'), newFabioContract);
                    if (fabioDoc) {
                        await updateDoc(doc(db, 'production_queue', fabioDoc.id), {
                            contractId: docRef.id,
                            downPayment: 3731.63,
                            balanceDue: 3731.62,
                            value: 7463.25,
                            baseTotalValue: 7463.25
                        });
                    } else {
                        const newOrder: any = {
                            id: Date.now().toString() + "_queue_fabio",
                            contractId: docRef.id,
                            createdAt: "2026-10-16T12:32:19.000Z",
                            clientName: "Fabio Chalita M A Samra",
                            deliveryDate: "",
                            downPayment: 3731.63,
                            balanceDue: 3731.62,
                            value: 7463.25,
                            baseTotalValue: 7463.25,
                            interestValue: 0,
                            status: "in_queue",
                            boardStage: "corte",
                            location: "Salto de Baixo - Extrema/MG",
                            profit: 4800,
                            totalCost: 2663.25,
                            downPaymentStatus: "paid",
                            balanceStatus: "pending",
                            paymentMethod: "pix",
                            pixTiming: "entry",
                        };
                        await setDoc(doc(db, 'production_queue', newOrder.id), newOrder);
                    }
                    loadedContracts.push({ id: docRef.id, ...newFabioContract } as SavedContract);
                } catch(e) {
                    console.error("Erro ao auto-restaurar Fabio Chalita em contracts:", e);
                }
            }

            // Se Maria Helena não estiver em contracts, busca na production_queue ou restaura automaticamente
            if (!foundMariaHelena) {
                try {
                    const queueSnap = await getDocs(collection(db, 'production_queue'));
                    let mariaDoc = queueSnap.docs.find(d => {
                        const name = (d.data().clientName || '').toLowerCase();
                        return name.includes('maria helena') || name.includes('guastamacchia');
                    });
                    
                    const newMariaContract: any = {
                        clientName: "Maria Helena Jara Guastamacchia",
                        totalValue: 7251.35,
                        baseTotalValue: 7251.35,
                        interestValue: 0,
                        downPayment: 3625.68,
                        balanceDue: 3625.67,
                        status: 'producao',
                        deliveryStatus: 'em_producao',
                        paymentStatus: 'a_receber',
                        customAddress: "Rua das Gilias, 389 - Vila Bela, São Paulo - SP, 03201-070",
                        location: "Vila Bela - São Paulo/SP",
                        totalSteps: "13",
                        structureSteps: "13",
                        stepHeight: "19.57",
                        treadDepth: "20.00",
                        stairWidth: "70",
                        wallFixation: "left",
                        treadMaterial: "metal",
                        createdAt: "2026-10-21T11:44:04.000Z",
                        contractData: JSON.stringify(MARIA_HELENA_CONTRACT_DATA),
                        contractDataString: JSON.stringify(MARIA_HELENA_CONTRACT_DATA),
                        userId: user?.uid || 'system'
                    };

                    const docRef = await addDoc(collection(db, 'contracts'), newMariaContract);
                    if (mariaDoc) {
                        await updateDoc(doc(db, 'production_queue', mariaDoc.id), {
                            contractId: docRef.id,
                            downPayment: 3625.68,
                            balanceDue: 3625.67,
                            value: 7251.35,
                            baseTotalValue: 7251.35
                        });
                    } else {
                        const newOrder: any = {
                            id: Date.now().toString() + "_queue_maria_helena",
                            contractId: docRef.id,
                            createdAt: "2026-10-21T11:44:04.000Z",
                            clientName: "Maria Helena Jara Guastamacchia",
                            deliveryDate: "",
                            downPayment: 3625.68,
                            balanceDue: 3625.67,
                            value: 7251.35,
                            baseTotalValue: 7251.35,
                            interestValue: 0,
                            status: "in_queue",
                            boardStage: "corte",
                            location: "Vila Bela - São Paulo/SP",
                            profit: 4500,
                            totalCost: 2751.35,
                            downPaymentStatus: "paid",
                            balanceStatus: "pending",
                            paymentMethod: "pix",
                            pixTiming: "entry",
                        };
                        await setDoc(doc(db, 'production_queue', newOrder.id), newOrder);
                    }
                    loadedContracts.push({ id: docRef.id, ...newMariaContract } as SavedContract);
                } catch(e) {
                    console.error("Erro ao auto-restaurar Maria Helena em contracts:", e);
                }
            }


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
            const { getDoc, setDoc } = await import('firebase/firestore');
            const contractRef = doc(db, 'contracts', id);
            await updateDoc(contractRef, { status: newStatus });
            
            if (newStatus === 'producao') {
                const contractSnap = await getDoc(contractRef);
                const contractData = contractSnap.data() as SavedContract;
                
                const q = query(collection(db, 'production_queue'), where('contractId', '==', id));
                const qSnap = await getDocs(q);
                
                if (qSnap.empty && contractData) {
                    const newOrder = {
                        id: Date.now().toString() + "_queue",
                        contractId: id,
                        createdAt: contractData.createdAt || new Date().toLocaleDateString('pt-BR'),
                        clientName: contractData.clientName || 'Cliente sem nome',
                        deliveryDate: contractData.deliveryDate || '',
                        downPayment: (contractData as any).downPayment || 0,
                        balanceDue: contractData.totalValue ? (contractData.totalValue - ((contractData as any).downPayment || 0)) : 0,
                        status: "in_queue",
                        boardStage: "corte",
                        location: (contractData as any).customAddress || '',
                        profit: 0,
                        totalCost: 0,
                        downPaymentStatus: "pending",
                        balanceStatus: "pending",
                        paymentMethod: "",
                        pixTiming: "",
                    };
                    await setDoc(doc(db, 'production_queue', newOrder.id), newOrder);
                }
            } else if (newStatus === 'falta_assinar') {
                // If moved back, we don't necessarily delete it from production_queue to preserve history,
                // but we could. For now, it stays there. The user can delete it via the queue page if needed.
            }
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
        if (!contract.contractData) {
            alert("Contrato sem medidas! Clique na setinha azul à esquerda para carregar o contrato, preencha as medidas do projeto (altura, pisada, degraus, etc) e clique em Salvar Alterações para poder gerar o contrato.");
            return;
        }
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
        if (!contract.contractData) {
            alert("Contrato sem medidas! Clique na setinha azul à esquerda para carregar o contrato, preencha as medidas do projeto (altura, pisada, degraus, etc) e clique em Salvar Alterações para poder gerar a ficha técnica.");
            return;
        }
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
                optionalItems: getProp('optionalItems') || [],
                hasCorrimao: getProp('hasCorrimao'),
                handrailHeight: getProp('handrailHeight'),
                quoteType: getProp('quoteType') || 'stair'
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
                        width: val1, // em cm
                        length: val2, // em cm
                    }];
                }
            }
            generateUnifiedTechnicalPDF(technicalProps);
        } catch (error) {
            console.error("Erro ao gerar PDF Técnico:", error);
            alert("Erro ao ler os dados do contrato para a ficha técnica.");
        }
    };

    const handleCopyFreightQuote = async (contract: SavedContract) => {
        // Usa o mesmo texto da Tabela de Entregas (inclusive se foi editado lá)
        let text = contract.freightQuoteText?.trim() ? contract.freightQuoteText : '';
        if (!text) {
            const data = parseContractData(contract.contractData, contract);
            const clientNorm = normalizeName(contract.clientName || data?.userData?.name);
            let queueItem: any;
            let quoteItem: any;
            try {
                const [queueSnap, quotesSnap] = await Promise.all([
                    getDocs(collection(db, 'production_queue')),
                    getDocs(collection(db, 'saved_quotes')),
                ]);
                queueItem = queueSnap.docs.map(d => d.data()).find(q => q.contractId === contract.id || (clientNorm && normalizeName(q.clientName) === clientNorm));
                quoteItem = quotesSnap.docs.map(d => d.data()).find(q => clientNorm && normalizeName(q.clientName) === clientNorm);
            } catch (err) {
                console.error('Erro ao buscar dados extras do cliente:', err);
            }
            const freightInfo = resolveFreightInfo(contract, data);
            text = buildFreightQuoteText({
                userData: resolveClientInfo({ contract, parsedData: data, queueItem, quoteItem }),
                invoiceValue: getInvoiceValue(data, contract, queueItem),
                freightInfo,
            });
        }
        const warning = text.includes(MISSING_INFO) ? '\n\nAtenção: tem informação faltando no texto (marcada com "FALTA INFORMAÇÃO").' : '';
        copyTextToClipboard(text, `Texto da transportadora copiado!${warning}`);
    };

    const handleDownloadGuardrail = (contract: SavedContract) => {
        if (!contract.contractData) {
            alert("Contrato sem medidas!");
            return;
        }
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

            let landings = parsedData?.landings || parsedData?.inputData?.landings || parsedData?.selectedOption?.landings || [];
            
            // Suporte a orçamentos de guarda-corpos avulsos
            const standaloneGuardrails = parsedData?.standaloneGuardrails || parsedData?.inputData?.standaloneGuardrails || [];
            if ((!landings || landings.length === 0) && standaloneGuardrails.length > 0) {
                landings = standaloneGuardrails.map((g: any, idx: number) => ({
                    id: `standalone-${idx}`,
                    hasGuardrail: true,
                    guardrailLength: g.length || 0,
                    guardrailHeight: g.height || 90,
                    guardrailBarsOverride: g.bars,
                    guardrailGapOverride: g.gap,
                    guardrailFormat: 'normal'
                }));
            }

            if (!landings || !Array.isArray(landings) || landings.length === 0) {
                alert("Nenhum patamar ou guarda-corpo encontrado neste contrato.");
                return;
            }

            const hasGuardrailOrGate = landings.some(l => l.hasGuardrail || l.hasGate);
            if (!hasGuardrailOrGate) {
                alert("Nenhum guarda-corpo ou portão cadastrado neste projeto.");
                return;
            }

            const cName = parsedData?.userData?.name || contract.clientName || 'CLIENTE NÃO INFORMADO';
            generateGuardrailsOnlyPDF(landings, cName);
        } catch (error) {
            console.error("Erro ao gerar PDF do Guarda-Corpo:", error);
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

    const [filterDelivery, setFilterDelivery] = useState<'todos' | 'em_producao' | 'a_entregar'>('todos');
    const [filterPayment, setFilterPayment] = useState<'todos' | 'a_receber' | 'recebido'>('todos');

    const renderColumn = (status: ContractStatus, title: string, colorClass: string) => {
        let columnContracts = contracts.filter(c => {
            const st = (c.status as string) || 'producao';
            if (st === 'pendente') return status === 'falta_assinar';
            return st === status;
        });

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
                                
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        {contract.paymentStatus === 'recebido' ? (
                                            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border border-green-200 dark:border-green-700">💰 Recebido</span>
                                        ) : (
                                            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-700">⏳ A Receber</span>
                                        )}
                                        {contract.deliveryStatus === 'a_entregar' && (
                                            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border border-orange-200 dark:border-orange-700">🚚 A Entregar</span>
                                        )}
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
                                                onClick={() => handleDownloadGuardrail(contract)}
                                                className="flex-1 bg-pink-100 hover:bg-pink-200 dark:bg-pink-900 dark:hover:bg-pink-800 text-pink-700 dark:text-pink-200 text-xs py-1.5 rounded font-medium transition-colors"
                                                title="Baixar PDF de Guarda-Corpo e Portão"
                                            >
                                                🚧 G. Corpo
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (!contract.contractData) {
                                                        alert("Contrato vazio! Clique na setinha azul à esquerda para carregar o contrato, preencha as medidas do projeto e salve para poder gerar o Recibo.");
                                                        return;
                                                    }
                                                    setSelectedContractForReceipt(contract);
                                                    setReceiptModalOpen(true);
                                                }}
                                                className="flex-1 bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 text-green-700 dark:text-green-200 text-xs py-1.5 rounded font-medium transition-colors"
                                                title="Gerar Recibo de Pagamento"
                                            >
                                                💰 Recibo
                                            </button>
                                            <button
                                                onClick={() => handleCopyFreightQuote(contract)}
                                                className="flex-1 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900 dark:hover:bg-indigo-800 text-indigo-700 dark:text-indigo-200 text-xs py-1.5 rounded font-medium transition-colors"
                                                title="Copiar texto de cotação para a transportadora"
                                            >
                                                🚚 Frete
                                            </button>
                                        </>

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
                </header>

            <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-x-auto pb-4 custom-scrollbar">
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
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Fixação na Parede (Lado dos Furos)</label>
                                        <select 
                                            value={formData.wallFixation}
                                            onChange={(e) => setFormData({...formData, wallFixation: e.target.value as any})}
                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                        >
                                            <option value="left">Parede à Esquerda (Furos no Lado Esquerdo)</option>
                                            <option value="right">Parede à Direita (Furos no Lado Direito)</option>
                                            <option value="frontal">Fixação Frontal (Sem furos laterais)</option>
                                        </select>
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

export default ContractsList;

