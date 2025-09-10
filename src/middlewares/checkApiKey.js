import logger from './../logger.js';
import { API_KEY } from './../config.js'

export default function checkApiKey(req, res, next) {
  logger.debug('Validando Api Key')

  const clientKey = req.headers['x-api-key'] || req.query.apiKey;

  if (!clientKey || clientKey !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized: API key missing or invalid' });
  }

  next();
}
