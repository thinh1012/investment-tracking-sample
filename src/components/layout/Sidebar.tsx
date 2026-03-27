import React, { useState } from 'react';
import {
    LayoutDashboard, BarChart3, BookOpen,
    Settings as LucideSettings, Menu, X, Sun, Moon,
    Upload, Download, TrendingUp
} from 'lucide-react';


import { AppView } from '../../hooks/useAppNavigation';
import { useNotification } from '../../context/NotificationContext';

interface SidebarProps {
    currentView: AppView;
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (open: boolean) => void;
    isDarkMode: boolean;
    toggleTheme: () => void;
    navigateTo: (view: AppView) => void;
    onImportClick: () => void;
    onExportClick: () => void;
    isMobile?: boolean;
    useRabbyUI?: boolean;
    toggleRabbyUI?: () => void;
}

// Nav links component (extracted for reuse)
const NavLinks: React.FC<{
    currentView: AppView;
    navigateTo: (view: AppView) => void;
    mobile?: boolean;
}> = ({ currentView, navigateTo, mobile }) => {
    const { notify } = useNotification();

    return (
        <nav className={`flex-1 ${mobile ? 'p-0' : 'p-4'} space-y-1.5`}>
            {[
                { id: 'dashboard', icon: LayoutDashboard, label: 'LP Positions' },
                { id: 'analytics', icon: BarChart3, label: 'Earnings' },
                { id: 'notes', icon: BookOpen, label: 'Notes & Dictionary' },
            ].filter(item => !mobile || ['dashboard', 'analytics', 'notes'].includes(item.id)).map((item) => {
                const isActive = currentView === item.id;
                return (
                    <button
                        key={item.id}
                        onClick={() => navigateTo(item.id as AppView)}
                        className={`flex items-center w-full p-2.5 rounded-lg text-left group ${isActive
                            ? 'bg-indigo-500 text-white'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                            }`}
                    >
                        <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-500'}`} />
                        <span className={`font-medium text-sm ${isActive ? 'text-white' : ''}`}>{item.label}</span>
                    </button>
                );
            })}

            {/* Settings */}
            <button
                onClick={() => navigateTo('settings')}
                className={`flex items-center w-full p-2.5 rounded-lg text-left group ${currentView === 'settings'
                    ? 'bg-indigo-500 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                    }`}
            >
                <LucideSettings className={`mr-3 h-5 w-5 ${currentView === 'settings' ? 'text-white' : 'text-slate-400 group-hover:text-indigo-500'}`} />
                <span className={`font-medium text-sm ${currentView === 'settings' ? 'text-white' : ''}`}>Settings</span>
            </button>

        </nav>
    );
};

export const Sidebar: React.FC<SidebarProps> = (props) => {
    const {
        currentView, isMobileMenuOpen, setIsMobileMenuOpen,
        isDarkMode, toggleTheme, navigateTo,
        onImportClick, onExportClick, useRabbyUI, toggleRabbyUI
    } = props;

    // Mobile Header
    if (props.isMobile) {
        return (
            <>
                <header className="md:hidden glass border-b dark:border-slate-800/50 p-4 flex justify-between items-center sticky top-0 z-30">
                    <div className="flex items-center gap-3">
                        <div className="p-2 mesh-gradient rounded-lg">
                            <TrendingUp className="text-white h-5 w-5" />
                        </div>
                        <span className="font-bold text-2xl text-slate-800 dark:text-slate-100 tracking-tight">Investment Tracking</span>
                    </div>
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                </header>

                {isMobileMenuOpen && (
                    <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-md md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
                        <div
                            className="absolute left-0 top-0 bottom-0 w-80 glass p-6 flex flex-col"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="p-1.5 mesh-gradient rounded-lg">
                                    <TrendingUp className="text-white h-4 w-4" />
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
                                mobile={true}
                            />

                            <div className="pt-6 border-t dark:border-slate-800/50 space-y-3 mt-auto">
                                <div className="flex gap-3">
                                    <button
                                        onClick={onImportClick}
                                        className="flex-1 flex items-center justify-center p-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 border border-slate-200 dark:border-slate-800 font-bold text-xs"
                                    >
                                        <Upload className="h-4 w-4 mr-2" />
                                        Import
                                    </button>
                                    <button
                                        onClick={onExportClick}
                                        className="flex-1 flex items-center justify-center p-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 border border-slate-200 dark:border-slate-800 font-bold text-xs"
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Export
                                    </button>
                                </div>
                                <button
                                    onClick={toggleTheme}
                                    className="flex items-center w-full p-2.5 rounded-xl font-bold text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50"
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

    // Desktop Sidebar - Professional fintech design
    return (
        <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col h-screen sticky top-0">
            <div className="p-5">
                <div className="p-2 bg-indigo-500 rounded-lg w-fit">
                    <TrendingUp className="text-white h-5 w-5" />
                </div>
            </div>

            <NavLinks
                currentView={currentView}
                navigateTo={navigateTo}
            />

            <div className="p-4 border-t dark:border-slate-800/50 flex items-center gap-2">
                <button
                    onClick={onImportClick}
                    className="flex items-center justify-center p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Import Data"
                >
                    <Upload className="h-4 w-4" />
                </button>
                <button
                    onClick={onExportClick}
                    className="flex items-center justify-center p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Export Data"
                >
                    <Download className="h-4 w-4" />
                </button>
                <div className="flex-1" />
                <button
                    onClick={toggleTheme}
                    className="flex items-center justify-center p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
                >
                    {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
            </div>
        </aside>
    );
};
