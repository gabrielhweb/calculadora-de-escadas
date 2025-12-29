
import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';

const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path: string) => location.pathname === path;

  // Permissões do usuário
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    const role = localStorage.getItem('zilinski_role');
    const user = localStorage.getItem('zilinski_user');
    const storedPerms = localStorage.getItem('zilinski_permissions');
    
    if (user) setUsername(user);

    if (role === 'admin') {
        setIsAdmin(true);
        setPermissions(['*']); // Admin vê tudo
    } else if (storedPerms) {
        setPermissions(JSON.parse(storedPerms));
    }
  }, []);

  const handleLogout = () => {
      if(window.confirm("Deseja realmente sair do sistema?")) {
          localStorage.removeItem('zilinski_auth');
          localStorage.removeItem('zilinski_role');
          localStorage.removeItem('zilinski_user');
          localStorage.removeItem('zilinski_permissions');
          navigate('/login');
      }
  };

  // Helper para verificar se pode mostrar o link
  const canAccess = (path: string) => {
      if (isAdmin) return true;
      if (permissions.includes('*')) return true;
      // Se tiver permissão para a rota exata OU se for a home ('/')
      return permissions.includes(path) || (path === '/' && permissions.includes('/'));
  };

  // State initialization with localStorage check
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // Effect to apply class and save preference
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const SITE_LOGO_CUSTOM = 'data:image/jpeg;base64,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'; 

  return (
    <div className="min-h-screen flex flex-col bg-primary dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-sans transition-colors duration-200">
      <nav className="bg-secondary dark:bg-gray-800 shadow-md sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-24 items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center gap-4 group">
                
                <div className="w-16 h-16 flex items-center justify-center transition-transform group-hover:scale-105">
                    <img 
                      src={SITE_LOGO_CUSTOM || "/logo.png"} 
                      alt="Zilinski" 
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                </div>
                <div className="flex flex-col">
                    <span className="font-black text-3xl tracking-tighter text-gray-900 dark:text-white leading-none">Zilinski</span>
                    <span className="text-xs text-highlight tracking-[0.3em] uppercase font-bold mt-1">Distribuidora</span>
                </div>
              </Link>
            </div>
            
            {/* Menu Desktop */}
            <div className="flex items-center space-x-4 md:space-x-6">
              <div className="hidden md:flex space-x-6 h-full items-center">
                
                {canAccess('/') && (
                    <Link 
                    to="/" 
                    className={`${isActive('/') ? 'text-highlight font-bold border-b-4 border-highlight' : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'} px-2 py-1 text-sm uppercase tracking-wide transition-all`}
                    >
                    Início
                    </Link>
                )}

                {canAccess('/calculadora') && (
                    <Link 
                    to="/calculadora" 
                    className={`${isActive('/calculadora') ? 'text-highlight font-bold border-b-4 border-highlight' : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'} px-2 py-1 text-sm uppercase tracking-wide transition-all`}
                    >
                    Calculadora
                    </Link>
                )}

                {canAccess('/contrato') && (
                    <Link 
                    to="/contrato" 
                    className={`${isActive('/contrato') ? 'text-highlight font-bold border-b-4 border-highlight' : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'} px-2 py-1 text-sm uppercase tracking-wide transition-all`}
                    >
                    Contrato
                    </Link>
                )}
                
                {canAccess('/salvos') && (
                    <Link 
                    to="/salvos" 
                    className={`${isActive('/salvos') ? 'text-highlight font-bold border-b-4 border-highlight' : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'} px-2 py-1 text-sm uppercase tracking-wide transition-all`}
                    >
                    Salvos
                    </Link>
                )}

                {canAccess('/dashboard') && (
                    <Link 
                    to="/dashboard" 
                    className={`${isActive('/dashboard') ? 'text-white bg-highlight shadow-lg' : 'text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600 hover:border-highlight hover:text-highlight'} px-4 py-2 rounded-lg text-sm uppercase tracking-wide transition-all font-black flex items-center gap-2`}
                    >
                    ⚙️ Gestão
                    </Link>
                )}
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center gap-2 border-l pl-4 border-gray-200 dark:border-gray-700">
                  <div className="hidden lg:flex flex-col items-end mr-2">
                      <span className="text-xs font-bold text-gray-900 dark:text-white uppercase">{username || 'Usuário'}</span>
                      <span className="text-[10px] text-gray-500 uppercase">{isAdmin ? 'Admin' : 'Colaborador'}</span>
                  </div>

                  <button 
                    onClick={toggleTheme}
                    className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-yellow-400 transition-colors focus:outline-none focus:ring-2 focus:ring-highlight"
                    title="Alternar Tema"
                  >
                    {isDark ? "☀️" : "🌙"}
                  </button>

                  <button 
                    onClick={handleLogout}
                    className="p-2 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                    title="Sair do Sistema"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        <Outlet />
      </main>

      <footer className="bg-white dark:bg-gray-800 text-center py-8 border-t border-gray-200 dark:border-gray-700 mt-auto">
        <div className="max-w-7xl mx-auto px-4">
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Zilinski Distribuidora</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Av. Maria Luiza Americano 1954, São Paulo – SP</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs">
            &copy; {new Date().getFullYear()} Zilinski Distribuidora. Todos os direitos reservados.
            </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
