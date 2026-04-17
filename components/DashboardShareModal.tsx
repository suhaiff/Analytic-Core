import React, { useState, useEffect } from 'react';
import { X, Search, User as UserIcon, Shield, Trash2, Building2 } from 'lucide-react';
import { User, DashboardAccessEntry, DashboardAccessLevel } from '../types';
import { dashboardAccessService } from '../services/dashboardAccessService';
import { authService } from '../services/authService';
import { useTheme } from '../ThemeContext';

import { getThemeClasses } from '../theme';

interface DashboardShareModalProps {
    dashboardId: string;
    currentUser: User;
    onClose: () => void;
}

export const DashboardShareModal: React.FC<DashboardShareModalProps> = ({ dashboardId, currentUser, onClose }) => {
    const { theme } = useTheme();
    const colors = getThemeClasses(theme);

    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [accessList, setAccessList] = useState<DashboardAccessEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Filtered users (in same organization, excluding current user)
    const orgUsers = allUsers.filter(u => u.organization_id === currentUser.organization_id && u.id !== currentUser.id);
    
    // Users not yet granted access
    const availableUsers = orgUsers.filter(u => !accessList.some(a => a.user_id === u.id));

    // Search filtered
    const filteredAvailableUsers = availableUsers.filter(u => 
        (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        loadData();
    }, [dashboardId]);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch all users and current access list
            const [users, accessRes] = await Promise.all([
                authService.getUsers(),
                dashboardAccessService.getAccessList(dashboardId)
            ]);
            
            setAllUsers(users);
            setAccessList(accessRes);
        } catch (err: any) {
            console.error('Failed to load sharing info:', err);
            setError('Failed to load sharing information.');
        } finally {
            setLoading(false);
        }
    };


    const handleGrantAccess = async (userId: number, level: DashboardAccessLevel) => {
        try {
            setError(null);
            await dashboardAccessService.grantAccess(dashboardId, userId, level, currentUser.id);
            await loadData();
        } catch (err: any) {
            setError(err.message || 'Failed to grant access');
        }
    };

    const handleRevokeAccess = async (userId: number) => {
        try {
            setError(null);
            await dashboardAccessService.revokeAccess(dashboardId, userId, currentUser.id);
            await loadData();
        } catch (err: any) {
            setError(err.message || 'Failed to revoke access');
        }
    };


    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className={`relative w-full max-w-2xl ${colors.bgPrimary} rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border ${colors.borderPrimary}`}>
                <div className={`flex items-center justify-between p-6 border-b ${colors.borderPrimary}`}>
                    <div>
                        <h2 className={`text-xl font-bold ${colors.textPrimary}`}>Share Dashboard</h2>
                        <p className={`text-sm ${colors.textMuted} mt-1 flex items-center gap-2`}>
                            <Building2 className="w-4 h-4" /> Organization Sharing
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-xl hover:${colors.bgTertiary} ${colors.textMuted} transition`}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {error && (
                    <div className="px-6 py-3 bg-red-500/10 border-b border-red-500/20 text-red-500 text-sm font-medium">
                        {error}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 custom-scrollbar">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <>
                            {/* Current Access List */}
                            <div className="space-y-4">
                                <h3 className={`text-sm font-bold uppercase tracking-wider ${colors.textMuted}`}>People with access</h3>
                                {accessList.length === 0 ? (
                                    <div className={`text-sm ${colors.textMuted} italic`}>Only you have access.</div>
                                ) : (
                                    <div className={`border ${colors.borderPrimary} rounded-2xl overflow-hidden divide-y ${colors.borderSecondary}`}>
                                        {accessList.map((entry) => {
                                            const u = allUsers.find(user => user.id === entry.user_id);
                                            return (
                                                <div key={entry.id} className={`flex items-center justify-between p-4 ${colors.bgSecondary}`}>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full ${colors.bgTertiary} flex items-center justify-center text-indigo-500`}>
                                                            {u?.name?.charAt(0)?.toUpperCase() || <UserIcon className="w-4 h-4" />}
                                                        </div>
                                                        <div>
                                                            <div className={`text-sm font-semibold ${colors.textPrimary}`}>{u?.name || 'Unknown User'}</div>
                                                            <div className={`text-xs ${colors.textMuted}`}>{u?.email}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <select
                                                            value={entry.access_level}
                                                            onChange={(e) => handleGrantAccess(entry.user_id, e.target.value as DashboardAccessLevel)}
                                                            className={`text-xs px-2 py-1 rounded bg-transparent border ${colors.borderPrimary} ${colors.textPrimary} outline-none cursor-pointer hover:border-indigo-500`}
                                                        >
                                                            <option value="VIEW">Viewer</option>
                                                            <option value="EDIT">Editor</option>
                                                            <option value="CO_OWNER">Co-Owner</option>
                                                        </select>
                                                        <button
                                                            onClick={() => handleRevokeAccess(entry.user_id)}
                                                            className={`p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition`}
                                                            title="Remove access"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Add People */}
                            <div className="space-y-4">
                                <h3 className={`text-sm font-bold uppercase tracking-wider ${colors.textMuted}`}>Invite people in your organization</h3>
                                <div className="relative">
                                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${colors.textMuted}`} />
                                    <input
                                        type="text"
                                        placeholder="Search by name or email..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className={`w-full pl-9 pr-4 py-2 rounded-xl text-sm border ${colors.borderPrimary} ${colors.bgSecondary} ${colors.textPrimary} focus:ring-2 focus:ring-indigo-500 outline-none transition`}
                                    />
                                </div>
                                
                                {searchQuery && (
                                    <div className={`border ${colors.borderPrimary} rounded-2xl overflow-hidden divide-y ${colors.borderSecondary} max-h-60 overflow-y-auto custom-scrollbar`}>
                                        {filteredAvailableUsers.length === 0 ? (
                                            <div className={`p-4 text-sm ${colors.textMuted} text-center`}>No matching users found.</div>
                                        ) : (
                                            filteredAvailableUsers.map(u => (
                                                <div key={u.id} className={`flex items-center justify-between p-3 hover:${colors.bgSecondary} transition`}>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full ${colors.bgTertiary} flex items-center justify-center text-slate-400`}>
                                                            {u.name?.charAt(0)?.toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className={`text-sm font-medium ${colors.textPrimary}`}>{u.name}</div>
                                                            <div className={`text-xs ${colors.textMuted}`}>{u.email}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button 
                                                            onClick={() => handleGrantAccess(u.id, 'VIEW')}
                                                            className="text-xs px-3 py-1.5 rounded-lg border border-indigo-500/30 text-indigo-500 hover:bg-indigo-500 hover:text-white transition"
                                                        >
                                                            Invite as Viewer
                                                        </button>
                                                        <button 
                                                            onClick={() => handleGrantAccess(u.id, 'EDIT')}
                                                            className="text-xs px-3 py-1.5 rounded-lg border border-indigo-500/30 text-indigo-500 hover:bg-indigo-500 hover:text-white transition"
                                                        >
                                                            Invite as Editor
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
                
                <div className={`p-6 border-t ${colors.borderPrimary} bg-slate-500/5`}>
                    <button
                        onClick={onClose}
                        className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-lg shadow-indigo-900/20"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};
