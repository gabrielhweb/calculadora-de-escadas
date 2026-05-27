
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ProposalOption, ReferenceDoor, CalculatorInput } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Line } from '@react-three/drei';
import * as THREE from 'three';

interface StaircaseVisualizerProps {
  option: ProposalOption;
  totalHeight: number;
  inputData?: CalculatorInput;
  treadMaterial?: 'madeira' | 'metal';
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
  captureRef?: React.RefObject<HTMLDivElement>;
  hideUI?: boolean;
  stairDirection?: 'standard' | 'mirrored'; 
  referenceDoor?: ReferenceDoor;
}

// Tipos para a Engine 3D Simples
interface Point3D { x: number; y: number; z: number; }
interface Point2D { x: number; y: number; }
interface Face {
  points: Point3D[];
  fill: string;
  stroke: string;
  strokeWidth?: number;
  zIndex: number;
  id: string;
  opacity?: number;
  strokeDashArray?: string;
  text?: string;
}

import { useSpring, animated } from '@react-spring/three';

const StairModel: React.FC<{
  isOpen: boolean;
  totalHeightM: number;
  totalLengthM: number;
  stairWidth: number;
  treadDepth: number;
  stepsCount: number;
  materialProp: 'madeira' | 'metal';
  hasCorrimao: boolean;
  handrailHeightM: number;
  supportThicknessM: number;
  handrailThicknessM: number;
}> = ({ isOpen, totalHeightM, totalLengthM, stairWidth, treadDepth, stepsCount, materialProp, hasCorrimao, handrailHeightM, supportThicknessM, handrailThicknessM }) => {
  const barLength = Math.sqrt(totalHeightM ** 2 + totalLengthM ** 2);
  // Angle to tilt a Z-aligned box so it points to (0, -totalHeightM, totalLengthM)
  const slopeAngle = Math.atan2(totalHeightM, totalLengthM); 

  // Lateral parallelogram folding: 
  // 0 = open (horizontal steps). Math.PI / 2 = closed (folded 90 deg against wall)
  const { phi } = useSpring({
    phi: isOpen ? 0 : Math.PI / 2,
    config: { mass: 2, tension: 150, friction: 30 }
  });

  const stepColor = materialProp === 'madeira' ? '#8b5a2b' : '#4b5563';
  const metallicColor = '#2f3136'; 

  // The fixed wall stringer is at the left boundary.
  const wallX = -stairWidth / 2 + 0.02; // Center of 4cm box
  
  // The distance between hinges is the width of the steps
  const stairW = stairWidth - 0.04;
  
  // Outer stringer translates as phi changes, squeezing perfectly toward the wall!
  const outerStringerX = phi.to(p => wallX + stairW * Math.cos(p));
  const outerStringerY = phi.to(p => stairW * Math.sin(p));

  return (
    // Base coordinate system: pivot at top landing.
    <group position={[0, totalHeightM, 0]}>
      
      {/* INNER STRINGER (Fixed rigidly to the wall at X = wallX) */}
      <group position={[wallX, -totalHeightM / 2, totalLengthM / 2]}>
        <mesh rotation-x={slopeAngle}>
          <boxGeometry args={[0.04, 0.08, barLength]} />
          <meshStandardMaterial color={metallicColor} metalness={0.7} roughness={0.3} />
        </mesh>

        {/* Chapas de Fixação na Parede (Apoios superior e inferior) */}
        <mesh position={[-0.025, totalHeightM / 2, -totalLengthM / 2]}>
          <boxGeometry args={[0.01, 0.30, 0.20]} />
          <meshStandardMaterial color={metallicColor} metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[-0.025, -totalHeightM / 2, totalLengthM / 2]}>
          <boxGeometry args={[0.01, 0.30, 0.20]} />
          <meshStandardMaterial color={metallicColor} metalness={0.7} roughness={0.3} />
        </mesh>
      </group>

      {/* OUTER STRINGER (Translates laterally and upwards) */}
      <animated.group 
        position-x={outerStringerX}
        position-y={outerStringerY}
        position-z={0}
      >
        <group position={[0, -totalHeightM / 2, totalLengthM / 2]}>
          <mesh rotation-x={slopeAngle}>
            <boxGeometry args={[0.04, 0.08, barLength]} />
            <meshStandardMaterial color={metallicColor} metalness={0.7} roughness={0.3} />
          </mesh>
        </group>

        {/* Handrail Main Tube and Supports */}
        {hasCorrimao && (
          <group>
             {/* Main Tube */}
             <group position={[0, -totalHeightM / 2 + handrailHeightM, totalLengthM / 2]}>
               <mesh rotation-x={slopeAngle}>
                 <boxGeometry args={[handrailThicknessM, handrailThicknessM, barLength]} />
                 <meshStandardMaterial color={metallicColor} metalness={0.8} roughness={0.2} />
               </mesh>
             </group>
             
             {/* Vertical Supports (Torres/Hastes) */}
             {Array.from({ length: stepsCount }).map((_, i) => {
               const fraction = (i + 0.5) / stepsCount;
               const hingeY = -totalHeightM * fraction;
               const hingeZ = totalLengthM * fraction;
               return (
                  <mesh key={`post-${i}`} position={[0, hingeY + handrailHeightM / 2, hingeZ]}>
                    <boxGeometry args={[supportThicknessM, handrailHeightM, supportThicknessM]} />
                    <meshStandardMaterial color={metallicColor} metalness={0.8} roughness={0.2} />
                  </mesh>
               );
             })}
          </group>
        )}
      </animated.group>

      {/* STEPS - They pivot at the Wall Stringer! */}
      {Array.from({ length: stepsCount }).map((_, i) => {
        // Find position of the hinge for this step on the wall stringer
        // Y goes from 0 down to -totalHeightM
        // Z goes from 0 to totalLengthM
        const fraction = (i + 0.5) / stepsCount;
        const hingeY = -totalHeightM * fraction;
        const hingeZ = totalLengthM * fraction;

        return (
          <group key={i} position={[wallX, hingeY, hingeZ]}>
            {/* The step rotates around Z so it flips up to lay flat against the wall! */}
            <animated.group rotation-z={phi as any}>
              {/* Offset step center to match the hinge width */}
              <mesh position={[stairW / 2, 0, 0]}>
                <boxGeometry args={[stairW, 0.03, treadDepth]} />
                <meshStandardMaterial 
                  color={stepColor} 
                  metalness={materialProp === 'metal' ? 0.5 : 0.1}
                  roughness={materialProp === 'metal' ? 0.4 : 0.8}
                />
              </mesh>
            </animated.group>
          </group>
        );
      })}
    </group>
  );
};

