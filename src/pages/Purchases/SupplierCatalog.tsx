import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';

export interface Supplier {
    id: string;
    name: string;
    phone: string;
    address: string;
    createdAt?: any;
    isSupplier?: boolean;
}

export default function SupplierCatalog() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);

    const fetchSuppliers = async () => {
        try {
            const snapshot = await getDocs(collection(db, 'contracts'));
            const data: Supplier[] = [];
            snapshot.forEach((doc) => {
                const docData = doc.data();
                if (docData.isSupplier) {
                    data.push({ id: doc.id, ...docData } as Supplier);
                }
            });
            // Ordem alfabética
            data.sort((a, b) => a.name.localeCompare(b.name));
            setSuppliers(data);
        } catch (error) {
            console.error("Erro ao buscar fornecedores", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) {
            alert('Preencha pelo menos o Nome do Fornecedor.');
            return;
        }

        setIsSaving(true);
        try {
            const supplierData = {
                name,
                phone: phone || '',
                address: address || '',
                isSupplier: true,
                updatedAt: new Date()
            };

            if (editingId) {
                await updateDoc(doc(db, 'contracts', editingId), supplierData);
                alert('Fornecedor atualizado com sucesso!');
            } else {
                await addDoc(collection(db, 'contracts'), { ...supplierData, createdAt: new Date() });
                alert('Fornecedor cadastrado com sucesso!');
            }
            
            resetForm();
            fetchSuppliers();
        } catch (error: any) {
            console.error(error);
            alert('Erro ao salvar fornecedor: ' + (error.message || 'Erro desconhecido'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (supplier: Supplier) => {
        setEditingId(supplier.id);
        setName(supplier.name);
        setPhone(supplier.phone || '');
        setAddress(supplier.address || '');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja excluir este fornecedor? Produtos vinculados a ele poderão ficar sem referência.')) return;
        try {
            await deleteDoc(doc(db, 'contracts', id));
            fetchSuppliers();
        } catch (error: any) {
            console.error(error);
            alert('Erro ao excluir fornecedor: ' + error.message);
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setName('');
        setPhone('');
        setAddress('');
    };

    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto pb-24">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <button onClick={() => window.history.back()} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        ← Voltar
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">🏢 Fornecedores</h1>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Formulário */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-fit">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                        {editingId ? 'Editar Fornecedor' : 'Novo Fornecedor'}
                    </h2>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Fornecedor *</label>
                            <input 
                                type="text" 
                                required
                                value={name} 
                                onChange={e => setName(e.target.value)}
                                className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="Ex: Metalúrgica Silva"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefone (WhatsApp)</label>
                            <input 
                                type="text" 
                                value={phone} 
                                onChange={e => setPhone(e.target.value)}
                                className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="Ex: (41) 99999-9999"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Endereço</label>
                            <textarea 
                                value={address} 
                                onChange={e => setAddress(e.target.value)}
                                className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
                                placeholder="Ex: Rua das Indústrias, 123"
                                rows={2}
                            />
                        </div>

                        <div className="flex gap-2 pt-2">
                            {editingId && (
                                <button 
                                    type="button" 
                                    onClick={resetForm}
                                    className="flex-1 bg-gray-500 text-white font-bold py-2 rounded hover:bg-gray-600"
                                >
                                    Cancelar
                                </button>
                            )}
                            <button 
                                type="submit" 
                                disabled={isSaving}
                                className={`flex-[2] text-white font-bold py-2 rounded disabled:opacity-50 ${editingId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                            >
                                {isSaving ? 'Salvando...' : (editingId ? 'Salvar Alterações' : 'Cadastrar Fornecedor')}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Lista */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        {loading ? (
                            <div className="p-8 text-center text-gray-500">Carregando fornecedores...</div>
                        ) : suppliers.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">Nenhum fornecedor cadastrado.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm">
                                            <th className="p-3">Nome</th>
                                            <th className="p-3">Telefone</th>
                                            <th className="p-3">Endereço</th>
                                            <th className="p-3">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {suppliers.map(s => (
                                            <tr key={s.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                <td className="p-3 font-medium text-gray-800 dark:text-gray-200">{s.name}</td>
                                                <td className="p-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{s.phone || '-'}</td>
                                                <td className="p-3 text-gray-600 dark:text-gray-300 text-sm">{s.address || '-'}</td>
                                                <td className="p-3 whitespace-nowrap">
                                                    <button onClick={() => handleEdit(s)} className="text-orange-500 hover:text-orange-700 text-sm font-medium mr-3">
                                                        Editar
                                                    </button>
                                                    <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">
                                                        Excluir
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
