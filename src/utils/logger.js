/**
 * Environment-gated logger.
 * In production, all output is suppressed to prevent information leakage.
 * Use process.stderr.write() directly for true operational emergencies
 * (e.g. process crash handlers) where you always need visibility.
 */
const isProd = process.env.NODE_ENV === 'production';

const logger = {
  log:   (...args) => { if (!isProd) console.log(...args); },
  info:  (...args) => { if (!isProd) console.info(...args); },
  warn:  (...args) => { if (!isProd) console.warn(...args); },
  error: (...args) => { if (!isProd) console.error(...args); },
  debug: (...args) => { if (!isProd) console.debug(...args); },
};

export default logger;
