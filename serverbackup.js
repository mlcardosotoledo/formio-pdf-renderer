const { chromium } = require('playwright');

async function generatePdfFromUrl(url, outputPath) {
  // Lanzar navegador headless
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Navegar a la URL pública que tiene el formulario con datos
  await page.goto(url, { waitUntil: 'networkidle' });

  // Opcional: esperar un poco para asegurar que todo se renderizó
  await page.waitForTimeout(1000);

  // Generar PDF
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
  });

  await browser.close();
  console.log('PDF generado:', outputPath);
}

// Ejemplo de uso
const url = 'file:///C:/Users/mlcardoso/Desktop/formio/formulario_con_submission.html'; // cambiá por tu URL real
const outputPath = 'formulario.pdf';

generatePdfFromUrl(url, outputPath).catch(console.error);
