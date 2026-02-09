import React, { useState } from 'react';
import emailjs from '@emailjs/browser';
import { LandingInfo } from '../types';

interface TechnicalBudgetProps {
  clientName: string;
  totalSteps: number;
  stepHeightCm: number;
  treadDepthCm: number;
  widthCm: number;
  landings: LandingInfo[];
  stairDirection?: 'standard' | 'mirrored';
}

export const TechnicalBudget: React.FC<TechnicalBudgetProps> = ({
  clientName,
  totalSteps,
  stepHeightCm: stepHeightCm,
  treadDepthCm: treadDepthCm,
  widthCm,
  landings,
  stairDirection
}) => {
  // Ajuste: E-mail padrão definido para zilinskidistribuidora@gmail.com
  const [email, setEmail] = useState('zilinskidistribuidora@gmail.com');
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // --- LÓGICA DE SERRALHERIA (Conversão e Ajustes) ---
  const generateTechnicalData = () => {
    // 1. Conversão para Milímetros e Formatação
    const stepHeightMM = (stepHeightCm * 10).toFixed(1).replace('.0', '');
    const widthMM = (widthCm * 10).toFixed(0);
    const treadMM = (treadDepthCm * 10);
    
    // 2. Ajustes de Medidas
    
    // A) Corpo da Escada (Lateral)
    // Regra: Se altura do degrau < 16cm, aumenta 0.5cm (5mm). Se >= 16cm, aumenta 1cm (10mm).
    const extraGapMM = stepHeightCm < 16 ? 5 : 10;
    const bodyTreadMM = treadMM + extraGapMM; 
    const bodyTreadStr = bodyTreadMM.toFixed(1).replace('.0', '');

    // B) Degraus (Peças individuais): Medida exata sem folga adicional
    const stepTreadMM = treadMM;
    const stepTreadStr = stepTreadMM.toFixed(1).replace('.0', '');

    const numLandings = landings.length;
    const structureSteps = totalSteps - numLandings;

    // Lógica do Lado (Espelhado = Esquerda, Padrão = Direita)
    const sideText = stairDirection === 'mirrored' ? 'esquerdo' : 'direito';

    // --- MONTAGEM DO TEXTO (NOVO FORMATO SERRALHERIA) ---
    
    // Parte 1: Corpo da Escada
    let report = `Orçamento ${clientName}\n`;
    report += `2 corpo de escada com\n`;
    report += `${structureSteps} degraus  com medidas de:${stepHeightMM}mm de altura e pisante ${bodyTreadStr}mm\n`;
    report += `${structureSteps} degraus de ${stepTreadStr}mm x ${widthMM}mm\n`;
    report += `Olhando de baixo para cima furos do lado ${sideText}\n`;

    // Parte 2: Patamares (Se houver)
    if (numLandings > 0) {
        report += `\nOrçamento ${clientName} 2\n`;
        landings.forEach((l) => {
            const lLen = (l.length * 10).toFixed(0);
            const lWidth = (l.width * 10).toFixed(0);
            
            report += `1 patamar em chapa xadrez em 3mm com dobras de 100mm\n`;
            report += `Com medidas de ${lLen}mm x ${lWidth}mm\n`;
        });
    }

    return report;
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSending(true);
    setStatus('idle');

    const technicalData = generateTechnicalData();

    try {
      // =================================================================================
      // ENVIO REAL CONFIGURADO (Baseado no seu print)
      // =================================================================================
      
      await emailjs.send(
        'service_qoxzc9l',           // Service ID (Do seu print)
        '_ejs-test-mail-service_',   // Template ID (Do seu print)
        { 
           to_email: email,          // Variável para o destinatário
           message: technicalData    // O texto técnico
        }, 
        'COLE_SUA_PUBLIC_KEY_AQUI'   // <--- IMPORTANTE: Pegue isso em Account -> Public Key no site EmailJS
      );
      
      console.log("E-mail enviado com sucesso!");
      setStatus('success');

    } catch (error) {
      console.error('Erro ao enviar e-mail:', error);
      setStatus('error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-gray-800 text-white p-6 rounded-xl mt-8 border-2 border-gray-600">
      <div className="flex items-center gap-3 mb-4 border-b border-gray-600 pb-2">
        <span className="text-2xl">⚙️</span>
        <h2 className="text-xl font-black uppercase tracking-wide">Parte Técnica Corte a Laser</h2>
      </div>
      
      <p className="text-sm text-gray-400 mb-4">
        Gera a lista de corte no padrão exato da serralheria (mm + folgas condicionais).
      </p>

      <form onSubmit={handleSendEmail} className="flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">E-mail da Produção</label>
          <input 
            type="email" 
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="zilinskidistribuidora@gmail.com"
            className="w-full bg-gray-700 text-white p-3 rounded border border-gray-600 focus:border-highlight focus:outline-none font-mono"
          />
        </div>
        
        <button 
          type="submit" 
          disabled={isSending}
          className={`px-6 py-3 rounded font-bold uppercase transition-all shadow-lg flex items-center gap-2 ${
            isSending ? 'bg-gray-600 cursor-wait' : 'bg-blue-600 hover:bg-blue-500 text-white'
          }`}
        >
          {isSending ? 'Enviando...' : 'Enviar Orçamento Técnico'}
        </button>
      </form>

      {status === 'success' && (
        <div className="mt-4 p-3 bg-green-900/50 border border-green-700 text-green-300 rounded text-sm font-bold flex items-center gap-2">
          ✅ Sucesso! A lista técnica foi enviada para o e-mail.
        </div>
      )}
      
      {status === 'error' && (
        <div className="mt-4 p-3 bg-red-900/50 border border-red-700 text-red-300 rounded text-sm font-bold">
          ❌ Erro ao enviar. Verifique se você colocou a Public Key correta no código.
        </div>
      )}

      {/* Preview Rápido (apenas visual para conferência) */}
      <div className="mt-6 pt-4 border-t border-gray-700">
         <details className="cursor-pointer" open>
            <summary className="text-xs font-bold text-gray-500 hover:text-white uppercase select-none">Ver Preview (Padrão Serralheria)</summary>
            <pre className="mt-2 text-sm text-gray-300 bg-black p-4 rounded font-mono whitespace-pre-wrap leading-relaxed border border-gray-700">
                {generateTechnicalData()}
            </pre>
         </details>
      </div>
    </div>
  );
};
