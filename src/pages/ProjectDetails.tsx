
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuoteById, updateQuoteStatus, addAttachmentToQuote, uploadProjectFile } from '../services/storage';
import { SavedQuote, QuoteStatus, ProjectFile } from '../types';
import ProposalDocument from '../components/ProposalDocument'; // Reusing for PDF Gen if needed

const ProjectDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [quote, setQuote] = useState<SavedQuote | null>(null);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState<'admin' | 'worker'>('admin');
    
    // Upload States
    const [isUploading, setIsUploading] = useState(false);
    const [youtubeLink, setYoutubeLink] = useState('');
    const [showVideoInput, setShowVideoInput] = useState(false);

    useEffect(() => {
        const userRole = localStorage.getItem('zilinski_role') as 'admin' | 'worker';
        if (userRole) setRole(userRole);
        
        if (id) loadProject(id);
    }, [id]);

    const loadProject = async (projectId: string) => {
        setLoading(true);
        const data = await getQuoteById(projectId);
        if (data) {
            setQuote(data);
        } else {
            alert("Obra não encontrada.");
            navigate('/dashboard');
        }
        setLoading(false);
    };

    const handleStatusChange = async (newStatus: QuoteStatus) => {
        if (!quote) return;
        if (window.confirm(`Mudar status para: ${newStatus.toUpperCase()}?`)) {
            await updateQuoteStatus(quote.id, newStatus);
            setQuote({ ...quote, status: newStatus });
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0] || !quote) return;
        setIsUploading(true);
        const file = e.target.files[0];
        
        try {
            const uploadedFile = await uploadProjectFile(file, quote.id);
            if (uploadedFile) {
                await addAttachmentToQuote(quote.id, uploadedFile);
                setQuote(prev => prev ? { ...prev, attachments: [...(prev.attachments || []), uploadedFile] } : null);
            }
        } catch (err) {
            alert("Erro ao enviar arquivo.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleAddYoutube = async () => {
        if (!youtubeLink || !quote) return;
        const newFile: ProjectFile = {
            id: Date.now().toString(),
            name: "Vídeo Externo (YouTube/Drive)",
            url: youtubeLink,
            type: 'youtube',
            uploadedAt: new Date().toISOString()
        };
        await addAttachmentToQuote(quote.id, newFile);
        setQuote(prev => prev ? { ...prev, attachments: [...(prev.attachments || []), newFile] } : null);
        setYoutubeLink('');
        setShowVideoInput(false);
    };

    if (loading || !quote) return <div className="p-8 text-center">Carregando obra...</div>;

    // Definição de Cores do Status
    const statusColor = quote.status === 'production' ? 'bg-yellow-500' : quote.status === 'installed' ? 'bg-green-500' : 'bg-gray-400';

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 pb-20">
            {/* HEADER DE OBRA */}
            <div className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
                <div className="max-w-5xl mx-auto">
                    <button onClick={() => navigate('/dashboard')} className="text-sm font-bold text-gray-500 mb-4 hover:text-black dark:hover:text-white flex items-center gap-1">
                        ← Voltar ao Painel
                    </button>
                    
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <span className={`w-3 h-3 rounded-full ${statusColor} animate-pulse`}></span>
                                <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase">{quote.clientName}</h1>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">
                                {quote.userData?.street}, {quote.userData?.number} - {quote.userData?.city}
                            </p>
                            {/* VISUALIZAÇÃO DE STATUS CLARA */}
                            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-xs font-bold text-gray-600 dark:text-gray-300 shadow-sm">
                                Status Atual: <span className="uppercase text-highlight">{quote.status === 'draft' ? 'Rascunho / Negociação' : quote.status === 'production' ? 'Em Produção' : quote.status}</span>
                            </div>
                        </div>

                        {/* AÇÕES DE STATUS */}
                        <div className="flex gap-2">
                            {(quote.status === 'draft' || quote.status === 'negotiation') && role === 'admin' && (
                                <button onClick={() => handleStatusChange('production')} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded shadow-lg uppercase text-sm animate-pulse">
                                    🔥 Enviar para Serralheria
                                </button>
                            )}
                            {quote.status === 'production' && (
                                <button onClick={() => handleStatusChange('installed')} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded shadow uppercase text-sm">
                                    ✅ Marcar Pronto
                                </button>
                            )}
                            {role === 'admin' && quote.status === 'installed' && (
                                <button onClick={() => handleStatusChange('archived')} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded shadow uppercase text-sm">
                                    📦 Arquivar (Drive)
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* COLUNA 1: DADOS TÉCNICOS (O que o Serralheiro Vê) */}
                <div className="md:col-span-2 space-y-8">
                    
                    {/* GALERIA DE MÍDIA - DESTAQUE */}
                    <section className="bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    📸 Fotos & Vídeos da Obra
                                </h2>
                                <p className="text-xs text-gray-500">Adicione vídeos explicativos para o serralheiro aqui.</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setShowVideoInput(!showVideoInput)} className="text-sm bg-red-100 text-red-700 px-3 py-2 rounded font-bold hover:bg-red-200 flex items-center gap-1">
                                    + Link Vídeo
                                </button>
                                <label className="text-sm bg-blue-600 text-white px-3 py-2 rounded font-bold hover:bg-blue-700 cursor-pointer flex items-center gap-1 shadow">
                                    + Upload Arquivo
                                    <input type="file" onChange={handleFileUpload} accept="image/*,video/*" className="hidden" disabled={isUploading}/>
                                </label>
                            </div>
                        </div>

                        {showVideoInput && (
                            <div className="mb-4 flex gap-2 animate-fade-in bg-gray-50 dark:bg-gray-700 p-3 rounded">
                                <input 
                                    type="text" 
                                    placeholder="Cole aqui o link do YouTube, Drive ou Instagram..." 
                                    value={youtubeLink}
                                    onChange={e => setYoutubeLink(e.target.value)}
                                    className="flex-1 p-2 border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                />
                                <button onClick={handleAddYoutube} className="bg-highlight text-white font-bold px-4 rounded">Salvar</button>
                            </div>
                        )}

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {quote.attachments?.map((file) => (
                                <div key={file.id} className="relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 group">
                                    {file.type === 'image' ? (
                                        <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-2 text-center bg-gray-800">
                                            <span className="text-4xl mb-2">▶️</span>
                                            <span className="text-xs truncate w-full px-2 font-bold text-white">{file.name}</span>
                                        </div>
                                    )}
                                    <a 
                                        href={file.url} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-bold uppercase tracking-widest text-sm"
                                    >
                                        Abrir
                                    </a>
                                </div>
                            ))}
                            {(!quote.attachments || quote.attachments.length === 0) && (
                                <div className="col-span-full py-8 text-center text-gray-400">
                                    <p>Nenhuma mídia anexada.</p>
                                    <p className="text-xs">Use os botões acima para adicionar vídeos ou fotos.</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* DADOS TÉCNICOS RESUMIDOS */}
                    <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 uppercase border-b border-gray-100 dark:border-gray-700 pb-2">
                            📏 Ficha Técnica (Serralheria)
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                            <div>
                                <span className="block text-gray-500 uppercase text-xs font-bold">Altura Total</span>
                                <span className="text-xl font-black text-gray-900 dark:text-white">{(quote.inputData.totalHeight/100).toFixed(2)}m</span>
                            </div>
                            <div>
                                <span className="block text-gray-500 uppercase text-xs font-bold">Qtd. Peças</span>
                                <span className="text-xl font-black text-gray-900 dark:text-white">{quote.inputData.desiredSteps}</span>
                            </div>
                            <div>
                                <span className="block text-gray-500 uppercase text-xs font-bold">Largura</span>
                                <span className="text-xl font-black text-gray-900 dark:text-white">{quote.inputData.stairWidth}cm</span>
                            </div>
                            <div>
                                <span className="block text-gray-500 uppercase text-xs font-bold">Patamares</span>
                                <span className="text-xl font-black text-gray-900 dark:text-white">{quote.inputData.landings.length}</span>
                            </div>
                        </div>

                        {quote.inputData.landings.length > 0 && (
                            <div className="mt-4 bg-orange-50 dark:bg-orange-900/20 p-3 rounded border border-orange-200 dark:border-orange-800">
                                <p className="font-bold text-orange-800 dark:text-orange-400 text-xs uppercase mb-2">Detalhes dos Patamares:</p>
                                <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                                    {quote.inputData.landings.map((l, i) => (
                                        <li key={i}>
                                            • Patamar no degrau <strong>{l.step}</strong> ({l.length}x{l.width}cm) - {l.direction === 'straight' ? 'Reto' : `Curva ${l.direction}`}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </section>

                </div>

                {/* COLUNA 2: ADMINISTRAÇÃO (Escondida se for worker) */}
                <div className="space-y-6">
                    {/* CARD PDF - Visível para todos para imprimir medidas */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-lg border border-blue-200 dark:border-blue-800">
                         <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-2">Documentação</h3>
                         <p className="text-sm text-blue-700 dark:text-blue-400 mb-4">
                             Baixe o PDF com as medidas técnicas para levar para a bancada.
                         </p>
                         <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded text-sm">
                             📄 Baixar Orçamento/Medidas
                         </button>
                    </div>

                    {role === 'admin' && (
                        <div className="bg-gray-50 dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-3">💰 Financeiro (Restrito)</h3>
                            <ul className="space-y-2 text-sm">
                                <li className="flex justify-between">
                                    <span className="text-gray-500">Valor Frete:</span>
                                    <span className="font-bold">{quote.freightCost}</span>
                                </li>
                                <li className="flex justify-between">
                                    <span className="text-gray-500">Instalação:</span>
                                    <span className="font-bold">{quote.installationCost}</span>
                                </li>
                                <li className="pt-2 border-t border-gray-200 dark:border-gray-700 mt-2 flex justify-between text-lg">
                                    <span className="font-bold text-gray-900 dark:text-white">Lucro Estimado:</span>
                                    <span className="font-black text-green-600">--</span>
                                </li>
                            </ul>
                            <div className="mt-4 text-xs text-gray-400 text-center">
                                * Informação visível apenas para Admin.
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default ProjectDetails;
