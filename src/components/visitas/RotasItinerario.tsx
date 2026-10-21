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
        const waypoints = visitas.slice(1, -1).map((v) => `${v.latitude},${v.longitude}`).join('|');
        const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=driving`;
        window.open(url, '_blank');
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 space-y-6">
            {/* Bloco de Controle / Ações da Rota */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b-2 border-highlight">
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                            <span>🗺️</span>
                            <span>Itinerário e Rotas do Dia</span>
                        </h2>
                        <span className="bg-highlight/15 text-highlight border border-highlight/40 text-xs font-black px-2.5 py-1 rounded-full">
                            {visitas.length} {visitas.length === 1 ? 'parada' : 'paradas'}
                        </span>
                    </div>
                    {visitas.length > 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-1">
                            Início: <strong className="text-gray-800 dark:text-gray-200">{visitas[0]?.cliente}</strong> ➔ Destino final: <strong className="text-gray-800 dark:text-gray-200">{visitas[visitas.length - 1]?.cliente}</strong>
                        </p>
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-1">
                            Nenhuma parada agendada para hoje.
                        </p>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={onCalcularRota}
                        disabled={loading || visitas.length === 0}
                        className="bg-highlight hover:bg-amber-600 text-gray-950 font-black py-2.5 px-5 rounded-lg shadow-md transition-colors text-sm flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-4 w-4 text-gray-950" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Otimizando Rota...</span>
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

                    {visitas.length > 0 && (
                        <button
                            type="button"
                            onClick={abrirRotaCompleta}
                            className="bg-white dark:bg-gray-700 text-gray-800 dark:text-white border border-gray-300 dark:border-gray-600 font-bold py-2.5 px-4 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm flex items-center gap-2 cursor-pointer"
                            title="Abrir rota completa de todas as paradas no Google Maps"
                        >
                            <span>🗺️ Rota Completa no Maps</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Badges de Feedback de API e Erros */}
            <div className="flex flex-wrap items-center gap-3 min-h-[28px]">
                <ApiBadge apiUtilizada={apiUtilizada} />

                {errorMsg && (
                    <div className="inline-flex items-center gap-2 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800 text-xs rounded-full px-3 py-1">
                        <span className="font-bold">Aviso:</span> {errorMsg}
                    </div>
                )}
            </div>

            {/* Lista dos Cards de Paradas com visual IDÊNTICO às Opções Calculadas */}
            {visitas.length === 0 ? (
                <div className="p-8 text-center text-gray-500 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
                    Nenhuma visita registrada para traçar itinerário. Adicione visitas na aba "Tabela".
                </div>
            ) : (
                <div className="space-y-4">
                    {visitas.map((visita, idx) => (
                        <div
                            key={visita.id}
                            className="p-5 rounded-lg border-2 shadow-sm transition-all relative bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:border-highlight flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                        >
                            <div className="flex items-start gap-4 flex-1">
                                {/* Número da Parada */}
                                <div className="flex flex-col items-center justify-center bg-highlight/15 border border-highlight/40 text-highlight rounded-lg w-14 h-14 text-center shrink-0">
                                    <span className="text-[10px] font-black uppercase tracking-wider">PARADA</span>
                                    <span className="text-xl font-black">
                                        #{String(idx + 1).padStart(2, '0')}
                                    </span>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                        <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                                            {visita.cliente}
                                        </h3>
                                        <span className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs font-bold px-2.5 py-0.5 rounded-full border border-gray-300 dark:border-gray-600">
                                            ⏰ {visita.horarioPrevisto}
                                        </span>
                                        <span
                                            className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                                                visita.temperatura === 'QUENTE'
                                                    ? 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30'
                                                    : visita.temperatura === 'MORNO'
                                                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                                    : 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30'
                                            }`}
                                        >
                                            Lead {visita.temperatura}
                                        </span>
                                        <span className="bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-medium px-2 py-0.5 rounded-full border border-gray-300 dark:border-gray-600">
                                            {visita.status.replace('_', ' ')}
                                        </span>
                                    </div>

                                    <p className="text-gray-700 dark:text-gray-200 text-sm flex items-center gap-1.5 font-medium">
                                        📍 <span>{visita.endereco}</span>
                                    </p>

                                    <div className="text-xs text-gray-500 dark:text-gray-400 font-mono flex items-center gap-4 pt-0.5">
                                        <span>📞 {visita.telefone}</span>
                                        {visita.motivoVisita && (
                                            <span className="text-highlight font-sans font-bold">
                                                • {visita.motivoVisita}
                                            </span>
                                        )}
                                        <span>🌐 {visita.latitude.toFixed(4)}, {visita.longitude.toFixed(4)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Botões de Ação */}
                            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-gray-200 dark:border-gray-600">
                                <button
                                    type="button"
                                    onClick={() => abrirGoogleMaps(visita)}
                                    className="flex-1 md:flex-none bg-white dark:bg-gray-800 hover:border-highlight text-gray-800 dark:text-gray-200 font-bold text-xs py-2 px-3 rounded-lg border border-gray-300 dark:border-gray-600 transition-colors cursor-pointer"
                                >
                                    🗺️ Maps
                                </button>
                                <button
                                    type="button"
                                    onClick={() => abrirWaze(visita)}
                                    className="flex-1 md:flex-none bg-white dark:bg-gray-800 hover:border-highlight text-gray-800 dark:text-gray-200 font-bold text-xs py-2 px-3 rounded-lg border border-gray-300 dark:border-gray-600 transition-colors cursor-pointer"
                                >
                                    🚙 Waze
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onSelecionarParaRecibo(visita)}
                                    className="flex-1 md:flex-none bg-highlight hover:bg-amber-600 text-gray-950 font-black text-xs py-2 px-4 rounded-lg transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                                    title="Preencher formulário e gerar recibo deste cliente"
                                >
                                    📝 Gerar Recibo
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RotasItinerario;
