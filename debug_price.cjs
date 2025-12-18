const https = require('https');

const symbol = 'PLUME';

const fetchJson = (url) => {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve({ error: 'Invalid JSON', raw: data });
                }
            });
        }).on('error', err => resolve({ error: err.message }));
    });
};

const runDebug = async () => {
    console.log(`--- Debugging Price for ${symbol} ---`);

    // 1. Hyperliquid
    console.log('\n1. Hyperliquid:');
    // Simple fetch won't work easily for HL POST without more code, skipping or mocking via GET if possible? 
    // HL needs POST. Let's try DexScreener first as it's the new likely culprit.

    // 2. DexScreener
    console.log('\n2. DexScreener:');
    const dex = await fetchJson(`https://api.dexscreener.com/latest/dex/search?q=${symbol}`);
    if (dex.pairs) {
        dex.pairs.slice(0, 3).forEach((p, i) => {
            console.log(`   [${i}] ${p.baseToken.name} (${p.baseToken.symbol}) / ${p.quoteToken.symbol}`);
            console.log(`       Price: $${p.priceUsd} | Liquidity: $${p.liquidity?.usd} | DEX: ${p.dexId}`);
        });
    } else {
        console.log('   No pairs found.');
    }

    // 3. CoinGecko Search
    console.log('\n3. CoinGecko Search (ID Resolution):');
    const cgSearch = await fetchJson(`https://api.coingecko.com/api/v3/search?query=${symbol}`);
    if (cgSearch.coins) {
        cgSearch.coins.slice(0, 3).forEach((c, i) => {
            console.log(`   [${i}] ${c.name} (${c.symbol}) -> ID: ${c.id}`);
        });

        // Fetch price for top match
        if (cgSearch.coins.length > 0) {
            const topId = cgSearch.coins[0].id;
            const cgPrice = await fetchJson(`https://api.coingecko.com/api/v3/simple/price?ids=${topId}&vs_currencies=usd`);
            console.log(`       Price for ${topId}:`, cgPrice);
        }
    }

    // 4. CryptoCompare
    console.log('\n4. CryptoCompare:');
    const cc = await fetchJson(`https://min-api.cryptocompare.com/data/price?fsym=${symbol}&tsyms=USD`);
    console.log('   Result:', cc);

    // 5. Binance
    console.log('\n5. Binance:');
    const binance = await fetchJson(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`);
    console.log('   Result:', binance);
};

runDebug();
