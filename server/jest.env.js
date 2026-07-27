/**
 * Jest environment setup — loads .env from project root (one level up from server/).
 * This ensures all test suites have access to RESEND_API_KEY, JWT_SECRET, etc.
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
