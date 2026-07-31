import { generateProductionPDF } from './src/utils/productionPdfGenerator.ts';

generateProductionPDF({
  totalSteps: 12,
  stepHeightCm: 23.1,
  treadDepthCm: 17.1,
  widthCm: 60,
  cutStepType: 'right',
  clientName: 'ANDRÉIA',
});
