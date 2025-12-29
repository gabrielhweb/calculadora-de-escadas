
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { LocalUser } from '../types';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const inputUser = email.toLowerCase().trim();
        const inputPass = password.trim();

        // 1. Verifica Logins Padrão (Hardcoded)
        if (inputUser === 'admin' && inputPass === 'admin') {
            // Admin tem acesso a tudo ('*')
            doLogin('admin', 'admin', ['*']);
            return;
        }
        if (inputUser === 'serralheiro' && inputPass === '123') {
            // Serralheiro padrão vê apenas o Dashboard e Detalhes da Obra
            doLogin('serralheiro', 'worker', ['/dashboard', '/obra']);
            return;
        }

        // 2. Verifica Logins Criados (LocalStorage)
        const storedUsers = localStorage.getItem('zilinski_users');
        if (storedUsers) {
            const users: LocalUser[] = JSON.parse(storedUsers);
            // Simulação: Senha = Nome de usuário para novos usuários criados no painel
            const foundUser = users.find((u) => u.username === inputUser && inputPass === inputUser);
            if (foundUser) {
                // Usa as permissões salvas no cadastro
                // Se for admin, garante acesso total
                const perms = foundUser.role === 'admin' ? ['*'] : (foundUser.permissions || []);
                doLogin(foundUser.username, foundUser.role, perms);
                return;
            }
        }

        // 3. Tenta Supabase (se for email)
        if (supabase && email.includes('@')) {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (!error) {
                doLogin(email, 'admin', ['*']); 
                return;
            }
        }

        alert('Login ou Senha incorretos.\n\nTente:\nadmin / admin\nserralheiro / 123');
        setLoading(false);
    };

    const doLogin = (username: string, role: string, permissions: string[]) => {
        localStorage.setItem('zilinski_auth', 'true');
        localStorage.setItem('zilinski_role', role);
        localStorage.setItem('zilinski_user', username);
        localStorage.setItem('zilinski_permissions', JSON.stringify(permissions));

        setTimeout(() => {
            // Redirecionamento inteligente baseado nas permissões
            if (permissions.includes('*') || permissions.includes('/')) {
                navigate('/');
            } else if (permissions.includes('/dashboard')) {
                navigate('/dashboard');
            } else if (permissions.length > 0) {
                // Vai para a primeira rota permitida
                navigate(permissions[0]);
            } else {
                navigate('/');
            }
        }, 500);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-highlight/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-4xl">🔐</span>
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Zilinski</h1>
                    <p className="text-sm text-highlight font-bold tracking-[0.3em] uppercase">Sistema de Gestão</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Usuário</label>
                        <input 
                            type="text" 
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full p-3 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-highlight outline-none font-medium"
                            placeholder="Digite seu usuário (ex: admin)"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Senha</label>
                        <input 
                            type="password" 
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full p-3 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-highlight outline-none font-medium"
                            placeholder="••••••••"
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-highlight text-white font-black py-3 rounded shadow-lg hover:bg-yellow-600 transition disabled:opacity-50 uppercase tracking-wide flex justify-center"
                    >
                        {loading ? <span className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent"></span> : 'Entrar no Sistema'}
                    </button>
                </form>

                <div className="mt-6 text-center text-xs text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-4">
                    <p className="font-bold mb-1">Acessos Padrão:</p>
                    <p>Admin: <strong>admin</strong> / <strong>admin</strong></p>
                    <p>Operacional: <strong>serralheiro</strong> / <strong>123</strong></p>
                </div>
            </div>
        </div>
    );
};

export default Login;
