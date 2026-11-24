import { requireAuthorizedUser } from './_auth.js';
import { geocode } from './_geo.js';

// Coordenadas de um endereço de entrega (mapa da Tabela de Entregas).
// Tenta pelo CEP (mais confiável) e, se não achar, pelo endereço escrito sem o "CEP: ...".
export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    if (!(await requireAuthorizedUser(req, res))) return;

    const { address, zip } = req.body || {};
    const cep = String(zip || '').replace(/\D/g, '');
    const text = String(address || '').replace(/,?\s*CEP:?\s*[\d.-]+/i, '').trim();

    const attempts: string[] = [];
    if (cep.length === 8) attempts.push(cep);
    if (text) {
        // "Rua X, 51, Centro, Osasco, - SP" → "Rua X 51, Centro, Osasco, SP"; por último só "Osasco, SP"
        const clean = text.replace(/,\s*-\s*/g, ', ').replace(/\s+-\s+/g, ', ').replace(/,\s*,/g, ',').trim();
        attempts.push(clean);
        const parts = clean.split(',').map(p => p.trim()).filter(Boolean);
        const uf = parts.length > 1 && /^[A-Za-z]{2}$/.test(parts[parts.length - 1]) ? parts[parts.length - 1] : '';
        if (uf && parts.length > 2) attempts.push(`${parts[parts.length - 2]}, ${uf}`);
    }
    // Endereço sem CEP separado: tenta achar um CEP escrito no meio do texto
    const cepInText = String(address || '').match(/\b\d{5}-?\d{3}\b/);
    if (!cep && cepInText) attempts.unshift(cepInText[0]);

    if (attempts.length === 0) {
        return res.status(400).json({ error: 'Sem endereço nem CEP.' });
    }

    for (const place of attempts) {
        try {
            const found = await geocode(place);
            return res.status(200).json(found);
        } catch (e: any) {
            console.warn('Geocode falhou para', place, '-', e?.message || e);
        }
    }
    return res.status(404).json({ error: 'Endereço não encontrado no mapa.' });
}
