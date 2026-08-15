
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
  frenchBrackets?: 0 | 1 | 2; // Quantidade de Mãos Francesas
  isAngled?: boolean; // Patamar em ângulo
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
  treadMaterial?: 'metal' | 'wood' | 'chapa_xadrez' | 'chapa_vazada'; // NOVO: Material do pisante
  woodType?: 'garapeira' | 'muiracatiara' | 'ambas'; // Tipo de madeira selecionada
  dampers: number; // Quantidade de amortecedores
  hasWheels?: boolean; // Opção com Rodinhas
  isFixedStair?: boolean; // Opção de Escada Fixa
  handrailSide?: 'left' | 'right' | 'both'; // Lado do corrimão (apenas se hasWheels=true)
  customStepPrice?: number; // Optional manual price per step
  customTotalLength?: number; // Optional manual total length
  customTotalLengthOption?: 'all' | '1' | '2' | '3' | '1_2' | '1_3' | '2_3'; // Which option to apply the length limiter to
  optionalItems: OptionalItem[]; // Lista de itens extras
  landings: LandingInfo[]; // Agora é uma lista de patamares
  
  // Novos campos de ambiente
  slabThickness?: number; // Espessura da laje (cm)
  slabOpening?: number; // Tamanho do vão livre (cm)
  
  hasCorrimao?: boolean;
  handrailHeight?: number;
  supportThickness?: number;
  handrailThickness?: number;
  // Visualização Avançada e Geometria
  stairDirection?: 'standard' | 'mirrored'; // standard = sobe p/ direita, mirrored = sobe p/ esquerda
  wallFixation?: 'left' | 'right' | 'frontal'; // NOVO: Lado da fixação na parede
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
  
  // Parcelamento
  installments?: number;
  interestValue?: number; // Juros em R$ fixo
  hideInterestLabel?: boolean; // Ocultar palavra "com juros" nos PDFs
  
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
  paymentStatus?: 'a_receber' | 'recebido';
  deliveryStatus?: 'em_producao' | 'a_entregar';
  deliveryDate?: string;
  deliveryNotes?: string;
  hingesQty?: string;
  measurementsNotes?: string;
}

export type BoardStage = 'orcamento' | 'contrato' | 'corte' | 'soldagem' | 'pronta' | 'concluido';

export interface CostSettings {
  steelCostPerStep: number;
  woodCostPerStep: number;
  taxPercentage: number;
  commissionPercentage: number;
}

export interface CustomCost {
  id: string;
  name: string;
  value: number;
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
  boardStage?: BoardStage; // NOVO: Para o Kanban
  location?: string; // NOVO: Cidade/Bairro do cliente
  profit?: number; // NOVO: Lucro estimado
  totalCost?: number; // NOVO: Custo total de produção
  customCosts?: CustomCost[]; // NOVO: Custos extras manuais (instalador, dobradiças, etc)
  downPaymentStatus?: 'pending' | 'paid';
  balanceStatus?: 'pending' | 'paid';
  paymentMethod?: 'pix' | 'card' | 'hybrid';
  pixTiming?: 'entry' | 'delivery';
  installments?: number;
  paidInstallments?: number;
  isLateManual?: boolean;
  customPaidValue?: number; // NOVO: Valor pago digitado manualmente no dashboard
}

export interface ProjectFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size?: number;
  uploadedAt: string;
}

export interface Carrier {
  id: string;
  name: string;
  contact: string;
  baseLocation: string;
  statesServed: string[];
}

export interface StatePrice {
  id: string; // The UF, like 'SP', 'RJ'
  price: number;
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
    deliveryDays?: number;
    status?: QuoteStatus;
    attachments?: ProjectFile[];
}