const Interactive3DStair: React.FC<{
  option: ProposalOption;
  totalHeight: number;
  inputData?: CalculatorInput;
  treadMaterial?: 'madeira' | 'metal';
}> = ({ option, totalHeight, inputData, treadMaterial = 'madeira' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hudOpacity, setHudOpacity] = useState(100);
  
  const totalHeightM = (totalHeight || 300) / 100;
  const totalLengthM = (option.totalLength || 300) / 100;
  const stairWidth = (option.stairWidth || 80) / 100;
  const treadDepth = (option.treadDepth || 25) / 100;
  const stepsCount = option.steps > 0 ? option.steps : 10;
  const materialProp = treadMaterial;

  const stairDirection = inputData?.stairDirection || 'standard';
  const wallFixation = inputData?.wallFixation || 'left';
  
  // Handrail options (Def padrão da prompt)
  const hasCorrimao = inputData?.hasCorrimao ?? true;
  const handrailHeightM = (inputData?.handrailHeight || 80) / 100;
  const supportThicknessM = (inputData?.supportThickness || 2) / 100;
  const handrailThicknessM = (inputData?.handrailThickness || 3) / 100;

  // Mirroring
  const scaleX = stairDirection === 'mirrored' ? -1 : 1;

  // Wall position
  const wallPositionX = wallFixation === 'left' ? -stairWidth / 2 - 0.1 : 
                        wallFixation === 'right' ? stairWidth / 2 + 0.1 : 
                        0; // Frontal wall doesn't translate X
  const wallPositionZ = wallFixation === 'frontal' ? 0 : 0; // Frontal would be back of stairs

  // HUD and Dimension logic for Closed Package State
  const maxHandrailHeightM = hasCorrimao ? handrailHeightM : 0; 
  const espessuraEstruturaM = 0.08; // Espessura fixa exigida de 8cm (0.08m)
  const larguraPacoteM = stairWidth + maxHandrailHeightM; // Largura do Degrau + Altura do Corrimão
  const alturaMaximaM = totalHeightM + maxHandrailHeightM + espessuraEstruturaM;
  const comprimentoMaximoM = totalLengthM;
  
  // A diagonal exata: \sqrt{comprimento^2 + altura_máxima^2}
  const diagonalExata = Math.sqrt(Math.pow(comprimentoMaximoM, 2) + Math.pow(alturaMaximaM, 2));

  return (
    <div className="relative w-full h-full bg-slate-200">
      <Canvas camera={{ position: [5 * scaleX, totalHeightM + 1, 5], fov: 50 }} style={{ width: '100%', height: '100%', background: '#e2e8f0' }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
          <pointLight position={[-5, 5, -5]} intensity={0.5} />

          <OrbitControls target={[0, totalHeightM / 2, 0]} />

          <group scale={[scaleX, 1, 1]}>
              <group 
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                onPointerOver={() => document.body.style.cursor = 'pointer'}
                onPointerOut={() => document.body.style.cursor = 'auto'}
              >
                <StairModel 
                  isOpen={isOpen} 
                  totalHeightM={totalHeightM} 
                  totalLengthM={totalLengthM} 
                  stairWidth={stairWidth} 
                  treadDepth={treadDepth}
                  stepsCount={stepsCount} 
                  materialProp={materialProp}
                  hasCorrimao={hasCorrimao}
                  handrailHeightM={handrailHeightM}
                  supportThicknessM={supportThicknessM}
                  handrailThicknessM={handrailThicknessM}
                />
              </group>

              {/* Wall */}
              {wallFixation !== 'frontal' ? (
                  <mesh position={[wallPositionX, totalHeightM / 2, totalLengthM / 2]}>
                      <boxGeometry args={[0.2, totalHeightM + 2, totalLengthM + 2]} />
                      <meshStandardMaterial color="#cbd5e1" />
                  </mesh>
              ) : (
                  <mesh position={[0, totalHeightM / 2, -0.4]}>
                      <boxGeometry args={[stairWidth + 2, totalHeightM + 2, 0.2]} />
                      <meshStandardMaterial color="#cbd5e1" />
                  </mesh>
              )}
          </group>

          {/* Real-time Dimensions HUD (tied to the 3D space) */}
          <group scale={[scaleX, 1, 1]}>
            {isOpen ? (
              <group>
                {/* Altura Total (Verde) */}
                <Line points={[[wallPositionX - 0.3, 0, 0], [wallPositionX - 0.3, totalHeightM, 0]]} color="#4ade80" lineWidth={5} dashed={true} dashSize={0.1} gapSize={0.05} />
                <Html position={[wallPositionX - 0.3, totalHeightM / 2, 0]} center zIndexRange={[100, 0]}>
                  <div className="bg-black/80 text-green-400 px-2 py-1 rounded text-xs font-mono shadow-md border border-green-400/20 whitespace-nowrap">
                    ↕ H: {totalHeightM.toFixed(2)}m
                  </div>
                </Html>
                {/* Avanço Total (Azul) */}
                <Line points={[[0, -0.1, 0], [0, -0.1, totalLengthM]]} color="#60a5fa" lineWidth={5} dashed={true} dashSize={0.1} gapSize={0.05} />
                <Html position={[0, -0.1, totalLengthM / 2]} center zIndexRange={[100, 0]}>
                  <div className="bg-black/80 text-blue-400 px-2 py-1 rounded text-xs font-mono shadow-md border border-blue-400/20 whitespace-nowrap">
                    ↔ C: {totalLengthM.toFixed(2)}m
                  </div>
                </Html>
                {/* Largura Degrau (Amarelo) */}
                <Line points={[[-stairWidth/2, 0, totalLengthM + 0.1], [stairWidth/2, 0, totalLengthM + 0.1]]} color="#fbbf24" lineWidth={5} dashed={true} dashSize={0.1} gapSize={0.05} />
                <Html position={[0, 0, totalLengthM + 0.1]} center zIndexRange={[100, 0]}>
                  <div className="bg-black/80 text-yellow-400 px-2 py-1 rounded text-xs font-mono shadow-md border border-yellow-400/20 whitespace-nowrap">
                    ⟷ L: {stairWidth.toFixed(2)}m
                  </div>
                </Html>
              </group>
            ) : (
              <group>
                {/* Largura do Pacote na Vertical (Amarelo) */}
                <Line points={[[wallPositionX + 0.1, totalHeightM/2, totalLengthM/2], [wallPositionX + 0.1, totalHeightM/2 + stairWidth, totalLengthM/2]]} color="#fbbf24" lineWidth={5} />
                {/* Diagonal do Pacote (Azul), ligando ponta superior extrema até a base inferior */}
                <Line points={[[wallPositionX + 0.1, alturaMaximaM, 0], [wallPositionX + 0.1, 0, comprimentoMaximoM]]} color="#60a5fa" lineWidth={5} dashed={true} dashSize={0.2} gapSize={0.1} />
              </group>
            )}
          </group>

          {/* Floor */}
          <mesh position={[0, 0, totalLengthM / 2]} rotation-x={-Math.PI / 2}>
              <planeGeometry args={[stairWidth + 4, totalLengthM + 4]} />
              <meshStandardMaterial color="#cbd5e1" />
          </mesh>

          {/* UI Hint */}
          <Html position={[0, totalHeightM + 0.5, 0]} center>
              <div 
                  className="bg-white/90 backdrop-blur text-blue-800 px-4 py-2 rounded-full font-bold shadow whitespace-nowrap cursor-pointer hover:bg-blue-50"
                  onClick={(e: any) => { e.stopPropagation(); setIsOpen(!isOpen); }}
              >
                  {isOpen ? 'Clique para Fechar' : 'Clique para Abrir'}
              </div>
          </Html>
      </Canvas>

      {/* Painel lateral 2D (não obstrutivo) de Dimensões para Frete */}
      {!isOpen && (
        <div 
          className="absolute top-4 right-4 bg-slate-900/95 border border-slate-700 text-white p-4 rounded-xl shadow-2xl flex flex-col gap-2 whitespace-nowrap backdrop-blur-md z-10 pointer-events-auto transition-opacity duration-150"
          style={{ opacity: hudOpacity / 100 }}
        >
          <div className="text-sm font-black text-blue-400 border-b border-blue-900/50 pb-2 mb-1 flex justify-between items-center gap-4">
             <span>📦 DIMENSÕES PARA FRETE</span>
             <input 
                type="range" 
                min="0" 
                max="100" 
                value={hudOpacity}
                onChange={(e) => setHudOpacity(Number(e.target.value))}
                className="w-24 accent-blue-500 cursor-pointer"
                title="Transparência do painel"
             />
          </div>
          <div className="font-mono text-sm flex justify-between gap-6 items-center">
            <span className="text-slate-400 tracking-wider text-xs">ESPESSURA (ESTRUTURA)</span> 
            <span className="font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded">{espessuraEstruturaM.toFixed(2)}m</span>
          </div>
          <div className="font-mono text-sm flex justify-between gap-6 items-center">
            <span className="text-slate-400 tracking-wider text-xs" style={{ color: '#fbbf24' }}>LARGURA DO PACOTE</span> 
            <span className="font-bold text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded">{larguraPacoteM.toFixed(2)}m</span>
          </div>
          <div className="font-mono text-sm flex flex-col gap-1 border-t border-slate-700 pt-2 mt-1">
            <div className="flex justify-between items-center">
                <span className="text-slate-400 tracking-wider text-xs" style={{ color: '#60a5fa' }}>DIAGONAL EXATA</span> 
                <span className="font-bold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded text-lg">{diagonalExata.toFixed(2)}m</span>
            </div>
            <div className="mt-2 text-[10px] text-slate-400 font-mono text-center bg-slate-800/50 p-2 rounded leading-relaxed">
                Cálculo: √ (Comprimento² + (Altura Escada + Corrimão + Estrutura)²)
                <br />
                √ ({comprimentoMaximoM.toFixed(2)}² + {alturaMaximaM.toFixed(2)}²) = {diagonalExata.toFixed(2)}m
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StaircaseVisualizer: React.FC<StaircaseVisualizerProps> = ({ 
    option, totalHeight, inputData, treadMaterial, slabOpening, slabThickness = 15, onClose, printMode = false, initialViewMode = 'side', onApplyCorrection, forcedState,
    captureRef, hideUI = false, stairDirection = 'standard', referenceDoor
}) => {
  // --- PROTEÇÃO CONTRA DADOS NULOS ---
  if (!option) return null;

  const [viewMode, setViewMode] = useState<'side' | '3d'>(initialViewMode || 'side');
  const [headroomInput, setHeadroomInput] = useState(200);
  const [targetHeadroom, setTargetHeadroom] = useState(200); 
  const [zoom, setZoom] = useState(printMode ? 1 : 1.1); 
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isAlertMinimized, setIsAlertMinimized] = useState(false); // NOVO: Controle de colapso
  
  // Rotação inicial baseada na direção da escada
  const [rotation, setRotation] = useState({ 
      x: -20, 
      y: stairDirection === 'mirrored' ? -45 : 45 
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'rotate' | 'pan'>('pan');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [simulateSafe, setSimulateSafe] = useState(forcedState ? forcedState.simulateSafe : false);
  const [correctionType, setCorrectionType] = useState<'expand_opening' | 'shrink_stair'>(forcedState ? forcedState.correctionType : 'expand_opening');
  
  const [simulatedValues, setSimulatedValues] = useState<{tread: number, length: number, clearance: number, safe: boolean}>({
      tread: option.treadDepth || 25,
      length: option.totalLength || 300,
      clearance: 0,
      safe: false
  });

  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const internalCanvasRef = useRef<HTMLDivElement>(null);

  // Efeito para ajustar a câmera quando a direção muda
  useEffect(() => {
      if (stairDirection === 'mirrored') {
          setRotation({ x: -20, y: -45 }); // Vira a câmera para a esquerda
      } else {
          setRotation({ x: -20, y: 45 }); // Vira a câmera para a direita (padrão)
      }
  }, [stairDirection]);

  useEffect(() => {
      if (printMode && initialViewMode === '3d') {
          // Ajuste fino para impressão
          setRotation({ x: -20, y: stairDirection === 'mirrored' ? -45 : 45 });
          setZoom(1.3); 
      }
      setViewMode(initialViewMode || 'side');
  }, [printMode, initialViewMode, stairDirection]);

  useEffect(() => {
      if (forcedState) {
          setSimulateSafe(forcedState.simulateSafe);
          setCorrectionType(forcedState.correctionType);
      }
  }, [forcedState]);

  const margin = 100; 
  const svgHeight = (totalHeight || 300) + 400; 
  const floorY = svgHeight - 150; 
  const ceilingY = floorY - (totalHeight || 300); 
  const slabBottomY = ceilingY + (slabThickness || 0);
  const ceilingHeight = (totalHeight || 300) - (slabThickness || 0); 

  const hasSlabInfo = slabOpening !== undefined && slabOpening > 0 && !isNaN(slabOpening);
  const safeLandings = useMemo(() => option.landings || [], [option.landings]);

  const getSlabEdgeX = (currentTotalLength: number) => {
      if (!hasSlabInfo) return margin + currentTotalLength + 200; 
      return margin + currentTotalLength - (slabOpening || 0);
  };

  // --- CÁLCULO DE CORREÇÃO ---
  const calculationData = useMemo(() => {
      const result = {
          corrections: { safeSlabX: 0, safeLength: option.totalLength, safeTread: option.treadDepth, clearanceAtSafe: 999, foundSafe: true },
          originalSafety: { safe: true, clearance: 999 }
      };

      if (!hasSlabInfo) return result;

      const calculateHeadroom = (treadDepth: number, totalLen: number) => {
          const currentSlabX = margin + totalLen - (slabOpening || 0);
          let surfaceYUnderSlab = floorY; 
          
          for (let i = 1; i <= option.steps; i++) {
               let currentRunStart = 0;
               for(let j=1; j<i; j++) {
                   const isLanding = safeLandings.find(l=>l.step === j);
                   currentRunStart += isLanding ? isLanding.length : treadDepth;
               }
               const stepStart = margin + currentRunStart;
               const isLanding = safeLandings.find(l=>l.step === i);
               const currentRunLength = isLanding ? isLanding.length : treadDepth;
               const stepEnd = stepStart + currentRunLength;
               
               if (currentSlabX >= stepStart - 0.5 && currentSlabX < stepEnd - 0.5) {
                   surfaceYUnderSlab = floorY - (i * option.stepHeight);
                   break;
               }
          }
          
          if (currentSlabX >= margin + totalLen - 0.5) {
              surfaceYUnderSlab = floorY - (option.steps * option.stepHeight);
          }

          const dist = surfaceYUnderSlab - slabBottomY;
          return { clearance: dist, slabX: currentSlabX, stepY: surfaceYUnderSlab };
      };

      const origCheck = calculateHeadroom(option.treadDepth, option.totalLength);
      result.originalSafety = { safe: origCheck.clearance >= targetHeadroom, clearance: origCheck.clearance };
      result.corrections.safeSlabX = origCheck.slabX; 

      let safeXSlabForOpening = origCheck.slabX;
      const requiredY = slabBottomY + targetHeadroom; 
      
      for (let i = 0; i <= option.steps; i++) {
        const stepTopY = floorY - (i * option.stepHeight);
        if (stepTopY < requiredY) {
            let runBeforeStep = 0;
            for(let j=1; j<i; j++) { 
               const isLanding = safeLandings.find(l=>l.step === j);
               runBeforeStep += isLanding ? isLanding.length : option.treadDepth;
            }
            safeXSlabForOpening = margin + runBeforeStep - 1; 
            break;
        }
        if (i === option.steps) safeXSlabForOpening = Math.max(origCheck.slabX, margin + option.totalLength);
      }
      
      const stairsOnlySteps = option.structureSteps;
      const landingsLen = safeLandings.reduce((acc,l) => acc+l.length, 0);
      
      let bestSafeTread = option.treadDepth;
      let bestSafeLength = option.totalLength;
      let isSolutionFound = false;
      let bestClearance = -999;

      // ATUALIZAÇÃO: Loop agora vai até 6cm (antes parava em 10cm)
      // Isso permite encontrar solução geométrica mesmo em vãos de 100cm
      for (let t = option.treadDepth; t >= 6; t -= 0.05) {
          const tryLength = (stairsOnlySteps * (t + 0.5)) + landingsLen;
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
          safeSlabX: safeXSlabForOpening, 
          safeLength: bestSafeLength, 
          safeTread: bestSafeTread, 
          clearanceAtSafe: isSolutionFound ? Math.max(bestClearance, targetHeadroom) : bestClearance, 
          foundSafe: isSolutionFound 
      };

      return result;

  }, [option, hasSlabInfo, floorY, slabBottomY, margin, safeLandings, targetHeadroom, slabOpening]); 

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
          const msg = `CONFIRMAR AJUSTE?\n\n` + 
                      `A escada será ajustada para garantir ${targetHeadroom}cm de altura livre:\n` +
                      `• Pisante: ${option.treadDepth}cm ➝ ${simulatedValues.tread.toFixed(1)}cm\n` +
                      `• Comp. Total: ${(option.totalLength/100).toFixed(2)}m ➝ ${(simulatedValues.length/100).toFixed(2)}m` +
                      `${simulatedValues.tread < 18 ? '\n⚠️ ATENÇÃO: Pisante ficará abaixo de 18cm (fora de padrão)!' : ''}`;
                      
          if (window.confirm(msg)) {
              onApplyCorrection(simulatedValues.tread, simulatedValues.length);
              if (onClose) onClose();
          }
      }
  };

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

  const topLanding = safeLandings.find(l => l.step === option.steps);
  const landingLength = topLanding ? topLanding.length : 0;
  const stairRunLength = drawTotalLength - landingLength;
  
  // VERIFICA SE O PATAMAR TOPO É FLUSH (RENTE À LAJE)
  const isLastFlush = topLanding && topLanding.isFlushWithSlab;

  const drawStairEndX = margin + drawTotalLength;
  // Opening value calculation
  const calculatedOpeningSize = (margin + drawTotalLength) - drawSlabEdgeX;
  // Ensure visual opening is reasonable if no slab info (infinite)
  const visualOpeningSize = hasSlabInfo ? calculatedOpeningSize : 2000;
  
  const svgWidth = Math.max(margin + option.totalLength, drawStairEndX, drawSlabEdgeX, 1000) + (margin * 3);
  const isMirrored = stairDirection === 'mirrored';

  // --- CÁLCULO DA POSIÇÃO DA PORTA 2D ---
  let refDoorX2D = 0;
  let refDoorY2D = 0;
  let refDoorWidth2D = 0;
  
  if (referenceDoor && referenceDoor.isActive) {
      refDoorWidth2D = referenceDoor.width;
      const isUpper = referenceDoor.position === 'upper';
      
      if (isUpper) {
          // CORREÇÃO SOLICITADA: Porta Superior SEMPRE no nível da laje (ceilingY)
          // Mesmo que o patamar desça (não seja rente), a porta fica na laje.
          refDoorY2D = ceilingY;
          
          if (topLanding) {
              const landingLen = topLanding.length;
              if (!isMirrored) {
                  // Padrão: Patamar começa após a escada
                  const landingStart = margin + stairRunLength;
                  refDoorX2D = landingStart + (landingLen / 2) - (refDoorWidth2D / 2);
              } else {
                  // Espelhado: Patamar está no topo (margin)
                  const landingStart = margin;
                  refDoorX2D = landingStart + (landingLen / 2) - (refDoorWidth2D / 2);
              }
          } else {
              // Sem Patamar (Chegada Direta)
              if (!isMirrored) {
                  refDoorX2D = margin + drawTotalLength + 10; 
              } else {
                  refDoorX2D = margin - 10 - refDoorWidth2D;
              }
          }
      } else {
          // Lógica de Porta Térrea (Chão)
          refDoorY2D = floorY;
          const dist = referenceDoor.distance;
          if (!isMirrored) {
              refDoorX2D = margin + dist;
          } else {
              refDoorX2D = (margin + drawTotalLength) - dist - refDoorWidth2D;
          }
      }
  }

  const projectPoint = (p: Point3D): Point2D => {
      const cx = drawTotalLength / 2;
      const cy = (totalHeight || 300) / 2;
      const cz = option.stairWidth / 2;
      
      let rawX = p.x;
      // Inverte a geometria se for espelhado
      if (isMirrored) {
          rawX = drawTotalLength - p.x; 
      }

      let x = rawX - cx; let y = p.y - cy; let z = p.z - cz;
      const radY = (rotation.y * Math.PI) / 180;
      const x1 = x * Math.cos(radY) - z * Math.sin(radY);
      const z1 = x * Math.sin(radY) + z * Math.cos(radY);
      const radX = (rotation.x * Math.PI) / 180;
      const y2 = y * Math.cos(radX) - z1 * Math.sin(radX);
      const scale = 1.0; 
      return { x: x1 * scale + (svgWidth / 2) + pan.x, y: y2 * scale + (svgHeight / 2) + pan.y };
  };

  const getFaces = (): Face[] => {
      const faces: Face[] = [];
      const width = option.stairWidth;
      const stepH = option.stepHeight;
      const treadH = 2; 
      const beamW = 10; 
      const treadColorTop = '#a0a0a0'; 
      const treadColorSide = '#666'; 
      const landingColor = '#94a3b8';
      const beamColor = '#222'; 
      const beamStroke = '#000';
      
      let currentPos = { x: 0, y: (totalHeight || 300), z: 0 };
      let currentAngle = 0; 

      const baseY = (totalHeight || 300);
      const wallWidth = Math.max(2000, drawTotalLength + (referenceDoor?.distance || 0) + 500);
      
      const wallZ = -width - 50; 

      faces.push({
          points: [
              { x: -500, y: baseY, z: wallZ }, 
              { x: wallWidth, y: baseY, z: wallZ }, 
              { x: wallWidth, y: -500, z: wallZ }, 
              { x: -500, y: -500, z: wallZ } 
          ],
          fill: '#f1f5f9',
          stroke: '#cbd5e1',
          zIndex: -2000,
          id: 'back-wall',
          opacity: 0.9
      });

      if (referenceDoor && referenceDoor.isActive) {
          let dX = referenceDoor.distance;
          if (referenceDoor.position === 'upper') {
              // Ajuste 3D se tiver patamar
              if (topLanding) {
                  dX = stairRunLength; 
              } else {
                  dX = drawTotalLength + 10;
              }
          }

          const dW = referenceDoor.width;
          const dH = referenceDoor.height;
          const dZ = wallZ + 2; 
          const isUpper = referenceDoor.position === 'upper';
          // CORREÇÃO 3D: Se a porta é upper, o Y base é 0 (topo da laje)
          const doorBaseY = isUpper ? 0 : baseY;
          
          const dp1 = { x: dX,      y: doorBaseY,      z: dZ };
          const dp2 = { x: dX + dW, y: doorBaseY,      z: dZ };
          const dp3 = { x: dX + dW, y: doorBaseY - dH, z: dZ };
          const dp4 = { x: dX,      y: doorBaseY - dH, z: dZ };
          
          faces.push({ 
              points: [dp1, dp2, dp3, dp4], 
              fill: '#3b82f6', 
              stroke: '#1e3a8a', 
              strokeWidth: 4,
              zIndex: -1900,
              id: 'ref-door',
              opacity: 0.7 
          });
      }
      
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

      const slabContStartX = drawTotalLength;
      const slabContEndX = 2000;
      const slabYCeil = 0;
      const slabYFloor = -(slabThickness || 15);
      const slabZStart = -1000; 
      const slabZEnd = 1000;

      const sc1 = { x: slabContStartX, y: slabYFloor, z: slabZStart }; 
      const sc2 = { x: slabContEndX,   y: slabYFloor, z: slabZStart }; 
      const sc3 = { x: slabContEndX,   y: slabYFloor, z: slabZEnd };   
      const sc4 = { x: slabContStartX, y: slabYFloor, z: slabZEnd };   
      const sc1_b = { x: slabContStartX, y: slabYCeil, z: slabZStart };
      const sc2_b = { x: slabContEndX,   y: slabYCeil, z: slabZStart };
      const sc3_b = { x: slabContEndX,   y: slabYCeil, z: slabZEnd };
      const sc4_b = { x: slabContStartX, y: slabYCeil, z: slabZEnd };

      faces.push({ points: [sc1, sc2, sc3, sc4], fill: '#e2e8f0', stroke: '#cbd5e1', zIndex: -1000, id: 'slab-cont-floor' });
      faces.push({ points: [sc1_b, sc4_b, sc3_b, sc2_b], fill: '#cbd5e1', stroke: '#94a3b8', zIndex: -999, id: 'slab-cont-ceil', opacity: 1 });
      faces.push({ points: [sc1, sc4, sc4_b, sc1_b], fill: '#94a3b8', stroke: '#64748b', zIndex: -998, id: 'slab-cont-face' });

      for (let i = 1; i <= option.steps; i++) {
          const landing = safeLandings.find(l => l.step === i);
          const run = landing ? landing.length : drawTreadDepth; 
          
          const rad = (currentAngle * Math.PI) / 180;
          const fwdX = Math.cos(rad) * run;
          const fwdZ = Math.sin(rad) * run;
          const rightX = Math.sin(rad) * width;
          const rightZ = -Math.cos(rad) * width;

          // CORREÇÃO: Se for patamar rente à laje (último passo), Y deve ser 0 (topo), não stepH abaixo
          let yTop;
          if (landing && landing.isLastStep && landing.isFlushWithSlab) {
              yTop = 0; // Topo exato
          } else {
              yTop = currentPos.y - stepH;
          }
          const yBottom = currentPos.y; // Base do degrau anterior

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

          if (!landing) {
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
          }
          
          // Avança para o próximo
          if (landing && landing.isLastStep && landing.isFlushWithSlab) {
              // Se foi o último rente, não desce mais
          } else {
              currentPos.y = yTop;
          }

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
          const cx = 0; const cy = (totalHeight || 300)/2; const cz = 0;
          let x = center.x - cx; let y = center.y - cy; let z = center.z - cz;
          const radY = (rotation.y * Math.PI) / 180;
          const z1 = x * Math.sin(radY) + z * Math.cos(radY);
          const radX = (rotation.x * Math.PI) / 180;
          const z2 = y * Math.sin(radX) + z1 * Math.cos(radX);
          face.zIndex = z2;
      });
      return faces.sort((a, b) => a.zIndex - b.zIndex);
  };

  const renderSideView = () => {
    // --- CÁLCULO DINÂMICO DAS POSIÇÕES DA LAJE/BURLACO PARA ESPELHAMENTO ---
    // Padrão: Buraco é à direita (final da escada)
    // Espelhado: Buraco é à esquerda (final da escada)
    
    let holeStartX, holeEndX;
    
    if (!isMirrored) {
        // Padrão: Laje esquerda (PERIGO) -> Buraco -> Laje direita (CHEGADA)
        // Se Vão Livre (!hasSlabInfo), o buraco é enorme e não tem perigo à esquerda
        holeEndX = margin + drawTotalLength; // Borda da chegada (Topo do degrau)
        holeStartX = hasSlabInfo ? (holeEndX - visualOpeningSize) : -2000;
    } else {
        // Espelhado: Laje esquerda (CHEGADA) -> Buraco -> Laje direita (PERIGO)
        // A escada chega na ESQUERDA (margin).
        holeStartX = margin; // Borda da chegada (Topo do degrau)
        holeEndX = hasSlabInfo ? (holeStartX + visualOpeningSize) : 20000;
    }

    // Cálculo de Cabeçada (Ajustado para espelhamento)
    const getHeadroomLine = () => {
        if (!hasSlabInfo) return null;
        
        // A quina da laje que causa perigo muda de lado
        // Padrão: Perigo é à esquerda do buraco (holeStartX)
        // Espelhado: Perigo é à direita do buraco (holeEndX)
        const lineX = isMirrored ? holeEndX : holeStartX;
        const lineTopY = slabBottomY;
        
        let foundStepY = floorY;
        
        for (let i = 1; i <= option.steps; i++) {
            let currentRunStart = 0;
            for(let j=1; j<i; j++) {
                const isLanding = safeLandings.find(l=>l.step === j);
                currentRunStart += isLanding ? isLanding.length : drawTreadDepth;
            }
            const runLen = (safeLandings.find(l=>l.step === i)?.length) || drawTreadDepth;
            
            let stepStartVisual, stepEndVisual;
            if (!isMirrored) {
                stepStartVisual = margin + currentRunStart;
                stepEndVisual = stepStartVisual + runLen;
            } else {
                // Espelhado: Começa na direita (margin+total) e vai para esquerda
                stepStartVisual = (margin + drawTotalLength) - currentRunStart; // Início do degrau (lado direito dele)
                stepEndVisual = stepStartVisual - runLen; // Fim do degrau (lado esquerdo dele)
                
                // Normaliza para [min, max]
                const minX = Math.min(stepStartVisual, stepEndVisual);
                const maxX = Math.max(stepStartVisual, stepEndVisual);
                stepStartVisual = minX;
                stepEndVisual = maxX;
            }
            
            // Verifica colisão com margem de segurança pequena
            if (lineX >= stepStartVisual - 0.5 && lineX <= stepEndVisual + 0.5) {
                foundStepY = floorY - (i * option.stepHeight);
                break;
            }
        }
        
        return { x: lineX, y1: lineTopY, y2: foundStepY, dist: foundStepY - lineTopY };
    };
    const headroomLine = getHeadroomLine();

    let stepsPoints: Point2D[] = [];
    let landingDraws: any[] = []; 
    let firstStepCoords = {x: 0, y: 0};

    let currentX = isMirrored ? (margin + drawTotalLength) : margin;
    const directionMult = isMirrored ? -1 : 1;
    
    stepsPoints.push({x: currentX, y: floorY});

    let currentY = floorY;
    
    for (let i = 1; i <= option.steps; i++) {
        // CORREÇÃO 2D: Se for patamar rente à laje, ele fica na altura da laje (ceilingY)
        const landing = safeLandings.find(l => l.step === i);
        const isThisFlush = landing && landing.isLastStep && landing.isFlushWithSlab;

        let visualY;
        if (isThisFlush) {
            visualY = ceilingY;
        } else {
            currentY -= option.stepHeight;
            visualY = currentY;
        }

        stepsPoints.push({x: currentX, y: visualY});
        if (i === 1) firstStepCoords = {x: currentX, y: visualY};
        
        const run = landing ? landing.length : drawTreadDepth;
        
        if (landing) {
            const rectX = isMirrored ? currentX - run : currentX;
            landingDraws.push(
                <g key={`landing-${i}`}>
                    <rect x={rectX} y={visualY} width={run} height={10} fill="#ffffff" stroke="#000000" strokeWidth="2" />
                    <text x={rectX + run/2} y={visualY - 15} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#000000">
                        {landing.isLastStep ? 'CHEGADA (TOPO)' : (landing.type === 'fixed' ? 'FIXO' : 'ARTICULADO')}
                    </text>
                </g>
            );
        }

        currentX += (run * directionMult);
        stepsPoints.push({x: currentX, y: visualY});
    }
    stepsPoints.push({x: currentX, y: floorY});
    
    const firstX = stepsPoints[0].x;
    const firstY = stepsPoints[0].y;
    const lastPointX = stepsPoints[stepsPoints.length - 2].x;
    const lastPointY = stepsPoints[stepsPoints.length - 2].y;

    let d = `M ${firstX} ${firstY}`;
    for (let i = 1; i < stepsPoints.length - 1; i++) {
        d += ` L ${stepsPoints[i].x} ${stepsPoints[i].y}`;
    }

    // Chapa de metal lisa por baixo (Viga central/lateral) - "Espessura" visual
    const thicknessY = 20; // Espessura vertical do corpo da escada
    
    // Conecta o último ponto até a altura da espessura
    d += ` L ${lastPointX} ${lastPointY + thicknessY}`;
    // Liga reto ao ponto inicial no chão, gerando a reta inferior contínua perfeitamente unindo ao 1º degrau
    d += ` L ${firstX} ${firstY}`;
    d += ` Z`;

    // Definição da posição da seta de Pé Direito
    const ceilingArrowX = isMirrored ? (margin - 20) : (margin + drawTotalLength + 20);
    const ceilingTextX = isMirrored ? (ceilingArrowX - 15) : (ceilingArrowX + 15);
    const textRot = isMirrored ? -90 : 90;

    // Definição da cota de Altura Total
    const heightArrowX = isMirrored ? (margin - 60) : (margin + drawTotalLength + 60);
    const heightTextX = isMirrored ? (heightArrowX - 15) : (heightArrowX + 15);

    // FUNÇÕES PARA DESENHAR AS LAJES DE FORMA LÓGICA
    
    // Laje Esquerda (Coordenadas Negativas até o buraco)
    // No modo Padrão: É a laje de risco (antes da escada).
    // No modo Espelhado: É a laje de chegada (Piso Superior).
    const renderLeftSlab = (isArrival: boolean) => (
        <g>
            <rect x={-2000} y={ceilingY} width={2000 + holeStartX} height={slabThickness} fill={(!isArrival && simulateSafe && correctionType === 'expand_opening') ? '#86efac' : '#f1f5f9'} stroke="none" />
            <line x1={-2000} y1={ceilingY} x2={holeStartX} y2={ceilingY} stroke="#333" strokeWidth="3" />
            <line x1={-2000} y1={slabBottomY} x2={holeStartX} y2={slabBottomY} stroke="#333" strokeWidth="3" />
            <line x1={holeStartX} y1={ceilingY} x2={holeStartX} y2={slabBottomY} stroke="#333" strokeWidth="3"/>
        </g>
    );

    // Laje Direita (Do fim do buraco até o infinito)
    // No modo Padrão: É a laje de chegada (Piso Superior).
    // No modo Espelhado: É a laje de risco (antes da escada).
    const renderRightSlab = (isArrival: boolean) => (
        <g>
            <rect x={holeEndX} y={ceilingY} width={3000} height={slabThickness} fill={(!isArrival && simulateSafe && correctionType === 'expand_opening') ? '#86efac' : '#f1f5f9'} stroke="none" />
            <line x1={holeEndX} y1={ceilingY} x2={holeEndX + 3000} y2={ceilingY} stroke="#333" strokeWidth="3" />
            <line x1={holeEndX} y1={slabBottomY} x2={holeEndX + 3000} y2={slabBottomY} stroke="#333" strokeWidth="3" />
            <line x1={holeEndX} y1={ceilingY} x2={holeEndX} y2={slabBottomY} stroke="#333" strokeWidth="3" />
        </g>
    );

    return (
        <g>
            {/* PAREDE DE FUNDO */}
            <rect 
                x={margin} 
                y={ceilingY} 
                width={Math.max(drawTotalLength, (referenceDoor?.isActive ? referenceDoor.distance + referenceDoor.width + 50 : 0))} 
                height={totalHeight || 300} 
                fill="#f1f5f9" 
                stroke="none" 
            />
            <text x={margin + 10} y={floorY - 20} fill="#cbd5e1" fontSize="40" fontWeight="bold" opacity="0.5">PAREDE</text>
            
            {/* Linhas de Chão e Teto */}
            <line x1={-1000} y1={floorY} x2={svgWidth + 1000} y2={floorY} stroke="#333" strokeWidth="4" />
            <line x1={-1000} y1={ceilingY} x2={svgWidth + 1000} y2={ceilingY} stroke="#94a3b8" strokeWidth="2" opacity="0.7" />
            <text x={margin + drawTotalLength + 50} y={ceilingY - 10} fill="#94a3b8" fontSize="14" fontStyle="italic">Nível Piso Superior</text>

            {/* LAJES - Lógica Condicional Baseada na Direção */}
            {isMirrored ? (
                <>
                    {/* Espelhado: Esquerda = Chegada (Sempre desenha). Direita = Risco (Só se tiver info de vão) */}
                    {renderLeftSlab(true)}
                    {hasSlabInfo && renderRightSlab(false)}
                </>
            ) : (
                <>
                    {/* Padrão: Esquerda = Risco (Só se tiver info de vão). Direita = Chegada (Sempre desenha) */}
                    {hasSlabInfo && renderLeftSlab(false)}
                    {renderRightSlab(true)}
                </>
            )}
            
            {/* Patamares (Preenchimento) */}
            {landingDraws}

            {/* Perfil da Escada (Linha Vetorial Simples) */}
            <path d={d} fill={simulateSafe && correctionType === 'shrink_stair' ? '#dcfce7' : '#ffffff'} stroke={simulateSafe && correctionType === 'shrink_stair' ? '#16a34a' : '#000000'} strokeWidth="3" strokeLinejoin="round" />
            
            {/* Indicador Último Degrau */}
            <g>
                <circle cx={isMirrored ? margin : drawStairEndX} cy={ceilingY + (isLastFlush ? 0 : option.stepHeight)} r="5" fill={isLastFlush ? "transparent" : "red"} />
                {isLastFlush ? (
                    <g>
                        <line x1={isMirrored ? margin : drawStairEndX} y1={ceilingY} x2={(isMirrored ? margin : drawStairEndX) + 40} y2={ceilingY - 30} stroke="#2563eb" strokeWidth="2"/>
                        <text x={(isMirrored ? margin : drawStairEndX) + 45} y={ceilingY - 35} fill="#2563eb" fontSize="14" fontWeight="bold">Patamar Rente à Laje</text>
                    </g>
                ) : (
                    <g>
                        <line x1={isMirrored ? margin : drawStairEndX} y1={ceilingY + option.stepHeight} x2={(isMirrored ? margin : drawStairEndX) + 40} y2={ceilingY + option.stepHeight + 30} stroke="#dc2626" strokeWidth="2"/>
                        <text x={(isMirrored ? margin : drawStairEndX) + 45} y={ceilingY + option.stepHeight + 35} fill="#dc2626" fontSize="14" fontWeight="bold">Último Degrau (Abaixo da Laje)</text>
                    </g>
                )}
            </g>

            {/* Cotas e Medidas */}
            <g>
                <line x1={heightArrowX} y1={floorY} x2={heightArrowX} y2={floorY - (totalHeight || 300)} stroke="#000" strokeWidth="3" markerEnd="url(#arrowGray)" markerStart="url(#arrowGray)" />
                <text x={heightTextX} y={floorY - (totalHeight || 300)/2} fill="#000" fontSize="20" fontWeight="bold" textAnchor="middle" transform={`rotate(${textRot}, ${heightTextX}, ${floorY - (totalHeight || 300)/2})`}>H: {((totalHeight || 300)/100).toFixed(2)}m</text>
            </g>

            {hasSlabInfo && (
                <g>
                    <line x1={ceilingArrowX} y1={floorY} x2={ceilingArrowX} y2={slabBottomY} stroke="#7e22ce" strokeWidth="3" markerEnd="url(#arrowPurple)" markerStart="url(#arrowPurple)" />
                    <text x={ceilingTextX} y={floorY - ceilingHeight/2} fill="#7e22ce" fontSize="18" fontWeight="bold" textAnchor="middle" transform={`rotate(${textRot}, ${ceilingTextX}, ${floorY - ceilingHeight/2})`}>Pé-Dir: {(ceilingHeight/100).toFixed(2)}m</text>
                </g>
            )}

            {hasSlabInfo && (
                <g>
                    <line x1={holeStartX} y1={ceilingY - 30} x2={holeEndX} y2={ceilingY - 30} stroke="#dc2626" strokeWidth="3" markerEnd="url(#arrowRed)" markerStart="url(#arrowRed)" />
                    <text x={(holeStartX + holeEndX)/2} y={ceilingY - 40} fill="#dc2626" fontSize="20" fontWeight="bold" textAnchor="middle">Vão: {(calculatedOpeningSize).toFixed(0)}cm</text>
                </g>
            )}
            
            {firstStepCoords.x > 0 && (
                <g>
                    <text x={firstStepCoords.x + (isMirrored ? -1 : 1)*(drawTreadDepth/2)} y={firstStepCoords.y - 10} fontSize="14" fill="#333" fontWeight="bold" textAnchor="middle">p={drawTreadDepth.toFixed(1)}</text>
                    <text x={firstStepCoords.x + (isMirrored ? 25 : -25)} y={firstStepCoords.y + (option.stepHeight/2)} fontSize="14" fill="#333" fontWeight="bold" textAnchor="middle">h={option.stepHeight.toFixed(1)}</text>
                </g>
            )}

            <g>
                <line x1={margin} y1={floorY + 80} x2={drawStairEndX} y2={floorY + 80} stroke="#333" strokeWidth="3" markerEnd="url(#arrowGray)" markerStart="url(#arrowGray)" />
                <text x={(margin + drawStairEndX)/2} y={floorY + 75} fill="#333" fontSize="20" fontWeight="bold" textAnchor="middle">Comp. Total: {(drawTotalLength/100).toFixed(2)}m</text>
                
                {topLanding ? (
                    <g>
                        {isMirrored ? (
                            <>
                                <line x1={margin} y1={floorY + 40} x2={margin + landingLength} y2={floorY + 40} stroke="#666" strokeWidth="2" markerEnd="url(#arrowGray)" markerStart="url(#arrowGray)" />
                                <line x1={margin + landingLength} y1={floorY + 20} x2={margin + landingLength} y2={floorY + 50} stroke="#666" strokeWidth="1" strokeDasharray="4"/>
                                <text x={margin + landingLength/2} y={floorY + 35} fill="#666" fontSize="16" fontStyle="italic" textAnchor="middle">Patamar: {(landingLength/100).toFixed(2)}m</text>

                                <line x1={margin + landingLength} y1={floorY + 40} x2={drawStairEndX} y2={floorY + 40} stroke="#666" strokeWidth="2" markerEnd="url(#arrowGray)" markerStart="url(#arrowGray)" />
                                <text x={margin + landingLength + stairRunLength/2} y={floorY + 35} fill="#666" fontSize="16" fontStyle="italic" textAnchor="middle">Escada: {(stairRunLength/100).toFixed(2)}m</text>
                            </>
                        ) : (
                            <>
                                <line x1={margin} y1={floorY + 40} x2={margin + stairRunLength} y2={floorY + 40} stroke="#666" strokeWidth="2" markerEnd="url(#arrowGray)" markerStart="url(#arrowGray)" />
                                <line x1={margin + stairRunLength} y1={floorY + 20} x2={margin + stairRunLength} y2={floorY + 50} stroke="#666" strokeWidth="1" strokeDasharray="4"/>
                                <text x={margin + stairRunLength/2} y={floorY + 35} fill="#666" fontSize="16" fontStyle="italic" textAnchor="middle">Escada: {(stairRunLength/100).toFixed(2)}m</text>

                                <line x1={margin + stairRunLength} y1={floorY + 40} x2={drawStairEndX} y2={floorY + 40} stroke="#666" strokeWidth="2" markerEnd="url(#arrowGray)" markerStart="url(#arrowGray)" />
                                <text x={margin + stairRunLength + landingLength/2} y={floorY + 35} fill="#666" fontSize="16" fontStyle="italic" textAnchor="middle">Patamar: {(landingLength/100).toFixed(2)}m</text>
                            </>
                        )}
                    </g>
                ) : null}

                <line x1={margin} y1={floorY + 20} x2={margin} y2={floorY + 90} stroke="#333" strokeWidth="1" strokeDasharray="4" />
                <line x1={drawStairEndX} y1={floorY + 20} x2={drawStairEndX} y2={floorY + 90} stroke="#333" strokeWidth="1" strokeDasharray="4" />
            </g>

            {hasSlabInfo && headroomLine && (
                <g>
                    <line x1={headroomLine.x} y1={headroomLine.y1} x2={headroomLine.x} y2={headroomLine.y2} stroke="#2563eb" strokeWidth="3" markerStart="url(#arrowBlue)" markerEnd="url(#arrowBlue)"/>
                    <text x={headroomLine.x + 10} y={headroomLine.y1 + (headroomLine.dist/2)} fill="#2563eb" fontSize="20" fontWeight="bold">{headroomLine.dist.toFixed(0)}cm</text>
                </g>
            )}

            {/* PORTA 2D - MOVIDO PARA O FINAL (OVERLAY) PARA GARANTIR VISIBILIDADE */}
            {referenceDoor && referenceDoor.isActive && (
                <g id="door-group-2d" style={{ pointerEvents: 'none' }}>
                    <rect 
                        x={refDoorX2D} 
                        y={refDoorY2D - referenceDoor.height} 
                        width={referenceDoor.width} 
                        height={referenceDoor.height} 
                        fill="rgba(30, 58, 138, 0.3)" 
                        stroke="#1e3a8a" 
                        strokeWidth="3" 
                        strokeDasharray="10,5"
                    />
                    <text x={refDoorX2D + referenceDoor.width/2} y={refDoorY2D - referenceDoor.height - 15} textAnchor="middle" fontSize="16" fill="#1e3a8a" fontWeight="900" stroke="white" strokeWidth="3" paintOrder="stroke">
                        PORTA ({referenceDoor.position === 'upper' ? 'Laje' : 'Térreo'})
                    </text>
                    <text x={refDoorX2D + referenceDoor.width/2} y={refDoorY2D - referenceDoor.height - 15} textAnchor="middle" fontSize="16" fill="#1e3a8a" fontWeight="900">
                        PORTA ({referenceDoor.position === 'upper' ? 'Laje' : 'Térreo'})
                    </text>
                    <text x={refDoorX2D + referenceDoor.width/2} y={refDoorY2D - referenceDoor.height/2} textAnchor="middle" fontSize="14" fill="#1e3a8a" fontWeight="bold">
                        {referenceDoor.width}x{referenceDoor.height}
                    </text>
                </g>
            )}
        </g>
    );
  };

  const render3DDimensions = () => {
    const lenZ = 40;
    const lenY = (totalHeight || 300) + 20;
    const pLenStart = projectPoint({ x: 0, y: lenY, z: lenZ });
    const pLenEnd = projectPoint({ x: drawTotalLength, y: lenY, z: lenZ });
    
    const pSplit = projectPoint({ x: stairRunLength, y: lenY, z: lenZ });

    const pHeightStart = projectPoint({ x: -30, y: totalHeight || 300, z: 0 });
    const pHeightEnd = projectPoint({ x: -30, y: 0, z: 0 });

    return (
        <g style={{ pointerEvents: 'none' }}>
            <line x1={pHeightStart.x} y1={pHeightStart.y} x2={pHeightEnd.x} y2={pHeightEnd.y} stroke="#7e22ce" strokeWidth="2" markerEnd="url(#arrowPurple)" markerStart="url(#arrowPurple)" />
            <text x={(pHeightStart.x + pHeightEnd.x)/2 - 15} y={(pHeightStart.y + pHeightEnd.y)/2} textAnchor="end" fontSize="16" fontWeight="bold" fill="#7e22ce" stroke="white" strokeWidth="3" paintOrder="stroke">H={((totalHeight || 300)/100).toFixed(2)}m</text>
            <text x={(pHeightStart.x + pHeightEnd.x)/2 - 15} y={(pHeightStart.y + pHeightEnd.y)/2} textAnchor="end" fontSize="16" fontWeight="bold" fill="#7e22ce">H={((totalHeight || 300)/100).toFixed(2)}m</text>

            <line x1={pLenStart.x} y1={pLenStart.y} x2={pLenEnd.x} y2={pLenEnd.y} stroke="#333" strokeWidth="2" markerEnd="url(#arrowGray)" markerStart="url(#arrowGray)" />
            <text x={(pLenStart.x + pLenEnd.x)/2} y={pLenStart.y + 20} textAnchor="middle" fontSize="16" fontWeight="bold" fill="#333" stroke="white" strokeWidth="3" paintOrder="stroke">Total: {(drawTotalLength/100).toFixed(2)}m</text>
            <text x={(pLenStart.x + pLenEnd.x)/2} y={pLenStart.y + 20} textAnchor="middle" fontSize="16" fontWeight="bold" fill="#333">Total: {(drawTotalLength/100).toFixed(2)}m</text>

            {topLanding && (
                <g>
                    <line x1={pLenStart.x} y1={pLenStart.y - 30} x2={pSplit.x} y2={pSplit.y - 30} stroke="#666" strokeWidth="2" markerEnd="url(#arrowGray)" markerStart="url(#arrowGray)" />
                    <text x={(pLenStart.x + pSplit.x)/2} y={pLenStart.y - 40} textAnchor="middle" fontSize="14" fill="#666" stroke="white" strokeWidth="3" paintOrder="stroke">Escada: {(stairRunLength/100).toFixed(2)}m</text>
                    <text x={(pLenStart.x + pSplit.x)/2} y={pLenStart.y - 40} textAnchor="middle" fontSize="14" fill="#666">Escada: {(stairRunLength/100).toFixed(2)}m</text>

                    <line x1={pSplit.x} y1={pSplit.y - 30} x2={pLenEnd.x} y2={pLenEnd.y - 30} stroke="#666" strokeWidth="2" markerEnd="url(#arrowGray)" markerStart="url(#arrowGray)" />
                    <text x={(pSplit.x + pLenEnd.x)/2} y={pSplit.y - 40} textAnchor="middle" fontSize="14" fill="#666" stroke="white" strokeWidth="3" paintOrder="stroke">Patamar: {(landingLength/100).toFixed(2)}m</text>
                    <text x={(pSplit.x + pLenEnd.x)/2} y={pSplit.y - 40} textAnchor="middle" fontSize="14" fill="#666">Patamar: {(landingLength/100).toFixed(2)}m</text>
                </g>
            )}
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
                      <g key={`${face.id}-${i}`}>
                        <path
                            d={path}
                            fill={face.fill}
                            stroke={face.stroke}
                            strokeWidth={face.strokeWidth || 1}
                            fillOpacity={face.opacity || 1}
                            strokeDasharray={face.strokeDashArray}
                        />
                        {/* Se a face tiver texto configurado, desenha no centro */}
                        {face.text && (
                            <text 
                                x={(projected[0].x + projected[2].x)/2} 
                                y={(projected[0].y + projected[2].y)/2}
                                fill="#15803d"
                                fontSize="14"
                                fontWeight="900"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                style={{ pointerEvents: 'none' }}
                            >
                                {face.text}
                            </text>
                        )}
                      </g>
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
          setRotation({ x: -20, y: stairDirection === 'mirrored' ? -45 : 45 });
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

  // --- COMPONENTE SVG COMUM ---
  const SVGContent = () => (
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
            {renderSideView()}
        </g>
    </svg>
  );

  // Se for o modo de impressão ESTÁTICO (Batch export antigo, sem Wizard UI)
  if (printMode && !hideUI) {
      return (
        <div ref={internalCanvasRef} className="bg-white p-4 inline-block">
             <div className="text-center font-bold text-xl mb-4 text-black">Opção {option.optionNumber}</div>
             <div style={{ width: 800, height: 600 }}>
                {viewMode === 'side' ? <SVGContent /> : <Interactive3DStair option={option} totalHeight={totalHeight} inputData={inputData} treadMaterial={treadMaterial} />}
             </div>
        </div>
      );
  }

  // Se for o modo WIZARD (Interativo e Limpo)
  if (printMode && hideUI) {
     return (
        <div ref={captureRef} 
             className="w-full h-full bg-white relative overflow-hidden cursor-move"
             onMouseDown={viewMode === 'side' ? startDrag : undefined} 
             onMouseMove={viewMode === 'side' ? doDrag : undefined} 
             onMouseUp={viewMode === 'side' ? stopDrag : undefined} 
             onMouseLeave={viewMode === 'side' ? stopDrag : undefined} 
             onWheel={viewMode === 'side' ? handleWheel : undefined}
        >
            {viewMode === 'side' ? <SVGContent /> : <Interactive3DStair option={option} totalHeight={totalHeight} inputData={inputData} treadMaterial={treadMaterial} />}
        </div>
     );
  }

  // --- NOVA INTERFACE FLUTUANTE (CARD BRANCO SOBREPOSTO AO CANVAS) ---
  return (
    <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50 overflow-hidden">
      <div className="w-full h-full flex flex-col relative bg-white">
        
        {/* TOP BAR */}
        <div className="absolute top-4 left-4 z-10 flex gap-2 bg-white/90 p-2 rounded shadow-lg backdrop-blur-sm border border-gray-200 items-center">
             <button onClick={() => setViewMode('side')} title="Visualizar o projeto estrutural da escada em vista lateral plana (2D)" className={`px-4 py-2 rounded font-black text-lg ${viewMode === 'side' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>Lateral 2D</button>
             <button onClick={() => { setViewMode('3d'); setPan({x:0, y:0}); setZoom(1.1); }} title="Explorar o ambiente 3D interativo da escada" className={`px-4 py-2 rounded font-black text-lg ${viewMode === '3d' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>Visualizar 3D 🔄</button>
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

        {/* CANVAS - OCUPA TELA TODA AGORA */}
        <div ref={internalCanvasRef} 
             className={`absolute inset-0 w-full h-full ${viewMode === 'side' ? 'cursor-move' : ''} overflow-hidden ${isExporting ? 'bg-white' : 'bg-blueprint-grid'}`} 
             onMouseDown={viewMode === 'side' ? startDrag : undefined} 
             onMouseMove={viewMode === 'side' ? doDrag : undefined} 
             onMouseUp={viewMode === 'side' ? stopDrag : undefined} 
             onMouseLeave={viewMode === 'side' ? stopDrag : undefined} 
             onContextMenu={(e) => viewMode === 'side' ? e.preventDefault() : undefined}
             onWheel={viewMode === 'side' ? handleWheel : undefined}>
            {viewMode === 'side' ? <SVGContent /> : <Interactive3DStair option={option} totalHeight={totalHeight} inputData={inputData} treadMaterial={treadMaterial} />}
        </div>

        {/* --- CONTROLES FLUTUANTES (MODIFICADO PARA SER CARD SOBREPOSTO) --- */}
        {!isExporting && (
            <div className={`absolute bottom-4 left-4 right-4 md:right-auto md:left-1/2 md:-translate-x-1/2 md:w-[600px] bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl z-20 border transition-all duration-300 overflow-hidden flex flex-col ${simulatedValues.safe ? 'border-green-400' : 'border-red-400'}`}>
                
                {/* HEADER (Sempre visível - Funciona como Toggle) */}
                <div 
                    onClick={() => setIsAlertMinimized(!isAlertMinimized)}
                    className={`p-3 flex justify-between items-center cursor-pointer transition-colors ${simulatedValues.safe ? 'bg-green-100 hover:bg-green-200 text-green-900' : 'bg-red-100 hover:bg-red-200 text-red-900'}`}
                >
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{simulatedValues.safe ? '✅' : '🚨'}</span>
                        <div className="flex flex-col">
                            <span className="font-black uppercase text-sm tracking-wide">
                                {simulateSafe ? (simulatedValues.safe ? 'MODO CORREÇÃO (AJUSTADO)' : 'FALHA NA CORREÇÃO') : (simulatedValues.safe ? 'APROVADO - SEM CABEÇADA' : 'REPROVADO - CABEÇADA')}
                            </span>
                            {hasSlabInfo && (
                                <span className="text-xs font-bold opacity-80">
                                    Altura Livre: {simulatedValues.clearance.toFixed(0)}cm {simulatedValues.clearance < 200 ? '(Baixo)' : '(OK)'}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="text-xs font-bold bg-white/50 px-2 py-1 rounded">
                        {isAlertMinimized ? 'Expandir ▲' : 'Minimizar ▼'}
                    </div>
                </div>

                {/* BODY (Conteúdo Expansível) */}
                {!isAlertMinimized && (
                    <div className="p-4 bg-white text-gray-800 text-sm border-t border-gray-200">
                        {hasSlabInfo ? (
                            <div className="space-y-4">
                                {!simulatedValues.safe && !simulateSafe && (
                                    <div className="bg-red-50 text-red-800 p-2 rounded text-xs border border-red-100 font-medium">
                                        <strong>Atenção:</strong> O usuário vai bater a cabeça na laje ao subir. É necessário ajustar o projeto.
                                    </div>
                                )}

                                <div className="flex flex-col gap-2">
                                    <label className="flex items-center gap-2 cursor-pointer bg-gray-50 p-2 rounded hover:bg-gray-100 border border-gray-200 transition">
                                        <input type="checkbox" checked={simulateSafe} onChange={e => setSimulateSafe(e.target.checked)} className="w-5 h-5 accent-blue-600 cursor-pointer" />
                                        <span className="font-bold text-blue-900 uppercase text-xs">Ativar Ferramenta de Correção</span>
                                    </label>
                                    
                                    {simulateSafe && (
                                        <div className="space-y-3 animate-fade-in pl-2 border-l-4 border-blue-100 ml-1">
                                            <div className="flex bg-gray-100 p-1 rounded">
                                                <button onClick={() => setCorrectionType('expand_opening')} className={`flex-1 py-1.5 px-2 rounded text-[10px] font-bold transition ${correctionType === 'expand_opening' ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>1. Aumentar Buraco</button>
                                                <button onClick={() => setCorrectionType('shrink_stair')} className={`flex-1 py-1.5 px-2 rounded text-[10px] font-bold transition ${correctionType === 'shrink_stair' ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>2. Encurtar Escada</button>
                                            </div>

                                            {correctionType === 'expand_opening' ? (
                                                <div className="text-xs text-blue-800 bg-blue-50 p-2 rounded">
                                                    <p className="font-bold mb-1">Solução 1: Quebrar mais a laje.</p>
                                                    <p>Novo Vão Necessário: <strong className="text-lg">{(calculationData.corrections.safeSlabX - margin).toFixed(0)}cm</strong></p>
                                                    <p className="opacity-70 mt-1">(Original: {slabOpening}cm)</p>
                                                </div>
                                            ) : (
                                                <div className="text-xs bg-orange-50 p-2 rounded border border-orange-100">
                                                    <p className="font-bold text-orange-900 mb-2">Solução 2: Diminuir o pisante da escada.</p>
                                                    
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span>Pisante Original: <strong>{option.treadDepth}cm</strong></span>
                                                        <span>➝</span>
                                                        <span className="text-blue-700">Novo: <strong className="text-lg">{simulatedValues.tread.toFixed(1)}cm</strong></span>
                                                    </div>
                                                    
                                                    {simulatedValues.tread < 18 && (
                                                        <div className="text-red-600 font-bold mb-2 flex items-center gap-1 bg-red-100 p-1 rounded border border-red-200">
                                                            ⚠️ Pisante muito curto (&lt;18cm)! Ficará íngreme.
                                                        </div>
                                                    )}
                                                    {simulatedValues.tread < 6 && (
                                                        <div className="text-red-600 font-bold mb-2 flex items-center gap-1 bg-red-100 p-1 rounded border border-red-200">
                                                            ⚠️ Pisante menor que 6cm! Geometria Extrema.
                                                        </div>
                                                    )}

                                                    {simulatedValues.safe ? (
                                                        <button onClick={handleApply} className="w-full bg-green-600 text-white font-bold py-2 rounded shadow hover:bg-green-700 transition flex items-center justify-center gap-2">
                                                            <span>💾</span> Aplicar no Orçamento
                                                        </button>
                                                    ) : (
                                                        <div className="text-red-600 font-bold text-center p-2 bg-red-100 rounded">Impossível corrigir (Geometria Extrema)</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="pt-2 border-t border-gray-100 flex items-center gap-2 justify-end">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase whitespace-nowrap">Altura Livre Desejada:</label>
                                    <input 
                                        type="number" 
                                        value={headroomInput} 
                                        onChange={e => setHeadroomInput(parseInt(e.target.value) || 0)} 
                                        className="w-12 bg-gray-100 text-center text-xs font-bold rounded border border-gray-300 focus:outline-none focus:border-blue-500 p-1"
                                    />
                                    <button onClick={() => setTargetHeadroom(headroomInput)} className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold hover:bg-blue-200">Definir</button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-2 text-gray-500 italic">
                                Sem laje superior configurada (Vão Livre).
                            </div>
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
