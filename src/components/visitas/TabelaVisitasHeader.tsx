import React from 'react';
import { ApiUtilizada } from './types';
import { ApiBadge } from './ApiBadge';

interface TabelaVisitasHeaderProps {
    totalVisitas: number;
    loading: boolean;
    apiUtilizada: ApiUtilizada;
    errorMsg: string | null;
    onCalcularRota: () => void;
    onNovaVisita?: () => void;
}

export const TabelaVisitasHeader: React.FC<TabelaVisitasHeaderProps> = ({
    totalVisitas,
    loading,
    apiUtilizada,
    errorMsg,
    onCalcularRota,
    onNovaVisita,
}) => {
    return (
        <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-highlight">
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                            <span>📋</span>
                            <span>Tabela de Visitas do Dia</span>
                        </h2>
                        <span className="bg-highlight/15 text-highlight border border-highlight/40 text-xs font-black px-2.5 py-1 rounded-full">
                            {totalVisitas} {totalVisitas === 1 ? 'parada' : 'paradas'}
                        </span>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-1">
                        Arraste as paradas pelo ícone <strong>☰</strong> para reordenar ou use a otimização de trânsito em tempo real.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {onNovaVisita && (
                        <button
                            type="button"
                            onClick={onNovaVisita}
                            className="bg-white dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 font-bold py-2.5 px-4 rounded-lg shadow-sm border border-gray-300 dark:border-gray-600 transition-colors text-sm flex items-center gap-2 cursor-pointer"
                        >
                            <span className="text-highlight font-black text-base">+</span>
                            <span>Nova Visita</span>
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={onCalcularRota}
                        disabled={loading || totalVisitas === 0}
                        className="bg-highlight hover:bg-amber-600 text-gray-950 font-black py-2.5 px-5 rounded-lg shadow-md transition-colors text-sm flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-4 w-4 text-gray-950" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Calculando Rota...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4 text-gray-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <span>Calcular Melhor Rota (Com Trânsito)</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 min-h-[28px]">
                <ApiBadge apiUtilizada={apiUtilizada} />

                {errorMsg && (
                    <div className="inline-flex items-center gap-2 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800 text-xs rounded-full px-3 py-1">
                        <span className="font-bold">Aviso:</span> {errorMsg}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TabelaVisitasHeader;
