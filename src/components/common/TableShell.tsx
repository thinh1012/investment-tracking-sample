import React from 'react';
import { ChevronDown } from 'lucide-react';

interface TableShellProps {
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    iconColor: string;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
    extraHeaderActions?: React.ReactNode;
    collapsedSummary?: string;
    className?: string;
    headerClassName?: string;
}

export const TableShell: React.FC<TableShellProps> = ({
    title,
    subtitle,
    icon,
    iconColor,
    isOpen,
    onToggle,
    children,
    extraHeaderActions,
    collapsedSummary,
    className = "",
    headerClassName = ""
}) => {
    return (
        <div className={`glass-card overflow-hidden ${className}`}>
            <div
                className={`px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 ${headerClassName}`}
                onClick={onToggle}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <h2 className="font-semibold text-slate-700 dark:text-slate-200 text-sm flex items-center gap-3 flex-shrink-0">
                        {title}
                        {extraHeaderActions}
                    </h2>
                    {!isOpen && collapsedSummary
                        ? <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{collapsedSummary}</p>
                        : subtitle && <p className="text-xs text-slate-400 dark:text-slate-500">{subtitle}</p>
                    }
                </div>
                <ChevronDown className={`text-slate-400 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} size={16} />
            </div>
            {isOpen && (
                <div className="overflow-x-auto">
                    {children}
                </div>
            )}
        </div>
    );
};
