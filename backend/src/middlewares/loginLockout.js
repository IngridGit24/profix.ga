/**
 * Login lockout middleware (OWASP A07 — brute-force protection).
 *
 * This is the server-side replacement for the old frontend's
 * utils/rateLimiter.js — that one stored attempt counts in a plain
 * in-memory browser object, which a page refresh or new tab reset
 * completely. This one is enforced here, not bypassable by the client.
 *
 * In-memory store (no Redis required for single-instance deployments).
 * Key = lowercase email + ":" + req.ip.
 */

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutes

// Map<string, { count: number, lockedUntil: number|null }>
const store = new Map();

function key(email, ip) {
  return `${(email || '').toLowerCase().trim()}:${ip || 'unknown'}`;
}

/** Middleware: run BEFORE the login/register handler. Returns 429 if locked. */
export const loginLockout = (req, res, next) => {
  const k = key(req.body?.email, req.ip);
  const entry = store.get(k);
  const now = Date.now();

  if (entry?.lockedUntil && now < entry.lockedUntil) {
    const secondsLeft = Math.ceil((entry.lockedUntil - now) / 1000);
    return res.status(429).json({
      success: false,
      message: `Trop de tentatives incorrectes. Réessayez dans ${secondsLeft} seconde${secondsLeft > 1 ? 's' : ''}.`,
      locked: true,
      retry_after: secondsLeft,
    });
  }

  if (entry?.lockedUntil && now >= entry.lockedUntil) {
    store.delete(k);
  }

  req._loginKey = k;
  next();
};

/** Call after a FAILED login attempt. */
export const recordLoginFailure = (loginKey) => {
  if (!loginKey) return;
  const now = Date.now();
  const entry = store.get(loginKey) || { count: 0, lockedUntil: null };

  if (entry.lockedUntil && now >= entry.lockedUntil) {
    entry.count = 0;
    entry.lockedUntil = null;
  }

  entry.count += 1;

  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = now + LOCK_DURATION_MS;
    entry.count = 0;
  }

  store.set(loginKey, entry);
};

/** Call after a SUCCESSFUL login to clear the counter. */
export const resetLoginAttempts = (loginKey) => {
  if (loginKey) store.delete(loginKey);
};

// Housekeeping: remove stale entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [k, entry] of store.entries()) {
    const expired = !entry.lockedUntil || now > entry.lockedUntil + LOCK_DURATION_MS;
    if (expired && entry.count === 0) store.delete(k);
  }
}, 10 * 60 * 1000);
