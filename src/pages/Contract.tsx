
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { GoogleGenAI } from "@google/genai";
import { generateContractPDF } from '../utils/contractGenerator.ts';
import { LandingInfo } from '../types';
import { formatCurrencyBRL } from '../utils';

// Fix for TS2580
declare var process: {
  env: {
    API_KEY: string;
    [key: string]: string | undefined;
  }
};

const SectionTitle = ({ title, icon }: { title: string; icon?: React.ReactNode }) => (
    <h2 className="text-xl font-black text-gray-900 mb-4 border-b-2 border-highlight pb-2 flex items-center gap-2 uppercase">
        {icon}
        {title}
    </h2>
);

const ContractInput = ({ label, value, onChange, type = "text", placeholder = "", className = "", disabled=false, maxLength, onBlur, isLoading }: any) => (
    <div className={className}>
        <label className="block text-sm font-bold text-gray-700 mb-1">{label}</label>
        <div className="relative">
            <input 
                type={type} 
                value={value} 
                onChange={onChange} 
                onBlur={onBlur}
                disabled={disabled}
                placeholder={placeholder}
                maxLength={maxLength}
                className={`w-full bg-white text-black p-3 rounded border border-gray-300 focus:outline-none focus:border-highlight focus:ring-1 focus:ring-highlight font-medium shadow-sm transition-all ${disabled ? 'bg-gray-100 text-gray-500' : ''}`}
            />
            {isLoading && <span className="absolute right-3 top-3 text-xs text-gray-500">Bus...</span>}
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

    // --- IA JURÍDICA ---
    const [customClauses, setCustomClauses] = useState<string[]>([]);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGeneratingClause, setIsGeneratingClause] = useState(false);

    useEffect(() => {
        const targetDate = addBusinessDays(new Date(), 20);
        const year = targetDate.getFullYear();
        const month = String(targetDate.getMonth() + 1).padStart(2, '0');
        const day = String(targetDate.getDate()).padStart(2, '0');
        setDeadlineDate(`${year}-${month}-${day}`);

        if (location.state) {
            const { 
                userData, selectedOption, inputData, 
                freightCost, tollCost, installationCost, extrasCost 
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

                setStructurePrice(selectedOption.totalPrice.toFixed(2));
                setFreightPrice(((freightCost || 0) + (tollCost || 0)).toFixed(2));
                setInstallationPrice((installationCost || 0).toFixed(2));
                setExtrasPrice((extrasCost || 0).toFixed(2));
            }
        }
    }, [location.state]);

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
    
    // FIX: Removed pixSignalVal and pixDeliveryVal unused variables to satisfy build
    // const pixSignalVal = pixTotal * (signalPercent / 100);
    // const pixDeliveryVal = pixTotal - pixSignalVal;

    // Cálculos Híbrido / Cartão
    // 1. Define o valor que vai para o cartão (Base)
    const hybridEntryPix = totalGeralBase * (signalPercent / 100);
    const baseAmountForCard = paymentMethod === 'hybrid' 
        ? totalGeralBase - hybridEntryPix 
        : totalGeralBase;

    // 2. Adiciona Juros (Dinheiro) se habilitado
    const interestMoney = enableInterest ? (parseFloat(interestValue) || 0) : 0;
    const totalFinanciadoReal = baseAmountForCard + interestMoney;
    
    // 3. Calcula Parcela
    const finalInstallmentVal = totalFinanciadoReal / (installments || 1);

    // Total Final Geral (Para exibição apenas)
    const totalGeralFinal = (paymentMethod === 'hybrid' ? hybridEntryPix : 0) + totalFinanciadoReal;

    // --- RESET AO MUDAR MÉTODO ---
    const handleMethodChange = (method: 'pix' | 'card' | 'hybrid') => {
        setPaymentMethod(method);
        setEnableInterest(false);
        setInterestValue('');
        if (method === 'pix') setSignalPercent(50);
        if (method === 'hybrid') setSignalPercent(20);
        if (method === 'card') setSignalPercent(0);
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
                optionalItems: [],
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
            additionalClauses: customClauses // Passa as cláusulas para o gerador
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
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">Emissão de Contrato</h1>
                <p className="text-gray-500">Preencha os dados finais para gerar o PDF.</p>
            </header>

            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                        <SectionTitle title="1. Dados do Cliente" />
                        
                        <div className="flex gap-4 mb-2">
                             <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-1 rounded border">
                                 <input type="radio" name="ptype" checked={personType === 'pf'} onChange={() => handlePersonTypeChange('pf')} className="accent-highlight"/>
                                 <span className="text-sm font-bold">Pessoa Física</span>
                             </label>
                             <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-1 rounded border">
                                 <input type="radio" name="ptype" checked={personType === 'pj'} onChange={() => handlePersonTypeChange('pj')} className="accent-highlight"/>
                                 <span className="text-sm font-bold">Pessoa Jurídica</span>
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

                        <div className="border-t border-gray-100 pt-4">
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
                                     <ContractInput label="UF *" value={state} onChange={(e: any) => setState(e.target.value.toUpperCase())} maxLength={2} className="text-center"/>
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
                            <ContractInput label="Comp." value={totalLength} onChange={(e: any) => setTotalLength(e.target.value)} type="number" />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <SectionTitle title="3. Valores & Entrega" />
                        <div className="grid grid-cols-2 gap-4">
                            <ContractInput label="Estrutura (R$)" value={structurePrice} onChange={(e: any) => setStructurePrice(e.target.value)} type="number" />
                            <ContractInput label="Frete/Instal (R$)" value={(parseFloat(freightPrice)+parseFloat(installationPrice)).toString()} disabled={true} />
                        </div>
                        
                        <div className="pt-4 border-t border-gray-100">
                             <label className="block text-sm font-bold text-gray-700 mb-1">Data Limite de Entrega (Item 4)</label>
                             <input 
                                type="date" 
                                value={deadlineDate} 
                                onChange={(e) => setDeadlineDate(e.target.value)}
                                className="w-full bg-white text-black p-3 rounded border border-gray-300 font-medium"
                             />
                             <p className="text-xs text-gray-500 mt-1">Calculado: 20 dias úteis (sem sáb/dom)</p>
                        </div>
                    </div>

                    <div className="space-y-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <SectionTitle title="4. Pagamento (Item 6)" />
                        
                        {/* 3 OPÇÕES DE BOTÃO */}
                        <div className="flex gap-2 mb-4 bg-gray-200 p-1 rounded">
                            <button onClick={() => handleMethodChange('pix')} className={`flex-1 py-2 rounded font-bold transition text-xs sm:text-sm ${paymentMethod === 'pix' ? 'bg-white shadow text-green-700' : 'text-gray-500 hover:bg-gray-300'}`}>Pix / À Vista</button>
                            <button onClick={() => handleMethodChange('hybrid')} className={`flex-1 py-2 rounded font-bold transition text-xs sm:text-sm ${paymentMethod === 'hybrid' ? 'bg-white shadow text-purple-700' : 'text-gray-500 hover:bg-gray-300'}`}>Híbrido</button>
                            <button onClick={() => handleMethodChange('card')} className={`flex-1 py-2 rounded font-bold transition text-xs sm:text-sm ${paymentMethod === 'card' ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:bg-gray-300'}`}>Cartão</button>
                        </div>

                        {paymentMethod === 'pix' && (
                            <div className="space-y-4 animate-fade-in">
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Desconto (%)</label>
                                        <input type="number" value={discountPercent} onChange={e => setDiscountPercent(parseFloat(e.target.value)||0)} className="w-full p-2 border rounded font-bold text-center"/>
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Sinal (%)</label>
                                        <input type="number" value={signalPercent} onChange={e => setSignalPercent(parseFloat(e.target.value)||0)} className="w-full p-2 border rounded font-bold text-center text-green-600"/>
                                    </div>
                                </div>
                                <div className="pt-2 text-sm text-gray-500 font-medium border-t border-gray-300">
                                    <p className="flex justify-between"><span>Valor Original:</span> <span className="line-through">{formatCurrencyBRL(totalGeralBase)}</span></p>
                                    <p className="flex justify-between text-green-700 font-bold text-lg"><span>A Pagar:</span> <span>{formatCurrencyBRL(pixTotal)}</span></p>
                                    <p className="text-xs mt-1">* 50% de sinal na assinatura e 50% na entrega.</p>
                                </div>
                            </div>
                        )}

                        {paymentMethod === 'hybrid' && (
                            <div className="space-y-4 animate-fade-in">
                                <div className="bg-blue-100 p-3 rounded">
                                    <label className="block text-xs font-bold text-blue-800 uppercase mb-1">Entrada no PIX ({signalPercent}%)</label>
                                    <input type="range" min="10" max="80" step="5" value={signalPercent} onChange={e => setSignalPercent(parseFloat(e.target.value))} className="w-full accent-highlight mb-1"/>
                                    <div className="text-right font-black text-blue-900">{formatCurrencyBRL(hybridEntryPix)}</div>
                                </div>

                                <div className="bg-white p-3 rounded border border-gray-300">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-bold text-gray-600 uppercase">Restante no Cartão</label>
                                        <label className="flex items-center gap-1 cursor-pointer">
                                            <input type="checkbox" checked={enableInterest} onChange={e => setEnableInterest(e.target.checked)} className="w-4 h-4 rounded text-highlight"/>
                                            <span className="text-xs font-bold text-highlight">Somar Juros (R$)</span>
                                        </label>
                                    </div>
                                    {enableInterest && (
                                        <input type="number" placeholder="Valor total dos juros (R$)" value={interestValue} onChange={e => setInterestValue(e.target.value)} className="w-full p-2 border border-orange-300 rounded mb-2 text-sm"/>
                                    )}
                                    <div className="flex gap-2 items-center">
                                        <div className="flex-1">
                                            <span className="text-xs text-gray-400 block">Parcelas</span>
                                            <input type="number" value={installments} onChange={e => setInstallments(parseInt(e.target.value)||1)} className="w-full p-1 border rounded font-bold text-center"/>
                                        </div>
                                        <div className="flex-1 text-right">
                                            <span className="text-xs text-gray-400 block">Valor da Parcela</span>
                                            <span className="font-black text-lg text-gray-800">{formatCurrencyBRL(finalInstallmentVal)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {paymentMethod === 'card' && (
                            <div className="space-y-4 animate-fade-in">
                                <div className="bg-white p-3 rounded border border-gray-300">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-bold text-gray-600 uppercase">Valor Total Cartão</label>
                                        <label className="flex items-center gap-1 cursor-pointer">
                                            <input type="checkbox" checked={enableInterest} onChange={e => setEnableInterest(e.target.checked)} className="w-4 h-4 rounded text-highlight"/>
                                            <span className="text-xs font-bold text-highlight">Somar Juros (R$)</span>
                                        </label>
                                    </div>
                                    {enableInterest && (
                                        <input type="number" placeholder="Valor total dos juros (R$)" value={interestValue} onChange={e => setInterestValue(e.target.value)} className="w-full p-2 border border-orange-300 rounded mb-2 text-sm"/>
                                    )}
                                    <div className="flex gap-2 items-center">
                                        <div className="flex-1">
                                            <span className="text-xs text-gray-400 block">Parcelas</span>
                                            <input type="number" value={installments} onChange={e => setInstallments(parseInt(e.target.value)||1)} className="w-full p-1 border rounded font-bold text-center"/>
                                        </div>
                                        <div className="flex-1 text-right">
                                            <span className="text-xs text-gray-400 block">Valor da Parcela</span>
                                            <span className="font-black text-lg text-gray-800">{formatCurrencyBRL(finalInstallmentVal)}</span>
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
                <div className="bg-gray-50 border-t border-gray-200 p-6 md:p-8">
                    <SectionTitle title="5. Cláusulas Adicionais (IA)" icon={<span>🤖</span>} />
                    <p className="text-sm text-gray-500 mb-4">Adicione condições específicas usando Inteligência Artificial (ex: Garantia estendida, condições de acesso, etc).</p>
                    
                    <div className="flex gap-2 mb-4">
                        <input 
                            type="text" 
                            value={aiPrompt} 
                            onChange={(e) => setAiPrompt(e.target.value)} 
                            placeholder="Ex: O cliente deve providenciar andaime..." 
                            className="flex-1 p-3 border rounded border-gray-300 outline-none focus:border-highlight"
                            onKeyDown={(e) => e.key === 'Enter' && handleGenerateClause()}
                        />
                        <button 
                            onClick={handleGenerateClause} 
                            disabled={isGeneratingClause}
                            className="bg-gray-800 text-white px-6 py-2 rounded font-bold hover:bg-black disabled:opacity-50"
                        >
                            {isGeneratingClause ? 'Gerando...' : 'Gerar Cláusula'}
                        </button>
                    </div>

                    <div className="space-y-3">
                        {customClauses.map((clause, idx) => (
                            <div key={idx} className="bg-white p-4 rounded border border-gray-200 shadow-sm relative group">
                                <p className="text-sm text-gray-700 italic">"{clause}"</p>
                                <button 
                                    onClick={() => handleRemoveClause(idx)}
                                    className="absolute top-2 right-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity font-bold"
                                >
                                    ✕
                                </button>
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
