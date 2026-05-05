
import React, { useState } from 'react';
import emailjs from '@emailjs/browser';
import { LandingInfo } from '../types';
import { generateTechnicalDataText, generateMaterialDataText, generateUnifiedTechnicalPDF } from '../utils/technicalPdfGenerator';

interface TechnicalBudgetProps {
  clientName: string;
  totalSteps: number;
  stepHeightCm: number;
  treadDepthCm: number;
  widthCm: number;
  totalLength: number;
  landings: LandingInfo[];
  stairDirection?: 'standard' | 'mirrored';
  wallFixation?: 'left' | 'right' | 'frontal';
  treadMaterial?: 'metal' | 'wood' | 'chapa_xadrez' | 'chapa_vazada';
  address?: string;
  zip?: string;
  optionalItems?: { id: string; name: string; price: number }[];
}

export const TechnicalBudget: React.FC<TechnicalBudgetProps> = (props) => {
  const {
    clientName,
    totalSteps,
    stepHeightCm,
    treadDepthCm,
    widthCm,
    totalLength,
    landings,
    stairDirection,
    wallFixation,
    treadMaterial,
    address,
    zip,
    optionalItems = []
  } = props;

  // Define o e-mail padrão que aparecerá no campo
  const [email, setEmail] = useState('zilinskidistribuidora@gmail.com');
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorDetails, setErrorDetails] = useState<string>('');

  // --- LÓGICA DE SERRALHERIA (CORTE A LASER) ---
  const generateTechnicalData = () => {
    return generateTechnicalDataText(props);
  };

  // --- LÓGICA DE MATÉRIA PRIMA (ESTIMATIVA) ---
  const generateMaterialData = () => {
      return generateMaterialDataText(props);
  };

  const handleDownloadPDF = () => {
      generateUnifiedTechnicalPDF(props);
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSending(true);
    setStatus('idle');
    setErrorDetails('');

    const technicalData = generateTechnicalData();

    // DADOS DO EMAILJS
    const SERVICE_ID = 'service_et2wtl7'; 
    const TEMPLATE_ID: string = 'COLE_SEU_NOVO_TEMPLATE_ID_AQUI'; 
    const PUBLIC_KEY = 'pNnojqJb7tjg3sjYV';

    if (TEMPLATE_ID === 'COLE_SEU_NOVO_TEMPLATE_ID_AQUI' || TEMPLATE_ID.includes('test-mail')) {
        setErrorDetails("Configuração de Email pendente. Use o botão de PDF acima.");
        setStatus('error');
        setIsSending(false);
        return;
    }

    try {
      await emailjs.send(SERVICE_ID, TEMPLATE_ID, { 
           to_email: email,
           message: technicalData,
           from_name: "Zilinski Sistema",
           reply_to: email
        }, PUBLIC_KEY);
      
      setStatus('success');
    } catch (error: any) {
      console.error('Erro ao enviar e-mail:', error);
      let msg = "Erro desconhecido.";
      if (error && typeof error === 'object') {
          if (error.text) msg = error.text;
          else if (error.message) msg = error.message;
          else msg = JSON.stringify(error);
      }
      setErrorDetails(msg);
      setStatus('error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-gray-800 text-white p-6 rounded-xl mt-8 border-2 border-gray-600">
      <div className="flex items-center gap-3 mb-4 border-b border-gray-600 pb-2">
        <span className="text-2xl">⚙️</span>
        <h2 className="text-xl font-black uppercase tracking-wide">Área Técnica (Produção)</h2>
      </div>
      
      <p className="text-sm text-gray-400 mb-6">
        Gere os relatórios técnicos para envio à fábrica.
      </p>

      <div className="mb-6">
          {/* BOTÃO DE DOWNLOAD PDF - UNIFICADO */}
          <button 
            onClick={() => handleDownloadPDF()}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 px-4 rounded-lg shadow-lg flex items-center justify-center gap-2 text-sm md:text-base border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 transition-all uppercase"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            BAIXAR FICHA TÉCNICA (PRODUÇÃO + MATÉRIA PRIMA)
          </button>
      </div>

      {/* ÁREA DE EMAIL (SECUNDÁRIA / COLAPSED) */}
      <details className="group border border-gray-600 rounded-lg p-3 bg-gray-700/30">
        <summary className="flex justify-between items-center font-bold cursor-pointer list-none text-gray-400 group-hover:text-white transition-colors">
            <span>✉️ Enviar Lista de Laser por E-mail</span>
            <span className="transition group-open:rotate-180">▼</span>
        </summary>
        
        <div className="mt-4 pt-4 border-t border-gray-600 animate-fade-in">
            <form onSubmit={handleSendEmail} className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">E-mail da Produção</label>
                <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="producao@zilinski.com.br"
                    className="w-full bg-gray-700 text-white p-3 rounded border border-gray-600 focus:border-highlight focus:outline-none font-mono"
                />
                </div>
                
                <button 
                type="submit" 
                disabled={isSending}
                className={`px-4 py-3 rounded font-bold uppercase transition-all shadow flex items-center gap-2 ${
                    isSending ? 'bg-gray-600 cursor-wait' : 'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
                >
                {isSending ? 'Enviando...' : 'Enviar'}
                </button>
            </form>

            {status === 'success' && (
                <div className="mt-2 text-green-400 text-xs font-bold">✅ E-mail enviado com sucesso.</div>
            )}
            
            {status === 'error' && (
                <div className="mt-2 text-red-400 text-xs font-bold">❌ {errorDetails}</div>
            )}
        </div>
      </details>

      {/* Preview do Conteúdo na Tela */}
      <div className="mt-6">
         <div className="text-xs font-bold text-gray-500 uppercase mb-2">Visualização (Lista Laser):</div>
         <pre className="text-sm text-green-400 bg-black p-4 rounded font-mono whitespace-pre-wrap leading-relaxed border border-gray-700 shadow-inner">
            {generateTechnicalData()}
         </pre>
      </div>
    </div>
  );
};
