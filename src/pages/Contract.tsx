
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { GoogleGenAI } from "@google/genai";
import { generateContractPDF } from '../utils/contractGenerator.ts';
import { LandingInfo, OptionalItem } from '../types';
import { formatCurrencyBRL } from '../utils';

// Fix for TS2580
declare var process: {
  env: {
    API_KEY: string;
    [key: string]: string | undefined;
  }
};

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

const addBusinessDays = (startDate: Date, days: number) => {
    let count = 0;
    let currentDate = new Date(startDate);
    while (count < days) {
        currentDate.setDate(currentDate.getDate() + 1);
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            count++;
        }
    }
    return currentDate;
};

const Contract = () => {
    const location = useLocation();
    
    const STANDARD_INSTALLATION = 290;
    
    // Dados do Cliente
    const [clientName, setClientName] = useState('');
    const [clientDoc, setClientDoc] = useState(''); // CPF ou CNPJ
    const [clientRG, setClientRG] = useState('');
    
    // Endereço Estruturado
    const [zip, setZip] = useState('');
    const [street, setStreet] = useState('');
    const [number, setNumber] = useState('');
    const [neighborhood, setNeighborhood] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [isLoadingCep, setIsLoadingCep] = useState(false);

    const [personType, setPersonType] = useState<'pf' | 'pj'>('pf');

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
    
    // Inputs para adicionar novo item
    const [newItemName, setNewItemName] = useState('');
    const [newItemPrice, setNewItemPrice] = useState('');

    // Dados Financeiros
    const [structurePrice, setStructurePrice] = useState('0');
    const [freightPrice, setFreightPrice] = useState('0');
    const [installationPrice, setInstallationPrice] = useState('0');
    const [extrasPrice, setExtrasPrice] = useState('0');
    
    // Configurações do Contrato
    const [deadlineDate, setDeadlineDate] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card' | 'hybrid'>('pix');
    
    // Pagamento
    const [discountPercent, setDiscountPercent] = useState(5);
    const [signalPercent, setSignalPercent] = useState(50);
    const [installments, setInstallments] = useState(6);
    
    // --- LÓGICA DE JUROS/TAXAS NO CARTÃO ---
    const [enableInterest, setEnableInterest] = useState(false);
    const [interestValue, setInterestValue] = useState(''); // Valor monetário (R$)

    // --- IA JURÍDICA & REFINAMENTO ---
    const [customClauses, setCustomClauses] = useState<string[]>([]);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGeneratingClause, setIsGeneratingClause] = useState(false);
    
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

    useEffect(() => {
        const targetDate = addBusinessDays(new Date(), 20);
        const year = targetDate.getFullYear();
        const month = String(targetDate.getMonth() + 1).padStart(2, '0');
        const day = String(targetDate.getDate()).padStart(2, '0');
        setDeadlineDate(`${year}-${month}-${day}`);

        if (location.state) {
            const { 
                userData, selectedOption, inputData, 
                freightCost, tollCost, installationCost 
            } = location.state;

            if (userData) {
                setClientName(userData.name || '');
                setClientDoc(userData.cpf || '');
                setClientRG(userData.rg || '');
                
                if (userData.zip) setZip(userData.zip);
                if (userData.street) setStreet(userData.street);
                if (userData.number) setNumber(userData.number);
                if (userData.neighborhood) setNeighborhood(userData.neighborhood);
                if (userData.city) setCity(userData.city);
                if (userData.state) setState(userData.state);
                
                if (!userData.street && userData.address) {
                    setStreet(userData.address);
                }

                if (userData.cpf && userData.cpf.length > 14) {
                    setPersonType('pj');
                } else {
                    setPersonType('pf');
                }
            }

            if (selectedOption && inputData) {
                setTotalHeight(inputData.totalHeight.toString());
                setWidth(selectedOption.stairWidth.toString());
                setTotalSteps(selectedOption.steps.toString());
                setStepHeight(selectedOption.stepHeight.toFixed(2));
                setTreadDepth(selectedOption.treadDepth.toFixed(2));
                setTotalLength(selectedOption.totalLength.toString());
                setDampers(inputData.dampers.toString());
                
                if (selectedOption.landings && selectedOption.landings.length > 0) {
                    setLandings(selectedOption.landings);
                } else {
                    setLandings([]);
                }
                
                if (inputData.optionalItems && inputData.optionalItems.length > 0) {
                    setOptionalItems(inputData.optionalItems);
                }

                setStructurePrice(selectedOption.totalPrice.toFixed(2));
                setFreightPrice(((freightCost || 0) + (tollCost || 0)).toFixed(2));
                setInstallationPrice((installationCost || 0).toFixed(2));
<<<<<<< HEAD
=======
                // setExtrasPrice é tratado pelo useEffect agora
>>>>>>> 3e818bea7652efae6cbb2621b8e59f6f2a3be64b
            }
        }
    }, [location.state]);

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

    // Cálculos Base
    const totalGeralBase = (parseFloat(structurePrice)||0) + (parseFloat(freightPrice)||0) + (parseFloat(installationPrice)||0) + (parseFloat(extrasPrice)||0);

    // Cálculos Pix
    const pixDiscountVal = totalGeralBase * (discountPercent / 100);
    const pixTotal = totalGeralBase - pixDiscountVal;
    
    // Cálculos Híbrido / Cartão
    const hybridEntryPix = totalGeralBase * (signalPercent / 100);
    const baseAmountForCard = paymentMethod === 'hybrid' 
        ? totalGeralBase - hybridEntryPix 
        : totalGeralBase;

    const interestMoney = enableInterest ? (parseFloat(interestValue) || 0) : 0;
    const totalFinanciadoReal = baseAmountForCard + interestMoney;
    const finalInstallmentVal = totalFinanciadoReal / (installments || 1);
    const totalGeralFinal = (paymentMethod === 'hybrid' ? hybridEntryPix : 0) + totalFinanciadoReal;

    const handleMethodChange = (method: 'pix' | 'card' | 'hybrid') => {
        setPaymentMethod(method);
        setEnableInterest(false);
        setInterestValue('');
        if (method === 'pix') setSignalPercent(50);
        if (method === 'hybrid') setSignalPercent(20);
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

    const handleGeneratePDF = () => {
        if (!clientName || !street || !number || !city) {
            alert("Por favor, preencha Nome e Endereço Completo do cliente.");
            return;
        }

        const numLandings = landings.length;
        const totalStepsNum = parseFloat(totalSteps) || 0;
        const structureStepsNum = totalStepsNum - numLandings;
        const fullAddress = `${street}, ${number} - ${neighborhood}, ${city} - ${state}, ${zip}`;

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
                totalPrice: parseFloat(structurePrice) || 0,
                stairWidth: parseFloat(width) || 0,
                treadDepth: parseFloat(treadDepth) || 0,
                landings: landings
            },
            inputData: {
                totalHeight: parseFloat(totalHeight) || 0,
                desiredSteps: totalStepsNum,
                stairWidth: parseFloat(width) || 0,
                treadDepth: parseFloat(treadDepth) || 0,
                dampers: parseFloat(dampers) || 4,
                optionalItems: optionalItems, 
                landings: landings
            },
            freightCost: parseFloat(freightPrice) || 0,
            tollCost: 0,
            installationCost: parseFloat(installationPrice) || 0,
            extrasCost: parseFloat(extrasPrice) || 0,
            deadlineDate, 
            paymentMethod,
            paymentDetails: {
                discountPercent, signalPercent, installments, installmentValue: finalInstallmentVal
            },
            additionalClauses: customClauses 
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
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-2">Emissão de Contrato</h1>
                <p className="text-gray-500 dark:text-gray-400">Preencha os dados finais para gerar o PDF.</p>
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

                    <div className="space-y-6">
                        <SectionTitle title="3. Valores & Entrega" />
                        <div className="grid grid-cols-2 gap-4">
                            <ContractInput label="Estrutura (R$)" value={structurePrice} onChange={(e: any) => setStructurePrice(e.target.value)} type="number" />
                            <ContractInput label="Frete + Pedágio (R$)" value={freightPrice} onChange={(e: any) => setFreightPrice(e.target.value)} type="number" />
                            
                            {/* Instalação Customizada */}
                            <div className="col-span-2 sm:col-span-1 sm:col-start-1 sm:row-start-2">
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
                        
                        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                             <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Data Limite de Entrega (Item 4)</label>
                             <input 
                                type="date" 
                                value={deadlineDate} 
                                onChange={(e) => setDeadlineDate(e.target.value)}
                                className="w-full bg-white dark:bg-gray-700 text-black dark:text-white p-3 rounded border border-gray-300 dark:border-gray-600 font-medium"
                             />
                             <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Calculado: 20 dias úteis (sem sáb/dom)</p>
                        </div>
                    </div>

                    <div className="space-y-6 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <SectionTitle title="4. Pagamento (Item 6)" />
                        
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
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Desconto (%)</label>
                                        <input type="number" value={discountPercent} onChange={e => setDiscountPercent(parseFloat(e.target.value)||0)} className="w-full p-2 border rounded font-bold text-center bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600"/>
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Sinal (%)</label>
                                        <input type="number" value={signalPercent} onChange={e => setSignalPercent(parseFloat(e.target.value)||0)} className="w-full p-2 border rounded font-bold text-center text-green-600 dark:text-green-400 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"/>
                                    </div>
                                </div>
                                <div className="pt-2 text-sm text-gray-500 dark:text-gray-400 font-medium border-t border-gray-300 dark:border-gray-600">
                                    <p className="flex justify-between"><span>Valor Original:</span> <span className="line-through">{formatCurrencyBRL(totalGeralBase)}</span></p>
                                    <p className="flex justify-between text-green-700 dark:text-green-400 font-bold text-lg"><span>A Pagar:</span> <span>{formatCurrencyBRL(pixTotal)}</span></p>
                                    <p className="text-xs mt-1">* 50% de sinal na assinatura e 50% na entrega.</p>
                                </div>
                            </div>
                        )}

                        {paymentMethod === 'hybrid' && (
                            <div className="space-y-4 animate-fade-in">
                                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded">
                                    <label className="block text-xs font-bold text-blue-800 dark:text-blue-300 uppercase mb-1">Entrada no PIX ({signalPercent}%)</label>
                                    <input type="range" min="10" max="80" step="5" value={signalPercent} onChange={e => setSignalPercent(parseFloat(e.target.value))} className="w-full accent-highlight mb-1"/>
                                    <div className="text-right font-black text-blue-900 dark:text-blue-300">{formatCurrencyBRL(hybridEntryPix)}</div>
                                </div>

                                <div className="bg-white dark:bg-gray-700 p-3 rounded border border-gray-300 dark:border-gray-600">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">Restante no Cartão</label>
                                        <label className="flex items-center gap-1 cursor-pointer">
                                            <input type="checkbox" checked={enableInterest} onChange={e => setEnableInterest(e.target.checked)} className="w-4 h-4 rounded text-highlight"/>
                                            <span className="text-xs font-bold text-highlight">Somar Juros (R$)</span>
                                        </label>
                                    </div>
                                    {enableInterest && (
                                        <input type="number" placeholder="Valor total dos juros (R$)" value={interestValue} onChange={e => setInterestValue(e.target.value)} className="w-full p-2 border border-orange-300 rounded mb-2 text-sm bg-white dark:bg-gray-600 text-black dark:text-white"/>
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
                                        <input type="number" placeholder="Valor total dos juros (R$)" value={interestValue} onChange={e => setInterestValue(e.target.value)} className="w-full p-2 border border-orange-300 rounded mb-2 text-sm bg-white dark:bg-gray-600 text-black dark:text-white"/>
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

                        <button onClick={handleGeneratePDF} className="w-full bg-highlight text-white font-black py-4 rounded-lg shadow-lg hover:bg-yellow-600 transition-all text-xl mt-4 uppercase tracking-wide flex justify-center items-center gap-2">
                             <span>📄</span> Gerar e Baixar Contrato
                        </button>
                    </div>
                </div>

                {/* Seção de IA para Cláusulas */}
                <div className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 p-6 md:p-8">
                    <SectionTitle title="5. Cláusulas Adicionais (IA)" icon={<span>🤖</span>} />
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
