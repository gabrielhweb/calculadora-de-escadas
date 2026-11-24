// Arquivo com "_" na frente: a Vercel não publica como rota, só serve de import para as funções.
// Coordenadas sem IA: CEP → endereço (ViaCEP) → coordenadas (OpenStreetMap/Nominatim). Aceita CEP ou endereço escrito.
// Usado no frete (api/gemini.ts) e no mapa da Tabela de Entregas (api/geocode.ts).
export const fetchJson = async (url: string, timeoutMs = 8000) => {
    const r = await fetch(url, {
        headers: { 'User-Agent': 'ZilinskiEscadas/1.0 (calculadora interna)', 'Accept-Language': 'pt-BR' },
        signal: AbortSignal.timeout(timeoutMs),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status} em ${new URL(url).host}`);
    return r.json();
};

export const geocode = async (place: string) => {
    const queries: string[] = [];
    const cep = place.replace(/\D/g, '');
    const isCep = cep.length === 8 && /^[\d\s.-]+$/.test(place.trim());
    let label = place;
    if (isCep) {
        // CEP geral de cidade (ex.: 13300-000) não existe no ViaCEP: aí busca pelo CEP direto no OpenStreetMap
        const v: any = await fetchJson(`https://viacep.com.br/ws/${cep}/json/`).catch(() => ({ erro: true }));
        if (!v.erro) {
            if (v.logradouro) queries.push(`${v.logradouro}, ${v.localidade}, ${v.uf}`);
            queries.push(`${v.localidade}, ${v.uf}`);
            label = `${v.localidade}/${v.uf}`;
        }
    } else {
        queries.push(place);
    }
    const urls = queries.map(q => `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(q)}`);
    if (isCep) urls.push(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&postalcode=${cep.slice(0, 5)}-${cep.slice(5)}`);
    for (const url of urls) {
        const found: any[] = await fetchJson(url);
        if (found[0]) {
            if (label === place && found[0].display_name) label = String(found[0].display_name).split(',').slice(0, 3).join(',');
            return { lat: Number(found[0].lat), lng: Number(found[0].lon), label };
        }
    }
    throw new Error(`não achei as coordenadas de ${place}`);
};
