
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GoogleGenAI } from "@google/genai";
import { generateContractPDF } from '../utils/contractGenerator';
import { generateAceiteObraPDF } from '../utils/aceiteObraGenerator';
import { LandingInfo, OptionalItem } from '../types';
import { formatCurrencyBRL } from '../utils';
import { TechnicalBudget } from '../components/TechnicalBudget';
import { db, auth } from '../firebase';
import { doc, setDoc, updateDoc, collection, query, getDocs, getDoc } from 'firebase/firestore';
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

// Declaração global para SpeechRecognition (API do Navegador)
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const BRAZIL_STATES = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", 
    "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

const SectionTitle = ({ title, icon }: { title: string; icon?: React.ReactNode }) => (
    <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 border-b-2 border-highlight pb-2 flex items-center gap-2 uppercase">
        {icon}
        {title}
    </h2>
);

const ContractInput = ({ label, value, onChange, type = "text", placeholder = "", className = "", disabled=false, maxLength, onBlur, isLoading }: any) => (
    <div className={className}>
        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{label}</label>
        <div className="relative">
            <input 
                type={type} 
                value={value} 
                onChange={onChange} 
                onBlur={onBlur}
                disabled={disabled}
                placeholder={placeholder}
                maxLength={maxLength}
                className={`w-full bg-white dark:bg-gray-700 text-black dark:text-white p-3 rounded border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-highlight focus:ring-1 focus:ring-highlight font-medium shadow-sm transition-all ${disabled ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500' : ''}`}
            />
            {isLoading && <span className="absolute right-3 top-3 text-xs text-gray-500 dark:text-gray-400">Bus...</span>}
        </div>
    </div>
);

// Máscaras
const maskCPF = (value: string) => value.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');
const maskCNPJ = (value: string) => value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d)/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');
const maskRG = (value: string) => value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1})$/, '$1-$2');
const maskCEP = (value: string) => value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{3})\d+?$/, '$1');


