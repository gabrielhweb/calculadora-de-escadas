import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { ProductionOrder } from '../types';
import { formatCurrencyBRL } from '../utils';
import { useAuth } from '../components/AuthProvider';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  alert(`Erro ao salvar no banco de dados: ${errInfo.error}`);
  throw new Error(JSON.stringify(errInfo));
}

const calculateLateFee = (deliveryDate: string, openBalance: number) => {
    if (!deliveryDate || openBalance <= 0) return null;
    
    const [year, month, day] = deliveryDate.split('-').map(Number);
    if (!year || !month || !day) return null;
    
    const delivery = new Date(year, month - 1, day);
    const today = new Date();
    
    delivery.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const dueDate = new Date(delivery);
    dueDate.setDate(dueDate.getDate() + 2);
    
    if (today > dueDate) {
        const diffTime = Math.abs(today.getTime() - dueDate.getTime());
        const daysLate = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        const fine = openBalance * 0.04;
        const interest = openBalance * (0.01 / 30) * daysLate;
        
        return {
            isLate: true,
            fine,
            interest,
            totalLateFee: fine + interest,
            totalWithLateFee: openBalance + fine + interest,
            daysLate
        };
    }
    
    return null;
};

export default function ProductionQueue() {
    const [orders, setOrders] = useState<ProductionOrder[]>([]);
    const { user } = useAuth();

    useEffect(() => {
        if (!user) return;
        
        // Fetch only active orders in the queue
        const q = query(collection(db, 'production_queue'), where('status', '==', 'in_queue'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loaded: ProductionOrder[] = [];
            snapshot.forEach(doc => loaded.push({ id: doc.id, ...doc.data() } as ProductionOrder));
            
            // Sort by creation date (FIFO)
            loaded.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            setOrders(loaded);
        }, (error) => {
            handleFirestoreError(error, OperationType.LIST, 'production_queue');
        });
        
        return () => unsubscribe();
    }, [user]);

    const handleComplete = async (id: string, clientName: string) => {
        if(window.confirm(`Confirmar a entrega e dar baixa no pedido de ${clientName}?`)) {
            try {
                await updateDoc(doc(db, 'production_queue', id), { status: 'completed' });
            } catch (error) {
                handleFirestoreError(error, OperationType.UPDATE, `production_queue/${id}`);
            }
        }
    };

    const deleteOrder = async (id: string, contractId: string | undefined, clientName: string) => {
        if (window.confirm(`Tem certeza que deseja excluir o pedido de ${clientName} da fila de produção? Isso também excluirá o contrato associado.`)) {
            try {
                // Excluir da fila de produção
                await deleteDoc(doc(db, 'production_queue', id));
                
                // Excluir o contrato associado
                if (contractId) {
                    await deleteDoc(doc(db, 'contracts', contractId));
                }
            } catch (error) {
                handleFirestoreError(error, OperationType.DELETE, `production_queue/${id}`);
            }
        }
    };

    const togglePaymentStatus = async (id: string, field: 'downPaymentStatus' | 'balanceStatus', currentStatus: string | undefined) => {
        const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
        try {
            await updateDoc(doc(db, 'production_queue', id), { [field]: newStatus });
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, `production_queue/${id}`);
        }
    };

    const updateInstallments = async (id: string, currentPaid: number, totalInstallments: number, increment: boolean) => {
        let newPaid = increment ? currentPaid + 1 : currentPaid - 1;
        if (newPaid < 0) newPaid = 0;
        if (newPaid > totalInstallments) newPaid = totalInstallments;
        
        try {
            await updateDoc(doc(db, 'production_queue', id), { paidInstallments: newPaid });
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, `production_queue/${id}`);
        }
    };

    if (!user) {
        return (
            <div className="max-w-7xl mx-auto p-4 sm:p-6 flex flex-col items-center justify-center h-[50vh]">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Acesso Restrito</h2>
                <p className="text-gray-500 dark:text-gray-400 text-center">
                    Você precisa fazer login com um e-mail autorizado para acessar a Fila de Produção.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-highlight" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Fila de Produção
                </h1>
                <span className="bg-highlight text-white px-3 py-1 rounded-full text-sm font-bold">
                    {orders.length} pedido{orders.length !== 1 ? 's' : ''} na fila
                </span>
            </div>

            {orders.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
                    <p className="text-gray-500 dark:text-gray-400 text-lg">A fila de produção está vazia no momento.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order, index) => {
                        // Cálculos de parcelamento
                        const hasInstallments = (order.paymentMethod === 'card' || order.paymentMethod === 'hybrid') && (order.installments || 1) > 1;
                        
                        // Determina qual valor está parcelado
                        let installmentBaseValue = order.balanceDue;
                        if (order.paymentMethod === 'hybrid' && order.pixTiming === 'delivery') {
                            installmentBaseValue = order.downPayment; // Se PIX é na entrega, o cartão (parcelado) foi o sinal
                        }

                        const installmentValue = hasInstallments ? installmentBaseValue / (order.installments || 1) : 0;
                        const totalPaidInstallments = installmentValue * (order.paidInstallments || 0);
                        const totalRemainingInstallments = installmentBaseValue - totalPaidInstallments;

                        let openBalance = 0;
                        const isInstallmentBalance = hasInstallments && (order.paymentMethod === 'card' || (order.paymentMethod === 'hybrid' && order.pixTiming !== 'delivery'));
                        
                        if (isInstallmentBalance) {
                            if ((order.paidInstallments || 0) < (order.installments || 1)) {
                                openBalance = totalRemainingInstallments;
                            }
                        } else {
                            if (order.balanceStatus !== 'paid') {
                                openBalance = order.balanceDue;
                            }
                        }

                        const lateFeeInfo = openBalance > 0 ? calculateLateFee(order.deliveryDate, openBalance) : null;

                        return (
                        <div key={order.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:shadow-md">
                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                <div className="flex-shrink-0 w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-xl font-black text-highlight border-2 border-highlight">
                                    {index + 1}º
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{order.clientName}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        Entrega: <span className="font-semibold text-gray-700 dark:text-gray-300">{order.deliveryDate || 'Não definida'}</span>
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 w-full sm:w-auto bg-gray-50 dark:bg-gray-750 p-3 sm:p-0 rounded-lg sm:bg-transparent">
                                {order.paymentMethod !== 'card' && (
                                    <div className="flex flex-col items-start">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Sinal</p>
                                        <p className="font-bold text-gray-800 dark:text-gray-200">{formatCurrencyBRL(order.downPayment)}</p>
                                        
                                        {/* Se o sinal for parcelado, mostra os controles aqui */}
                                        {hasInstallments && order.paymentMethod === 'hybrid' && order.pixTiming === 'delivery' ? (
                                            <div className="flex flex-col items-start mt-1">
                                                <div className="flex items-center gap-2">
                                                    <button 
                                                        onClick={() => updateInstallments(order.id, order.paidInstallments || 0, order.installments || 1, false)}
                                                        className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500 font-bold"
                                                        disabled={(order.paidInstallments || 0) <= 0}
                                                    >
                                                        -
                                                    </button>
                                                    <span className="font-bold text-gray-800 dark:text-gray-200 min-w-[3rem] text-center text-sm">
                                                        {order.paidInstallments || 0} / {order.installments || 1}
                                                    </span>
                                                    <button 
                                                        onClick={() => updateInstallments(order.id, order.paidInstallments || 0, order.installments || 1, true)}
                                                        className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500 font-bold"
                                                        disabled={(order.paidInstallments || 0) >= (order.installments || 1)}
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                                
                                                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                                                    <p>Parcela: <span className="font-semibold text-gray-700 dark:text-gray-300">{formatCurrencyBRL(installmentValue)}</span></p>
                                                    <p>Pago: <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrencyBRL(totalPaidInstallments)}</span></p>
                                                    <p>Falta: <span className="font-semibold text-orange-600 dark:text-orange-400">{formatCurrencyBRL(totalRemainingInstallments)}</span></p>
                                                </div>

                                                {(order.paidInstallments || 0) >= (order.installments || 1) && (
                                                    <span className="mt-2 text-xs font-bold text-green-600 dark:text-green-400 flex items-center gap-1">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        Quitado
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => togglePaymentStatus(order.id, 'downPaymentStatus', order.downPaymentStatus)}
                                                className={`mt-1 text-xs font-bold px-2 py-1 rounded-full transition-colors ${order.downPaymentStatus === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/50'}`}
                                            >
                                                {order.downPaymentStatus === 'paid' ? '✅ Pago' : '⏳ Pendente'}
                                            </button>
                                        )}
                                    </div>
                                )}

                                <div className="flex flex-col items-start">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">
                                        {order.paymentMethod === 'card' ? 'Valor Total' : 'Saldo a Receber'}
                                    </p>
                                    
                                    {order.balanceDue <= 0 ? (
                                        <p className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Quitado
                                        </p>
                                    ) : (
                                        <>
                                            <p className="font-bold text-gray-800 dark:text-gray-200">{formatCurrencyBRL(order.balanceDue)}</p>
                                            
                                            {hasInstallments && (order.paymentMethod === 'card' || (order.paymentMethod === 'hybrid' && order.pixTiming !== 'delivery')) ? (
                                                <div className="flex flex-col items-start mt-1">
                                                    <div className="flex items-center gap-2">
                                                        <button 
                                                            onClick={() => updateInstallments(order.id, order.paidInstallments || 0, order.installments || 1, false)}
                                                            className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500 font-bold"
                                                            disabled={(order.paidInstallments || 0) <= 0}
                                                        >
                                                            -
                                                        </button>
                                                        <span className="font-bold text-gray-800 dark:text-gray-200 min-w-[3rem] text-center text-sm">
                                                            {order.paidInstallments || 0} / {order.installments || 1}
                                                        </span>
                                                        <button 
                                                            onClick={() => updateInstallments(order.id, order.paidInstallments || 0, order.installments || 1, true)}
                                                            className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500 font-bold"
                                                            disabled={(order.paidInstallments || 0) >= (order.installments || 1)}
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                    
                                                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                                                        <p>Parcela: <span className="font-semibold text-gray-700 dark:text-gray-300">{formatCurrencyBRL(installmentValue)}</span></p>
                                                        <p>Pago: <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrencyBRL(totalPaidInstallments)}</span></p>
                                                        <p>Falta: <span className="font-semibold text-orange-600 dark:text-orange-400">{formatCurrencyBRL(totalRemainingInstallments)}</span></p>
                                                    </div>

                                                    {(order.paidInstallments || 0) >= (order.installments || 1) && (
                                                        <span className="mt-2 text-xs font-bold text-green-600 dark:text-green-400 flex items-center gap-1">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            Quitado
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => togglePaymentStatus(order.id, 'balanceStatus', order.balanceStatus)}
                                                    className={`mt-1 text-xs font-bold px-2 py-1 rounded-full transition-colors ${order.balanceStatus === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/50'}`}
                                                >
                                                    {order.balanceStatus === 'paid' ? '✅ Pago' : '⏳ Pendente'}
                                                </button>
                                            )}
                                            
                                            {lateFeeInfo && (
                                                <div className="mt-2 text-xs bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-2 rounded-lg border border-red-100 dark:border-red-900/50">
                                                    <p className="font-bold flex items-center gap-1">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        Atraso: {lateFeeInfo.daysLate} dia(s)
                                                    </p>
                                                    <div className="mt-1 space-y-0.5">
                                                        <p>Multa (4%): {formatCurrencyBRL(lateFeeInfo.fine)}</p>
                                                        <p>Juros: {formatCurrencyBRL(lateFeeInfo.interest)}</p>
                                                        <p className="font-bold pt-1 border-t border-red-200 dark:border-red-800/50 mt-1">
                                                            Total a cobrar: {formatCurrencyBRL(lateFeeInfo.totalWithLateFee)}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                    <button 
                                        onClick={() => handleComplete(order.id, order.clientName)}
                                        className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Dar Baixa
                                    </button>
                                    <button 
                                        onClick={() => deleteOrder(order.id, order.contractId, order.clientName)}
                                        className="w-full sm:w-auto bg-red-100 hover:bg-red-200 text-red-600 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 px-4 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Excluir
                                    </button>
                                </div>
                            </div>
                        </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
