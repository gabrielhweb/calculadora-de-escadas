
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { generateContractPDF } from '../utils/contractGenerator';
import { ProposalOption, UserData, CalculatorInput } from '../types';

const SectionTitle = ({ title, icon }: { title: string; icon?: React.ReactNode }) => (
    <h2 className="text-xl font-black text-gray-900 mb-4 border-b-2 border-highlight pb-2 flex items-center gap-2 uppercase">
        {icon}
        {title}
    </h2>
);

const ContractInput = ({ label, value, onChange, type = "text", placeholder = "", className = "" }: any) => (
    <div className={className}>
        <label className="block text-sm font-bold text-gray-700 mb-1">{label}</label>
        <input 
            type={type} 
            value={value} 
            onChange={onChange} 
            placeholder={placeholder}
            className="w-full bg-white text-black p-3 rounded border border-gray-300 focus:outline-none focus:border-highlight focus:ring-1 focus:ring-highlight font-medium shadow-sm transition-all"
        />
    </div>
);

const Contract = () => {
    const location = useLocation();
    
    const [clientName, setClientName] = useState('');
    const [clientCpf, setClientCpf] = useState('');
    const [clientAddress, setClientAddress] = useState('');
    const [totalHeight, setTotalHeight] = useState('300');
    const [width, setWidth] = useState('70');
    const [totalSteps, setTotalSteps] = useState('15');
    const [stepHeight, setStepHeight] = useState('20');
    const [treadDepth, setTreadDepth] = useState('25');
    const [totalLength, setTotalLength] = useState('300');
    const [dampers, setDampers] = useState('4');
    const [structurePrice, setStructurePrice] = useState('0');
    const [freightPrice, setFreightPrice] = useState('0');
    const [installationPrice, setInstallationPrice] = useState('0');
    const [extrasPrice, setExtrasPrice] = useState('0');
    const [extraClauses, setExtraClauses] = useState('');

    useEffect(() => {
        if (location.state) {
            const { 
                userData, selectedOption, inputData, 
                freightCost, tollCost, installationCost, extrasCost 
            } = location.state;

            if (userData) {
                setClientName(userData.name || '');
                setClientCpf(userData.cpf || '');
                setClientAddress(userData.address || '');
            }

            if (selectedOption && inputData) {
                setTotalHeight(inputData.totalHeight.toString());
                setWidth(selectedOption.stairWidth.toString());
                setTotalSteps(selectedOption.steps.toString());
                setStepHeight(selectedOption.stepHeight.toFixed(2));
                setTreadDepth(selectedOption.treadDepth.toFixed(2));
                setTotalLength(selectedOption.totalLength.toString());
                setDampers(inputData.dampers.toString());
                setStructurePrice(selectedOption.totalPrice.toFixed(2));
                setFreightPrice(((freightCost || 0) + (tollCost || 0)).toFixed(2));
                setInstallationPrice((installationCost || 0).toFixed(2));
                setExtrasPrice((extrasCost || 0).toFixed(2));
            }
        }
    }, [location.state]);

    const handleGeneratePDF = () => {
        if (!clientName || !clientAddress) {
            alert("Por favor, preencha Nome e Endereço do cliente.");
            return;
        }

        generateContractPDF({
            userData: { name: clientName, cpf: clientCpf, address: clientAddress },
            selectedOption: {
                optionNumber: 1,
                steps: parseFloat(totalSteps) || 0,
                stepHeight: parseFloat(stepHeight) || 0,
                totalLength: parseFloat(totalLength) || 0,
                totalPrice: parseFloat(structurePrice) || 0,
                stairWidth: parseFloat(width) || 0,
                treadDepth: parseFloat(treadDepth) || 0
            },
            inputData: {
                totalHeight: parseFloat(totalHeight) || 0,
                desiredSteps: parseFloat(totalSteps) || 0,
                stairWidth: parseFloat(width) || 0,
                treadDepth: parseFloat(treadDepth) || 0,
                dampers: parseFloat(dampers) || 4,
                optionalItems: []
            },
            extraClauses,
            freightCost: parseFloat(freightPrice) || 0,
            tollCost: 0,
            installationCost: parseFloat(installationPrice) || 0,
            extrasCost: parseFloat(extrasPrice) || 0
        });
    };

    return (
        <div className="max-w-5xl mx-auto p-6 md:p-12">
            <header className="mb-10 text-center">
                <h1 className="text-4xl font-black text-gray-900 mb-2">Emissão de Contrato</h1>
                <p className="text-gray-500">Gere o PDF oficial de venda.</p>
            </header>

            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                        <SectionTitle title="1. Dados do Cliente" />
                        <ContractInput label="Nome Completo *" value={clientName} onChange={(e: any) => setClientName(e.target.value)} />
                        <ContractInput label="CPF / CNPJ" value={clientCpf} onChange={(e: any) => setClientCpf(e.target.value)} />
                        <ContractInput label="Endereço Completo *" value={clientAddress} onChange={(e: any) => setClientAddress(e.target.value)} />
                    </div>
                    <div className="space-y-6">
                        <SectionTitle title="2. Especificações" />
                        <div className="grid grid-cols-2 gap-4">
                            <ContractInput label="Altura (cm)" value={totalHeight} onChange={(e: any) => setTotalHeight(e.target.value)} type="number" />
                            <ContractInput label="Largura (cm)" value={width} onChange={(e: any) => setWidth(e.target.value)} type="number" />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <ContractInput label="Degraus" value={totalSteps} onChange={(e: any) => setTotalSteps(e.target.value)} type="number" />
                            <ContractInput label="Pisante" value={treadDepth} onChange={(e: any) => setTreadDepth(e.target.value)} type="number" />
                            <ContractInput label="Comp." value={totalLength} onChange={(e: any) => setTotalLength(e.target.value)} type="number" />
                        </div>
                    </div>
                    <div className="space-y-6">
                        <SectionTitle title="3. Financeiro" />
                        <div className="grid grid-cols-2 gap-4">
                            <ContractInput label="Estrutura (R$)" value={structurePrice} onChange={(e: any) => setStructurePrice(e.target.value)} type="number" />
                            <ContractInput label="Logística (R$)" value={freightPrice} onChange={(e: any) => setFreightPrice(e.target.value)} type="number" />
                        </div>
                    </div>
                    <div className="space-y-6">
                         <SectionTitle title="4. Observações" />
                        <textarea 
                            value={extraClauses}
                            onChange={(e) => setExtraClauses(e.target.value)}
                            className="w-full h-32 p-4 rounded border border-gray-300 focus:border-highlight outline-none font-medium"
                            placeholder="Notas adicionais..."
                        ></textarea>
                    </div>
                </div>
                <div className="bg-gray-50 p-8 border-t border-gray-200 text-center">
                    <button onClick={handleGeneratePDF} className="bg-dark text-white font-black py-4 px-10 rounded-lg hover:bg-black transition-all shadow-xl uppercase">
                        Gerar e Baixar PDF do Contrato
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Contract;
