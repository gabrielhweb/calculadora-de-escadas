
import React, { useState } from 'react';
import { ProposalOption } from '../types';

interface StaircaseVisualizerProps {
  option: ProposalOption;
  totalHeight: number;
  slabOpening?: number;
  slabThickness?: number;
  onClose: () => void;
}

const StaircaseVisualizer: React.FC<StaircaseVisualizerProps> = ({ option, totalHeight, slabOpening, slabThickness = 15, onClose }) => {
  const [viewMode, setViewMode] = useState<'side' | 'top' | '3d'>('side');

  // Configurações de desenho
  const margin = 80; // Margem maior para caber textos
  const totalLength = option.totalLength;
  
  // --- CÁLCULO DA GEOMETRIA DO VÃO ---
  const hasSlabInfo = slabOpening !== undefined && slabOpening > 0;
  
  // Definindo onde termina a escada (Chegada no piso superior)
  const stairEndX = margin + totalLength;
  
  // Definindo onde começa o buraco (Vão Livre)
  // Lógica: O vão livre termina onde a escada termina (na parede de chegada).
  // Logo, o INÍCIO do vão é: Fim da Escada - Tamanho do Vão.
  // Exemplo: Escada de 300cm. Vão de 200cm. O vão começa em 100cm e vai até 300cm.
  // A Laje sólida vai de 0 a 100cm.
  const openingStartX = hasSlabInfo 
    ? stairEndX - (slabOpening || 0) 
    : stairEndX + 50; // Se não tem vão, joga a laje pra longe

  // Ajuste do Canvas
  const svgWidth = Math.max(1000, stairEndX + margin + 100);
  const svgHeight = totalHeight + (margin * 3) + 100;
  const floorY = svgHeight - margin - 50; // Y do chão (sobe um pouco para caber cotas)
  const ceilingY = floorY - totalHeight; // Y do teto/piso superior
  const slabBottomY = ceilingY + (slabThickness || 0); // Y do fundo da laje

  // --- CÁLCULO DE CABEÇADA (HEADROOM) ---
  const calculateCriticalHeadroom = () => {
    if (!hasSlabInfo) return null;
    
    // Vamos encontrar qual degrau está verticalmente alinhado com o INÍCIO DO VÃO (openingStartX)
    let currentX = margin;
    let currentY = floorY;
    let criticalStepInfo = null;

    // Se o vão for maior que a escada (começa antes da escada), o ponto crítico é o primeiro degrau
    if (openingStartX < margin) {
         const firstStepY = floorY - option.stepHeight;
         const clearance = firstStepY - slabBottomY;
         return {
             x: margin, // Desenha a linha no começo da escada
             stepY: firstStepY,
             slabY: slabBottomY,
             clearance: clearance,
             isSafe: clearance >= 185,
             stepIndex: 1
         };
    }

    // Itera degrau por degrau
    for (let i = 1; i <= option.steps; i++) {
        // Topo do degrau atual
        const stepTopY = currentY - option.stepHeight;
        
        const landing = option.landings.find(l => l.step === i);
        const run = landing ? landing.length : (i === option.steps ? 20 : option.treadDepth);
        const nextX = currentX + run;

        // Verifica se a linha da laje (openingStartX) passa POR CIMA desse degrau
        // (Entre o começo e o fim do pisante)
        if (openingStartX >= currentX && openingStartX < nextX) {
            const clearance = stepTopY - slabBottomY;
            criticalStepInfo = {
                x: openingStartX,
                stepY: stepTopY,
                slabY: slabBottomY,
                clearance: clearance,
                isSafe: clearance >= 185,
                stepIndex: i
            };
            break;
        }
        
        // Se já passou da escada e não achou (ex: vão muito pequeno no topo), pega o último
        if (i === option.steps && !criticalStepInfo) {
             // O ponto crítico é a quina da laje batendo na canela de quem chega?
             // Vamos considerar o último degrau
             criticalStepInfo = {
                x: openingStartX,
                stepY: stepTopY,
                slabY: slabBottomY,
                clearance: stepTopY - slabBottomY,
                isSafe: (stepTopY - slabBottomY) >= 185,
                stepIndex: i
            };
        }

        currentY -= option.stepHeight;
        currentX += run;
    }

    return criticalStepInfo;
  };

  const headroom = calculateCriticalHeadroom();

  // --- DESENHO VISTA LATERAL ---
  const renderSideView = () => {
    let path = `M ${margin} ${floorY}`; 
    let currentX = margin;
    let currentY = floorY;

    // Desenha a linha da escada
    for (let i = 1; i <= option.steps; i++) {
        currentY -= option.stepHeight;
        path += ` L ${currentX} ${currentY}`;
        const landing = option.landings.find(l => l.step === i);
        const run = landing ? landing.length : (i === option.steps ? 20 : option.treadDepth);
        currentX += run;
        path += ` L ${currentX} ${currentY}`;
    }

    return (
        <svg width="100%" height="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="bg-blueprint-grid">
            <defs>
                <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e0f2fe" strokeWidth="1"/>
                </pattern>
                {/* Padrão de Concreto */}
                <pattern id="concrete" width="10" height="10" patternUnits="userSpaceOnUse">
                     <rect width="10" height="10" fill="#94a3b8"/>
                     <path d="M 0 0 L 2 2 M 8 8 L 10 10" stroke="#64748b" strokeWidth="1"/>
                </pattern>
                <marker id="arrow" markerWidth="10" markerHeight="10" refX="0" refY="3" orient="auto" markerUnits="strokeWidth">
                    <path d="M0,0 L0,6 L9,3 z" fill="#000" />
                </marker>
                 <marker id="arrowRed" markerWidth="10" markerHeight="10" refX="0" refY="3" orient="auto" markerUnits="strokeWidth">
                    <path d="M0,0 L0,6 L9,3 z" fill="#dc2626" />
                </marker>
                 <marker id="arrowGreen" markerWidth="10" markerHeight="10" refX="0" refY="3" orient="auto" markerUnits="strokeWidth">
                    <path d="M0,0 L0,6 L9,3 z" fill="#16a34a" />
                </marker>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* 1. CHÃO */}
            <line x1={0} y1={floorY} x2={svgWidth} y2={floorY} stroke="#333" strokeWidth="4" />
            <text x={margin} y={floorY + 25} className="text-sm font-bold text-gray-700">PISO INFERIOR</text>

            {/* 2. ESCADA */}
            <path d={path} fill="none" stroke="#1e3a8a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <path d={`${path} L ${stairEndX} ${floorY} L ${margin} ${floorY} Z`} fill="rgba(30, 58, 138, 0.1)" stroke="none" />

            {/* 3. AMBIENTE (LAJE E VÃO) */}
            {hasSlabInfo ? (
                <g>
                    {/* Laje Sólida (Do inicio X=0 até onde começa o buraco) */}
                    <rect 
                        x={0} 
                        y={ceilingY} 
                        width={openingStartX} 
                        height={slabThickness || 15} 
                        fill="url(#concrete)" 
                        stroke="#475569" 
                        strokeWidth="2"
                    />
                    
                    {/* Linha de Cota da Laje */}
                    <line x1={margin} y1={ceilingY - 20} x2={openingStartX} y2={ceilingY - 20} stroke="black" markerEnd="url(#arrow)"/>
                    <text x={(margin + openingStartX)/2} y={ceilingY - 25} textAnchor="middle" className="text-xs font-bold text-gray-600">LAJE EXISTENTE</text>

                    {/* Vão Livre (Linha grossa indicando abertura) */}
                    <line x1={openingStartX} y1={ceilingY} x2={stairEndX + 50} y2={ceilingY} stroke="#16a34a" strokeWidth="4" />
                    <text x={openingStartX + 10} y={ceilingY - 10} className="text-sm font-bold text-green-700">VÃO LIVRE ({slabOpening}cm)</text>

                    {/* Linha vertical indicando o final da laje (A quina perigosa) */}
                    <line x1={openingStartX} y1={ceilingY - 30} x2={openingStartX} y2={slabBottomY + 50} stroke="red" strokeWidth="1" strokeDasharray="5,5"/>
                    <text x={openingStartX - 5} y={slabBottomY + 20} textAnchor="end" className="text-xs font-bold text-red-600">QUINA DA LAJE</text>
                </g>
            ) : (
                 <line x1={0} y1={ceilingY} x2={svgWidth} y2={ceilingY} stroke="#333" strokeWidth="4" strokeDasharray="10,5" opacity="0.3" />
            )}

            {/* 4. VALIDAÇÃO DE ALTURA (HEADROOM) */}
            {hasSlabInfo && headroom && (
                <g>
                    {/* Linha de Medição Real */}
                    <line 
                        x1={headroom.x} 
                        y1={headroom.stepY} 
                        x2={headroom.x} 
                        y2={headroom.slabY} 
                        stroke={headroom.isSafe ? "#16a34a" : "#dc2626"} 
                        strokeWidth="3" 
                        markerStart={headroom.isSafe ? "url(#arrowGreen)" : "url(#arrowRed)"}
                        markerEnd={headroom.isSafe ? "url(#arrowGreen)" : "url(#arrowRed)"}
                    />
                    
                    {/* Caixa de Texto da Medida */}
                    <rect 
                        x={headroom.x + 15} 
                        y={headroom.slabY + (headroom.clearance / 2) - 20} 
                        width="160" 
                        height="50" 
                        fill="white" 
                        stroke={headroom.isSafe ? "#16a34a" : "#dc2626"} 
                        rx="4"
                        strokeWidth="2"
                    />
                    <text x={headroom.x + 25} y={headroom.slabY + (headroom.clearance / 2) - 5} className="text-sm font-black" fill={headroom.isSafe ? "#16a34a" : "#dc2626"}>
                        {headroom.clearance.toFixed(1)}cm (Real)
                    </text>
                    <text x={headroom.x + 25} y={headroom.slabY + (headroom.clearance / 2) + 15} className="text-xs font-bold text-gray-500">
                        no degrau #{headroom.stepIndex}
                    </text>

                    {/* LINHA DE REFERÊNCIA 185cm (SOLICITADO) */}
                    {/* Desenha uma linha a 185cm do degrau pra cima */}
                    <line 
                        x1={headroom.x - 40} 
                        y1={headroom.stepY - 185} 
                        x2={headroom.x + 40} 
                        y2={headroom.stepY - 185} 
                        stroke="blue" 
                        strokeWidth="2" 
                        strokeDasharray="4,2"
                    />
                    <text x={headroom.x + 45} y={headroom.stepY - 182} className="text-xs font-bold text-blue-600">Mínimo 185cm</text>
                    
                    {/* Se a laje estiver ABAIXO da linha de 185cm, desenha um X */}
                    {!headroom.isSafe && (
                        <text x={headroom.x} y={headroom.stepY - 185} textAnchor="middle" alignmentBaseline="middle" fontSize="24">❌</text>
                    )}
                </g>
            )}

            {/* Cotas Gerais */}
            <line x1={margin - 30} y1={floorY} x2={margin - 30} y2={ceilingY} stroke="black" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
            <text x={margin - 35} y={floorY - (totalHeight/2)} textAnchor="end" className="text-sm font-bold">H={totalHeight}</text>
            
            <line x1={margin} y1={floorY + 50} x2={stairEndX} y2={floorY + 50} stroke="black" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
            <text x={margin + (totalLength/2)} y={floorY + 70} textAnchor="middle" className="text-sm font-bold">Comprimento Total da Escada = {totalLength.toFixed(0)}cm</text>
        </svg>
    );
  };

  // --- DESENHO ISOMÉTRICO 3D ---
  const renderIsometricView = () => {
    const scale = 0.8;
    const isoCenterX = svgWidth / 2;
    const isoStartY = svgHeight - 100;
    const toIso = (x: number, y: number, z: number) => {
        const isoX = (x - y) * Math.cos(Math.PI / 6);
        const isoY = (x + y) * Math.sin(Math.PI / 6) - z;
        return { x: isoCenterX + (isoX * scale), y: isoStartY + (isoY * scale) };
    };

    let currentDepth = 0;
    let currentHeight = 0;
    const width = option.stairWidth;
    const shapes = [];

    for (let i = 1; i <= option.steps; i++) {
        const landing = option.landings.find(l => l.step === i);
        const run = landing ? landing.length : (i === option.steps ? 20 : option.treadDepth);
        const rise = option.stepHeight;
        
        const p1 = toIso(0, currentDepth, currentHeight); 
        const p2 = toIso(width, currentDepth, currentHeight);
        const p3 = toIso(width, currentDepth, currentHeight + rise);
        const p4 = toIso(0, currentDepth, currentHeight + rise);
        const p5 = toIso(0, currentDepth + run, currentHeight + rise);
        const p6 = toIso(width, currentDepth + run, currentHeight + rise); 

        const colorTop = landing ? '#fdba74' : '#e2e8f0'; 
        const colorSide = landing ? '#fb923c' : '#cbd5e1';
        const colorFront = landing ? '#f97316' : '#94a3b8';

        shapes.push(
            <g key={i}>
                <path d={`M${p1.x},${p1.y} L${p2.x},${p2.y} L${p3.x},${p3.y} L${p4.x},${p4.y} Z`} fill={colorFront} stroke="black" strokeWidth="0.5" />
                <path d={`M${p4.x},${p4.y} L${p3.x},${p3.y} L${p6.x},${p6.y} L${p5.x},${p5.y} Z`} fill={colorTop} stroke="black" strokeWidth="0.5" />
                <path d={`M${p2.x},${p2.y} L${p3.x},${p3.y} L${p6.x},${p6.y} L${toIso(width, currentDepth + run, currentHeight).x},${toIso(width, currentDepth + run, currentHeight).y} Z`} fill={colorSide} opacity="0.6" />
            </g>
        );
        currentHeight += rise;
        currentDepth += run;
    }

    return (
        <svg width="100%" height="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="bg-white">
             <text x="50" y="50" className="text-xl font-bold text-gray-300">VISTA ISOMÉTRICA (3D)</text>
             {shapes}
        </svg>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-7xl h-[95vh] flex flex-col relative">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
            <div>
                <h3 className="text-2xl font-black text-gray-900 uppercase">Projeto Técnico - Opção {option.optionNumber}</h3>
                <div className="flex gap-2 mt-2">
                    <button onClick={() => setViewMode('side')} className={`px-4 py-2 rounded text-sm font-bold ${viewMode === 'side' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Vista Lateral (Técnica)</button>
                    <button onClick={() => setViewMode('3d')} className={`px-4 py-2 rounded text-sm font-bold ${viewMode === '3d' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Vista 3D</button>
                </div>
            </div>
            <button onClick={onClose} className="bg-red-500 text-white w-12 h-12 rounded-full font-bold hover:bg-red-600 transition flex items-center justify-center text-xl shadow-md">✕</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 bg-gray-100 flex items-center justify-center">
            <div className="bg-white shadow-lg w-full h-full rounded border border-gray-300 overflow-hidden relative">
                {viewMode === 'side' && renderSideView()}
                {viewMode === '3d' && renderIsometricView()}
            </div>
        </div>

        {/* FOOTER (STATUS BAR) - MELHORADO PARA LEITURA */}
        <div className="bg-gray-800 p-6 rounded-b-lg border-t-4 border-gray-900 flex flex-col md:flex-row justify-between items-center gap-4">
             <span className="text-gray-400 text-sm font-medium">* Desenho esquemático. Medidas dependem de ajustes finos na instalação.</span>
             
             {hasSlabInfo && headroom ? (
                 <div className={`px-6 py-4 rounded-lg shadow-xl font-black text-lg text-white border-2 flex items-center gap-3 ${headroom.isSafe ? 'bg-green-700 border-green-500' : 'bg-red-700 border-red-500'}`}>
                     <span className="text-3xl">{headroom.isSafe ? '✅' : '⚠️'}</span>
                     <div className="flex flex-col text-left">
                        <span>{headroom.isSafe ? 'APROVADO: Passagem Segura' : 'PERIGO: Risco de Bater a Cabeça'}</span>
                        <span className="text-sm font-normal opacity-90">Altura Livre: {headroom.clearance.toFixed(1)}cm (Mínimo exigido: 185cm)</span>
                     </div>
                 </div>
             ) : (
                 <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4 rounded shadow-sm w-full md:w-auto">
                    <p className="font-bold">⚠️ Atenção:</p>
                    <p className="text-sm">Para verificar se bate a cabeça, preencha o campo <span className="font-black">"Tamanho do Vão"</span> na calculadora.</p>
                 </div>
             )}
        </div>
      </div>
    </div>
  );
};

export default StaircaseVisualizer;
