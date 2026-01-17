
export interface OptionalItem {
  id: string;
  name: string;
  price: number;
}

export interface LandingInfo {
  id: string;
  step: number; // Em qual degrau ele fica
  length: number; // cm
  width: number; // cm
  price: number;
  type?: 'fixed' | 'articulated'; // NOVO: Tipo de fixação
  isLastStep?: boolean; // Indica se deve ser posicionado sempre no último degrau da opção
<<<<<<< HEAD
  isFlushWithSlab?: boolean; // NOVO: Rente à laje
  direction?: 'straight' | 'left' | 'right'; // Direção da curva
  hasSideGuardrail?: boolean; // NOVO: Barra Lateral
  hasFrontGuardrail?: boolean; // NOVO: Barra Frontal
=======
  isFlushWithSlab?: boolean; // Rente à laje
  direction?: 'straight' | 'left' | 'right'; // Direção da curva
  hasSideGuardrail?: boolean; // Barra Lateral
  hasFrontGuardrail?: boolean; // Barra Frontal
>>>>>>> 3e818bea7652efae6cbb2621b8e59f6f2a3be64b
}

export interface LogisticsInfo {
  originCep: string;
  destinationCep: string;
  distance: number;
  tolls: number;
  fuelPrice: number;
  consumption: number;
  totalFreightCost: number;
}

export interface CalculatorInput {
  totalHeight: number; // in cm
  desiredSteps: number;
  stairWidth: number; // in cm
  treadDepth: number; // in cm
  dampers: number; // Quantidade de amortecedores
  hasWheels?: boolean; // Opção com Rodinhas
  handrailSide?: 'left' | 'right' | 'both'; // Lado do corrimão (apenas se hasWheels=true)
  customStepPrice?: number; // Optional manual price per step
  customTotalLength?: number; // Optional manual total length
  optionalItems: OptionalItem[]; // Lista de itens extras
  landings: LandingInfo[]; // Agora é uma lista de patamares
  
  // Novos campos de ambiente
  slabThickness?: number; // Espessura da laje (cm)
  slabOpening?: number; // Tamanho do vão livre (cm)
  
  // Logística Pré-calculada
  logistics?: LogisticsInfo;
}

export interface ProposalOption {
  optionNumber: number;
  steps: number; // Número TOTAL de subidas (degraus comuns + patamares)
  structureSteps: number; // Apenas degraus comuns (steps - qtdPatamares)
  stepHeight: number; // in cm
  totalLength: number; // in cm
  totalPrice: number;
  stairWidth: number; // in cm
  treadDepth: number; // in cm
  landings: LandingInfo[];
  isModified?: boolean; // Flag para indicar se foi alterada manualmente
}

export interface UserData {
  name: string;
  cpf: string; // Pode ser CPF ou CNPJ dependendo do contexto
  rg?: string;
  address: string; // String formatada completa para o PDF
  // Campos estruturados
  zip?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  
<<<<<<< HEAD
  // NOVO: Array de strings Base64 das imagens capturadas (Desenhos 2D/3D)
  // Atualizado para incluir dimensões para manter aspect ratio
=======
  // Array de strings Base64 das imagens capturadas (Desenhos 2D/3D)
>>>>>>> 3e818bea7652efae6cbb2621b8e59f6f2a3be64b
  drawingImages?: { title: string; imgData: string; width?: number; height?: number }[];
}

// --- TIPOS ADICIONADOS PARA CORRIGIR O BUILD ---

export type QuoteStatus = 'draft' | 'negotiation' | 'production' | 'installed' | 'archived';

export interface ProjectFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size?: number;
  uploadedAt: string;
}

export interface LocalUser {
  id: string;
  username: string; // Adicionado para corrigir erro no Dashboard
  role: 'admin' | 'seller' | 'worker'; // Adicionado 'worker'
  permissions?: string[]; // Adicionado para controle de acesso
  
  // Tornados opcionais para evitar erro no Dashboard onde não são passados
  email?: string;
  name?: string;
}

export interface SavedQuote {
    id: string;
    createdAt: string;
    clientName: string;
    inputData: CalculatorInput;
    userData?: UserData;
    freightCost: number;
    tollCost: number;
    installationCost: number;
    isInstallationIncluded: boolean;
    
    // Novos campos opcionais para compatibilidade
    status?: QuoteStatus;
    attachments?: ProjectFile[];
}
