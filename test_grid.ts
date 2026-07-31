import { generateProductionPDF } from './src/utils/productionPdfGenerator';
import jsPDF from 'jspdf';
import { normalImageBase64 } from './src/utils/pdfImages';

const doc = new jsPDF('l', 'mm', 'a4');

const imgX = 5;
const imgY = 40;
const imgW = 285;
const imgH = 150;

doc.addImage(normalImageBase64, 'JPEG', imgX, imgY, imgW, imgH);

doc.setDrawColor(255, 0, 0);
doc.setLineWidth(0.1);
doc.setFontSize(8);
doc.setTextColor(255, 0, 0);

for(let x=0; x<=300; x+=10) {
    doc.line(x, 0, x, 210);
    doc.text(x.toString(), x, 10);
}
for(let y=0; y<=210; y+=10) {
    doc.line(0, y, 300, y);
    doc.text(y.toString(), 2, y);
}

doc.save('test_grid.pdf');
