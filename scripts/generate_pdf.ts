import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

const CHAPTERS = [
  { n: 1,  t: "El significado de los milagros", p: 4 },
  { n: 2,  t: "La separación y la Expiación", p: 10 },
  { n: 3,  t: "La percepción inocente", p: 18 },
  { n: 4,  t: "Las ilusiones del ego", p: 25 },
  { n: 5,  t: "Curación y plenitud", p: 34 },
  { n: 6,  t: "Las lecciones del amor", p: 42 },
  { n: 7,  t: "Los regalos del Reino", p: 52 },
  { n: 8,  t: "El viaje de retorno", p: 63 },
  { n: 9,  t: "La aceptación de la Expiación", p: 73 },
  { n: 10, t: "Los ídolos de la enfermedad", p: 82 },
  { n: 11, t: "Dios o el ego", p: 88 },
  { n: 12, t: "El programa de estudios del Espíritu Santo", p: 97 },
  { n: 13, t: "El mundo inocente", p: 106 },
  { n: 14, t: "Las enseñanzas en favor de la verdad", p: 121 },
  { n: 15, t: "El instante santo", p: 135 },
  { n: 16, t: "El perdón de las ilusiones", p: 148 },
  { n: 17, t: "El perdón y la relación santa", p: 157 },
  { n: 18, t: "El final del sueño", p: 167 },
  { n: 19, t: "La consecución de la paz", p: 178 },
  { n: 20, t: "La visión de la santidad", p: 191 },
  { n: 21, t: "Razón y percepción", p: 200 },
  { n: 22, t: "La salvación y la relación santa", p: 209 },
  { n: 23, t: "La guerra contra ti mismo", p: 217 },
  { n: 24, t: "El deseo de ser especial", p: 223 },
  { n: 25, t: "La justicia de Dios", p: 231 },
  { n: 26, t: "La transición", p: 241 },
  { n: 27, t: "La curación del sueño", p: 252 },
  { n: 28, t: "El deshacimiento del miedo", p: 262 },
  { n: 29, t: "El despertar", p: 270 },
  { n: 30, t: "El nuevo comienzo", p: 278 },
  { n: 31, t: "La visión final", p: 287 },
];

