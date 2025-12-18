import React from 'react';
import {
    LayoutDashboard, BarChart3, BookOpen, Eye, TrendingUp,
    Settings as LucideSettings, Cloud, Menu, X, Sun, Moon,
    Upload, Download
} from 'lucide-react';
import { AppView } from '../../hooks/useAppNavigation';

interface SidebarProps {
    currentView: AppView;
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (open: boolean) => void;
    isDarkMode: boolean;
    toggleTheme: () => void;
    navigateTo: (view: AppView) => void;
    onImportClick: () => void;
    onExportClick: () => void;
    onSyncClick: () => void;
    isMobile?: boolean;
}

const NavLinks: React.FC<{
    currentView: AppView;
    navigateTo: (view: AppView) => void;
    onSyncClick: () => void;
    mobile?: boolean;
}> = ({ currentView, navigateTo, onSyncClick, mobile }) => (
    <nav className={`flex-1 ${mobile ? 'p-0' : 'p-4'} space-y-2`}>
        {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'analytics', icon: BarChart3, label: 'Analytics' },
            { id: 'notes', icon: BookOpen, label: 'Notes' },
            { id: 'watchlist', icon: Eye, label: 'Watchlist' },
            { id: 'market-picks', icon: TrendingUp, label: 'Market Picks' },
            { id: 'settings', icon: LucideSettings, label: 'Settings' },
        ].map((item) => (
            <button
                key={item.id}
                onClick={() => navigateTo(item.id as AppView)}
                className={`flex items-center w-full p-2 rounded-md text-left transition-colors ${currentView === item.id
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                    }`}
            >
                <item.icon className="mr-3 h-5 w-5" />
                {item.label}
            </button>
        ))}

        <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
            <button
                onClick={onSyncClick}
                className="flex items-center w-full p-2 rounded-md text-left text-xs text-slate-500 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
                <div className="mr-3 p-1 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                    <Cloud size={12} />
                </div>
                Cloud Vault (Sync)
            </button>
        </div>
    </nav>
);

export const Sidebar: React.FC<SidebarProps> = (props) => {
    const {
        currentView, isMobileMenuOpen, setIsMobileMenuOpen,
        isDarkMode, toggleTheme, navigateTo,
        onImportClick, onExportClick, onSyncClick
    } = props;

    // Mobile Header
    if (props.isMobile) {
        return (
            <>
                <header className="md:hidden bg-white dark:bg-slate-900 border-b dark:border-slate-800 p-4 flex justify-between items-center text-gray-900 dark:text-white sticky top-0 z-30 shadow-sm">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-500 rounded-lg">
                            <LayoutDashboard className="text-white h-5 w-5" />
                        </div>
                        <h1 className="text-lg font-bold">Crypto Portfolio</h1>
                    </div>
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                </header>

                {isMobileMenuOpen && (
                    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
                        <div
                            className="absolute left-0 top-0 bottom-0 w-72 bg-white dark:bg-slate-900 shadow-2xl p-4 flex flex-col animate-in slide-in-from-left duration-200"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Menu</h2>
                                <button
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                                >
                                    <X className="h-6 w-6 text-gray-500" />
                                </button>
                            </div>

                            <NavLinks
                                currentView={currentView}
                                navigateTo={navigateTo}
                                onSyncClick={onSyncClick}
                                mobile={true}
                            />

                            <div className="pt-4 border-t dark:border-slate-800 space-y-2 mt-auto">
                                <div className="flex gap-2">
                                    <button
                                        onClick={onImportClick}
                                        className="flex-1 flex items-center justify-center p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700 font-medium"
                                    >
                                        <Upload className="h-4 w-4" />
                                        <span className="ml-2 text-xs">Import</span>
                                    </button>
                                    <button
                                        onClick={onExportClick}
                                        className="flex-1 flex items-center justify-center p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700 font-medium"
                                    >
                                        <Download className="h-4 w-4" />
                                        <span className="ml-2 text-xs">Export</span>
                                    </button>
                                </div>
                                <button onClick={toggleTheme} className="flex items-center w-full p-2 rounded-md text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 font-medium">
                                    {isDarkMode ? <Sun className="mr-3 h-5 w-5" /> : <Moon className="mr-3 h-5 w-5" />}
                                    {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    }

    // Desktop Sidebar
    return (
        <aside className="w-64 bg-white dark:bg-slate-900 border-r dark:border-slate-800 hidden md:flex flex-col">
            <div className="p-4 border-b dark:border-slate-800">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Crypto Portfolio</h1>
            </div>

            <NavLinks
                currentView={currentView}
                navigateTo={navigateTo}
                onSyncClick={onSyncClick}
            />

            <div className="p-4 border-t dark:border-slate-800 space-y-2">
                <div className="flex gap-2">
                    <button
                        onClick={onImportClick}
                        className="flex-1 flex items-center justify-center p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700 transition-colors font-medium"
                        title="Import Data"
                    >
                        <Upload className="h-4 w-4" />
                        <span className="ml-2 text-xs">Import</span>
                    </button>
                    <button
                        onClick={onExportClick}
                        className="flex-1 flex items-center justify-center p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700 transition-colors font-medium"
                        title="Export Data"
                    >
                        <Download className="h-4 w-4" />
                        <span className="ml-2 text-xs">Export</span>
                    </button>
                </div>

                <button
                    onClick={toggleTheme}
                    className="flex items-center w-full p-2 rounded-md text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 font-medium"
                >
                    {isDarkMode ? <Sun className="mr-3 h-5 w-5" /> : <Moon className="mr-3 h-5 w-5" />}
                    {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                </button>
            </div>
        </aside>
    );
};
