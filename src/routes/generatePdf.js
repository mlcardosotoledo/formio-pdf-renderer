import { PORT, API_KEY } from '../config.js';
import logger from '../logger.js';
import { getBrowser } from '../browser.js';

export default async function generatePdf(req, res, next) {
  const { formPath, submissionId } = req.query;
  
  const log = logger.withSubmissionId(submissionId);

  const renderUrl = `${req.protocol}://${req.hostname}:${PORT}/render-form?formPath=${formPath}&submissionId=${submissionId}`;

  const controller = new AbortController();
  const { signal } = controller;

  req.on('timeout', () => {
    logger.info('Timeout detectado, abortando operaciones');
    controller.abort();
  });

  let page;

  try {
    const browser = await getBrowser();
    page = await browser.newPage();

    log.info('Cargando página de formularios...');

    const response = await page.goto(
      renderUrl, 
      {
        waitUntil: 'networkidle', 
        signal,
        headers: {
          'x-api-key': API_KEY
        }
      });

    if (!response) throw new Error('No se recibió respuesta al navegar la página');
    if (response.status() >= 400) throw new Error(`Error al cargar la página: HTTP ${response.status()}`);

    log.info('Página de formularios cargada...');

    await page.waitForFunction(() => window.formIsReady === true, { signal });
    if (req.timedout) return;

    log.info('Generando PDF...');

    const pdfBuffer = await page.pdf(
      { 
        format: 'A4', 
        printBackground: true, 
        preferCSSPageSize: true,
        signal
      });
    
    log.info('PDF generado...');
    
    if (req.timedout) return;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${formPath}_${submissionId}.pdf"`,
    });

    log.info('Enviando PDF...');
    
    res.send(pdfBuffer);

    log.info('PDF enviado');

  } catch (err) {
    if (err.name === 'AbortError') {
      log.error('Operación abortada por timeout');
      return;
    }
    next(err);
  } finally {
    if (page) await page.close();
  }
}
