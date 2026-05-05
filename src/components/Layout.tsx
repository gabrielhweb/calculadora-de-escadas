
import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';

const Layout: React.FC = () => {
  const location = useLocation();
  const { user, login, logout } = useAuth();
  // Agora a calculadora é a raiz '/', então verificamos se é exatamente '/'
  const isActive = (path: string) => location.pathname === path;

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

  // =================================================================================
  // PERSONALIZAÇÃO DA LOGO DO SITE
  // =================================================================================
  // OPÇÃO 1 (Igual ao PDF): Cole o código Base64 (ou link da imagem) entre as aspas abaixo:
  const SITE_LOGO_CUSTOM = 'data:image/jpeg;base64,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LDDDDDDDDDDDDDDDDDDDDDDDDDDAmAcDoDDDDDDDDDDDDDDDDDDDDDDDDDDAKCyDoDDIDDDDDDDDDDDDDDDDDDDDDDDgoGwsmSK6gDDDDDDDDDDDDDDDDDDW4CqogIyy+KbQU8CqDDDDDDDDDDDDDDDDDDDoDDDDAwiDDDDDDDDDDDDDDDDDDDDDDDDkDDDC6DDDDDDDDDDDDDDDDDDDDDtbS7EBDxiLVq5RiX7Q3CDDDDDDDDDDDDJEDHAFKDKh7KG1AjLGbKDDDDDDDDDDDDwQAACyCwigAigQigiQiCDDDDDDDDDDDDDDEACIKKAACMGAIECDDDDDDDDDDDDDDDDDSQAgwAgCiQSwgSyjDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCD/9oADAMBAAIAAwAAABD333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333333zT333333333333333333333333333327vhv333333333333333333333333333woDd333333333333333333333333333r3CLNT33333333333333333333333325Spd1733333333333333333333333332B67ZT3333333333333333333333333305yr6r/AN99999999999999999999999992UgW9W99999999999999999999999999WVcm9299+999999999999999999999992+6O6Wlr309999999999999999998Ay8eI7L/AL+gvCJwPPfffffffffffffffffffvfffSHPvfffffffffffffffffffffffbvffelPfffffffffffffffffffffLvLenPU/FBnYOvtJvM3vfffffffffffdP/zqvtqHnUd4R3pzvPvPffffffffffff3/r7jXDfD/HLH/jzfHfvfffffffffffffcOsuvNNtftusttNPffffffffffffffffbPnnDHPvDPrDPjLPfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPf/EADMRAAICAQMCAwQIBwAAAAAAAAECABEDEiExBEAyQVEQEzCBFCAiQmFxwfAjM3CAodHh/9oACAECAQE/AP6nhCRcKMOe+UDxGZDe4G0X1Eda373UoUCFg201VxHOwHdhdrPEUre3/YVIMLU1eUQUaIjGzfdIAdzwJu+5igXsYGJ2PP7/AMx0AGowuaod2PCB6mOd6HEHBh3W/SBtWMr6d5wo/P8A1H8RnlB4TENNvCKNd2fCPn+kdTqJqcCfd9mTxX3Z8A+f6RyL4mv8I5AGkext6Pt0HuD4B8/0jeR9gfyO8pTwahTYVNIHJjY9PJhPDCMKPZ42CtZgyLTD1gybKD5TIwY7Q+AfOAiqMAHkZTeYuab8ocZrYSop08zUYG+1ZgyKGJ9ZqGjTMjBiK7Q+Efv0+qfCP36TUZd9z9wfVbYae2x51NLU6hgq15mY2CsGMzMqpdTH4x+c6vYAezAwZOOJlcO1iYsYbEJiQrmpp1IrJOnRQmsie+xZBTioedpmX+EKExroxfaEU0wMLqE11D8Xpcf3zM2t2LVtACdhOpBOMTH4x+c6pS1UIQRzOlBCm4QQaMwmsNj8ZiyrkF+c6r+ZMHvFW1FiIwy2GWZFCsQIz6EDTqAXx2vsZT7iq+MOqIFAQ9USKqY3KNqEPVkiqimiDPpbeky5DkNmL1RAAqZMhdtRi5yE0VFYqbEyZC7WZizNj44jdWxGwl3Hzlk01MfU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'; 

  // OPÇÃO 2: Salve sua imagem como 'logo.png' e coloque na pasta 'public' do projeto.
  // =================================================================================

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
                    
                    <svg viewBox="0 0 100 100" className="w-full h-full text-black dark:text-white hidden" fill="currentColor">
                       <path d="M50 20 C 55 15, 65 10, 75 15 C 80 18, 85 25, 80 35 C 90 30, 95 35, 90 45 C 95 45, 95 55, 85 60 C 80 62, 75 60, 70 55 L 75 80 L 55 75 L 50 90 L 45 75 L 25 80 L 30 55 C 25 60, 20 62, 15 60 C 5 55, 5 45, 10 45 C 5 35, 10 30, 20 35 C 15 25, 20 18, 25 15 C 35 10, 45 15, 50 20 Z" />
                       <text x="20" y="95" fontFamily="Arial" fontWeight="900" fontSize="14" fill="currentColor">Z</text>
                       <text x="70" y="95" fontFamily="Arial" fontWeight="900" fontSize="14" fill="currentColor">D</text>
                    </svg>
                </div>
                <div className="flex flex-col">
                    <span className="font-black text-3xl tracking-tighter text-gray-900 dark:text-white leading-none">Zilinski</span>
                    <span className="text-xs text-highlight tracking-[0.3em] uppercase font-bold mt-1">Distribuidora</span>
                </div>
              </Link>
            </div>
            <div className="flex items-center space-x-4 md:space-x-8">
              <div className="hidden md:flex space-x-8 h-full">
                <Link 
                  to="/" 
                  className={`${isActive('/') ? 'text-highlight font-bold border-b-4 border-highlight' : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'} px-2 pt-1 text-sm uppercase tracking-wide transition-all duration-200 h-full flex items-center font-bold`}
                >
                  Calculadora
                </Link>
                <Link 
                  to="/contrato" 
                  className={`${isActive('/contrato') ? 'text-highlight font-bold border-b-4 border-highlight' : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'} px-2 pt-1 text-sm uppercase tracking-wide transition-all duration-200 h-full flex items-center font-bold`}
                >
                  Gerar Contrato
                </Link>
                <Link 
                  to="/contratos" 
                  className={`${isActive('/contratos') ? 'text-highlight font-bold border-b-4 border-highlight' : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'} px-2 pt-1 text-sm uppercase tracking-wide transition-all duration-200 h-full flex items-center font-bold`}
                >
                  Meus Contratos
                </Link>
                <Link 
                  to="/fila" 
                  className={`${isActive('/fila') ? 'text-highlight font-bold border-b-4 border-highlight' : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'} px-2 pt-1 text-sm uppercase tracking-wide transition-all duration-200 h-full flex items-center font-bold`}
                >
                  Fila de Produção
                </Link>
                <Link 
                  to="/transportadoras" 
                  className={`${isActive('/transportadoras') ? 'text-highlight font-bold border-b-4 border-highlight' : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'} px-2 pt-1 text-sm uppercase tracking-wide transition-all duration-200 h-full flex items-center font-bold`}
                >
                  🚚 Fretes
                </Link>
                <Link 
                  to="/recibo-pagamento" 
                  className={`${isActive('/recibo-pagamento') ? 'text-highlight font-bold border-b-4 border-highlight' : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'} px-2 pt-1 text-sm uppercase tracking-wide transition-all duration-200 h-full flex items-center font-bold`}
                >
                  Recibo Pagamento
                </Link>
                <Link 
                  to="/recibo-visita" 
                  className={`${isActive('/recibo-visita') ? 'text-highlight font-bold border-b-4 border-highlight' : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'} px-2 pt-1 text-sm uppercase tracking-wide transition-all duration-200 h-full flex items-center font-bold`}
                >
                  Recibo Visita
                </Link>
                <Link 
                  to="/salvos" 
                  className={`${isActive('/salvos') ? 'text-highlight font-bold border-b-4 border-highlight' : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'} px-2 pt-1 text-sm uppercase tracking-wide transition-all duration-200 h-full flex items-center font-bold`}
                >
                  Orçamentos Salvos
                </Link>
              </div>

              {/* User Login/Logout */}
              <div className="flex items-center gap-3 ml-4">
                {user ? (
                  <div className="flex items-center gap-2">
                    <img src={user.photoURL || ''} alt="User" className="w-8 h-8 rounded-full border border-gray-300" />
                    <button onClick={logout} className="text-xs font-bold text-gray-500 hover:text-red-500 transition-colors">
                      Sair
                    </button>
                  </div>
                ) : (
                  <button onClick={login} className="bg-highlight text-white text-xs font-bold px-3 py-1.5 rounded hover:bg-yellow-600 transition-colors">
                    Fazer Login
                  </button>
                )}
              </div>

              {/* Theme Toggle Button */}
              <button 
                onClick={toggleTheme}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-yellow-400 transition-colors focus:outline-none focus:ring-2 focus:ring-highlight"
                title={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
              >
                {isDark ? (
                  /* Sun Icon */
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  /* Moon Icon */
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
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
