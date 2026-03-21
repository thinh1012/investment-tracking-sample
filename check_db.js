const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'satellite', 'scout_intelligence.db'));

const rows = db.prepare(`
    SELECT label, value, timestamp 
    FROM (
        SELECT label, value, timestamp,
        ROW_NUMBER() OVER (PARTITION BY label ORDER BY timestamp DESC) as rn
        FROM intel_records
    ) 
    WHERE rn = 1
    ORDER BY label ASC
`).all();

console.log(JSON.stringify(rows, null, 2));
