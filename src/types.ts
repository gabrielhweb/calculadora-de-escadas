
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
  isFlushWithSlab?: boolean; // Rente à laje
  direction?: 'straight' | 'left' | 'right'; // Direção da curva
  hasSideGuardrail?: boolean; // Barra Lateral
  hasFrontGuardrail?: boolean; // Barra Frontal
}

export interface LogisticsInfo {
  originCep: string;
  destinationCep: string;
  distance: number;
  tolls: number;
  fuelPrice: number;
  consumption: number;
  totalFreightCost: number;
  freightMode?: 'auto' | 'manual' | 'fixed' | 'transportadora';
}

export interface ReferenceDoor {
  isActive: boolean;
  width: number;
  height: number;
  distance: number; // Distância do início da escada
  position: 'ground' | 'upper'; // NOVO: Define se é no térreo ou laje
}

export interface CalculatorInput {
  totalHeight: number; // in cm
  desiredSteps: number;
  stairWidth: number; // in cm
  treadDepth: number; // in cm
  treadMaterial?: 'metal' | 'wood'; // NOVO: Material do pisante
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
  
  // Visualização Avançada e Geometria
  stairDirection?: 'standard' | 'mirrored'; // standard = sobe p/ direita, mirrored = sobe p/ esquerda
  wallFixation?: 'left' | 'right'; // NOVO: Lado da fixação na parede
  stairGeometry?: string; // NOVO: Reta parede esq, Reta parede dir, L, U, etc.
  referenceDoor?: ReferenceDoor;

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
  
  // Array de strings Base64 das imagens capturadas (Desenhos 2D/3D)
  drawingImages?: { title: string; imgData: string; width?: number; height?: number }[];
}

export type QuoteStatus = 'draft' | 'negotiation' | 'production' | 'installed' | 'archived';

export type ContractStatus = 'falta_assinar' | 'producao' | 'entregue';

export interface SavedContract {
  id: string;
  createdAt: string;
  clientName: string;
  totalValue: number;
  status: ContractStatus;
  contractData: any; // O payload completo do contrato para poder gerar o PDF novamente se precisar
  userId?: string; // ID do usuário do Firebase
}

export interface ProductionOrder {
  id: string;
  contractId?: string;
  createdAt: string;
  clientName: string;
  deliveryDate: string;
  downPayment: number;
  balanceDue: number;
  status: 'in_queue' | 'completed';
  downPaymentStatus?: 'pending' | 'paid';
  balanceStatus?: 'pending' | 'paid';
  paymentMethod?: 'pix' | 'card' | 'hybrid';
  pixTiming?: 'entry' | 'delivery';
  installments?: number;
  paidInstallments?: number;
}

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
  username: string;
  role: 'admin' | 'seller' | 'worker';
  permissions?: string[];
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
    status?: QuoteStatus;
    attachments?: ProjectFile[];
}
