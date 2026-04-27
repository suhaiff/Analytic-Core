import React, { useState, useRef } from 'react';
import { Upload, FileText, Clock, LayoutDashboard, Sparkles, ChevronRight, FileSpreadsheet, Trash2, FolderOpen, PlusCircle, Settings, LogOut, Database, Globe, X, Info, BarChart3, Briefcase, Plus, Edit2, Lock, Users, ArrowLeft, Hourglass, RefreshCw, Brain } from 'lucide-react';
import { SavedDashboard, User, WorkspaceFolder, AccessLevel, DashboardAccessLevel, RefreshSchedule } from '../types';
import { workspaceService } from '../services/workspaceService';
import { authService } from '../services/authService';
import { dashboardAccessService } from '../services/dashboardAccessService';
import { scheduledRefreshService } from '../services/scheduledRefreshService';
import { FolderModal } from './workspace/FolderModal';
import { ScheduledRefreshModal } from './workspace/ScheduledRefreshModal';
import { dashboardService } from '../services/dashboardService';
import { Footer } from './Footer';

const DashboardCard = ({ dash, colors, theme, onLoad, onDelete, onRename, user, onScheduleClick, scheduleMap }: { 
  dash: SavedDashboard, 
  colors: any, 
  theme: string, 
  onLoad: (d: SavedDashboard, role?: AccessLevel | null) => void, 
  onDelete?: (id: string) => void, 
  onRename?: (id: string, newName: string) => Promise<void>,
  key?: string, 
  user?: User | null, 
  onScheduleClick?: (dash: SavedDashboard) => void, 
  scheduleMap?: Record<string, RefreshSchedule> 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(dash.name);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleClickTimer = useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    return () => {
      // Cleanup timer on unmount
      if (titleClickTimer.current) clearTimeout(titleClickTimer.current);
    };
  }, []);


  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleRename = async () => {
    const trimmedName = editName.trim();
    if (!trimmedName || trimmedName === dash.name) {
      setIsEditing(false);
      setEditName(dash.name);
      return;
    }

    if (onRename) {
      setIsSaving(true);
      try {
        await onRename(dash.id, trimmedName);
        setIsEditing(false);
      } catch (err) {
        setEditName(dash.name);
        setIsEditing(false);
      } finally {
        setIsSaving(false);
      }
    } else {
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleRename();
    if (e.key === 'Escape') {
      setIsEditing(false);
      setEditName(dash.name);
    }
  };

  const isLiveSource = ['google_sheet', 'sql_database', 'sharepoint'].includes(dash.dataModel?.sourceType || '');
  const canManageSchedule = user && (user.role === 'ADMIN' || user.is_superuser || dash.user_id === user.id);
  const showScheduleBtn = isLiveSource && canManageSchedule;
  // Merge schedule from local map (overrides prop-level schedule)
  const schedule = scheduleMap?.[dash.id] ?? dash.refresh_schedule ?? null;

  return (
  <div
    className={`dashboard-card-hover group relative overflow-hidden rounded-2xl border ${colors.borderPrimary} ${colors.bgSecondary} premium-shadow premium-shadow-hover p-5 sm:p-6 cursor-pointer`}
    onClick={() => onLoad(dash)}
  >
    {/* Background accent glow */}
    <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-indigo-500/5 blur-3xl transition-all group-hover:bg-indigo-500/10" />
    
    {/* Top-right action buttons */}
    <div className="absolute top-4 right-4 z-20 flex items-center gap-1">
      {showScheduleBtn && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onScheduleClick?.(dash);
          }}
          className={`p-2 ${colors.textMuted} hover:text-amber-400 hover:bg-amber-400/10 rounded-xl transition duration-300 backdrop-blur-md border border-transparent hover:border-amber-500/20 ${
            schedule ? 'text-amber-400/70' : ''
          }`}
          title={schedule ? 'Manage scheduled refresh' : 'Set up scheduled refresh'}
        >
          <Hourglass className={`w-4 h-4 ${schedule?.is_active ? 'animate-pulse' : ''}`} />
        </button>
      )}
      {onDelete && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(dash.id);
          }}
          className={`p-2 ${colors.textMuted} hover:text-red-400 hover:bg-red-400/10 rounded-xl transition duration-300 backdrop-blur-md border border-transparent hover:border-red-500/20`}
          title="Delete dashboard"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>

    <div className="flex justify-between items-start mb-5">
      <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-violet-500/20 rounded-xl border border-indigo-500/10">
        <FileText className="w-6 h-6 text-indigo-400" />
      </div>
      {dash.shared_access_level && (
        <span className={`px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider font-bold border ${
          dash.shared_access_level === 'CO_OWNER' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
          dash.shared_access_level === 'EDIT' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
          'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
        }`}>
          {dash.shared_access_level === 'CO_OWNER' ? 'Co-Owner' : dash.shared_access_level === 'EDIT' ? 'Editor' : 'Viewer'}
        </span>
      )}
    </div>

    <div className="space-y-1 mb-6">
      <div 
        className="relative group/title"
        onClick={(e) => {
          e.stopPropagation();
          if (isEditing) return;
          
          if (titleClickTimer.current) {
            clearTimeout(titleClickTimer.current);
            titleClickTimer.current = null;
            // This is a double click
            const canEdit = !dash.shared_access_level || dash.shared_access_level === 'EDIT' || dash.shared_access_level === 'CO_OWNER';
            if (canEdit) setIsEditing(true);
          } else {
            // First click: set timer
            titleClickTimer.current = setTimeout(() => {
              onLoad(dash);
              titleClickTimer.current = null;
            }, 250);
          }
        }}
      >
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={handleKeyDown}
            disabled={isSaving}
            className={`w-full bg-transparent border-b-2 border-indigo-500 text-lg font-bold ${colors.textPrimary} outline-none py-0.5 animate-pulse-subtle`}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <h3 className={`text-lg font-bold ${colors.textPrimary} group-hover:text-indigo-400 transition-colors duration-300 line-clamp-1`}>
            {dash.name}
          </h3>
        )}
      </div>


      <div className={`flex items-center gap-2 ${colors.textMuted} text-xs font-medium`}>
        <Clock className="w-3.5 h-3.5" />
        <span>{dash.date}</span>
        {dash.owner_name && (
          <>
            <span className="opacity-40">•</span>
            <span className="line-clamp-1 text-indigo-400/80">by {dash.owner_name}</span>
          </>
        )}
      </div>
    </div>

    <div className={`flex items-center justify-between pt-4 border-t ${colors.borderPrimary}`}>
      <div className="flex items-center gap-1.5">
        <BarChart3 className="w-3.5 h-3.5 text-indigo-500/70" />
        <span className={`text-xs font-bold ${colors.textMuted}`}>
          {dash.chartConfigs.length} <span className="font-medium opacity-70">Charts</span>
        </span>
      </div>
      {schedule?.last_refreshed_at ? (
        <div className={`flex items-center gap-1.5 text-[10px] font-medium ${colors.textMuted}`} title={`Last refreshed: ${new Date(schedule.last_refreshed_at).toLocaleString()}`}>
          <RefreshCw className={`w-3 h-3 ${schedule.last_refresh_status === 'success' ? 'text-green-400' : schedule.last_refresh_status === 'failed' ? 'text-red-400' : 'text-amber-400'}`} />
          <span>{new Date(schedule.last_refreshed_at).toLocaleDateString()} {new Date(schedule.last_refreshed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-bold tracking-wide uppercase group-hover:translate-x-1 transition-transform duration-300">
          Open <ChevronRight className="w-4 h-4" />
        </div>
      )}
    </div>
  </div>
  );
};


