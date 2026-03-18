
import React, { useState } from 'react';
import emailjs from '@emailjs/browser';
import jsPDF from 'jspdf';
import { LandingInfo } from '../types';

interface TechnicalBudgetProps {
  clientName: string;
  totalSteps: number;
  stepHeightCm: number;
  treadDepthCm: number;
  widthCm: number;
  totalLength: number; // NOVO
  landings: LandingInfo[];
  stairDirection?: 'standard' | 'mirrored';
  wallFixation?: 'left' | 'right' | 'frontal';
  treadMaterial?: 'metal' | 'wood';
  address?: string;
  zip?: string;
}

export const TechnicalBudget: React.FC<TechnicalBudgetProps> = ({
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
  zip
}) => {
  // Define o e-mail padrão que aparecerá no campo
  const [email, setEmail] = useState('zilinskidistribuidora@gmail.com');
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorDetails, setErrorDetails] = useState<string>('');

  // --- LÓGICA DE SERRALHERIA (CORTE A LASER) ---
  const generateTechnicalData = () => {
    const stepHeightMM = (stepHeightCm * 10).toFixed(1).replace('.0', '');
    const widthMM = (widthCm * 10).toFixed(0);
    const treadMM = (treadDepthCm * 10);
    
    // Regra: Se altura do degrau < 16cm, aumenta 0.5cm (5mm). Se >= 16cm, aumenta 1cm (10mm).
    const extraGapMM = stepHeightCm < 16 ? 5 : 10;
    const bodyTreadMM = treadMM + extraGapMM; 
    const bodyTreadStr = bodyTreadMM.toFixed(1).replace('.0', '');

    const stepTreadMM = treadMM;
    const stepTreadStr = stepTreadMM.toFixed(1).replace('.0', '');

    const numLandings = landings.length;
    const structureSteps = totalSteps - numLandings;

    let sideText = '';
    if (wallFixation === 'right') sideText = 'direito';
    else if (wallFixation === 'left') sideText = 'esquerdo';
    else sideText = 'frontal';

    const directionText = stairDirection === 'mirrored' ? 'esquerda' : 'direita';

    // --- MONTAGEM DO TEXTO ---
    let report = `Orçamento ${clientName}\n\n`;
    report += `2 corpo de escada com\n`;
    report += `${structureSteps} degraus com medidas de: ${stepHeightMM}mm de altura e pisante ${bodyTreadStr}mm\n`;
    
    // ADIÇÃO SOLICITADA: VAZADO PARA MADEIRA
    if (treadMaterial === 'wood') {
        report += `*** VAZADO PARA MADEIRA ***\n`;
    }

    report += `${structureSteps} degraus de ${stepTreadStr}mm x ${widthMM}mm\n`;
    if (sideText === 'frontal') {
        report += `Olhando de baixo para cima furos frontais\n`;
    } else {
        report += `Olhando de baixo para cima furos do lado ${sideText}\n`;
    }
    report += `Sentido da subida para a ${directionText}\n`;

    if (numLandings > 0) {
        report += `\nOrçamento ${clientName} 2\n`;
        landings.forEach((l) => {
            const lLen = (l.length * 10).toFixed(0);
            const lWidth = (l.width * 10).toFixed(0);
            
            if (l.type === 'fixed') {
                report += `1 patamar em chapa xadrez em 3mm com dobras de 100mm\n`;
                report += `Com medidas de ${lLen}mm x ${lWidth}mm\n`;
            } else {
                report += `1 patamar articulado\n`;
                report += `Com medidas de ${lLen}mm x ${lWidth}mm\n`;
            }
        });
    }

    return report;
  };

  // --- LÓGICA DE MATÉRIA PRIMA (ESTIMATIVA) ---
  const generateMaterialData = () => {
      const numSteps = totalSteps - landings.length;
      // const totalLengthM = totalLength / 100; // Removido conforme solicitado
      
      let report = `LISTA DE MATÉRIA PRIMA (ESTIMATIVA)\n`;
      report += `Cliente: ${clientName}\n`;
      if (address) report += `Endereço: ${address}\n`;
      if (zip) report += `CEP: ${zip}\n`;
      report += `Data: ${new Date().toLocaleDateString()}\n\n`;
      
      report += `ESTRUTURA PRINCIPAL:\n`;
      // report += `- Comprimento Total (Tubo Central): Aprox. ${totalLengthM.toFixed(2)} metros\n`; // REMOVIDO
      
      // CÁLCULO DE ÁREA DE CHAPA COM +5CM DE MARGEM
      const widthWithMargin = widthCm + 5;
      const depthWithMargin = treadDepthCm + 5;
      const areaPerStepM2 = (widthWithMargin / 100) * (depthWithMargin / 100);
      const totalAreaM2 = areaPerStepM2 * numSteps;

      // CÁLCULO DE VOLUME E PESO (Chapa 3mm = 0.003m)
      const thicknessM = 0.003;
      const density = 7840; // 7.84 g/cm³ = 7840 kg/m³

      // Unitários
      const volumePerStepM3 = areaPerStepM2 * thicknessM;
      const weightPerStepKg = volumePerStepM3 * density;

      // Totais
      const totalVolumeM3 = totalAreaM2 * thicknessM;
      const totalWeightKg = totalVolumeM3 * density;

      report += `- Quantidade Degraus (Suportes): ${numSteps} peças\n`;
      report += `- Altura Espelhos (Entre-degraus): ${stepHeightCm.toFixed(2)} cm\n`;
      report += `- Largura Escada: ${widthCm} cm\n`;
      report += `- Tamanho do Pisante: ${treadDepthCm.toFixed(2)} cm\n\n`;
      
      report += `DETALHAMENTO DE MATERIAL DOS DEGRAUS (CHAPA 3MM):\n`;
      report += `(Considerando margem de +5cm na largura e profundidade)\n`;
      report += `--------------------------------------------------\n`;
      report += `UNITÁRIO (Por Degrau):\n`;
      report += `- Área:   ${areaPerStepM2.toFixed(4)} m²\n`;
      report += `- Volume: ${volumePerStepM3.toFixed(6)} m³\n`;
      report += `- Peso:   ${weightPerStepKg.toFixed(3)} kg\n\n`;
      
      report += `TOTAL (${numSteps} Degraus):\n`;
      report += `- Área:   ${totalAreaM2.toFixed(2)} m²\n`;
      report += `- Volume: ${totalVolumeM3.toFixed(4)} m³\n`;
      report += `- Peso:   ${totalWeightKg.toFixed(2)} kg\n\n`;

      const hingesPerStep = treadDepthCm < 16 ? 2 : 4;
      const hingeSize = treadDepthCm < 16 ? "4x3" : "3x2,5/8";
      const totalHinges = hingesPerStep * numSteps;

      report += `Matéria: ${totalHinges} dobradiças de ${hingeSize} polegadas\n\n`;

      if (treadMaterial === 'wood') {
          report += `DEGRAUS DE MADEIRA:\n`;
          report += `- Largura do Degrau: ${(widthCm - 0.6).toFixed(2)} cm\n`;
          report += `- Comprimento do Degrau: ${(treadDepthCm - 0.6).toFixed(2)} cm\n`;
          report += `- Altura do Degrau: 2.3 cm\n\n`;
      }

      if (landings.length > 0) {
          report += `\nOrçamento ${clientName} 2\n`;
          landings.forEach((l) => {
              const lLen = (l.length * 10).toFixed(0);
              const lWidth = (l.width * 10).toFixed(0);
              
              if (l.type === 'fixed') {
                  report += `1 patamar em chapa xadrez em 3mm com dobras de 100mm\n`;
                  report += `Com medidas de ${lLen}mm x ${lWidth}mm\n`;
              } else {
                  report += `1 patamar articulado\n`;
                  report += `Com medidas de ${lLen}mm x ${lWidth}mm\n`;
              }
          });
          report += `\n`;
      }
      
      report += `OBSERVAÇÕES DE FÁBRICA:\n`;
      report += `- Conferir estoque de chapa xadrez.\n`;
      report += `- Verificar consumíveis de solda.\n`;
      
      return report;
  };

  const handleDownloadPDF = (type: 'laser' | 'material') => {
      const doc = new jsPDF();
      let text = "";
      let title = "";
      let filename = "";

      if (type === 'laser') {
          text = generateTechnicalData();
          title = "FICHA DE PRODUÇÃO - CORTE A LASER";
          filename = `producao_laser_${clientName.replace(/\s/g, '_').toLowerCase()}.pdf`;
      } else {
          text = generateMaterialData();
          title = "FICHA DE MATÉRIA PRIMA";
          filename = `materia_prima_${clientName.replace(/\s/g, '_').toLowerCase()}.pdf`;
      }

      // Configuração do PDF
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text(title, 105, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Cliente: ${clientName}`, 20, 35);
      doc.text(`Data: ${new Date().toLocaleDateString()}`, 20, 42);
      
      // Linha separadora
      doc.line(20, 48, 190, 48);

      // Conteúdo Técnico (Fonte Monospaced para alinhar números)
      doc.setFont('courier', 'bold'); 
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0); // Preto

      const splitText = doc.splitTextToSize(text, 170);
      doc.text(splitText, 20, 60);

      // Rodapé Técnico
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("Zilinski Distribuidora - Sistema de Controle de Produção", 105, 280, { align: 'center' });

      doc.save(filename);
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* BOTÃO DE DOWNLOAD PDF - LASER */}
          <button 
            onClick={() => handleDownloadPDF('laser')}
            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-4 px-4 rounded-lg shadow-lg flex items-center justify-center gap-2 text-sm md:text-base border-b-4 border-orange-800 active:border-b-0 active:translate-y-1 transition-all uppercase"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            FICHA LASER (Corte)
          </button>

          {/* BOTÃO DE DOWNLOAD PDF - MATÉRIA PRIMA */}
          <button 
            onClick={() => handleDownloadPDF('material')}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 px-4 rounded-lg shadow-lg flex items-center justify-center gap-2 text-sm md:text-base border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 transition-all uppercase"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            FICHA MATÉRIA PRIMA
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
