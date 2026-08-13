import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { CostSettings } from '../types';
import { useAuth } from '../components/AuthProvider';

export default function CostSettingsPage() {
    const { user } = useAuth();
    const [settings, setSettings] = useState<CostSettings>({
        steelCostPerStep: 0,
        woodCostPerStep: 0,
        taxPercentage: 0,
        commissionPercentage: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            if (!user) return;
            try {
                const docRef = doc(db, 'settings', 'production_costs');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setSettings(docSnap.data() as CostSettings);
                }
            } catch (error) {
                console.error("Erro ao buscar configurações de custo:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, [user]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsSaving(true);
        try {
            await setDoc(doc(db, 'settings', 'production_costs'), settings);
            alert('Configurações de custo salvas com sucesso!');
        } catch (error) {
            console.error("Erro ao salvar configurações:", error);
            alert('Erro ao salvar as configurações.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    };

    if (!user) {
        return (
            <div className="max-w-4xl mx-auto p-4 flex flex-col items-center justify-center h-[50vh]">
                <h2 className="text-2xl font-bold text-gray-800">Acesso Restrito</h2>
                <p className="text-gray-500">Você precisa estar logado para acessar as configurações de custo.</p>
            </div>
        );
    }

    if (isLoading) {
        return <div className="text-center mt-10">Carregando...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-highlight" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Configurações Financeiras (Lucro)
            </h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <p className="text-gray-600 mb-6">
                    Estes valores serão usados na Calculadora para abater do valor final da escada (junto com frete e instalação) e calcular o Lucro Líquido no painel de CRM.
                </p>

                <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Custo Médio do Aço (Por Degrau)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-gray-500">R$</span>
                                <input
                                    type="number"
                                    name="steelCostPerStep"
                                    value={settings.steelCostPerStep}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-highlight outline-none"
                                    step="0.01"
                                    min="0"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Custo Médio da Madeira/Pisante (Por Degrau)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-gray-500">R$</span>
                                <input
                                    type="number"
                                    name="woodCostPerStep"
                                    value={settings.woodCostPerStep}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-highlight outline-none"
                                    step="0.01"
                                    min="0"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Imposto sobre Venda (%)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    name="taxPercentage"
                                    value={settings.taxPercentage}
                                    onChange={handleChange}
                                    className="w-full pr-10 pl-3 py-2 border rounded-lg focus:ring-2 focus:ring-highlight outline-none"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                />
                                <span className="absolute right-3 top-2 text-gray-500">%</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Comissão sobre Venda (%)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    name="commissionPercentage"
                                    value={settings.commissionPercentage}
                                    onChange={handleChange}
                                    className="w-full pr-10 pl-3 py-2 border rounded-lg focus:ring-2 focus:ring-highlight outline-none"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                />
                                <span className="absolute right-3 top-2 text-gray-500">%</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="bg-highlight hover:bg-black text-white px-6 py-2 rounded-lg font-bold transition-colors disabled:opacity-50"
                        >
                            {isSaving ? 'Salvando...' : 'Salvar Configurações'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
