
async function checkHype() {
    try {
        const response = await fetch('https://api.hyperliquid.xyz/info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'allMids' })
        });
        const data = await response.json();
        const price = data['HYPE'];
        console.log(`Live HYPE Price from API: ${price}`);
    } catch (e) {
        console.error("API Fetch Failed", e);
    }
}

checkHype();
