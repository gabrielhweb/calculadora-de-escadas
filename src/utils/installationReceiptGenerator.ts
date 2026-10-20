import jsPDF from 'jspdf';

export interface InstallationTermOrientations {
  pintura?: boolean;       // Pintura e acabamento após a instalação
  paredePrumo?: boolean;   // Parede fora de prumo / desalinhada
  reforco?: boolean;       // Necessidade de reforço estrutural da parede
  fixacao?: boolean;       // Fixação e pontos de apoio da escada
  cuidados?: boolean;      // Cuidados de uso, limpeza e conservação
  ajustes?: boolean;       // Ajustes e acabamentos pendentes
}

export interface InstallationTermData {
  clientName?: string;
  cpfCnpj?: string;
  date?: string;
  address?: string;
  totalValue?: string | number;
  paidValue?: string | number;
  balanceValue?: string | number;
  paymentStatus?: 'quitado' | 'pendente' | '';
  orientations?: InstallationTermOrientations;
  observations?: string;
}

export function formatValForReceipt(v?: string | number): string {
  if (v === undefined || v === null || v === '') return '';
  if (typeof v === 'number') {
    return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  const str = String(v).trim().replace(/^R\$\s?/, '');
  if (!str) return '';
  const num = parseFloat(str.replace(/\./g, '').replace(',', '.'));
  if (!isNaN(num) && !str.includes(',')) {
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return str;
}

export function drawInstallationTerm(doc: jsPDF, data: InstallationTermData | null | undefined, offsetY: number) {
  const navyColor = [37, 60, 85];      // #253c55
  const darkTextColor = [32, 40, 50];  // #202832
  const lineLightColor = [180, 190, 200]; // #b4bec8
  const lineDarkColor = [32, 40, 50];  // #202832

  // 1. Header Banner
  doc.setFillColor(navyColor[0], navyColor[1], navyColor[2]);
  doc.roundedRect(31.0, 17.0 + offsetY, 533.28, 30.0, 4.0, 4.0, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.3);
  doc.setTextColor(255, 255, 255);
  doc.text('TERMO DE ENTREGA, INSTALAÇÃO E ACERTO FINAL', 42.0, 30.5 + offsetY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.0);
  doc.setTextColor(255, 255, 255);
  doc.text('Zilinski Escadas  |  CNPJ 28.869.537/0001-01', 42.0, 42.0 + offsetY);

  // 2. Client Info Fields
  // Cliente:
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.0);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text('Cliente:', 31.0, 61.5 + offsetY);

  doc.setDrawColor(lineLightColor[0], lineLightColor[1], lineLightColor[2]);
  doc.setLineWidth(1.0);
  doc.line(74.0, 62.0 + offsetY, 561.3, 62.0 + offsetY);

  if (data?.clientName) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(17, 24, 39);
    doc.text(String(data.clientName), 78.0, 60.5 + offsetY, { maxWidth: 480 });
  }

  // CPF/CNPJ:
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text('CPF/CNPJ:', 31.0, 78.5 + offsetY);

  doc.setLineWidth(1.0);
  doc.line(96.0, 79.0 + offsetY, 269.0, 79.0 + offsetY);

  if (data?.cpfCnpj) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.0);
    doc.setTextColor(17, 24, 39);
    doc.text(String(data.cpfCnpj), 99.0, 77.5 + offsetY);
  }

  // Data:
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text('Data:', 278.0, 78.5 + offsetY);

  doc.setLineWidth(1.0);
  doc.line(311.0, 79.0 + offsetY, 561.3, 79.0 + offsetY);

  if (data?.date) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.0);
    doc.setTextColor(17, 24, 39);
    doc.text(String(data.date), 315.0, 77.5 + offsetY);
  }

  // Endereço da instalação:
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text('Endereço da instalação:', 31.0, 95.5 + offsetY);

  doc.setLineWidth(1.0);
  doc.line(174.0, 96.0 + offsetY, 561.3, 96.0 + offsetY);

  if (data?.address) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(17, 24, 39);
    doc.text(String(data.address), 177.0, 94.5 + offsetY, { maxWidth: 382 });
  }

  // 3. Declaratory text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.4);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text('Declaro que a escada foi entregue e instalada e que recebi as orientações', 31.0, 110.5 + offsetY);
  doc.text('assinaladas abaixo, conforme aplicável à instalação realizada:', 31.0, 121.5 + offsetY);

  // 4. Section Header: Orientações
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.4);
  doc.setTextColor(navyColor[0], navyColor[1], navyColor[2]);
  doc.text('ORIENTAÇÕES / CONDIÇÕES INFORMADAS AO CLIENTE', 31.0, 138.5 + offsetY);

  // Helper for checkbox and text
  const drawCheckbox = (x: number, y: number, label: string, isChecked: boolean) => {
    doc.setDrawColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.setLineWidth(0.75);
    doc.rect(x, y + offsetY, 8.0, 8.0);

    if (isChecked) {
      doc.setDrawColor(navyColor[0], navyColor[1], navyColor[2]);
      doc.setLineWidth(1.2);
      doc.line(x + 1.8, y + offsetY + 4.0, x + 3.5, y + offsetY + 6.2);
      doc.line(x + 3.5, y + offsetY + 6.2, x + 6.5, y + offsetY + 1.8);
      doc.setLineWidth(0.75);
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text(label, x + 12.0, y + offsetY + 6.8);
  };

  // Row 1
  drawCheckbox(31.0, 145.0, 'Pintura e acabamento após a instalação', !!data?.orientations?.pintura);
  drawCheckbox(300.0, 145.0, 'Parede fora de prumo / desalinhada', !!data?.orientations?.paredePrumo);

  // Row 2
  drawCheckbox(31.0, 162.0, 'Necessidade de reforço estrutural da parede', !!data?.orientations?.reforco);
  drawCheckbox(300.0, 162.0, 'Fixação e pontos de apoio da escada', !!data?.orientations?.fixacao);

  // Row 3
  drawCheckbox(31.0, 179.0, 'Cuidados de uso, limpeza e conservação', !!data?.orientations?.cuidados);
  drawCheckbox(300.0, 179.0, 'Ajustes e acabamentos pendentes', !!data?.orientations?.ajustes);

  // 5. Outras orientações / ressalvas
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.4);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text('Outras orientações / ressalvas:', 31.0, 206.5 + offsetY);

  doc.setDrawColor(lineDarkColor[0], lineDarkColor[1], lineDarkColor[2]);
  doc.setLineWidth(0.75);
  doc.line(214.0, 207.0 + offsetY, 561.3, 207.0 + offsetY);
  doc.line(31.0, 223.0 + offsetY, 561.3, 223.0 + offsetY);

  if (data?.observations) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(17, 24, 39);
    const splitObs = doc.splitTextToSize(data.observations, 340);
    if (splitObs[0]) doc.text(splitObs[0], 217.0, 205.5 + offsetY);
    if (splitObs[1]) doc.text(splitObs[1], 33.0, 221.5 + offsetY, { maxWidth: 525 });
  }

  // 6. Section Header: Acerto Financeiro
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(navyColor[0], navyColor[1], navyColor[2]);
  doc.text('ACERTO FINANCEIRO', 31.0, 243.5 + offsetY);

  // Values row
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.7);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);

  doc.text('Valor total: R$', 31.0, 261.5 + offsetY);
  doc.setLineWidth(0.75);
  doc.line(134.0, 262.0 + offsetY, 203.0, 262.0 + offsetY);
  const totalStr = formatValForReceipt(data?.totalValue);
  if (totalStr) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(17, 24, 39);
    doc.text(totalStr, 136.0, 260.5 + offsetY);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.7);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text('Já pago: R$', 221.0, 261.5 + offsetY);
  doc.line(301.0, 262.0 + offsetY, 371.0, 262.0 + offsetY);
  const paidStr = formatValForReceipt(data?.paidValue);
  if (paidStr) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(17, 24, 39);
    doc.text(paidStr, 303.0, 260.5 + offsetY);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.7);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text('Saldo: R$', 389.0, 261.5 + offsetY);
  doc.line(451.0, 262.0 + offsetY, 561.3, 262.0 + offsetY);
  const balStr = formatValForReceipt(data?.balanceValue);
  if (balStr) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(17, 24, 39);
    doc.text(balStr, 453.0, 260.5 + offsetY);
  }

  // Status checkboxes
  const isQuitado = data?.paymentStatus === 'quitado';
  const isPendente = data?.paymentStatus === 'pendente';
  drawCheckbox(31.0, 272.0, 'Saldo quitado nesta data', isQuitado);
  drawCheckbox(255.0, 272.0, 'Saldo pendente de pagamento', isPendente);

  // Final agreement sentence
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.1);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text('O saldo final deverá ser pago conforme as condições acordadas entre as partes.', 31.0, 298.5 + offsetY);

  // Signatures
  doc.setDrawColor(lineDarkColor[0], lineDarkColor[1], lineDarkColor[2]);
  doc.setLineWidth(0.75);
  doc.line(31.0, 322.0 + offsetY, 274.3, 322.0 + offsetY);
  doc.line(298.0, 322.0 + offsetY, 564.3, 322.0 + offsetY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text('Assinatura do cliente', 152.6, 334.5 + offsetY, { align: 'center' });
  doc.text('Responsável Zilinski Escadas', 431.1, 334.5 + offsetY, { align: 'center' });

  if (data?.clientName) {
    doc.setFontSize(6.8);
    doc.text(String(data.clientName), 152.6, 344.0 + offsetY, { align: 'center', maxWidth: 240 });
  }
}

