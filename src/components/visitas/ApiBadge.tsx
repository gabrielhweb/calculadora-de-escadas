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
                <div className="inline-flex items-center gap-2 bg-emerald-500 text-black font-black uppercase text-xs px-3 py-1.5 border border-emerald-400">
                    <span className="w-2 h-2 bg-black"></span>
                    Trânsito Baseado no Google Maps
                </div>
            );
        case 'mapbox':
            return (
                <div className="inline-flex items-center gap-2 bg-sky-500 text-black font-black uppercase text-xs px-3 py-1.5 border border-sky-400">
                    <span className="w-2 h-2 bg-black"></span>
                    Trânsito Baseado no Mapbox
                </div>
            );
        case 'osrm':
            return (
                <div className="inline-flex items-center gap-2 bg-orange-500 text-black font-black uppercase text-xs px-3 py-1.5 border border-orange-400">
                    <span className="w-2 h-2 bg-black animate-pulse"></span>
                    Rota Otimizada por Distância sem Trânsito (OSRM)
                </div>
            );
        default:
            return null;
    }
};

export default ApiBadge;
