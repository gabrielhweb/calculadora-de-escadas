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
} from '@dnd-kit/sortable';
import { Visita, ApiUtilizada } from '../components/visitas/types';
import { TabelaVisitasHeader } from '../components/visitas/TabelaVisitasHeader';
import { TabelaVisitasRow } from '../components/visitas/TabelaVisitasRow';

const VISITAS_PADRAO: Visita[] = [
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

export const PainelVisitas: React.FC = () => {
    const [visitas, setVisitas] = useState<Visita[]>(VISITAS_PADRAO);
    const [loading, setLoading] = useState<boolean>(false);
    const [apiUtilizada, setApiUtilizada] = useState<ApiUtilizada>(null);
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

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-8 font-sans selection:bg-zinc-100 selection:text-zinc-950">
            <TabelaVisitasHeader
                totalVisitas={visitas.length}
                loading={loading}
                apiUtilizada={apiUtilizada}
                errorMsg={errorMsg}
                onCalcularRota={handleCalcularMelhorRota}
            />

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
                                    <TabelaVisitasRow
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

export default PainelVisitas;
