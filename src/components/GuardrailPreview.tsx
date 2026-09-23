import React from 'react';

interface GuardrailPreviewProps {
    length: number;
    height: number;
    totalBars: number;
    isGate?: boolean;
}

export const GuardrailPreview: React.FC<GuardrailPreviewProps> = ({ length, height, totalBars, isGate = false }) => {
    const svgW = 320;
    const svgH = 200;
    
    const margin = { top: 35, bottom: 45, left: 60, right: 60 };
    const drawW = svgW - margin.left - margin.right;
    const drawH = svgH - margin.top - margin.bottom;

    const numInnerBars = Math.max(0, totalBars - 2);
    const gapCm = numInnerBars >= 0 ? ((length - 4 - (numInnerBars * 3)) / (numInnerBars + 1)) : 0;
    
    return (
       <div className="flex flex-col items-center justify-center w-full">
           <svg viewBox={`0 0 ${svgW} ${svgH + 15}`} className="w-full max-w-md font-sans overflow-visible text-gray-800 dark:text-gray-300">
                {/* Title */}
                {isGate && <text x={svgW/2} y={12} textAnchor="middle" fill="#6b7280" className="font-black text-sm uppercase opacity-50">PORTÃO</text>}
                
                {/* Lines - Top Green */}
                <line x1={margin.left} y1={margin.top - 8} x2={svgW - margin.right} y2={margin.top - 8} stroke="#22c55e" strokeWidth="2" />
                <text x={svgW/2} y={margin.top - 15} textAnchor="middle" fill="#22c55e" fontSize="11" fontWeight="bold">{length}cm</text>
                
                {/* Lines - Bottom Orange */}
                <line x1={margin.left + 5} y1={svgH - margin.bottom + 12} x2={svgW - margin.right - 5} y2={svgH - margin.bottom + 12} stroke="#f97316" strokeWidth="2" />
                <text x={svgW/2} y={svgH - margin.bottom + 25} textAnchor="middle" fill="#f97316" fontSize="11" fontWeight="bold">{length - 4}cm</text>
                
                {/* Lines - Right Red (Altura) */}
                <line x1={svgW - margin.right + 12} y1={margin.top} x2={svgW - margin.right + 12} y2={svgH - margin.bottom} stroke="#ef4444" strokeWidth="2" />
                <text x={svgW - margin.right + 16} y={svgH/2} textAnchor="start" fill="#ef4444" fontSize="11" fontWeight="bold">{height}cm</text>

                {/* Lines - Left Blue (Altura - 13) */}
                <line x1={margin.left - 18} y1={margin.top + 10} x2={margin.left - 18} y2={svgH - margin.bottom} stroke="#3b82f6" strokeWidth="2" />
                <text x={margin.left - 22} y={svgH/2 + 10} textAnchor="end" fill="#3b82f6" fontSize="11" fontWeight="bold">{height - 13}cm</text>

                {/* STRUCTURE (Black) */}
                {/* Top horizontal */}
                <rect x={margin.left} y={margin.top} width={drawW} height={4} fill="currentColor" />
                {/* Bottom horizontal */}
                <rect x={margin.left + 4} y={svgH - margin.bottom - 4} width={drawW - 8} height={4} fill="currentColor" />
                
                {/* Outer Posts (WITH FEET) */}
                <rect x={margin.left} y={margin.top} width={4} height={drawH + 15} fill="currentColor" />
                <rect x={svgW - margin.right - 4} y={margin.top} width={4} height={drawH + 15} fill="currentColor" />
                
                {/* Inner Posts */}
                {Array.from({ length: numInnerBars }).map((_, i) => {
                    const step = (drawW - 8) / (numInnerBars + 1);
                    const x = margin.left + 4 + step * (i + 1) - 1.5; 
                    return (
                        <rect key={i} x={x} y={margin.top + 10} width={3} height={drawH - 14} fill="currentColor" />
                    )
                })}
                
                {/* Gap Pink */}
                {numInnerBars > 0 && (
                    <>
                        <line x1={margin.left + 4} y1={svgH/2} x2={margin.left + 4 + (drawW - 8) / (numInnerBars + 1) - 1.5} y2={svgH/2} stroke="#ec4899" strokeWidth="1" strokeDasharray="3" />
                        <text x={margin.left + 4 + ((drawW - 8) / (numInnerBars + 1)) / 2} y={svgH/2 - 5} textAnchor="middle" fill="#ec4899" fontSize="9" fontWeight="bold">{gapCm.toFixed(1)}cm</text>
                    </>
                )}

                {/* HINGES AND LATCH (If gate) */}
                {isGate && (
                    <>
                        <circle cx={margin.left - 2} cy={margin.top + 15} r={3} fill="#6b7280" />
                        <circle cx={margin.left - 2} cy={svgH - margin.bottom - 15} r={3} fill="#6b7280" />
                        <rect x={svgW - margin.right - 6} y={svgH/2 - 5} width={8} height={12} fill="#6b7280" rx={2} />
                    </>
                )}
           </svg>
           
           <div className="mt-4 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-3">
                <p className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-2 border-b pb-1">Lista de Cortes:</p>
                <ul className="text-[10px] space-y-1.5 text-gray-700 dark:text-gray-300">
                    <li className="flex items-center gap-2"><span className="w-3 h-3 bg-green-500 rounded-full inline-block flex-shrink-0"></span> 1x Tubo Superior de {length}cm</li>
                    <li className="flex items-center gap-2"><span className="w-3 h-3 bg-orange-500 rounded-full inline-block flex-shrink-0"></span> 1x Tubo Inferior de {length - 4}cm</li>
                    <li className="flex items-center gap-2"><span className="w-3 h-3 bg-red-500 rounded-full inline-block flex-shrink-0"></span> 2x Tubos Laterais (Pontas) de {height}cm</li>
                    <li className="flex items-center gap-2"><span className="w-3 h-3 bg-blue-500 rounded-full inline-block flex-shrink-0"></span> {numInnerBars}x Tubos Internos de {height - 13}cm</li>
                </ul>
                <p className="text-[10px] text-pink-500 font-bold mt-2 pt-2 border-t border-pink-100">Afastamento das barras (folga): {gapCm.toFixed(1)}cm</p>
           </div>
       </div>
    );
};