import { useTheme } from '../ThemeContext';
import { getThemeClasses } from '../theme';
import { ThemeToggle } from './ThemeToggle';
import { fileService } from '../services/fileService';
import { ProfileMenu } from './navbar/ProfileMenu';
import { GoogleSheetsImportModal } from './modals/GoogleSheetsImportModal';
import { SqlDatabaseImportModal } from './modals/SqlDatabaseImportModal';
import { SharePointImportModal } from './modals/SharePointImportModal';

interface LandingProps {
  onFileUpload: (file: File) => void;
  onGoogleSheetImport: (sheets: { id: number, name: string, data: any[][], fileId: number }[], title: string, spreadsheetId: string) => void;
  onSharePointImport: (siteId: string, listId: string, listName: string, data: any[][], siteName: string, fileId: number) => void;
  onSqlDatabaseImport: (tables: { id: number, name: string, data: any[][], fileId: number }[], title: string, connectionId: string) => void;
  savedDashboards: SavedDashboard[];
  onLoadDashboard: (dashboard: SavedDashboard) => void;
  onDeleteDashboard: (id: string) => void;
  onLogout: () => void;
  onNavigateToAdmin?: () => void;
  onNavigateToMLModels?: () => void;
  workspaceFolders?: WorkspaceFolder[];
  onFoldersChange?: () => void;
  onDashboardsChange?: () => void;
  user: User | null;
}


