import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
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

export default function PrintOrder() {
    const { id } = useParams<{ id: string }>();
    const [order, setOrder] = useState<PurchaseOrder | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        const fetchOrder = async () => {
            try {
                const docRef = doc(db, 'contracts', id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setOrder({ id: docSnap.id, ...docSnap.data() } as PurchaseOrder);
                }
            } catch (err) {
                console.error("Erro ao carregar pedido para impressao", err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [id]);

    useEffect(() => {
        if (!loading && order) {
            // Pequeno delay para garantir que as imagens carregaram no DOM
            setTimeout(() => {
                window.print();
            }, 500);
        }
    }, [loading, order]);

    if (loading) {
        return <div className="p-10 text-center font-bold">Carregando pedido...</div>;
    }

    if (!order) {
        return <div className="p-10 text-center text-red-500 font-bold">Pedido não encontrado.</div>;
    }

    // Agrupar itens por fornecedor
    const groupedItems = order.items.reduce((acc, item) => {
        const supplierName = item.supplierName || 'Sem Fornecedor Específico';
        if (!acc[supplierName]) {
            acc[supplierName] = [];
        }
        acc[supplierName].push(item);
        return acc;
    }, {} as Record<string, OrderItem[]>);

    return (
        <div className="bg-white text-black min-h-screen p-8 max-w-4xl mx-auto print:p-0 print:m-0" style={{ fontFamily: 'sans-serif' }}>
            {/* Ocultar botões na impressão */}
            <div className="mb-6 print:hidden">
                <button onClick={() => window.print()} className="bg-blue-600 text-white px-4 py-2 rounded font-bold mr-2">
                    🖨️ Imprimir Novamente
                </button>
                <button onClick={() => window.close()} className="bg-gray-200 text-gray-800 px-4 py-2 rounded font-bold">
                    Fechar
                </button>
            </div>

            <div className="text-center mb-8 pb-4 border-b-2 border-gray-800">
                <h1 className="text-3xl font-extrabold uppercase tracking-widest mb-2">Pedido de Material</h1>
                <p className="text-lg">Código do Pedido: <strong>{order.orderId}</strong></p>
                <p className="text-gray-600">
                    Data: {new Date(order.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-gray-600">Solicitante: <strong>{order.requestedBy}</strong></p>
            </div>

            {Object.entries(groupedItems).map(([supplier, items]) => {
                const supplierTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                
                return (
                    <div key={supplier} className="mb-12 print:break-inside-avoid">
                        <div className="bg-gray-100 p-3 mb-4 rounded border border-gray-300 print:bg-gray-100 print:border-gray-400" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                            <h2 className="text-xl font-bold uppercase text-gray-800 flex items-center gap-2">
                                🏢 {supplier}
                            </h2>
                        </div>

                        <table className="w-full text-left border-collapse border border-gray-300">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-300" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                                    <th className="p-2 border-r border-gray-300 w-20">Foto</th>
                                    <th className="p-2 border-r border-gray-300">Produto</th>
                                    <th className="p-2 border-r border-gray-300 text-center w-20">Qtd</th>
                                    <th className="p-2 border-r border-gray-300 text-right w-32">Val. Unit</th>
                                    <th className="p-2 text-right w-32">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, idx) => (
                                    <tr key={idx} className="border-b border-gray-200">
                                        <td className="p-2 border-r border-gray-300 align-middle">
                                            {item.imageUrl ? (
                                                <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover mx-auto rounded border border-gray-200" />
                                            ) : (
                                                <div className="w-16 h-16 bg-gray-100 flex items-center justify-center text-xs text-gray-400 mx-auto border border-gray-200">S/F</div>
                                            )}
                                        </td>
                                        <td className="p-2 border-r border-gray-300 align-middle">
                                            <p className="font-bold text-gray-800">{item.name}</p>
                                            {item.code && <p className="text-xs text-gray-500 font-mono mt-1">Cód: {item.code}</p>}
                                        </td>
                                        <td className="p-2 border-r border-gray-300 text-center align-middle font-bold text-lg">
                                            {item.quantity}
                                        </td>
                                        <td className="p-2 border-r border-gray-300 text-right align-middle text-gray-600">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                                        </td>
                                        <td className="p-2 text-right align-middle font-bold text-gray-800">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.quantity * item.price)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-gray-50" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                                    <td colSpan={4} className="p-3 text-right font-bold border-r border-gray-300">
                                        Subtotal do Fornecedor:
                                    </td>
                                    <td className="p-3 text-right font-bold text-lg">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(supplierTotal)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                        
                        {/* Linha de assinatura para recebimento */}
                        <div className="mt-6 pt-4 border-t border-dashed border-gray-400 w-1/2">
                            <p className="text-xs text-gray-500 text-center uppercase">Assinatura / Recebido em</p>
                        </div>
                    </div>
                );
            })}

            <div className="mt-12 pt-6 border-t-4 border-gray-800 text-right">
                <p className="text-sm text-gray-500 uppercase tracking-widest mb-1">Valor Total do Pedido</p>
                <p className="text-4xl font-extrabold text-black">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.totalValue)}
                </p>
            </div>
        </div>
    );
}
