import React, { useState, useEffect, useCallback } from 'react';
import {
    FolderOpen, Plus, Trash2, Edit2, Users, LayoutDashboard, ChevronRight,
    ArrowLeft, Clock, FileText, Loader2, AlertCircle, Briefcase, Lock, Globe
} from 'lucide-react';
import { WorkspaceFolder, User, SavedDashboard } from '../../types';
import { workspaceService } from '../../services/workspaceService';
import { authService } from '../../services/authService';
import { useTheme } from '../../ThemeContext';
import { getThemeClasses } from '../../theme';
import { ThemeToggle } from '../ThemeToggle';
import { ProfileMenu } from '../navbar/ProfileMenu';
import { FolderModal } from './FolderModal';

interface WorkspacePageProps {
    user: User;
    onLogout: () => void;
    onNavigateHome: () => void;
    onNavigateToAdmin?: () => void;
    onLoadDashboard: (dashboard: SavedDashboard) => void;
}

export const WorkspacePage: React.FC<WorkspacePageProps> = ({
    user,
    onLogout,
    onNavigateHome,
    onNavigateToAdmin,
    onLoadDashboard
}) => {
    const { theme } = useTheme();
    const colors = getThemeClasses(theme);

    const [folders, setFolders] = useState<WorkspaceFolder[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Folder modal state
    const [showFolderModal, setShowFolderModal] = useState(false);
    const [editingFolder, setEditingFolder] = useState<WorkspaceFolder | undefined>();

    // Active folder view (drill-in)
    const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
    const [folderDashboards, setFolderDashboards] = useState<SavedDashboard[]>([]);
    const [isDashboardsLoading, setIsDashboardsLoading] = useState(false);
    const [dashboardError, setDashboardError] = useState('');

    const activeFolder = folders.find(f => f.id === activeFolderId);

    const loadFolders = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const data = await workspaceService.getFolders(user.id);
            setFolders(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load folders');
        } finally {
            setIsLoading(false);
        }
    }, [user.id]);

    const loadAllUsers = useCallback(async () => {
        try {
            const res = await fetch(`${(await import('../../config/api')).API_BASE}/users`);
            if (res.ok) {
                const users: User[] = await res.json();
                setAllUsers(users);
            }
        } catch {
            // Non-critical
        }
    }, []);

    useEffect(() => {
        loadFolders();
        loadAllUsers();
    }, [loadFolders, loadAllUsers]);

    const handleOpenFolder = async (folder: WorkspaceFolder) => {
        setActiveFolderId(folder.id);
        setIsDashboardsLoading(true);
        setDashboardError('');
        try {
            const dashboards = await workspaceService.getFolderDashboards(folder.id, user.id);
            setFolderDashboards(dashboards);
        } catch (err: any) {
            setDashboardError(err.message || 'Failed to load dashboards');
        } finally {
            setIsDashboardsLoading(false);
        }
    };

    const handleBackToFolders = () => {
        setActiveFolderId(null);
        setFolderDashboards([]);
        setDashboardError('');
    };

    const handleCreateFolder = async (name: string, accessUserIds: number[]) => {
        await workspaceService.createFolder(user.id, name, accessUserIds);
        await loadFolders();
    };

    const handleUpdateFolder = async (name: string, accessUserIds: number[]) => {
        if (!editingFolder) return;
        await workspaceService.updateFolder(editingFolder.id, name, accessUserIds, user.id);
        await loadFolders();
    };

    const handleDeleteFolder = async (folder: WorkspaceFolder) => {
        if (!window.confirm(`Delete folder "${folder.name}"? Dashboards inside will be unlinked.`)) return;
        try {
            await workspaceService.deleteFolder(folder.id, user.id);
            if (activeFolderId === folder.id) handleBackToFolders();
            await loadFolders();
        } catch (err: any) {
            alert(err.message || 'Failed to delete folder');
        }
    };

    const openCreateModal = () => {
        setEditingFolder(undefined);
        setShowFolderModal(true);
    };

    const openEditModal = (e: React.MouseEvent, folder: WorkspaceFolder) => {
        e.stopPropagation();
        setEditingFolder(folder);
        setShowFolderModal(true);
    };

    return (
        <div className="min-h-screen flex flex-col relative overflow-x-hidden">
            {/* Background Ambience */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className={`absolute top-0 left-0 w-full h-full ${colors.gradientTop} blur-[120px] opacity-30`} />
                <div className={`absolute bottom-0 right-0 w-full h-full ${colors.gradientBottom} blur-[120px] opacity-30`} />
            </div>

            {/* Header */}
            <header className="px-4 sm:px-6 md:px-8 py-4 md:py-6 flex justify-between items-center relative z-50">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-2 sm:p-2.5 rounded-lg sm:rounded-xl shadow-lg shadow-indigo-500/20">
                        <LayoutDashboard className="text-white w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <h1 className={`text-lg sm:text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${theme === 'dark' ? 'from-white to-slate-400' : 'from-slate-900 to-slate-600'}`}>
                        AnalyticCore
                    </h1>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                    <ThemeToggle />
                    <ProfileMenu user={user} onLogout={onLogout} onNavigateToAdmin={onNavigateToAdmin} />
                </div>
            </header>

            <main className="flex-1 px-4 sm:px-6 md:px-8 pb-24 relative z-10">
                {/* Page Title Bar */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={activeFolderId ? handleBackToFolders : onNavigateHome}
                            className={`p-2 rounded-xl ${colors.bgSecondary} border ${colors.borderPrimary} ${colors.textMuted} hover:${colors.textPrimary} hover:border-indigo-500/50 transition`}
                            title={activeFolderId ? 'Back to folders' : 'Back to Home'}
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <Briefcase className={`w-5 h-5 ${colors.textMuted}`} />
                                {activeFolderId ? (
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={handleBackToFolders}
                                            className={`text-sm ${colors.textMuted} hover:text-indigo-400 transition`}
                                        >
                                            My Workspace
                                        </button>
                                        <ChevronRight className={`w-4 h-4 ${colors.textMuted}`} />
                                        <span className={`text-sm font-semibold ${colors.textPrimary}`}>
                                            {activeFolder?.name}
                                        </span>
                                    </div>
                                ) : (
                                    <h2 className={`text-xl font-bold ${colors.textPrimary}`}>My Workspace</h2>
                                )}
                            </div>
                            {!activeFolderId && (
                                <p className={`text-sm ${colors.textMuted} mt-0.5`}>
                                    Organize and share dashboards in folders
                                </p>
                            )}
                        </div>
                    </div>

                    {!activeFolderId && (
                        <button
                            onClick={openCreateModal}
                            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium text-sm transition shadow-lg shadow-indigo-900/30"
                        >
                            <Plus className="w-4 h-4" />
                            New Folder
                        </button>
                    )}
                </div>

                {/* ── Folder Grid View ── */}
                {!activeFolderId && (
                    <>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-24">
                                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                            </div>
                        ) : error ? (
                            <div className={`flex flex-col items-center justify-center py-16 border-2 border-dashed border-red-500/30 rounded-2xl`}>
                                <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
                                <p className={`${colors.textMuted}`}>{error}</p>
                                <button onClick={loadFolders} className="mt-4 text-sm text-indigo-400 hover:text-indigo-300 transition">
                                    Try again
                                </button>
                            </div>
                        ) : folders.length === 0 ? (
                            <div className={`flex flex-col items-center justify-center py-24 border-2 border-dashed ${colors.borderPrimary} rounded-3xl ${theme === 'dark' ? 'bg-slate-900/30' : 'bg-slate-100/30'}`}>
                                <div className="p-5 bg-indigo-500/10 rounded-2xl mb-5">
                                    <FolderOpen className="w-12 h-12 text-indigo-400" />
                                </div>
                                <h3 className={`text-xl font-bold ${colors.textPrimary} mb-2`}>No folders yet</h3>
                                <p className={`${colors.textMuted} text-sm mb-6 text-center max-w-sm`}>
                                    Create folders to organize your dashboards and share them with your team.
                                </p>
                                <button
                                    onClick={openCreateModal}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium text-sm transition"
                                >
                                    <Plus className="w-4 h-4" />
                                    Create your first folder
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {folders.map(folder => (
                                    <FolderCard
                                        key={folder.id}
                                        folder={folder}
                                        currentUserId={user.id}
                                        colors={colors}
                                        theme={theme}
                                        onClick={() => handleOpenFolder(folder)}
                                        onEdit={(e) => openEditModal(e, folder)}
                                        onDelete={() => handleDeleteFolder(folder)}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* ── Folder Dashboard View ── */}
                {activeFolderId && (
                    <>
                        {/* Folder Access Info */}
                        {activeFolder && (
                            <div className={`mb-5 flex flex-wrap items-center gap-3`}>
                                <div className={`flex items-center gap-2 px-3 py-1.5 ${colors.bgSecondary} border ${colors.borderPrimary} rounded-xl text-xs ${colors.textMuted}`}>
                                    {activeFolder.is_owner ? (
                                        <><Lock className="w-3 h-3" /> Owner</>
                                    ) : (
                                        <><Globe className="w-3 h-3" /> Shared with you</>
                                    )}
                                </div>
                                {activeFolder.access_users && activeFolder.access_users.length > 0 && (
                                    <div className={`flex items-center gap-2 px-3 py-1.5 ${colors.bgSecondary} border ${colors.borderPrimary} rounded-xl text-xs ${colors.textMuted}`}>
                                        <Users className="w-3 h-3" />
                                        {activeFolder.access_users.length} shared user{activeFolder.access_users.length !== 1 ? 's' : ''}
                                    </div>
                                )}
                            </div>
                        )}

                        {isDashboardsLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                            </div>
                        ) : dashboardError ? (
                            <div className={`flex flex-col items-center justify-center py-16 border-2 border-dashed border-red-500/30 rounded-2xl`}>
                                <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
                                <p className={`${colors.textMuted}`}>{dashboardError}</p>
                            </div>
                        ) : folderDashboards.length === 0 ? (
                            <div className={`flex flex-col items-center justify-center py-20 border-2 border-dashed ${colors.borderPrimary} rounded-3xl ${theme === 'dark' ? 'bg-slate-900/30' : 'bg-slate-100/30'}`}>
                                <div className="p-5 bg-indigo-500/10 rounded-2xl mb-4">
                                    <FileText className="w-10 h-10 text-indigo-400" />
                                </div>
                                <h3 className={`text-lg font-bold ${colors.textPrimary} mb-2`}>No dashboards in this folder</h3>
                                <p className={`${colors.textMuted} text-sm text-center max-w-sm`}>
                                    Save a dashboard to this folder by selecting "My Workspace" when saving.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {folderDashboards.map(dash => (
                                    <DashboardCard
                                        key={dash.id}
                                        dashboard={dash}
                                        colors={colors}
                                        theme={theme}
                                        onClick={() => onLoadDashboard(dash)}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Folder Modal */}
            {showFolderModal && (
                <FolderModal
                    mode={editingFolder ? 'edit' : 'create'}
                    existingFolder={editingFolder}
                    currentUser={user}
                    allUsers={allUsers}
                    onSave={editingFolder ? handleUpdateFolder : handleCreateFolder}
                    onClose={() => { setShowFolderModal(false); setEditingFolder(undefined); }}
                />
            )}
        </div>
    );
};

// ── Sub-components ──────────────────────────────────────────────────────────

interface FolderCardProps {
    folder: WorkspaceFolder;
    currentUserId: number;
    colors: any;
    theme: string;
    onClick: () => void;
    onEdit: (e: React.MouseEvent) => void;
    onDelete: () => void;
}

const FolderCard: React.FC<FolderCardProps> = ({ folder, currentUserId, colors, theme, onClick, onEdit, onDelete }) => {
    const isOwner = folder.is_owner;

    return (
        <div
            className={`group relative ${colors.bgSecondary} border ${colors.borderPrimary} rounded-2xl p-5 cursor-pointer hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-900/20 transition-all duration-200`}
            onClick={onClick}
        >
            {/* Owner actions */}
            {isOwner && (
                <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={onEdit}
                        className={`p-1.5 rounded-lg ${colors.textMuted} hover:text-indigo-400 hover:bg-indigo-500/10 transition`}
                        title="Edit folder"
                    >
                        <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className={`p-1.5 rounded-lg ${colors.textMuted} hover:text-red-400 hover:bg-red-500/10 transition`}
                        title="Delete folder"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            {/* Icon */}
            <div className={`w-12 h-12 rounded-2xl ${theme === 'dark' ? 'bg-indigo-500/10' : 'bg-indigo-50'} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <FolderOpen className="w-6 h-6 text-indigo-400" />
            </div>

            {/* Name */}
            <h3 className={`font-bold ${colors.textPrimary} truncate mb-1 group-hover:text-indigo-400 transition text-base`}>
                {folder.name}
            </h3>

            {/* Meta */}
            <div className="flex items-center gap-2 flex-wrap mt-2">
                {isOwner ? (
                    <span className="flex items-center gap-1 text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                        <Lock className="w-3 h-3" /> Owner
                    </span>
                ) : (
                    <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        <Globe className="w-3 h-3" /> Shared
                    </span>
                )}
                {folder.access_users && folder.access_users.length > 0 && (
                    <span className={`flex items-center gap-1 text-xs ${colors.textMuted}`}>
                        <Users className="w-3 h-3" /> {folder.access_users.length}
                    </span>
                )}
            </div>

            {/* Footer */}
            <div className={`flex items-center justify-between mt-4 pt-3 border-t ${colors.borderPrimary}`}>
                <span className={`text-xs ${colors.textMuted} flex items-center gap-1`}>
                    <Clock className="w-3 h-3" />
                    {new Date(folder.created_at).toLocaleDateString()}
                </span>
                <ChevronRight className={`w-4 h-4 ${colors.textMuted} group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all`} />
            </div>
        </div>
    );
};

interface DashboardCardProps {
    dashboard: SavedDashboard;
    colors: any;
    theme: string;
    onClick: () => void;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ dashboard, colors, theme, onClick }) => (
    <div
        className={`group relative ${colors.bgSecondary} border ${colors.borderPrimary} rounded-xl p-5 cursor-pointer hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-900/20 transition-all`}
        onClick={onClick}
    >
        <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-indigo-500/10 rounded-xl">
                <FileText className="w-5 h-5 text-indigo-400" />
            </div>
        </div>

        <h3 className={`font-bold ${colors.textPrimary} mb-1 group-hover:text-indigo-400 transition text-base leading-tight`}>
            {dashboard.name}
        </h3>
        <div className={`flex items-center gap-1.5 ${colors.textMuted} text-xs mb-4`}>
            <Clock className="w-3 h-3" />
            <span>{dashboard.date}</span>
        </div>

        <div className={`flex items-center justify-between pt-3 border-t ${colors.borderPrimary}`}>
            <span className={`text-xs font-medium ${colors.textMuted} ${colors.bgPrimary} px-2 py-0.5 rounded`}>
                {dashboard.chartConfigs?.length ?? 0} Charts
            </span>
            <div className="flex items-center gap-1 text-indigo-400 text-xs font-medium">
                Open <ChevronRight className="w-3.5 h-3.5" />
            </div>
        </div>
    </div>
);
