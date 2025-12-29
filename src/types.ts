
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
  isLastStep?: boolean; // Indica se deve ser posicionado sempre no último degrau da opção
  direction?: 'straight' | 'left' | 'right'; // Direção da curva
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
}

// --- TIPOS NOVOS PARA O SISTEMA DE GESTÃO ---

export type QuoteStatus = 'draft' | 'negotiation' | 'production' | 'installed' | 'archived';

export interface ProjectFile {
    id: string;
    name: string;
    url: string;
    type: 'image' | 'video' | 'document' | 'youtube';
    uploadedAt: string;
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
    
    // Novos campos para gestão (CRM)
    status: QuoteStatus;
    attachments: ProjectFile[];
    notes?: string; // Diário de obra ou observações internas
    deliveryDate?: string; // Previsão de entrega
}

// --- GESTÃO DE USUÁRIOS E PERMISSÕES ---
export interface LocalUser {
    id: string;
    username: string;
    role: 'admin' | 'worker';
    permissions: string[]; // Lista de rotas permitidas ex: ['/calculadora', '/dashboard']
}
