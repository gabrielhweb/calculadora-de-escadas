
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getQuotes } from '../services/storage';
import { SavedQuote, QuoteStatus, LocalUser } from '../types';

const Dashboard: React.FC = () => {
    const [quotes, setQuotes] = useState<SavedQuote[]>([]);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState<'admin' | 'worker'>('admin');
    const [activeTab, setActiveTab] = useState<'kanban' | 'users'>('kanban');
    
    // Estados para Gestão de Usuários
    const [localUsers, setLocalUsers] = useState<LocalUser[]>([]);
    const [newUserUser, setNewUserUser] = useState('');
    const [newUserRole, setNewUserRole] = useState<'admin' | 'worker'>('worker');
    
    // Novas Permissões Selecionáveis
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>(['/dashboard', '/obra']);

    const navigate = useNavigate();

    useEffect(() => {
        // Verifica autenticação básica
        const isAuth = localStorage.getItem('zilinski_auth');
        if (!isAuth) {
            navigate('/login');
            return;
        }
        
        const userRole = localStorage.getItem('zilinski_role') as 'admin' | 'worker';
        if (userRole) setRole(userRole);

        loadData();
        loadUsers();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const data = await getQuotes();
        // Filtra arquivados da view principal
        setQuotes(data.filter(q => q.status !== 'archived'));
        setLoading(false);
    };

    const loadUsers = () => {
        const stored = localStorage.getItem('zilinski_users');
        if (stored) {
            setLocalUsers(JSON.parse(stored));
        } else {
            // Se não tiver ninguém, mostra pelo menos os padrões para o usuário saber que existem
            setLocalUsers([
                { id: 'default1', username: 'admin', role: 'admin', permissions: ['*'] },
                { id: 'default2', username: 'serralheiro', role: 'worker', permissions: ['/dashboard', '/obra'] }
            ]);
        }
    };

    const handlePermissionToggle = (path: string) => {
        setSelectedPermissions(prev => 
            prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
        );
    };

    const handleAddUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUserUser) return;
        
        // Verifica duplicidade
        if (localUsers.find(u => u.username === newUserUser) || newUserUser === 'admin' || newUserUser === 'serralheiro') {
            alert("Este usuário já existe.");
            return;
        }

        const newUser: LocalUser = {
            id: Date.now().toString(),
            username: newUserUser.toLowerCase(),
            role: newUserRole,
            permissions: newUserRole === 'admin' ? ['*'] : selectedPermissions // Admin tem acesso total forçado
        };

        const updated = [...localUsers, newUser];
        setLocalUsers(updated);
        localStorage.setItem('zilinski_users', JSON.stringify(updated));
        
        setNewUserUser('');
        // Reseta permissões para o padrão de worker
        setSelectedPermissions(['/dashboard', '/obra']); 
        alert(`Usuário "${newUser.username}" criado! A senha é igual ao usuário.`);
    };

    const handleDeleteUser = (id: string) => {
        if (window.confirm("Remover este usuário?")) {
            const updated = localUsers.filter(u => u.id !== id);
            setLocalUsers(updated);
            localStorage.setItem('zilinski_users', JSON.stringify(updated));
        }
    };

    // Filtros de Colunas Kanban
    const draftQuotes = quotes.filter(q => q.status === 'draft' || q.status === 'negotiation');
    const productionQuotes = quotes.filter(q => q.status === 'production');
    const doneQuotes = quotes.filter(q => q.status === 'installed');

    const handleCardClick = (id: string) => {
        navigate(`/obra/${id}`);
    };

    const StatusBadge = ({ status }: { status: QuoteStatus }) => {
        const labels = {
            draft: 'Rascunho',
            negotiation: 'Negociação',
            production: 'Em Produção',
            installed: 'Finalizado',
            archived: 'Arquivado'
        };
        const colors = {
            draft: 'bg-gray-200 text-gray-700',
            negotiation: 'bg-blue-100 text-blue-700',
            production: 'bg-yellow-100 text-yellow-800 animate-pulse',
            installed: 'bg-green-100 text-green-700',
            archived: 'bg-gray-100 text-gray-400'
        };
        return (
            <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded ${colors[status]}`}>
                {labels[status]}
            </span>
        );
    };

    const ProjectCard = ({ quote }: { quote: SavedQuote }) => (
        <div 
            onClick={() => handleCardClick(quote.id)}
            className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-highlight cursor-pointer transition-all group"
        >
            <div className="flex justify-between items-start mb-2">
                <StatusBadge status={quote.status || 'draft'} />
                <span className="text-xs text-gray-400">{new Date(quote.createdAt).toLocaleDateString()}</span>
            </div>
            
            <h4 className="font-bold text-gray-900 dark:text-white text-lg leading-tight mb-1 group-hover:text-highlight">
                {quote.clientName}
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 truncate">
                {quote.userData?.city || 'Local não definido'} - {quote.userData?.neighborhood}
            </p>

            <div className="flex justify-between items-center text-xs text-gray-500 border-t border-gray-100 dark:border-gray-700 pt-3">
                <div className="flex gap-2">
                    <span title="Fotos/Vídeos">📎 {quote.attachments?.length || 0}</span>
                </div>
                <span className="font-bold bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    {(quote.inputData.totalHeight/100).toFixed(2)}m
                </span>
            </div>
        </div>
    );

    if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin h-10 w-10 border-4 border-highlight border-t-transparent rounded-full"></div></div>;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
            <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase">
                        Gestão CRM
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Painel Administrativo | {role === 'admin' ? 'Acesso Total' : 'Acesso Restrito'}
                    </p>
                </div>
                <div className="flex gap-3">
                     {role === 'admin' && (
                        <div className="flex bg-gray-200 dark:bg-gray-700 rounded p-1">
                            <button 
                                onClick={() => setActiveTab('kanban')}
                                className={`px-4 py-1 rounded font-bold text-sm transition ${activeTab === 'kanban' ? 'bg-white dark:bg-gray-600 shadow' : 'text-gray-500 dark:text-gray-300'}`}
                            >
                                🏗️ Obras
                            </button>
                            <button 
                                onClick={() => setActiveTab('users')}
                                className={`px-4 py-1 rounded font-bold text-sm transition ${activeTab === 'users' ? 'bg-white dark:bg-gray-600 shadow' : 'text-gray-500 dark:text-gray-300'}`}
                            >
                                👥 Equipe
                            </button>
                        </div>
                     )}
                </div>
            </header>

            {/* TAB: KANBAN DE OBRAS */}
            {activeTab === 'kanban' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 overflow-x-auto pb-4 animate-fade-in">
                    
                    {/* COLUNA 1: NOVOS (Visível apenas para ADMIN) */}
                    {role === 'admin' && (
                        <div className="min-w-[300px]">
                            <div className="flex items-center justify-between mb-4 bg-gray-200 dark:bg-gray-800 p-3 rounded-lg border-l-4 border-blue-500">
                                <h3 className="font-bold text-gray-700 dark:text-gray-200 uppercase text-sm">Orçamentos / Negociação</h3>
                                <span className="bg-white dark:bg-gray-700 text-gray-600 dark:text-white px-2 rounded-full text-xs font-bold">{draftQuotes.length}</span>
                            </div>
                            <div className="space-y-3">
                                {draftQuotes.map(q => <ProjectCard key={q.id} quote={q} />)}
                                {draftQuotes.length === 0 && <p className="text-center text-gray-400 text-sm italic py-4">Nenhum orçamento pendente.</p>}
                            </div>
                        </div>
                    )}

                    {/* COLUNA 2: PRODUÇÃO (Foco do Serralheiro) */}
                    <div className="min-w-[300px]">
                        <div className="flex items-center justify-between mb-4 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border-l-4 border-yellow-500">
                            <h3 className="font-bold text-yellow-800 dark:text-yellow-500 uppercase text-sm">🔥 Em Produção (Serralheria)</h3>
                            <span className="bg-white dark:bg-gray-700 text-yellow-600 dark:text-yellow-400 px-2 rounded-full text-xs font-bold">{productionQuotes.length}</span>
                        </div>
                        <div className="space-y-3">
                            {productionQuotes.map(q => <ProjectCard key={q.id} quote={q} />)}
                            {productionQuotes.length === 0 && <p className="text-center text-gray-400 text-sm italic py-4">Nenhuma obra em andamento.</p>}
                        </div>
                    </div>

                    {/* COLUNA 3: FINALIZADOS */}
                    <div className="min-w-[300px]">
                        <div className="flex items-center justify-between mb-4 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border-l-4 border-green-500">
                            <h3 className="font-bold text-green-800 dark:text-green-500 uppercase text-sm">✅ Prontos / Instalados</h3>
                            <span className="bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 px-2 rounded-full text-xs font-bold">{doneQuotes.length}</span>
                        </div>
                        <div className="space-y-3">
                            {doneQuotes.map(q => <ProjectCard key={q.id} quote={q} />)}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: GERENCIAR USUÁRIOS */}
            {activeTab === 'users' && role === 'admin' && (
                <div className="animate-fade-in max-w-4xl mx-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6 border border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-bold mb-4 border-b pb-2 dark:border-gray-700 dark:text-white">Criar Novo Acesso</h2>
                        <form onSubmit={handleAddUser} className="space-y-4">
                            <div className="flex gap-4 items-end flex-wrap">
                                <div className="flex-1 min-w-[200px]">
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Nome de Usuário</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={newUserUser}
                                        onChange={e => setNewUserUser(e.target.value)}
                                        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        placeholder="Ex: vendedor_joao"
                                    />
                                </div>
                                <div className="w-40">
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Perfil</label>
                                    <select 
                                        value={newUserRole} 
                                        onChange={e => setNewUserRole(e.target.value as any)}
                                        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    >
                                        <option value="worker">Operacional (Restrito)</option>
                                        <option value="admin">Administrador (Total)</option>
                                    </select>
                                </div>
                            </div>
                            
                            {/* SELEÇÃO DE PERMISSÕES (Se não for Admin) */}
                            {newUserRole !== 'admin' && (
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded border border-gray-100 dark:border-gray-600">
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Quais páginas este usuário pode ver?</label>
                                    <div className="flex flex-wrap gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded">
                                            <input type="checkbox" checked={selectedPermissions.includes('/calculadora')} onChange={() => handlePermissionToggle('/calculadora')} className="w-4 h-4 accent-highlight" />
                                            <span className="text-sm dark:text-gray-200">Calculadora (Preços)</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded">
                                            <input type="checkbox" checked={selectedPermissions.includes('/contrato')} onChange={() => handlePermissionToggle('/contrato')} className="w-4 h-4 accent-highlight" />
                                            <span className="text-sm dark:text-gray-200">Gerar Contratos</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded">
                                            <input type="checkbox" checked={selectedPermissions.includes('/salvos')} onChange={() => handlePermissionToggle('/salvos')} className="w-4 h-4 accent-highlight" />
                                            <span className="text-sm dark:text-gray-200">Ver Orçamentos Salvos</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded">
                                            <input type="checkbox" checked={selectedPermissions.includes('/dashboard')} onChange={() => handlePermissionToggle('/dashboard')} className="w-4 h-4 accent-highlight" />
                                            <span className="text-sm dark:text-gray-200">Gestão CRM (Obras em Produção)</span>
                                        </label>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end">
                                <button className="bg-highlight text-white font-bold px-6 py-2 rounded shadow hover:bg-yellow-600">
                                    Criar Acesso
                                </button>
                            </div>
                        </form>
                        <p className="text-xs text-gray-400 mt-2">
                            * A senha inicial será igual ao nome do usuário (Ex: usuario: <strong>joao</strong> / senha: <strong>joao</strong>).
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                <tr>
                                    <th className="p-3">Usuário</th>
                                    <th className="p-3">Perfil</th>
                                    <th className="p-3">Acesso</th>
                                    <th className="p-3 text-right">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {localUsers.map(u => (
                                    <tr key={u.id} className="dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="p-3 font-bold">{u.username}</td>
                                        <td className="p-3">
                                            {u.role === 'admin' 
                                                ? <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">Admin</span> 
                                                : <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-bold">Func.</span>
                                            }
                                        </td>
                                        <td className="p-3 text-xs text-gray-500">
                                            {u.role === 'admin' ? 'Total' : u.permissions?.join(', ') || 'Restrito'}
                                        </td>
                                        <td className="p-3 text-right">
                                            {u.id.startsWith('default') ? (
                                                <span className="text-gray-400 text-xs italic">Padrão</span>
                                            ) : (
                                                <button onClick={() => handleDeleteUser(u.id)} className="text-red-500 hover:text-red-700 font-bold">Excluir</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
