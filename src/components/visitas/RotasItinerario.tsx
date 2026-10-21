import React from 'react';
import { Visita, ApiUtilizada } from './types';
import { ApiBadge } from './ApiBadge';

interface RotasItinerarioProps {
    visitas: Visita[];
    loading: boolean;
    apiUtilizada: ApiUtilizada;
    errorMsg: string | null;
    onCalcularRota: () => void;
    onSelecionarParaRecibo: (visita: Visita) => void;
}

export const RotasItinerario: React.FC<RotasItinerarioProps> = ({
    visitas,
    loading,
    apiUtilizada,
    errorMsg,
    onCalcularRota,
    onSelecionarParaRecibo,
}) => {
    const abrirGoogleMaps = (v: Visita) => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${v.latitude},${v.longitude}`;
        window.open(url, '_blank');
    };

    const abrirWaze = (v: Visita) => {
        const url = `https://waze.com/ul?ll=${v.latitude},${v.longitude}&navigate=yes`;
        window.open(url, '_blank');
    };

    const abrirRotaCompleta = () => {
        if (visitas.length === 0) return;
        const origin = `${visitas[0].latitude},${visitas[0].longitude}`;
        const destination = `${visitas[visitas.length - 1].latitude},${visitas[visitas.length - 1].longitude}`;
        const waypoints = visitas.slice(1, -1).map(v => `${v.latitude},${v.longitude}`).join('|');
        const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=driving`;
        window.open(url, '_blank');
    };

    return (
        <div className="space-y-6">
            {/* Top Bar de Otimização */}
            <div className="border border-zinc-800 bg-zinc-900 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="bg-zinc-100 text-zinc-950 font-black text-xs uppercase px-2 py-0.5 tracking-wider">
                            ITINERÁRIO DO DIA
                        </span>
                        <span className="text-zinc-400 font-mono text-xs">
                            {visitas.length} PONTOS DE PARADA
                        </span>
                    </div>
                    <h3 className="text-xl font-black text-zinc-100 uppercase tracking-tight mt-1">
                        Sequência Ótima de Deslocamento
                    </h3>
                    <p className="text-zinc-400 text-xs font-mono mt-0.5">
                        Início em: <strong className="text-zinc-200">{visitas[0]?.cliente || 'N/A'}</strong> ➡️ Destino final: <strong className="text-zinc-200">{visitas[visitas.length - 1]?.cliente || 'N/A'}</strong>
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={onCalcularRota}
                        disabled={loading}
                        className="bg-zinc-100 hover:bg-zinc-300 disabled:bg-zinc-700 text-zinc-950 disabled:text-zinc-400 font-black uppercase text-xs sm:text-sm px-5 py-3 border-2 border-zinc-100 disabled:border-zinc-700 transition-none flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-4 w-4 text-zinc-950" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>OTIMIZANDO ROTA...</span>
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

                    <button
                        type="button"
                        onClick={abrirRotaCompleta}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-xs sm:text-sm px-5 py-3 border border-blue-500 transition-none flex items-center gap-2 cursor-pointer"
                        title="Abrir rota completa de todas as paradas no Google Maps"
                    >
                        🗺️ ABRIR ROTA COMPLETA
                    </button>
                </div>
            </div>

            {/* Badges de Feedback */}
            <div className="flex flex-wrap items-center gap-3">
                <ApiBadge apiUtilizada={apiUtilizada} />

                {errorMsg && (
                    <div className="inline-flex items-center gap-2 bg-rose-950 text-rose-300 border border-rose-800 text-xs font-mono px-3 py-1.5">
                        <span className="font-bold">ERRO:</span> {errorMsg}
                    </div>
                )}
            </div>

            {/* Linha do Tempo / Cards das Visitas */}
            <div className="space-y-4">
                {visitas.map((visita, idx) => (
                    <div
                        key={visita.id}
                        className="border border-zinc-800 bg-zinc-950 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-zinc-700 transition-colors"
                    >
                        <div className="flex items-start gap-4 flex-1">
                            {/* Posição na Rota */}
                            <div className="flex flex-col items-center justify-center bg-zinc-900 border border-zinc-800 w-14 h-14 text-center shrink-0">
                                <span className="text-[10px] font-mono text-zinc-500 uppercase">PARADA</span>
                                <span className="text-lg font-black font-mono text-zinc-100">
                                    #{String(idx + 1).padStart(2, '0')}
                                </span>
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <span className="text-lg font-black text-zinc-100 tracking-tight">
                                        {visita.cliente}
                                    </span>
                                    <span className="bg-zinc-800 text-zinc-300 font-mono text-xs px-2 py-0.5 border border-zinc-700">
                                        ⏰ {visita.horarioPrevisto}
                                    </span>
                                    <span
                                        className={`font-black text-[10px] tracking-widest uppercase px-2 py-0.5 ${
                                            visita.temperatura === 'QUENTE'
                                                ? 'bg-red-600 text-white'
                                                : visita.temperatura === 'MORNO'
                                                ? 'bg-orange-500 text-black'
                                                : 'bg-cyan-500 text-black'
                                        }`}
                                    >
                                        LEAD {visita.temperatura}
                                    </span>
                                    <span className="bg-zinc-800 text-zinc-400 font-mono text-xs px-2 py-0.5">
                                        {visita.status}
                                    </span>
                                </div>

                                <p className="text-zinc-300 text-sm font-sans flex items-center gap-1.5">
                                    📍 <span>{visita.endereco}</span>
                                </p>

                                <div className="text-xs text-zinc-500 font-mono flex items-center gap-4">
                                    <span>📞 {visita.telefone}</span>
                                    <span>🌐 {visita.latitude.toFixed(4)}, {visita.longitude.toFixed(4)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Botões de Ação Rápida */}
                        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-zinc-900">
                            <button
                                type="button"
                                onClick={() => abrirGoogleMaps(visita)}
                                className="flex-1 md:flex-none bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 font-bold uppercase text-xs px-3 py-2 transition-colors cursor-pointer"
                            >
                                🗺️ Maps
                            </button>
                            <button
                                type="button"
                                onClick={() => abrirWaze(visita)}
                                className="flex-1 md:flex-none bg-sky-950 hover:bg-sky-900 text-sky-200 border border-sky-800 font-bold uppercase text-xs px-3 py-2 transition-colors cursor-pointer"
                            >
                                🚙 Waze
                            </button>
                            <button
                                type="button"
                                onClick={() => onSelecionarParaRecibo(visita)}
                                className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs px-3 py-2 border border-emerald-500 transition-colors cursor-pointer"
                                title="Preencher formulário de recibo com os dados deste cliente"
                            >
                                📝 Gerar Recibo
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RotasItinerario;
