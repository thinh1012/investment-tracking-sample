
const https = require('https');

// Read key from args or a temp file if needed.
// For now, I'll ask the user to provide it or extract it if I had it. 
// Ideally I'd use the one I just verified: AIzaSyCNqF_38cQEhr9Gkvl-F1O0NbeZ-gcJeUs
const key = 'AIzaSyCNqF_38cQEhr9Gkvl-F1O0NbeZ-gcJeUs';

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

console.log(`[DIAGNOSTIC] Fetching models list...`);

https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.models) {
                console.log("✅ AVAILABLE MODELS:");
                json.models.forEach(m => {
                    // Only show generateContent supported models
                    if (m.supportedGenerationMethods.includes("generateContent")) {
                        console.log(`- ${m.name.replace('models/', '')} [${m.displayName}]`);
                    }
                });
            } else {
                console.log("❌ ERROR:", JSON.stringify(json, null, 2));
            }
        } catch (e) {
            console.log("❌ PARSE ERROR:", data);
        }
    });
}).on('error', err => {
    console.error("❌ NETWORK ERROR:", err.message);
});
