import { laserCutPieces, laserPieceKg, LaserPiece } from './freightDimensions';
import { normalizeName } from './clientInfo';

// Nota fiscal do Jefferson (Cia do Ferro) como a IA devolve
export type InvoiceItem = { description: string; lengthMm: number; widthMm: number; thicknessMm: number; qty: number; kg: number; total: number };
export type Invoice = {
    number: string;
    issueDate: string;
    total: number;
    clients: string[];
    installments: { n: string; due: string; value: number }[];
    items: InvoiceItem[];
};

export type StairRef = { id: string; name: string; createdAt?: string; pieces: LaserPiece[] };

// Medidas da escada no contrato (mesma ordem de procura da Fila: opção escolhida, entrada, raiz)
export const stairFromContract = (id: string, d: any): StairRef | null => {
    let pcd = d.parsedContractData || d.contractData;
    if (typeof pcd === 'string') { try { pcd = JSON.parse(pcd); } catch { pcd = null; } }
    const get = (k: string) => [pcd?.selectedOption, pcd?.inputData, pcd, d].map(o => o?.[k]).find(v => v !== undefined && v !== '');
    const name = d.clientName || pcd?.userData?.name || d.title || '';
    const steps = Number(get('structureSteps')) || Number(get('steps')) || Number(get('desiredSteps')) || 0;
    const tread = Number(get('treadDepth')) || 0;
    const height = Number(get('stepHeight')) || (steps ? Number(get('totalHeight')) / steps : 0);
    const width = Number(get('stairWidth')) || 0;
    if (!name) return null;
    return { id, name, createdAt: d.createdAt, pieces: laserCutPieces({ steps, treadDepthCm: tread, stepHeightCm: height, widthCm: width, treadMaterial: get('treadMaterial') }) };
};

// "WAGNER FUIM" acha "Wagner Fuim Moreno": todos os nomes da nota têm que estar no contrato; o mais recente ganha
export const findStair = (invoiceName: string, stairs: StairRef[]) => {
    const words = normalizeName(invoiceName).split(/\s+/).filter(w => w.length > 2);
    const hits = stairs.filter(s => { const n = normalizeName(s.name).split(/\s+/); return words.length > 0 && words.every(w => n.includes(w)); });
    return hits.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))[0];
};

// Nomes no texto da nota: "ESCADAS WAGNER FUIM / JAIR JOSÉ" ou "ESCADA CRISTIANO RAPOSO (SOMENTE LONGARINAS)"
export const splitInvoiceClients = (text: string) =>
    text.replace(/\(.*?\)/g, '').replace(/^\s*escadas?\s+/i, '').split(/\s*\/\s*|\s+e\s+/i).map(s => s.trim()).filter(Boolean);

export type MatchRow = { item: InvoiceItem; stairId: string | null; expected: LaserPiece | null; expectedCost: number };

// Cada item da nota vai pra peça da escada com medida mais parecida (mesma espessura, até 8% de diferença).
// Item sem par (ex.: cantoneira) fica sem dono, pra conferir na mão.
export const matchInvoice = (inv: Invoice, stairs: StairRef[]): MatchRow[] =>
    inv.items.map(item => {
        let best: { s: StairRef; p: LaserPiece; err: number } | null = null;
        for (const s of stairs) for (const p of s.pieces) {
            if (Math.abs(p.thicknessMm - item.thicknessMm) > 0.2) continue;
            // a nota pode trazer as medidas em qualquer ordem
            const err = Math.min(
                Math.max(Math.abs(item.lengthMm / p.lengthMm - 1), Math.abs(item.widthMm / p.widthMm - 1)),
                Math.max(Math.abs(item.widthMm / p.lengthMm - 1), Math.abs(item.lengthMm / p.widthMm - 1)),
            );
            if (err < 0.08 && (!best || err < best.err)) best = { s, p, err };
        }
        if (!best) return { item, stairId: null, expected: null, expectedCost: 0 };
        return { item, stairId: best.s.id, expected: best.p, expectedCost: laserPieceKg(best.p) * best.p.pricePerKg };
    });

/** R$/kg que ele cobrou na nota (pra ver se o preço subiu com o tempo) */
export const invoicePricePerKg = (inv: Invoice) => {
    const kg = inv.items.reduce((s, i) => s + (i.kg || 0), 0);
    return kg > 0 ? inv.items.reduce((s, i) => s + i.total, 0) / kg : 0;
};
