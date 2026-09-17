import React, { useState, useEffect } from 'react';
import { useAuth } from '../../components/AuthProvider';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Product } from './ProductCatalog';
import { useNavigate } from 'react-router-dom';

interface CartItem extends Product {
    quantity: number;
}

export default function NewOrder() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user) fetchProducts();
    }, [user]);

    const fetchProducts = async () => {
        try {
            const snapshot = await getDocs(collection(db, 'contracts'));
            const data: Product[] = [];
            snapshot.forEach((doc) => {
                const docData = doc.data();
                if (docData.isProduct) {
                    data.push({ id: doc.id, ...docData } as Product);
                }
            });
            setProducts(data);
        } catch (error) {
            console.error("Erro ao buscar produtos", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = (product: Product) => {
        const existing = cart.find(item => item.id === product.id);
        if (existing) {
            setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
        } else {
            setCart([...cart, { ...product, quantity: 1 }]);
        }
        setSearchTerm(''); // Clear search after adding
    };

    const handleUpdateQuantity = (id: string, newQuantity: number) => {
        if (newQuantity < 1) return;
        setCart(cart.map(item => item.id === id ? { ...item, quantity: newQuantity } : item));
    };

    const handleRemoveFromCart = (id: string) => {
        setCart(cart.filter(item => item.id !== id));
    };

    const handleFinalizeOrder = async () => {
        if (cart.length === 0) {
            alert('Adicione pelo menos um item ao pedido.');
            return;
        }
        setIsSaving(true);
        try {
            const totalValue = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
            
            const newOrder = {
                orderId: `PED-${Date.now().toString().slice(-6)}`,
                date: new Date().toISOString(),
                status: 'Pendente',
                totalValue,
                requestedBy: user?.email || 'Usuário',
                items: cart.map(item => ({
                    id: item.id,
                    name: item.name,
                    code: item.code || '',
                    price: item.price,
                    quantity: item.quantity,
                    imageUrl: item.imageUrl || ''
                })),
                isPurchaseOrder: true
            };

            await addDoc(collection(db, 'contracts'), newOrder);
            alert('Pedido gerado com sucesso!');
            setCart([]);
            navigate('/compras/historico');
        } catch (error) {
            console.error('Erro ao salvar pedido:', error);
            alert('Erro ao salvar o pedido.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!user) {
        return (
            <div className="max-w-7xl mx-auto p-4 sm:p-6 flex flex-col items-center justify-center h-[50vh]">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Acesso Restrito</h2>
            </div>
        );
    }

    const filteredProducts = searchTerm.trim() 
        ? products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.code && p.code.toLowerCase().includes(searchTerm.toLowerCase())))
        : [];

    const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => window.history.back()} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    ← Voltar
                </button>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">🛒 Novo Pedido de Compra</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Lado Esquerdo: Busca */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-fit">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Buscar Matéria Prima</h2>
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Digite o nome ou código do produto..."
                        className="w-full p-3 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />

                    {loading && <p className="mt-4 text-gray-500">Carregando catálogo...</p>}

                    {searchTerm && (
                        <div className="mt-4 border dark:border-gray-600 rounded max-h-96 overflow-y-auto">
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map(p => (
                                    <div key={p.id} className="flex items-center justify-between p-3 border-b dark:border-gray-600 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <div className="flex items-center gap-3">
                                            {p.imageUrl ? (
                                                <img src={p.imageUrl} alt={p.name} className="w-10 h-10 object-cover rounded" />
                                            ) : (
                                                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center text-[10px] text-gray-500">S/F</div>
                                            )}
                                            <div>
                                                <p className="font-bold text-gray-800 dark:text-white">{p.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {p.code ? `${p.code} - ` : ''}
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.price)}
                                                </p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleAddToCart(p)}
                                            className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 rounded font-bold text-sm transition-colors"
                                        >
                                            Adicionar
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="p-4 text-gray-500 text-center text-sm">Nenhum produto encontrado.</div>
                            )}
                        </div>
                    )}
                </div>

                {/* Lado Direito: Carrinho */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-[70vh]">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Itens do Pedido</h2>
                    
                    <div className="flex-1 overflow-y-auto pr-2">
                        {cart.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <span className="text-4xl mb-2">🛒</span>
                                <p>O carrinho está vazio</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {cart.map(item => (
                                    <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg gap-3">
                                        <div className="flex items-center gap-3 w-full sm:w-auto">
                                            {item.imageUrl ? (
                                                <img src={item.imageUrl} alt={item.name} className="w-12 h-12 object-cover rounded hidden sm:block" />
                                            ) : null}
                                            <div>
                                                <p className="font-bold text-gray-800 dark:text-white leading-tight">{item.name}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)} un.
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                                            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded">
                                                <button onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)} className="px-3 py-1 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-gray-600 rounded-l">-</button>
                                                <span className="px-3 py-1 font-bold dark:text-white">{item.quantity}</span>
                                                <button onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)} className="px-3 py-1 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-gray-600 rounded-r">+</button>
                                            </div>
                                            
                                            <div className="text-right min-w-[80px]">
                                                <p className="font-bold text-gray-800 dark:text-white">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price * item.quantity)}
                                                </p>
                                            </div>

                                            <button onClick={() => handleRemoveFromCart(item.id)} className="text-red-400 hover:text-red-600 p-1">
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-end mb-4">
                            <span className="text-gray-500 dark:text-gray-400 uppercase tracking-wider text-sm font-bold">Total do Pedido</span>
                            <span className="text-3xl font-bold text-gray-800 dark:text-white">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cartTotal)}
                            </span>
                        </div>
                        <button 
                            onClick={handleFinalizeOrder}
                            disabled={cart.length === 0 || isSaving}
                            className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg"
                        >
                            {isSaving ? 'Gerando Pedido...' : 'Finalizar Pedido'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
