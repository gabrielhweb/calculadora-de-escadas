import React from 'react';
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
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Visita, ApiUtilizada } from './types';
import { TabelaVisitasHeader } from './TabelaVisitasHeader';
import { TabelaVisitasRow } from './TabelaVisitasRow';

interface TabelaVisitasViewProps {
    visitas: Visita[];
    loading: boolean;
    apiUtilizada: ApiUtilizada;
    errorMsg: string | null;
    onDragEnd: (event: DragEndEvent) => void;
    onCalcularRota: () => void;
}

export const TabelaVisitasView: React.FC<TabelaVisitasViewProps> = ({
    visitas,
    loading,
    apiUtilizada,
    errorMsg,
    onDragEnd,
    onCalcularRota,
}) => {
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

    return (
        <div className="space-y-4">
            <TabelaVisitasHeader
                totalVisitas={visitas.length}
                loading={loading}
                apiUtilizada={apiUtilizada}
                errorMsg={errorMsg}
                onCalcularRota={onCalcularRota}
            />

            <div className="border border-zinc-800 bg-zinc-950 overflow-x-auto">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={onDragEnd}
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

            <footer className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs font-mono text-zinc-500 border-t border-zinc-900 pt-3">
                <div>
                    ORDEM EDITÁVEL: CLIQUE E ARRASTE O ÍCONE <span className="text-zinc-300 font-bold">☰</span> PARA REORDENAR MANUALMENTE
                </div>
                <div className="mt-1 sm:mt-0">
                    SISTEMA DE LOGÍSTICA // PROTOCOLO DE FALLBACK ATIVO
                </div>
            </footer>
        </div>
    );
};

export default TabelaVisitasView;
