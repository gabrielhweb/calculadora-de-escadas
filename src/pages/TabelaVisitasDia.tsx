import React, { useState } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface Visita {
    id: string;
    cliente: string;
    telefone: string;
    endereco: string;
    horarioPrevisto: string;
    temperatura: 'QUENTE' | 'MORNO' | 'FRIO';
    status: 'PENDENTE' | 'EM_ROTA' | 'CONCLUIDO' | 'CANCELADO';
    latitude: number;
    longitude: number;
}

const VISITAS_INICIAIS: Visita[] = [
    {
        id: 'visita-1',
        cliente: 'Fábio Chalita',
        telefone: '(35) 99881-2233',
        endereco: 'Rua Ypês, 92 - Salto de Baixo, Extrema - MG',
        horarioPrevisto: '08:30',
        temperatura: 'QUENTE',
        status: 'PENDENTE',
        latitude: -22.8542,
        longitude: -46.3183,
    },
    {
        id: 'visita-2',
        cliente: 'Alexandre Bergamo',
        telefone: '(15) 98112-4455',
        endereco: 'Jardim Residencial Chácara Ondina, Sorocaba - SP',
        horarioPrevisto: '11:00',
        temperatura: 'QUENTE',
        status: 'PENDENTE',
        latitude: -23.5015,
        longitude: -47.4526,
    },
    {
        id: 'visita-3',
        cliente: 'Mário dos Reis Filho',
        telefone: '(11) 97223-9900',
        endereco: 'Av. Paulista, 1578 - Bela Vista, São Paulo - SP',
        horarioPrevisto: '14:30',
        temperatura: 'MORNO',
        status: 'PENDENTE',
        latitude: -23.5615,
        longitude: -46.6560,
    },
    {
        id: 'visita-4',
        cliente: 'Diego Ferreira Santos',
        telefone: '(11) 96554-1122',
        endereco: 'Rua das Flores, 450 - Santana, São Paulo - SP',
        horarioPrevisto: '16:45',
        temperatura: 'FRIO',
        status: 'PENDENTE',
        latitude: -23.5005,
        longitude: -46.6289,
    },
];

interface SortableRowProps {
    visita: Visita;
    index: number;
}

const SortableRow: React.FC<SortableRowProps> = ({ visita, index }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: visita.id });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.6 : 1,
    };

    const getTemperaturaBadge = (temp: Visita['temperatura']) => {
        switch (temp) {
            case 'QUENTE':
                return 'bg-red-600 text-white';
            case 'MORNO':
                return 'bg-orange-500 text-black';
            case 'FRIO':
                return 'bg-cyan-500 text-black';
            default:
                return 'bg-zinc-700 text-white';
        }
    };

    const getStatusBadge = (st: Visita['status']) => {
        switch (st) {
            case 'PENDENTE':
                return 'bg-amber-400 text-black';
            case 'EM_ROTA':
                return 'bg-sky-400 text-black';
            case 'CONCLUIDO':
                return 'bg-emerald-400 text-black';
            case 'CANCELADO':
                return 'bg-rose-600 text-white';
            default:
                return 'bg-zinc-700 text-white';
        }
    };

    return (
        <tr
            ref={setNodeRef}
            style={style}
            className={`border-b border-zinc-800 transition-colors ${
                isDragging ? 'bg-zinc-900 border-zinc-500' : 'bg-zinc-950 hover:bg-zinc-900/80'
            }`}
        >
            <td className="p-3 text-center w-12 border-r border-zinc-800">
                <button
                    {...attributes}
                    {...listeners}
                    type="button"
                    title="Arraste para reordenar"
                    className="cursor-grab active:cursor-grabbing p-1 text-zinc-500 hover:text-zinc-200 transition-colors"
                >
                    <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="square" strokeWidth={2} d="M4 8h16M4 16h16" />
                    </svg>
                </button>
            </td>

            <td className="p-3 text-center font-mono font-black text-sm text-zinc-400 w-16 border-r border-zinc-800">
                #{String(index + 1).padStart(2, '0')}
            </td>

            <td className="p-3 font-mono text-sm text-zinc-300 w-24 border-r border-zinc-800">
                {visita.horarioPrevisto}
            </td>

            <td className="p-3 border-r border-zinc-800">
                <div className="font-bold text-sm text-zinc-100">{visita.cliente}</div>
                <div className="text-xs text-zinc-500 font-mono mt-0.5">{visita.telefone}</div>
            </td>

            <td className="p-3 text-sm text-zinc-300 border-r border-zinc-800 max-w-xs truncate" title={visita.endereco}>
                {visita.endereco}
            </td>

            <td className="p-3 text-center border-r border-zinc-800 w-32">
                <span className={`inline-block font-black text-[11px] tracking-widest uppercase px-2 py-0.5 ${getTemperaturaBadge(visita.temperatura)}`}>
                    {visita.temperatura}
                </span>
            </td>

            <td className="p-3 text-center border-r border-zinc-800 w-32">
                <span className={`inline-block font-black text-[11px] tracking-widest uppercase px-2 py-0.5 ${getStatusBadge(visita.status)}`}>
                    {visita.status.replace('_', ' ')}
                </span>
            </td>

            <td className="p-3 text-right font-mono text-xs text-zinc-500 w-48">
                {visita.latitude.toFixed(4)}, {visita.longitude.toFixed(4)}
            </td>
        </tr>
    );
};

