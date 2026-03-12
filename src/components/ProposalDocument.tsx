
import React, { useCallback, useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import { useNavigate } from 'react-router-dom';
import { ProposalOption, UserData, CalculatorInput } from '../types';
import { formatCurrencyBRL, generateProposalDescription } from '../utils';

interface ProposalDocumentProps {
  options: ProposalOption[];
  userData: UserData;
  inputData: CalculatorInput;
  freightCost: number;
  tollCost: number;
  installationCost: number;
  isTransportadora?: boolean;
  onBack?: () => void;
}

// --- INSTRUÇÕES ---
// 1. Gere o código da imagem em https://www.base64-image.de/
// 2. Cole o código GIGANTE dentro das aspas abaixo.
// (Usando um placeholder seguro para evitar conflitos de merge em strings muito longas)
const LOGO_BASE64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCABJAEkDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD6looooAKK8F8R/tIr4d/a30X4CaokNjo9/ou77VKMNNqc/wA8Cbj91NqMgx955B6V72eDg0AJRRR16CgAorwTQv2k1139rrVPgBpiQ3ukWminNzEuWh1SEGSdSw6psYIR2dPrXvdABRRRQAVzHxO8caR8Nvh9r/jnXpLqOw0mzaSVrVQ0y7iEVkBIBYM4Iye1dPXC/HTT59V+D3i7T7fwavixptMcNonnNE16gILIjqCyyBQWQgE7lXg0AfkZ8RNT8Qxrp9jrOutr0mmStLoHieC4LNcWbSF9hkPzgq5LhWw8bM6kYIx+hn7Fn7Vl18cNAufBPjJDJ418O2QnadMAarbKQvm+iyglVfsSwbjnH5neLLXRLLWJYdAsNd0+0Ln/AEPWFXz4G6FSyhQ+OmdqnjkV9Qf8E5fH3wy8C+PvFh8d61Y6NqGoaSi6dfXsoji8qNy9xEGPAcgIwHfYQOeKqwrntfx7/bQ+MXwd8daboU/wi0uz0m/ZVje5mnuriba6iURsoSNmG4YChhyOT0rpv2yf2tB8F/DNl4Y8Bkv4t8U2AvLa5kTA0yzkGFnKnrKeQinoQSegB+Gf2hfjvqHxz+NX/CW3uqCHQNLvEs9F2ROEtrFJs+bsPzFm5kbueBxgCvV/+CjHxA+Gfjvxr4PPgfW7DWtVsNJcapf2EgkhMUjK8ERYdWGZGIzlQ4B5pWBs8C+Hup+ILg6jYaRrh0ObVZFk1/xRcXDI1tZhxIUDg7iXkAdguXkZUUDGc/sJ8LPHei/E34d6D468PzXUthqtoGje6ULMxRjGxkAyAxZCTjjmvxV8K2ui3usRQa/Ya5f2m4MbTSFXz5m6BQzBgmc4ztY88Cv2X+A2nXGkfBzwlp1z4LTwk0OnKE0QTNM1lGWJRJHcBmlKkM5IB3M1DBHeUUUUhhSMGKsqOUYqQrgAlTjgjPHHWlooA/Ln9pX9l/45D4uNZWmpeK/ibc39qdQn1q4sHjt7VGZz5bSljGu1V3NjaoyMCvl37NLLDNcLA8kEDrHLKqExozZ2gt0BO1seuD6V+49n498BeIde1P4fWPi3Sb3WrOMpf6Ql0v2hEZeQY85I2nnGcZr4P/b1+A/g74SeAfCR+G9zp2h6JDdSx3GgNcE3V/cv929yxLzlVBjOeEBG3G5su4mj4lp5t5Y4I7loHSCZ2jSUoQjMuNwDdCRuUkdsj1rqF8CSH4hN4C+1TNIJGiEiwnzCwhMgXZ13Z+XFfVv7BXwH8H/FzwF4u/4WRc6frmiTXMUcGgLckXNjdJy178pDwFl/dgjhxu3ZwtO4kjiv2bv2Xfjifi4ljfah4r+GN3Y2w1C31qCwaWC4VWU+UsoYRtuVty5LKcEEV+o6hgih5C7AAM5ABY45Jxxz1rnr7x94B8N69pfgDUfGGk2WtXqLHYaTJdKLmRVXAAj6jgcZxntmuj+tSUJRRRQAUHODtxnHGRkZoooA+Bv2iPh14Vi+OMWm+N/jqvhiRhHrs3iXV9Tmk1G3ZyQIdPs7cKkEXygBnOcKfQZ9f/ZU+HNpLa+IviJ8QNGufGfjuw1SeztfE2ru066tZCNZbWSyEwxDG6SKCQOpPPUVr/tIa14h1LxVoHgKT4Q+NPEvglQmq+IrjQNKW5bUWRswadvZl2xF1Dzc5ICoBhjXvGkXv9p6RY6j/Zlzp32q2jm+x3MYjmttyg+U6DhWXOCBwCMUdAPyYl8KfEOb43DxgNN1D/hPAreO5NG8pvOFwNR3C1wAG/1OG9x7Gvtj9q74e2UNh4f+I3gPRrnwb47vdSgtbvxPpUhtl0iyMZlupL7yvlljRI2UZHJAwegPsf8Awp7wd/wuUfHbZdf8JMNH/sXPmjyDFn/WbcZ8zb8mc4x2zVn4xaXqGufCLxxomkWUt5fah4d1G2tbeJdzzTPbuqIo7sSQB70AfH37PPwm0C8+L13N4E+OkXiqK3lOrjxPpGsNHqryggCHUNPuCwngOSpkT1AJ54+7+cDOM45wMDNfNvgDTvF/j3WfhBN/wqHxB4Lj+G0BOravrltDaS3f+gi3NnbojmSRJHIdmYBQIx1NfSVNqz0AKKKKQBRRRQAtJRRQAUUUUALSUUUAFFFFAH//2Q=="; 

export const ProposalDocument: React.FC<ProposalDocumentProps> = ({ options, userData, inputData, freightCost, tollCost, installationCost, isTransportadora, onBack }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Estado para controlar quais opções serão impressas no PDF
  const [selectedOptionIndices, setSelectedOptionIndices] = useState<number[]>([]);
  
  // Estado para descrições editáveis
  const [optionDescriptions, setOptionDescriptions] = useState<{ [key: number]: string }>({});
  const [editingOptionId, setEditingOptionId] = useState<number | null>(null);

  // Sincroniza o estado quando as opções mudam
  useEffect(() => {
      setSelectedOptionIndices(options.map(o => o.optionNumber));
      
      const initialDescs: { [key: number]: string } = {};
      options.forEach(opt => {
          initialDescs[opt.optionNumber] = generateProposalDescription(inputData, opt);
      });
      setOptionDescriptions(initialDescs);
  }, [options, inputData]);

  const navigate = useNavigate();

  const toggleOptionSelection = (optionNum: number) => {
      setSelectedOptionIndices(prev => {
          if (prev.includes(optionNum)) {
              return prev.filter(n => n !== optionNum);
          } else {
              return [...prev, optionNum].sort();
          }
      });
  };

  const createPdfDoc = useCallback(() => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const pageMargin = 20; 
    let currentY = 20;

    // --- LOGO ---
    if (LOGO_BASE64 && LOGO_BASE64.length > 100) {
        try { 
            const cleanBase64 = LOGO_BASE64.includes('base64,') 
                ? LOGO_BASE64.split('base64,')[1] 
                : LOGO_BASE64;
            doc.addImage(cleanBase64, 'JPEG', (pageWidth / 2) - 15, currentY, 30, 30); 
            currentY += 35;
        } catch (e) {
            console.error("Erro ao gerar imagem no PDF.", e);
            doc.setFontSize(10);
            doc.text('ZILINSKI', (pageWidth / 2), currentY + 15, { align: 'center' });
            currentY += 25;
        }
    } else {
        // Fallback textual
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0); 
        doc.text('ZILINSKI', (pageWidth / 2), currentY + 10, { align: 'center' });
        currentY += 20;
    }

    // --- CABEÇALHO COMPACTADO ---
    doc.setTextColor(0, 0, 0); // Garante preto
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Zilinski Distribuidora', pageWidth / 2, currentY, { align: 'center' });
    currentY += 6; // Menos espaço

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Av. Maria Luiza Americano 1954, São Paulo –SP Tel.:019 992237714', pageWidth / 2, currentY, { align: 'center' });
    currentY += 12; // Menos espaço

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ORÇAMENTO', pageWidth / 2, currentY, { align: 'center' });
    currentY += 10;

    // --- DADOS DO CLIENTE E DATA ---
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const currentDate = new Date().toLocaleDateString('pt-BR');
    doc.text(`Data: ${currentDate}`, pageWidth - pageMargin, currentY, { align: 'right' });
    
    doc.text(`Cliente: ${userData.name}`, pageMargin, currentY);
    currentY += 5;
    
    if (userData.street) {
        doc.text(`Endereço: ${userData.street}, ${userData.number} - ${userData.neighborhood}, ${userData.city} - ${userData.state}`, pageMargin, currentY);
        currentY += 5;
    } else if (userData.address && userData.address !== 'Endereço não informado') {
        doc.text(`Endereço: ${userData.address}`, pageMargin, currentY);
        currentY += 5;
    } else {
        doc.text(`Endereço: Não informado`, pageMargin, currentY);
        currentY += 5;
    }
    
    if (userData.zip) {
        doc.text(`CEP: ${userData.zip}`, pageMargin, currentY);
        currentY += 10;
    } else {
        currentY += 5;
    }

    const extrasCost = inputData.optionalItems.reduce((acc, item) => acc + item.price, 0);

    // FILTRA AS OPÇÕES SELECIONADAS PELO USUÁRIO
    const optionsToPrint = options.filter(o => selectedOptionIndices.includes(o.optionNumber));

    // --- OPÇÕES ---
    optionsToPrint.forEach((opt) => {
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        
        // USA O TEXTO PERSONALIZADO
        const fullDescription = optionDescriptions[opt.optionNumber] || "";
        const lines = doc.splitTextToSize(fullDescription, pageWidth - (pageMargin * 2));
        
        // --- CÁLCULO DE ESPAÇO APENAS DO TEXTO ---
        let textBlockHeight = 6; // Título
        textBlockHeight += (lines.length * 5) + 2;
        textBlockHeight += 6; // Preço Escada
        if (opt.landings.length > 0) textBlockHeight += 5 + (opt.landings.length * 6); 
        textBlockHeight += 6; // Frete
        textBlockHeight += 6; // Instalação
        if (inputData.optionalItems.length > 0) textBlockHeight += (inputData.optionalItems.length * 6);
        textBlockHeight += 6; // Total
        textBlockHeight += 10; // Espaço Extra

        const pageLimit = pageHeight - pageMargin;

        // SE O TEXTO NÃO CABE, QUEBRA A PÁGINA ANTES
        if (currentY + textBlockHeight > pageLimit) {
             doc.addPage();
             currentY = 20;
        }

        // --- RENDERIZAÇÃO DO TEXTO ---

        // Título da Opção
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`Opção ${opt.optionNumber}`, pageMargin, currentY);
        currentY += 6;

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        
        // Descrição Completa
        doc.text(lines, pageMargin, currentY);
        currentY += (lines.length * 5) + 5;

        // --- LISTA DE PREÇOS ---
        // ... (rest of the function remains mostly same)

        const landingsPrice = opt.landings.reduce((acc, l) => acc + l.price, 0);
        const structureOnly = opt.totalPrice - landingsPrice;
        
        // Valor da Escada
        const escadaText = `-Valor Escada (${opt.structureSteps} degraus):`;
        const escadaPrice = formatCurrencyBRL(structureOnly);
        doc.setFont('helvetica', 'normal');
        doc.text(escadaText, pageMargin, currentY);
        doc.text(escadaPrice, pageWidth - pageMargin, currentY, { align: 'right' }); // Preço na direita
        currentY += 6;
        
        // Patamares
        if (opt.landings.length > 0) {
            // Se tiver múltiplos, mostra a soma primeiro, alinhada à direita
            if (opt.landings.length > 1) {
                // Mantém um pequeno recuo visual apenas se for um grupo, mas alinhado corretamente
                doc.text(`  • Soma de ${opt.landings.length} Patamares:`, pageMargin, currentY);
                doc.text(formatCurrencyBRL(landingsPrice), pageWidth - pageMargin, currentY, { align: 'right' });
                currentY += 6;
            }

            opt.landings.forEach((landing) => {
                const lM = (landing.length / 100).toFixed(2).replace('.', ',');
                const wM = (landing.width / 100).toFixed(2).replace('.', ',');
                
                // LÓGICA DO TIPO DE PATAMAR (FIXO ou ARTICULADO)
                // Se não estiver definido, assume ARTICULADO por segurança/padrão
                let typeText = " ARTICULADO"; 
                if (landing.type === 'fixed') typeText = " FIXO";
                
                let guardText = "";
                if (landing.hasSideGuardrail && landing.hasFrontGuardrail) guardText = " + GC Lat/Front";
                else if (landing.hasSideGuardrail) guardText = " + GC Lateral";
                else if (landing.hasFrontGuardrail) guardText = " + GC Frontal";

                let flushText = landing.isFlushWithSlab ? " (Rente)" : "";

                // Monta a linha com o tipo explícito
                // CORREÇÃO: Removemos a indentação (espaços) do início da string
                const description = `- Patamar${typeText}: ${lM}m x ${wM}m${guardText}${flushText}`;
                const price = formatCurrencyBRL(landing.price);
                
                // Calcula espaço disponível para o texto (total - margens - espaço pro preço - folga)
                const availableWidth = pageWidth - (pageMargin * 2) - 40; 
                
                const splitDesc = doc.splitTextToSize(description, availableWidth);
                doc.text(splitDesc, pageMargin, currentY);
                
                // Imprime o preço alinhado à direita na mesma linha do início da descrição
                doc.text(price, pageWidth - pageMargin, currentY, { align: 'right' });
                
                currentY += (splitDesc.length * 5) + 1;
            });
        }

        currentY += 1;

        // Frete
        if (freightCost + tollCost > 0) {
            doc.text(`- Frete${isTransportadora ? ' (Transportadora)**' : ''}:`, pageMargin, currentY);
            doc.text(formatCurrencyBRL(freightCost + tollCost), pageWidth - pageMargin, currentY, { align: 'right' });
        } else {
            doc.setTextColor(0, 0, 0); 
            doc.text(`- Frete:`, pageMargin, currentY);
            doc.setFont('helvetica', 'bold');
            doc.text(`POR CONTA DO CLIENTE`, pageWidth - pageMargin, currentY, { align: 'right' });
            doc.setFont('helvetica', 'normal');
        }
        currentY += 6;

        // Instalação
        if (installationCost > 0) {
             doc.text(`-Instalação (Local fácil acesso)*:`, pageMargin, currentY);
             doc.text(formatCurrencyBRL(installationCost), pageWidth - pageMargin, currentY, { align: 'right' });
        } else {
             doc.text(`-Instalação*:`, pageMargin, currentY);
             doc.setFont('helvetica', 'bold');
             doc.text(`A confirmar`, pageWidth - pageMargin, currentY, { align: 'right' });
             doc.setFont('helvetica', 'normal');
        }
        currentY += 6;

        // Extras
        if (inputData.optionalItems.length > 0) {
            inputData.optionalItems.forEach(item => {
                doc.text(`- ${item.name}:`, pageMargin, currentY);
                doc.text(formatCurrencyBRL(item.price), pageWidth - pageMargin, currentY, { align: 'right' });
                currentY += 6;
            });
        }

        // TOTAL
        currentY += 2;
        const totalGeral = opt.totalPrice + freightCost + tollCost + installationCost + extrasCost;
        doc.setFont('helvetica', 'bold');
        doc.text(`Total:`, pageMargin, currentY);
        doc.text(formatCurrencyBRL(totalGeral), pageWidth - pageMargin, currentY, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        
        currentY += 10; 

        // --- INSERÇÃO DE IMAGENS ---
        // Verificamos imagens individualmente. Se não couber na página atual (que já tem o texto),
        // joga SÓ A IMAGEM pra próxima página.
        let imagesForOption: { title: string; imgData: string; width?: number; height?: number }[] = [];
        if (userData.drawingImages) {
             imagesForOption = userData.drawingImages.filter(img => img.title.includes(`Opção ${opt.optionNumber}`));
        }
        
        const fixedDisplayWidth = 150; 
        
        imagesForOption.forEach(img => {
            let currentImgHeight = 100; // Fallback
            if (img.width && img.height) {
                const ratio = img.height / img.width;
                currentImgHeight = fixedDisplayWidth * ratio;
            }

            const xPos = (pageWidth - fixedDisplayWidth) / 2;

            // Lógica de Quebra para Imagem
            if (currentY + currentImgHeight + 20 > pageLimit) {
                doc.addPage();
                currentY = 20;
            }

            // Título Imagem
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0); // Preto
            const titleWidth = doc.getTextWidth(img.title);
            doc.text(img.title, (pageWidth - titleWidth) / 2, currentY);
            currentY += 4;
            
            // Desenha Imagem
            try {
                doc.addImage(img.imgData, 'PNG', xPos, currentY, fixedDisplayWidth, currentImgHeight);
                currentY += currentImgHeight + 10;
            } catch (e) {
                console.error("Erro ao adicionar imagem ao PDF", e);
            }
        });

        currentY += 10; // Espaço final entre opções
    });

    // --- RODAPÉ ---
    if (currentY > 200) { doc.addPage(); currentY = 20; }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('-Acabamento: fundo prime', pageMargin, currentY);
    currentY += 6;

    doc.text('-Capacidade máxima por degrau: 180 quilos', pageMargin, currentY);
    currentY += 6;
    doc.text('-Capacidade máxima da escada: 360 quilos', pageMargin, currentY);
    currentY += 10;

    doc.text('Formas de pagamento:', pageMargin, currentY);
    currentY += 6;
    
    doc.setFont('helvetica', 'bold');
    doc.text('À vista: 5% de desconto, sendo 50% sinal restante e restante no dia da entrega', pageMargin, currentY);
    currentY += 6;

    doc.text('À prazo em até 12x via Link de Pagamento no Cartão de Crédito (juros conforme quantidade de vezes', pageMargin, currentY);
    currentY += 5;
    doc.text('e operadora)', pageMargin, currentY);
    currentY += 8;

    // --- NOTAS DE RODAPÉ ---
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text('* Se for um local de difícil instalação (ex: necessidade de içamento), haverá custo adicional.', pageMargin, currentY);
    currentY += 5;
    if (isTransportadora) {
        doc.text('** O valor do frete via transportadora pode sofrer variações.', pageMargin, currentY);
        currentY += 5;
    }
    
    currentY += 3;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);

    const obsText = 'OBSERVAÇÃO: o prumo da parede é essencial que esteja correta pois pode atrapalhar a instalação e o bom funcionamento da escada.';
    const splitObs = doc.splitTextToSize(obsText, pageWidth - (pageMargin * 2));
    doc.text(splitObs, pageMargin, currentY);
    currentY += (splitObs.length * 5) + 8;

    doc.text('Prazo de entrega: 20 dias úteis após pagamento do sinal.', pageMargin, currentY);
    currentY += 8;

    doc.text('Transferência via pix chave Cnpj: 28.869.537/0001-01 P G Zilinski ME', pageMargin, currentY);

    return doc;
  }, [options, userData, inputData, freightCost, tollCost, installationCost, selectedOptionIndices]);

  const handleDownload = () => {
    if (selectedOptionIndices.length === 0) {
        alert("Por favor, selecione pelo menos uma opção para incluir no PDF.");
        return;
    }

    setIsGenerating(true);
    setTimeout(() => {
        try {
            const doc = createPdfDoc();
            doc.save(`orcamento_${userData.name.toLowerCase().replace(/\s/g, '_')}.pdf`);
        } catch (error) {
            console.error("Erro fatal ao salvar PDF", error);
            alert("Ocorreu um erro ao gerar o PDF.");
        } finally {
            setIsGenerating(false);
        }
    }, 100);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border border-gray-100 dark:border-gray-700 text-center space-y-8">
      <div className="flex justify-start">
         <button onClick={onBack} className="text-sm font-bold text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white flex items-center gap-1 uppercase underline">
            Voltar e Editar
         </button>
      </div>

      <div className="max-w-md mx-auto bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-600">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-4 uppercase">Proposta Pronta</h2>
          
          <div className="mb-4 text-left bg-white dark:bg-gray-800 p-4 rounded border border-gray-200 dark:border-gray-600">
            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase border-b border-gray-100 dark:border-gray-700 pb-1">Selecione as opções no PDF:</h4>
            {options.map(opt => (
                <div key={opt.optionNumber} className="mb-2 border-b border-gray-100 dark:border-gray-700 pb-2 last:border-0">
                    <div className="flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 p-1 rounded">
                        <label className="flex items-center gap-2 cursor-pointer flex-1">
                           <input 
                                type="checkbox" 
                                checked={selectedOptionIndices.includes(opt.optionNumber)} 
                                onChange={() => toggleOptionSelection(opt.optionNumber)} 
                                className="w-5 h-5 accent-highlight rounded cursor-pointer"
                           />
                           <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                               Opção {opt.optionNumber} ({opt.steps} peças - {formatCurrencyBRL(opt.totalPrice)})
                           </span>
                        </label>
                        <button 
                            onClick={(e) => { e.preventDefault(); setEditingOptionId(editingOptionId === opt.optionNumber ? null : opt.optionNumber); }}
                            className="text-xs text-blue-500 hover:text-blue-700 underline ml-2 whitespace-nowrap"
                        >
                            {editingOptionId === opt.optionNumber ? 'Fechar' : 'Editar Texto'}
                        </button>
                    </div>
                    
                    {editingOptionId === opt.optionNumber && (
                        <textarea
                            value={optionDescriptions[opt.optionNumber] || ''}
                            onChange={(e) => setOptionDescriptions({ ...optionDescriptions, [opt.optionNumber]: e.target.value })}
                            className="w-full h-32 p-2 mt-2 text-xs border rounded bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:outline-none focus:border-highlight resize-y"
                            placeholder="Edite a descrição desta opção..."
                        />
                    )}
                </div>
            ))}
          </div>

          <button onClick={handleDownload} disabled={isGenerating || selectedOptionIndices.length === 0} className={`w-full font-black py-4 rounded shadow-lg uppercase tracking-widest transition-all ${selectedOptionIndices.length === 0 ? 'bg-gray-300 cursor-not-allowed text-gray-500' : 'bg-highlight text-white hover:bg-yellow-600'}`}>
              {isGenerating ? 'Gerando...' : 'Baixar Orçamento PDF'}
          </button>
      </div>

      <div className="max-w-md mx-auto bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-black text-blue-900 dark:text-blue-300 mb-4">Finalizar Venda</h3>
          <div className="grid grid-cols-1 gap-2">
            {options.map(o => (
                <button key={o.optionNumber} onClick={() => navigate('/contrato', { state: { userData, selectedOption: o, inputData, freightCost, tollCost, installationCost, extrasCost: inputData.optionalItems.reduce((a, b) => a + b.price, 0) } })} className="bg-white dark:bg-gray-800 border-2 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 font-bold py-3 rounded hover:bg-blue-600 hover:text-white dark:hover:bg-blue-700 dark:hover:text-white transition-all">
                    Contrato Opção {o.optionNumber}
                </button>
            ))}
          </div>
      </div>
    </div>
  );
};

export default ProposalDocument;
