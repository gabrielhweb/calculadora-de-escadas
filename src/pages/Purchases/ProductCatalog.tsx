import React, { useState, useEffect, useRef } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import Papa from 'papaparse';
import { Supplier } from './SupplierCatalog';

export interface Product {
    id: string;
    name: string;
    code?: string;
    price: number;
    imageUrl?: string;
    supplierId?: string;
    supplierName?: string;
}

export default function ProductCatalog() {
    const [products, setProducts] = useState<Product[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [price, setPrice] = useState('');
    const [supplierId, setSupplierId] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchData = async () => {
        try {
            const snapshot = await getDocs(collection(db, 'contracts'));
            const productsData: Product[] = [];
            const suppliersData: Supplier[] = [];
            
            snapshot.forEach((doc) => {
                const docData = doc.data();
                if (docData.isProduct) {
                    productsData.push({ id: doc.id, ...docData } as Product);
                }
                if (docData.isSupplier) {
                    suppliersData.push({ id: doc.id, ...docData } as Supplier);
                }
            });
            
            productsData.sort((a, b) => a.name.localeCompare(b.name));
            suppliersData.sort((a, b) => a.name.localeCompare(b.name));
            
            setProducts(productsData);
            setSuppliers(suppliersData);
        } catch (error) {
            console.error("Erro ao buscar dados", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 300;
                    const MAX_HEIGHT = 300;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    
                    const base64String = canvas.toDataURL('image/jpeg', 0.7);
                    setImageFile(null); 
                    setImagePreview(base64String);
                };
                img.src = event.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    const handleClearImage = () => {
        setImageFile(null);
        setImagePreview('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!name || !price) {
            alert('Preencha pelo menos o Nome e o Valor.');
            return;
        }

        setIsSaving(true);
        try {
            const numPrice = parseFloat(price.replace(',', '.')) || 0;
            const supplier = suppliers.find(s => s.id === supplierId);
            
            const productData: any = {
                name,
                code: code || '',
                price: numPrice,
                imageUrl: imagePreview,
                supplierId: supplierId || null,
                supplierName: supplier ? supplier.name : null,
                isProduct: true,
                updatedAt: new Date()
            };

            if (editingId) {
                await updateDoc(doc(db, 'contracts', editingId), productData);
                alert('Produto atualizado com sucesso!');
            } else {
                await addDoc(collection(db, 'contracts'), { ...productData, createdAt: new Date() });
                alert('Produto cadastrado com sucesso!');
            }

            resetForm();
            fetchData();
        } catch (error: any) {
            console.error('Erro ao salvar produto:', error);
            alert('Erro ao salvar o produto: ' + (error.message || 'Erro desconhecido'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (product: Product) => {
        setEditingId(product.id);
        setName(product.name);
        setCode(product.code || '');
        setPrice(product.price.toString());
        setSupplierId(product.supplierId || '');
        setImagePreview(product.imageUrl || '');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja excluir este produto?')) return;
        try {
            await deleteDoc(doc(db, 'contracts', id));
            fetchData();
        } catch (error: any) {
            console.error(error);
            alert('Erro ao excluir produto: ' + error.message);
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setName('');
        setCode('');
        setPrice('');
        setSupplierId('');
        handleClearImage();
    };

    const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                setIsSaving(true);
                try {
                    let importedCount = 0;
                    for (const row of results.data as any[]) {
                        const rowName = row['Nome'] || row['nome'] || row['Name'];
                        const rowCode = row['Código'] || row['codigo'] || row['Code'] || '';
                        let rowPrice = row['Valor'] || row['valor'] || row['Preço'] || row['Price'] || '0';
                        
                        if (rowName && rowPrice) {
                            if (typeof rowPrice === 'string') {
                                rowPrice = rowPrice.replace('R$', '').trim().replace(',', '.');
                            }
                            const numericPrice = parseFloat(rowPrice);
                            
                            if (numericPrice > 0) {
                                await addDoc(collection(db, 'contracts'), {
                                    name: rowName,
                                    code: rowCode,
                                    price: numericPrice,
                                    imageUrl: '',
                                    supplierId: null,
                                    supplierName: null,
                                    createdAt: new Date(),
                                    isProduct: true
                                });
                                importedCount++;
                            }
                        }
                    }
                    alert(`${importedCount} produtos importados com sucesso!`);
                    fetchData();
                } catch (err: any) {
                    console.error('Erro na importação CSV', err);
                    alert('Erro ao importar: ' + err.message);
                } finally {
                    setIsSaving(false);
                    e.target.value = '';
                }
            }
        });
    };

    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto pb-24">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <button onClick={() => window.history.back()} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        ← Voltar
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">📋 Catálogo de Produtos (v2)</h1>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                    <label className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded font-bold cursor-pointer transition-colors text-center text-sm">
                        Importar Planilha CSV
                        <input type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
                    </label>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Formulário */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-fit">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                        {editingId ? 'Editar Produto' : 'Novo Produto'}
                    </h2>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Foto do Produto (Opcional)</label>
                            {!imagePreview ? (
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    ref={fileInputRef}
                                    onChange={handleImageChange}
                                    className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400"
                                />
                            ) : (
                                <div className="mt-2 relative inline-block">
                                    <img src={imagePreview} alt="Preview" className="h-32 object-cover rounded border border-gray-200" />
                                    <button 
                                        type="button" 
                                        onClick={handleClearImage}
                                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow"
                                        title="Remover imagem"
                                    >
                                        ×
                                    </button>
                                </div>
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

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fornecedor Preferencial</label>
                            <select
                                value={supplierId}
                                onChange={e => setSupplierId(e.target.value)}
                                className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                                <option value="">Sem fornecedor específico</option>
                                {suppliers.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
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
                                {isSaving ? 'Salvando...' : (editingId ? 'Salvar Alterações' : 'Cadastrar Produto')}
                            </button>
                        </div>
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
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm">
                                            <th className="p-3">Imagem</th>
                                            <th className="p-3">Produto</th>
                                            <th className="p-3">Fornecedor</th>
                                            <th className="p-3">Valor</th>
                                            <th className="p-3">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.map(p => (
                                            <tr key={p.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                <td className="p-3 w-16">
                                                    {p.imageUrl ? (
                                                        <img 
                                                            src={p.imageUrl} 
                                                            alt={p.name} 
                                                            className="w-12 h-12 object-cover rounded" 
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).style.display = 'none';
                                                                const fallback = document.createElement('div');
                                                                fallback.className = "w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center text-xs text-gray-500";
                                                                fallback.innerText = "Erro img";
                                                                (e.target as HTMLImageElement).parentNode?.appendChild(fallback);
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center text-[10px] text-gray-500 leading-tight text-center px-1">Sem<br/>Foto</div>
                                                    )}
                                                </td>
                                                <td className="p-3">
                                                    <div className="font-medium text-gray-800 dark:text-gray-200">{p.name}</div>
                                                    {p.code && <div className="font-mono text-xs text-gray-500">{p.code}</div>}
                                                </td>
                                                <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                                                    {p.supplierName || '-'}
                                                </td>
                                                <td className="p-3 font-medium text-gray-700 dark:text-gray-300">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.price)}
                                                </td>
                                                <td className="p-3 whitespace-nowrap">
                                                    <button onClick={() => handleEdit(p)} className="text-orange-500 hover:text-orange-700 text-sm font-medium mr-3">
                                                        Editar
                                                    </button>
                                                    <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">
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
