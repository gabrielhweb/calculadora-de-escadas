import React, { useState, useEffect } from 'react';
import { useAuth } from '../../components/AuthProvider';
import { Link } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function PurchasesDashboard() {
    const { user } = useAuth();
    const [settings, setSettings] = useState({
        taxPercentage: 0,
        commissionPercentage: 0
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            if (!user) return;
            try {
                const docRef = doc(db, 'settings', 'production_costs');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setSettings({
                        taxPercentage: docSnap.data().taxPercentage || 0,
                        commissionPercentage: docSnap.data().commissionPercentage || 0
                    });
                }
            } catch (error) {
                console.error("Erro ao buscar configurações:", error);
            }
        };
        fetchSettings();
    }, [user]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsSaving(true);
        try {
            await setDoc(doc(db, 'settings', 'production_costs'), settings, { merge: true });
            alert('Configurações salvas com sucesso!');
        } catch (error) {
            console.error("Erro ao salvar:", error);
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
            <div className="max-w-7xl mx-auto p-4 sm:p-6 flex flex-col items-center justify-center h-[50vh]">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Acesso Restrito</h2>
                <p className="text-gray-500 dark:text-gray-400 text-center">
                    Você precisa fazer login para acessar.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 pb-24 space-y-12">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-6">
                    📦 Compras e Pedidos de Material
                </h1>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Link to="/compras/catalogo" className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow group">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <span className="text-2xl">📋</span>
                        </div>
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white">Produtos</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                            Cadastre as matérias-primas e preços
                        </p>
                    </Link>

                    <Link to="/compras/fornecedores" className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow group">
                        <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <span className="text-2xl">🏭</span>
                        </div>
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white">Fornecedores</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                            Lojas onde você compra material
                        </p>
                    </Link>

                    <Link to="/compras/novo-pedido" className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow group">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <span className="text-2xl">🛒</span>
                        </div>
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white">Novo Pedido</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                            Crie lista de compras para a fábrica
                        </p>
                    </Link>

                    <Link to="/compras/historico" className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow group">
                        <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <span className="text-2xl">🧾</span>
                        </div>
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white">Histórico de Pedidos</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                            Últimos pedidos de material feitos
                        </p>
                    </Link>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Configurações Financeiras</h2>
                <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Imposto sobre Venda (%)</label>
                        <div className="relative">
                            <input
                                type="number"
                                name="taxPercentage"
                                value={settings.taxPercentage}
                                onChange={handleChange}
                                className="w-full pr-10 pl-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-highlight outline-none text-gray-900 dark:text-white"
                                step="0.01"
                                min="0"
                                max="100"
                            />
                            <span className="absolute right-3 top-2 text-gray-500 dark:text-gray-400">%</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Comissão sobre Venda (%)</label>
                        <div className="relative">
                            <input
                                type="number"
                                name="commissionPercentage"
                                value={settings.commissionPercentage}
                                onChange={handleChange}
                                className="w-full pr-10 pl-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-highlight outline-none text-gray-900 dark:text-white"
                                step="0.01"
                                min="0"
                                max="100"
                            />
                            <span className="absolute right-3 top-2 text-gray-500 dark:text-gray-400">%</span>
                        </div>
                    </div>

                    <div className="sm:col-span-2 pt-2">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="bg-highlight hover:bg-yellow-600 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {isSaving ? 'Salvando...' : 'Salvar Configurações'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
