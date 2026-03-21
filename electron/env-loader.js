// =========================================================
// Environment Variable Loader for Electron
// This must be required FIRST in main.js
// ========================================================= 
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

console.log('[ENV_LOADER] Supabase URL:', process.env.VITE_SUPABASE_URL ? 'LOADED ✓' : 'MISSING ✗');
console.log('[ENV_LOADER] Supabase Key:', process.env.VITE_SUPABASE_ANON_KEY ? 'LOADED ✓' : 'MISSING ✗');
console.log('[ENV_LOADER] Scout URL:', process.env.VITE_SCOUT_URL || 'NOT SET (defaulting to localhost)');
