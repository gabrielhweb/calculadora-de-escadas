import React from 'react';
import { ApiUtilizada } from './types';
import { ApiBadge } from './ApiBadge';

interface TabelaVisitasHeaderProps {
    totalVisitas: number;
    loading: boolean;
    apiUtilizada: ApiUtilizada;
    errorMsg: string | null;
    onCalcularRota: () => void;
}

export const TabelaVisitasHeader: React.FC<TabelaVisitasHeaderProps> = ({
    totalVisitas,
    loading,
    apiUtilizada,
    errorMsg,
    onCalcularRota,
}) => {
    return (
        <header className="border-b-2 border-zinc-800 pb-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <span className="bg-zinc-100 text-zinc-950 font-black text-xs uppercase px-2 py-0.5 tracking-widest">
                            PAINEL LOGÍSTICO
                        </span>
                        <span className="text-zinc-500 font-mono text-xs">
                            TOTAL: {totalVisitas} PARADAS
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-4xl font-black tracking-tight uppercase mt-2 text-zinc-100">
                        Tabela de Visitas do Dia
                    </h1>
                    <p className="text-zinc-400 text-xs sm:text-sm mt-1 font-mono">
                        Ajuste a rota manualmente arrastando as linhas ou calcule a sequência ótima com tráfego em tempo real.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <button
                        type="button"
                        onClick={onCalcularRota}
                        disabled={loading}
                        className="bg-zinc-100 hover:bg-zinc-300 disabled:bg-zinc-700 text-zinc-950 disabled:text-zinc-400 font-black uppercase text-xs sm:text-sm px-6 py-3.5 border-2 border-zinc-100 disabled:border-zinc-700 transition-none flex items-center justify-center gap-3 cursor-pointer disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-4 w-4 text-zinc-950" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>CALCULANDO MELHOR ROTA...</span>
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

            <div className="mt-4 flex flex-wrap items-center gap-3 min-h-[32px]">
                <ApiBadge apiUtilizada={apiUtilizada} />

                {errorMsg && (
                    <div className="inline-flex items-center gap-2 bg-rose-950 text-rose-300 border border-rose-800 text-xs font-mono px-3 py-1">
                        <span className="font-bold">ERRO:</span> {errorMsg}
                    </div>
                )}
            </div>
        </header>
    );
};

export default TabelaVisitasHeader;
