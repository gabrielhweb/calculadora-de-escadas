import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';

const Layout: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  // =================================================================================
  // PERSONALIZAÇÃO DA LOGO DO SITE
  // =================================================================================
  // OPÇÃO 1 (Igual ao PDF): Cole o código Base64 (ou link da imagem) entre as aspas abaixo:
  const SITE_LOGO_CUSTOM = 'data:image/jpeg;base64,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'; 

  // OPÇÃO 2: Salve sua imagem como 'logo.png' e coloque na pasta 'public' do projeto.
  // =================================================================================

  return (
    <div className="min-h-screen flex flex-col bg-primary text-gray-800 font-sans">
      <nav className="bg-secondary shadow-md sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-24 items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center gap-4 group">
                
                <div className="w-16 h-16 flex items-center justify-center transition-transform group-hover:scale-105">
                    {/* Lógica da Imagem:
                        1. Se tiver código colado em SITE_LOGO_CUSTOM, usa ele.
                        2. Se não, tenta carregar 'logo.png' da pasta public.
                        3. Se der erro, mostra o desenho da Águia (SVG).
                    */}
                    <img 
                      src={SITE_LOGO_CUSTOM || "/logo.png"} 
                      alt="Zilinski" 
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        // Se a imagem falhar, esconde a tag img e mostra o SVG abaixo
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    
                    {/* Fallback SVG (Águia Estilo Brasão) - Aparece se não tiver imagem */}
                    <svg viewBox="0 0 100 100" className="w-full h-full text-black hidden" fill="currentColor">
                       {/* Silhueta de Águia Heráldica Simplificada */}
                       <path d="M50 20 C 55 15, 65 10, 75 15 C 80 18, 85 25, 80 35 C 90 30, 95 35, 90 45 C 95 45, 95 55, 85 60 C 80 62, 75 60, 70 55 L 75 80 L 55 75 L 50 90 L 45 75 L 25 80 L 30 55 C 25 60, 20 62, 15 60 C 5 55, 5 45, 10 45 C 5 35, 10 30, 20 35 C 15 25, 20 18, 25 15 C 35 10, 45 15, 50 20 Z" />
                       {/* Letras Z D */}
                       <text x="20" y="95" fontFamily="Arial" fontWeight="900" fontSize="14" fill="currentColor">Z</text>
                       <text x="70" y="95" fontFamily="Arial" fontWeight="900" fontSize="14" fill="currentColor">D</text>
                    </svg>
                </div>
                <div className="flex flex-col">
                    <span className="font-black text-3xl tracking-tighter text-gray-900 leading-none">Zilinski</span>
                    <span className="text-xs text-highlight tracking-[0.3em] uppercase font-bold mt-1">Distribuidora</span>
                </div>
              </Link>
            </div>
            <div className="hidden md:flex space-x-8">
              <Link 
                to="/" 
                className={`${isActive('/') ? 'text-highlight font-bold border-b-4 border-highlight' : 'text-gray-500 hover:text-black'} px-2 pt-1 text-sm uppercase tracking-wide transition-all duration-200 h-full flex items-center font-bold`}
              >
                Início
              </Link>
              <Link 
                to="/calculadora" 
                className={`${isActive('/calculadora') ? 'text-highlight font-bold border-b-4 border-highlight' : 'text-gray-500 hover:text-black'} px-2 pt-1 text-sm uppercase tracking-wide transition-all duration-200 h-full flex items-center font-bold`}
              >
                Calculadora
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        <Outlet />
      </main>

      <footer className="bg-white text-center py-8 border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4">
            <h3 className="text-xl font-bold mb-2 text-gray-900">Zilinski Distribuidora</h3>
            <p className="text-gray-500 text-sm mb-4">Av. Maria Luiza Americano 1954, São Paulo – SP</p>
            <p className="text-gray-400 text-xs">
            &copy; {new Date().getFullYear()} Zilinski Distribuidora. Todos os direitos reservados.
            </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;