import { log } from 'winston';

export default function checkApiKey(req, res, next) {
  log.info('Validando Api Key')

  const clientKey = req.headers['x-api-key'] || req.query.apiKey;

  if (!clientKey || clientKey !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized: API key missing or invalid' });
  }

  next();
}
