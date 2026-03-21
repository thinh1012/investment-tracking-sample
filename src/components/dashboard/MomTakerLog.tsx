import React, { useEffect, useState } from 'react';
import { ScrollText } from 'lucide-react';
import { TableShell } from '../common/TableShell';

export const MomTakerLog: React.FC = () => {
    const [logContent, setLogContent] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(true);

    useEffect(() => {
        const fetchLog = async () => {
            setLoading(true);
            try {
                // Fetch the public minutes file. Ensure it is accessible.
                // We're assuming the file is served at /MINUTES_OF_MEETING.md if placed in public
                // Or we need an API endpoint. For now, try root access if Vite serves it.
                // If this fails, we might need to rely on the server API or move the file.
                // Assuming "public/MINUTES_OF_MEETING.md" pattern for static serving.
                const res = await fetch('/MINUTES_OF_MEETING.md');
                if (res.ok) {
                    const text = await res.text();
                    setLogContent(text);
                } else {
                    setLogContent('Unable to load meeting minutes. File may not be accessible.');
                }
            } catch (e) {
                setLogContent('Error loading minutes.');
            } finally {
                setLoading(false);
            }
        };

        if (isOpen) fetchLog();
    }, [isOpen]);

    return (
        <TableShell
            title="Mom Taker Ledger"
            subtitle="Project History & Minutes"
            icon={<ScrollText />}
            iconColor="indigo"
            isOpen={isOpen}
            onToggle={() => setIsOpen(!isOpen)}
            className="mt-6"
        >
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-b-xl">
                {loading ? (
                    <div className="text-center py-8 text-slate-400 text-xs animate-pulse">
                        Retrieving historical records...
                    </div>
                ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        <pre className="whitespace-pre-wrap font-mono text-xs text-slate-600 dark:text-slate-300 leading-relaxed overflow-x-auto">
                            {logContent || "No minutes found."}
                        </pre>
                    </div>
                )}
            </div>
        </TableShell>
    );
};
