// Texto padrão de cotação de frete para enviar às transportadoras.
// Usado na página de Contrato, na Lista de Contratos e na Tabela de Entregas.
import { getProp, extractNum, isNoStairContract, getFreightDimensions } from './freightDimensions';

export const MISSING_INFO = '⚠️ FALTA INFORMAÇÃO';

const SENDER_CNPJ = '28.869.537/0001-01';
const SENDER_CEP = '13104-096';

const isFilled = (v: any) => v !== undefined && v !== null && String(v).trim() !== '';
const orMissing = (v: any) => (isFilled(v) ? String(v).trim() : MISSING_INFO);

const formatDoc = (raw: string) => {
    const d = (raw || '').replace(/\D/g, '');
    if (d.length === 11) return { label: 'CPF', value: d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') };
    if (d.length === 14) return { label: 'CNPJ', value: d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5') };
    return { label: 'CPF/CNPJ', value: isFilled(raw) ? raw.trim() : MISSING_INFO };
};

const formatCep = (raw: string) => {
    const d = (raw || '').replace(/\D/g, '');
    if (d.length === 8) return `${d.slice(0, 5)}-${d.slice(5)}`;
    return orMissing(raw);
};

const formatMeters = (n: number) => `${n.toFixed(2).replace('.', ',')}m`;

// Lê "COMPRIMENTO: 5.34m / LARGURA / ALTURA / PESO TOTAL" do texto da coluna FRETE (MEDIDAS)
export const parseFreightDimensions = (freightInfo: string) => {
    const num = (re: RegExp) => {
        const m = (freightInfo || '').match(re);
        return m ? parseFloat(m[1].replace(',', '.')) : 0;
    };
    return {
        comprimentoM: num(/COMPRIMENTO:\s*([\d.,]+)/i),
        larguraM: num(/LARGURA:\s*([\d.,]+)/i),
        alturaM: num(/ALTURA:\s*([\d.,]+)/i),
        pesoKg: num(/PESO TOTAL:\s*([\d.,]+)/i) || num(/PESO[^:\n]*:\s*([\d.,]+)/i),
    };
};

// Mesmo texto que a coluna FRETE (MEDIDAS) mostra: usa o que foi editado à mão
// (salvo em hingesQty) e, se não tiver, o cálculo automático.
export const resolveFreightInfo = (contract: any, data: any, measurements?: string) => {
    const noStair = isNoStairContract(data, contract);
    const calculatedFreight = getFreightDimensions(data, contract, measurements);
    let freightInfo = '';

    const saved = contract?.hingesQty;
    if (saved !== undefined
        && saved.trim() !== '-'
        && saved.trim() !== ''
        && !saved.toLowerCase().includes('dobradiça')
        && !saved.includes('QTD VOLUMES')
    ) {
        if (noStair && saved.includes('PESO (ESCADA)')) {
            freightInfo = calculatedFreight;
        } else {
            freightInfo = saved.trim();
        }
    }

    if (!freightInfo || freightInfo === '-' || !freightInfo.includes('COMPRIMENTO:')) {
        freightInfo = calculatedFreight;
    }

    // Desduplica linhas repetidas (caso tenha sido salvo anteriormente com duplicações)
    if (freightInfo && freightInfo !== '-') {
        const seen = new Set<string>();
        freightInfo = freightInfo.split('\n').map(l => l.trim()).filter(Boolean).filter(l => {
            const keyMatch = l.match(/^([A-Z\s()]+:)/);
            const key = keyMatch ? keyMatch[1] : l;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        }).join('\n');
    }
    return freightInfo;
};

// Valor da nota = valor de venda (já com desconto) menos o frete
export const getInvoiceValue = (data: any, contract?: any, queueItem?: any) => {
    const base = extractNum(
        getProp(data, 'baseTotalValue')
        ?? getProp(data, 'baseSaleValue')
        ?? contract?.baseTotalValue
        ?? contract?.totalValue
        ?? queueItem?.value
    );
    const freight = extractNum(getProp(data, 'freightCost'));
    return Math.max(0, base - freight);
};

interface FreightQuoteParams {
    userData: any;
    invoiceValue: number;
    freightInfo: string;
}

export const buildFreightQuoteText = ({ userData, invoiceValue, freightInfo }: FreightQuoteParams) => {
    const u = userData || {};
    const docInfo = formatDoc(u.cpf || '');

    let addressLine1: string;
    let addressLine2: string;
    if (isFilled(u.street)) {
        addressLine1 = `${u.street.trim()}, N.${orMissing(u.number)}`;
        const cityState = isFilled(u.city) ? `${u.city.trim()}${isFilled(u.state) ? '/' + u.state.trim() : ''}` : MISSING_INFO;
        addressLine2 = `${orMissing(u.neighborhood)} - ${cityState}  CEP: ${formatCep(u.zip)}`;
    } else {
        addressLine1 = orMissing(u.address);
        addressLine2 = `CEP: ${formatCep(u.zip)}`;
    }

    const valueText = invoiceValue > 0
        ? `R$ ${invoiceValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : MISSING_INFO;

    const dims = parseFreightDimensions(freightInfo);
    const measuresText = dims.comprimentoM > 0 && dims.larguraM > 0 && dims.alturaM > 0
        ? `${formatMeters(dims.comprimentoM)} (C) x ${formatMeters(dims.larguraM)} (L) x ${formatMeters(dims.alturaM)} (A)`
        : MISSING_INFO;
    const weightText = dims.pesoKg > 0 ? `${Math.round(dims.pesoKg)} quilos` : MISSING_INFO;

    return `CNPJ do remetente: ${SENDER_CNPJ}
Modalidade de coleta: a mercadoria será levada até a base da transportadora
CEP do remetente: ${SENDER_CEP}

${docInfo.label} destinatário: ${docInfo.value}
Nome: ${orMissing(u.name)}
Endereço de entrega: ${addressLine1}
${addressLine2}
Valor da nota fiscal: ${valueText}
Tomador do frete: remetente

Quantidade de volumes: 1
Volume 1
Medidas
${measuresText}
${weightText}

Material transportado: escada retrátil, fechada em formato de prancha`;
};

export const copyTextToClipboard = async (text: string, successMessage: string) => {
    try {
        await navigator.clipboard.writeText(text);
        alert(successMessage);
    } catch (err) {
        console.error('Erro ao copiar o texto: ', err);
        prompt('Seu navegador bloqueou a cópia automática. Copie o texto abaixo:', text);
    }
};
