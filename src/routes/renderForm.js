import logger from '../logger.js';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { FORMIO_SERVER, FORMIO_API_KEY } from '../config.js';

const templatePath = join(process.cwd(), 'templates', 'form-template.html');

export default async function renderForm(req, res) {
  const { formPath, submissionId } = req.query;

  const formUrl = `${FORMIO_SERVER}/${formPath}`;

  const submissionUrl = `${FORMIO_SERVER}/${formPath}/submission/${submissionId}`;

  try {
    let html = await readFile(templatePath, 'utf-8');
    html = html.replace('{{FORM_URL}}', formUrl)
               .replace('{{SUBMISSION_URL}}', submissionUrl)
               .replace('{{FORMIO_API_KEY}}', FORMIO_API_KEY);

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    logger.error(err);
    res.status(500).send('Error cargando template');
  }
}