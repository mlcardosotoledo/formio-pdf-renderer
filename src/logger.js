import winston from 'winston';

const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.simple()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

logger.withSubmissionId = (submissionId) => {
  const prefix = `[${submissionId}] ⇒ `;
  return {
    info: (msg) => logger.info(prefix + msg),
    warn: (msg) => logger.warn(prefix + msg),
    error: (msg) => logger.error(prefix + msg),
    debug: (msg) => logger.debug(prefix + msg),
  };
};

export default logger;