import jsPDF from 'jspdf';
import { cleanImg1, cleanImg2, cleanImg3 } from './src/utils/cleanImages';

const doc = new jsPDF('p', 'mm', 'a4');

doc.setFontSize(16);
doc.text('IMAGEM 1 (cleanImg1)', 10, 20);
doc.addImage(cleanImg1, 'JPEG', 10, 25, 180, 70);

doc.text('IMAGEM 2 (cleanImg2)', 10, 105);
doc.addImage(cleanImg2, 'JPEG', 10, 110, 180, 70);

doc.text('IMAGEM 3 (cleanImg3)', 10, 190);
doc.addImage(cleanImg3, 'JPEG', 10, 195, 180, 70);

doc.save('MAPA_DE_IMAGENS.pdf');
