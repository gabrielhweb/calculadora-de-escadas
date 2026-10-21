import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Visita, TemperaturaLead, StatusVisita } from './types';

interface TabelaVisitasRowProps {
    visita: Visita;
    index: number;
    onRemoverVisita?: (id: string) => void;
    onSelecionarParaRecibo?: (v: Visita) => void;
}

export const TabelaVisitasRow: React.FC<TabelaVisitasRowProps> = ({
    visita,
    index,
    onRemoverVisita,
    onSelecionarParaRecibo,
}) => {
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
                return 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30';
            case 'MORNO':
                return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
            case 'FRIO':
                return 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30';
            default:
                return 'bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/30';
        }
    };

    const getStatusBadge = (st: StatusVisita) => {
        switch (st) {
            case 'PENDENTE':
                return 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30';
            case 'EM_ROTA':
                return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30';
            case 'CONCLUIDO':
                return 'bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30';
            case 'CANCELADO':
                return 'bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/30';
            default:
                return 'bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/30';
        }
    };

    return (
        <tr
            ref={setNodeRef}
            style={style}
            className={`transition-colors ${
                isDragging
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-2 border-highlight'
                    : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/60'
            }`}
        >
            <td className="p-3 text-center w-12 text-gray-400">
                <button
                    {...attributes}
                    {...listeners}
                    type="button"
                    title="Clique e arraste para reordenar a parada"
                    className="cursor-grab active:cursor-grabbing p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-highlight transition-colors"
                >
                    <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                    </svg>
                </button>
            </td>

            <td className="p-3 text-center w-16">
                <span className="font-black text-xs bg-highlight/15 text-highlight px-2.5 py-1 rounded-full border border-highlight/40">
                    #{String(index + 1).padStart(2, '0')}
                </span>
            </td>

            <td className="p-3 font-black text-sm text-gray-900 dark:text-gray-100 w-24">
                {visita.horarioPrevisto}
            </td>

            <td className="p-3">
                <div className="font-black text-sm text-gray-900 dark:text-white flex items-center gap-2">
                    <span>{visita.cliente}</span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-0.5">
                    <span>📞 {visita.telefone}</span>
                    {visita.motivoVisita && (
                        <span className="text-highlight font-semibold">
                            • {visita.motivoVisita}
                        </span>
                    )}
                </div>
            </td>

            <td className="p-3 text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate" title={visita.endereco}>
                {visita.endereco}
            </td>

            <td className="p-3 text-center w-28">
                <span className={`inline-block font-bold text-xs border rounded-full px-2.5 py-0.5 ${getTemperaturaBadge(visita.temperatura)}`}>
                    {visita.temperatura}
                </span>
            </td>

            <td className="p-3 text-center w-32">
                <span className={`inline-block font-bold text-xs border rounded-full px-2.5 py-0.5 ${getStatusBadge(visita.status)}`}>
                    {visita.status.replace('_', ' ')}
                </span>
            </td>

            <td className="p-3 text-right w-36">
                <div className="flex items-center justify-end gap-1.5">
                    {onSelecionarParaRecibo && (
                        <button
                            type="button"
                            onClick={() => onSelecionarParaRecibo(visita)}
                            title="Gerar recibo com dados deste cliente"
                            className="bg-highlight/15 hover:bg-highlight/30 text-amber-800 dark:text-highlight p-1.5 px-2.5 rounded-lg text-xs font-black border border-highlight/40 transition-colors cursor-pointer"
                        >
                            📝 Recibo
                        </button>
                    )}
                    {onRemoverVisita && (
                        <button
                            type="button"
                            onClick={() => onRemoverVisita(visita.id)}
                            title="Remover visita"
                            className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                        >
                            🗑️
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
};

export default TabelaVisitasRow;