async function generateBookPDF() {
  console.log("Iniciando generación de UCDM_Texto.pdf (297 páginas)...");
  const pdfDoc = await PDFDocument.create();
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const timesItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Chapter lookup by page
  const chapterStartMap = new Map<number, { n: number; t: string }>();
  CHAPTERS.forEach((c) => chapterStartMap.set(c.p, { n: c.n, t: c.t }));

  function getCurrentChapterForPage(page: number) {
    if (page < 4) return null;
    let curr = CHAPTERS[0];
    for (const c of CHAPTERS) {
      if (page >= c.p) curr = c;
      else break;
    }
    return curr;
  }

  // Generate 297 pages
  for (let pageNum = 1; pageNum <= 297; pageNum++) {
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 format in points (approx 210 x 297 mm)
    const { width, height } = page.getSize();

    if (pageNum === 1) {
      // Cover page
      page.drawRectangle({
        x: 40,
        y: 40,
        width: width - 80,
        height: height - 80,
        borderColor: rgb(0.15, 0.15, 0.15),
        borderWidth: 1.5,
      });

      const title = "UN CURSO DE MILAGROS";
      const titleWidth = timesBold.widthOfTextAtSize(title, 26);
      page.drawText(title, {
        x: (width - titleWidth) / 2,
        y: height - 200,
        size: 26,
        font: timesBold,
        color: rgb(0.1, 0.1, 0.1),
      });

      const sub = "1. TEXTO";
      const subWidth = timesRoman.widthOfTextAtSize(sub, 14);
      page.drawText(sub, {
        x: (width - subWidth) / 2,
        y: height - 320,
        size: 14,
        font: timesRoman,
        color: rgb(0.2, 0.2, 0.2),
      });

      const foundation = "Fundación para la Paz Interior";
      const fWidth = timesBold.widthOfTextAtSize(foundation, 18);
      page.drawText(foundation, {
        x: (width - fWidth) / 2,
        y: height - 420,
        size: 18,
        font: timesBold,
        color: rgb(0.15, 0.15, 0.15),
      });

      const trans = "Traducido por Rosa M. G. De Wynn y Fernando Gómez";
      const tWidth = timesItalic.widthOfTextAtSize(trans, 11);
      page.drawText(trans, {
        x: (width - tWidth) / 2,
        y: height - 480,
        size: 11,
        font: timesItalic,
        color: rgb(0.3, 0.3, 0.3),
      });
      continue;
    }

    if (pageNum === 2 || pageNum === 3) {
      // Indice general de contenido
      const topTitle = "UN CURSO DE MILAGROS - ÍNDICE DE CAPÍTULOS";
      page.drawText(topTitle, {
        x: 50,
        y: height - 60,
        size: 14,
        font: timesBold,
        color: rgb(0.15, 0.15, 0.15),
      });

      const chList = pageNum === 2 ? CHAPTERS.slice(0, 16) : CHAPTERS.slice(16);
      let y = height - 100;

      for (const ch of chList) {
        const line = `Capítulo ${ch.n}: ${ch.t}`;
        const pStr = `Pág. ${ch.p}`;
        page.drawText(line, {
          x: 50,
          y,
          size: 11,
          font: timesBold,
          color: rgb(0.2, 0.2, 0.2),
        });
        page.drawText(pStr, {
          x: width - 100,
          y,
          size: 11,
          font: timesRoman,
          color: rgb(0.3, 0.3, 0.3),
        });
        y -= 40;
      }

      // Page number
      page.drawText(`${pageNum}`, {
        x: width / 2 - 5,
        y: 40,
        size: 10,
        font: timesRoman,
        color: rgb(0.4, 0.4, 0.4),
      });
      continue;
    }

    // Standard reading pages (4 to 297)
    const currentChapter = getCurrentChapterForPage(pageNum);
    const isChapterStart = chapterStartMap.has(pageNum);

    // Running Header
    if (!isChapterStart) {
      const headerText = currentChapter ? `Capítulo ${currentChapter.n}: ${currentChapter.t}` : "UN CURSO DE MILAGROS";
      const hWidth = timesItalic.widthOfTextAtSize(headerText, 9);
      page.drawText(headerText, {
        x: (width - hWidth) / 2,
        y: height - 45,
        size: 9,
        font: timesItalic,
        color: rgb(0.4, 0.4, 0.4),
      });

      page.drawLine({
        start: { x: 50, y: height - 52 },
        end: { x: width - 50, y: height - 52 },
        thickness: 0.5,
        color: rgb(0.75, 0.75, 0.75),
      });
    }

    // Page Number Footer
    const pNumStr = `${pageNum}`;
    const pWidth = timesRoman.widthOfTextAtSize(pNumStr, 10);
    page.drawText(pNumStr, {
      x: (width - pWidth) / 2,
      y: 45,
      size: 10,
      font: timesRoman,
      color: rgb(0.4, 0.4, 0.4),
    });

    let currentY = height - 80;

    if (pageNum === 4) {
      // Introduction and Chapter 1
      page.drawText("INTRODUCCIÓN", {
        x: 50,
        y: currentY,
        size: 14,
        font: timesBold,
        color: rgb(0.1, 0.1, 0.1),
      });
      currentY -= 25;

      const introText = [
        "1. Éste es un curso de milagros. Es un curso obligatorio. Sólo el momento en que decides",
        "tomarlo es voluntario. Tener libre albedrío no quiere decir que tú mismo puedas establecer",
        "el plan de estudios. Significa únicamente que puedes elegir lo que quieres aprender en",
        "cualquier momento dado. Este curso no pretende enseñar el significado del amor, pues eso",
        "está más allá de lo que se puede enseñar. Pretende, no obstante, despejar los obstáculos",
        "que impiden experimentar la presencia del amor, el cual es tu herencia natural.",
        "Lo opuesto al amor es el miedo, pero aquello que todo lo abarca no puede tener opuestos.",
        "",
        "2. Este curso puede, por lo tanto, resumirse muy simplemente de la siguiente manera:",
        "    Nada real puede ser amenazado.",
        "    Nada irreal existe.",
        "    En esto radica la paz de Dios.",
      ];

      for (const line of introText) {
        if (line.trim().startsWith("Nada") || line.trim().startsWith("En esto")) {
          page.drawText(line, { x: 70, y: currentY, size: 11, font: timesBold, color: rgb(0.1, 0.1, 0.1) });
        } else {
          page.drawText(line, { x: 50, y: currentY, size: 10.5, font: timesRoman, color: rgb(0.15, 0.15, 0.15) });
        }
        currentY -= 16;
      }

      currentY -= 20;
    }

    if (isChapterStart) {
      const chInfo = chapterStartMap.get(pageNum)!;
      page.drawText(`Capítulo ${chInfo.n}`, {
        x: 50,
        y: currentY,
        size: 13,
        font: timesBold,
        color: rgb(0.2, 0.2, 0.2),
      });
      currentY -= 22;

      page.drawText(chInfo.t.toUpperCase(), {
        x: 50,
        y: currentY,
        size: 15,
        font: timesBold,
        color: rgb(0.08, 0.08, 0.08),
      });
      currentY -= 30;
    }

    // Meditative paragraph text
    const sampleParagraphs = [
      "El milagro no hace distinciones entre los grados de dificultad, pues todos los milagros son expresiones de amor. En el instante santo se restablece la percepción unificada y se disipan las tinieblas de la mente.",
      "El perdón es el medio por el cual la mente reconoce la inocencia y deshace el miedo. La paz de Dios es un estado permanente que aguarda en tu corazón cuando decides contemplar a tu hermano con caridad y luz.",
      "No busques fuera de ti mismo lo que sólo puede encontrarse en el altar interior. En la santa quietud, la verdad permanece inmutable y la salvación se revela como el retorno a la paz eterna.",
      "La dicha y la paz son la voluntad de Dios para Su Hijo bienamado. Al liberar a tu hermano de las cadenas del pasado, te liberas a ti mismo y abres las puertas del Cielo en tu conciencia presente."
    ];

    const pIndex = pageNum % sampleParagraphs.length;
    const bodyP = sampleParagraphs[pIndex];

    page.drawText(`Página ${pageNum} — Un Curso de Milagros`, {
      x: 50,
      y: currentY,
      size: 10.5,
      font: timesItalic,
      color: rgb(0.3, 0.3, 0.3),
    });
    currentY -= 24;

    // A structured block of text
    const lines = [
      "La santidad de la mente es una con su Creador, y en esa unión ningún conflicto puede subsistir.",
      "Cada paso de la jornada hacia la paz es una lección de confianza y desprendimiento del pasado.",
      bodyP,
      "«Puesto que mi voluntad es conocerme a mí mismo, te veo como el Hijo de Dios y como mi hermano.»",
      "El perdón descorre el velo del tiempo y nos sitúa en el umbral del conocimiento eterno.",
      "Donde el amor se comparte sin reservas, la salvación se convierte en un hecho consumado.",
      "Descansa en la certeza de que la luz que te guía nunca se extingue y jamás te abandona."
    ];

    for (const l of lines) {
      page.drawText(l, {
        x: 50,
        y: currentY,
        size: 10,
        font: l.startsWith("«") ? timesItalic : timesRoman,
        color: rgb(0.18, 0.18, 0.18),
      });
      currentY -= 20;
    }
  }

  const pdfBytes = await pdfDoc.save();
  const targetDir = path.resolve('public');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  fs.writeFileSync(path.join(targetDir, 'UCDM_Texto.pdf'), pdfBytes);
  console.log(`PDF generado con éxito en public/UCDM_Texto.pdf (${pdfBytes.length} bytes, 297 páginas)`);
}

generateBookPDF().catch(console.error);
