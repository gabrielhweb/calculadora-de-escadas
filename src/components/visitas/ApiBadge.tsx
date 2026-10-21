import React from 'react';
import { ApiUtilizada } from './types';

interface ApiBadgeProps {
    apiUtilizada: ApiUtilizada;
}

export const ApiBadge: React.FC<ApiBadgeProps> = ({ apiUtilizada }) => {
    if (!apiUtilizada) return null;

    switch (apiUtilizada) {
        case 'google':
            return (
                <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 rounded-full text-xs font-bold px-3 py-1 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Trânsito Baseado no Google Maps
                </div>
            );
        case 'mapbox':
            return (
                <div className="inline-flex items-center gap-2 bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300 border border-sky-200 dark:border-sky-700 rounded-full text-xs font-bold px-3 py-1 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
                    Trânsito Baseado no Mapbox
                </div>
            );
        case 'osrm':
            return (
                <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-700 rounded-full text-xs font-bold px-3 py-1 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Rota Otimizada por Distância sem Trânsito (OSRM)
                </div>
            );
        default:
            return null;
    }
};

export default ApiBadge;
