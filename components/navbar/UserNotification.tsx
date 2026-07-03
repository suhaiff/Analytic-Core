import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle2, Clock, XCircle, X } from 'lucide-react';
import { useTheme } from '../../ThemeContext';
import { getThemeClasses } from '../../theme';
import { User as UserType } from '../../types';

interface UserNotificationProps {
    user: UserType | null;
}

export const UserNotification: React.FC<UserNotificationProps> = ({ user }) => {
    const { theme } = useTheme();
    const colors = getThemeClasses(theme);
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const fetchNotifications = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { API_BASE } = await import('../../config/api');
            const res = await fetch(`${API_BASE}/payment-requests/user/${user.id}`);
            if (res.ok) {
                const data = await res.json();
                setNotifications(data || []);
            }
        } catch (error) {
            console.error('Failed to load user notifications', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchNotifications();
            // Poll every 30 seconds
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const toggleOpen = () => {
        const newState = !isOpen;
        setIsOpen(newState);
        if (newState) {
            fetchNotifications();
        }
    };

    if (!user) return null;

    // We can count PENDING as action items, or APPROVED/REJECTED as new ones if we had a "read" status.
    // For now, let's just show a dot if there are any notifications, or specifically PENDING/recently updated.
    const hasActiveNotifications = notifications.length > 0;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={toggleOpen}
                className={`p-2 rounded-xl transition-all duration-300 relative ${
                    isOpen 
                        ? `${colors.bgTertiary} shadow-inner` 
                        : `hover:${colors.bgTertiary} text-slate-500 hover:text-indigo-500`
                }`}
            >
                <Bell className="w-5 h-5" />
                {hasActiveNotifications && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
                )}
            </button>

            {isOpen && (
                <div className={`absolute right-0 mt-3 w-80 origin-top-right z-[100] animate-fade-in-up`}>
                    <div className={`${theme === 'dark' ? 'bg-slate-900' : 'bg-white'} backdrop-blur-2xl rounded-2xl overflow-hidden shadow-2xl border ${colors.borderPrimary}`}>
                        <div className={`p-4 border-b ${colors.borderPrimary} flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50`}>
                            <div>
                                <h3 className={`font-bold ${colors.textPrimary}`}>Notifications</h3>
                                <p className={`text-xs ${colors.textMuted}`}>Your payment requests</p>
                            </div>
                            <button onClick={() => setIsOpen(false)} className={`p-1 rounded-lg hover:${colors.bgTertiary} ${colors.textMuted}`}>
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <div className="max-h-96 overflow-y-auto custom-scrollbar p-2 space-y-2">
                            {loading && notifications.length === 0 ? (
                                <div className={`p-4 text-center text-xs ${colors.textMuted}`}>Loading...</div>
                            ) : notifications.length === 0 ? (
                                <div className={`p-8 text-center text-xs ${colors.textMuted}`}>
                                    <Bell className="w-8 h-8 mx-auto mb-3 opacity-20" />
                                    No notifications yet.
                                </div>
                            ) : (
                                notifications.map(req => (
                                    <div key={req.id} className={`p-3 rounded-xl border ${colors.borderSecondary} ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-50'} hover:border-indigo-500/30 transition-colors`}>
                                        <div className="flex items-start justify-between mb-1.5">
                                            <div className="flex items-center gap-1.5">
                                                {req.status === 'PENDING' && <Clock className="w-3.5 h-3.5 text-amber-500" />}
                                                {req.status === 'APPROVED' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                                                {req.status === 'REJECTED' && <XCircle className="w-3.5 h-3.5 text-red-500" />}
                                                <span className={`text-xs font-bold ${
                                                    req.status === 'PENDING' ? 'text-amber-500' :
                                                    req.status === 'APPROVED' ? 'text-emerald-500' : 'text-red-500'
                                                }`}>
                                                    {req.status}
                                                </span>
                                            </div>
                                            <span className={`text-[10px] ${colors.textMuted}`}>
                                                {new Date(req.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        
                                        <div className={`text-sm font-semibold ${colors.textPrimary}`}>
                                            {req.plan_name || req.plan_type} Plan Update
                                        </div>
                                        <div className={`text-xs ${colors.textMuted} mt-0.5`}>
                                            Amount: ₹{parseFloat(req.amount).toLocaleString()}
                                        </div>
                                        
                                        {req.admin_note && (
                                            <div className="mt-2 p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                                                <p className="text-[10px] font-bold text-indigo-400 mb-0.5">Admin Note:</p>
                                                <p className={`text-xs ${colors.textSecondary}`}>{req.admin_note}</p>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
