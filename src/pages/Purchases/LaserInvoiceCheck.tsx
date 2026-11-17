import React, { useEffect, useMemo, useState } from 'react';
import { collection, doc, getDocs, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { useAuth } from '../../components/AuthProvider';
import PageTitle from '../../components/PageTitle';
import { formatCurrencyBRL } from '../../utils';
import { Invoice, StairRef, stairFromContract, findStair, splitInvoiceClients, matchInvoice, invoicePricePerKg } from '../../utils/laserInvoice';

// Diferença a partir da qual a linha fica vermelha
const TOLERANCE = 30;
const SAVED_DOC = doc(db, 'settings', 'conferencia_jefferson');

const fileToBase64 = (f: File) => new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1]);
    r.onerror = reject;
    r.readAsDataURL(f);
});
const fmtDate = (iso: string) => (iso ? iso.split('-').reverse().join('/') : '');
const mm = (v: number) => Math.round(v);

export default function LaserInvoiceCheck() {
    const { user } = useAuth();
    const [stairs, setStairs] = useState<StairRef[]>([]);
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [picked, setPicked] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [saved, setSaved] = useState<Record<string, any>>({});

    useEffect(() => {
        if (!user) return;
        // Contratos vêm das duas coleções que a Fila usa
        Promise.all(['production_queue', 'contracts'].map(c => getDocs(collection(db, c)))).then(snaps => {
            const list = snaps.flatMap(s => s.docs.map(d => stairFromContract(d.id, d.data()))).filter((s): s is StairRef => !!s && s.pieces.length > 0);
            // o mesmo contrato costuma estar nas duas coleções com o mesmo id: fica o da Fila
            const unique = [...new Map(list.reverse().map(s => [s.id, s])).values()];
            setStairs(unique.sort((a, b) => a.name.trim().localeCompare(b.name.trim(), 'pt-BR')));
        });
        return onSnapshot(SAVED_DOC, s => setSaved(s.data()?.notas || {}));
    }, [user]);

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLoading(true); setError(''); setInvoice(null);
        try {
            const token = await auth.currentUser?.getIdToken();
            const r = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ invoiceBase64: await fileToBase64(file), mimeType: file.type || 'application/pdf' }),
            });
            const data = await r.json();
            if (!r.ok) throw new Error(data.error || 'Erro ao ler a nota');
            const inv: Invoice = { ...data, number: String(data.number || '').replace(/\D/g, '').replace(/^0+/, ''), clients: splitInvoiceClients(data.clientsText || '') };
            setInvoice(inv);
            setPicked(Object.fromEntries(inv.clients.map(n => [n, findStair(n, stairs)?.id || ''])));
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
            e.target.value = '';
        }
    };

    const chosen = stairs.filter(s => Object.values(picked).includes(s.id));
    const rows = useMemo(() => (invoice ? matchInvoice(invoice, chosen) : []), [invoice, picked, stairs]);

    const save = async () => {
        if (!invoice) return;
        await setDoc(SAVED_DOC, { notas: { [invoice.number]: { ...invoice, contracts: picked, pricePerKg: invoicePricePerKg(invoice), savedAt: new Date().toISOString() } } }, { merge: true });
        alert('Conferência salva!');
    };

    if (!user) {
        return (
            <div className="max-w-7xl mx-auto p-6 flex flex-col items-center justify-center h-[50vh] text-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Acesso Restrito</h2>
                <p className="text-gray-500 dark:text-gray-400">Faça login para conferir as notas.</p>
            </div>
        );
    }

    const savedList = Object.values(saved).sort((a: any, b: any) => String(b.issueDate).localeCompare(String(a.issueDate)));
    const today = new Date().toISOString().slice(0, 10);
    const upcoming = savedList.flatMap((n: any) => (n.installments || []).map((p: any) => ({ ...p, nf: n.number, clients: (n.clients || []).join(' / ') })))
        .filter(p => p.due >= today).sort((a, b) => a.due.localeCompare(b.due));

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-6">
            <PageTitle info="Suba o PDF da nota fiscal do Jefferson (Cia do Ferro). O site lê os itens, liga cada peça à escada pelo nome do cliente e pela medida, e compara com a conta do site. As parcelas da nota são os boletos.">
                Conferência do Corte a Laser
            </PageTitle>

            <div className="of-plate p-6">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">Nota fiscal (PDF ou foto)</label>
                <input type="file" accept="application/pdf,image/*" onChange={handleFile} disabled={loading} className="block text-sm" />
                {loading && <p className="text-sm text-gray-500 mt-2">Lendo a nota...</p>}
                {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
            </div>

            {invoice && (
                <div className="of-plate p-6 space-y-5">
                    <div className="flex flex-wrap justify-between gap-2">
                        <h2 className="of-stencil text-xl text-gray-900 dark:text-white">Nota {invoice.number} · {fmtDate(invoice.issueDate)}</h2>
                        <div className="text-right">
                            <div className="text-2xl font-black">{formatCurrencyBRL(invoice.total)}</div>
                            <div className="text-xs text-gray-500">{formatCurrencyBRL(invoicePricePerKg(invoice))}/kg na nota</div>
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3">
                        {invoice.clients.map(n => (
                            <label key={n} className="text-sm">
                                <span className="font-bold">{n}</span> → contrato
                                <select value={picked[n] || ''} onChange={e => setPicked(p => ({ ...p, [n]: e.target.value }))} className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700">
                                    <option value="">— nenhum —</option>
                                    {stairs.map(s => <option key={s.id} value={s.id}>{s.name} ({String(s.createdAt || '').slice(0, 10)})</option>)}
                                </select>
                            </label>
                        ))}
                    </div>

                    {[...chosen, null].map(s => {
                        const mine = rows.filter(r => r.stairId === (s?.id ?? null));
                        if (!mine.length) return null;
                        const nota = mine.reduce((t, r) => t + r.item.total, 0);
                        const site = mine.reduce((t, r) => t + r.expectedCost, 0);
                        return (
                            <div key={s?.id ?? 'none'} className="overflow-x-auto">
                                <h3 className="font-bold mb-2">{s ? s.name : 'Sem escada (conferir na mão)'}</h3>
                                <table className="w-full text-sm">
                                    <thead><tr className="text-left text-gray-500"><th className="p-2">Peça na nota</th><th className="p-2">Conta do site</th><th className="p-2 text-right">Nota</th><th className="p-2 text-right">Site</th><th className="p-2 text-right">Diferença</th></tr></thead>
                                    <tbody>
                                        {mine.map((r, i) => {
                                            const diff = r.item.total - r.expectedCost;
                                            const qtyOff = r.expected && r.expected.qty !== r.item.qty;
                                            return (
                                                <tr key={i} className="border-t border-gray-200 dark:border-gray-700">
                                                    <td className="p-2">{r.item.qty} pç {mm(r.item.lengthMm)} × {mm(r.item.widthMm)} · {r.item.thicknessMm} mm</td>
                                                    <td className={`p-2 ${qtyOff ? 'text-red-600 font-bold' : ''}`}>{r.expected ? `${r.expected.kind} ${r.expected.qty} pç ${mm(r.expected.lengthMm)} × ${mm(r.expected.widthMm)}` : '—'}</td>
                                                    <td className="p-2 text-right">{formatCurrencyBRL(r.item.total)}</td>
                                                    <td className="p-2 text-right">{r.expected ? formatCurrencyBRL(r.expectedCost) : '—'}</td>
                                                    <td className={`p-2 text-right font-bold ${r.expected && Math.abs(diff) > TOLERANCE ? 'text-red-600' : ''}`}>{r.expected ? formatCurrencyBRL(diff) : ''}</td>
                                                </tr>
                                            );
                                        })}
                                        <tr className="border-t-2 border-gray-400 font-bold"><td className="p-2" colSpan={2}>Total</td><td className="p-2 text-right">{formatCurrencyBRL(nota)}</td><td className="p-2 text-right">{s ? formatCurrencyBRL(site) : ''}</td><td className={`p-2 text-right ${s && Math.abs(nota - site) > TOLERANCE ? 'text-red-600' : ''}`}>{s ? formatCurrencyBRL(nota - site) : ''}</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        );
                    })}

                    <div>
                        <h3 className="font-bold mb-2">Parcelas (boletos)</h3>
                        {invoice.installments.map(p => <div key={p.n} className="text-sm">{p.n} · vence {fmtDate(p.due)} · {formatCurrencyBRL(p.value)}</div>)}
                        {Math.abs(invoice.installments.reduce((t, p) => t + p.value, 0) - invoice.total) > 0.05 && <p className="text-sm text-red-600 font-bold mt-1">A soma das parcelas não bate com o total da nota.</p>}
                    </div>

                    <button onClick={save} className="bg-highlight hover:bg-yellow-600 text-white font-bold py-2 px-6">Salvar conferência</button>
                </div>
            )}

            <div className="grid lg:grid-cols-2 gap-6">
                <div className="of-plate p-6">
                    <h2 className="of-stencil text-xl text-gray-900 dark:text-white mb-3">Boletos a vencer</h2>
                    {upcoming.length === 0 && <p className="text-sm text-gray-500">Nenhum boleto salvo a vencer.</p>}
                    {upcoming.map(p => <div key={p.nf + p.n} className="flex justify-between text-sm py-1 border-b border-gray-200 dark:border-gray-700"><span>{fmtDate(p.due)} · NF {p.nf} ({p.n}) · {p.clients}</span><span className="font-bold">{formatCurrencyBRL(p.value)}</span></div>)}
                </div>
                <div className="of-plate p-6">
                    <h2 className="of-stencil text-xl text-gray-900 dark:text-white mb-3">Notas salvas · preço do kg</h2>
                    {savedList.length === 0 && <p className="text-sm text-gray-500">Nenhuma nota salva ainda.</p>}
                    {savedList.map((n: any) => <div key={n.number} className="flex justify-between text-sm py-1 border-b border-gray-200 dark:border-gray-700"><span>{fmtDate(n.issueDate)} · NF {n.number} · {(n.clients || []).join(' / ')}</span><span>{formatCurrencyBRL(n.total)} · <b>{formatCurrencyBRL(n.pricePerKg)}/kg</b></span></div>)}
                    <p className="text-[11px] text-gray-500 mt-2">Hoje ele cobra R$ 13,80/kg. Se subir, a conta do site (R$ 14,24 no peso teórico) precisa subir junto.</p>
                </div>
            </div>
        </div>
    );
}
