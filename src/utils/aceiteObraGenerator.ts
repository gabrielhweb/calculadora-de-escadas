import { jsPDF } from 'jspdf';
import { ContractData } from './contractGenerator';

export const generateAceiteObraPDF = (data: ContractData) => {
  const doc = new jsPDF();
  const margin = 20;
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  let currentY = margin;

  const addText = (text: string, size: number = 11, isBold: boolean = false, align: 'left' | 'center' | 'right' | 'justify' = 'left') => {
      doc.setFontSize(size);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');

      if (align === 'justify') {
          const splitText = doc.splitTextToSize(text, pageWidth - (margin * 2));
          
          if (currentY + (splitText.length * 6) > pageHeight - margin) {
              doc.addPage();
              currentY = 20;
          }
          
          splitText.forEach((line: string) => {
              if (currentY > pageHeight - margin) {
                  doc.addPage();
                  currentY = 20;
              }
              doc.text(line, margin, currentY, { align: 'left', maxWidth: pageWidth - (margin * 2) });
              currentY += 6;
          });
      } else {
          doc.text(text, align === 'center' ? pageWidth / 2 : (align === 'right' ? pageWidth - margin : margin), currentY, { align });
          currentY += 6;
      }
  };

  currentY += 10;
  addText('TERMO DE RECEBIMENTO E ACEITE DE OBRA', 14, true, 'center');
  currentY += 10;

  addText('CONTRATADA: Zilinski Distribuidora, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº 28.869.537/0001-01, com sede na Av. Maria Luiza Americano 1954, bairro Cidade Líder, na cidade de São Paulo/SP, CEP 08275-000, neste ato devidamente constituída por seu representante legal Paulo Gatto Zilinski.', 11, false, 'justify');
  
  currentY += 5;
  const isPJ = data.userData?.cpf?.length === 18;
  const nomeCliente = data.userData?.name || '';
  const cpfCnpjCliente = data.userData?.cpf || '';
  const enderecoCliente = data.userData?.address || '';
  
  addText(`CONTRATANTE: ${nomeCliente}, portador(a) do CPF/CNPJ nº ${cpfCnpjCliente}, residente e domiciliado(a) em ${enderecoCliente}.`, 11, false, 'justify');
  
  currentY += 5;
  addText('As partes acima qualificadas, em referência ao serviço de instalação prestado pela CONTRATADA para o(a) CONTRATANTE, formalizam o presente Termo de Recebimento e Aceite de Obra, que se regerá pelas seguintes cláusulas:', 11, false, 'justify');

  currentY += 10;
  addText('CLÁUSULA PRIMEIRA – DO OBJETO', 11, true, 'left');
  
  let descricaoEscada = '';
  if (data.selectedOption) {
      descricaoEscada = `escada com largura de ${data.selectedOption.stairWidth}cm, comprimento projetado de ${Math.round(data.selectedOption.totalLength)}cm e ${data.selectedOption.steps} degraus`;
  } else {
      descricaoEscada = `escada conforme especificações do contrato`;
  }

  addText(`1.1. O presente termo tem como objeto a formalização da entrega e aceitação do serviço de fabricação e instalação de uma ${descricaoEscada}, realizado no imóvel localizado em ${enderecoCliente}, conforme contrato de prestação de serviços.`, 11, false, 'justify');
  
  currentY += 5;
  addText('CLÁUSULA SEGUNDA – DA VISTORIA E DO ACEITE', 11, true, 'left');
  addText('2.1. O(A) CONTRATANTE declara, para todos os fins de direito, que nesta data realizou a vistoria completa do serviço descrito na Cláusula Primeira e atesta que o mesmo foi executado em sua totalidade, em conformidade com as especificações técnicas acordadas e em perfeitas condições de uso e acabamento.', 11, false, 'justify');
  addText('2.2. Em razão do exposto, o(a) CONTRATANTE manifesta seu ACEITE, recebendo a obra de forma definitiva e irrevogável, nada tendo a reclamar ou opor quanto à qualidade, estética ou funcionalidade do serviço executado.', 11, false, 'justify');

  currentY += 5;
  addText('CLÁUSULA TERCEIRA – DA QUITAÇÃO DO SERVIÇO', 11, true, 'left');
  addText('3.1. Com o aceite formalizado neste termo, a CONTRATADA cumpre integralmente sua obrigação de fazer, referente à execução do serviço.', 11, false, 'justify');

  currentY += 5;
  addText('CLÁUSULA QUARTA – DO INÍCIO DA GARANTIA', 11, true, 'left');
  addText('4.1. As partes acordam que a data de assinatura deste termo será considerada, para todos os efeitos legais, como o marco inicial para a contagem dos prazos de garantia, tanto a legal, prevista no Art. 26, II, do Código de Defesa do Consumidor, quanto a contratual, se aplicável.', 11, false, 'justify');

  currentY += 10;
  addText('E, por estarem justas e acordadas, as partes assinam o presente termo em 2 (duas) vias de igual teor e forma.', 11, false, 'justify');

  currentY += 5;
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const city = data.userData?.city || 'São Paulo';
  addText(`${city}, ${dateStr}.`, 11, false, 'left');

  currentY += 25;

  // --- ASSINATURAS ---
  if (currentY + 60 > pageHeight - margin) { doc.addPage(); currentY = 40; }
  
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 5;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Zilinski Distribuidora', pageWidth / 2, currentY, { align: 'center' });
  currentY += 5;
  doc.setFont('helvetica', 'normal');
  doc.text('(Contratada)', pageWidth / 2, currentY, { align: 'center' });
  
  currentY += 25;

  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 5;
  doc.setFont('helvetica', 'bold');
  doc.text(nomeCliente || 'Cliente', pageWidth / 2, currentY, { align: 'center' });
  currentY += 5;
  doc.setFont('helvetica', 'normal');
  doc.text('(Contratante)', pageWidth / 2, currentY, { align: 'center' });

  doc.save(`aceite_obra_${(nomeCliente || 'cliente').toLowerCase().replace(/\s/g, '_')}.pdf`);
};