const Contract = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const STANDARD_INSTALLATION = 290;
    
    // Dados do Cliente
    const [clientName, setClientName] = useState('');
    const [clientDoc, setClientDoc] = useState(''); // CPF ou CNPJ
    const [clientRG, setClientRG] = useState('');
    const [addToQueue, setAddToQueue] = useState(true);
    
    // Endereço Estruturado
    const [zip, setZip] = useState('');
    const [street, setStreet] = useState('');
    const [number, setNumber] = useState('');
    const [neighborhood, setNeighborhood] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [isLoadingCep, setIsLoadingCep] = useState(false);

    const [personType, setPersonType] = useState<'pf' | 'pj'>('pf');

    const [originalInputData, setOriginalInputData] = useState<any>(null);

    // Dados Técnicos
    const [totalHeight, setTotalHeight] = useState('300');
    const [width, setWidth] = useState('70');
    const [totalSteps, setTotalSteps] = useState('15');
    const [stepHeight, setStepHeight] = useState('20');
    const [treadDepth, setTreadDepth] = useState('25');
    const [totalLength, setTotalLength] = useState('300');
    const [dampers, setDampers] = useState('4');
    const [landings, setLandings] = useState<LandingInfo[]>([]);
    const [optionalItems, setOptionalItems] = useState<OptionalItem[]>([]);
    const [stairDirection, setStairDirection] = useState<'standard' | 'mirrored'>('standard');
    const [wallFixation, setWallFixation] = useState<'left' | 'right' | 'frontal'>('left');
    const [hasWheels, setHasWheels] = useState<boolean>(false);
    const [isFixedStair, setIsFixedStair] = useState<boolean>(false);
    const [handrailSide, setHandrailSide] = useState<'left' | 'right' | 'both'>('both');
    const [treadMaterial, setTreadMaterial] = useState<'metal' | 'wood' | 'chapa_xadrez' | 'chapa_vazada' | undefined>(undefined);
    const [woodType, setWoodType] = useState<'garapeira' | 'muiracatiara' | 'ambas' | undefined>(undefined);
    const [cutStepType, setCutStepType] = useState<'left' | 'right' | 'hollow_left' | 'hollow_right'>('left');
    const [userManuallyChangedCut, setUserManuallyChangedCut] = useState(false);

    // Sincroniza automaticamente os furos (cutStepType) com a Parede escolhida, caso não tenha sido alterado manualmente
    useEffect(() => {
        if (userManuallyChangedCut) return;
        const isHollow = treadMaterial === 'chapa_vazada';
        if (wallFixation === 'right') {
            setCutStepType(isHollow ? 'hollow_right' : 'right');
        } else {
            setCutStepType(isHollow ? 'hollow_left' : 'left');
        }
    }, [wallFixation, treadMaterial, userManuallyChangedCut]);

    const handleAddLanding = () => {
        const newLanding: LandingInfo = {
            id: Math.random().toString(36).substr(2, 9),
            step: totalSteps ? parseInt(totalSteps) / 2 : 1,
            price: 0,
            width: width ? parseFloat(width) : 70,
            length: width ? parseFloat(width) : 70,
            type: 'articulated',
            hasSideGuardrail: false,
            hasFrontGuardrail: false,
            direction: 'straight',
            frenchBrackets: 0,
            isAngled: false
        };
        setLandings([...landings, newLanding]);
    };

    const handleAddTopLanding = () => {
        const newLanding: LandingInfo = {
            id: Math.random().toString(36).substr(2, 9),
            step: totalSteps ? parseInt(totalSteps) : 15,
            price: 0,
            width: width ? parseFloat(width) : 70,
            length: width ? parseFloat(width) : 70,
            type: 'articulated',
            hasSideGuardrail: false,
            hasFrontGuardrail: false,
            direction: 'straight',
            isLastStep: true,
            isFlushWithSlab: false,
            frenchBrackets: 0,
            isAngled: false
        };
        setLandings([...landings, newLanding]);
    };

    const handleRemoveLanding = (id: string) => {
        setLandings(landings.filter(l => l.id !== id));
    };

    const updateLanding = (id: string, updates: Partial<LandingInfo>) => {
        setLandings(prev => prev.map(l => {
            if (l.id === id) {
                return { ...l, ...updates };
            }
            return l;
        }));
    };
    
    // Efeito para zerar amortecedores caso rodinhas sejam selecionadas ou seja fixa
    useEffect(() => {
        if (hasWheels || isFixedStair) {
            setDampers('0');
        }
    }, [hasWheels, isFixedStair]);
    
    // Inputs para adicionar novo item
    const [newItemName, setNewItemName] = useState('');
    const [newItemPrice, setNewItemPrice] = useState('');

    // Dados Financeiros (SEPARADOS)
    const [stairPrice, setStairPrice] = useState('0'); // Preço só da escada
    const [landingsPrice, setLandingsPrice] = useState('0'); // Preço total dos patamares
    
    const [freightPrice, setFreightPrice] = useState('0');
    const [freightMode, setFreightMode] = useState<'empresa' | 'transportadora' | 'entrega' | 'auto' | 'manual' | 'fixed'>('empresa');
    const [installationPrice, setInstallationPrice] = useState('0');
    const [extrasPrice, setExtrasPrice] = useState('0');
    
    // Configurações do Contrato
    const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card' | 'hybrid'>('pix');
    
    // Pagamento
    const [discountPercent, setDiscountPercent] = useState(0);
    const [discountValue, setDiscountValue] = useState('');
    const [signalPercent, setSignalPercent] = useState(50);
    const [installments, setInstallments] = useState(6);
    
    // --- LÓGICA DE VALOR MANUAL HÍBRIDO ---
    const [hybridSignalValue, setHybridSignalValue] = useState<string>(''); // Valor manual em R$
    const [pixTiming, setPixTiming] = useState<'entry' | 'delivery'>('entry'); // Quando o Pix é pago?
    
    // --- LÓGICA DE FLEXIBILIDADE DO RESTANTE ---
    const [remainderPaymentMode, setRemainderPaymentMode] = useState('Link de Pagamento (Cartão de Crédito)');

    // --- LÓGICA DE JUROS/TAXAS NO CARTÃO ---
    const [enableInterest, setEnableInterest] = useState(false);
    const [interestValue, setInterestValue] = useState(''); // Valor monetário (R$)
    const [hideInterestLabel, setHideInterestLabel] = useState(false); // Ocultar aviso de juros no PDF

    // --- IA JURÍDICA & REFINAMENTO ---
    const [customClauses, setCustomClauses] = useState<string[]>([]);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGeneratingClause, setIsGeneratingClause] = useState(false);
    
    // --- CAMPOS CUSTOMIZÁVEIS EXTRAS ---
    const [finishText, setFinishText] = useState('Fornecido com aplicação de fundo primer. Observação: a pintura final é de responsabilidade do cliente.');
    const [stepCapacityText, setStepCapacityText] = useState('180 quilos');
    const [stairCapacityText, setStairCapacityText] = useState('360 quilos');

    const [isSavingContract, setIsSavingContract] = useState(false);

    const [warrantyText, setWarrantyText] = useState('um ano');
    const [deliveryText, setDeliveryText] = useState(''); // Se vazio, usa o default com a data
    const [deliveryDays, setDeliveryDays] = useState<number>(30);

    // Estados para Refinamento (Chatzinho)
    const [refiningIndex, setRefiningIndex] = useState<number | null>(null);
    const [refinementPrompt, setRefinementPrompt] = useState('');
    const [isRefining, setIsRefining] = useState(false);

    // Estados para Voz
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);

    // Efeito para recalcular o total de Extras sempre que a lista mudar
    useEffect(() => {
        const totalExtras = optionalItems.reduce((acc, item) => acc + item.price, 0);
        setExtrasPrice(totalExtras.toFixed(2));
    }, [optionalItems]);

    // Cálculos Base
    const totalStructure = (parseFloat(stairPrice) || 0) + (parseFloat(landingsPrice) || 0);
    const totalGeralBase = totalStructure + (parseFloat(freightPrice)||0) + (parseFloat(installationPrice)||0) + (parseFloat(extrasPrice)||0);
    const discountMoney = parseFloat(discountValue) || 0;
    const discountedBase = Math.max(0, totalGeralBase - discountMoney);

    // Atualiza o valor manual do sinal híbrido quando o total muda, mas não sobrescreve se o usuário já digitou algo específico
    useEffect(() => {
        if (paymentMethod === 'hybrid') {
            const calculatedSignal = discountedBase * (signalPercent / 100);
            
            // Se o campo estiver vazio ou muito diferente (mudança de preço base drástica), atualiza
            if (!hybridSignalValue || Math.abs(calculatedSignal - (parseFloat(hybridSignalValue) || 0)) > 1) {
                 setHybridSignalValue(calculatedSignal.toFixed(2));
            }
        }
    }, [discountedBase, paymentMethod]); 

    useEffect(() => {
        if (location.state) {
            if (location.state.isEditing && location.state.savedContractData) {
                const data = location.state.savedContractData;
                const { userData, selectedOption, inputData, paymentDetails } = data;

                if (userData) {
                    setClientName(String(userData.name || ''));
                    setClientDoc(String(userData.cpf || ''));
                    setClientRG(String(userData.rg || ''));
                    setZip(String(userData.zip || ''));
                    setStreet(String(userData.street || userData.address || ''));
                    setNumber(String(userData.number || ''));
                    setNeighborhood(String(userData.neighborhood || ''));
                    setCity(String(userData.city || ''));
                    setState(String(userData.state || ''));
                    setPersonType(String(userData.cpf || '').length > 14 ? 'pj' : 'pf');
                }

                if (selectedOption && inputData) {
                    setOriginalInputData(inputData);
                    setTotalHeight(String(inputData.totalHeight || '300'));
                    setWidth(String(selectedOption.stairWidth || '70'));
                    setTotalSteps(String(selectedOption.steps || '15'));
                    setStepHeight(Number(selectedOption.stepHeight || 20).toFixed(2));
                    setTreadDepth(Number(selectedOption.treadDepth || 25).toFixed(2));
                    setTotalLength(String(selectedOption.totalLength || '300'));
                    setDampers(String(inputData.dampers || '4'));
                    setStairDirection(String(inputData.stairDirection || 'standard') as any);
                    setWallFixation(String(inputData.wallFixation || 'left') as any);
                    setHasWheels(Boolean(inputData.hasWheels));
                    setIsFixedStair(Boolean(inputData.isFixedStair));
                    setHandrailSide(String(inputData.handrailSide || 'both') as 'left'|'right'|'both');
                    setTreadMaterial(String(inputData.treadMaterial || 'wood') as any);
                    if (inputData.woodType) setWoodType(inputData.woodType as any);
                    
                    if (inputData.cutStepType) {
                        setCutStepType(inputData.cutStepType as any);
                        setUserManuallyChangedCut(true);
                    }
                    
                    if (selectedOption.landings && Array.isArray(selectedOption.landings) && selectedOption.landings.length > 0) {
                        setLandings(selectedOption.landings.filter(Boolean));
                    } else {
                        setLandings([]);
                    }
                    
                    if (data.finalStairPrice !== undefined) {
                        setStairPrice(Number(data.finalStairPrice).toFixed(2));
                        setLandingsPrice(Number(data.finalLandingsPrice || 0).toFixed(2));
                    } else {
                        const safeLandings = Array.isArray(selectedOption.landings) ? selectedOption.landings.filter(Boolean) : [];
                        const totalL = safeLandings.reduce((acc: number, l: LandingInfo) => acc + Number(l.price || 0), 0);
                        setLandingsPrice(totalL.toFixed(2));
                        setStairPrice((Number(selectedOption.totalPrice || 0) - totalL).toFixed(2));
                    }
                    
                    if (inputData.optionalItems && Array.isArray(inputData.optionalItems) && inputData.optionalItems.length > 0) {
                        setOptionalItems(inputData.optionalItems.filter(Boolean).map((item: any) => ({
                            id: String(item.id || Date.now()),
                            name: String(item.name || ''),
                            price: Number(item.price || 0)
                        })));
                    } else {
                        setOptionalItems([]);
                    }

                    setFreightPrice(data.freightCost ? Number(data.freightCost).toFixed(2) : '0');
                    if (inputData.logistics?.freightMode) {
                        setFreightMode(inputData.logistics.freightMode as 'empresa' | 'transportadora' | 'entrega' | 'auto' | 'manual' | 'fixed');
                    }
                    setInstallationPrice(data.installationCost ? Number(data.installationCost).toFixed(2) : '0');
                    setExtrasPrice(data.extrasCost ? Number(data.extrasCost).toFixed(2) : '0');
                }

                if (data.paymentMethod) setPaymentMethod(String(data.paymentMethod) as any);

                if (paymentDetails) {
                    setDiscountPercent(Number(paymentDetails.discountPercent || 0));
                    setDiscountValue(paymentDetails.discountValue ? Number(paymentDetails.discountValue).toFixed(2) : '');
                    setSignalPercent(Number(paymentDetails.signalPercent || 50));
                    setInstallments(Number(paymentDetails.installments || 6));
                    setHybridSignalValue(paymentDetails.hybridSignalAmount ? Number(paymentDetails.hybridSignalAmount).toFixed(2) : '');
                    setPixTiming(String(paymentDetails.pixTiming || 'entry') as any);
                    setRemainderPaymentMode(String(paymentDetails.remainderText || 'Link de Pagamento (Cartão de Crédito)'));
                }

                if (data.additionalClauses && Array.isArray(data.additionalClauses)) {
                    setCustomClauses(data.additionalClauses.map((c: any) => String(c)));
                } else {
                    setCustomClauses([]);
                }
                if (data.finishText) setFinishText(String(data.finishText));
                if (data.stepCapacityText) setStepCapacityText(String(data.stepCapacityText));
                if (data.stairCapacityText) setStairCapacityText(String(data.stairCapacityText));
                if (data.warrantyText) setWarrantyText(String(data.warrantyText));
                if (data.deliveryText) setDeliveryText(String(data.deliveryText));
                if (data.deliveryDays !== undefined) setDeliveryDays(Number(data.deliveryDays));

            } else {
                const { 
                    userData, selectedOption, inputData, 
                    freightCost, tollCost, installationCost 
                } = location.state;

                if (userData) {
                    setClientName(String(userData.name || ''));
                    setClientDoc(String(userData.cpf || ''));
                    setClientRG(String(userData.rg || ''));
                    
                    if (userData.zip) setZip(String(userData.zip));
                    if (userData.street) setStreet(String(userData.street));
                    if (userData.number) setNumber(String(userData.number));
                    if (userData.neighborhood) setNeighborhood(String(userData.neighborhood));
                    if (userData.city) setCity(String(userData.city));
                    if (userData.state) setState(String(userData.state));
                    if (userData.hideInterestLabel !== undefined) setHideInterestLabel(Boolean(userData.hideInterestLabel));
                    
                    if (!userData.street && userData.address) {
                        setStreet(String(userData.address));
                    }

                    if (userData.cpf && String(userData.cpf).length > 14) {
                        setPersonType('pj');
                    } else {
                        setPersonType('pf');
                    }
                }

                if (selectedOption && inputData) {
                    setOriginalInputData(inputData);
                    setTotalHeight(String(inputData.totalHeight || '300'));
                    setWidth(String(selectedOption.stairWidth || '70'));
                    setTotalSteps(String(selectedOption.steps || '15'));
                    setStepHeight(Number(selectedOption.stepHeight || 20).toFixed(2));
                    setTreadDepth(Number(selectedOption.treadDepth || 25).toFixed(2));
                    setTotalLength(String(selectedOption.totalLength || '300'));
                    setDampers(String(inputData.dampers || '4'));
                    setStairDirection(String(inputData.stairDirection || 'standard') as any);
                    setWallFixation(String(inputData.wallFixation || 'left') as any);
                    setHasWheels(Boolean(inputData.hasWheels));
                    setIsFixedStair(Boolean(inputData.isFixedStair));
                    setHandrailSide(String(inputData.handrailSide || 'both') as 'left'|'right'|'both');
                    setTreadMaterial(String(inputData.treadMaterial || 'wood') as any);
                    if (inputData.woodType) setWoodType(inputData.woodType as any);
                    
                    if (inputData.cutStepType) {
                        setCutStepType(inputData.cutStepType as any);
                        setUserManuallyChangedCut(true);
                    }
                    
                    if (selectedOption.landings && Array.isArray(selectedOption.landings) && selectedOption.landings.length > 0) {
                        const validLandings = selectedOption.landings.filter(Boolean);
                        setLandings(validLandings);
                        
                        // SEPARA O PREÇO: LANDINGS VS ESCADA
                        const totalL = validLandings.reduce((acc: number, l: LandingInfo) => acc + Number(l.price || 0), 0);
                        setLandingsPrice(totalL.toFixed(2));
                        setStairPrice((Number(selectedOption.totalPrice || 0) - totalL).toFixed(2));
                    } else {
                        setLandings([]);
                        setLandingsPrice('0');
                        setStairPrice(Number(selectedOption.totalPrice || 0).toFixed(2));
                    }
                    
                    if (inputData.optionalItems && Array.isArray(inputData.optionalItems) && inputData.optionalItems.length > 0) {
                        setOptionalItems(inputData.optionalItems.filter(Boolean).map((item: any) => ({
                            id: String(item.id || Date.now()),
                            name: String(item.name || ''),
                            price: Number(item.price || 0)
                        })));
                    } else {
                        setOptionalItems([]);
                    }

                    setFreightPrice(((Number(freightCost) || 0) + (Number(tollCost) || 0)).toFixed(2));
                    if (inputData.logistics?.freightMode) {
                        setFreightMode(inputData.logistics.freightMode);
                    }
                    setInstallationPrice((Number(installationCost) || 0).toFixed(2));
                }
            }
        }
    }, [location.state]);

    // --- MANIPULAÇÃO DE VALORES HÍBRIDOS (SINCRONIZAÇÃO BIDIRECIONAL) ---
    const handleHybridSignalPercentChange = (newPercent: number) => {
        setSignalPercent(newPercent);
        const newVal = discountedBase * (newPercent / 100);
        setHybridSignalValue(newVal.toFixed(2));
    };

    const handleHybridSignalValueChange = (valStr: string) => {
        setHybridSignalValue(valStr);
        const val = parseFloat(valStr);
        if (!isNaN(val) && discountedBase > 0) {
            const newPercent = (val / discountedBase) * 100;
            // Atualiza a porcentagem mas limita visualmente entre 0 e 100 para o slider
            setSignalPercent(Math.min(100, Math.max(0, newPercent)));
        }
    };

    const handleDiscountPercentChange = (valStr: string) => {
        const percent = parseFloat(valStr) || 0;
        setDiscountPercent(percent);
        const val = totalGeralBase * (percent / 100);
        setDiscountValue(val > 0 ? val.toFixed(2) : '');
    };

    const handleDiscountValueChange = (valStr: string) => {
        setDiscountValue(valStr);
        const val = parseFloat(valStr) || 0;
        if (totalGeralBase > 0) {
            const newPercent = (val / totalGeralBase) * 100;
            setDiscountPercent(newPercent);
        }
    };

    // --- RECONHECIMENTO DE VOZ ---
    const toggleListening = (target: 'main' | 'refine') => {
        if (isListening) {
            if (recognitionRef.current) recognitionRef.current.stop();
            setIsListening(false);
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Seu navegador não suporta reconhecimento de voz.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'pt-BR';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event: any) => {
            console.error("Erro no reconhecimento:", event.error);
            setIsListening(false);
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            if (target === 'main') {
                setAiPrompt(prev => prev ? `${prev} ${transcript}` : transcript);
            } else {
                setRefinementPrompt(prev => prev ? `${prev} ${transcript}` : transcript);
            }
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    const handleZipBlur = async () => {
        const cleanZip = zip.replace(/\D/g, '');
        if (cleanZip.length === 8) {
            setIsLoadingCep(true);
            try {
                const response = await fetch(`https://viacep.com.br/ws/${cleanZip}/json/`);
                const data = await response.json();
                if (!data.erro) {
                    setStreet(data.logradouro);
                    setNeighborhood(data.bairro);
                    setCity(data.localidade);
                    setState(data.uf);
                }
            } catch (e) {
                console.error("Erro ao buscar CEP", e);
            } finally {
                setIsLoadingCep(false);
            }
        }
    };

    // Cálculos Pix
    const pixTotal = discountedBase;
    
    // Cálculos Híbrido / Cartão
    // Agora usamos o valor manual se disponível, senão a porcentagem
    const hybridEntryPix = parseFloat(hybridSignalValue) || (discountedBase * (signalPercent / 100));
    const baseAmountForCard = paymentMethod === 'hybrid' 
        ? Math.max(0, discountedBase - hybridEntryPix)
        : discountedBase;

    const interestMoney = enableInterest ? (parseFloat(interestValue) || 0) : 0;
    const totalFinanciadoReal = baseAmountForCard + interestMoney;
    const finalInstallmentVal = totalFinanciadoReal / (installments || 1);
    const totalGeralFinal = (paymentMethod === 'hybrid' ? hybridEntryPix : 0) + totalFinanciadoReal;

    const handleMethodChange = (method: 'pix' | 'card' | 'hybrid') => {
        setPaymentMethod(method);
        setEnableInterest(false);
        setInterestValue('');
        if (method === 'pix') setSignalPercent(50);
        if (method === 'hybrid') {
            setSignalPercent(20);
            const newVal = discountedBase * (20 / 100);
            setHybridSignalValue(newVal.toFixed(2));
            setRemainderPaymentMode('Link de Pagamento (Cartão de Crédito)');
        }
        if (method === 'card') setSignalPercent(0);
    };

    // Permite alterar o nome de um item adicional individualmente
    const updateOptionalItemName = (index: number, newName: string) => {
        const updated = [...optionalItems];
        updated[index] = { ...updated[index], name: newName };
        setOptionalItems(updated);
    };

    // Permite adicionar novos itens
    const handleAddItem = () => {
        if (!newItemName || !newItemPrice) return;
        const newItem: OptionalItem = {
            id: Date.now().toString(),
            name: newItemName,
            price: parseFloat(newItemPrice)
        };
        setOptionalItems([...optionalItems, newItem]);
        setNewItemName('');
        setNewItemPrice('');
    };

    const handleRemoveItem = (index: number) => {
        const updated = [...optionalItems];
        updated.splice(index, 1);
        setOptionalItems(updated);
    };

    // --- FUNÇÃO DE GERAÇÃO DE CLÁUSULA COM IA ---
    const handleGenerateClause = async () => {
        if (!aiPrompt.trim()) return;
        setIsGeneratingClause(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const prompt = `Você é um advogado especialista em contratos comerciais e código de defesa do consumidor no Brasil. 
            Escreva uma cláusula contratual formal, clara e direta para um contrato de venda de escada de aço, baseada na seguinte solicitação do usuário: "${aiPrompt}".
            A cláusula deve ser numerada (ex: 7.1) ou apenas o texto do parágrafo. Não inclua introduções como "Aqui está a cláusula". Apenas o texto legal.`;

            const response = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: prompt,
            });
            const text = response.text;
            
            if (text) {
                setCustomClauses([...customClauses, text.trim()]);
            }
            setAiPrompt('');
        } catch (e) {
            console.error(e);
            alert("Erro ao gerar cláusula com IA. Tente novamente.");
        } finally {
            setIsGeneratingClause(false);
        }
    };

    // --- FUNÇÃO DE REFINAMENTO DE CLÁUSULA (CHATZINHO) ---
    const handleRefineClause = async (index: number) => {
        if (!refinementPrompt.trim()) return;
        setIsRefining(true);
        const originalClause = customClauses[index];

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `
            Você é um assistente jurídico. O usuário quer alterar a seguinte cláusula de contrato existente:
            "${originalClause}"
            
            O pedido de alteração do usuário é: "${refinementPrompt}"
            
            Reescreva a cláusula mantendo a linguagem formal jurídica, aplicando a alteração solicitada.
            Retorne APENAS o novo texto da cláusula, sem introduções ou explicações.
            `;

            const response = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: prompt,
            });
            const newText = response.text;

            if (newText) {
                const updatedClauses = [...customClauses];
                updatedClauses[index] = newText.trim();
                setCustomClauses(updatedClauses);
                setRefiningIndex(null); // Fecha o chatzinho
                setRefinementPrompt('');
            }
        } catch (e) {
            console.error(e);
            alert("Erro ao refinar cláusula.");
        } finally {
            setIsRefining(false);
        }
    };

    const handleRemoveClause = (index: number) => {
        const newClauses = [...customClauses];
        newClauses.splice(index, 1);
        setCustomClauses(newClauses);
    };

    const handleSaveContract = async () => {
        if (isSavingContract) return; // Prevenir cliques duplos
        if (!user) {
            alert("Você precisa fazer login para salvar contratos na nuvem.");
            return;
        }

        if (!clientName) {
            alert("Por favor, preencha o Nome do Cliente antes de salvar.");
            return;
        }

        setIsSavingContract(true);
        try {

        const numLandings = landings.length;
        const totalStepsNum = parseFloat(totalSteps) || 0;
        const structureStepsNum = totalStepsNum - numLandings;
        const fullAddress = `${street}, ${number} - ${neighborhood}, ${city} - ${state}, ${zip}`;
        const finalHybridSignal = parseFloat(hybridSignalValue) || (discountedBase * (signalPercent/100));

        const contractData = {
            userData: { 
                name: clientName, cpf: clientDoc, rg: clientRG, address: fullAddress, 
                zip, street, number, neighborhood, city, state 
            },
            selectedOption: {
                optionNumber: 1,
                steps: totalStepsNum,
                structureSteps: structureStepsNum,
                stepHeight: parseFloat(stepHeight) || 0,
                totalLength: parseFloat(totalLength) || 0,
                totalPrice: totalStructure,
                stairWidth: parseFloat(width) || 0,
                treadDepth: parseFloat(treadDepth) || 0,
                landings: landings
            },
            finalStairPrice: parseFloat(stairPrice) || 0,
            finalLandingsPrice: parseFloat(landingsPrice) || 0,
            inputData: {
                ...(originalInputData || {}),
                totalHeight: parseFloat(totalHeight) || 0,
                desiredSteps: totalStepsNum,
                stairWidth: parseFloat(width) || 0,
                treadDepth: parseFloat(treadDepth) || 0,
                dampers: parseFloat(dampers) || 4,
                optionalItems: optionalItems, 
                landings: landings,
                treadMaterial: treadMaterial,
                woodType: treadMaterial === 'wood' ? woodType : undefined,
                stairDirection: stairDirection,
                wallFixation: wallFixation,
                cutStepType,
                hasWheels: hasWheels,
                isFixedStair: isFixedStair,
                handrailSide: handrailSide,
                logistics: {
                    ...(originalInputData?.logistics || {}),
                    freightMode: freightMode
                }
            },
            freightCost: parseFloat(freightPrice) || 0,
            tollCost: 0,
            installationCost: parseFloat(installationPrice) || 0,
            extrasCost: parseFloat(extrasPrice) || 0,
            deadlineDate: '', 
            paymentMethod,
            paymentDetails: {
                discountPercent, 
                discountValue: discountMoney,
                signalPercent, 
                installments, 
                installmentValue: finalInstallmentVal,
                hybridSignalAmount: finalHybridSignal,
                pixTiming: pixTiming,
                remainderText: remainderPaymentMode
            },
            additionalClauses: customClauses,
            finishText,
            stepCapacityText,
            stairCapacityText,
            warrantyText,
            deliveryText,
            deliveryDays
        };

        const isEditing = location.state?.isEditing;
        const editingContractId = location.state?.editingContractId;

        const newSavedContract = {
            id: isEditing ? editingContractId : Date.now().toString(),
            createdAt: new Date().toISOString(),
            clientName: clientName,
            totalValue: paymentMethod === 'pix' ? pixTotal : totalGeralFinal,
            status: 'falta_assinar' as const,
            contractData: JSON.parse(JSON.stringify(contractData)),
            userId: user.uid
        };


            if (isEditing) {
                if (!editingContractId) {
                    alert("Erro: ID do contrato não encontrado para edição.");
                    return;
                }
                // Remove id e createdAt para não sobrescrever na atualização
                const { id, createdAt, status, ...updateData } = newSavedContract;
                await updateDoc(doc(db, 'contracts', editingContractId), updateData);
                alert("Contrato atualizado com sucesso!");
                navigate('/contratos');
                return;
            } else {
                await setDoc(doc(db, 'contracts', newSavedContract.id), newSavedContract);
            }
            
            if (addToQueue && !isEditing) {
                let downPayment = 0;
                let balanceDue = 0;

                if (paymentMethod === 'pix') {
                    downPayment = pixTotal * (signalPercent / 100);
                    balanceDue = pixTotal - downPayment;
                } else if (paymentMethod === 'card') {
                    downPayment = 0;
                    balanceDue = totalGeralFinal;
                } else if (paymentMethod === 'hybrid') {
                    if (pixTiming === 'delivery') {
                        downPayment = discountedBase - finalHybridSignal; // Cartão é o sinal
                        balanceDue = finalHybridSignal; // PIX é o restante
                    } else {
                        downPayment = finalHybridSignal; // PIX é o sinal
                        balanceDue = discountedBase - finalHybridSignal; // Cartão é o restante
                    }
                }

                let estimatedProfit = 0;
                let estimatedTotalCost = 0;
                try {
                    const settingsSnap = await getDoc(doc(db, 'settings', 'production_costs'));
                    if (settingsSnap.exists()) {
                        const settingsData = settingsSnap.data();
                        const steelCost = (settingsData.steelCostPerStep || 0) * totalStepsNum;
                        const woodCost = (settingsData.woodCostPerStep || 0) * totalStepsNum;
                        const taxCost = newSavedContract.totalValue * ((settingsData.taxPercentage || 0) / 100);
                        const commissionCost = newSavedContract.totalValue * ((settingsData.commissionPercentage || 0) / 100);
                        
                        estimatedTotalCost = steelCost + woodCost + taxCost + commissionCost + parseFloat(freightPrice) + parseFloat(installationPrice);
                        estimatedProfit = newSavedContract.totalValue - estimatedTotalCost;
                    }
                } catch (err) {
                    console.error("Erro ao calcular lucro:", err);
                }

                const newOrder: any = {
                    id: Date.now().toString() + '_queue',
                    contractId: newSavedContract.id,
                    createdAt: new Date().toISOString(),
                    clientName: clientName,
                    deliveryDate: '',
                    downPayment: downPayment,
                    balanceDue: balanceDue,
                    status: 'in_queue' as const,
                    boardStage: 'contrato' as const,
                    location: `${neighborhood || ''} - ${city || ''}`,
                    profit: estimatedProfit,
                    totalCost: estimatedTotalCost,
                    downPaymentStatus: 'pending' as const,
                    balanceStatus: 'pending' as const,
                    paymentMethod: paymentMethod,
                    pixTiming: pixTiming // Salva o pixTiming para saber quem é parcelado
                };

                if (paymentMethod === 'card' || paymentMethod === 'hybrid') {
                    newOrder.installments = installments;
                    newOrder.paidInstallments = 0;
                }

                await setDoc(doc(db, 'production_queue', newOrder.id), newOrder);
            }

            alert("Contrato salvo com sucesso na sua Timeline na Nuvem!");
        } catch (error) {
            handleFirestoreError(error, isEditing ? OperationType.UPDATE : OperationType.CREATE, 'contracts');
        } finally {
            setIsSavingContract(false);
        }
    };

    const handleGeneratePDF = () => {
        if (!clientName || !street || !number || !city) {
            alert("Por favor, preencha Nome e Endereço Completo do cliente.");
            return;
        }

        const numLandings = landings.length;
        const totalStepsNum = parseFloat(totalSteps) || 0;
        const structureStepsNum = totalStepsNum - numLandings;
        const fullAddress = `${street}, ${number} - ${neighborhood}, ${city} - ${state}, ${zip}`;

        // Calcula o valor exato da entrada híbrida para passar para o gerador
        const finalHybridSignal = parseFloat(hybridSignalValue) || (discountedBase * (signalPercent/100));

        generateContractPDF({
            userData: { 
                name: clientName, cpf: clientDoc, rg: clientRG, address: fullAddress, 
                zip, street, number, neighborhood, city, state 
            },
            selectedOption: {
                optionNumber: 1,
                steps: totalStepsNum,
                structureSteps: structureStepsNum,
                stepHeight: parseFloat(stepHeight) || 0,
                totalLength: parseFloat(totalLength) || 0,
                totalPrice: totalStructure, // Soma o valor da escada + patamares
                stairWidth: parseFloat(width) || 0,
                treadDepth: parseFloat(treadDepth) || 0,
                landings: landings
            },
            // PASSANDO OS PREÇOS SEPARADOS EXPLICITAMENTE
            finalStairPrice: parseFloat(stairPrice) || 0,
            finalLandingsPrice: parseFloat(landingsPrice) || 0,
            
            inputData: {
                ...(originalInputData || {}),
                totalHeight: parseFloat(totalHeight) || 0,
                desiredSteps: totalStepsNum,
                stairWidth: parseFloat(width) || 0,
                treadDepth: parseFloat(treadDepth) || 0,
                dampers: parseFloat(dampers) || 4,
                optionalItems: optionalItems, 
                landings: landings,
                treadMaterial: treadMaterial,
                woodType: treadMaterial === 'wood' ? woodType : undefined,
                stairDirection: stairDirection,
                wallFixation: wallFixation,
                cutStepType,
                hasWheels: hasWheels,
                isFixedStair: isFixedStair,
                handrailSide: handrailSide,
                logistics: {
                    ...(originalInputData?.logistics || {}),
                    freightMode: freightMode
                }
            },
            freightCost: parseFloat(freightPrice) || 0,
            tollCost: 0,
            installationCost: parseFloat(installationPrice) || 0,
            extrasCost: parseFloat(extrasPrice) || 0,
            deadlineDate: '', 
            paymentMethod,
            paymentDetails: {
                discountPercent, 
                discountValue: discountMoney,
                signalPercent, 
                installments, 
                installmentValue: finalInstallmentVal,
                hybridSignalAmount: finalHybridSignal, // Passa o valor manual exato
                pixTiming: pixTiming, // Passa o momento do pagamento
                remainderText: remainderPaymentMode // Texto personalizado do restante
            },
            additionalClauses: customClauses,
            finishText,
            stepCapacityText,
            stairCapacityText,
            warrantyText,
            deliveryText,
            deliveryDays
        });
    };

    const handleCopyCotacaoFrete = async () => {
        if (!clientName || !zip || !clientDoc || !state) {
            alert("Por favor, preencha o Nome, CEP com Estado e CPF/CNPJ do cliente antes de gerar a cotação.");
            return;
        }

        const cleanZip = zip.replace(/\D/g, '');
        const cleanDoc = clientDoc.replace(/\D/g, '');

        // VALOR DA NOTA = Total - Descontos - Frete
        const valorTotalSemFrete = Math.max(0, discountedBase - (parseFloat(freightPrice) || 0));

        let transportadorasText = '';
        try {
            const q = query(collection(db, 'transportadoras'));
            const snapshot = await getDocs(q);
            const possiveis: string[] = [];
            
            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                if (data.statesServed && data.statesServed.includes(state)) {
                     possiveis.push(`${data.name}\n*Base mais próxima em ${data.baseLocation || 'Não informada'}*\n${data.contact || 'Sem contato'}`);
                }
            });

            if (possiveis.length > 0) {
                transportadorasText = `Possíveis Transportadoras:\n${possiveis.join('\n\n')}\n\n`;
            }
        } catch (err) {
            console.error("Erro ao buscar transportadoras:", err);
        }

        const text = `${transportadorasText}Olá, tudo bem?

Poderia fazer esta cotação levando na base de Campinas

DADOS PARA COTAÇÃO:

CNPJ REMETENTE: 28.869.537/0001-01
CEP REMETENTE: 13104096
CEP DESTINO: ${cleanZip}
CPF/CNPJ: ${cleanDoc}
NOME: ${clientName}
VALOR DA NOTA: R$ ${valorTotalSemFrete.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
QUANTIDADE DE VOLUME: 2
Volumes 1
Medidas
PESO
Volumes 2
Medidas
PESO
MERCADORIA: escada
TELEFONE FIXO E WHATSAPP: 19992337714`;

        try {
            await navigator.clipboard.writeText(text);
            alert("Cotação estruturada copiada para a área de transferência com sucesso!");
        } catch (err) {
            console.error("Erro ao copiar o texto: ", err);
            prompt("Seu navegador bloqueou a cópia automática. Copie o texto abaixo:", text);
        }
    };

    const handleGenerateProductionSheet = () => {
        import('../utils/productionPdfGenerator').then(({ generateProductionPDF }) => {
            generateProductionPDF({
                totalSteps: parseFloat(totalSteps) || 0,
                stepHeightCm: parseFloat(stepHeight) || 0,
                treadDepthCm: parseFloat(treadDepth) || 0,
                widthCm: parseFloat(width) || 0,
                cutStepType,
                clientName: clientName || ''
            });
        });
    };

    const handleGenerateAceiteObra = () => {
        if (!clientName || !street || !number || !city) {
            alert("Por favor, preencha Nome e Endereço Completo do cliente.");
            return;
        }

        const numLandings = landings.length;
        const totalStepsNum = parseFloat(totalSteps) || 0;
        const structureStepsNum = totalStepsNum - numLandings;
        const fullAddress = `${street}, ${number} - ${neighborhood}, ${city} - ${state}, ${zip}`;

        const finalHybridSignal = parseFloat(hybridSignalValue) || (discountedBase * (signalPercent/100));

        generateAceiteObraPDF({
            userData: { 
                name: clientName, cpf: clientDoc, rg: clientRG, address: fullAddress, 
                zip, street, number, neighborhood, city, state 
            },
            selectedOption: {
                optionNumber: 1,
                steps: totalStepsNum,
                structureSteps: structureStepsNum,
                stepHeight: parseFloat(stepHeight) || 0,
                totalLength: parseFloat(totalLength) || 0,
                totalPrice: totalStructure,
                stairWidth: parseFloat(width) || 0,
                treadDepth: parseFloat(treadDepth) || 0,
                landings: landings
            },
            finalStairPrice: parseFloat(stairPrice) || 0,
            finalLandingsPrice: parseFloat(landingsPrice) || 0,
            inputData: {
                ...(originalInputData || {}),
                type: originalInputData?.type || 'straight',
                straightLength: originalInputData?.straightLength || 0,
                straightHeight: originalInputData?.straightHeight || 0,
                width: parseFloat(width) || 0,
                totalHeight: parseFloat(totalHeight) || 0,
                desiredSteps: totalStepsNum,
                stairWidth: parseFloat(width) || 0,
                treadDepth: parseFloat(treadDepth) || 0,
                dampers: parseFloat(dampers) || 4,
                optionalItems: optionalItems, 
                landings: landings,
                treadMaterial: treadMaterial,
                woodType: treadMaterial === 'wood' ? woodType : undefined,
                stairDirection: stairDirection,
                wallFixation: wallFixation,
                cutStepType,
                hasWheels: hasWheels,
                isFixedStair: isFixedStair,
                handrailSide: handrailSide,
                logistics: {
                    ...(originalInputData?.logistics || {}),
                    freightMode: freightMode
                }
            },
            freightCost: parseFloat(freightPrice) || 0,
            tollCost: 0,
            installationCost: parseFloat(installationPrice) || 0,
            extrasCost: parseFloat(extrasPrice) || 0,
            deadlineDate: '', 
            paymentMethod,
            paymentDetails: {
                discountPercent, 
                discountValue: discountMoney,
                signalPercent, 
                installments, 
                installmentValue: finalInstallmentVal,
                hybridSignalAmount: finalHybridSignal,
                pixTiming: pixTiming,
                remainderText: remainderPaymentMode
            },
            additionalClauses: [],
            finishText,
            stepCapacityText,
            stairCapacityText,
            warrantyText,
            deliveryText,
            deliveryDays
        });
    };

    const handleDocChange = (e: any) => {
        const val = e.target.value;
        if (personType === 'pf') setClientDoc(maskCPF(val));
        else setClientDoc(maskCNPJ(val));
    };
    
    const handleRGChange = (e: any) => setClientRG(maskRG(e.target.value));
    const handlePersonTypeChange = (type: 'pf' | 'pj') => { setPersonType(type); setClientDoc(''); setClientRG(''); };

    return (
        <div className="max-w-5xl mx-auto p-4 sm:p-6 md:p-12">
            <header className="mb-10 text-center">
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-2">
                    {location.state?.isEditing ? 'Editar Contrato' : 'Emissão de Contrato'}
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                    {location.state?.isEditing ? 'Atualize os dados e salve as alterações.' : 'Preencha os dados finais para gerar o PDF.'}
                </p>
            </header>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                        <SectionTitle title="1. Dados do Cliente" />
                        
                        <div className="flex gap-4 mb-2">
                             <label className="flex items-center gap-2 cursor-pointer bg-gray-50 dark:bg-gray-700 px-3 py-1 rounded border dark:border-gray-600">
                                 <input type="radio" name="ptype" checked={personType === 'pf'} onChange={() => handlePersonTypeChange('pf')} className="accent-highlight"/>
                                 <span className="text-sm font-bold text-gray-900 dark:text-white">Pessoa Física</span>
                             </label>
                             <label className="flex items-center gap-2 cursor-pointer bg-gray-50 dark:bg-gray-700 px-3 py-1 rounded border dark:border-gray-600">
                                 <input type="radio" name="ptype" checked={personType === 'pj'} onChange={() => handlePersonTypeChange('pj')} className="accent-highlight"/>
                                 <span className="text-sm font-bold text-gray-900 dark:text-white">Pessoa Jurídica</span>
                             </label>
                        </div>

                        <ContractInput label="Nome / Razão Social *" value={clientName} onChange={(e: any) => setClientName(e.target.value)} />
                        
                        <div className="flex gap-4">
                            <ContractInput 
                                label={personType === 'pf' ? 'CPF' : 'CNPJ'} 
                                value={clientDoc} 
                                onChange={handleDocChange} 
                                placeholder={personType === 'pf' ? '000.000.000-00' : '00.000.000/0000-00'}
                                maxLength={personType === 'pf' ? 14 : 18}
                                className="flex-1"
                            />
                            {personType === 'pf' && (
                                <ContractInput 
                                    label="RG (Opcional)" 
                                    value={clientRG} 
                                    onChange={handleRGChange}
                                    placeholder="00.000.000-0"
                                    maxLength={12}
                                    className="w-1/3"
                                />
                            )}
                        </div>

                        <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                            <div className="grid grid-cols-3 gap-3 mb-3">
                                <div className="col-span-1">
                                    <ContractInput label="CEP *" value={zip} onChange={(e: any) => setZip(maskCEP(e.target.value))} onBlur={handleZipBlur} isLoading={isLoadingCep} maxLength={9}/>
                                </div>
                                <div className="col-span-2">
                                     <ContractInput label="Rua / Logradouro *" value={street} onChange={(e: any) => setStreet(e.target.value)} />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3 mb-3">
                                <div className="col-span-1">
                                    <ContractInput label="Número *" value={number} onChange={(e: any) => setNumber(e.target.value)} />
                                </div>
                                <div className="col-span-2">
                                     <ContractInput label="Bairro *" value={neighborhood} onChange={(e: any) => setNeighborhood(e.target.value)} />
                                </div>
                            </div>
                            <div className="grid grid-cols-4 gap-3">
                                <div className="col-span-3">
                                    <ContractInput label="Cidade *" value={city} onChange={(e: any) => setCity(e.target.value)} />
                                </div>
                                <div className="col-span-1">
                                     <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">UF *</label>
                                     <div className="relative">
                                        <select
                                            value={state}
                                            onChange={(e) => setState(e.target.value)}
                                            className="w-full bg-white dark:bg-gray-700 text-black dark:text-white p-3 rounded border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-highlight focus:ring-1 focus:ring-highlight font-medium shadow-sm transition-all appearance-none"
                                        >
                                            <option value="">--</option>
                                            {BRAZIL_STATES.map(uf => (
                                                <option key={uf} value={uf}>{uf}</option>
                                            ))}
                                        </select>
                                     </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-6">
                        <SectionTitle title="2. Especificações (Item 1)" />
                        <div className="grid grid-cols-2 gap-4">
                            <ContractInput label="Altura (cm)" value={totalHeight} onChange={(e: any) => setTotalHeight(e.target.value)} type="number" />
                            <ContractInput label="Largura (cm)" value={width} onChange={(e: any) => setWidth(e.target.value)} type="number" />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <ContractInput label="Total Peças" value={totalSteps} onChange={(e: any) => setTotalSteps(e.target.value)} type="number" />
                            <ContractInput label="Pisante" value={treadDepth} onChange={(e: any) => setTreadDepth(e.target.value)} type="number" />
                            <ContractInput label="Comprimento" value={totalLength} onChange={(e: any) => setTotalLength(e.target.value)} type="number" />
                        </div>

                        <div className="flex items-center justify-between mb-4 mt-4">
                            <h3 className="text-sm font-black text-gray-900 dark:text-gray-100 uppercase flex items-center gap-2">
                                <span className="bg-highlight text-white w-6 h-6 flex items-center justify-center rounded-full text-xs">P</span>
                                Patamares ({landings.length})
                            </h3>
                            <div className="flex gap-2">
                                <button type="button" onClick={handleAddTopLanding} className="text-xs bg-orange-600 text-white px-2 py-1 rounded font-bold hover:bg-orange-700 transition" title="Patamar no Topo (Acesso Lateral)">
                                    + Chegada
                                </button>
                                <button type="button" onClick={handleAddLanding} className="text-xs bg-gray-800 dark:bg-gray-700 text-white px-3 py-1 rounded font-bold hover:bg-black dark:hover:bg-gray-600 transition">
                                    + Meio
                                </button>
                            </div>
                        </div>
                        
                        {landings.length === 0 ? (
                            <p className="text-xs text-gray-500 dark:text-gray-400 italic mb-2">Nenhum patamar adicionado.</p>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-[10px] text-orange-800 dark:text-orange-300 font-bold mb-2">* Cada patamar substitui 1 degrau.</p>
                                {landings.map((landing, index) => (
                                    <div key={landing.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-orange-200 dark:border-orange-800 shadow-sm relative">
                                        <button 
                                            onClick={() => handleRemoveLanding(landing.id)}
                                            type="button"
                                            className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shadow hover:bg-red-700"
                                        >
                                            x
                                        </button>
                                        <span className="text-xs font-bold text-gray-400 absolute top-1 left-2">#{index + 1}</span>
                                        
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                            <div className="mb-0 col-span-2">
                                                <div className="flex justify-between items-center mb-1">
                                                     <label className="text-sm font-black text-gray-900 dark:text-gray-100 mr-1">Posição</label>
                                                </div>
                                                <div className="flex gap-4 items-center bg-gray-100 dark:bg-gray-700 p-2 rounded mb-2">
                                                    <label className="flex items-center gap-1 cursor-pointer select-none">
                                                         <input 
                                                            type="checkbox" 
                                                            checked={!!landing.isLastStep} 
                                                            onChange={(e) => {
                                                                updateLanding(landing.id, {
                                                                    isLastStep: e.target.checked,
                                                                    isFlushWithSlab: e.target.checked ? landing.isFlushWithSlab : false
                                                                });
                                                            }} 
                                                            className="w-4 h-4 accent-highlight"
                                                         />
                                                         <span className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase">Topo (Chegada)?</span>
                                                    </label>
                                                    
                                                    {landing.isLastStep && (
                                                        <label className="flex items-center gap-1 cursor-pointer select-none" title="Para porta nivelada com o piso superior">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={!!landing.isFlushWithSlab} 
                                                                onChange={(e) => {
                                                                    const isChecked = e.target.checked;
                                                                    updateLanding(landing.id, {
                                                                        isFlushWithSlab: isChecked,
                                                                        isLastStep: isChecked ? true : landing.isLastStep 
                                                                    });
                                                                }} 
                                                                className="w-4 h-4 accent-highlight"
                                                            />
                                                            <span className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase">Rente à Laje?</span>
                                                        </label>
                                                    )}
                                                </div>

                                                <input
                                                    type="number"
                                                    value={landing.isLastStep ? "" : landing.step.toString()}
                                                    disabled={landing.isLastStep}
                                                    onChange={e => updateLanding(landing.id, { step: parseFloat(e.target.value) })}
                                                    className={`w-full p-2 rounded border-2 focus:outline-none transition font-bold ${landing.isLastStep ? 'bg-gray-200 dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-400 dark:text-gray-300' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:border-highlight text-black dark:text-white'}`}
                                                    placeholder={landing.isLastStep ? "Automático (Último Degrau)" : "Nº do Degrau (Ex: 5)"}
                                                />
                                            </div>

                                            <div className="col-span-2">
                                                <label className="text-xs font-black text-gray-800 dark:text-gray-200 mb-1 block">Tipo de Fixação:</label>
                                                <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded">
                                                    <button 
                                                        type="button" 
                                                        onClick={() => updateLanding(landing.id, { type: 'articulated' })}
                                                        className={`flex-1 py-1 text-xs font-bold rounded ${(!landing.type || landing.type === 'articulated') ? 'bg-white dark:bg-gray-600 shadow text-highlight' : 'text-gray-500'}`}
                                                    >
                                                        Articulado
                                                    </button>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => updateLanding(landing.id, { type: 'fixed' })}
                                                        className={`flex-1 py-1 text-xs font-bold rounded ${landing.type === 'fixed' ? 'bg-white dark:bg-gray-600 shadow text-blue-600' : 'text-gray-500'}`}
                                                    >
                                                        Fixo
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="col-span-2">
                                                <label className="text-xs font-black text-gray-800 dark:text-gray-200 mb-1 block">Qtd. Mãos Francesas:</label>
                                                <select
                                                    value={landing.frenchBrackets || 0}
                                                    onChange={(e) => updateLanding(landing.id, { frenchBrackets: parseInt(e.target.value) as 0 | 1 | 2 })}
                                                    className="w-full text-xs font-bold p-2 text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 outline-none focus:border-highlight"
                                                >
                                                    <option value={0}>Sem mão francesa</option>
                                                    <option value={1}>Com uma mão francesa</option>
                                                    <option value={2}>Com duas mãos francesas</option>
                                                </select>
                                            </div>

                                            <div className="col-span-2 bg-gray-50 dark:bg-gray-700/50 p-2 rounded border border-gray-100 dark:border-gray-700">
                                                <label className="text-xs font-black text-gray-800 dark:text-gray-200 mb-1 block">Opções Adicionais:</label>
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex gap-4">
                                                        <label className="flex items-center gap-1 cursor-pointer">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={landing.hasSideGuardrail} 
                                                                onChange={(e) => updateLanding(landing.id, { hasSideGuardrail: e.target.checked })} 
                                                                className="w-4 h-4 accent-blue-600"
                                                            />
                                                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Barra Lateral</span>
                                                        </label>
                                                        <label className="flex items-center gap-1 cursor-pointer">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={landing.hasFrontGuardrail} 
                                                                onChange={(e) => updateLanding(landing.id, { hasFrontGuardrail: e.target.checked })} 
                                                                className="w-4 h-4 accent-blue-600"
                                                            />
                                                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Barra Frontal</span>
                                                        </label>
                                                    </div>
                                                    <label className="flex items-center gap-1 cursor-pointer mt-1">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={!!landing.isAngled} 
                                                            onChange={(e) => updateLanding(landing.id, { isAngled: e.target.checked })} 
                                                            className="w-4 h-4 accent-highlight"
                                                        />
                                                        <span className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase">Patamar em ângulo?</span>
                                                    </label>
                                                </div>
                                            </div>

                                            <div className="col-span-2 mb-2 bg-gray-50 dark:bg-gray-700/50 p-2 rounded border border-gray-100 dark:border-gray-700">
                                                <label className="text-xs font-black text-gray-800 dark:text-gray-200 mb-1 block">Direção / Curva:</label>
                                                <div className="flex gap-1">
                                                    <button 
                                                        type="button"
                                                        onClick={() => updateLanding(landing.id, { direction: 'left' })}
                                                        className={`flex-1 py-1 rounded text-xs font-bold transition flex items-center justify-center gap-1 ${landing.direction === 'left' ? 'bg-blue-600 text-white shadow' : 'bg-white dark:bg-gray-600 border dark:border-gray-500 text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500'}`}
                                                    >
                                                        ⬅️ Esq
                                                    </button>
                                                    <button 
                                                        type="button"
                                                        onClick={() => updateLanding(landing.id, { direction: 'straight' })}
                                                        className={`flex-1 py-1 rounded text-xs font-bold transition flex items-center justify-center gap-1 ${(!landing.direction || landing.direction === 'straight') ? 'bg-blue-600 text-white shadow' : 'bg-white dark:bg-gray-600 border dark:border-gray-500 text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500'}`}
                                                    >
                                                        ⬆️ Reto
                                                    </button>
                                                    <button 
                                                        type="button"
                                                        onClick={() => updateLanding(landing.id, { direction: 'right' })}
                                                        className={`flex-1 py-1 rounded text-xs font-bold transition flex items-center justify-center gap-1 ${landing.direction === 'right' ? 'bg-blue-600 text-white shadow' : 'bg-white dark:bg-gray-600 border dark:border-gray-500 text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500'}`}
                                                    >
                                                        Dir ➡️
                                                    </button>
                                                </div>
                                            </div>
                                            <ContractInput 
                                                label="Comp. (cm)" 
                                                value={landing.length.toString()} 
                                                onChange={(e: any) => updateLanding(landing.id, { length: parseFloat(e.target.value) })} 
                                                type="number"
                                            />
                                            <ContractInput 
                                                label="Larg. (cm)" 
                                                value={landing.width.toString()} 
                                                onChange={(e: any) => updateLanding(landing.id, { width: parseFloat(e.target.value) })} 
                                                type="number"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        
                        {/* LISTA DE ITENS ADICIONAIS EDITÁVEL E COM ADIÇÃO */}
                        <div className="col-span-full mt-4 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded border border-yellow-200 dark:border-yellow-700">
                            <h3 className="text-xs font-bold text-yellow-800 dark:text-yellow-300 uppercase mb-3 border-b border-yellow-200 dark:border-yellow-800 pb-1">
                                Itens Adicionais (Editável para Impressão)
                            </h3>
                            
                            <div className="space-y-2 mb-3">
                                {optionalItems.map((item, index) => (
                                    <div key={item.id} className="flex gap-2 items-center">
                                        <input 
                                            type="text" 
                                            value={item.name} 
                                            onChange={(e) => updateOptionalItemName(index, e.target.value)}
                                            className="flex-1 bg-white dark:bg-gray-700 p-2 text-sm border border-yellow-300 dark:border-yellow-600 rounded focus:border-highlight focus:outline-none text-black dark:text-white"
                                        />
                                        <span className="font-bold text-gray-700 dark:text-gray-300 text-sm whitespace-nowrap min-w-[80px] text-right">
                                            {formatCurrencyBRL(item.price)}
                                        </span>
                                        <button 
                                            onClick={() => handleRemoveItem(index)}
                                            className="text-red-500 hover:text-red-700 font-bold px-2"
                                            title="Remover Item"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                                {optionalItems.length === 0 && <p className="text-sm text-gray-400 italic">Nenhum item adicional.</p>}
                            </div>

                            <div className="flex gap-2 items-center border-t border-yellow-200 dark:border-yellow-800 pt-3">
                                <input 
                                    type="text" 
                                    placeholder="Novo Item (ex: Guarda-Corpo)" 
                                    value={newItemName}
                                    onChange={(e) => setNewItemName(e.target.value)}
                                    className="flex-1 bg-white dark:bg-gray-700 p-2 text-sm border border-yellow-300 dark:border-yellow-600 rounded focus:border-highlight outline-none text-black dark:text-white"
                                />
                                <input 
                                    type="number" 
                                    placeholder="Valor R$" 
                                    value={newItemPrice}
                                    onChange={(e) => setNewItemPrice(e.target.value)}
                                    className="w-24 bg-white dark:bg-gray-700 p-2 text-sm border border-yellow-300 dark:border-yellow-600 rounded focus:border-highlight outline-none text-black dark:text-white"
                                />
                                <button 
                                    onClick={handleAddItem}
                                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold px-3 py-2 rounded text-sm"
                                >
                                    + Adicionar
                                </button>
                            </div>
                            
                            <p className="text-[10px] text-gray-500 mt-2 italic">* Edite os nomes acima como deseja que apareçam no PDF (ex: Adicionar detalhes do material).</p>
                        </div>
                    </div>

                    {/* NOVO: CONTROLES DE MATERIAL E DIREÇÃO */}
                    <div className="space-y-6 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <SectionTitle title="Detalhes da Escada" icon={<span>🪜</span>} />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Material */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Material dos Degraus</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setTreadMaterial('metal')}
                                        className={`py-2 px-3 rounded font-bold text-sm transition ${treadMaterial === 'metal' ? 'bg-gray-800 text-white shadow' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'}`}
                                    >
                                        Metal
                                    </button>
                                    <button
                                        onClick={() => setTreadMaterial('wood')}
                                        className={`py-2 px-3 rounded font-bold text-sm transition ${treadMaterial === 'wood' ? 'bg-orange-700 text-white shadow' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'}`}
                                    >
                                        Madeira
                                    </button>
                                    <button
                                        onClick={() => setTreadMaterial('chapa_xadrez')}
                                        className={`py-2 px-3 rounded font-bold text-sm transition ${treadMaterial === 'chapa_xadrez' ? 'bg-gray-800 text-white shadow' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'}`}
                                    >
                                        Chapa Xadrez
                                    </button>
                                    <button
                                        onClick={() => setTreadMaterial('chapa_vazada')}
                                        className={`py-2 px-3 rounded font-bold text-sm transition ${treadMaterial === 'chapa_vazada' ? 'bg-gray-800 text-white shadow' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'}`}
                                    >
                                        Chapa Vazada
                                    </button>
                                </div>
                                {treadMaterial === 'wood' && (
                                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">Tipo de Madeira</label>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                            <button
                                                onClick={() => setWoodType('ambas')}
                                                className={`py-2 px-3 rounded font-bold text-xs transition ${woodType === 'ambas' || !woodType ? 'bg-orange-600 text-white shadow' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'}`}
                                            >
                                                Garapeira ou Muiracatiara
                                            </button>
                                            <button
                                                onClick={() => setWoodType('garapeira')}
                                                className={`py-2 px-3 rounded font-bold text-xs transition ${woodType === 'garapeira' ? 'bg-orange-600 text-white shadow' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'}`}
                                            >
                                                Garapeira
                                            </button>
                                            <button
                                                onClick={() => setWoodType('muiracatiara')}
                                                className={`py-2 px-3 rounded font-bold text-xs transition ${woodType === 'muiracatiara' ? 'bg-orange-600 text-white shadow' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'}`}
                                            >
                                                Muiracatiara
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Direção */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Desenho (Sentido da Subida)</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setStairDirection('standard')}
                                        className={`flex-1 py-2 px-3 rounded font-bold text-sm transition ${stairDirection === 'standard' ? 'bg-blue-600 text-white shadow' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'}`}
                                    >
                                        Padrão (Direita)
                                    </button>
                                    <button
                                        onClick={() => setStairDirection('mirrored')}
                                        className={`flex-1 py-2 px-3 rounded font-bold text-sm transition ${stairDirection === 'mirrored' ? 'bg-purple-600 text-white shadow' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'}`}
                                    >
                                        Espelhado (Esquerda)
                                    </button>
                                </div>
                            </div>

                            {/* Fixação na Parede */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Lado da Fixação (Parede)</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setWallFixation('left')}
                                        className={`flex-1 py-2 px-3 rounded font-bold text-sm transition ${wallFixation === 'left' ? 'bg-emerald-600 text-white shadow' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'}`}
                                    >
                                        Parede à Esquerda
                                    </button>
                                    <button
                                        onClick={() => setWallFixation('right')}
                                        className={`flex-1 py-2 px-3 rounded font-bold text-sm transition ${wallFixation === 'right' ? 'bg-emerald-600 text-white shadow' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'}`}
                                    >
                                        Parede à Direita
                                    </button>
                                    <button
                                        onClick={() => setWallFixation('frontal')}
                                        className={`flex-1 py-2 px-3 rounded font-bold text-sm transition ${wallFixation === 'frontal' ? 'bg-emerald-600 text-white shadow' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'}`}
                                    >
                                        Fixação Frontal
                                    </button>
                                </div>
                            </div>

                            {/* Medidas Extras */}
                            <div>
                                <ContractInput 
                                    label="Altura do Degrau (cm)" 
                                    value={stepHeight} 
                                    onChange={(e: any) => setStepHeight(e.target.value)} 
                                    type="number"
                                />
                            </div>
                            <div>
                                <ContractInput 
                                    label="Profundidade do Pisante (cm)" 
                                    value={treadDepth} 
                                    onChange={(e: any) => setTreadDepth(e.target.value)} 
                                    type="number"
                                />
                            </div>
                            <div>
                                <ContractInput 
                                    label="Amortecedores" 
                                    value={dampers} 
                                    onChange={(e: any) => setDampers(e.target.value)} 
                                    type="number"
                                    disabled={hasWheels || isFixedStair}
                                />
                            </div>
                            
                            {/* Opções de Modelo de Escada */}
                            <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 items-end mt-2">
                                <div className="flex flex-col gap-2">
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                                        Modelo de Escada
                                    </label>
                                    <select
                                        value={isFixedStair ? 'fixed' : (hasWheels ? 'wheels' : 'dampers')}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === 'fixed') {
                                                setIsFixedStair(true);
                                                setHasWheels(false);
                                            } else if (val === 'wheels') {
                                                setIsFixedStair(false);
                                                setHasWheels(true);
                                            } else {
                                                setIsFixedStair(false);
                                                setHasWheels(false);
                                            }
                                        }}
                                        className="w-full text-sm font-bold p-3 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 h-14"
                                    >
                                        <option value="dampers">Articulada Lateral / Amortecedor</option>
                                        <option value="wheels">Avanço Frontal / Rodinha</option>
                                        <option value="fixed">Escada Fixa</option>
                                    </select>
                                </div>

                                {hasWheels && (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-100 dark:border-blue-800">
                                        <label className="block text-xs font-bold text-blue-900 dark:text-blue-200 mb-1">Posição Corrimão (Rodinhas):</label>
                                        <select 
                                            value={handrailSide} 
                                            onChange={(e) => setHandrailSide(e.target.value as 'left'|'right'|'both')}
                                            className="w-full text-xs font-bold p-1 rounded bg-white dark:bg-gray-700 text-black dark:text-white border border-blue-200 dark:border-blue-700 outline-none focus:ring-1 focus:ring-highlight"
                                        >
                                            <option value="left">Só Esquerdo</option>
                                            <option value="right">Só Direito</option>
                                            <option value="both">Nos Dois Lados</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <SectionTitle title="3. Valores & Entrega" />
                        
                        {/* SEPARAÇÃO: PREÇO ESCADA E PREÇO PATAMARES */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 sm:col-span-1">
                                <ContractInput 
                                    label="Valor Escada (S/ Patamar)" 
                                    value={stairPrice} 
                                    onChange={(e: any) => setStairPrice(e.target.value)} 
                                    type="number" 
                                />
                            </div>
                            
                            {/* MOSTRA O TOTAL DE PATAMARES SEPARADO */}
                            <div className="col-span-2 sm:col-span-1">
                                <ContractInput 
                                    label="Valor Patamares (Total)" 
                                    value={landingsPrice} 
                                    onChange={(e: any) => setLandingsPrice(e.target.value)} 
                                    type="number" 
                                />
                            </div>
                            
                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Forma de Entrega</label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setFreightMode('empresa')}
                                        className={`p-4 rounded-lg border-2 text-left transition-all flex flex-col items-start ${freightMode === 'empresa' ? 'border-highlight bg-highlight/10 dark:bg-highlight/20 shadow-md' : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-300'}`}
                                    >
                                        <span className="font-bold text-gray-900 dark:text-white mb-1">Entrega e Instalação</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">Feita pela nossa equipe especializada</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFreightMode('entrega')}
                                        className={`p-4 rounded-lg border-2 text-left transition-all flex flex-col items-start ${freightMode === 'entrega' ? 'border-highlight bg-highlight/10 dark:bg-highlight/20 shadow-md' : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-300'}`}
                                    >
                                        <span className="font-bold text-gray-900 dark:text-white mb-1">Somente Entrega</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">Instalação por conta do cliente</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFreightMode('transportadora')}
                                        className={`p-4 rounded-lg border-2 text-left transition-all flex flex-col items-start ${freightMode === 'transportadora' ? 'border-highlight bg-highlight/10 dark:bg-highlight/20 shadow-md' : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-300'}`}
                                    >
                                        <span className="font-bold text-gray-900 dark:text-white mb-1">Transportadora</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">Envio terceirizado (pacote fechado)</span>
                                    </button>
                                </div>
                            </div>

                            <ContractInput label="Frete + Pedágio (R$)" value={freightPrice} onChange={(e: any) => setFreightPrice(e.target.value)} type="number" />
                            
                            {/* Instalação Customizada */}
                            <div className="col-span-2 sm:col-span-1">
                                <div className="flex justify-between items-end mb-1">
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Instalação (R$)</label>
                                    {parseFloat(installationPrice) !== STANDARD_INSTALLATION && (
                                         <button
                                            type="button"
                                            onClick={() => setInstallationPrice(STANDARD_INSTALLATION.toFixed(2))}
                                            className="text-xs text-blue-600 dark:text-blue-400 underline hover:text-blue-800"
                                        >
                                            Usar Padrão (R$ {STANDARD_INSTALLATION})
                                        </button>
                                    )}
                                </div>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={installationPrice}
                                        onChange={(e) => setInstallationPrice(e.target.value)}
                                        className={`w-full p-3 rounded border focus:outline-none focus:border-highlight focus:ring-1 focus:ring-highlight font-medium shadow-sm transition-all ${
                                            parseFloat(installationPrice) === STANDARD_INSTALLATION
                                                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-100'
                                                : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-black dark:text-white'
                                        }`}
                                    />
                                     {parseFloat(installationPrice) === STANDARD_INSTALLATION && (
                                        <span className="absolute right-3 top-3 text-xs font-bold text-green-600 dark:text-green-400 pointer-events-none">
                                            PADRÃO
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {parseFloat(installationPrice) === STANDARD_INSTALLATION
                                        ? "Valor fixo para locais de fácil acesso."
                                        : "Valor personalizado (manual)."}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <SectionTitle title="4. Pagamento (Item 6)" />
                        
                        {/* DESCONTO GLOBAL */}
                        <div className="flex items-center gap-4 mb-4 bg-white dark:bg-gray-700 p-3 rounded border border-gray-300 dark:border-gray-600">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Desconto (%)</label>
                                <input type="number" value={discountPercent || ''} onChange={e => handleDiscountPercentChange(e.target.value)} placeholder="0" className="w-full p-2 border rounded font-bold text-center bg-gray-50 dark:bg-gray-600 text-black dark:text-white border-gray-300 dark:border-gray-500"/>
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Desconto (R$)</label>
                                <input type="number" value={discountValue} onChange={e => handleDiscountValueChange(e.target.value)} placeholder="0,00" className="w-full p-2 border rounded font-bold text-center text-green-600 dark:text-green-400 bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500"/>
                            </div>
                        </div>

                        {/* 3 OPÇÕES DE BOTÃO */}
                        <div className="flex gap-2 mb-4 bg-gray-200 dark:bg-gray-700 p-1 rounded">
                            <button onClick={() => handleMethodChange('pix')} className={`flex-1 py-2 rounded font-bold transition text-xs sm:text-sm ${paymentMethod === 'pix' ? 'bg-white dark:bg-gray-800 shadow text-green-700 dark:text-green-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>Pix / À Vista</button>
                            <button onClick={() => handleMethodChange('hybrid')} className={`flex-1 py-2 rounded font-bold transition text-xs sm:text-sm ${paymentMethod === 'hybrid' ? 'bg-white dark:bg-gray-800 shadow text-purple-700 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>Híbrido</button>
                            <button onClick={() => handleMethodChange('card')} className={`flex-1 py-2 rounded font-bold transition text-xs sm:text-sm ${paymentMethod === 'card' ? 'bg-white dark:bg-gray-800 shadow text-blue-700 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>Cartão</button>
                        </div>

                        {paymentMethod === 'pix' && (
                            <div className="space-y-4 animate-fade-in">
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Sinal (%)</label>
                                        <input type="number" value={signalPercent} onChange={e => setSignalPercent(parseFloat(e.target.value)||0)} className="w-full p-2 border rounded font-bold text-center text-green-600 dark:text-green-400 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"/>
                                    </div>
                                </div>
                                <div className="pt-2 text-sm text-gray-500 dark:text-gray-400 font-medium border-t border-gray-300 dark:border-gray-600">
                                    <p className="flex justify-between"><span>Valor Original:</span> <span className="line-through">{formatCurrencyBRL(totalGeralBase)}</span></p>
                                    {discountMoney > 0 && <p className="flex justify-between text-green-600"><span>Desconto:</span> <span>- {formatCurrencyBRL(discountMoney)}</span></p>}
                                    <p className="flex justify-between text-green-700 dark:text-green-400 font-bold text-lg"><span>A Pagar:</span> <span>{formatCurrencyBRL(pixTotal)}</span></p>
                                    <p className="text-xs mt-1">* {signalPercent}% de sinal na assinatura e {100 - signalPercent}% na entrega.</p>
                                </div>
                            </div>
                        )}

                        {paymentMethod === 'hybrid' && (
                            <div className="space-y-4 animate-fade-in">
                                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-xs font-bold text-blue-800 dark:text-blue-300 uppercase">
                                            Valor em Dinheiro/Pix ({Number(signalPercent).toFixed(1)}%)
                                        </label>
                                    </div>
                                    
                                    {/* INPUT MANUAL DE VALOR EM REAIS */}
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-blue-800 dark:text-blue-300">R$</span>
                                        <input 
                                            type="number" 
                                            value={hybridSignalValue} 
                                            onChange={(e) => handleHybridSignalValueChange(e.target.value)}
                                            placeholder="0,00"
                                            className="w-full p-2 border border-blue-300 rounded font-bold text-lg text-blue-900 focus:outline-none focus:border-highlight"
                                        />
                                    </div>

                                    {/* SLIDER AINDA DISPONÍVEL COMO OPÇÃO */}
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="100" 
                                        step="1" 
                                        value={signalPercent} 
                                        onChange={e => handleHybridSignalPercentChange(parseFloat(e.target.value))} 
                                        className="w-full accent-highlight"
                                    />

                                    {/* TOGGLE PARA O MOMENTO DO PAGAMENTO */}
                                    <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
                                        <span className="block text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase mb-1">
                                            Quando pagar o Pix/Dinheiro?
                                        </span>
                                        <div className="flex bg-white dark:bg-gray-800 rounded p-1">
                                            <button 
                                                onClick={() => setPixTiming('entry')} 
                                                className={`flex-1 py-1 px-2 text-xs rounded font-bold transition ${pixTiming === 'entry' ? 'bg-blue-600 text-white shadow' : 'text-gray-500'}`}
                                            >
                                                Na Entrada (Sinal)
                                            </button>
                                            <button 
                                                onClick={() => setPixTiming('delivery')} 
                                                className={`flex-1 py-1 px-2 text-xs rounded font-bold transition ${pixTiming === 'delivery' ? 'bg-blue-600 text-white shadow' : 'text-gray-500'}`}
                                            >
                                                Na Entrega/Retirada
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-700 p-3 rounded border border-gray-300 dark:border-gray-600">
                                    <div className="flex flex-col gap-2 mb-2">
                                        
                                        {/* ÁREA DE DESTAQUE PARA O RESTANTE */}
                                        <div className="mt-4 bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-700 p-4 rounded-lg animate-fade-in">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-xl">✍️</span>
                                                <label className="text-sm font-black text-orange-900 dark:text-orange-200 uppercase">
                                                    Como será pago o restante? (Texto do Contrato)
                                                </label>
                                            </div>

                                            <input 
                                                type="text" 
                                                value={remainderPaymentMode} 
                                                onChange={e => setRemainderPaymentMode(e.target.value)} 
                                                placeholder="Ex: Boleto Bancário, Cheque, Dinheiro..."
                                                className="w-full p-3 border-2 border-orange-300 dark:border-orange-700 rounded-lg text-lg font-bold text-gray-800 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:border-orange-500 mb-3 transition-colors"
                                            />

                                            {/* BOTÕES RÁPIDOS */}
                                            <div className="flex flex-wrap gap-2">
                                                {['Link de Pagamento (Cartão)', 'Boleto Bancário', 'Cheque Pré', 'Dinheiro na Entrega', 'Transferência Bancária'].map(opt => (
                                                    <button
                                                        key={opt}
                                                        onClick={() => setRemainderPaymentMode(opt)}
                                                        className="px-3 py-1 bg-white dark:bg-gray-700 border border-orange-200 dark:border-orange-800 rounded-full text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-orange-900/40 hover:text-orange-800 dark:hover:text-orange-200 transition-colors"
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 cursor-pointer mt-4 border-t border-gray-200 dark:border-gray-600 pt-2">
                                            <input type="checkbox" checked={enableInterest} onChange={e => setEnableInterest(e.target.checked)} className="w-4 h-4 rounded text-highlight"/>
                                            <span className="text-xs font-bold text-highlight">Somar Juros (Opcional)</span>
                                        </div>
                                    </div>

                                    {enableInterest && (
                                        <>
                                            <input type="number" placeholder="Valor total dos juros (R$)" value={interestValue} onChange={e => setInterestValue(e.target.value)} className="w-full p-2 border border-orange-300 rounded mb-2 text-sm bg-white dark:bg-gray-600 text-black dark:text-white"/>
                                            <label className="flex items-center gap-2 cursor-pointer mb-2">
                                                <input type="checkbox" checked={hideInterestLabel} onChange={e => setHideInterestLabel(e.target.checked)} className="w-4 h-4 rounded text-highlight"/>
                                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Ocultar palavra "com juros" no PDF</span>
                                            </label>
                                        </>
                                    )}
                                    <div className="flex gap-2 items-center mt-2">
                                        <div className="flex-1">
                                            <span className="text-xs text-gray-400 block">Parcelas</span>
                                            <input type="number" value={installments} onChange={e => setInstallments(parseInt(e.target.value)||1)} className="w-full p-1 border rounded font-bold text-center bg-white dark:bg-gray-600 text-black dark:text-white dark:border-gray-500"/>
                                        </div>
                                        <div className="flex-1 text-right">
                                            <span className="text-xs text-gray-400 block">Valor da Parcela</span>
                                            <span className="font-black text-lg text-gray-800 dark:text-gray-200">{formatCurrencyBRL(finalInstallmentVal)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {paymentMethod === 'card' && (
                            <div className="space-y-4 animate-fade-in">
                                <div className="bg-white dark:bg-gray-700 p-3 rounded border border-gray-300 dark:border-gray-600">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">Valor Total Cartão</label>
                                        <label className="flex items-center gap-1 cursor-pointer">
                                            <input type="checkbox" checked={enableInterest} onChange={e => setEnableInterest(e.target.checked)} className="w-4 h-4 rounded text-highlight"/>
                                            <span className="text-xs font-bold text-highlight">Somar Juros (R$)</span>
                                        </label>
                                    </div>
                                    {enableInterest && (
                                        <>
                                            <input type="number" placeholder="Valor total dos juros (R$)" value={interestValue} onChange={e => setInterestValue(e.target.value)} className="w-full p-2 border border-orange-300 rounded mb-2 text-sm bg-white dark:bg-gray-600 text-black dark:text-white"/>
                                            <label className="flex items-center gap-2 cursor-pointer mb-2">
                                                <input type="checkbox" checked={hideInterestLabel} onChange={e => setHideInterestLabel(e.target.checked)} className="w-4 h-4 rounded text-highlight"/>
                                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Ocultar palavra "com juros" no PDF</span>
                                            </label>
                                        </>
                                    )}
                                    <div className="flex gap-2 items-center">
                                        <div className="flex-1">
                                            <span className="text-xs text-gray-400 block">Parcelas</span>
                                            <input type="number" value={installments} onChange={e => setInstallments(parseInt(e.target.value)||1)} className="w-full p-1 border rounded font-bold text-center bg-white dark:bg-gray-600 text-black dark:text-white dark:border-gray-500"/>
                                        </div>
                                        <div className="flex-1 text-right">
                                            <span className="text-xs text-gray-400 block">Valor da Parcela</span>
                                            <span className="font-black text-lg text-gray-800 dark:text-gray-200">{formatCurrencyBRL(finalInstallmentVal)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="bg-gray-800 text-white p-6 rounded-xl mt-6">
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Valor Final do Contrato</div>
                            <div className="text-4xl font-black text-highlight">{formatCurrencyBRL(paymentMethod === 'pix' ? pixTotal : totalGeralFinal)}</div>
                            <div className="mt-2 text-xs text-gray-400">Inclui: Estrutura + Frete + Instalação + Extras {enableInterest ? '+ Juros' : ''}</div>
                        </div>

                        {!location.state?.isEditing && (
                            <div className="flex items-center mt-4 mb-2">
                                <input 
                                    type="checkbox" 
                                    id="addToQueue" 
                                    checked={addToQueue} 
                                    onChange={(e) => setAddToQueue(e.target.checked)} 
                                    className="mr-2 w-4 h-4 text-highlight focus:ring-highlight rounded border-gray-300" 
                                />
                                <label htmlFor="addToQueue" className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                    Adicionar automaticamente à Fila de Produção
                                </label>
                            </div>
                        )}

                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-4 mt-4">
                            <h3 className="text-sm font-black text-gray-900 dark:text-gray-100 uppercase mb-3 border-b border-gray-200 dark:border-gray-700 pb-1">
                                Ficha de Produção (Corte a Laser)
                            </h3>
                            <div className="flex gap-4 mb-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="cutStepType" value="left" checked={cutStepType === 'left'} onChange={() => { setCutStepType('left'); setUserManuallyChangedCut(true); }} className="w-4 h-4 accent-highlight" />
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Chapa Lisa (Furo Esquerdo)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="cutStepType" value="right" checked={cutStepType === 'right'} onChange={() => { setCutStepType('right'); setUserManuallyChangedCut(true); }} className="w-4 h-4 accent-highlight" />
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Chapa Lisa (Furo Direito)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="cutStepType" value="hollow_left" checked={cutStepType === 'hollow_left'} onChange={() => { setCutStepType('hollow_left'); setUserManuallyChangedCut(true); }} className="w-4 h-4 accent-highlight" />
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Chapa Vazada (Furo Esquerdo)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="cutStepType" value="hollow_right" checked={cutStepType === 'hollow_right'} onChange={() => { setCutStepType('hollow_right'); setUserManuallyChangedCut(true); }} className="w-4 h-4 accent-highlight" />
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Chapa Vazada (Furo Direito)</span>
                                </label>
                            </div>
                            <button onClick={handleGenerateProductionSheet} className="w-full bg-purple-600 text-white font-black py-3 rounded-lg shadow-lg hover:bg-purple-700 transition-all text-lg uppercase tracking-wide flex justify-center items-center gap-2">
                                <span>⚙️</span> Gerar Ficha de Produção
                            </button>
                        </div>

                        <div className="flex flex-col gap-4 mt-2">
                            <div className="flex gap-4">
                                <button onClick={handleSaveContract} disabled={isSavingContract} className={`flex-1 ${isSavingContract ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'} text-gray-800 dark:text-white font-black py-4 rounded-lg shadow-lg transition-all text-lg uppercase tracking-wide flex justify-center items-center gap-2`}>
                                    <span>💾</span> {isSavingContract ? 'Salvando...' : (location.state?.isEditing ? 'Salvar Alterações' : 'Salvar na Timeline')}
                                </button>
                                <button onClick={handleCopyCotacaoFrete} className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-lg shadow-lg hover:bg-indigo-700 transition-all text-lg uppercase tracking-wide flex justify-center items-center gap-2">
                                    <span>📋</span> Cotação de Frete
                                </button>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={handleGeneratePDF} className="flex-1 bg-highlight text-white font-black py-4 rounded-lg shadow-lg hover:bg-yellow-600 transition-all text-lg uppercase tracking-wide flex justify-center items-center gap-2">
                                     <span>📄</span> Gerar Contrato PDF
                                </button>
                                <button onClick={handleGenerateAceiteObra} className="flex-1 bg-blue-600 text-white font-black py-4 rounded-lg shadow-lg hover:bg-blue-700 transition-all text-lg uppercase tracking-wide flex justify-center items-center gap-2">
                                    <span>🏗️</span> Gerar Aceite de Obra
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* COMPONENTE NOVO: ORÇAMENTO TÉCNICO (FÁBRICA) */}
                    <TechnicalBudget 
                        clientName={clientName}
                        totalSteps={parseFloat(totalSteps) || 0}
                        stepHeightCm={parseFloat(stepHeight) || 0}
                        treadDepthCm={parseFloat(treadDepth) || 0}
                        widthCm={parseFloat(width) || 0}
                        totalLength={parseFloat(totalLength) || 0}
                        landings={landings}
                        stairDirection={stairDirection}
                        wallFixation={wallFixation}
                        cutStepType={cutStepType}
                        treadMaterial={treadMaterial}
                        woodType={treadMaterial === 'wood' ? woodType : undefined}
                        address={`${street}, ${number} - ${neighborhood}, ${city} - ${state}, ${zip}`}
                        zip={zip}
                        optionalItems={optionalItems}
                    />

                </div>

                {/* Seção de Textos Customizáveis */}
                <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6 md:p-8">
                    <SectionTitle title="5. Textos Customizáveis do Contrato" icon={<span>✏️</span>} />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Altere os textos padrão que aparecerão no PDF do contrato.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ContractInput 
                            label="Acabamento" 
                            value={finishText} 
                            onChange={(e: any) => setFinishText(e.target.value)} 
                        />
                        <ContractInput 
                            label="Garantia" 
                            value={warrantyText} 
                            onChange={(e: any) => setWarrantyText(e.target.value)} 
                        />
                        <ContractInput 
                            label="Capacidade por Degrau" 
                            value={stepCapacityText} 
                            onChange={(e: any) => setStepCapacityText(e.target.value)} 
                        />
                        <ContractInput 
                            label="Capacidade Total da Escada" 
                            value={stairCapacityText} 
                            onChange={(e: any) => setStairCapacityText(e.target.value)} 
                        />
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                                Dias Úteis para Entrega
                            </label>
                            <input 
                                type="number" 
                                value={deliveryDays} 
                                onChange={(e: any) => setDeliveryDays(Number(e.target.value))} 
                                className="w-full bg-white dark:bg-gray-800 text-black dark:text-white p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:border-highlight focus:ring-1 focus:ring-highlight outline-none"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <ContractInput 
                                label="Texto do Prazo de Entrega (Deixe vazio para usar a data calculada)" 
                                value={deliveryText} 
                                onChange={(e: any) => setDeliveryText(e.target.value)} 
                                placeholder="Ex: Deve ser feita em até 30 dias úteis após o pagamento do sinal"
                            />
                        </div>
                    </div>
                </div>

                {/* Seção de IA para Cláusulas */}
                <div className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 p-6 md:p-8">
                    <SectionTitle title="6. Cláusulas Adicionais (IA)" icon={<span>🤖</span>} />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Adicione ou refine condições específicas usando Inteligência Artificial (ex: Garantia estendida, condições de acesso, etc).</p>
                    
                    <div className="flex gap-2 mb-4">
                        <div className="relative flex-1">
                            <input 
                                type="text" 
                                value={aiPrompt} 
                                onChange={(e) => setAiPrompt(e.target.value)} 
                                placeholder="Digite ou use o microfone..." 
                                className="w-full bg-white dark:bg-gray-700 text-black dark:text-white p-3 pr-10 border rounded border-gray-300 dark:border-gray-600 outline-none focus:border-highlight"
                                onKeyDown={(e) => e.key === 'Enter' && handleGenerateClause()}
                            />
                            <button 
                                onClick={() => toggleListening('main')}
                                className={`absolute right-2 top-2 p-1.5 rounded-full transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-white'}`}
                                title="Falar"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                            </button>
                        </div>
                        <button 
                            onClick={handleGenerateClause} 
                            disabled={isGeneratingClause}
                            className="bg-gray-800 text-white px-6 py-2 rounded font-bold hover:bg-black disabled:opacity-50"
                        >
                            {isGeneratingClause ? 'Gerando...' : 'Gerar Cláusula'}
                        </button>
                    </div>

                    <div className="space-y-4">
                        {customClauses.map((clause, idx) => (
                            <div key={idx} className="bg-white dark:bg-gray-800 p-4 rounded border border-gray-200 dark:border-gray-700 shadow-sm relative group transition-all">
                                <p className="text-sm text-gray-700 dark:text-gray-300 italic pr-8">"{clause}"</p>
                                
                                <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => setRefiningIndex(refiningIndex === idx ? null : idx)}
                                        className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-3 py-1 rounded font-bold hover:bg-purple-200 dark:hover:bg-purple-800 flex items-center gap-1"
                                    >
                                        ✨ Refinar com IA
                                    </button>
                                </div>

                                <button 
                                    onClick={() => handleRemoveClause(idx)}
                                    className="absolute top-2 right-2 text-red-300 hover:text-red-600 font-bold"
                                >
                                    ✕
                                </button>

                                {/* CHATZINHO DE REFINAMENTO */}
                                {refiningIndex === idx && (
                                    <div className="mt-3 bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-100 dark:border-purple-800 animate-fade-in">
                                        <p className="text-xs font-bold text-purple-800 dark:text-purple-300 mb-2">O que você deseja alterar nesta cláusula?</p>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <input 
                                                    type="text" 
                                                    value={refinementPrompt}
                                                    onChange={(e) => setRefinementPrompt(e.target.value)}
                                                    placeholder="Ex: Deixe mais formal, adicione multa..."
                                                    className="w-full bg-white dark:bg-gray-700 text-black dark:text-white p-2 pr-8 text-sm border border-purple-200 dark:border-purple-800 rounded focus:outline-none focus:border-purple-400"
                                                    onKeyDown={(e) => e.key === 'Enter' && handleRefineClause(idx)}
                                                />
                                                <button 
                                                    onClick={() => toggleListening('refine')}
                                                    className={`absolute right-1 top-1 p-1 rounded-full transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-white'}`}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <button 
                                                onClick={() => handleRefineClause(idx)}
                                                disabled={isRefining}
                                                className="bg-purple-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-purple-700 disabled:opacity-50"
                                            >
                                                {isRefining ? '...' : 'Enviar'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        {customClauses.length === 0 && <p className="text-sm text-gray-400 italic">Nenhuma cláusula adicional.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contract;
