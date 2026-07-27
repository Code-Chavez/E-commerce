/**
 * Jest environment setup.
 *
 * 1. Loads .env from the project root (one level up from server/) so local
 *    runs use real credentials (RESEND_API_KEY, JWT_SECRET, STRIPE_SECRET_KEY…).
 * 2. Fills in dummy fallbacks for env vars that adapters/services read at
 *    construction time. In CI there is no .env, so without these the app
 *    crashes on import (e.g. "STRIPE_SECRET_KEY no está configurada").
 *    Fallbacks only apply when the variable is undefined, so a local .env
 *    always takes precedence.
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

process.env.NODE_ENV = process.env.NODE_ENV || 'test';

const testDefaults = {
  STRIPE_SECRET_KEY: 'sk_test_dummy',
  STRIPE_WEBHOOK_SECRET: 'whsec_test_dummy',
  RESEND_API_KEY: 're_test_dummy',
  JWT_SECRET: 'test_access_secret',
  JWT_REFRESH_SECRET: 'test_refresh_secret',
  DATABASE_URL: 'mysql://user:pass@localhost:3306/test',
};

for (const [key, value] of Object.entries(testDefaults)) {
  if (!process.env[key]) {
    process.env[key] = value;
  }
}
