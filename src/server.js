import express from 'express';
import morgan from 'morgan';
import nocache from 'nocache';
import logger from './logger.js';
import timeout from "connect-timeout";
import { join } from 'path';
import { getBrowser } from './browser.js';
import { API_KEY, PORT } from './config.js';
import generatePdfRouter from './routes/generatePdf.js';
import renderForm from './routes/renderForm.js';
import checkApiKey from './middlewares/checkApiKey.js'

const app = express();

app.use(timeout("5s"));

app.use(morgan('combined'));

app.use(nocache());

app.use((req, res, next) => { 
  if (!req.timedout) next();
});

app.use(express.static(join(process.cwd(), 'public')));

app.get('/generate-pdf', checkApiKey, generatePdfRouter);
app.get('/render-form', checkApiKey, renderForm);

app.use((err, req, res, next) => {
  if (err instanceof Error) {
    logger.error(err.message);
  } else {
    logger.error(err);
  }
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
logger.info(console.profile.length)
  logger.info(`Servidor escuchando en http://localhost:${PORT}`);
});

async function shutdown() {
  const browser = await getBrowser();
  if (browser) await browser.close();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);