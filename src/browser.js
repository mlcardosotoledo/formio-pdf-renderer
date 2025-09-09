import { chromium } from 'playwright';
import logger from './logger.js';

let browserSingleton;

export async function getBrowser() {
  if (!browserSingleton) {
    logger.info('Lanzando Chromium...');
    browserSingleton = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    logger.info('Chromium lanzado ...');
  }
  return browserSingleton;
}