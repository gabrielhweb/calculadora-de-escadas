import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Product } from '../pages/Purchases/ProductCatalog';

interface ExtraCost {
    id: string; // Unique ID for the cost entry
    productId?: string; // Optional, if picked from catalog
    name: string;
    qty: number;
    unitPrice: number;
    total: number;
    date: string;
}

interface ExtraCostsModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: any; // DashboardItem from ProductionQueue
    onSave: () => void; // Triggered when a cost is added/removed to refresh UI
}

export default function ExtraCostsModal({ isOpen, onClose, item, onSave }: ExtraCostsModalProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [extraCosts, setExtraCosts] = useState<ExtraCost[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Form states
    const [selectedProductId, setSelectedProductId] = useState('');
    const [customName, setCustomName] = useState('');
    const [qty, setQty] = useState('1');
    const [unitPrice, setUnitPrice] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchData();
        }
    }, [isOpen, item]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Products Catalog
            const snapshot = await getDocs(collection(db, 'contracts'));
            const productsData: Product[] = [];
            snapshot.forEach((doc) => {
                const docData = doc.data();
                if (docData.isProduct) {
                    productsData.push({ id: doc.id, ...docData } as Product);
                }
            });
            productsData.sort((a, b) => a.name.localeCompare(b.name));
            setProducts(productsData);

            // Set current extra costs from item
            setExtraCosts(item.originalData?.extraCosts || []);
        } catch (error) {
            console.error("Erro ao buscar dados:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const pId = e.target.value;
        setSelectedProductId(pId);
        
        if (pId) {
            const prod = products.find(p => p.id === pId);
            if (prod) {
                setCustomName(prod.name);
                setUnitPrice(prod.price.toString());
            }
        } else {
            setCustomName('');
            setUnitPrice('');
        }
    };

    const handleAddCost = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const q = parseFloat(qty);
        const p = parseFloat(unitPrice);

        if (!customName.trim() || isNaN(q) || isNaN(p) || q <= 0 || p < 0) {
            alert('Preencha os campos corretamente.');
            return;
        }

        const newCost: ExtraCost = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            productId: selectedProductId || undefined,
            name: customName,
            qty: q,
            unitPrice: p,
            total: q * p,
            date: new Date().toISOString()
        };

        const updatedCosts = [...extraCosts, newCost];
        await saveCostsToDb(updatedCosts);
        
        // Reset form
        setSelectedProductId('');
        setCustomName('');
        setQty('1');
        setUnitPrice('');
    };

    const handleRemoveCost = async (idToRemove: string) => {
        if(!window.confirm('Tem certeza que deseja remover este custo?')) return;
        const updatedCosts = extraCosts.filter(c => c.id !== idToRemove);
        await saveCostsToDb(updatedCosts);
    };

    const saveCostsToDb = async (updatedCosts: ExtraCost[]) => {
        setIsSaving(true);
        try {
            const collectionName = item.source === 'queue' ? 'production_queue' : 'contracts';
            await updateDoc(doc(db, collectionName, item.id), {
                extraCosts: updatedCosts
            });
            
            // Also update the original contract if this is a queue item
            if (item.source === 'queue' && item.originalData.contractId) {
                try {
                    await updateDoc(doc(db, 'contracts', item.originalData.contractId), {
                        extraCosts: updatedCosts
                    });
                } catch(e) {
                    console.warn("Erro ao sincronizar com contrato original:", e);
                }
            }
            
            setExtraCosts(updatedCosts);
            // We need to update the item object directly for local state sync before calling onSave
            item.originalData.extraCosts = updatedCosts; 
            onSave(); // Refresh parent
        } catch (error) {
            console.error("Erro ao salvar custo:", error);
            alert("Erro ao salvar custo extra.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    const totalExtra = extraCosts.reduce((acc, curr) => acc + curr.total, 0);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
            <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Custos Extras da Obra</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.title}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                    {loading ? (
                        <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-highlight"></div></div>
                    ) : (
                        <div className="space-y-8">
                            {/* Form to add */}
                            <form onSubmit={handleAddCost} className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                                <h3 className="font-bold text-gray-800 dark:text-white mb-4 text-sm uppercase tracking-wide">Adicionar Novo Custo</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                                    <div className="sm:col-span-4">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Buscar do Catálogo</label>
                                        <select 
                                            value={selectedProductId}
                                            onChange={handleProductSelect}
                                            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-highlight"
                                        >
                                            <option value="">-- Produto Customizado --</option>
                                            {products.map(p => (
                                                <option key={p.id} value={p.id}>{p.name} (R$ {p.price.toFixed(2)})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="sm:col-span-3">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Nome/Descrição *</label>
                                        <input 
                                            type="text" 
                                            required
                                            value={customName}
                                            onChange={e => setCustomName(e.target.value)}
                                            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-highlight"
                                            placeholder="Ex: Parafuso Parabolt"
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Qtd *</label>
                                        <input 
                                            type="number" 
                                            required min="0.01" step="0.01"
                                            value={qty}
                                            onChange={e => setQty(e.target.value)}
                                            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-highlight"
                                        />
                                    </div>
                                    <div className="sm:col-span-3">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Preço Unit. (R$) *</label>
                                        <input 
                                            type="number" 
                                            required min="0" step="0.01"
                                            value={unitPrice}
                                            onChange={e => setUnitPrice(e.target.value)}
                                            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-highlight"
                                        />
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <button type="submit" disabled={isSaving} className="bg-highlight hover:bg-yellow-600 text-white font-bold py-2 px-6 rounded-lg text-sm transition-colors disabled:opacity-50">
                                        {isSaving ? 'Salvando...' : 'Adicionar Custo'}
                                    </button>
                                </div>
                            </form>

                            {/* List of costs */}
                            <div>
                                <h3 className="font-bold text-gray-800 dark:text-white mb-4 text-sm uppercase tracking-wide">Custos Lançados</h3>
                                
                                {extraCosts.length === 0 ? (
                                    <p className="text-gray-500 dark:text-gray-400 text-sm italic">Nenhum custo extra lançado para esta obra.</p>
                                ) : (
                                    <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-xs text-gray-500 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-400">
                                                <tr>
                                                    <th className="px-4 py-3">Item</th>
                                                    <th className="px-4 py-3">Data</th>
                                                    <th className="px-4 py-3 text-right">Qtd</th>
                                                    <th className="px-4 py-3 text-right">Unitário</th>
                                                    <th className="px-4 py-3 text-right">Total</th>
                                                    <th className="px-4 py-3"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {extraCosts.map(cost => (
                                                    <tr key={cost.id} className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{cost.name}</td>
                                                        <td className="px-4 py-3 text-gray-500">{new Date(cost.date).toLocaleDateString('pt-BR')}</td>
                                                        <td className="px-4 py-3 text-right">{cost.qty}</td>
                                                        <td className="px-4 py-3 text-gray-500 text-right">R$ {cost.unitPrice.toFixed(2)}</td>
                                                        <td className="px-4 py-3 font-bold text-gray-900 dark:text-white text-right">R$ {cost.total.toFixed(2)}</td>
                                                        <td className="px-4 py-3 text-right">
                                                            <button onClick={() => handleRemoveCost(cost.id)} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20" title="Remover">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                <tr className="bg-gray-50 dark:bg-gray-900/50">
                                                    <td colSpan={4} className="px-4 py-4 text-right font-bold text-gray-700 dark:text-gray-300">TOTAL EXTRAS:</td>
                                                    <td className="px-4 py-4 font-black text-highlight text-base text-right">R$ {totalExtra.toFixed(2)}</td>
                                                    <td></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
