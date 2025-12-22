import React, { useState, useEffect } from 'react';
import { Pencil, Save, X, BookOpen, Calculator } from 'lucide-react';
import { CLSimulator } from './dashboard/CLSimulator';

const STORAGE_KEY = 'dashboard_notes';

interface Props {
    simulatorInitialData?: { symbol: string; price: number } | null;
    locale?: string;
}

const DashboardNotes: React.FC<Props> = ({ simulatorInitialData, locale }) => {
    const [activeTab, setActiveTab] = useState<'NOTES' | 'SIMULATOR'>('NOTES');
    const [isEditing, setIsEditing] = useState(false);
    const [content, setContent] = useState('');

    // Switch to simulator tab if initial data is provided
    useEffect(() => {
        if (simulatorInitialData) {
            setActiveTab('SIMULATOR');
        }
    }, [simulatorInitialData]);

    useEffect(() => {
        const loadFromStorage = () => {
            const savedNotes = localStorage.getItem(STORAGE_KEY);
            if (savedNotes) {
                setContent(savedNotes);
            }
        };

        loadFromStorage();

        window.addEventListener('storage', loadFromStorage);
        window.addEventListener('local-storage-update', loadFromStorage);

        return () => {
            window.removeEventListener('storage', loadFromStorage);
            window.removeEventListener('local-storage-update', loadFromStorage);
        };
    }, []);

    const handleSave = () => {
        localStorage.setItem(STORAGE_KEY, content);
        setIsEditing(false);
    };

    const handleCancel = () => {
        const savedNotes = localStorage.getItem(STORAGE_KEY);
        setContent(savedNotes || "");
        setIsEditing(false);
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header / Tabs */}
            <div className="flex justify-between items-center px-6 py-0 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 overflow-x-auto custom-scrollbar">
                <div className="flex gap-6">
                    <button
                        onClick={() => setActiveTab('NOTES')}
                        className={`py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'NOTES'
                            ? 'text-indigo-600 dark:text-indigo-400 border-indigo-600 dark:border-indigo-400'
                            : 'text-slate-500 border-transparent hover:text-slate-700'}`}
                    >
                        <BookOpen size={18} />
                        Notes & Dictionary
                    </button>
                    <button
                        onClick={() => setActiveTab('SIMULATOR')}
                        className={`py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'SIMULATOR'
                            ? 'text-indigo-600 dark:text-indigo-400 border-indigo-600 dark:border-indigo-400'
                            : 'text-slate-500 border-transparent hover:text-slate-700'}`}
                    >
                        <Calculator size={18} />
                        CL Simulator (V3)
                    </button>
                </div>

                {activeTab === 'NOTES' && (
                    !isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="p-2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                            title="Edit Notes"
                        >
                            <Pencil size={16} />
                        </button>
                    ) : (
                        <div className="flex gap-1">
                            <button
                                onClick={handleCancel}
                                className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                                title="Cancel"
                            >
                                <X size={18} />
                            </button>
                            <button
                                onClick={handleSave}
                                className="p-2 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-colors rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                title="Save Notes"
                            >
                                <Save size={18} />
                            </button>
                        </div>
                    )
                )}
            </div>

            <div className="p-6">
                {activeTab === 'NOTES' && (
                    isEditing ? (
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full h-48 p-4 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-mono text-sm leading-relaxed custom-scrollbar resize-y"
                            placeholder="Type your notes here..."
                        />
                    ) : (
                        <div className="prose dark:prose-invert max-w-none">
                            <div className="whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300 font-mono leading-relaxed">
                                {content || <span className="text-slate-400 italic">No notes yet. Click edit to add some.</span>}
                            </div>
                        </div>
                    )
                )}

                {activeTab === 'SIMULATOR' && (
                    <div className="animate-in fade-in slide-in-from-right-4">
                        <CLSimulator
                            initialBaseSymbol={simulatorInitialData?.symbol}
                            initialPrice={simulatorInitialData?.price}
                            locale={locale}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardNotes;
