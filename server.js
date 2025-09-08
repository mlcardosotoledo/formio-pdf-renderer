import express from 'express';
import { chromium } from 'playwright';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const PORT = process.env.PORT || 3002;
const FORMIO_SERVER = process.env.FORMIO_SERVER || 'http://localhost:3001';
const FORMIO_API_KEY = process.env.FORMIO_API_KEY

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use(morgan('combined'));

app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  next();
});


app.get('/generate-pdf', async (req, res, next) => {
  const { formPath, submissionId } = req.query;
  const renderUrl = `${req.protocol}://${req.hostname}:${PORT}/render-form?formPath=${formPath}&submissionId=${submissionId}`;
  let browser;

  try {

    console.log('Generating  PDF')

    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    console.info('Browser launched')

    const page = await browser.newPage();

    const response = await page.goto(renderUrl, { waitUntil: 'networkidle' });

    if (!response) {
      throw new Error('No se recibió respuesta al navegar la página');
    }

    const status = response.status();
    if (status >= 400) {
      throw new Error(`Error al cargar la página: HTTP ${status}`);
    }

    console.info('Waiting for form loaded event...')

    await page.waitForFunction(() => window.formIsReady === true);

    console.info('Form loaded')

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
    });

    console.info('Page exported to pdf. Buffer size: ' + pdfBuffer.length)

    await browser.close();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${formPath}_${submissionId}.pdf"`,
    });
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
  finally {
    if (browser) await browser.close();
  }
});

app.get('/render-form', async (req, res) => {
  const { formPath, submissionId } = req.query;

  const formUrl = `${FORMIO_SERVER}/${formPath}`;
  const submissionUrl = `${FORMIO_SERVER}/${formPath}/submission/${submissionId}`;

  try {
    let html = await readFile(join(__dirname, 'form-template.html'), 'utf-8');
    html = html.replace('{{FORM_URL}}', formUrl)
               .replace('{{SUBMISSION_URL}}', submissionUrl)
               .replace('{{FORMIO_API_KEY}}', FORMIO_API_KEY);

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error cargando template');
  }
});

app.use('/static', express.static(join(__dirname, 'assets')));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
