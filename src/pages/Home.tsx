import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-white py-20 lg:py-32 overflow-hidden border-b border-gray-100">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight mb-6">
            Escadas <span className="text-highlight">Sob Medida</span><br />
            Para o Seu Projeto
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500 mb-10 font-light">
            Qualidade, segurança e design em aço carbono. Calcule seu orçamento em segundos com nossa ferramenta exclusiva.
          </p>
          <div className="flex justify-center gap-4">
            <Link 
              to="/calculadora" 
              className="bg-highlight text-white font-bold py-4 px-8 rounded-lg text-lg hover:bg-yellow-600 transition-all shadow-lg transform hover:-translate-y-1"
            >
              Fazer Orçamento Agora
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Por que escolher a Zilinski?</h2>
            <p className="mt-4 text-gray-500">Compromisso com a excelência em cada degrau.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
              <div className="w-12 h-12 bg-highlight/10 rounded-full flex items-center justify-center mb-6 text-highlight">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Qualidade Garantida</h3>
              <p className="text-gray-500">
                Utilizamos aço carbono de alta resistência e corte a laser para garantir precisão milimétrica.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
              <div className="w-12 h-12 bg-highlight/10 rounded-full flex items-center justify-center mb-6 text-highlight">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Rapidez na Entrega</h3>
              <p className="text-gray-500">
                Processos otimizados e logística eficiente. Prazo médio de entrega de 20 dias úteis.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
              <div className="w-12 h-12 bg-highlight/10 rounded-full flex items-center justify-center mb-6 text-highlight">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h3m-3-10h.01M9 17h.01M12 17h.01M15 17h.01M9 14h.01M12 14h.01M15 14h.01M4 7h16a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V8a1 1 0 011-1z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Orçamento Instantâneo</h3>
              <p className="text-gray-500">
                Calcule custos e gere propostas técnicas em PDF automaticamente.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white border-t border-gray-100 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Pronto para transformar seu ambiente?</h2>
          <Link 
            to="/calculadora" 
            className="inline-block bg-highlight text-white font-bold py-3 px-10 rounded-full text-lg hover:bg-yellow-600 transition-all shadow-lg"
          >
            Acessar Calculadora
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;