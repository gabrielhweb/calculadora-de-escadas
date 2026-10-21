export type ApiUtilizada = 'google' | 'mapbox' | 'osrm' | null;

export type TemperaturaLead = 'QUENTE' | 'MORNO' | 'FRIO';

export type StatusVisita = 'PENDENTE' | 'EM_ROTA' | 'CONCLUIDO' | 'CANCELADO';

export interface Visita {
    id: string;
    cliente: string;
    telefone: string;
    endereco: string;
    horarioPrevisto: string;
    temperatura: TemperaturaLead;
    status: StatusVisita;
    latitude: number;
    longitude: number;
}