export const TabelaVisitasDia: React.FC = () => {
    const [visitas, setVisitas] = useState<Visita[]>(VISITAS_INICIAIS);
    const [loading, setLoading] = useState<boolean>(false);
    const [apiUtilizada, setApiUtilizada] = useState<'google' | 'mapbox' | 'osrm' | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setVisitas((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleCalcularMelhorRota = async () => {
        setLoading(true);
        setErrorMsg(null);

        try {
            const payload = {
                visitas: visitas.map((v) => ({
                    id: v.id,
                    latitude: v.latitude,
                    longitude: v.longitude,
                })),
            };

            let response = await fetch('/api/calcular-rota-diaria', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.status === 404) {
                response = await fetch('/calcular-rota-diaria', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });
            }

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || `Erro HTTP ${response.status}`);
            }

            const data: {
                api_utilizada: 'google' | 'mapbox' | 'osrm';
                visitas: Array<{ id: string; latitude: number; longitude: number }>;
            } = await response.json();

            // Mapeia e reordena a lista mantendo os dados completos da visita
            const visitasMap = new Map(visitas.map((v) => [String(v.id), v]));
            const visitasReordenadas: Visita[] = [];

            for (const item of data.visitas) {
                const original = visitasMap.get(String(item.id));
                if (original) {
                    visitasReordenadas.push(original);
                }
            }

            if (visitasReordenadas.length === visitas.length) {
                setVisitas(visitasReordenadas);
            }

            setApiUtilizada(data.api_utilizada);
        } catch (err: any) {
            console.error('Falha ao calcular rota diária:', err);
            setErrorMsg(err.message || 'Falha na comunicação com o servidor de rotas.');
        } finally {
            setLoading(false);
        }
    };

    const renderApiBadge = () => {
        if (!apiUtilizada) return null;

        switch (apiUtilizada) {
            case 'google':
                return (
                    <div className="inline-flex items-center gap-2 bg-emerald-500 text-black font-black uppercase text-xs px-3 py-1.5 border border-emerald-400">
                        <span className="w-2 h-2 bg-black"></span>
                        Trânsito Baseado no Google Maps
                    </div>
                );
            case 'mapbox':
                return (
                    <div className="inline-flex items-center gap-2 bg-sky-500 text-black font-black uppercase text-xs px-3 py-1.5 border border-sky-400">
                        <span className="w-2 h-2 bg-black"></span>
                        Trânsito Baseado no Mapbox
                    </div>
                );
            case 'osrm':
                return (
                    <div className="inline-flex items-center gap-2 bg-rose-600 text-white font-black uppercase text-xs px-3 py-1.5 border border-rose-500">
                        <span className="w-2 h-2 bg-white animate-pulse"></span>
                        Rota Otimizada por Distância sem Trânsito (OSRM)
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-8 font-sans selection:bg-zinc-100 selection:text-zinc-950">
            {/* Header Brutalista */}
            <header className="border-b-2 border-zinc-800 pb-6 mb-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="bg-zinc-100 text-zinc-950 font-black text-xs uppercase px-2 py-0.5 tracking-widest">
                                MÓDULO LOGÍSTICA
                            </span>
                            <span className="text-zinc-500 font-mono text-xs">
                                TOTAL: {visitas.length} PARADAS
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-4xl font-black tracking-tight uppercase mt-2 text-zinc-100">
                            Tabela de Visitas do Dia
                        </h1>
                        <p className="text-zinc-400 text-xs sm:text-sm mt-1 font-mono">
                            Reordene manualmente arrastando as linhas ou calcule a ordem ideal com tráfego em tempo real.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <button
                            type="button"
                            onClick={handleCalcularMelhorRota}
                            disabled={loading}
                            className="bg-zinc-100 hover:bg-zinc-300 disabled:bg-zinc-700 text-zinc-950 disabled:text-zinc-400 font-black uppercase text-xs sm:text-sm px-6 py-3.5 border-2 border-zinc-100 disabled:border-zinc-700 transition-none flex items-center justify-center gap-3 cursor-pointer disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-zinc-950" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>CALCULANDO ROTA COM TRÂNSITO...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="square" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    <span>CALCULAR MELHOR ROTA (COM TRÂNSITO)</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Feedback da API Utilizada / Erros */}
                <div className="mt-4 flex flex-wrap items-center gap-3 min-h-[32px]">
                    {renderApiBadge()}

                    {errorMsg && (
                        <div className="inline-flex items-center gap-2 bg-rose-950 text-rose-300 border border-rose-800 text-xs font-mono px-3 py-1">
                            <span className="font-bold">ERRO:</span> {errorMsg}
                        </div>
                    )}
                </div>
            </header>

            {/* Container da Tabela com DndContext */}
            <div className="border border-zinc-800 bg-zinc-950 overflow-x-auto">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <table className="w-full border-collapse text-left">
                        <thead>
                            <tr className="bg-zinc-900 border-b-2 border-zinc-800 font-mono text-xs uppercase tracking-wider text-zinc-400">
                                <th className="p-3 text-center w-12 border-r border-zinc-800">MOVER</th>
                                <th className="p-3 text-center w-16 border-r border-zinc-800">ORDEM</th>
                                <th className="p-3 w-24 border-r border-zinc-800">PREVISTO</th>
                                <th className="p-3 border-r border-zinc-800">CLIENTE / CONTATO</th>
                                <th className="p-3 border-r border-zinc-800">ENDEREÇO</th>
                                <th className="p-3 text-center w-32 border-r border-zinc-800">LEAD</th>
                                <th className="p-3 text-center w-32 border-r border-zinc-800">STATUS</th>
                                <th className="p-3 text-right w-48">LAT / LNG</th>
                            </tr>
                        </thead>

                        <SortableContext
                            items={visitas.map((v) => v.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <tbody>
                                {visitas.map((visita, idx) => (
                                    <SortableRow
                                        key={visita.id}
                                        visita={visita}
                                        index={idx}
                                    />
                                ))}
                            </tbody>
                        </SortableContext>
                    </table>
                </DndContext>
            </div>

            {/* Rodapé Informativo */}
            <footer className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs font-mono text-zinc-500 border-t border-zinc-900 pt-3">
                <div>
                    ORDEM EDITÁVEL: CLIQUE E ARRASTE O ÍCONE <span className="text-zinc-300 font-bold">☰</span> PARA MODIFICAR
                </div>
                <div className="mt-1 sm:mt-0">
                    SISTEMA DE LOGÍSTICA // PROTOCOLO DE FALLBACK ATIVO
                </div>
            </footer>
        </div>
    );
};

export default TabelaVisitasDia;
