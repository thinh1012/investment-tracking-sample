import React from 'react';
import { Transaction } from '../types';

export const useDataStorage = (
    transactions: Transaction[],
    importTransactions: (data: any) => void,
    notify: any
) => {

    const downloadJSON = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(transactions));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "crypto_investing_backup_" + new Date().toISOString().split('T')[0] + ".json");
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        notify.success('Backup downloaded successfully');
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
            fileReader.onload = (e) => {
                try {
                    if (e.target && e.target.result) {
                        let importedData = JSON.parse(e.target.result as string);

                        if (Array.isArray(importedData)) {
                            importedData = sanitizeData(importedData);
                            if (window.confirm("This will overwrite your current data. Are you sure?")) {
                                importTransactions(importedData);
                                notify.success('Data imported successfully!');
                            }
                        } else {
                            notify.error('Invalid file format. Expected an array of transactions.');
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
