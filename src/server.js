import express from 'express';
import morgan from 'morgan';
import nocache from 'nocache';
import logger from './logger.js';
import timeout from "connect-timeout";
import { join } from 'path';
import { getBrowser } from './browser.js';
import { PORT } from './config.js';
import generatePdfRouter from './routes/generatePdf.js';
import renderForm from './routes/renderForm.js';
import checkApiKey from './middlewares/checkApiKey.js'

const app = express();

app.use(timeout("5s"));

app.use(morgan('combined'));

app.use(checkApiKey);

app.use(nocache());

app.use((req, res, next) => { 
  if (!req.timedout) next();
});

app.use(express.static(join(process.cwd(), 'public')));

app.get('/generate-pdf', generatePdfRouter);
app.get('/render-form', renderForm);

app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  logger.info(`Servidor escuchando en http://localhost:${PORT}`);
});

async function shutdown() {
  const browser = await getBrowser();
  if (browser) await browser.close();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);