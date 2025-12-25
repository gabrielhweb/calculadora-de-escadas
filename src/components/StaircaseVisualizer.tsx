
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ProposalOption } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface StaircaseVisualizerProps {
  option: ProposalOption;
  totalHeight: number;
  slabOpening?: number;
  slabThickness?: number;
  onClose?: () => void;
  printMode?: boolean; 
  initialViewMode?: 'side' | '3d'; 
  onApplyCorrection?: (newTread: number, newLength: number) => void;
  forcedState?: {
      simulateSafe: boolean;
      correctionType: 'expand_opening' | 'shrink_stair';
  };
  // Novos props para o sistema de captura do PDF (Wizard)
  captureRef?: React.RefObject<HTMLDivElement>;
  hideUI?: boolean;
}

// Tipos para a Engine 3D Simples
interface Point3D { x: number; y: number; z: number; }
interface Point2D { x: number; y: number; }
interface Face {
  points: Point3D[];
  fill: string;
  stroke: string;
  strokeWidth?: number;
  zIndex: number; // Profundidade média para ordenação
  id: string;
  opacity?: number;
}

const StaircaseVisualizer: React.FC<StaircaseVisualizerProps> = ({ 
    option, totalHeight, slabOpening, slabThickness = 15, onClose, printMode = false, initialViewMode = 'side', onApplyCorrection, forcedState,
    captureRef, hideUI = false
}) => {
  const [viewMode, setViewMode] = useState<'side' | '3d'>(initialViewMode);
  
  // --- CONFIGURAÇÃO DE SEGURANÇA ---
  // headroomInput: Valor digitado no campo (temporário)
  // targetHeadroom: Valor aplicado no cálculo (só muda no clique do botão)
  const [headroomInput, setHeadroomInput] = useState(200);
  const [targetHeadroom, setTargetHeadroom] = useState(200); 

  // --- CONTROLES DE CÂMERA ---
  const [zoom, setZoom] = useState(printMode ? 1 : 1.1); 
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState({ x: -20, y: 45 }); // x: Pitch (vertical), y: Yaw (horizontal)

  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'rotate' | 'pan'>('pan');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Estados de Correção
  const [simulateSafe, setSimulateSafe] = useState(forcedState ? forcedState.simulateSafe : false);
  const [correctionType, setCorrectionType] = useState<'expand_opening' | 'shrink_stair'>(forcedState ? forcedState.correctionType : 'expand_opening');
  
  const [simulatedValues, setSimulatedValues] = useState<{tread: number, length: number, clearance: number, safe: boolean}>({
      tread: option.treadDepth,
      length: option.totalLength,
      clearance: 0,
      safe: false
  });

  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const internalCanvasRef = useRef<HTMLDivElement>(null);

  // Ajuste inicial para modo de impressão 3D e Forced State
  useEffect(() => {
      if (printMode && initialViewMode === '3d') {
          setRotation({ x: -20, y: 45 });
          setZoom(1.3); 
      }
      setViewMode(initialViewMode || 'side');
  }, [printMode, initialViewMode]);

  useEffect(() => {
      if (forcedState) {
          setSimulateSafe(forcedState.simulateSafe);
          setCorrectionType(forcedState.correctionType);
      }
  }, [forcedState]);

  // --- CONFIGURAÇÕES GEOMÉTRICAS GERAIS ---
  const margin = 100; // Margem para caber cotas
  const svgHeight = totalHeight + 400; 
  const floorY = svgHeight - 150; 
  const ceilingY = floorY - totalHeight; 
  const slabBottomY = ceilingY + (slabThickness || 0);
  const ceilingHeight = totalHeight - (slabThickness || 0); // Pé direito

  const hasSlabInfo = slabOpening !== undefined && slabOpening > 0 && !isNaN(slabOpening);
  
  const safeLandings = useMemo(() => option.landings || [], [option.landings]);

  // Função crítica: Calcula onde está a borda da laje baseada no comprimento ATUAL da escada.
  const getSlabEdgeX = (currentTotalLength: number) => {
      if (!hasSlabInfo) return margin + currentTotalLength + 200; // Se não tem laje, joga longe
      return margin + currentTotalLength - (slabOpening || 0);
  };

  // --- CÁLCULO DE CORREÇÃO ---
  const calculationData = useMemo(() => {
      const result = {
          corrections: { safeSlabX: 0, safeLength: option.totalLength, safeTread: option.treadDepth, clearanceAtSafe: 999, foundSafe: true },
          originalSafety: { safe: true, clearance: 999 }
      };

      if (!hasSlabInfo) return result;

      // --- ALGORITMO DE VERIFICAÇÃO DE COLISÃO ---
      const calculateHeadroom = (treadDepth: number, totalLen: number) => {
          // 1. Onde está a borda da laje neste cenário?
          const currentSlabX = margin + totalLen - (slabOpening || 0);
          
          let surfaceYUnderSlab = floorY; // Começa no chão
          
          // Itera sobre todos os degraus para ver qual está SOB a linha da laje
          for (let i = 1; i <= option.steps; i++) {
               let currentRunStart = 0;
               // Soma o comprimento de todos os degraus/patamares anteriores
               for(let j=1; j<i; j++) {
                   const isLanding = safeLandings.find(l=>l.step === j);
                   currentRunStart += isLanding ? isLanding.length : treadDepth;
               }
               
               const stepStart = margin + currentRunStart;
               const isLanding = safeLandings.find(l=>l.step === i);
               const currentRunLength = isLanding ? isLanding.length : treadDepth;
               const stepEnd = stepStart + currentRunLength;
               
               // Verifica se a linha da laje (currentSlabX) cai DENTRO deste degrau
               // Adiciona tolerância de 0.5cm para evitar erros de arredondamento
               if (currentSlabX >= stepStart - 0.5 && currentSlabX < stepEnd - 0.5) {
                   surfaceYUnderSlab = floorY - (i * option.stepHeight);
                   break;
               }
          }
          
          // Se a laje estiver DEPOIS de todos os degraus (no topo), a altura é a altura total da escada
          if (currentSlabX >= margin + totalLen - 0.5) {
              surfaceYUnderSlab = floorY - (option.steps * option.stepHeight);
          }

          // Distância = Chão (Maior Y) - Teto (Menor Y)
          const dist = surfaceYUnderSlab - slabBottomY;
          return { clearance: dist, slabX: currentSlabX, stepY: surfaceYUnderSlab };
      };

      // 1. CALCULA SEGURANÇA ORIGINAL
      const origCheck = calculateHeadroom(option.treadDepth, option.totalLength);
      result.originalSafety = { safe: origCheck.clearance >= targetHeadroom, clearance: origCheck.clearance };
      result.corrections.safeSlabX = origCheck.slabX; // Valor inicial padrão

      // 2. CORREÇÃO TIPO: AUMENTAR VÃO (Mantém escada, move laje)
      let safeXSlabForOpening = origCheck.slabX;
      const requiredY = slabBottomY + targetHeadroom; 
      
      // Procura o primeiro degrau que é "alto demais" (perigoso)
      for (let i = 0; i <= option.steps; i++) {
        const stepTopY = floorY - (i * option.stepHeight);
        
        // Se este degrau está fisicamente acima da linha de segurança (Y menor)
        if (stepTopY < requiredY) {
            // O vão precisa terminar ANTES deste degrau começar.
            let runBeforeStep = 0;
            for(let j=1; j<i; j++) { 
               const isLanding = safeLandings.find(l=>l.step === j);
               runBeforeStep += isLanding ? isLanding.length : option.treadDepth;
            }
            safeXSlabForOpening = margin + runBeforeStep - 1; // Recua 1cm antes do degrau
            break;
        }
        if (i === option.steps) safeXSlabForOpening = Math.max(origCheck.slabX, margin + option.totalLength);
      }
      
      // 3. CORREÇÃO TIPO: AJUSTAR ESCADA (Encolher para caber no vão existente)
      const stairsOnlySteps = option.structureSteps;
      const landingsLen = safeLandings.reduce((acc,l) => acc+l.length, 0);
      
      let bestSafeTread = option.treadDepth;
      let bestSafeLength = option.totalLength;
      let bestClearance = -999;
      let isSolutionFound = false;

      // ALGORITMO DE BUSCA:
      for (let t = option.treadDepth; t >= 18; t -= 0.1) {
          const tryLength = (stairsOnlySteps * t) + landingsLen;
          const check = calculateHeadroom(t, tryLength);

          if (check.clearance >= targetHeadroom) {
              bestSafeTread = t;
              bestSafeLength = tryLength;
              bestClearance = check.clearance;
              isSolutionFound = true;
              break; 
          }
          
          if (check.clearance > bestClearance) {
              bestClearance = check.clearance;
              bestSafeTread = t;
              bestSafeLength = tryLength;
          }
      }
      
      result.corrections = { 
          safeSlabX: safeXSlabForOpening, // Usado apenas no modo "Expand Opening"
          safeLength: bestSafeLength, 
          safeTread: bestSafeTread, 
          clearanceAtSafe: isSolutionFound ? Math.max(bestClearance, targetHeadroom) : bestClearance, 
          foundSafe: isSolutionFound 
      };

      return result;

  }, [option, hasSlabInfo, floorY, slabBottomY, margin, safeLandings, targetHeadroom, slabOpening]); 

  // --- EFEITOS E HANDLERS ---
  useEffect(() => {
      const { corrections, originalSafety } = calculationData;
      if (simulateSafe) {
          if (correctionType === 'expand_opening') {
             setSimulatedValues({ tread: option.treadDepth, length: option.totalLength, clearance: targetHeadroom, safe: true });
          } else {
             setSimulatedValues({ 
                 tread: corrections.safeTread, 
                 length: corrections.safeLength, 
                 clearance: corrections.clearanceAtSafe, 
                 safe: corrections.foundSafe 
             });
          }
      } else {
          setSimulatedValues({ tread: option.treadDepth, length: option.totalLength, clearance: originalSafety.clearance, safe: originalSafety.safe });
      }
  }, [simulateSafe, correctionType, option, calculationData, targetHeadroom]);

  const handleApply = () => {
      if (onApplyCorrection) {
          const msg = `CONFIRMAR REDUÇÃO NO ORÇAMENTO?\n\n` + 
                      `A escada será ajustada para garantir ${targetHeadroom}cm de altura livre:\n` +
                      `• Pisante: ${option.treadDepth}cm ➝ ${simulatedValues.tread.toFixed(1)}cm\n` +
                      `• Comp. Total: ${(option.totalLength/100).toFixed(2)}m ➝ ${(simulatedValues.length/100).toFixed(2)}m`;
                      
          if (window.confirm(msg)) {
              onApplyCorrection(simulatedValues.tread, simulatedValues.length);
              if (onClose) onClose();
          }
      }
  };

  // --- VARIÁVEIS DE DESENHO DINÂMICAS ---
  let drawTreadDepth = option.treadDepth;
  let drawTotalLength = option.totalLength;
  let drawSlabEdgeX = getSlabEdgeX(option.totalLength);

  if (simulateSafe) {
      if (correctionType === 'expand_opening') {
          drawSlabEdgeX = calculationData.corrections.safeSlabX; 
      } else {
          drawTreadDepth = simulatedValues.tread;
          drawTotalLength = simulatedValues.length;
          drawSlabEdgeX = getSlabEdgeX(drawTotalLength);
      }
  }

  const drawStairEndX = margin + drawTotalLength;
  const drawOpeningVal = drawStairEndX - drawSlabEdgeX;
  const svgWidth = Math.max(margin + option.totalLength, drawStairEndX, drawSlabEdgeX) + (margin * 5);

  // --- LÓGICA 3D INTERATIVA ---
  const projectPoint = (p: Point3D): Point2D => {
      const cx = drawTotalLength / 2;
      const cy = totalHeight / 2;
      const cz = option.stairWidth / 2;
      let x = p.x - cx; let y = p.y - cy; let z = p.z - cz;
      const radY = (rotation.y * Math.PI) / 180;
      const x1 = x * Math.cos(radY) - z * Math.sin(radY);
      const z1 = x * Math.sin(radY) + z * Math.cos(radY);
      const radX = (rotation.x * Math.PI) / 180;
      const y2 = y * Math.cos(radX) - z1 * Math.sin(radX);
      const scale = 1.0; 
      return { x: x1 * scale + (svgWidth / 2), y: y2 * scale + (svgHeight / 2) };
  };

  const getFaces = (): Face[] => {
      const faces: Face[] = [];
      const width = option.stairWidth;
      const stepH = option.stepHeight;
      const treadH = 2; 
      const beamW = 10; 
      const treadColorTop = '#a0a0a0'; 
      const treadColorSide = '#666'; 
      const landingColor = '#c0c0c0';
      const beamColor = '#222'; 
      const beamStroke = '#000';
      
      let currentPos = { x: 0, y: totalHeight, z: 0 };
      let currentAngle = 0; 
      
      if (hasSlabInfo) {
          const slabLimitX = drawSlabEdgeX - margin;
          const slabYCeil = 0;
          const slabYFloor = -(slabThickness || 15);
          const slabStartX = -2000; 
          const slabEndX = slabLimitX; 
          const slabZStart = -1000; 
          const slabZEnd = 1000;

          const s1 = { x: slabStartX, y: slabYFloor, z: slabZStart }; 
          const s2 = { x: slabEndX,   y: slabYFloor, z: slabZStart }; 
          const s3 = { x: slabEndX,   y: slabYFloor, z: slabZEnd };   
          const s4 = { x: slabStartX, y: slabYFloor, z: slabZEnd };   
          const s1_b = { x: slabStartX, y: slabYCeil, z: slabZStart };
          const s2_b = { x: slabEndX,   y: slabYCeil, z: slabZStart };
          const s3_b = { x: slabEndX,   y: slabYCeil, z: slabZEnd };
          const s4_b = { x: slabStartX, y: slabYCeil, z: slabZEnd };

          faces.push({ points: [s1, s2, s3, s4], fill: '#e2e8f0', stroke: '#cbd5e1', zIndex: -1000, id: 'slab-floor' });
          faces.push({ points: [s1_b, s4_b, s3_b, s2_b], fill: '#cbd5e1', stroke: '#94a3b8', zIndex: -999, id: 'slab-ceil', opacity: 1 });
          faces.push({ points: [s2, s3, s3_b, s2_b], fill: '#94a3b8', stroke: '#64748b', zIndex: -998, id: 'slab-cut' });
      }

      for (let i = 1; i <= option.steps; i++) {
          const landing = safeLandings.find(l => l.step === i);
          const run = landing ? landing.length : drawTreadDepth; 
          
          const rad = (currentAngle * Math.PI) / 180;
          const fwdX = Math.cos(rad) * run;
          const fwdZ = Math.sin(rad) * run;
          const rightX = Math.sin(rad) * width;
          const rightZ = -Math.cos(rad) * width;

          const yBottom = currentPos.y;
          const yTop = currentPos.y - stepH;

          const p0 = { x: currentPos.x, y: yTop, z: currentPos.z };
          const p1 = { x: currentPos.x + rightX, y: yTop, z: currentPos.z + rightZ };
          const p2 = { x: currentPos.x + rightX + fwdX, y: yTop, z: currentPos.z + rightZ + fwdZ };
          const p3 = { x: currentPos.x + fwdX, y: yTop, z: currentPos.z + fwdZ };
          const p0_b = { x: p0.x, y: yTop + treadH, z: p0.z };
          const p1_b = { x: p1.x, y: yTop + treadH, z: p1.z };
          const p2_b = { x: p2.x, y: yTop + treadH, z: p2.z };
          const p3_b = { x: p3.x, y: yTop + treadH, z: p3.z };

          faces.push({ points: [p0, p1, p2, p3], fill: landing ? landingColor : treadColorTop, stroke: '#555', zIndex: 0, id: `s${i}-top` });
          faces.push({ points: [p2, p3, p3_b, p2_b], fill: treadColorSide, stroke: '#333', zIndex: 0, id: `s${i}-front` });
          faces.push({ points: [p1, p2, p2_b, p1_b], fill: treadColorSide, stroke: '#333', zIndex: 0, id: `s${i}-right` });
          faces.push({ points: [p0, p3, p3_b, p0_b], fill: treadColorSide, stroke: '#333', zIndex: 0, id: `s${i}-left` });

          const centerRatio = 0.5;
          const beamCenterX = currentPos.x + (rightX * centerRatio);
          const beamCenterZ = currentPos.z + (rightZ * centerRatio);
          const beamHalfW_X = (rightX / width) * (beamW/2);
          const beamHalfW_Z = (rightZ / width) * (beamW/2);
          const vb0 = { x: beamCenterX - beamHalfW_X, y: yTop + treadH, z: beamCenterZ - beamHalfW_Z };
          const vb1 = { x: beamCenterX + beamHalfW_X, y: yTop + treadH, z: beamCenterZ + beamHalfW_Z };
          const vb2 = { x: vb1.x + fwdX, y: yTop + treadH, z: vb1.z + fwdZ };
          const vb3 = { x: vb0.x + fwdX, y: yTop + treadH, z: vb0.z + fwdZ };
          const vb0_d = { x: vb0.x, y: yBottom, z: vb0.z };
          const vb1_d = { x: vb1.x, y: yBottom, z: vb1.z };
          const vb2_d = { x: vb2.x, y: yBottom, z: vb2.z };
          const vb3_d = { x: vb3.x, y: yBottom, z: vb3.z };

          faces.push({ points: [vb2, vb3, vb3_d, vb2_d], fill: beamColor, stroke: beamStroke, zIndex: -1, id: `b${i}-front` });
          faces.push({ points: [vb1, vb2, vb2_d, vb1_d], fill: beamColor, stroke: beamStroke, zIndex: -1, id: `b${i}-right` });
          faces.push({ points: [vb0, vb3, vb3_d, vb0_d], fill: beamColor, stroke: beamStroke, zIndex: -1, id: `b${i}-left` });
          
          currentPos.y -= stepH;
          if (landing) {
              if (landing.direction === 'left') {
                 currentPos.x = p3.x; currentPos.z = p3.z; currentAngle -= 90;
              } else if (landing.direction === 'right') {
                 currentPos.x = p2.x; currentPos.z = p2.z; currentAngle += 90;
              } else {
                 currentPos.x = p3.x; currentPos.z = p3.z;
              }
          } else {
              currentPos.x = p3.x; currentPos.z = p3.z;
          }
      }
      faces.forEach(face => {
          const center = {
              x: face.points.reduce((sum, p) => sum + p.x, 0) / 4,
              y: face.points.reduce((sum, p) => sum + p.y, 0) / 4,
              z: face.points.reduce((sum, p) => sum + p.z, 0) / 4
          };
          const cx = 0; const cy = totalHeight/2; const cz = 0;
          let x = center.x - cx; let y = center.y - cy; let z = center.z - cz;
          const radY = (rotation.y * Math.PI) / 180;
          const x1 = x * Math.cos(radY) - z * Math.sin(radY);
          const z1 = x * Math.sin(radY) + z * Math.cos(radY);
          const radX = (rotation.x * Math.PI) / 180;
          const z2 = y * Math.sin(radX) + z1 * Math.cos(radX);
          face.zIndex = z2;
      });
      return faces.sort((a, b) => a.zIndex - b.zIndex);
  };

  const renderSideView = () => {
    // CORREÇÃO LINHA AZUL E VERIFICAÇÃO VISUAL
    const getHeadroomLine = () => {
        if (!hasSlabInfo) return null;
        const lineX = drawSlabEdgeX;
        const lineTopY = slabBottomY;
        let lineBottomY = floorY; // Começa no chão
        
        for (let i = 1; i <= option.steps; i++) {
            let currentRunStart = 0;
            for(let j=1; j<i; j++) {
                const isLanding = safeLandings.find(l=>l.step === j);
                currentRunStart += isLanding ? isLanding.length : drawTreadDepth;
            }
            const stepStart = margin + currentRunStart;
            const isLanding = safeLandings.find(l=>l.step === i);
            const runLen = isLanding ? isLanding.length : drawTreadDepth;
            const stepEnd = stepStart + runLen;
            
            // Verifica colisão horizontal com tolerância
            if (lineX >= stepStart - 0.5 && lineX < stepEnd - 0.5) {
                lineBottomY = floorY - (i * option.stepHeight);
                break;
            }
        }
        
        const dist = lineBottomY - lineTopY;
        return { x: lineX, y1: lineTopY, y2: lineBottomY, dist };
    };
    const headroomLine = getHeadroomLine();

    const stepsPoints = [{x: margin, y: floorY}];
    let currentX = margin;
    let currentY = floorY;
    let firstStepCoords = {x: 0, y: 0};

    for (let i = 1; i <= option.steps; i++) {
        currentY -= option.stepHeight;
        stepsPoints.push({x: currentX, y: currentY});
        if (i === 1) firstStepCoords = {x: currentX, y: currentY};
        const landing = safeLandings.find(l => l.step === i);
        const run = landing ? landing.length : drawTreadDepth;
        currentX += run;
        stepsPoints.push({x: currentX, y: currentY});
    }
    stepsPoints.push({x: currentX, y: floorY});
    let d = `M ${stepsPoints[0].x} ${stepsPoints[0].y}`;
    for (let p of stepsPoints) d += ` L ${p.x} ${p.y}`;

    return (
        <g>
            <rect x={margin} y={ceilingY} width={drawTotalLength} height={totalHeight} fill="#f1f5f9" stroke="none" />
            <text x={margin + 10} y={floorY - 20} fill="#cbd5e1" fontSize="40" fontWeight="bold" opacity="0.5">PAREDE (Ref. 2D)</text>
            <line x1={-1000} y1={floorY} x2={svgWidth + 1000} y2={floorY} stroke="#333" strokeWidth="4" />
            {hasSlabInfo ? (
                 <g>
                    <rect x={-1000} y={ceilingY} width={1000 + drawSlabEdgeX} height={slabThickness} fill={simulateSafe && correctionType === 'expand_opening' ? '#86efac' : '#cbd5e1'} stroke="none" opacity="0.8"/>
                    <line x1={-1000} y1={slabBottomY} x2={drawSlabEdgeX} y2={slabBottomY} stroke="#333" strokeWidth="3" />
                    <line x1={drawSlabEdgeX} y1={ceilingY - 50} x2={drawSlabEdgeX} y2={slabBottomY} stroke="#333" strokeWidth="3"/>
                 </g>
            ) : (
                <line x1={-1000} y1={ceilingY} x2={svgWidth + 1000} y2={ceilingY} stroke="#94a3b8" strokeDasharray="10" strokeWidth="1" />
            )}
            <path d={d} fill="none" stroke={simulateSafe && correctionType === 'shrink_stair' ? '#16a34a' : 'black'} strokeWidth="2" strokeLinejoin="round" />
            
            {/* Cota Altura Total (H) */}
            <g>
                <line x1={margin - 60} y1={floorY} x2={margin - 60} y2={floorY - totalHeight} stroke="#000" strokeWidth="3" markerEnd="url(#arrowGray)" markerStart="url(#arrowGray)" />
                <text x={margin - 75} y={floorY - totalHeight/2} fill="#000" fontSize="20" fontWeight="bold" textAnchor="middle" transform={`rotate(-90, ${margin - 75}, ${floorY - totalHeight/2})`}>H: {(totalHeight/100).toFixed(2)}m</text>
            </g>

            {/* Cota Pé Direito */}
            {hasSlabInfo && (
                <g>
                    <line x1={margin - 20} y1={floorY} x2={margin - 20} y2={slabBottomY} stroke="#7e22ce" strokeWidth="3" markerEnd="url(#arrowPurple)" markerStart="url(#arrowPurple)" />
                    <text x={margin - 35} y={floorY - ceilingHeight/2} fill="#7e22ce" fontSize="18" fontWeight="bold" textAnchor="middle" transform={`rotate(-90, ${margin - 35}, ${floorY - ceilingHeight/2})`}>Pé-Dir: {(ceilingHeight/100).toFixed(2)}m</text>
                </g>
            )}

            {/* Cota Vão */}
            {hasSlabInfo && (
                <g>
                    <line x1={drawSlabEdgeX} y1={ceilingY - 30} x2={drawStairEndX} y2={ceilingY - 30} stroke="#dc2626" strokeWidth="3" markerEnd="url(#arrowRed)" markerStart="url(#arrowRed)" />
                    <text x={(drawSlabEdgeX + drawStairEndX)/2} y={ceilingY - 40} fill="#dc2626" fontSize="20" fontWeight="bold" textAnchor="middle">Vão: {(drawOpeningVal).toFixed(0)}cm</text>
                </g>
            )}
            
            {/* Cota Degrau (Pisante) */}
            {firstStepCoords.x > 0 && (
                <g>
                    <line x1={firstStepCoords.x} y1={firstStepCoords.y - 20} x2={firstStepCoords.x + drawTreadDepth} y2={firstStepCoords.y - 20} stroke="#333" strokeWidth="1" markerEnd="url(#arrowGray)" markerStart="url(#arrowGray)"/>
                    <text x={firstStepCoords.x + (drawTreadDepth/2)} y={firstStepCoords.y - 30} fontSize="14" fill="#333" fontWeight="bold" textAnchor="middle">p={drawTreadDepth.toFixed(1)}</text>
                </g>
            )}

            {/* Cota Altura Degrau (Espelho) */}
            {firstStepCoords.x > 0 && (
                <g>
                    <line x1={firstStepCoords.x - 15} y1={firstStepCoords.y} x2={firstStepCoords.x - 15} y2={firstStepCoords.y + option.stepHeight} stroke="#333" strokeWidth="1" markerEnd="url(#arrowGray)" markerStart="url(#arrowGray)"/>
                    <text x={firstStepCoords.x - 35} y={firstStepCoords.y + (option.stepHeight/2)} fontSize="14" fill="#333" fontWeight="bold" textAnchor="middle">h={option.stepHeight.toFixed(1)}</text>
                </g>
            )}

            {/* Cota Comprimento Total */}
            <g>
                <line x1={margin} y1={floorY + 50} x2={drawStairEndX} y2={floorY + 50} stroke="#333" strokeWidth="3" markerEnd="url(#arrowGray)" markerStart="url(#arrowGray)" />
                <line x1={margin} y1={floorY + 20} x2={margin} y2={floorY + 60} stroke="#333" strokeWidth="1" strokeDasharray="4" />
                <line x1={drawStairEndX} y1={floorY + 20} x2={drawStairEndX} y2={floorY + 60} stroke="#333" strokeWidth="1" strokeDasharray="4" />
                <text x={(margin + drawStairEndX)/2} y={floorY + 45} fill="#333" fontSize="20" fontWeight="bold" textAnchor="middle">Comp. Total: {(drawTotalLength/100).toFixed(2)}m</text>
            </g>

            {hasSlabInfo && headroomLine && (
                <g>
                    {/* Linha Azul REAL (Calculada) */}
                    <line x1={headroomLine.x} y1={headroomLine.y1} x2={headroomLine.x} y2={headroomLine.y2} stroke="#2563eb" strokeWidth="3" markerStart="url(#arrowBlue)" markerEnd="url(#arrowBlue)"/>
                    <text x={headroomLine.x + 10} y={headroomLine.y1 + (headroomLine.dist/2)} fill="#2563eb" fontSize="20" fontWeight="bold">{headroomLine.dist.toFixed(0)}cm</text>
                </g>
            )}
        </g>
    );
  };

  const render3DDimensions = () => {
    const heightStartX = -30;
    const pHeightStart = projectPoint({ x: heightStartX, y: totalHeight, z: 0 });
    const pHeightEnd = projectPoint({ x: heightStartX, y: 0, z: 0 });
    const lenZ = 40;
    const lenY = totalHeight + 20;
    const pLenStart = projectPoint({ x: 0, y: lenY, z: lenZ });
    const pLenEnd = projectPoint({ x: drawTotalLength, y: lenY, z: lenZ });
    const baseStepX = 0; 
    const baseStepY = totalHeight;
    const baseStepZ = 0; 
    const pBaseCorner = projectPoint({ x: baseStepX, y: baseStepY, z: baseStepZ + 10 }); 
    const pStepTop = projectPoint({ x: baseStepX, y: baseStepY - option.stepHeight, z: baseStepZ + 10 }); 
    const pStepFront = projectPoint({ x: baseStepX + drawTreadDepth, y: baseStepY - option.stepHeight, z: baseStepZ + 10 }); 

    let slabText = null;
    let slabLine = null;
    if (hasSlabInfo) {
        const slabEdge3D = drawSlabEdgeX - margin;
        const stairEnd3D = drawTotalLength;
        const gapSize = stairEnd3D - slabEdge3D; 
        const pGapStart = projectPoint({ x: slabEdge3D, y: -20, z: -50 });
        const pGapEnd = projectPoint({ x: stairEnd3D, y: -20, z: -50 });
        const pGapText = { x: (pGapStart.x + pGapEnd.x)/2, y: (pGapStart.y + pGapEnd.y)/2 };

        slabLine = (
             <line x1={pGapStart.x} y1={pGapStart.y} x2={pGapEnd.x} y2={pGapEnd.y} stroke="#dc2626" strokeWidth="2" markerEnd="url(#arrowRed)" markerStart="url(#arrowRed)" />
        );

        slabText = (
            <g>
                <text x={pGapText.x} y={pGapText.y - 10} textAnchor="middle" fontSize="16" fontWeight="bold" fill="#dc2626" stroke="white" strokeWidth="3" paintOrder="stroke">
                   Vão: {gapSize.toFixed(0)}cm
                </text>
                <text x={pGapText.x} y={pGapText.y - 10} textAnchor="middle" fontSize="16" fontWeight="bold" fill="#dc2626">
                   Vão: {gapSize.toFixed(0)}cm
                </text>
            </g>
        );
    }

    return (
        <g style={{ pointerEvents: 'none' }}>
            <line x1={pHeightStart.x} y1={pHeightStart.y} x2={pHeightEnd.x} y2={pHeightEnd.y} stroke="#7e22ce" strokeWidth="2" markerEnd="url(#arrowPurple)" markerStart="url(#arrowPurple)" />
            <line x1={projectPoint({x:0, y:totalHeight, z:0}).x} y1={projectPoint({x:0, y:totalHeight, z:0}).y} x2={pHeightStart.x} y2={pHeightStart.y} stroke="#7e22ce" strokeWidth="1" strokeDasharray="4"/>
            <line x1={projectPoint({x:0, y:0, z:0}).x} y1={projectPoint({x:0, y:0, z:0}).y} x2={pHeightEnd.x} y2={pHeightEnd.y} stroke="#7e22ce" strokeWidth="1" strokeDasharray="4"/>
            <g>
                <text x={(pHeightStart.x + pHeightEnd.x)/2 - 15} y={(pHeightStart.y + pHeightEnd.y)/2} textAnchor="end" fontSize="16" fontWeight="bold" fill="#7e22ce" stroke="white" strokeWidth="3" paintOrder="stroke">
                    H={(totalHeight/100).toFixed(2)}m
                </text>
                <text x={(pHeightStart.x + pHeightEnd.x)/2 - 15} y={(pHeightStart.y + pHeightEnd.y)/2} textAnchor="end" fontSize="16" fontWeight="bold" fill="#7e22ce">
                    H={(totalHeight/100).toFixed(2)}m
                </text>
            </g>
            <line x1={pLenStart.x} y1={pLenStart.y} x2={pLenEnd.x} y2={pLenEnd.y} stroke="#333" strokeWidth="2" markerEnd="url(#arrowGray)" markerStart="url(#arrowGray)" />
            <line x1={projectPoint({x:0, y:totalHeight, z:lenZ}).x} y1={projectPoint({x:0, y:totalHeight, z:lenZ}).y} x2={pLenStart.x} y2={pLenStart.y} stroke="#333" strokeWidth="1" strokeDasharray="4"/>
            <line x1={projectPoint({x:drawTotalLength, y:totalHeight, z:lenZ}).x} y1={projectPoint({x:drawTotalLength, y:totalHeight, z:lenZ}).y} x2={pLenEnd.x} y2={pLenEnd.y} stroke="#333" strokeWidth="1" strokeDasharray="4"/>
            <g>
                 <text x={(pLenStart.x + pLenEnd.x)/2} y={pLenStart.y + 20} textAnchor="middle" fontSize="16" fontWeight="bold" fill="#333" stroke="white" strokeWidth="3" paintOrder="stroke">
                    Comp. Total: {(drawTotalLength/100).toFixed(2)}m
                </text>
                <text x={(pLenStart.x + pLenEnd.x)/2} y={pLenStart.y + 20} textAnchor="middle" fontSize="16" fontWeight="bold" fill="#333">
                    Comp. Total: {(drawTotalLength/100).toFixed(2)}m
                </text>
            </g>
            <g>
                 <line x1={pBaseCorner.x} y1={pBaseCorner.y} x2={pStepTop.x} y2={pStepTop.y} stroke="#333" strokeWidth="2" markerEnd="url(#arrowGray)" markerStart="url(#arrowGray)" />
                 <text x={pBaseCorner.x - 10} y={(pBaseCorner.y + pStepTop.y)/2} textAnchor="end" fontSize="14" fontWeight="bold" fill="#333" stroke="white" strokeWidth="3" paintOrder="stroke">
                    h={option.stepHeight.toFixed(1)}
                </text>
                <text x={pBaseCorner.x - 10} y={(pBaseCorner.y + pStepTop.y)/2} textAnchor="end" fontSize="14" fontWeight="bold" fill="#333">
                    h={option.stepHeight.toFixed(1)}
                </text>
                <line x1={pStepTop.x} y1={pStepTop.y} x2={pStepFront.x} y2={pStepFront.y} stroke="#333" strokeWidth="2" markerEnd="url(#arrowGray)" markerStart="url(#arrowGray)" />
                <text x={(pStepTop.x + pStepFront.x)/2} y={pStepTop.y - 10} textAnchor="middle" fontSize="14" fontWeight="bold" fill="#333" stroke="white" strokeWidth="3" paintOrder="stroke">
                    p={drawTreadDepth.toFixed(1)}
                </text>
                <text x={(pStepTop.x + pStepFront.x)/2} y={pStepTop.y - 10} textAnchor="middle" fontSize="14" fontWeight="bold" fill="#333">
                    p={drawTreadDepth.toFixed(1)}
                </text>
            </g>
            {slabLine}
            {slabText}
        </g>
    );
  };

  const renderInteractive3D = () => {
      const faces = getFaces();
      const dimensions = render3DDimensions();
      return (
          <g>
              {faces.map((face, i) => {
                  const projected = face.points.map(projectPoint);
                  let path = `M ${projected[0].x} ${projected[0].y}`;
                  for (let j = 1; j < projected.length; j++) {
                      path += ` L ${projected[j].x} ${projected[j].y}`;
                  }
                  path += " Z";
                  return (
                      <path
                          key={`${face.id}-${i}`}
                          d={path}
                          fill={face.fill}
                          stroke={face.stroke}
                          strokeWidth={face.strokeWidth || 1}
                          fillOpacity={face.opacity || 1}
                      />
                  );
              })}
              {dimensions}
          </g>
      );
  };

  const startDrag = (e: React.MouseEvent) => {
    if (isExporting) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    if (viewMode === '3d') {
        if (e.button === 2 || e.shiftKey) {
            setDragType('pan');
        } else {
            setDragType('rotate');
        }
    } else {
        setDragType('pan');
    }
  };

  const doDrag = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    if (dragType === 'pan') {
        setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    } else {
        setRotation(prev => ({ x: prev.x - dy * 0.5, y: prev.y + dx * 0.5 }));
    }
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const stopDrag = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
      if (printMode && !hideUI) return; 
      e.stopPropagation();
      const scaleFactor = 1.1;
      if (e.deltaY < 0) {
          setZoom(z => z * scaleFactor);
      } else {
          setZoom(z => Math.max(0.1, z / scaleFactor));
      }
  };

  const executeExport = async (variantName: string, safeState: boolean, corrType: 'expand_opening' | 'shrink_stair', mode: 'side' | '3d') => {
      if (!internalCanvasRef.current) return;
      setIsExporting(true);
      setShowExportMenu(false);
      
      const prevView = viewMode;
      const prevSafe = simulateSafe;
      const prevCorr = correctionType;
      const prevZoom = zoom;
      const prevPan = pan;
      const prevRot = rotation;

      setViewMode(mode);
      setSimulateSafe(safeState);
      setCorrectionType(corrType);
      
      if (mode === '3d') {
          setZoom(1.1);
          setRotation({ x: -20, y: 45 });
          setPan({x: 0, y: 0});
      } else {
          setZoom(1);
          setPan({x: 0, y: 0});
      }
      
      setTimeout(async () => {
          if (internalCanvasRef.current) {
              try {
                  const canvas = await html2canvas(internalCanvasRef.current, {
                      scale: 2,
                      backgroundColor: '#ffffff'
                  });
                  const imgData = canvas.toDataURL('image/png');
                  const doc = new jsPDF('landscape', 'mm', 'a4');
                  const width = doc.internal.pageSize.getWidth();
                  const height = doc.internal.pageSize.getHeight();
                  const ratio = canvas.width / canvas.height;
                  
                  let w = width - 20;
                  let h = w / ratio;
                  if (h > height - 20) {
                      h = height - 20;
                      w = h * ratio;
                  }
                  
                  doc.setFontSize(16);
                  doc.text(`Visualização ${mode === '3d' ? '3D' : '2D'} - Opção ${option.optionNumber} (${variantName})`, 10, 15);
                  doc.addImage(imgData, 'PNG', 10, 25, w, h);
                  doc.save(`visualizacao_${variantName}_${mode}.pdf`);
              } catch (err) {
                  console.error(err);
                  alert("Erro ao exportar PDF.");
              }
          }
          setViewMode(prevView);
          setSimulateSafe(prevSafe);
          setCorrectionType(prevCorr);
          setZoom(prevZoom);
          setPan(prevPan);
          setRotation(prevRot);
          setIsExporting(false);
      }, 800);
  };

  // Se for o modo de impressão ESTÁTICO (Batch export antigo, sem Wizard UI)
  if (printMode && !hideUI) {
      return (
        <div ref={internalCanvasRef} className="bg-white p-4 inline-block">
             <div className="text-center font-bold text-xl mb-4 text-black">Opção {option.optionNumber}</div>
             <svg width={800} height={600} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
                <defs>
                     <marker id="arrowGreen" markerWidth="4" markerHeight="4" refX="0" refY="2" orient="auto-start-reverse" markerUnits="strokeWidth"><path d="M0,0 L0,4 L6,2 z" fill="#16a34a" /></marker>
                     <marker id="arrowOrange" markerWidth="4" markerHeight="4" refX="0" refY="2" orient="auto-start-reverse" markerUnits="strokeWidth"><path d="M0,0 L0,4 L6,2 z" fill="#f97316" /></marker>
                     <marker id="arrowBlue" markerWidth="4" markerHeight="4" refX="0" refY="2" orient="auto-start-reverse" markerUnits="strokeWidth"><path d="M0,0 L0,4 L6,2 z" fill="#2563eb" /></marker>
                     <marker id="arrowGray" markerWidth="4" markerHeight="4" refX="0" refY="2" orient="auto-start-reverse" markerUnits="strokeWidth"><path d="M0,0 L0,4 L6,2 z" fill="#666" /></marker>
                     <marker id="arrowRed" markerWidth="4" markerHeight="4" refX="0" refY="2" orient="auto-start-reverse" markerUnits="strokeWidth"><path d="M0,0 L0,4 L6,2 z" fill="#dc2626" /></marker>
                     <marker id="arrowPurple" markerWidth="4" markerHeight="4" refX="0" refY="2" orient="auto-start-reverse" markerUnits="strokeWidth"><path d="M0,0 L0,4 L6,2 z" fill="#7e22ce" /></marker>
                </defs>
                <g transform={`scale(${0.8}) translate(${50}, 50)`}>
                    {viewMode === 'side' ? renderSideView() : renderInteractive3D()}
                </g>
             </svg>
        </div>
      );
  }

  // Se for o modo WIZARD (Interativo e Limpo)
  if (printMode && hideUI) {
     return (
        <div ref={captureRef} 
             className="w-full h-full bg-white relative overflow-hidden cursor-move"
             onMouseDown={startDrag} 
             onMouseMove={doDrag} 
             onMouseUp={stopDrag} 
             onMouseLeave={stopDrag} 
             onWheel={handleWheel}
        >
            <svg width="100%" height="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
                <defs>
                    <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse"><path d="M 100 0 L 0 0 0 100" fill="none" stroke="#e2e8f0" strokeWidth="2"/></pattern>
                     <marker id="arrowGreen" markerWidth="4" markerHeight="4" refX="0" refY="2" orient="auto-start-reverse" markerUnits="strokeWidth"><path d="M0,0 L0,4 L6,2 z" fill="#16a34a" /></marker>
                     <marker id="arrowOrange" markerWidth="4" markerHeight="4" refX="0" refY="2" orient="auto-start-reverse" markerUnits="strokeWidth"><path d="M0,0 L0,4 L6,2 z" fill="#f97316" /></marker>
                     <marker id="arrowBlue" markerWidth="4" markerHeight="4" refX="0" refY="2" orient="auto-start-reverse" markerUnits="strokeWidth"><path d="M0,0 L0,4 L6,2 z" fill="#2563eb" /></marker>
                     <marker id="arrowGray" markerWidth="4" markerHeight="4" refX="0" refY="2" orient="auto-start-reverse" markerUnits="strokeWidth"><path d="M0,0 L0,4 L6,2 z" fill="#666" /></marker>
                     <marker id="arrowRed" markerWidth="4" markerHeight="4" refX="0" refY="2" orient="auto-start-reverse" markerUnits="strokeWidth"><path d="M0,0 L0,4 L6,2 z" fill="#dc2626" /></marker>
                     <marker id="arrowPurple" markerWidth="4" markerHeight="4" refX="0" refY="2" orient="auto-start-reverse" markerUnits="strokeWidth"><path d="M0,0 L0,4 L6,2 z" fill="#7e22ce" /></marker>
                </defs>
                <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom}) translate(${svgWidth/2 - (margin + option.totalLength)/2}, 50)`}>
                    {viewMode === 'side' ? renderSideView() : renderInteractive3D()}
                </g>
            </svg>
        </div>
     );
  }

  // MODO NORMAL (MODAL COMPLETO COM BOTÕES)
  return (
    <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50 overflow-hidden">
      <div className="w-full h-full flex flex-col relative bg-white">
        
        {/* TOP BAR */}
        <div className="absolute top-4 left-4 z-10 flex gap-2 bg-white/90 p-2 rounded shadow-lg backdrop-blur-sm border border-gray-200 items-center">
             <button onClick={() => setViewMode('side')} className={`px-4 py-2 rounded font-black text-lg ${viewMode === 'side' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>Lateral 2D</button>
             <button onClick={() => { setViewMode('3d'); setPan({x:0, y:0}); setZoom(1.1); }} className={`px-4 py-2 rounded font-black text-lg ${viewMode === '3d' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>Visualizar 3D 🔄</button>
             <div className="w-px bg-gray-300 mx-2 h-8"></div>
             <button onClick={() => setZoom(z => z + 0.2)} className="px-4 py-2 bg-gray-200 rounded font-black hover:bg-gray-300 text-lg">Zoom +</button>
             <button onClick={() => setZoom(z => Math.max(0.2, z - 0.2))} className="px-4 py-2 bg-gray-200 rounded font-black hover:bg-gray-300 text-lg">Zoom -</button>
             
             {/* PDF MENU */}
             <div className="relative ml-4 group">
                 <button onClick={() => setShowExportMenu(!showExportMenu)} disabled={isExporting} className="px-6 py-2 bg-purple-600 text-white rounded font-black hover:bg-purple-700 text-lg shadow-lg flex items-center gap-2">
                    {isExporting ? '...' : '📥 Baixar PDF'} ▾
                 </button>
                 {showExportMenu && (
                     <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50 overflow-hidden animate-fade-in">
                         <div className="px-4 py-3 bg-gray-100 border-b font-bold text-gray-600 text-xs uppercase tracking-wider flex justify-between">
                            <span>Cenário</span>
                            <div className="flex gap-4 pr-2">
                                <span>2D</span>
                                <span>3D</span>
                            </div>
                         </div>
                         <div className="px-4 py-3 border-b flex justify-between items-center hover:bg-gray-50">
                            <span className="font-bold text-gray-800 text-sm">O Que Vejo Agora</span>
                            <div className="flex gap-2">
                                <button onClick={() => executeExport('atual', simulateSafe, correctionType, 'side')} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs font-bold">2D</button>
                                <button onClick={() => executeExport('atual', simulateSafe, correctionType, '3d')} className="px-3 py-1 bg-blue-100 text-blue-800 hover:bg-blue-200 rounded text-xs font-bold">3D</button>
                            </div>
                         </div>
                     </div>
                 )}
                 {showExportMenu && <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)}></div>}
             </div>
        </div>

        <button onClick={onClose} className="absolute top-4 right-4 z-10 bg-red-600 text-white w-12 h-12 rounded-full font-black text-xl shadow-lg hover:bg-red-700">✕</button>

        {/* CANVAS */}
        <div ref={internalCanvasRef} 
             className={`flex-1 w-full h-full cursor-move overflow-hidden relative ${isExporting ? 'bg-white' : 'bg-blueprint-grid'}`} 
             onMouseDown={startDrag} 
             onMouseMove={doDrag} 
             onMouseUp={stopDrag} 
             onMouseLeave={stopDrag} 
             onContextMenu={(e) => e.preventDefault()}
             onWheel={handleWheel}>
            <svg width="100%" height="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
                <defs>
                    <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse"><path d="M 100 0 L 0 0 0 100" fill="none" stroke="#e2e8f0" strokeWidth="2"/></pattern>
                     <marker id="arrowGreen" markerWidth="4" markerHeight="4" refX="0" refY="2" orient="auto-start-reverse" markerUnits="strokeWidth"><path d="M0,0 L0,4 L6,2 z" fill="#16a34a" /></marker>
                     <marker id="arrowOrange" markerWidth="4" markerHeight="4" refX="0" refY="2" orient="auto-start-reverse" markerUnits="strokeWidth"><path d="M0,0 L0,4 L6,2 z" fill="#f97316" /></marker>
                     <marker id="arrowBlue" markerWidth="4" markerHeight="4" refX="0" refY="2" orient="auto-start-reverse" markerUnits="strokeWidth"><path d="M0,0 L0,4 L6,2 z" fill="#2563eb" /></marker>
                     <marker id="arrowGray" markerWidth="4" markerHeight="4" refX="0" refY="2" orient="auto-start-reverse" markerUnits="strokeWidth"><path d="M0,0 L0,4 L6,2 z" fill="#666" /></marker>
                     <marker id="arrowRed" markerWidth="4" markerHeight="4" refX="0" refY="2" orient="auto-start-reverse" markerUnits="strokeWidth"><path d="M0,0 L0,4 L6,2 z" fill="#dc2626" /></marker>
                     <marker id="arrowPurple" markerWidth="4" markerHeight="4" refX="0" refY="2" orient="auto-start-reverse" markerUnits="strokeWidth"><path d="M0,0 L0,4 L6,2 z" fill="#7e22ce" /></marker>
                </defs>
                <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom}) translate(${svgWidth/2 - (margin + option.totalLength)/2}, 50)`}>
                    {!isExporting && viewMode === 'side' && <rect x={-5000} y={-5000} width={10000} height={10000} fill="url(#grid)" />}
                    {viewMode === 'side' ? renderSideView() : renderInteractive3D()}
                </g>
            </svg>
        </div>

        {/* CONTROLES INFERIORES */}
        {!isExporting && (
            <div className="bg-gray-900 text-white p-6 flex flex-col md:flex-row justify-between items-center z-20 shadow-[0_-5px_15px_rgba(0,0,0,0.3)] gap-4">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-6">
                        <div className="text-xl font-black">Opção {option.optionNumber}</div>
                        {hasSlabInfo ? (
                            <div className={`px-6 py-3 rounded-lg font-bold text-lg flex items-center gap-3 border-2 ${simulateSafe && simulatedValues.safe ? 'bg-blue-900 border-blue-500' : (!simulateSafe && simulatedValues.safe ? 'bg-green-800 border-green-500' : 'bg-red-900 border-red-500')}`}>
                                <span className="text-3xl">{simulatedValues.safe ? '✅' : '❌'}</span>
                                <div>
                                    <div>{simulateSafe ? 'MODO CORREÇÃO' : (simulatedValues.safe ? 'APROVADO' : 'REPROVADO')}</div>
                                    <div className="text-sm font-normal opacity-80">
                                        {simulateSafe 
                                            ? (simulatedValues.safe 
                                                ? `Corrigido: ${simulatedValues.clearance.toFixed(0)}cm Livre` 
                                                : `Falha: ${simulatedValues.clearance.toFixed(0)}cm (Max possível)`)
                                            : `Cabeçada Atual: ${simulatedValues.clearance.toFixed(0)}cm`
                                        }
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-blue-600 px-4 py-2 rounded font-bold">INFO: Sem laje superior (Vão Livre).</div>
                        )}
                    </div>
                    {simulateSafe && correctionType === 'shrink_stair' && (
                        <div className="text-sm text-gray-400">
                             De: {option.totalLength.toFixed(1)}cm (Pisante {option.treadDepth}cm) → <span className={`${simulatedValues.safe ? 'text-green-400' : 'text-orange-400'} font-bold`}>Para: {simulatedValues.length.toFixed(1)}cm (Pisante {simulatedValues.tread.toFixed(1)}cm)</span>
                        </div>
                    )}
                </div>

                {hasSlabInfo && (
                    <div className="flex flex-col gap-2">
                        {/* INPUT PARA DEFINIR ALTURA LIVRE DESEJADA */}
                        <div className="flex items-center gap-2 bg-gray-800 p-2 rounded">
                            <label className="text-xs font-bold text-gray-400 uppercase">Altura Livre Mínima:</label>
                            <input 
                                type="number" 
                                value={headroomInput} 
                                onChange={e => setHeadroomInput(parseInt(e.target.value) || 0)} 
                                className="w-16 bg-gray-700 text-white font-bold text-center rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                            />
                            <span className="text-xs font-bold text-gray-400">cm</span>
                            <button 
                                onClick={() => setTargetHeadroom(headroomInput)} 
                                className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-bold ml-2 shadow-sm uppercase"
                            >
                                Definir
                            </button>
                        </div>

                        {!simulatedValues.safe && !simulateSafe && (
                            <div className="flex items-center gap-4 bg-gray-800 p-2 rounded-lg">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={simulateSafe} onChange={e => setSimulateSafe(e.target.checked)} className="w-5 h-5 text-blue-600" />
                                    <span className="font-bold">Ativar Correção</span>
                                </label>
                            </div>
                        )}
                    </div>
                )}
                
                {simulateSafe && (
                     <div className="flex flex-col md:flex-row gap-2 items-center">
                         <div className="flex bg-gray-700 rounded p-1">
                            <button onClick={() => setCorrectionType('expand_opening')} className={`px-3 py-2 rounded text-sm font-bold transition ${correctionType === 'expand_opening' ? 'bg-blue-600 text-white shadow' : 'text-gray-300 hover:text-white'}`}>Aumentar Vão</button>
                            <button onClick={() => setCorrectionType('shrink_stair')} className={`px-3 py-2 rounded text-sm font-bold transition ${correctionType === 'shrink_stair' ? 'bg-blue-600 text-white shadow' : 'text-gray-300 hover:text-white'}`}>Ajustar Escada</button>
                        </div>
                        {correctionType === 'shrink_stair' && simulatedValues.safe && (
                            <button onClick={handleApply} className="bg-green-600 hover:bg-green-700 text-white font-black px-4 py-2 rounded shadow-lg animate-pulse flex items-center gap-2">💾 Aplicar no Orçamento</button>
                        )}
                     </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default StaircaseVisualizer;
