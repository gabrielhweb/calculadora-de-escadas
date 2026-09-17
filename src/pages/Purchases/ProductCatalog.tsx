import React, { useState, useEffect } from 'react';
import { useAuth } from '../../components/AuthProvider';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';

export interface Product {
    id: string;
    name: string;
    code: string;
    price: number;
    imageUrl: string;
}

export default function ProductCatalog() {
    const { user } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [price, setPrice] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');

    useEffect(() => {
        if (user) fetchProducts();
    }, [user]);

    const fetchProducts = async () => {
        try {
            const snapshot = await getDocs(collection(db, 'products'));
            const data: Product[] = [];
            snapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() } as Product);
            });
            setProducts(data);
        } catch (error) {
            console.error("Erro ao buscar produtos", error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !price) {
            alert('Preencha pelo menos o Nome e o Valor.');
            return;
        }

        setIsSaving(true);
        try {
            let imageUrl = '';
            if (imageFile) {
                const storageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
                const snapshot = await uploadBytes(storageRef, imageFile);
                imageUrl = await getDownloadURL(snapshot.ref);
            }

            const newProduct = {
                name,
                code: code || '',
                price: parseFloat(price.replace(',', '.')) || 0,
                imageUrl,
                createdAt: new Date()
            };

            await addDoc(collection(db, 'products'), newProduct);
            
            // Reset form
            setName('');
            setCode('');
            setPrice('');
            setImageFile(null);
            setImagePreview('');
            
            await fetchProducts();
            alert('Produto cadastrado com sucesso!');
        } catch (error) {
            console.error(error);
            alert('Erro ao cadastrar produto.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja deletar este produto?')) return;
        try {
            await deleteDoc(doc(db, 'products', id));
            setProducts(products.filter(p => p.id !== id));
        } catch (error) {
            alert('Erro ao deletar produto.');
        }
    };

    if (!user) {
        return (
            <div className="max-w-7xl mx-auto p-4 sm:p-6 flex flex-col items-center justify-center h-[50vh]">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Acesso Restrito</h2>
                <p className="text-gray-500 dark:text-gray-400">Faça login para gerenciar produtos.</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => window.history.back()} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    ← Voltar
                </button>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">📋 Catálogo de Produtos</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Formulário */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Novo Produto</h2>
                    <form onSubmit={handleAddProduct} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Foto da Matéria Prima</label>
                            <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleImageChange}
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-700 dark:file:text-gray-200"
                            />
                            {imagePreview && (
                                <img src={imagePreview} alt="Preview" className="mt-2 h-32 object-cover rounded border border-gray-200" />
                            )}
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Produto *</label>
                            <input 
                                type="text" 
                                required
                                value={name} 
                                onChange={e => setName(e.target.value)}
                                className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="Ex: Chapa de Aço 3mm"
                            />
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Código (Opcional)</label>
                                <input 
                                    type="text" 
                                    value={code} 
                                    onChange={e => setCode(e.target.value)}
                                    className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="Ex: CH-001"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor Unitário *</label>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    required
                                    value={price} 
                                    onChange={e => setPrice(e.target.value)}
                                    className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="R$ 0,00"
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isSaving}
                            className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isSaving ? 'Salvando...' : 'Cadastrar Produto'}
                        </button>
                    </form>
                </div>

                {/* Lista de Produtos */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        {loading ? (
                            <div className="p-8 text-center text-gray-500">Carregando catálogo...</div>
                        ) : products.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">Nenhum produto cadastrado.</div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm">
                                        <th className="p-3">Imagem</th>
                                        <th className="p-3">Código</th>
                                        <th className="p-3">Produto</th>
                                        <th className="p-3">Valor</th>
                                        <th className="p-3">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map(p => (
                                        <tr key={p.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="p-3">
                                                {p.imageUrl ? (
                                                    <img src={p.imageUrl} alt={p.name} className="w-12 h-12 object-cover rounded" />
                                                ) : (
                                                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center text-xs text-gray-500">Sem Foto</div>
                                                )}
                                            </td>
                                            <td className="p-3 font-mono text-xs text-gray-500 dark:text-gray-400">{p.code || '-'}</td>
                                            <td className="p-3 font-medium text-gray-800 dark:text-gray-200">{p.name}</td>
                                            <td className="p-3 text-gray-600 dark:text-gray-300">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.price)}
                                            </td>
                                            <td className="p-3">
                                                <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">
                                                    Excluir
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
