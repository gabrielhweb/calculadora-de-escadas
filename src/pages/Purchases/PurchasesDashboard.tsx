import React from 'react';
import { useAuth } from '../../components/AuthProvider';
import { Link } from 'react-router-dom';

export default function PurchasesDashboard() {
    const { user } = useAuth();

    if (!user) {
        return (
            <div className="max-w-7xl mx-auto p-4 sm:p-6 flex flex-col items-center justify-center h-[50vh]">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Acesso Restrito</h2>
                <p className="text-gray-500 dark:text-gray-400 text-center">
                    Você precisa fazer login para acessar e gerenciar pedidos de compra na nuvem.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 pb-24">
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
                        Cadastre ou edite as matérias-primas e preços
                    </p>
                </Link>

                <Link to="/compras/fornecedores" className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow group">
                    <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <span className="text-2xl">🏢</span>
                    </div>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white">Fornecedores</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                        Gerencie as lojas onde você compra o material
                    </p>
                </Link>

                <Link to="/compras/novo-pedido" className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow group">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <span className="text-2xl">🛒</span>
                    </div>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white">Novo Pedido</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                        Crie uma lista de compras para a fábrica
                    </p>
                </Link>

                <Link to="/compras/historico" className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow group">
                    <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <span className="text-2xl">🕰️</span>
                    </div>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white">Histórico de Pedidos</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                        Consulte os últimos pedidos de material feitos
                    </p>
                </Link>
            </div>
        </div>
    );
}
