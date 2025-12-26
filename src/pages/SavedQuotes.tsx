
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getQuotes, deleteQuote } from '../services/storage';
import { supabase } from '../services/supabaseClient';
import { SavedQuote } from '../types';

const SavedQuotes: React.FC = () => {
    const [quotes, setQuotes] = useState<SavedQuote[]>([]);
    const [loading, setLoading] = useState(true);
    const [connectionType, setConnectionType] = useState<'cloud' | 'local'>('local');
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Verifica se o Supabase está ativo
        if (supabase) {
            setConnectionType('cloud');
        } else {
            setConnectionType('local');
        }
        loadQuotes();
    }, []);

    const loadQuotes = async () => {
        setLoading(true);
        const data = await getQuotes();
        setQuotes(data);
        setLoading(false);
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm("Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita.")) {
            await deleteQuote(id);
            loadQuotes();
        }
    };

    const handleRestore = (quote: SavedQuote) => {
        navigate('/calculadora', { state: { restoreData: quote } });
    };

    // --- EXPORTAR ---
    const handleExport = () => {
        if (quotes.length === 0) {
            alert("Não há orçamentos para exportar.");
            return;
        }
        const dataStr = JSON.stringify(quotes, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `backup_orcamentos_zilinski_${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // --- IMPORTAR ---
    const handleImportClick = () => {
        if (fileInputRef.current) fileInputRef.current.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const fileObj = event.target.files && event.target.files[0];
        if (!fileObj) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = e.target?.result as string;
                const importedQuotes: SavedQuote[] = JSON.parse(json);
                if (!Array.isArray(importedQuotes)) throw new Error("Formato inválido");

                // Salva localmente
                const existingData = localStorage.getItem('zilinski_quotes');
                const localQuotes = existingData ? JSON.parse(existingData) : [];
                const currentIds = new Set(localQuotes.map((q: SavedQuote) => q.id));
                
                let count = 0;
                importedQuotes.forEach(q => {
                    if (!currentIds.has(q.id)) {
                        localQuotes.push(q);
                        count++;
                    }
                });
                localStorage.setItem('zilinski_quotes', JSON.stringify(localQuotes));
                
                alert(`${count} orçamentos importados para memória local com sucesso!`);
                loadQuotes(); 
            } catch (err) {
                console.error(err);
                alert("Erro ao ler arquivo. Verifique se é um backup válido.");
            }
        };
        reader.readAsText(fileObj);
        event.target.value = '';
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            <header className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase">Orçamentos Salvos</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            {loading ? "Carregando..." : `${quotes.length} orçamentos encontrados.`}
                        </p>
                        
                        {/* Indicador de Status */}
                        {connectionType === 'cloud' ? (
                            <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded-full border border-green-200">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                Nuvem (Online)
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full border border-gray-300" title="Os dados estão salvos apenas neste navegador. Use Exportar para fazer backup.">
                                <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                                Memória Local
                            </span>
                        )}
                    </div>
                </div>
                
                <div className="flex gap-2 flex-wrap justify-end">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" style={{ display: 'none' }} />

                    <button onClick={handleImportClick} className="bg-white dark:bg-gray-700 text-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 font-bold py-2 px-4 rounded hover:bg-gray-50 transition flex items-center gap-2 text-sm shadow-sm" title="Importar Backup">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        Importar
                    </button>

                    <button onClick={handleExport} className="bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 font-bold py-2 px-4 rounded hover:bg-blue-50 dark:hover:bg-gray-600 transition flex items-center gap-2 text-sm shadow-sm" title="Fazer Backup em Arquivo">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                         Exportar
                    </button>

                    <button onClick={() => navigate('/calculadora')} className="bg-highlight text-white font-bold py-2 px-6 rounded hover:bg-yellow-600 transition shadow-md">
                        + Novo
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-highlight"></div>
                </div>
            ) : quotes.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-400 text-lg font-medium">Nenhum orçamento salvo encontrado.</p>
                    {connectionType === 'local' && (
                        <p className="text-xs text-gray-400 mt-2 max-w-md mx-auto">
                            Dica: Você está usando a memória local. Se trocou de dispositivo, use o botão "Importar" para carregar seus orçamentos antigos.
                        </p>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quotes.map((quote) => (
                        <div 
                            key={quote.id} 
                            onClick={() => handleRestore(quote)}
                            className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-5 cursor-pointer hover:border-highlight transition-all group relative"
                        >
                            <button 
                                onClick={(e) => handleDelete(quote.id, e)}
                                className="absolute top-3 right-3 text-gray-400 hover:text-red-500 z-10 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                                title="Excluir"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>

                            <div className="flex items-center gap-2 mb-3">
                                <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold px-2 py-1 rounded uppercase">
                                    {new Date(quote.createdAt).toLocaleDateString()}
                                </span>
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 truncate" title={quote.clientName}>
                                {quote.clientName || "Cliente Sem Nome"}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 truncate" title={quote.userData?.address}>
                                {quote.userData?.address || "Endereço não informado"}
                            </p>

                            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded text-sm space-y-1 mb-4">
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-300">Escada:</span>
                                    <span className="font-bold text-gray-900 dark:text-white">{(quote.inputData.totalHeight/100).toFixed(2)}m</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-300">Degraus:</span>
                                    <span className="font-bold text-gray-900 dark:text-white">{quote.inputData.desiredSteps}</span>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 dark:border-gray-600 pt-3 flex justify-between items-center">
                                <span className="text-sm text-gray-500 dark:text-gray-400">Clique para abrir</span>
                                <span className="text-highlight font-bold text-sm uppercase group-hover:underline">Restaurar →</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SavedQuotes;
