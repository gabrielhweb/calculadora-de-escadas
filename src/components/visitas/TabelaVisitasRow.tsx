import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Visita, TemperaturaLead, StatusVisita } from './types';

interface TabelaVisitasRowProps {
    visita: Visita;
    index: number;
}

export const TabelaVisitasRow: React.FC<TabelaVisitasRowProps> = ({ visita, index }) => {
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

    const getTemperaturaBadge = (temp: TemperaturaLead) => {
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

    const getStatusBadge = (st: StatusVisita) => {
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

export default TabelaVisitasRow;
