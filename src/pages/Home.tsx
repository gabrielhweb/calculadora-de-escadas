
import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-white dark:bg-gray-900 py-20 lg:py-32 overflow-hidden border-b border-gray-100 dark:border-gray-800">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tight mb-6">
            Escadas <span className="text-highlight">Sob Medida</span><br />
            Para o Seu Projeto
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500 dark:text-gray-400 mb-10 font-light">
            Ferramenta profissional para cálculo, precificação e geração de contratos de escadas em aço carbono.
          </p>
          <div className="flex justify-center gap-4">
            <Link 
              to="/calculadora" 
              className="bg-highlight text-white font-bold py-4 px-8 rounded-lg text-lg hover:bg-yellow-600 transition-all shadow-lg transform hover:-translate-y-1 uppercase tracking-wider"
            >
              Iniciar Novo Orçamento
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-primary dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Funcionalidades do Sistema</h2>
            <p className="mt-4 text-gray-500 dark:text-gray-400">Otimize seu processo de vendas com nossas ferramentas.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow duration-300">
              <div className="w-12 h-12 bg-highlight/10 rounded-full flex items-center justify-center mb-6 text-highlight">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">PDF & Contratos</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Gere propostas comerciais detalhadas e contratos de venda preenchidos automaticamente prontos para assinatura.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow duration-300">
              <div className="w-12 h-12 bg-highlight/10 rounded-full flex items-center justify-center mb-6 text-highlight">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Logística Inteligente</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Cálculo automático de rotas, distâncias, pedágios e custo de combustível para entregas precisas.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow duration-300">
              <div className="w-12 h-12 bg-highlight/10 rounded-full flex items-center justify-center mb-6 text-highlight">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Configuração Total</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Suporte completo para Patamares, itens extras, e substituição manual de preços e medidas quando necessário.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Pronto para gerar um orçamento?</h2>
          <Link 
            to="/calculadora" 
            className="inline-block bg-highlight text-white font-bold py-3 px-10 rounded-full text-lg hover:bg-yellow-600 transition-all shadow-lg uppercase"
          >
            Acessar Calculadora
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
