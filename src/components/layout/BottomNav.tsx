import React from 'react';
import { LayoutDashboard, BarChart3, BookOpen, Settings } from 'lucide-react';
import { AppView } from '../../hooks/useAppNavigation';

interface BottomNavProps {
    currentView: AppView;
    navigateTo: (view: AppView) => void;
}

const tabs = [
    { id: 'dashboard' as AppView, icon: LayoutDashboard, label: 'Positions' },
    { id: 'analytics' as AppView, icon: BarChart3, label: 'Earnings' },
    { id: 'notes' as AppView, icon: BookOpen, label: 'Notes' },
    { id: 'settings' as AppView, icon: Settings, label: 'Settings' },
];

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, navigateTo }) => {
    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex">
            {tabs.map(({ id, icon: Icon, label }) => {
                const isActive = currentView === id;
                return (
                    <button
                        key={id}
                        onClick={() => navigateTo(id)}
                        className={`flex-1 flex flex-col items-center justify-center py-2 gap-1 text-xs font-medium transition-colors ${
                            isActive
                                ? 'text-indigo-500'
                                : 'text-slate-400 dark:text-slate-500'
                        }`}
                    >
                        <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                        <span>{label}</span>
                    </button>
                );
            })}
        </nav>
    );
};
