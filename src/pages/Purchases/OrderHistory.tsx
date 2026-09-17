import React, { useState, useEffect } from 'react';
import { useAuth } from '../../components/AuthProvider';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../../firebase';

interface OrderItem {
    id: string;
    name: string;
    code: string;
    price: number;
    quantity: number;
    imageUrl: string;
    supplierId?: string;
    supplierName?: string;
}

interface PurchaseOrder {
    id: string;
    orderId: string;
    date: string;
    status: string;
    totalValue: number;
    requestedBy: string;
    items: OrderItem[];
}

export default function OrderHistory() {
    const { user } = useAuth();
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

    useEffect(() => {
        if (user) fetchOrders();
    }, [user]);

    const fetchOrders = async () => {
        try {
            const q = query(collection(db, 'contracts'), orderBy('date', 'desc'));
            const snapshot = await getDocs(q);
            const data: PurchaseOrder[] = [];
            snapshot.forEach((doc) => {
                const docData = doc.data();
                if (docData.isPurchaseOrder) {
                    data.push({ id: doc.id, ...docData } as PurchaseOrder);
                }
            });
            setOrders(data);
        } catch (error) {
            console.error("Erro ao buscar pedidos", error);
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="max-w-7xl mx-auto p-4 sm:p-6 flex flex-col items-center justify-center h-[50vh]">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Acesso Restrito</h2>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => window.history.back()} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    ← Voltar
                </button>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">🕒 Histórico de Pedidos</h1>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Carregando histórico...</div>
                ) : orders.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">Nenhum pedido de compra realizado ainda.</div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {orders.map(order => (
                            <div key={order.id} className="p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-lg font-bold text-gray-800 dark:text-white">{order.orderId}</h3>
                                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                                {order.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {new Date(order.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} • Solicitado por: {order.requestedBy}
                                        </p>
                                    </div>
                                    
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs font-bold">Total</p>
                                            <p className="text-xl font-bold text-gray-800 dark:text-white">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.totalValue)}
                                            </p>
                                        </div>
                                        <button 
                                            onClick={() => window.open(`/compras/imprimir/${order.id}`, '_blank')}
                                            className="text-gray-600 hover:text-gray-800 font-medium text-sm mr-4"
                                        >
                                            🖨️ Imprimir
                                        </button>
                                        <button 
                                            onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                                            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                                        >
                                            {expandedOrderId === order.id ? 'Ocultar Itens' : 'Ver Itens'}
                                        </button>
                                    </div>
                                </div>

                                {expandedOrderId === order.id && (
                                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Itens Solicitados ({order.items.length})</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded border border-gray-100 dark:border-gray-600">
                                                    {item.imageUrl ? (
                                                        <img src={item.imageUrl} alt={item.name} className="w-10 h-10 object-cover rounded" />
                                                    ) : (
                                                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center text-[10px] text-gray-500">S/F</div>
                                                    )}
                                                    <div className="flex-1">
                                                        <p className="font-bold text-gray-800 dark:text-white text-sm leading-tight">{item.name}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {item.quantity}x {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                                                        </p>
                                                        {item.supplierName && (
                                                            <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium mt-1">
                                                                🏭 {item.supplierName}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="font-bold text-gray-800 dark:text-white text-sm">
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.quantity * item.price)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
