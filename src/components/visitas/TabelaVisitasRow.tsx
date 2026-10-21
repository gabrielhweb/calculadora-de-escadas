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
                return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-700';
            case 'MORNO':
                return 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200 dark:border-orange-700';
            case 'FRIO':
                return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300 border-cyan-200 dark:border-cyan-700';
            default:
                return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
        }
    };

    const getStatusBadge = (st: StatusVisita) => {
        switch (st) {
            case 'PENDENTE':
                return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-700';
            case 'EM_ROTA':
                return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-700';
            case 'CONCLUIDO':
                return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-700';
            case 'CANCELADO':
                return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
            default:
                return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
        }
    };

    return (
        <tr
            ref={setNodeRef}
            style={style}
            className={`transition-colors ${
                isDragging
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-2 border-blue-400'
                    : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
        >
            <td className="p-3 text-center w-12 text-gray-400">
                <button
                    {...attributes}
                    {...listeners}
                    type="button"
                    title="Clique e arraste para reordenar a parada"
                    className="cursor-grab active:cursor-grabbing p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                    <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                    </svg>
                </button>
            </td>

            <td className="p-3 text-center w-16">
                <span className="font-bold text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-600">
                    #{String(index + 1).padStart(2, '0')}
                </span>
            </td>

            <td className="p-3 font-semibold text-sm text-gray-900 dark:text-gray-100 w-24">
                {visita.horarioPrevisto}
            </td>

            <td className="p-3">
                <div className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                    <span>{visita.cliente}</span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-0.5">
                    <span>📞 {visita.telefone}</span>
                    {visita.motivoVisita && (
                        <span className="text-blue-600 dark:text-blue-400 font-medium">
                            • {visita.motivoVisita}
                        </span>
                    )}
                </div>
            </td>

            <td className="p-3 text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate" title={visita.endereco}>
                {visita.endereco}
            </td>

            <td className="p-3 text-center w-28">
                <span className={`inline-block font-semibold text-xs border rounded-full px-2.5 py-0.5 ${getTemperaturaBadge(visita.temperatura)}`}>
                    {visita.temperatura}
                </span>
            </td>

            <td className="p-3 text-center w-32">
                <span className={`inline-block font-semibold text-xs border rounded-full px-2.5 py-0.5 ${getStatusBadge(visita.status)}`}>
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
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60 p-1.5 rounded-lg text-xs font-semibold border border-emerald-200 dark:border-emerald-800 transition-colors"
                        >
                            📝 Recibo
                        </button>
                    )}
                    {onRemoverVisita && (
                        <button
                            type="button"
                            onClick={() => onRemoverVisita(visita.id)}
                            title="Remover visita"
                            className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
