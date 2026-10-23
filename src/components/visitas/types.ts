export type TemperaturaLead = 'QUENTE' | 'MORNO' | 'FRIO';
export type StatusVisita = 'PENDENTE' | 'EM_ROTA' | 'CONCLUIDO' | 'CANCELADO';
export type ApiUtilizada = 'google' | 'mapbox' | 'osrm' | null;

export interface Visita {
    id: string;
    cliente: string;
    telefone: string;
    endereco: string;
    horarioPrevisto: string;
    motivoVisita?: string;
    temperatura: TemperaturaLead;
    status: StatusVisita;
    latitude: number;
    longitude: number;
    valorVisita?: number;
    valorCobrado?: number | string;
    quandoCobrar?: string;
}

export function formatValorCobrado(valor?: number | string): string {
    if (valor === undefined || valor === null || valor === '') return 'R$ 200,00';
    if (typeof valor === 'number') {
        if (valor === 0) return 'Grátis (R$ 0)';
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
    }
    const clean = String(valor).trim();
    if (clean === '0' || clean.toLowerCase() === 'gratis' || clean.toLowerCase() === 'grátis' || clean.toLowerCase() === 'gratuito') {
        return 'Grátis (R$ 0)';
    }
    const num = parseFloat(clean.replace(/[^\d.,]/g, '').replace(',', '.'));
    if (!isNaN(num)) {
        if (num === 0) return 'Grátis (R$ 0)';
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
    }
    return clean;
}
