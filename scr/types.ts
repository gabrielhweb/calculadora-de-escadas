
export interface CalculatorInput {
  totalHeight: number; // in cm
  desiredSteps: number;
  stairWidth: number; // in cm
  treadDepth: number; // in cm
}

export interface ProposalOption {
  optionNumber: number;
  steps: number;
  stepHeight: number; // in cm
  totalLength: number; // in cm
  totalPrice: number;
  stairWidth: number; // in cm
  treadDepth: number; // in cm
}

export interface UserData {
  name: string;
  cpf: string;
  address: string;
}
