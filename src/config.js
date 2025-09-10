import dotenv from 'dotenv';

dotenv.config();

export const PORT = process.env.PORT || 3002;
export const FORMIO_SERVER = process.env.FORMIO_SERVER;
export const FORMIO_API_KEY = process.env.FORMIO_API_KEY;
export const API_KEY = process.env.API_KEY;
export const LOG_LEVEL = process.env.LOG_LEVEL || 'warning';