
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
}

export interface UserData {
  name: string;
  cpf: string;
  address: string;
}
