const fs = require('fs');
try {
    const data = JSON.parse(fs.readFileSync('alpha_vault_full_backup_2026-02-13.json', 'utf8'));

    const results = data.transactions.filter(tx => {
        return tx.amount === 15.86 || tx.amount === 5647 || JSON.stringify(tx).includes('5647') || JSON.stringify(tx).includes('15.86');
    });

    console.log(JSON.stringify(results, null, 2));
} catch (e) {
    console.error(e);
}
