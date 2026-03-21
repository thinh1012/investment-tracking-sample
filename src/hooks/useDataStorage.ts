import { Transaction } from '../types';
import { BackupService } from '../services/database/BackupService';

export const useDataStorage = (
    transactions: Transaction[],
    importTransactions: (data: any) => void,
    notify: any
) => {

    const downloadJSON = async () => {
        try {
            const fullVault = await BackupService.createFullBackup();
            const fileName = "alpha_vault_full_backup_" + new Date().toISOString().split('T')[0] + ".json";

            const blob = new Blob([JSON.stringify(fullVault, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", url);
            downloadAnchorNode.setAttribute("download", fileName);
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
            URL.revokeObjectURL(url);

            notify.success('Full Vault backup downloaded successfully');
        } catch (e) {
            console.error("Export failed", e);
            notify.error('Export failed');
        }
    };

    const sanitizeData = (data: any[]) => {
        const locale = localStorage.getItem('investment_tracker_locale') || 'en-US';

        if (Array.isArray(data)) {
            return data.map(item => {
                const newItem = { ...item };
                // Fields that should be numbers
                const numberFields = ['amount', 'paymentAmount', 'pricePerUnit', 'fee', 'targetPrice', 'targetBuyPrice', 'targetSellPrice', 'expectedQty', 'boughtQty'];

                numberFields.forEach(field => {
                    const val = newItem[field];
                    if (typeof val === 'string') {
                        if (locale === 'en-US') {
                            // US Mode: Remove commas (thousands), keep dots (decimal)
                            const clean = val.replace(/,/g, '');
                            const parsed = parseFloat(clean);
                            if (!isNaN(parsed)) newItem[field] = parsed;
                        } else {
                            // VN/EU Mode: Remove dots (thousands), replace comma with dot (decimal)
                            const clean = val.replace(/\./g, '').replace(',', '.');
                            const parsed = parseFloat(clean);
                            if (!isNaN(parsed)) newItem[field] = parsed;
                        }
                    }
                });
                return newItem;
            });
        }
        return data;
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const fileReader = new FileReader();
        if (event.target.files && event.target.files[0]) {
            fileReader.readAsText(event.target.files[0], "UTF-8");
            fileReader.onload = async (e) => {
                try {
                    if (e.target && e.target.result) {
                        const importedData = JSON.parse(e.target.result as string);

                        // POLYMORPHIC IMPORT: Handle Full Vault vs Legacy Array
                        if (importedData && typeof importedData === 'object' && !Array.isArray(importedData) && importedData.transactions) {
                            if (window.confirm("Full Vault backup detected. This will restore all transactions, watchlist items, and settings. Proceed?")) {
                                await BackupService.restoreFullBackup(importedData);
                                notify.success('Full Vault restored successfully!');
                                window.location.reload();
                            }
                        } else if (Array.isArray(importedData)) {
                            const sanitized = sanitizeData(importedData);
                            if (window.confirm("Legacy transaction backup detected. This will overwrite current transactions. Proceed?")) {
                                importTransactions(sanitized);
                                notify.success('Transactions imported successfully!');
                            }
                        } else {
                            notify.error('Invalid file format.');
                        }
                    }
                } catch (error) {
                    console.error("Error reading file:", error);
                    notify.error('Failed to parse JSON file.');
                }
            };
        }
    };

    const downloadCSV = () => {
        const headers = [
            'ID', 'Date', 'Asset', 'Type', 'Amount', 'Price', 'Currency',
            'Platform', 'Source', 'Fee', 'Fee Currency', 'Notes',
            'LP Range', 'Monitor Symbol', 'Related Assets'
        ];

        const rows = transactions.map(tx => [
            tx.id,
            tx.date,
            tx.assetSymbol,
            tx.type,
            tx.amount,
            tx.pricePerUnit || tx.paymentAmount || '',
            tx.paymentCurrency || '',
            tx.platform || '',
            tx.source || '',
            tx.fee || '',
            tx.feeCurrency || '',
            tx.notes || '',
            tx.lpRange ? `${tx.lpRange.min} - ${tx.lpRange.max}` : '',
            tx.monitorSymbol || '',
            tx.relatedAssetSymbols ? tx.relatedAssetSymbols.join('; ') : (tx.relatedAssetSymbol || '')
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `crypto_transactions_backup_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        notify.success('CSV Exported successfully');
    };

    return {
        downloadJSON,
        downloadCSV,
        handleFileUpload,
        sanitizeData // Exported for testing
    };
};
