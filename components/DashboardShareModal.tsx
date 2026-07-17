import React, { useState, useEffect } from 'react';
import { X, Search, User as UserIcon, Shield, Trash2, Building2, Plus, ChevronDown, Loader2, AlertCircle, Settings } from 'lucide-react';
import { User, DashboardAccessEntry, DashboardAccessLevel, SecurityRole, SecurityRoleAssignment } from '../types';
import { dashboardAccessService } from '../services/dashboardAccessService';
import { securityRolesService } from '../services/securityRolesService';
import { authService } from '../services/authService';
import { useTheme } from '../ThemeContext';
import { getThemeClasses } from '../theme';
import { ManageSecurityRolesModal } from './ManageSecurityRolesModal';

interface DashboardShareModalProps {
    dashboardId: string;
    currentUser: User;
    dataModelColumns?: string[];
    onClose: () => void;
}

type Tab = 'access' | 'roles';

export const DashboardShareModal: React.FC<DashboardShareModalProps> = ({
    dashboardId,
    currentUser,
    dataModelColumns = [],
    onClose,
}) => {
    const { theme } = useTheme();
    const colors = getThemeClasses(theme);
    const isDark = theme === 'dark';

    // ── Tab ────────────────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState<Tab>('access');
    const [showRolesManager, setShowRolesManager] = useState(false);

    // ── Access tab state ───────────────────────────────────────────────────
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [accessList, setAccessList] = useState<DashboardAccessEntry[]>([]);
    const [loadingAccess, setLoadingAccess] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [accessError, setAccessError] = useState<string | null>(null);

    // ── Security Roles tab state ───────────────────────────────────────────
    const [securityRoles, setSecurityRoles] = useState<SecurityRole[]>([]);
    const [assignments, setAssignments] = useState<SecurityRoleAssignment[]>([]);
    const [loadingRoles, setLoadingRoles] = useState(true);
    const [rolesError, setRolesError] = useState<string | null>(null);
    const [savingAssignment, setSavingAssignment] = useState<string | null>(null); // email being updated

    // ── Derived ─────────────────────────────────────────────────────────────
    const orgUsers = allUsers.filter(u => u.organization_id === currentUser.organization_id && u.id !== currentUser.id);
    const availableUsers = orgUsers.filter(u => !accessList.some(a => a.user_id === u.id));
    const filteredAvailableUsers = availableUsers.filter(u =>
        (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // ── Load all data ─────────────────────────────────────────────────────
    useEffect(() => {
        loadAccessData();
        loadRolesData();
    }, [dashboardId]);

    const loadAccessData = async () => {
        setLoadingAccess(true);
        setAccessError(null);
        try {
            const [users, accessRes] = await Promise.all([
                authService.getUsers(),
                dashboardAccessService.getAccessList(dashboardId),
            ]);
            setAllUsers(users);
            setAccessList(accessRes);
        } catch (err: any) {
            setAccessError('Failed to load sharing information.');
        } finally {
            setLoadingAccess(false);
        }
    };

    const loadRolesData = async () => {
        setLoadingRoles(true);
        setRolesError(null);
        try {
            const [roles, assigns] = await Promise.all([
                securityRolesService.getRoles(dashboardId),
                securityRolesService.getAssignments(dashboardId),
            ]);
            setSecurityRoles(roles);
            setAssignments(assigns);
        } catch (err: any) {
            setRolesError('Failed to load security roles.');
        } finally {
            setLoadingRoles(false);
        }
    };

    // ── Access actions ─────────────────────────────────────────────────────
    const handleGrantAccess = async (userId: number, level: DashboardAccessLevel) => {
        try {
            setAccessError(null);
            await dashboardAccessService.grantAccess(dashboardId, userId, level, currentUser.id);
            await loadAccessData();
        } catch (err: any) {
            setAccessError(err.message || 'Failed to grant access');
        }
    };

    const handleRevokeAccess = async (userId: number) => {
        try {
            setAccessError(null);
            await dashboardAccessService.revokeAccess(dashboardId, userId, currentUser.id);
            await loadAccessData();
        } catch (err: any) {
            setAccessError(err.message || 'Failed to revoke access');
        }
    };

    // ── Security Role assignment actions ──────────────────────────────────
    const getAssignmentForEmail = (email: string) =>
        assignments.find(a => a.user_email.toLowerCase() === email.toLowerCase());

    const handleAssignRole = async (userEmail: string, roleId: string | null) => {
        setSavingAssignment(userEmail);
        setRolesError(null);
        try {
            if (!roleId) {
                // Remove assignment
                const existing = getAssignmentForEmail(userEmail);
                if (existing) {
                    await securityRolesService.removeAssignment(dashboardId, existing.id);
                }
            } else {
                await securityRolesService.assignRole(dashboardId, userEmail, roleId, currentUser.id);
            }
            await loadRolesData();
        } catch (err: any) {
            setRolesError(err.message || 'Failed to update role assignment');
        } finally {
            setSavingAssignment(null);
        }
    };

    // ── Shared styles ──────────────────────────────────────────────────────
    const borderCol = isDark ? 'border-slate-700' : 'border-slate-200';
    const tabBase = `px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors cursor-pointer`;
    const tabActive = isDark
        ? 'border-indigo-400 text-indigo-300'
        : 'border-indigo-600 text-indigo-700';
    const tabInactive = `border-transparent ${colors.textMuted} hover:${colors.textSecondary}`;

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                <div className={`relative w-full max-w-2xl ${colors.bgPrimary} rounded-3xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden border ${borderCol}`}>

                    {/* ── Header ─────────────────────────────────────────── */}
                    <div className={`flex items-center justify-between p-6 border-b ${borderCol}`}>
                        <div>
                            <h2 className={`text-xl font-bold ${colors.textPrimary}`}>Share Dashboard</h2>
                            <p className={`text-sm ${colors.textMuted} mt-1 flex items-center gap-2`}>
                                <Building2 className="w-4 h-4" /> Organization Sharing
                            </p>
                        </div>
                        <button onClick={onClose} className={`p-2 rounded-xl hover:${colors.bgTertiary} ${colors.textMuted} transition`}>
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* ── Tabs ───────────────────────────────────────────── */}
                    <div className={`flex border-b ${borderCol} px-6`}>
                        <button
                            className={`${tabBase} ${activeTab === 'access' ? tabActive : tabInactive}`}
                            onClick={() => setActiveTab('access')}
                        >
                            <div className="flex items-center gap-2">
                                <UserIcon className="w-4 h-4" />
                                Access
                            </div>
                        </button>
                        <button
                            className={`${tabBase} ${activeTab === 'roles' ? tabActive : tabInactive}`}
                            onClick={() => setActiveTab('roles')}
                        >
                            <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                Security Roles
                                {securityRoles.length > 0 && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold
                                        ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
                                        {securityRoles.length}
                                    </span>
                                )}
                            </div>
                        </button>
                    </div>

                    {/* ── Body ───────────────────────────────────────────── */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">

                        {/* ── ACCESS TAB ─────────────────────────────────── */}
                        {activeTab === 'access' && (
                            <div className="p-6 flex flex-col gap-8">
                                {accessError && (
                                    <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        {accessError}
                                    </div>
                                )}

                                {loadingAccess ? (
                                    <div className="flex justify-center py-12">
                                        <Loader2 className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                                    </div>
                                ) : (
                                    <>
                                        {/* People with access */}
                                        <div className="space-y-4">
                                            <h3 className={`text-sm font-bold uppercase tracking-wider ${colors.textMuted}`}>People with access</h3>
                                            {accessList.length === 0 ? (
                                                <div className={`text-sm ${colors.textMuted} italic`}>Only you have access.</div>
                                            ) : (
                                                <div className={`border ${borderCol} rounded-2xl overflow-hidden divide-y ${isDark ? 'divide-slate-700' : 'divide-slate-200'}`}>
                                                    {accessList.map((entry) => {
                                                        const u = allUsers.find(user => user.id === entry.user_id);
                                                        const assignment = getAssignmentForEmail(u?.email || '');
                                                        const assignedRole = assignment ? securityRoles.find(r => r.id === assignment.security_role_id) : null;

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
                                                                <div className="flex items-center gap-2">
                                                                    {/* Access level */}
                                                                    <select
                                                                        value={entry.access_level}
                                                                        onChange={(e) => handleGrantAccess(entry.user_id, e.target.value as DashboardAccessLevel)}
                                                                        className={`text-xs px-2 py-1 rounded bg-transparent border ${borderCol} ${colors.textPrimary} outline-none cursor-pointer hover:border-indigo-500`}
                                                                    >
                                                                        <option value="VIEW">Viewer</option>
                                                                        <option value="EDIT">Editor</option>
                                                                        <option value="CO_OWNER">Co-Owner</option>
                                                                    </select>
                                                                    {/* Security role badge (read-only hint) */}
                                                                    {assignedRole && (
                                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border flex items-center gap-1
                                                                            ${isDark ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-700'}`}>
                                                                            <Shield className="w-2.5 h-2.5" />
                                                                            {assignedRole.name}
                                                                        </span>
                                                                    )}
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
                                                    className={`w-full pl-9 pr-4 py-2 rounded-xl text-sm border ${borderCol} ${colors.bgSecondary} ${colors.textPrimary} focus:ring-2 focus:ring-indigo-500 outline-none transition`}
                                                />
                                            </div>

                                            {searchQuery && (
                                                <div className={`border ${borderCol} rounded-2xl overflow-hidden divide-y ${isDark ? 'divide-slate-700' : 'divide-slate-200'} max-h-60 overflow-y-auto custom-scrollbar`}>
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
                        )}

                        {/* ── SECURITY ROLES TAB ─────────────────────────── */}
                        {activeTab === 'roles' && (
                            <div className="p-6 space-y-6">
                                {/* Header row */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className={`text-sm font-bold ${colors.textPrimary}`}>Row-Level Security</h3>
                                        <p className={`text-xs ${colors.textMuted} mt-0.5`}>
                                            Assign a security role to each shared user to control which rows they see.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setShowRolesManager(true)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition
                                            ${isDark ? 'border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10' : 'border-indigo-200 text-indigo-700 hover:bg-indigo-50'}`}
                                    >
                                        <Settings className="w-3.5 h-3.5" />
                                        Manage Roles
                                    </button>
                                </div>

                                {rolesError && (
                                    <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        {rolesError}
                                    </div>
                                )}

                                {loadingRoles || loadingAccess ? (
                                    <div className="flex justify-center py-12">
                                        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                                    </div>
                                ) : securityRoles.length === 0 ? (
                                    /* No roles created yet */
                                    <div className={`flex flex-col items-center gap-4 py-12 rounded-2xl border border-dashed text-center
                                        ${isDark ? 'border-slate-700 text-slate-500' : 'border-slate-200 text-slate-400'}`}>
                                        <Shield className="w-10 h-10 opacity-30" />
                                        <div>
                                            <p className="text-sm font-semibold">No security roles defined</p>
                                            <p className="text-xs mt-1">Create roles first to control which data each user can see.</p>
                                        </div>
                                        <button
                                            onClick={() => setShowRolesManager(true)}
                                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition shadow-lg shadow-indigo-900/30"
                                        >
                                            <Plus className="w-4 h-4" /> Create Security Roles
                                        </button>
                                    </div>
                                ) : accessList.length === 0 ? (
                                    <div className={`text-sm ${colors.textMuted} italic text-center py-8`}>
                                        Share this dashboard with users first (Access tab), then assign roles here.
                                    </div>
                                ) : (
                                    /* Shared users list with role assignment */
                                    <div className={`border ${borderCol} rounded-2xl overflow-hidden divide-y ${isDark ? 'divide-slate-700' : 'divide-slate-200'}`}>
                                        {/* Table header */}
                                        <div className={`grid grid-cols-[1fr_1fr_160px] gap-4 px-4 py-2 text-[10px] font-bold uppercase tracking-wider
                                            ${isDark ? 'bg-slate-800/60 text-slate-500' : 'bg-slate-50 text-slate-400'}`}>
                                            <span>User</span>
                                            <span>Email</span>
                                            <span>Security Role</span>
                                        </div>

                                        {accessList.map(entry => {
                                            const u = allUsers.find(user => user.id === entry.user_id);
                                            const email = u?.email || '';
                                            const assignment = getAssignmentForEmail(email);
                                            const currentRoleId = assignment?.security_role_id || '';
                                            const isSaving = savingAssignment === email;

                                            return (
                                                <div key={entry.id} className={`grid grid-cols-[1fr_1fr_160px] gap-4 items-center px-4 py-3 ${colors.bgSecondary}`}>
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className={`w-7 h-7 rounded-full flex-shrink-0 ${colors.bgTertiary} flex items-center justify-center text-xs font-bold text-indigo-500`}>
                                                            {u?.name?.charAt(0)?.toUpperCase() || '?'}
                                                        </div>
                                                        <span className={`text-sm font-medium truncate ${colors.textPrimary}`}>{u?.name || 'Unknown'}</span>
                                                    </div>
                                                    <span className={`text-xs truncate ${colors.textMuted}`}>{email}</span>

                                                    {/* Role dropdown */}
                                                    <div className="relative">
                                                        {isSaving ? (
                                                            <div className="flex items-center justify-center h-8">
                                                                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                                                            </div>
                                                        ) : (
                                                            <div className="relative">
                                                                <select
                                                                    value={currentRoleId}
                                                                    onChange={e => handleAssignRole(email, e.target.value || null)}
                                                                    className={`w-full appearance-none text-xs px-3 pr-7 py-2 rounded-lg border outline-none transition font-medium
                                                                        ${currentRoleId
                                                                            ? isDark ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                                                            : isDark ? 'bg-slate-800 border-slate-600 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
                                                                        }`}
                                                                >
                                                                    <option value="">None (full data)</option>
                                                                    {securityRoles.map(r => (
                                                                        <option key={r.id} value={r.id}>{r.name}</option>
                                                                    ))}
                                                                </select>
                                                                <ChevronDown className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 ${currentRoleId ? 'text-indigo-400' : colors.textMuted}`} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* How it works note */}
                                {securityRoles.length > 0 && (
                                    <div className={`flex items-start gap-3 p-4 rounded-xl border text-xs
                                        ${isDark ? 'bg-slate-800/60 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                                        <Shield className="w-4 h-4 flex-shrink-0 mt-0.5 text-indigo-400" />
                                        <div className="space-y-1">
                                            <p className="font-semibold">How it works</p>
                                            <p>When a user with an assigned role opens this dashboard, the app automatically filters all chart data to match only the rows that satisfy their role's rules.</p>
                                            <p>Users with <strong>None</strong> selected will see the complete dataset.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ── Footer ─────────────────────────────────────────── */}
                    <div className={`p-6 border-t ${borderCol} bg-slate-500/5`}>
                        <button
                            onClick={onClose}
                            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-lg shadow-indigo-900/20"
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Manage Security Roles sub-modal ────────────────────── */}
            {showRolesManager && (
                <ManageSecurityRolesModal
                    dashboardId={dashboardId}
                    columns={dataModelColumns}
                    currentUserId={currentUser.id}
                    onClose={() => {
                        setShowRolesManager(false);
                        loadRolesData(); // refresh after editing roles
                    }}
                />
            )}
        </>
    );
};
