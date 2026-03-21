const fs = require('fs');
const filename = 'alpha_vault_full_backup_2025-12-28.json';

try {
    const raw = fs.readFileSync(filename, 'utf-8');
    const data = JSON.parse(raw);
    console.log("Top-level keys:", Object.keys(data));

    if (data.watchlist) console.log("Watchlist items:", data.watchlist.length);
    if (data.watchList) console.log("watchList items:", data.watchList.length);

    if (data.marketPicks) console.log("marketPicks items:", data.marketPicks.length);
    if (data.picks) console.log("picks items:", data.picks.length);
    if (data.market_picks) console.log("market_picks items:", data.market_picks.length);

} catch (e) {
    console.error("Error:", e.message);
}