export const Landing: React.FC<LandingProps> = ({ onFileUpload, onGoogleSheetImport, onSharePointImport, onSqlDatabaseImport, savedDashboards, onLoadDashboard, onDeleteDashboard, onLogout, onNavigateToAdmin, onNavigateToMLModels, workspaceFolders = [], onFoldersChange, onDashboardsChange, user }) => {
  const { theme } = useTheme();
  const colors = getThemeClasses(theme);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<'NEW' | 'SAVED'>('NEW');

  // Sidebar & Folder State
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [folderDashboards, setFolderDashboards] = useState<SavedDashboard[]>([]);
  const [isDashboardsLoading, setIsDashboardsLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState('');
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<WorkspaceFolder | undefined>();
  const [currentFolderRole, setCurrentFolderRole] = useState<AccessLevel | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [sharedDashboards, setSharedDashboards] = useState<SavedDashboard[]>([]);
  const [loadingShared, setLoadingShared] = useState(false);
  const [activeSection, setActiveSection] = useState<'MY' | 'SHARED'>('MY');

  // Scheduled Refresh State
  const [scheduleModalDash, setScheduleModalDash] = useState<SavedDashboard | null>(null);
  const [dashboardSchedules, setDashboardSchedules] = useState<Record<string, RefreshSchedule>>({});

  // Load refresh schedules for all live-source dashboards
  React.useEffect(() => {
    const loadSchedules = async () => {
      const allDashes = [...savedDashboards, ...sharedDashboards, ...folderDashboards];
      const liveDashes = allDashes.filter(d => 
        ['google_sheet', 'sql_database', 'sharepoint'].includes(d.dataModel?.sourceType || '')
      );
      const newSchedules: Record<string, RefreshSchedule> = {};
      for (const dash of liveDashes) {
        if (!dashboardSchedules[dash.id]) {
          try {
            const schedule = await scheduledRefreshService.getSchedule(dash.id);
            if (schedule) newSchedules[dash.id] = schedule;
          } catch { /* ignore */ }
        }
      }
      if (Object.keys(newSchedules).length > 0) {
        setDashboardSchedules(prev => ({ ...prev, ...newSchedules }));
      }
    };
    if (savedDashboards.length > 0 || sharedDashboards.length > 0 || folderDashboards.length > 0) {
      loadSchedules();
    }
  }, [savedDashboards, sharedDashboards, folderDashboards]);

  React.useEffect(() => {
    const loadAllUsers = async () => {
      try {
          const users = await authService.getUsers();
          setAllUsers(users);
      } catch (err) {
          console.error('Failed to load users for scoping:', err);
      }
    };
    loadAllUsers();
  }, []);

  React.useEffect(() => {
    if (user && activeSection === 'SHARED') {
      setLoadingShared(true);
      dashboardAccessService.getSharedDashboards(user.id)
        .then(setSharedDashboards)
        .catch(() => setSharedDashboards([]))
        .finally(() => setLoadingShared(false));
    }
  }, [user, activeSection]);

  const handleOpenFolder = async (folderId: string) => {
      setActiveFolderId(folderId);
      setActiveSection('MY');
      if (!user) return;
      setIsDashboardsLoading(true);
      setDashboardError('');
      try {
          const { dashboards, effectiveLevel } = await workspaceService.getFolderDashboards(folderId, user.id);
          setFolderDashboards(dashboards);
          setCurrentFolderRole(effectiveLevel as AccessLevel);
      } catch (err: any) {
          setDashboardError(err.message || 'Failed to load dashboards');
      } finally {
          setIsDashboardsLoading(false);
      }
  };

  const handleCreateFolder = async (name: string, accessUsers: { id: number; level: AccessLevel }[], accessGroups: { id: string; level: AccessLevel }[]) => {
      if (!user) return;
      await workspaceService.createFolder(user.id, name, accessUsers, accessGroups);
      if (onFoldersChange) onFoldersChange();
  };

  const handleUpdateFolder = async (name: string, accessUsers: { id: number; level: AccessLevel }[], accessGroups: { id: string; level: AccessLevel }[]) => {
      if (!editingFolder || !user) return;
      await workspaceService.updateFolder(editingFolder.id, name, accessUsers, accessGroups, user.id);
      if (onFoldersChange) onFoldersChange();
  };

  const handleDeleteFolder = async (folderId: string, folderName: string) => {
      if (!user || !window.confirm(`Delete folder "${folderName}"? Dashboards inside will be unlinked.`)) return;
      try {
          await workspaceService.deleteFolder(folderId, user.id);
          if (activeFolderId === folderId) {
             setActiveFolderId(null);
             setFolderDashboards([]);
          }
          if (onFoldersChange) onFoldersChange();
      } catch (err: any) {
          alert(err.message || 'Failed to delete folder');
      }
  };

  const handleRenameDashboard = async (id: string, newName: string) => {
    const dash = [...savedDashboards, ...folderDashboards, ...sharedDashboards].find(d => d.id === id);
    if (!dash) return;

    try {
      await dashboardService.updateDashboard(id, {
        ...dash,
        name: newName
      });
      if (onDashboardsChange) onDashboardsChange();
    } catch (err: any) {
      console.error('Failed to rename dashboard:', err);
      // Fallback: if alert is not available, just log it
      if (typeof alert !== 'undefined') alert(err.message || 'Failed to rename dashboard');
      throw err;
    }
  };


  // UI State for Grouping
  const [showImportMenu, setShowImportMenu] = useState(false);

  // Info Guide State
  const [showInfoGuide, setShowInfoGuide] = useState<'GS' | 'SQL' | 'SP' | null>(null);

  // Modals Visibility State
  const [showGSModal, setShowGSModal] = useState(false);
  const [showSqlDbModal, setShowSqlDbModal] = useState(false);
  const [showSPModal, setShowSPModal] = useState(false);

  React.useEffect(() => {
    // Check for OAuth callback parameters for SharePoint
    const params = new URLSearchParams(window.location.search);
    if (params.get('sharepoint_connected') === 'true' || params.get('sharepoint_error')) {
      setShowSPModal(true);
    }
  }, []);



  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const validTypes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    if (validTypes.includes(file.type) || file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      onFileUpload(file);
    } else {
      alert("Please upload a valid CSV or Excel file.");
    }
  };

  // Info guide content for each import type
  const infoGuideContent: Record<'GS' | 'SQL' | 'SP', {
    title: string;
    iconBg: string;
    icon: React.ReactNode;
    stepBadgeBg: string;
    stepBadgeText: string;
    hoverBorder: string;
    steps: { title: string; desc: string }[];
  }> = {
    GS: {
      title: 'Google Sheets Import Guide',
      iconBg: 'bg-green-500/10',
      icon: <FileSpreadsheet className="w-6 h-6 text-green-500" />,
      stepBadgeBg: 'bg-green-500/15',
      stepBadgeText: 'text-green-400',
      hoverBorder: 'hover:border-green-500/40',
      steps: [
        { title: 'Open your Google Sheet', desc: 'Go to the Google Sheet you want to import data from.' },
        { title: 'Share with our service account', desc: 'Click "Share" → paste the service account email shown in the modal → set to "Viewer".' },
        { title: 'Copy the Sheet URL', desc: 'Copy the full URL from your browser\'s address bar.' },
        { title: 'Paste URL & Connect', desc: 'Paste the URL into the input field and click "Connect Sheet".' },
        { title: 'Select Sheets & Import', desc: 'Choose one or more sheet tabs and click "Import Sheet" to load the data.' },
      ]
    },
    SQL: {
      title: 'SQL Database Import Guide',
      iconBg: 'bg-blue-500/10',
      icon: <Database className="w-6 h-6 text-blue-500" />,
      stepBadgeBg: 'bg-blue-500/15',
      stepBadgeText: 'text-blue-400',
      hoverBorder: 'hover:border-blue-500/40',
      steps: [
        { title: 'Choose Database Type', desc: 'Select MySQL or PostgreSQL from the dropdown.' },
        { title: 'Enter Connection Details', desc: 'Fill in Host, Port, Database Name, Username, and Password.' },
        { title: 'Test the Connection', desc: 'Click "Test Connection" to verify your credentials are correct.' },
        { title: 'Fetch & Select Tables', desc: 'Once connected, click "Fetch Tables" and select the tables you need.' },
        { title: 'Import Data', desc: 'Click "Import Table" to load the selected table data into your dashboard.' },
      ]
    },
    SP: {
      title: 'SharePoint Import Guide',
      iconBg: 'bg-orange-500/10',
      icon: <Globe className="w-6 h-6 text-orange-500" />,
      stepBadgeBg: 'bg-orange-500/15',
      stepBadgeText: 'text-orange-400',
      hoverBorder: 'hover:border-orange-500/40',
      steps: [
        { title: 'Connect SharePoint Account', desc: 'Click "Connect SharePoint Account" to sign in via Microsoft OAuth.' },
        { title: 'Authorize Access', desc: 'Sign in with your Microsoft account and grant the required permissions.' },
        { title: 'Select a Site', desc: 'After authentication, pick the SharePoint site containing your data.' },
        { title: 'Select a List', desc: 'Choose the specific list you want to import from the site.' },
        { title: 'Confirm & Import', desc: 'Review your selection and click "Import SharePoint Data" to load it.' },
      ]
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className={`absolute top-0 left-0 w-full h-full ${colors.gradientTop} blur-[120px] opacity-30`}></div>
        <div className={`absolute bottom-0 right-0 w-full h-full ${colors.gradientBottom} blur-[120px] opacity-30`}></div>
      </div>

      {/* Header - Responsive */}
      <header className="px-4 sm:px-6 md:px-8 py-4 md:py-6 flex justify-between items-center relative z-50">
        <div className="flex items-center gap-2 sm:gap-3">
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

      <main className={`flex-1 flex flex-col ${activeTab === 'NEW' ? 'responsive-container pb-24' : 'w-full'}`}>
        {/* Tabs - Responsive */}
        <div className={`flex justify-center mb-6 sm:mb-8 ${activeTab === 'NEW' ? 'md:mb-12' : 'mb-0'}`}>
          <div className={`glass-panel p-1 sm:p-1.5 rounded-2xl border ${colors.borderPrimary} inline-flex w-full sm:w-auto shadow-xl`}>
            <button
              onClick={() => setActiveTab('NEW')}
              className={`flex-1 sm:flex-none px-5 sm:px-8 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-black transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 active:scale-95
                  ${activeTab === 'NEW' ? 'bg-indigo-600 text-white premium-tab-glow' : `${colors.textMuted} hover:${colors.bgTertiary} hover:${colors.textPrimary}`}
                `}
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden xs:inline tracking-tight">New Analysis</span>
            </button>
            <button
              onClick={() => setActiveTab('SAVED')}
              className={`flex-1 sm:flex-none px-5 sm:px-8 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-black transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 active:scale-95
                  ${activeTab === 'SAVED' ? 'bg-indigo-600 text-white premium-tab-glow' : `${colors.textMuted} hover:${colors.bgTertiary} hover:${colors.textPrimary}`}
                `}
            >
              <FolderOpen className="w-4 h-4" />
              <span className="hidden xs:inline tracking-tight">My Workspace</span>
            </button>
            <button
              onClick={() => onNavigateToMLModels && onNavigateToMLModels()}
              className={`flex-1 sm:flex-none px-5 sm:px-8 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-black transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 active:scale-95 ${colors.textMuted} hover:${colors.bgTertiary} hover:${colors.textPrimary}`}
              title="Prediction Analysis"
              style={{ display: onNavigateToMLModels ? undefined : 'none' }}
            >
              <Brain className="w-4 h-4" />
              <span className="hidden xs:inline tracking-tight">Prediction Analysis</span>
            </button>

          </div>
        </div>

        {activeTab === 'NEW' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-12 lg:gap-16 items-center animate-fade-in relative px-4 sm:px-6 md:px-8">
            {/* Background Ambience Blobs */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl max-h-[600px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none animate-pulse" />
            <div className="absolute top-0 left-0 -ml-20 -mt-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none animate-blob" />
            <div className="absolute bottom-0 right-0 -mr-20 -mb-20 w-80 h-80 bg-violet-500/10 rounded-full blur-[100px] pointer-events-none animate-blob animation-delay-2000" />

            {/* Left Column: Texts + How it works */}
            <div className="flex flex-col gap-8 md:gap-12">
              {/* Texts */}
              <div>
                <div className="inline-flex items-center gap-1.5 sm:gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs sm:text-sm font-bold mb-6 sm:mb-8 shadow-lg shadow-indigo-500/5 animate-fade-in-up">
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="tracking-wide">Welcome to AnalyticCore Automation</span>
                </div>
                <h2 className={`hero-title font-extrabold ${colors.textPrimary} leading-tight mb-4 sm:mb-6`}>
                  Data to Analytics <br className="hidden sm:block" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
                    in seconds.
                  </span>
                </h2>
                <p className={`responsive-text-base ${colors.textMuted} max-w-lg leading-relaxed`}>
                  Upload your raw CSV or Excel data. Our AI analyzes relationships, suggests KPIs, and builds professional dashboards automatically.
                </p>
              </div>

              {/* How it works - moved here */}
              <div className="relative md:block">
                {/* Glass card effect */}
                <div className="absolute inset-x-0 -top-10 -bottom-10 bg-gradient-to-b from-indigo-500/5 to-transparent rounded-[3rem] blur-2xl" />
                
                <div className={`responsive-card relative glass-panel backdrop-blur-2xl rounded-[2rem] sm:rounded-[3rem] border ${colors.borderPrimary} shadow-2xl overflow-hidden group/how`}>
                  {/* Internal glow */}
                  <div className="absolute -top-20 -right-20 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl group-hover/how:bg-indigo-500/20 transition-all duration-1000" />
                  
                  <h3 className={`responsive-text-lg font-black ${colors.textPrimary} mb-8 sm:mb-10 tracking-tight flex items-center gap-3`}>
                    How it works
                    <div className="h-px flex-1 bg-gradient-to-r from-indigo-500/20 to-transparent" />
                  </h3>
                  <div className="space-y-6 sm:space-y-8 relative">
                    <div className={`absolute left-6 top-4 bottom-4 w-0.5 ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'}`}></div>

                    {[
                      { title: "Upload Data", desc: "Supports multiple source files", icon: FileSpreadsheet },
                      { title: "Configure & Join", desc: "Merge tables and select key columns", icon: Settings },
                      { title: "Aggregate Setup", desc: "Summarize data using column aggregation", icon: BarChart3 },
                      { title: "AI Analysis & Charts", desc: "Gemini suggests relevant charts and actionable insights", icon: Sparkles },
                      { title: "Interact & Export", desc: "Filter, zoom, and save as PDF", icon: LayoutDashboard }
                    ].map((step, idx) => (
                      <div key={idx} className="relative flex items-start gap-4 sm:gap-6 group">
                        <div className={`relative z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl ${colors.bgTertiary} border ${colors.borderSecondary} flex items-center justify-center group-hover:border-indigo-500/50 group-hover:bg-indigo-500/10 transition-colors`}>
                          <step.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${colors.textMuted} group-hover:text-indigo-400`} />
                        </div>
                        <div>
                          <h4 className={`${colors.textPrimary} font-medium responsive-text-base sm:text-lg group-hover:text-indigo-300 transition`}>{step.title}</h4>
                          <p className={`${colors.textMuted} responsive-text-sm`}>{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Upload + Import */}
            <div className="flex flex-col gap-4 sm:gap-6 md:gap-8">
              <div
                className={`upload-area relative group border-2 border-dashed rounded-[2.5rem] sm:rounded-[3rem] flex flex-col items-center justify-center text-center transition-all duration-500 cursor-pointer p-8 sm:p-12
                  ${isDragging
                    ? 'border-indigo-400 bg-indigo-500/10 scale-[1.02]'
                    : `glass-panel ${theme === 'dark' ? 'bg-slate-900/40 hover:bg-slate-800/60' : 'bg-white/40 hover:bg-slate-50/80'} hover:border-indigo-500/50`
                  }
                  shadow-2xl shadow-indigo-500/5
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={(e) => e.target.files && handleFile(e.target.files[0])}
                />

                <div className={`${colors.bgTertiary} p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl mb-4 sm:mb-6 shadow-xl transition-transform duration-300 ${isDragging ? 'scale-110 rotate-3' : 'group-hover:scale-110 group-hover:-rotate-3'}`}>
                  {isDragging ? (
                    <Upload className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-400" />
                  ) : (
                    <FileSpreadsheet className={`w-8 h-8 sm:w-10 sm:h-10 ${colors.textTertiary}`} />
                  )}
                </div>

                <h3 className={`responsive-text-lg font-semibold ${colors.textPrimary} mb-2`}>Upload Dataset</h3>
                <p className={`${colors.textMuted} responsive-text-sm`}>CSV or Excel files up to 10MB</p>

                {/* Decorative glow */}
                <div className="absolute inset-0 bg-indigo-500/5 blur-3xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl sm:rounded-3xl" />
              </div>

              <div className="flex flex-col gap-3 relative">
                <button
                  onClick={() => setShowImportMenu(!showImportMenu)}
                  className={`w-full py-5 px-8 rounded-[1.5rem] border ${colors.borderPrimary} glass-panel ${theme === 'dark' ? 'bg-slate-900/40 hover:bg-slate-800/60' : 'bg-white/40 hover:bg-slate-50/80'} transition-all duration-300 flex items-center justify-center gap-4 group shadow-xl hover:shadow-indigo-500/10 active:scale-[0.98]`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-inner">
                    <PlusCircle className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div className="text-left flex-1">
                    <div className={`text-base font-black ${colors.textPrimary} tracking-tight`}>Explore More Sources</div>
                    <div className={`text-xs ${colors.textMuted} font-medium opacity-70`}>Connect Google Sheets, SQL Databases, or SharePoint</div>
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colors.bgTertiary} border ${colors.borderPrimary} group-hover:translate-x-1 transition-all`}>
                    <ChevronRight className={`w-4 h-4 ${colors.textMuted} transition-transform ${showImportMenu ? 'rotate-90' : ''}`} />
                  </div>
                </button>

                {showImportMenu && (
                  <div className={`absolute top-full left-0 right-0 mt-2 p-2 ${colors.bgSecondary} border ${colors.borderPrimary} rounded-2xl shadow-2xl z-20 animate-fade-in-up space-y-1 max-h-80 overflow-y-auto custom-scrollbar`}>
                    {/* Google Sheets Option */}
                    <button
                      onClick={() => { setShowGSModal(true); setShowImportMenu(false); }}
                      className={`w-full p-3 rounded-xl hover:${colors.bgTertiary} transition-colors flex items-center gap-3 group`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <FileSpreadsheet className="w-4 h-4 text-green-500" />
                      </div>
                      <div className="text-left">
                        <div className={`text-sm font-bold ${colors.textPrimary}`}>Connect with Google Sheets</div>
                        <div className={`text-[10px] ${colors.textMuted}`}>Live data from Google Sheets</div>
                      </div>
                    </button>

                    {/* SQL Option (Placeholder functionality) */}
                    <button
                      onClick={() => { setShowSqlDbModal(true); setShowImportMenu(false); }}
                      className={`w-full p-3 rounded-xl hover:${colors.bgTertiary} transition-colors flex items-center gap-3 group`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Database className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="text-left">
                        <div className={`text-sm font-bold ${colors.textPrimary}`}>Import SQL Data</div>
                        <div className={`text-[10px] ${colors.textMuted}`}>Connect to SQL databases</div>
                      </div>
                    </button>

                    {/* SharePoint Option */}
                    <button
                      onClick={() => {
                        setShowSPModal(true);
                        setShowImportMenu(false);
                        setSpStep('CONNECT'); // Always start at connect for privacy
                      }}
                      className={`w-full p-3 rounded-xl hover:${colors.bgTertiary} transition-colors flex items-center gap-3 group`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <Globe className="w-4 h-4 text-orange-500" />
                      </div>
                      <div className="text-left">
                        <div className={`text-sm font-bold ${colors.textPrimary}`}>Import from SharePoint</div>
                        <div className={`text-[10px] ${colors.textMuted}`}>Microsoft Graph API integration</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'SAVED' && (
          <div className={`animate-fade-in w-full flex-1 flex flex-col md:flex-row ${colors.bgSecondary} border-t ${colors.borderPrimary} overflow-hidden relative`}>
            {/* Background Ambience Blobs */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none animate-blob" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-violet-500/10 rounded-full blur-[100px] pointer-events-none animate-blob animation-delay-2000" />

            {/* Sidebar */}
            <aside className={`w-full md:w-64 lg:w-72 flex-shrink-0 glass-panel md:border-r ${colors.borderPrimary} p-4 lg:p-6 flex flex-col gap-8 z-10`}>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => { setActiveFolderId(null); setActiveSection('MY'); }}
                  className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all duration-300 group active:scale-[0.98] ${
                    activeFolderId === null && activeSection === 'MY'
                      ? 'bg-indigo-600 text-white font-black premium-tab-glow sidebar-active-glow'
                      : `${colors.textSecondary} hover:${colors.bgTertiary} hover:${colors.textPrimary} hover:translate-x-1`
                  }`}
                >
                  <LayoutDashboard className={`w-5 h-5 transition-transform group-hover:rotate-6 ${activeFolderId === null && activeSection === 'MY' ? 'text-white' : 'text-indigo-400'}`} />
                  <span className="text-sm font-bold tracking-tight">My Workspace</span>
                </button>
                <button
                  onClick={() => { setActiveFolderId(null); setActiveSection('SHARED'); }}
                  className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all duration-300 group active:scale-[0.98] ${
                    activeFolderId === null && activeSection === 'SHARED'
                      ? 'bg-violet-600 text-white font-black premium-tab-glow sidebar-active-glow'
                      : `${colors.textSecondary} hover:${colors.bgTertiary} hover:${colors.textPrimary} hover:translate-x-1`
                  }`}
                >
                  <Users className={`w-5 h-5 transition-transform group-hover:rotate-6 ${activeFolderId === null && activeSection === 'SHARED' ? 'text-white' : 'text-violet-400'}`} />
                  <span className="text-sm font-bold tracking-tight">Shared with me</span>
                  {sharedDashboards.length > 0 && (
                    <span className={`ml-auto px-2 py-0.5 rounded-lg text-[10px] font-black border ${
                        activeFolderId === null && activeSection === 'SHARED' 
                        ? 'bg-white/20 text-white border-white/30' 
                        : 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                    }`}>
                      {sharedDashboards.length}
                    </span>
                  )}
                </button>
              </div>

              <div className="flex flex-col flex-1">
                <div className="flex items-center justify-between px-2 mb-4">
                  <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] ${colors.textMuted} opacity-60`}>Workspaces</h4>
                  {user?.is_superuser && (
                    <button
                      onClick={() => { setEditingFolder(undefined); setShowFolderModal(true); }}
                      className={`p-1.5 rounded-lg hover:bg-indigo-500/10 ${colors.textMuted} hover:text-indigo-400 transition-all duration-300 hover:rotate-90`}
                      title="New Workspace"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 flex flex-col gap-1.5 -mx-2 px-2">
                  {workspaceFolders.length === 0 ? (
                    <div className={`text-xs ${colors.textMuted} text-center py-8 px-4 italic opacity-50`}>No workspaces yet.</div>
                  ) : (
                    workspaceFolders.map((folder) => {
                      const isActive = activeFolderId === folder.id;
                      const isOwner = folder.is_owner;
                      return (
                        <div key={folder.id} className="relative group/folder">
                          <button
                            onClick={() => handleOpenFolder(folder.id)}
                            className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                              isActive
                                ? 'bg-indigo-500/10 text-indigo-400 font-bold sidebar-active-glow'
                                : `${colors.textSecondary} hover:${colors.bgTertiary} hover:${colors.textPrimary} hover:translate-x-1`
                            }`}
                          >
                            <div className={`flex items-center gap-3 truncate ${isOwner ? 'pr-12' : ''}`}>
                              <FolderOpen className={`w-4 h-4 shrink-0 transition-all ${isActive ? 'fill-indigo-500/20 text-indigo-400 scale-110' : 'text-indigo-400/60'}`} />
                              <span className="truncate text-[13px] font-medium tracking-tight">{folder.name}</span>
                            </div>
                            {!isOwner && <Globe className={`w-3 h-3 shrink-0 ${colors.textMuted} opacity-40`} />}
                          </button>
                          
                          {/* Hover actions for owner */}
                          {(folder.is_owner || folder.effective_level === AccessLevel.ADMIN) && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover/folder:opacity-100 transition-all duration-300">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setEditingFolder(folder); setShowFolderModal(true); }}
                                    className={`p-1.5 rounded-lg ${colors.textMuted} hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors`}
                                    title="Edit folder"
                                >
                                    <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                {folder.is_owner && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id, folder.name); }}
                                        className={`p-1.5 rounded-lg ${colors.textMuted} hover:text-red-400 hover:bg-red-500/10 transition-colors`}
                                        title="Delete folder"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </aside>

            {/* Main Content Area */}
            <div className={`flex-1 flex flex-col p-6 lg:p-10 relative overflow-hidden ${colors.bgSecondary}/50 backdrop-blur-md z-0 md:border-l ${colors.borderPrimary} m-2 sm:m-4 rounded-[2rem] sm:rounded-[3rem] border ${colors.borderPrimary} shadow-2xl shadow-indigo-500/5`}>
              {/* Header */}
              <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 pb-8 border-b border-indigo-500/10 relative`}>
                <div className="flex items-center gap-5 min-w-0">
                {activeFolderId && (
                  <button
                    onClick={() => setActiveFolderId(null)}
                    className={`flex items-center justify-center w-10 h-10 shrink-0 rounded-2xl ${colors.bgTertiary} ${colors.textMuted} hover:${colors.textPrimary} hover:text-indigo-400 transition-all duration-300 shadow-sm border border-transparent hover:border-indigo-500/30 group`}
                    title="Back to My Workspace"
                  >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                  </button>
                )}
                <div className="min-w-0 flex flex-col gap-1">
                  <h2 className={`text-3xl font-black ${colors.textPrimary} tracking-tight truncate flex items-center gap-3`}>
                    {activeFolderId ? workspaceFolders.find(f => f.id === activeFolderId)?.name : "My Workspace"}
                    {!activeFolderId && <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />}
                  </h2>
                  {activeFolderId && (() => {
                    const folder = workspaceFolders.find(f => f.id === activeFolderId);
                    if (!folder) return null;
                    return (
                        <div className="flex items-center gap-4 text-[11px] uppercase tracking-widest font-black">
                          {folder.is_owner ? (
                              <span className={`flex items-center gap-1.5 ${colors.textMuted} bg-indigo-500/10 px-3 py-1 rounded-lg text-indigo-400 border border-indigo-500/20 shadow-sm`}><Lock className="w-3.5 h-3.5" /> Owner</span>
                          ) : (
                              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border shadow-sm ${
                                folder.effective_level === AccessLevel.ADMIN ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                folder.effective_level === AccessLevel.EDITOR ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              }`}>
                                <Globe className="w-3.5 h-3.5" /> {folder.effective_level || 'Shared'}
                              </span>
                          )}
                          {((folder.access_users && folder.access_users.length > 0) || (folder.access_groups && folder.access_groups.length > 0)) && (
                              <span className={`flex items-center gap-3 ${colors.textMuted} opacity-70`}>
                                  {folder.access_users && folder.access_users.length > 0 && (
                                    <span className="flex items-center gap-1.5">
                                      <Users className="w-3.5 h-3.5" /> {folder.access_users.length} <span className="hidden sm:inline">Collaborators</span>
                                    </span>
                                  )}
                                  {folder.access_groups && folder.access_groups.length > 0 && (
                                    <span className="flex items-center gap-1.5">
                                      <Briefcase className="w-3.5 h-3.5" /> {folder.access_groups.length} <span className="hidden sm:inline">Teams</span>
                                    </span>
                                  )}
                              </span>
                          )}
                        </div>
                    );
                  })()}
                </div>
                </div>
              </div>

              {/* Grid content */}
              <div className="flex-1">
                {activeFolderId === null && activeSection === 'SHARED' ? (
                  // Shared with me view
                  (() => {
                    if (loadingShared) {
                      return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin"></div></div>;
                    }
                    if (sharedDashboards.length === 0) {
                      return (
                        <div className={`flex flex-col items-center justify-center py-24 border ${colors.borderPrimary} rounded-[3rem] bg-gradient-to-br ${theme === 'dark' ? 'from-violet-500/5 to-transparent' : 'from-violet-50/50 to-transparent'} backdrop-blur-xl shadow-2xl shadow-violet-500/5 relative overflow-hidden group`}>
                          <div className="absolute -top-10 -right-10 w-40 h-40 bg-violet-500/10 rounded-full blur-3xl group-hover:bg-violet-500/20 transition-all duration-700" />
                          <div className={`w-24 h-24 ${theme === 'dark' ? 'bg-violet-500/10' : 'bg-violet-100/50'} rounded-[2rem] flex items-center justify-center mb-8 relative z-10 border ${colors.borderPrimary} shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                            <Users className={`w-12 h-12 text-violet-400`} />
                          </div>
                          <h3 className={`text-3xl font-black ${colors.textPrimary} tracking-tight mb-3`}>No collaborations yet</h3>
                          <p className={`${colors.textMuted} mt-2 text-center max-w-sm font-medium opacity-60 leading-relaxed px-8`}>Dashboards shared with you by colleagues will appear in this section.</p>
                        </div>
                      );
                    }
                    return (
                      <div className="saved-dashboards-grid">
                        {sharedDashboards.map((dash) => (
                          <DashboardCard key={dash.id} dash={dash} colors={colors} theme={theme} onLoad={onLoadDashboard} onRename={handleRenameDashboard} user={user} onScheduleClick={(d) => setScheduleModalDash(d)} scheduleMap={dashboardSchedules} />
                        ))}
                      </div>
                    );
                  })()
                ) : activeFolderId === null && activeSection === 'MY' ? (
                  // Default My Dashboards View
                  (() => {
                    const rootDashboards = savedDashboards.filter(d => !d.folder_id && !d.is_workspace);
                    if (rootDashboards.length === 0) {
                      return (
                          <div className={`flex flex-col items-center justify-center py-24 border ${colors.borderPrimary} rounded-[3rem] bg-gradient-to-br ${theme === 'dark' ? 'from-indigo-500/5 to-transparent' : 'from-indigo-50/50 to-transparent'} backdrop-blur-xl shadow-2xl shadow-indigo-500/5 relative overflow-hidden group`}>
                            {/* Decorative elements */}
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-700" />
                            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-violet-500/10 rounded-full blur-3xl group-hover:bg-violet-500/20 transition-all duration-700" />

                            <div className={`w-24 h-24 ${theme === 'dark' ? 'bg-indigo-500/10' : 'bg-indigo-100/50'} rounded-[2rem] flex items-center justify-center mb-8 relative z-10 border ${colors.borderPrimary} shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                              <FolderOpen className={`w-12 h-12 text-indigo-400`} />
                            </div>
                            <h3 className={`text-3xl font-black ${colors.textPrimary} tracking-tight mb-3 relative z-10`}>Workspace is empty</h3>
                            <p className={`${colors.textMuted} mb-10 text-center max-w-sm font-medium opacity-70 leading-relaxed px-8 relative z-10`}>You haven't saved any root dashboards yet. Start a new analysis or check your collections.</p>
                          <button
                            onClick={() => setActiveTab('NEW')}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl px-8 py-3.5 font-bold transition-all duration-300 shadow-xl shadow-indigo-900/40 hover:scale-105 active:scale-95 flex items-center gap-2 group"
                          >
                            <PlusCircle className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                            New Analysis
                          </button>
                        </div>
                      );
                    }
                    return (
                      <div className="saved-dashboards-grid">
                        {rootDashboards.map((dash) => (
                          <DashboardCard key={dash.id} dash={dash} colors={colors} theme={theme} onLoad={(d) => onLoadDashboard(d, null)} onDelete={onDeleteDashboard} onRename={handleRenameDashboard} user={user} onScheduleClick={(d) => setScheduleModalDash(d)} scheduleMap={dashboardSchedules} />
                        ))}
                      </div>
                    );
                  })()
                ) : (
                  // Workspace Folder View
                  (() => {
                    if (isDashboardsLoading) {
                        return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div></div>;
                    }
                    if (dashboardError) {
                        return <div className="text-center text-red-400 py-10 bg-red-500/10 rounded-2xl border border-red-500/20">{dashboardError}</div>;
                    }
                    if (folderDashboards.length === 0) {
                        return (
                          <div className={`flex flex-col items-center justify-center py-24 border ${colors.borderPrimary} rounded-[3rem] bg-gradient-to-br ${theme === 'dark' ? 'from-indigo-500/5 to-transparent' : 'from-indigo-50/50 to-transparent'} backdrop-blur-xl shadow-2xl shadow-indigo-500/5 relative overflow-hidden group`}>
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-700" />
                            <div className={`w-24 h-24 ${theme === 'dark' ? 'bg-indigo-500/10' : 'bg-indigo-100/50'} rounded-[2rem] flex items-center justify-center mb-8 relative z-10 border ${colors.borderPrimary} shadow-xl group-hover:scale-110 transition-all duration-500`}>
                              <FileText className={`w-12 h-12 text-indigo-400`} />
                            </div>
                            <h3 className={`text-3xl font-black ${colors.textPrimary} tracking-tight mb-3`}>Empty Collection</h3>
                            <p className={`${colors.textMuted} mt-2 text-center max-w-sm font-medium opacity-60 leading-relaxed px-8`}>Save dashboards to this collection by selecting it as your save location in the dashboard editor.</p>
                          </div>
                        );
                    }
                    const currentFolder = workspaceFolders.find(f => f.id === activeFolderId);
                    const canDelete = currentFolder?.is_owner || currentFolderRole === AccessLevel.EDITOR || currentFolderRole === AccessLevel.ADMIN;
                    return (
                      <div className="saved-dashboards-grid">
                        {folderDashboards.map((dash) => (
                          <DashboardCard key={dash.id} dash={dash} colors={colors} theme={theme} onLoad={(d) => onLoadDashboard(dash, currentFolderRole)} onDelete={canDelete ? onDeleteDashboard : undefined} onRename={handleRenameDashboard} user={user} onScheduleClick={(d) => setScheduleModalDash(d)} scheduleMap={dashboardSchedules} />
                        ))}
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
            
            {showFolderModal && user && (
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
        )}

        {showGSModal && user && (
          <GoogleSheetsImportModal
            user={user}
            onClose={() => setShowGSModal(false)}
            onImport={onGoogleSheetImport}
            onShowInfoGuide={() => setShowInfoGuide('GS')}
          />
        )}

        {showSPModal && user && (
          <SharePointImportModal
            user={user}
            onClose={() => setShowSPModal(false)}
            onImport={onSharePointImport}
            onShowInfoGuide={() => setShowInfoGuide('SP')}
          />
        )}

        {showSqlDbModal && user && (
          <SqlDatabaseImportModal
            user={user}
            onClose={() => setShowSqlDbModal(false)}
            onImport={onSqlDatabaseImport}
            onShowInfoGuide={() => setShowInfoGuide('SQL')}
          />
        )}
      </main>
      <Footer />

      {/* Info Guide Modal */}
      {showInfoGuide && (() => {
        const guide = infoGuideContent[showInfoGuide];
        return (
          <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowInfoGuide(null)}>
            <div
              className={`${colors.modalBg} border ${colors.borderPrimary} rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl transform scale-100 max-h-[85vh] overflow-y-auto`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 ${guide.iconBg} rounded-lg`}>
                    {guide.icon}
                  </div>
                  <h3 className={`text-lg font-bold ${colors.textPrimary}`}>{guide.title}</h3>
                </div>
                <button
                  onClick={() => setShowInfoGuide(null)}
                  className={`p-2 rounded-lg hover:${colors.bgTertiary} ${colors.textMuted} hover:text-red-400 transition`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Steps */}
              <div className="space-y-3">
                {guide.steps.map((step, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 p-3 rounded-xl border ${colors.borderPrimary} ${colors.bgTertiary} transition-all ${guide.hoverBorder}`}
                  >
                    <div className={`flex-shrink-0 w-7 h-7 rounded-full ${guide.stepBadgeBg} flex items-center justify-center`}>
                      <span className={`text-xs font-bold ${guide.stepBadgeText}`}>{idx + 1}</span>
                    </div>
                    <div>
                      <div className={`text-sm font-semibold ${colors.textPrimary}`}>{step.title}</div>
                      <div className={`text-xs ${colors.textMuted} mt-0.5 leading-relaxed`}>{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <button
                onClick={() => setShowInfoGuide(null)}
                className={`w-full mt-6 py-2.5 rounded-xl border ${colors.borderPrimary} ${colors.textSecondary} font-medium text-sm hover:${colors.bgTertiary} transition`}
              >
                Got it
              </button>
            </div>
          </div>
        );
      })()}

      {/* Scheduled Refresh Modal */}
      {scheduleModalDash && (
        <ScheduledRefreshModal
          dashboardId={scheduleModalDash.id}
          dashboardName={scheduleModalDash.name}
          user={user!}
          onClose={() => setScheduleModalDash(null)}
          onScheduleChange={(schedule) => {
            // Update the local schedules map so the card shows updated info immediately
            setDashboardSchedules(prev => {
              const updated = { ...prev };
              if (schedule) {
                updated[scheduleModalDash.id] = schedule;
              } else {
                delete updated[scheduleModalDash.id];
              }
              return updated;
            });
          }}
        />
      )}
    </div>
  );
};