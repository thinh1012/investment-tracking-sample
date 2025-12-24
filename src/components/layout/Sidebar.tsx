import React from 'react';
import {
    LayoutDashboard, BarChart3, BookOpen, Eye, TrendingUp,
    Settings as LucideSettings, Cloud, Menu, X, Sun, Moon,
    Upload, Download, Calculator
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

// Nav links component (extracted for reuse)
const NavLinks: React.FC<{
    currentView: AppView;
    navigateTo: (view: AppView) => void;
    onSyncClick: () => void;
    mobile?: boolean;
}> = ({ currentView, navigateTo, onSyncClick, mobile }) => (
    <nav className={`flex-1 ${mobile ? 'p-0' : 'p-4'} space-y-1.5`}>
        {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'analytics', icon: BarChart3, label: 'Analytics' },
            { id: 'notes', icon: BookOpen, label: 'Notes & Dictionary' },
            { id: 'watchlist', icon: Eye, label: 'Watchlist' },
            { id: 'market-picks', icon: TrendingUp, label: 'Market Picks' },
            { id: 'settings', icon: LucideSettings, label: 'Settings' },
        ].map((item, idx) => {
            const isActive = currentView === item.id;
            return (
                <button
                    key={item.id}
                    onClick={() => navigateTo(item.id as AppView)}
                    className={`flex items-center w-full p-2.5 rounded-xl text-left transition-all duration-300 animate-slide-up animate-stagger-${Math.min(idx + 1, 4)} group ${isActive
                        ? 'mesh-gradient text-white shadow-lg shadow-emerald-600/20'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:pl-4'
                        }`}
                >
                    <item.icon className={`mr-3 h-5 w-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-500'}`} />
                    <span className={`font-semibold text-sm tracking-wide ${isActive ? 'text-white' : ''}`}>{item.label}</span>
                </button>
            );
        })}

        <div className="pt-4 mt-6 border-t border-slate-200/50 dark:border-slate-800/50">
            <button
                onClick={onSyncClick}
                className="flex items-center w-full p-2.5 rounded-xl text-left text-xs font-semibold text-slate-500 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all hover:pl-4 group"
            >
                <div className="mr-3 p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                    <Cloud size={14} />
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
                <header className="md:hidden glass border-b dark:border-slate-800/50 p-4 flex justify-between items-center sticky top-0 z-30">
                    <div className="flex items-center gap-3">
                        <div className="p-2 mesh-gradient rounded-xl shadow-lg shadow-emerald-500/20">
                            <TrendingUp className="text-white h-5 w-5" />
                        </div>
                        <h1 className="text-xl font-bold font-heading tracking-tight text-gradient">Crypto Portfolio</h1>
                    </div>
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-600 dark:text-slate-300"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                </header>

                {isMobileMenuOpen && (
                    <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-md md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
                        <div
                            className="absolute left-0 top-0 bottom-0 w-80 glass p-6 flex flex-col animate-in slide-in-from-left duration-500"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 mesh-gradient rounded-xl shadow-lg shadow-emerald-500/20">
                                        <TrendingUp className="text-white h-5 w-5" />
                                    </div>
                                    <h1 className="text-xl font-bold font-heading tracking-tight text-gradient">Alpha Vault</h1>
                                </div>
                                <button
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                                >
                                    <X className="h-6 w-6 text-slate-400" />
                                </button>
                            </div>

                            <NavLinks
                                currentView={currentView}
                                navigateTo={navigateTo}
                                onSyncClick={onSyncClick}
                                mobile={true}
                            />

                            <div className="pt-6 border-t dark:border-slate-800/50 space-y-3 mt-auto">
                                <div className="flex gap-3">
                                    <button
                                        onClick={onImportClick}
                                        className="flex-1 flex items-center justify-center p-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 border border-slate-200 dark:border-slate-800 transition-all font-bold text-xs"
                                    >
                                        <Upload className="h-4 w-4 mr-2" />
                                        Import
                                    </button>
                                    <button
                                        onClick={onExportClick}
                                        className="flex-1 flex items-center justify-center p-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 border border-slate-200 dark:border-slate-800 transition-all font-bold text-xs"
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Export
                                    </button>
                                </div>
                                <button
                                    onClick={toggleTheme}
                                    className="flex items-center w-full p-2.5 rounded-xl font-bold text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all"
                                >
                                    <div className="mr-3 p-1.5 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400">
                                        {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                                    </div>
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
        <aside className="w-72 glass border-r dark:border-slate-800/50 hidden md:flex flex-col h-screen sticky top-0">
            <div className="p-8 pb-10">
                <div className="flex items-center gap-3 group cursor-pointer">
                    <div className="p-2.5 mesh-gradient rounded-2xl shadow-xl shadow-emerald-500/20 transition-transform group-hover:scale-110 duration-500">
                        <TrendingUp className="text-white h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black font-heading tracking-tight text-gradient leading-none">ALPHA</h1>
                        <p className="text-[10px] font-bold text-slate-400 tracking-[0.2em] mt-1 ml-0.5">VAULT PRO</p>
                    </div>
                </div>
            </div>

            <NavLinks
                currentView={currentView}
                navigateTo={navigateTo}
                onSyncClick={onSyncClick}
            />

            <div className="p-6 pb-8 border-t dark:border-slate-800/50 space-y-3">
                <div className="flex gap-3">
                    <button
                        onClick={onImportClick}
                        className="flex-1 flex items-center justify-center p-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 border border-slate-200 dark:border-slate-800 transition-all font-bold text-xs"
                        title="Import Data"
                    >
                        <Upload className="h-4 w-4 mr-2" />
                        Import
                    </button>
                    <button
                        onClick={onExportClick}
                        className="flex-1 flex items-center justify-center p-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 border border-slate-200 dark:border-slate-800 transition-all font-bold text-xs"
                        title="Export Data"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </button>
                </div>

                <button
                    onClick={toggleTheme}
                    className="flex items-center w-full p-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all font-bold text-sm"
                >
                    <div className="mr-3 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </div>
                    {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                </button>
            </div>
        </aside>
    );
};
