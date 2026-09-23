import React, { useState } from 'react';
import { GuardrailEditor } from '../components/GuardrailEditor';
import { getAutoGuardrailLengths } from '../components/CalculatorForm';

// Global InputField for GuardrailEditor
const InputField = ({ label, value, onChange, type = "text", placeholder, icon, addon }: any) => (
    <div className="flex flex-col">
        <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase">{label}</label>
        <div className="relative">
            {icon && <span className="absolute left-2.5 top-2.5 text-gray-400">{icon}</span>}
            <input
                type={type}
                value={value === 0 ? '' : value}
                onChange={onChange}
                placeholder={placeholder}
                className={`w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded p-2 text-sm font-bold text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-highlight focus:border-highlight outline-none ${icon ? 'pl-8' : ''} ${addon ? 'pr-8' : ''}`}
            />
            {addon && <span className="absolute right-3 top-2 text-xs font-bold text-gray-400">{addon}</span>}
        </div>
    </div>
);

export default function GuardrailCalculatorPage() {
    const [guardrails, setGuardrails] = useState<any[]>([]);

    const handleAddGuardrail = () => {
        setGuardrails([...guardrails, { 
            id: Date.now().toString(), 
            hasGuardrail: true,
            guardrailFormat: "normal", 
            guardrailSide: "left",
            guardrailLength: 100, 
            guardrailHeight: 90, 
            guardrailPricePerMeter: 50 
        }]);
    };

    const handleAddGate = () => {
        setGuardrails([...guardrails, { 
            id: Date.now().toString(), 
            hasGate: true,
            gateSide: "left",
            gateLength: 100, 
            gateHeight: 90, 
            gatePricePerMeter: 50 
        }]);
    };

    const updateGuardrail = (id: string, updates: any) => {
        setGuardrails(guardrails.map(g => {
            if (g.id !== id) return g;
            const updated = { ...g, ...updates };
            // Recalculate auto lengths if needed
            if (updates.guardrailFormat || updates.guardrailSide) {
                const auto = getAutoGuardrailLengths(updated.guardrailFormat, updated.guardrailSide, 100, 100);
                if (auto) {
                    updated.guardrailLength = auto.guardrailLength;
                    updated.guardrailLength2 = auto.guardrailLength2;
                    updated.guardrailLength3 = auto.guardrailLength3;
                }
            }
            return updated;
        }));
    };

    const handleRemoveGuardrail = (id: string) => {
        setGuardrails(guardrails.filter(g => g.id !== id));
    };

    const handlePrintGuardrails = () => {
        if (guardrails.length === 0) {
            alert('Adicione pelo menos um guarda-corpo ou portão para imprimir.');
            return;
        }
        import('../utils/productionPdfGenerator').then(({ generateGuardrailsOnlyPDF }) => {
            generateGuardrailsOnlyPDF(guardrails, 'Projeto_Avulso');
        });
    };

    return (
        <div className="p-4 sm:p-6 h-[calc(100vh-64px)] overflow-y-auto pb-24">
            <div className="max-w-4xl mx-auto">
                
                <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-black text-gray-800 dark:text-white flex items-center gap-2">
                            🚧 Calculadora de Guarda-Corpo & Portão
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                            Adicione guarda-corpos e portõezinhos avulsos para orçar e ver o esquema de montagem.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handlePrintGuardrails} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-bold shadow transition-colors text-sm flex items-center gap-2">
                            🖨️ Imprimir
                        </button>
                        <button onClick={handleAddGuardrail} className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg font-bold shadow transition-colors text-sm">
                            + Guarda-Corpo
                        </button>
                        <button onClick={handleAddGate} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold shadow transition-colors text-sm">
                            + Portão
                        </button>
                    </div>
                </div>

                {guardrails.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 text-center shadow-sm">
                        <span className="text-4xl mb-4 block">🚧</span>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Nenhum item adicionado</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto mb-6">
                            Clique nos botões acima para simular um guarda-corpo ou portão de forma rápida.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {guardrails.map((g, idx) => (
                            <div key={g.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm relative">
                                <button 
                                    onClick={() => handleRemoveGuardrail(g.id)}
                                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow z-10"
                                    title="Remover"
                                >
                                    ✕
                                </button>
                                
                                <h3 className="text-sm font-black uppercase text-gray-400 border-b border-gray-100 dark:border-gray-700 pb-2 mb-4">
                                    {g.hasGate ? 'Portãozinho' : 'Guarda-Corpo'} #{idx + 1}
                                </h3>

                                <div className="mt-2">
                                    <GuardrailEditor 
                                        landing={g} 
                                        updateLanding={updateGuardrail} 
                                        InputField={InputField} 
                                        isGate={g.hasGate}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
