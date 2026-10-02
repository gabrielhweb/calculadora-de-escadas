import React from 'react';

interface LandingPreviewProps {
    length: number;
    width: number;
    type?: 'fixed' | 'articulated';
}

export const LandingPreview: React.FC<LandingPreviewProps> = ({ length, width, type = 'articulated' }) => {
    const svgW = 320;
    const svgH = 200;
    
    const margin = { top: 40, bottom: 40, left: 60, right: 60 };
    const drawW = svgW - margin.left - margin.right;
    const drawH = svgH - margin.top - margin.bottom;

    return (
       <div className="flex flex-col items-center justify-center w-full">
           <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-md font-sans overflow-visible text-gray-800 dark:text-gray-300">
                {/* Title */}
                <text x={svgW/2} y={15} textAnchor="middle" fill="#6b7280" className="font-black text-sm uppercase opacity-50">PATAMAR {type === 'fixed' ? 'FIXO' : 'ARTICULADO'}</text>
                
                {/* Lines - Width (X axis) */}
                <line x1={margin.left} y1={margin.top - 10} x2={svgW - margin.right} y2={margin.top - 10} stroke="#22c55e" strokeWidth="2" />
                <text x={svgW/2} y={margin.top - 15} textAnchor="middle" fill="#22c55e" fontSize="11" fontWeight="bold">{width}cm (Largura)</text>
                
                {/* Lines - Length (Y axis) */}
                <line x1={margin.left - 10} y1={margin.top} x2={margin.left - 10} y2={svgH - margin.bottom} stroke="#3b82f6" strokeWidth="2" />
                <text x={margin.left - 15} y={svgH/2} textAnchor="end" fill="#3b82f6" fontSize="11" fontWeight="bold">{length}cm (Comprimento)</text>

                {/* STRUCTURE (Black) */}
                {/* Outer frame */}
                <rect x={margin.left} y={margin.top} width={drawW} height={drawH} fill="none" stroke="currentColor" strokeWidth="4" />
                
                {/* Fill with a slight pattern or solid color */}
                <rect x={margin.left + 2} y={margin.top + 2} width={drawW - 4} height={drawH - 4} fill="currentColor" fillOpacity="0.1" />

                {/* Inner structure lines to make it look like a plate or framework */}
                <line x1={margin.left + 2} y1={margin.top + drawH/2} x2={svgW - margin.right - 2} y2={margin.top + drawH/2} stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" />
                <line x1={margin.left + drawW/2} y1={margin.top + 2} x2={margin.left + drawW/2} y2={svgH - margin.bottom - 2} stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" />
           </svg>
       </div>
    );
};