export function generateInstallationReceiptPDF(
  term1: InstallationTermData,
  term2?: InstallationTermData | null,
  mode: 'double' | 'single' = 'double'
) {
  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4',
    orientation: 'portrait'
  });

  // Termo 1 (Superior)
  drawInstallationTerm(doc, term1, 0);

  if (mode === 'double') {
    // Linha de corte tracejada no meio exato da folha A4 (841.89 / 2 = 420.94 pt)
    doc.setDrawColor(165, 173, 181);
    doc.setLineWidth(0.75);
    doc.setLineDashPattern([4, 4], 0);
    doc.line(17.0, 420.94, 578.3, 420.94);
    doc.setLineDashPattern([], 0);

    // Termo 2 (Inferior)
    drawInstallationTerm(doc, term2 || null, 420.944885);
  }

  // Nome do arquivo de saída
  const sanitize = (str?: string) => (str || '').trim().replace(/[^a-zA-Z0-9À-ÿ]/g, '_').slice(0, 25);
  const name1 = sanitize(term1?.clientName);
  const name2 = sanitize(term2?.clientName);

  let filename = 'Termo_Instalacao_Meia_Folha.pdf';
  if (name1 && name2 && name1 !== name2) {
    filename = `Termo_Instalacao_${name1}_e_${name2}.pdf`;
  } else if (name1) {
    filename = `Termo_Instalacao_${name1}.pdf`;
  } else if (name2) {
    filename = `Termo_Instalacao_${name2}.pdf`;
  }

  doc.save(filename);
}
