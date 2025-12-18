import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
    id: string;
    type: NotificationType;
    message: string;
    duration?: number;
}

interface NotificationContextType {
    notifications: Notification[];
    addNotification: (type: NotificationType, message: string, duration?: number) => void;
    removeNotification: (id: string) => void;
    notify: {
        success: (message: string, duration?: number) => void;
        error: (message: string, duration?: number) => void;
        warning: (message: string, duration?: number) => void;
        info: (message: string, duration?: number) => void;
    };
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const removeNotification = useCallback((id: string) => {
        setNotifications((prev) => prev.filter((notification) => notification.id !== id));
    }, []);

    const addNotification = useCallback((type: NotificationType, message: string, duration = 3000) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newNotification: Notification = { id, type, message, duration };

        setNotifications((prev) => [...prev, newNotification]);

        if (duration > 0) {
            setTimeout(() => {
                removeNotification(id);
            }, duration);
        }
    }, [removeNotification]);

    const notify = {
        success: (message: string, duration?: number) => addNotification('success', message, duration),
        error: (message: string, duration?: number) => addNotification('error', message, duration),
        warning: (message: string, duration?: number) => addNotification('warning', message, duration),
        info: (message: string, duration?: number) => addNotification('info', message, duration),
    };

    return (
        <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, notify }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
                {notifications.map((notification) => (
                    <div
                        key={notification.id}
                        className={`
              pointer-events-auto transform transition-all duration-300 ease-in-out
              flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border
              animate-in slide-in-from-right fade-in
              ${notification.type === 'success' ? 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-800 text-slate-800 dark:text-slate-100' : ''}
              ${notification.type === 'error' ? 'bg-white dark:bg-slate-900 border-rose-200 dark:border-rose-800 text-slate-800 dark:text-slate-100' : ''}
              ${notification.type === 'warning' ? 'bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-800 text-slate-800 dark:text-slate-100' : ''}
              ${notification.type === 'info' ? 'bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-800 text-slate-800 dark:text-slate-100' : ''}
            `}
                    >
                        <div className={`
              flex-shrink-0
              ${notification.type === 'success' ? 'text-emerald-500' : ''}
              ${notification.type === 'error' ? 'text-rose-500' : ''}
              ${notification.type === 'warning' ? 'text-amber-500' : ''}
              ${notification.type === 'info' ? 'text-blue-500' : ''}
            `}>
                            {notification.type === 'success' && <CheckCircle size={20} />}
                            {notification.type === 'error' && <X size={20} />}
                            {notification.type === 'warning' && <AlertTriangle size={20} />}
                            {notification.type === 'info' && <Info size={20} />}
                        </div>

                        <p className="flex-1 text-sm font-medium">{notification.message}</p>

                        <button
                            onClick={() => removeNotification(notification.id)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </NotificationContext.Provider>
    );
};
