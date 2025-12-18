import React, { useEffect, useState } from 'react';
import { TransactionService } from './services/db';

export default function RescueData() {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [diagnostics, setDiagnostics] = useState({ dbs: [], localStorageKeys: [] });

    useEffect(() => {
        async function loadData() {
            try {
                // Diagnostic: List all DBs
                if (window.indexedDB && window.indexedDB.databases) {
                    const dbs = await window.indexedDB.databases();
                    setDiagnostics(prev => ({ ...prev, dbs }));
                }

                // Diagnostic: List LocalStorage
                const keys = Object.keys(localStorage);
                setDiagnostics(prev => ({ ...prev, localStorageKeys: keys }));

                const txs = await TransactionService.getAll();
                const principal = localStorage.getItem('investment_tracker_manual_principal');
                const fundingOffset = localStorage.getItem('investment_tracker_funding_offset');
                const watchlist = localStorage.getItem('investment_tracker_watchlist');
                const alertSettings = localStorage.getItem('investment_tracker_alert_settings');

                const exportData = {
                    transactions: txs,
                    manualPrincipal: principal ? parseFloat(principal) : null,
                    fundingOffset: fundingOffset ? parseFloat(fundingOffset) : null,
                    watchlist: watchlist ? JSON.parse(watchlist) : [],
                    alertSettings: alertSettings ? JSON.parse(alertSettings) : null,
                    exportDate: new Date().toISOString(),
                    version: '1.0',
                    _diagnostics: {
                        dbs: diagnostics.dbs,
                        localStorageSize: keys.length
                    }
                };
                setData(exportData);
            } catch (err) {
                console.error(err);
                setError(err.message);
            }
        }
        loadData();
    }, []);

    const handleDownload = () => {
        if (!data) return;
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `investment_tracker_RESCUE_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="p-10 max-w-4xl mx-auto font-sans">
            <h1 className="text-3xl font-bold text-red-600 mb-4">EMERGENCY DATA RESCUE (DIAGNOSTIC MODE)</h1>
            <p className="mb-4">Use this screen to recover your data from Port 5174.</p>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    Error loading data: {error}
                </div>
            )}

            {data ? (
                <div className="space-y-6">
                    <div className="bg-green-50 border border-green-500 p-6 rounded-lg text-center">
                        <p className="text-xl font-bold text-green-700 mb-2">Data Found!</p>
                        <p className="mb-4 text-gray-700">{data.transactions.length} Transactions found.</p>
                        <button
                            onClick={handleDownload}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg shadow-lg"
                        >
                            DOWNLOAD RESCUE FILE
                        </button>
                    </div>

                    <div className="bg-gray-100 p-4 rounded text-sm font-mono overflow-auto max-h-96">
                        <h3 className="font-bold mb-2">Diagnostics:</h3>
                        <p>Origin: {window.location.origin}</p>
                        <p><strong>Databases Found:</strong></p>
                        <ul className="list-disc pl-5 mb-2">
                            {diagnostics.dbs && diagnostics.dbs.length > 0 ? (
                                diagnostics.dbs.map((db, i) => (
                                    <li key={i}>{db.name} (v{db.version})</li>
                                ))
                            ) : (
                                <li>No Access to IndexedDB enumeration or No DBs found.</li>
                            )}
                        </ul>
                        <p><strong>LocalStorage Keys:</strong></p>
                        <ul className="list-disc pl-5">
                            {diagnostics.localStorageKeys.map((k, i) => (
                                <li key={i}>{k}: {localStorage.getItem(k).substring(0, 50)}...</li>
                            ))}
                        </ul>
                    </div>
                </div>
            ) : (
                <p>Loading database...</p>
            )}
        </div>
    );
}
