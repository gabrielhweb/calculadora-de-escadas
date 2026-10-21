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
                <div className="inline-flex items-center gap-2 bg-green-500/15 text-green-700 dark:text-green-400 border border-green-500/40 rounded-full text-xs font-black px-3 py-1 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Trânsito Baseado no Google Maps
                </div>
            );
        case 'mapbox':
            return (
                <div className="inline-flex items-center gap-2 bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-500/40 rounded-full text-xs font-black px-3 py-1 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
                    Trânsito Baseado no Mapbox
                </div>
            );
        case 'osrm':
            return (
                <div className="inline-flex items-center gap-2 bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/40 rounded-full text-xs font-black px-3 py-1 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Rota Otimizada por Distância sem Trânsito (OSRM)
                </div>
            );
        default:
            return null;
    }
};

export default ApiBadge;
