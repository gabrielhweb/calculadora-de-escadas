import { jsPDF } from 'jspdf';
import { ContractData } from './contractGenerator';

export const generateAceiteObraPDF = (data: ContractData) => {
  const doc = new jsPDF();
  const margin = 20;
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  let currentY = margin;

  const addText = (text: string, size: number = 9, isBold: boolean = false, align: 'left' | 'center' | 'right' | 'justify' = 'left') => {
      doc.setFontSize(size);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');

      if (align === 'justify') {
          const splitText = doc.splitTextToSize(text, pageWidth - (margin * 2));
          
          if (currentY + (splitText.length * 5) > pageHeight - margin) {
              doc.addPage();
              currentY = 20;
          }
          
          splitText.forEach((line: string) => {
              if (currentY > pageHeight - margin) {
                  doc.addPage();
                  currentY = 20;
              }
              doc.text(line, margin, currentY, { align: 'left', maxWidth: pageWidth - (margin * 2) });
              currentY += 5;
          });
      } else {
          doc.text(text, align === 'center' ? pageWidth / 2 : (align === 'right' ? pageWidth - margin : margin), currentY, { align });
          currentY += 5;
      }
  };

  currentY += 8;
  addText('TERMO DE RECEBIMENTO E ACEITE DE OBRA', 12, true, 'center');
  currentY += 8;

  addText('CONTRATADA: Zilinski Distribuidora, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº 28.869.537/0001-01, com sede na Av. Maria Luiza Americano 1954, bairro Cidade Líder, na cidade de São Paulo/SP, CEP 08275-000, neste ato devidamente constituída por seu representante legal Paulo Gatto Zilinski.', 9, false, 'justify');
  
  currentY += 4;
  const isPJ = data.userData?.cpf?.length === 18;
  const nomeCliente = data.userData?.name || '';
  const cpfCnpjCliente = data.userData?.cpf || '';
  const enderecoCliente = data.userData?.address || '';
  
  addText(`CONTRATANTE: ${nomeCliente}, portador(a) do CPF/CNPJ nº ${cpfCnpjCliente}, residente e domiciliado(a) em ${enderecoCliente}.`, 9, false, 'justify');
  
  currentY += 4;
  addText('As partes acima qualificadas, em referência ao serviço de instalação prestado pela CONTRATADA para o(a) CONTRATANTE, formalizam o presente Termo de Recebimento e Aceite de Obra, que se regerá pelas seguintes cláusulas:', 9, false, 'justify');

  currentY += 8;
  addText('CLÁUSULA PRIMEIRA – DO OBJETO', 9, true, 'left');
  
  let descricaoEscada = '';
  if (data.selectedOption) {
      descricaoEscada = `escada com largura de ${data.selectedOption.stairWidth}cm, comprimento projetado de ${Math.round(data.selectedOption.totalLength)}cm e ${data.selectedOption.steps} degraus`;
  } else {
      descricaoEscada = `escada conforme especificações do contrato`;
  }

  addText(`1.1. O presente termo tem como objeto a formalização da entrega e aceitação do serviço de fabricação e instalação de uma ${descricaoEscada}, realizado no imóvel localizado em ${enderecoCliente}, conforme contrato de prestação de serviços.`, 9, false, 'justify');
  
  currentY += 3;
  addText('CLÁUSULA SEGUNDA – DA VISTORIA E DO ACEITE', 9, true, 'left');
  addText('2.1. O(A) CONTRATANTE declara, para todos os fins de direito, que nesta data realizou a vistoria completa do serviço descrito na Cláusula Primeira e atesta que o mesmo foi executado em sua totalidade, em conformidade com as especificações técnicas acordadas e em perfeitas condições de uso e acabamento.', 9, false, 'justify');
  addText('2.2. Em razão do exposto, o(a) CONTRATANTE manifesta seu ACEITE, recebendo a obra de forma definitiva e irrevogável, nada tendo a reclamar ou opor quanto à qualidade, estética ou funcionalidade do serviço executado.', 9, false, 'justify');

  currentY += 3;
  addText('CLÁUSULA TERCEIRA – DA QUITAÇÃO DO SERVIÇO', 9, true, 'left');
  addText('3.1. Com o aceite formalizado neste termo, a CONTRATADA cumpre integralmente sua obrigação de fazer, referente à execução do serviço.', 9, false, 'justify');

  currentY += 3;
  addText('CLÁUSULA QUARTA – DO INÍCIO DA GARANTIA', 9, true, 'left');
  addText('4.1. As partes acordam que a data de assinatura deste termo será considerada, para todos os efeitos legais, como o marco inicial para a contagem dos prazos de garantia, tanto a legal, prevista no Art. 26, II, do Código de Defesa do Consumidor, quanto a contratual, se aplicável.', 9, false, 'justify');

  currentY += 7;
  addText('E, por estarem justas e acordadas, as partes assinam o presente termo em 2 (duas) vias de igual teor e forma.', 9, false, 'justify');

  currentY += 3;
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const city = data.userData?.city || 'São Paulo';
  addText(`${city}, ${dateStr}.`, 9, false, 'left');

  currentY += 15;

  // --- ASSINATURAS ---
  if (currentY + 40 > pageHeight - margin) { doc.addPage(); currentY = 30; }
  
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 4;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Zilinski Distribuidora', pageWidth / 2, currentY, { align: 'center' });
  currentY += 4;
  doc.setFont('helvetica', 'normal');
  doc.text('(Contratada)', pageWidth / 2, currentY, { align: 'center' });
  
  currentY += 15;

  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 4;
  doc.setFont('helvetica', 'bold');
  doc.text(nomeCliente || 'Cliente', pageWidth / 2, currentY, { align: 'center' });
  currentY += 4;
  doc.setFont('helvetica', 'normal');
  doc.text('(Contratante)', pageWidth / 2, currentY, { align: 'center' });

  doc.save(`aceite_obra_${(nomeCliente || 'cliente').toLowerCase().replace(/\s/g, '_')}.pdf`);
};
