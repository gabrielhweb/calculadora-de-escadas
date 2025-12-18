
export interface OptionalItem {
  id: string;
  name: string;
  price: number;
}

export interface LandingInfo {
  active: boolean;
  step: number;
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
  landing?: LandingInfo;
}

export interface ProposalOption {
  optionNumber: number;
  steps: number;
  stepHeight: number; // in cm
  totalLength: number; // in cm
  totalPrice: number;
  stairWidth: number; // in cm
  treadDepth: number; // in cm
  landing?: LandingInfo;
}

export interface UserData {
  name: string;
  cpf: string;
  address: string;
}
