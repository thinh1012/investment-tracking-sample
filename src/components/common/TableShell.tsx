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
    className = "",
    headerClassName = ""
}) => {
    return (
        <div className={`glass-card overflow-hidden animate-slide-up duration-500 group/shell ${className}`}>
            <div
                className={`p-4 md:p-8 border-b border-slate-100 dark:border-slate-800/50 flex justify-between items-center cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all duration-500 ${headerClassName}`}
                onClick={onToggle}
            >
                <div className="flex items-center gap-4">
                    <div className={`p-2.5 bg-${iconColor}-500/10 rounded-2xl group-hover/shell:scale-110 transition-transform duration-500`}>
                        {React.isValidElement(icon) ? React.cloneElement(icon as any, { className: `text-${iconColor}-500`, size: 24 }) : icon}
                    </div>
                    <div>
                        <h2 className="font-black text-slate-800 dark:text-slate-100 text-xl font-heading tracking-tight flex items-center gap-3">
                            {title}
                            {extraHeaderActions}
                        </h2>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">{subtitle}</p>
                    </div>
                </div>
                <div className={`p-2 rounded-xl transition-all duration-300 ${isOpen ? 'bg-slate-100 dark:bg-slate-800 rotate-180' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                    <ChevronDown className="text-slate-400" size={20} />
                </div>
            </div>
            {isOpen && (
                <div className="overflow-x-auto">
                    {children}
                </div>
            )}
        </div>
    );
};
