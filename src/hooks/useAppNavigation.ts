import { useState, useEffect } from 'react';

export type AppView = 'dashboard' | 'analytics' | 'notes' | 'watchlist' | 'market-picks' | 'settings';

export const useAppNavigation = () => {
    const [currentView, setCurrentView] = useState<AppView>('dashboard');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        return localStorage.getItem('theme') === 'dark' ||
            (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    });
    const [locale] = useState(() => localStorage.getItem('investment_tracker_locale') || 'en-US');

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    const toggleTheme = () => setIsDarkMode(!isDarkMode);

    const navigateTo = (view: AppView) => {
        setCurrentView(view);
        setIsMobileMenuOpen(false);
    };

    return {
        currentView,
        setCurrentView,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        isDarkMode,
        toggleTheme,
        locale,
        navigateTo
    };
};
