import React, { useEffect, useState } from 'react';
import { authService } from '../../services/authService';
import { dashboardService } from '../../services/dashboardService';
import { fileService, FileContent } from '../../services/fileService';
import { useTheme } from '../../ThemeContext';
import { getThemeClasses } from '../../theme';
import { User, SavedDashboard } from '../../types';
import { Shield, Trash2, LogOut, Search, User as UserIcon, FileText, LayoutDashboard, Upload, Eye, X, Mail, Phone, Building, Briefcase, Users, TrendingUp, BarChart3, PieChart as PieChartIcon, Activity, HardDrive, Database, Clock, Globe } from 'lucide-react';
import { ProfileMenu } from '../navbar/ProfileMenu';
import { ThemeToggle } from '../ThemeToggle';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface AdminDashboardProps {
    onLogout: () => void;
    user: User | null;
    onNavigateToUserApp?: () => void;
}

type AdminTab = 'USERS' | 'REPORTS' | 'UPLOADS' | 'PERFORMANCE';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, user, onNavigateToUserApp }) => {
    const { theme } = useTheme();
    const colors = getThemeClasses(theme);
    const [users, setUsers] = useState<User[]>([]);
    const [dashboards, setDashboards] = useState<(SavedDashboard & { user_name: string, user_email: string })[]>([]);
    const [uploads, setUploads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<AdminTab>('USERS');

    // File Viewer State
    const [viewingFile, setViewingFile] = useState<FileContent | null>(null);
    const [viewingUser, setViewingUser] = useState<User | null>(null);
    const [loadingFile, setLoadingFile] = useState(false);
    const [activeSheet, setActiveSheet] = useState(0);

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'USERS' || activeTab === 'PERFORMANCE') {
                const data = await authService.getUsers();
                setUsers(data);
            } 
            
            if (activeTab === 'REPORTS' || activeTab === 'PERFORMANCE') {
                const data = await dashboardService.getAllDashboards();
                setDashboards(data);
            } 
            
            if (activeTab === 'UPLOADS' || activeTab === 'PERFORMANCE') {
                const data = await fileService.getAllUploads();
                setUploads(data);
            }
        } catch (error) {
            console.error("Failed to load data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await authService.deleteUser(id);
                setUsers(users.filter(u => u.id !== id));
            } catch (error) {
                alert('Failed to delete user');
            }
        }
    };

    const handleDeleteDashboard = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this report?')) {
            try {
                await dashboardService.deleteDashboard(id);
                setDashboards(dashboards.filter(d => d.id !== id));
            } catch (error) {
                alert('Failed to delete report');
            }
        }
    };

    const handleViewFile = async (id: number) => {
        setLoadingFile(true);
        setActiveSheet(0);
        try {
            const content = await fileService.getFileContent(id);
            console.log('File content loaded:', content);
            console.log('Sheets:', content.sheets);
            console.log('First sheet:', content.sheets?.[0]);
            console.log('First sheet data:', content.sheets?.[0]?.data);
            setViewingFile(content);
        } catch (error) {
            console.error("Failed to load file content", error);
            alert("Failed to load file content");
        } finally {
            setLoadingFile(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredDashboards = dashboards.filter(dash =>
        dash.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dash.user_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredUploads = uploads.filter(file =>
        file.original_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate User Statistics
    const totalUsers = users.length;
    const adminUsers = users.filter(u => u.role === 'ADMIN').length;
    const standardUsers = totalUsers - adminUsers;
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const newUsersLast7Days = users.filter(u => {
        if (!u.created_at) return false;
        return new Date(u.created_at) >= oneWeekAgo;
    }).length;

    // Calculate Reports Statistics
    const totalReports = dashboards.length;
    const uniqueCreators = new Set(dashboards.map(d => d.user_email)).size;
    const recentReports = dashboards.filter(d => {
        if (!d.date) return false;
        const [day, month, year] = d.date.split(',')[0].split('/');
        if(!day || !month || !year) return false;
        const dDate = new Date(parseInt(year), parseInt(month)-1, parseInt(day));
        return dDate >= oneWeekAgo;
    }).length;

    // Calculate Uploads Statistics
    const totalUploads = uploads.length;
    const totalStorageBytes = uploads.reduce((acc, curr) => acc + (curr.size || 0), 0);
    const totalStorageMB = (totalStorageBytes / (1024 * 1024)).toFixed(2);
    const uniqueUploaders = new Set(uploads.map(u => u.user_email)).size;
    const recentUploads = uploads.filter(u => {
        if (!u.created_at) return false;
        return new Date(u.created_at) >= oneWeekAgo;
    }).length;

    return (
        <div className={`min-h-screen flex flex-col relative overflow-x-hidden ${colors.bgPrimary}`}>
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
                    <ProfileMenu user={user} onLogout={onLogout} onNavigateToUserApp={onNavigateToUserApp} />
                </div>
            </header>

            <main className="responsive-container flex-1 flex flex-col pb-24 relative z-10 w-full">
                <div className="max-w-7xl mx-auto w-full space-y-8 mt-4 sm:mt-8 px-4 sm:px-6 md:px-8">
                    {/* Tabs - Centered */}
                    <div className="flex justify-center mb-6 sm:mb-8 md:mb-12">
                        <div className={`${colors.bgSecondary} p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border ${colors.borderPrimary} inline-flex w-full sm:w-auto`}>
                            <button
                                onClick={() => setActiveTab('USERS')}
                                className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2
                                    ${activeTab === 'USERS' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : `${colors.textMuted} hover:${colors.textPrimary}`}
                                `}
                            >
                                <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 
                                <span className="hidden xs:inline">User Management</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('REPORTS')}
                                className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2
                                    ${activeTab === 'REPORTS' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : `${colors.textMuted} hover:${colors.textPrimary}`}
                                `}
                            >
                                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 
                                <span className="hidden xs:inline">Global Reports</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('UPLOADS')}
                                className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2
                                    ${activeTab === 'UPLOADS' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : `${colors.textMuted} hover:${colors.textPrimary}`}
                                `}
                            >
                                <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 
                                <span className="hidden xs:inline">Data Uploads</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('PERFORMANCE')}
                                className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2
                                    ${activeTab === 'PERFORMANCE' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : `${colors.textMuted} hover:${colors.textPrimary}`}
                                `}
                            >
                                <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 
                                <span className="hidden xs:inline">System Performance</span>
                            </button>
                        </div>
                    </div>

                {/* User Statistics Overview - Only visible on USERS tab */}
                {activeTab === 'USERS' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in">
                        {/* Total Users Card */}
                        <div className={`relative overflow-hidden ${colors.bgSecondary} rounded-2xl border ${colors.borderPrimary} shadow-lg p-6 group hover:shadow-xl transition-all duration-300`}>
                            <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
                                <Users className="w-24 h-24 text-blue-500" />
                            </div>
                            <div className="flex items-center gap-4 mb-4 relative z-10">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white shadow-md">
                                    <Users className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className={`text-sm font-bold uppercase tracking-wider text-slate-400`}>Total Users</p>
                                    <h3 className={`text-3xl font-extrabold ${colors.textPrimary}`}>{totalUsers}</h3>
                                </div>
                            </div>
                            <div className="mt-4 relative z-10 flex items-center gap-2 text-sm font-medium text-slate-500">
                                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                                Total registered accounts
                            </div>
                        </div>

                        {/* Admin Users Card */}
                        <div className={`relative overflow-hidden ${colors.bgSecondary} rounded-2xl border ${colors.borderPrimary} shadow-lg p-6 group hover:shadow-xl transition-all duration-300`}>
                            <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
                                <Shield className="w-24 h-24 text-purple-500" />
                            </div>
                            <div className="flex items-center gap-4 mb-4 relative z-10">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white shadow-md">
                                    <Shield className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className={`text-sm font-bold uppercase tracking-wider text-slate-400`}>Administrators</p>
                                    <h3 className={`text-3xl font-extrabold ${colors.textPrimary}`}>{adminUsers}</h3>
                                </div>
                            </div>
                            <div className="mt-4 relative z-10 flex items-center gap-2 text-sm font-medium text-slate-500">
                                <span className="h-2 w-2 rounded-full bg-purple-500"></span>
                                Elevated privileges
                            </div>
                        </div>

                        {/* Standard Users Card */}
                        <div className={`relative overflow-hidden ${colors.bgSecondary} rounded-2xl border ${colors.borderPrimary} shadow-lg p-6 group hover:shadow-xl transition-all duration-300`}>
                            <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
                                <UserIcon className="w-24 h-24 text-indigo-500" />
                            </div>
                            <div className="flex items-center gap-4 mb-4 relative z-10">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white shadow-md">
                                    <UserIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className={`text-sm font-bold uppercase tracking-wider text-slate-400`}>Standard Users</p>
                                    <h3 className={`text-3xl font-extrabold ${colors.textPrimary}`}>{standardUsers}</h3>
                                </div>
                            </div>
                            <div className="mt-4 relative z-10 flex items-center gap-2 text-sm font-medium text-slate-500">
                                <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
                                Regular access accounts
                            </div>
                        </div>

                        {/* New Users Card */}
                        <div className={`relative overflow-hidden ${colors.bgSecondary} rounded-2xl border ${colors.borderPrimary} shadow-lg p-6 group hover:shadow-xl transition-all duration-300`}>
                            <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
                                <TrendingUp className="w-24 h-24 text-emerald-500" />
                            </div>
                            <div className="flex items-center gap-4 mb-4 relative z-10">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white shadow-md">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className={`text-sm font-bold uppercase tracking-wider text-slate-400`}>New Users</p>
                                    <h3 className={`text-3xl font-extrabold ${colors.textPrimary}`}>{newUsersLast7Days}</h3>
                                </div>
                            </div>
                            <div className="mt-4 relative z-10 flex items-center gap-2 text-sm font-medium text-emerald-500">
                                <TrendingUp className="w-4 h-4" />
                                Joined in last 7 days
                            </div>
                        </div>
                    </div>
                )}

                {/* Reports Statistics Overview - Only visible on REPORTS tab */}
                {activeTab === 'REPORTS' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-fade-in">
                        {/* Total Reports Card */}
                        <div className={`relative overflow-hidden ${colors.bgSecondary} rounded-2xl border ${colors.borderPrimary} shadow-lg p-6 group hover:shadow-xl transition-all duration-300`}>
                            <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
                                <LayoutDashboard className="w-24 h-24 text-rose-500" />
                            </div>
                            <div className="flex items-center gap-4 mb-4 relative z-10">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-white shadow-md">
                                    <LayoutDashboard className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className={`text-sm font-bold uppercase tracking-wider text-slate-400`}>Total Reports</p>
                                    <h3 className={`text-3xl font-extrabold ${colors.textPrimary}`}>{totalReports}</h3>
                                </div>
                            </div>
                            <div className="mt-4 relative z-10 flex items-center gap-2 text-sm font-medium text-slate-500">
                                <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                                Total dashboards generated
                            </div>
                        </div>

                        {/* Recent Reports Card */}
                        <div className={`relative overflow-hidden ${colors.bgSecondary} rounded-2xl border ${colors.borderPrimary} shadow-lg p-6 group hover:shadow-xl transition-all duration-300`}>
                            <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
                                <Activity className="w-24 h-24 text-amber-500" />
                            </div>
                            <div className="flex items-center gap-4 mb-4 relative z-10">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white shadow-md">
                                    <Activity className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className={`text-sm font-bold uppercase tracking-wider text-slate-400`}>Active Creation</p>
                                    <h3 className={`text-3xl font-extrabold ${colors.textPrimary}`}>{recentReports}</h3>
                                </div>
                            </div>
                            <div className="mt-4 relative z-10 flex items-center gap-2 text-sm font-medium text-amber-500">
                                <Activity className="w-4 h-4" />
                                Created in last 7 days
                            </div>
                        </div>

                        {/* Unique Creators Card */}
                        <div className={`relative overflow-hidden ${colors.bgSecondary} rounded-2xl border ${colors.borderPrimary} shadow-lg p-6 group hover:shadow-xl transition-all duration-300`}>
                            <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
                                <Users className="w-24 h-24 text-fuchsia-500" />
                            </div>
                            <div className="flex items-center gap-4 mb-4 relative z-10">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-fuchsia-400 to-fuchsia-600 flex items-center justify-center text-white shadow-md">
                                    <Users className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className={`text-sm font-bold uppercase tracking-wider text-slate-400`}>Creators</p>
                                    <h3 className={`text-3xl font-extrabold ${colors.textPrimary}`}>{uniqueCreators}</h3>
                                </div>
                            </div>
                            <div className="mt-4 relative z-10 flex items-center gap-2 text-sm font-medium text-slate-500">
                                <span className="h-2 w-2 rounded-full bg-fuchsia-500"></span>
                                Users who saved reports
                            </div>
                        </div>
                    </div>
                )}

                {/* Uploads Statistics Overview - Only visible on UPLOADS tab */}
                {activeTab === 'UPLOADS' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in">
                        {/* Total Uploads Card */}
                        <div className={`relative overflow-hidden ${colors.bgSecondary} rounded-2xl border ${colors.borderPrimary} shadow-lg p-6 group hover:shadow-xl transition-all duration-300`}>
                            <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
                                <FileText className="w-24 h-24 text-sky-500" />
                            </div>
                            <div className="flex items-center gap-4 mb-4 relative z-10">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white shadow-md">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className={`text-sm font-bold uppercase tracking-wider text-slate-400`}>Total Files</p>
                                    <h3 className={`text-3xl font-extrabold ${colors.textPrimary}`}>{totalUploads}</h3>
                                </div>
                            </div>
                            <div className="mt-4 relative z-10 flex items-center gap-2 text-sm font-medium text-slate-500">
                                <span className="h-2 w-2 rounded-full bg-sky-500"></span>
                                Total uploaded datasets
                            </div>
                        </div>

                        {/* Storage Volume Card */}
                        <div className={`relative overflow-hidden ${colors.bgSecondary} rounded-2xl border ${colors.borderPrimary} shadow-lg p-6 group hover:shadow-xl transition-all duration-300`}>
                            <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
                                <HardDrive className="w-24 h-24 text-teal-500" />
                            </div>
                            <div className="flex items-center gap-4 mb-4 relative z-10">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white shadow-md">
                                    <HardDrive className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className={`text-sm font-bold uppercase tracking-wider text-slate-400`}>Storage</p>
                                    <h3 className={`text-3xl font-extrabold ${colors.textPrimary}`}>{totalStorageMB}</h3>
                                </div>
                            </div>
                            <div className="mt-4 relative z-10 flex items-center gap-2 text-sm font-medium text-slate-500">
                                <Database className="w-4 h-4" />
                                Megabytes (MB) consumed
                            </div>
                        </div>

                        {/* Active Uploaders Card */}
                        <div className={`relative overflow-hidden ${colors.bgSecondary} rounded-2xl border ${colors.borderPrimary} shadow-lg p-6 group hover:shadow-xl transition-all duration-300`}>
                            <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
                                <Users className="w-24 h-24 text-indigo-500" />
                            </div>
                            <div className="flex items-center gap-4 mb-4 relative z-10">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white shadow-md">
                                    <Users className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className={`text-sm font-bold uppercase tracking-wider text-slate-400`}>Uploaders</p>
                                    <h3 className={`text-3xl font-extrabold ${colors.textPrimary}`}>{uniqueUploaders}</h3>
                                </div>
                            </div>
                            <div className="mt-4 relative z-10 flex items-center gap-2 text-sm font-medium text-slate-500">
                                <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
                                Users providing data
                            </div>
                        </div>

                        {/* Recent Uploads Card */}
                        <div className={`relative overflow-hidden ${colors.bgSecondary} rounded-2xl border ${colors.borderPrimary} shadow-lg p-6 group hover:shadow-xl transition-all duration-300`}>
                            <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
                                <Clock className="w-24 h-24 text-orange-500" />
                            </div>
                            <div className="flex items-center gap-4 mb-4 relative z-10">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white shadow-md">
                                    <Clock className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className={`text-sm font-bold uppercase tracking-wider text-slate-400`}>Recent Activity</p>
                                    <h3 className={`text-3xl font-extrabold ${colors.textPrimary}`}>{recentUploads}</h3>
                                </div>
                            </div>
                            <div className="mt-4 relative z-10 flex items-center gap-2 text-sm font-medium text-orange-500">
                                <Clock className="w-4 h-4" />
                                Uploads in last 7 days
                            </div>
                        </div>
                    </div>
                )}

                {activeTab !== 'PERFORMANCE' && (
                    <div className={`${colors.bgSecondary} rounded-3xl border ${colors.borderPrimary} shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden flex flex-col`}>
                        <div className={`p-6 sm:px-8 sm:py-6 border-b ${colors.borderPrimary} flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r ${theme === 'dark' ? 'from-slate-800/50 to-transparent' : 'from-slate-50/50 to-transparent'}`}>
                        <div className="flex items-center gap-4">
                            {activeTab === 'USERS' && (
                                <>
                                    <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 shadow-sm border border-indigo-500/20">
                                        <UserIcon className="w-6 h-6 text-indigo-500" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h2 className={`text-xl font-extrabold tracking-tight ${colors.textPrimary}`}>Registered Users</h2>
                                        <p className={`text-sm ${colors.textMuted} font-medium`}>Manage platform access and privileges.</p>
                                    </div>
                                    <span className="ml-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 font-bold text-sm border border-indigo-500/20 shadow-sm">{users.length}</span>
                                </>
                            )}
                            {activeTab === 'REPORTS' && (
                                <>
                                    <div className="p-3 rounded-2xl bg-gradient-to-br from-rose-500/20 to-orange-500/20 shadow-sm border border-rose-500/20">
                                        <LayoutDashboard className="w-6 h-6 text-rose-500" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h2 className={`text-xl font-extrabold tracking-tight ${colors.textPrimary}`}>System Reports</h2>
                                        <p className={`text-sm ${colors.textMuted} font-medium`}>View and manage generated dashboards.</p>
                                    </div>
                                    <span className="ml-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-500 font-bold text-sm border border-rose-500/20 shadow-sm">{dashboards.length}</span>
                                </>
                            )}
                            {activeTab === 'UPLOADS' && (
                                <>
                                    <div className="p-3 rounded-2xl bg-gradient-to-br from-sky-500/20 to-blue-500/20 shadow-sm border border-sky-500/20">
                                        <Upload className="w-6 h-6 text-sky-500" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h2 className={`text-xl font-extrabold tracking-tight ${colors.textPrimary}`}>Data Uploads</h2>
                                        <p className={`text-sm ${colors.textMuted} font-medium`}>Monitor raw dataset submissions.</p>
                                    </div>
                                    <span className="ml-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-500 font-bold text-sm border border-sky-500/20 shadow-sm">{uploads.length}</span>
                                </>
                            )}
                        </div>
                        
                        <div className="relative w-full sm:w-80 group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search className={`w-5 h-5 ${colors.textMuted} group-focus-within:text-indigo-500 transition-colors`} />
                            </div>
                            <input
                                type="text"
                                placeholder={`Search ${activeTab.toLowerCase()}...`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={`w-full block pl-11 pr-4 py-3 border ${colors.borderSecondary} rounded-2xl text-sm ${colors.textPrimary} ${theme === 'dark' ? 'bg-slate-900/50' : 'bg-white/50'} placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm focus:shadow-md backdrop-blur-sm`}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className={`${theme === 'dark' ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50/80 border-slate-200'} text-xs uppercase font-bold tracking-wider ${colors.textMuted} border-b backdrop-blur-sm sticky top-0 z-10`}>
                                <tr>
                                    {activeTab === 'USERS' && (
                                        <>
                                            <th className="px-6 py-4">User</th>
                                            <th className="px-6 py-4">Role</th>
                                            <th className="px-6 py-4">Domain</th>
                                            <th className="px-6 py-4">Joined</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </>
                                    )}
                                    {activeTab === 'REPORTS' && (
                                        <>
                                            <th className="px-6 py-4">Report Name</th>
                                            <th className="px-6 py-4">Created By</th>
                                            <th className="px-6 py-4">Date</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </>
                                    )}
                                    {activeTab === 'UPLOADS' && (
                                        <>
                                            <th className="px-6 py-4">File Name</th>
                                            <th className="px-6 py-4">Uploaded By</th>
                                            <th className="px-6 py-4">Size</th>
                                            <th className="px-6 py-4">Date</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${colors.borderPrimary}`}>
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading data...</td>
                                    </tr>
                                ) : (activeTab === 'USERS' ? filteredUsers : activeTab === 'REPORTS' ? filteredDashboards : filteredUploads).length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No records found matching your search.</td>
                                    </tr>
                                ) : (
                                    <>
                                        {activeTab === 'USERS' && filteredUsers.map(user => (
                                            <tr key={user.id} className={`group hover:${colors.bgTertiary} transition-all duration-300 border-b last:border-0 ${colors.borderSecondary} cursor-default`}>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-extrabold shadow-md ${theme === 'dark' ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white' : 'bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700'}`}>
                                                            {user.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className={`font-bold ${colors.textPrimary} tracking-tight`}>{user.name}</div>
                                                            <div className={`text-xs ${colors.textMuted}`}>{user.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-black shadow-sm ${user.role === 'ADMIN' ? 'bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 text-fuchsia-500 border border-fuchsia-500/30' : 'bg-gradient-to-r from-indigo-500/20 to-blue-500/20 text-indigo-500 border border-indigo-500/30'}`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-semibold text-slate-500">
                                                    {user.domain || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-3.5 h-3.5 opacity-50" />
                                                        {new Date(user.created_at || '').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => setViewingUser(user)}
                                                            className={`p-2 rounded-xl border transition-all duration-300 ${colors.borderSecondary} ${colors.textSecondary} hover:text-indigo-500 hover:border-indigo-500/30 hover:bg-indigo-500/10 shadow-sm`}
                                                            title="View Details"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        {user.role !== 'ADMIN' && (
                                                            <button
                                                                onClick={() => handleDeleteUser(user.id)}
                                                                className={`p-2 rounded-xl border transition-all duration-300 ${colors.borderSecondary} ${colors.textSecondary} hover:text-rose-500 hover:border-rose-500/30 hover:bg-rose-500/10 shadow-sm`}
                                                                title="Delete User"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}

                                        {activeTab === 'REPORTS' && filteredDashboards.map(dash => (
                                            <tr key={dash.id} className={`group hover:${colors.bgTertiary} transition-all duration-300 border-b last:border-0 ${colors.borderSecondary} cursor-default`}>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-2.5 bg-gradient-to-br from-rose-500/20 to-orange-500/20 rounded-xl border border-rose-500/20 shadow-sm">
                                                            <LayoutDashboard className="w-5 h-5 text-rose-500" />
                                                        </div>
                                                        <div className={`font-bold ${colors.textPrimary} tracking-tight`}>{dash.name}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <div className={`font-bold ${colors.textSecondary} text-sm`}>{dash.user_name}</div>
                                                        <div className={`text-xs ${colors.textMuted}`}>{dash.user_email}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-3.5 h-3.5 opacity-50" />
                                                        {dash.date}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleDeleteDashboard(dash.id)}
                                                        className={`inline-flex items-center justify-center p-2 rounded-xl border transition-all duration-300 ${colors.borderSecondary} ${colors.textSecondary} hover:text-rose-500 hover:border-rose-500/30 hover:bg-rose-500/10 shadow-sm`}
                                                        title="Delete Report"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}

                                        {activeTab === 'UPLOADS' && filteredUploads.map(file => (
                                            <tr key={file.id} className={`group hover:${colors.bgTertiary} transition-all duration-300 border-b last:border-0 ${colors.borderSecondary} cursor-default`}>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-2.5 bg-gradient-to-br from-sky-500/20 to-blue-500/20 rounded-xl border border-sky-500/20 shadow-sm">
                                                            <FileText className="w-5 h-5 text-sky-500" />
                                                        </div>
                                                        <div>
                                                            <div className={`font-bold ${colors.textPrimary} tracking-tight`}>{file.original_name}</div>
                                                            <div className={`text-xs ${colors.textMuted}`}>{file.filename}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <div className={`font-bold ${colors.textSecondary} text-sm`}>{file.user_name}</div>
                                                        <div className={`text-xs ${colors.textMuted}`}>{file.user_email}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                                                    <span className="px-3 py-1 bg-slate-500/10 text-slate-500 rounded-full text-xs font-bold border border-slate-500/20">
                                                        {(file.size / 1024).toFixed(2)} KB
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-3.5 h-3.5 opacity-50" />
                                                        {new Date(file.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleViewFile(file.id)}
                                                        className={`inline-flex items-center justify-center p-2 rounded-xl border transition-all duration-300 ${colors.borderSecondary} ${colors.textSecondary} hover:text-indigo-500 hover:border-indigo-500/30 hover:bg-indigo-500/10 shadow-sm`}
                                                        title="View File Content"
                                                    >
                                                        {loadingFile ? <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                )}

                {activeTab === 'PERFORMANCE' && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Average Response Time Card */}
                            <div className={`${colors.bgSecondary} rounded-3xl p-6 border ${colors.borderPrimary} shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all duration-500`}>
                                <div className="absolute top-0 right-0 p-6 opacity-10 transform group-hover:scale-125 transition-transform duration-700">
                                    <Clock className="w-20 h-20 text-indigo-500 shadow-indigo-500/20" />
                                </div>
                                <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] ${colors.textMuted} mb-3 relative z-10 opacity-70`}>Response Latency</h3>
                                <div className="flex items-baseline gap-2 relative z-10 mb-4">
                                    <span className={`text-4xl font-black ${colors.textPrimary}`}>
                                        {uploads.length > 0 ? Math.round(uploads.reduce((acc, f) => acc + (50 + (f.size / 1024) * 0.5), 0) / uploads.length) : 0}
                                    </span>
                                    <span className={`text-sm font-bold ${colors.textMuted} uppercase tracking-widest`}>ms</span>
                                </div>
                                <div className="flex items-center text-[11px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-2xl w-fit border border-emerald-500/20 shadow-sm">
                                    <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
                                    SYSTEM OPTIMIZED
                                </div>
                            </div>
                            
                            {/* PDF Export Count (Dynamic based on Dashboards) */}
                            <div className={`${colors.bgSecondary} rounded-3xl p-6 border ${colors.borderPrimary} shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all duration-500`}>
                                <div className="absolute top-0 right-0 p-6 opacity-10 transform group-hover:scale-125 transition-transform duration-700">
                                    <FileText className="w-20 h-20 text-rose-500 shadow-rose-500/20" />
                                </div>
                                <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] ${colors.textMuted} mb-3 relative z-10 opacity-70`}>Created Reports</h3>
                                <div className="flex items-baseline gap-2 relative z-10 mb-4">
                                    <span className={`text-4xl font-black ${colors.textPrimary}`}>{dashboards.length}</span>
                                    <span className={`text-sm font-bold ${colors.textMuted} uppercase tracking-widest`}>total</span>
                                </div>
                                <div className="flex items-center text-[11px] font-black text-rose-500 bg-rose-500/10 px-3 py-1.5 rounded-2xl w-fit border border-rose-500/20 shadow-sm">
                                    <Activity className="w-3.5 h-3.5 mr-1.5" />
                                    ACTIVE PIPELINE
                                </div>
                            </div>

                            {/* Storage Volume (Dynamic based on Uploads) */}
                            <div className={`${colors.bgSecondary} rounded-3xl p-6 border ${colors.borderPrimary} shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all duration-500`}>
                                <div className="absolute top-0 right-0 p-6 opacity-10 transform group-hover:scale-125 transition-transform duration-700">
                                    <Database className="w-20 h-20 text-emerald-500 shadow-emerald-500/20" />
                                </div>
                                <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] ${colors.textMuted} mb-3 relative z-10 opacity-70`}>Data Footprint</h3>
                                <div className="flex items-baseline gap-2 relative z-10 mb-4">
                                    <span className={`text-4xl font-black ${colors.textPrimary}`}>
                                        {(uploads.reduce((acc, f) => acc + (f.size || 0), 0) / (1024 * 1024)).toFixed(1)}
                                    </span>
                                    <span className={`text-sm font-bold ${colors.textMuted} uppercase tracking-widest`}>MB</span>
                                </div>
                                <div className="flex items-center text-[11px] font-black text-sky-500 bg-sky-500/10 px-3 py-1.5 rounded-2xl w-fit border border-sky-500/20 shadow-sm">
                                    <HardDrive className="w-3.5 h-3.5 mr-1.5" />
                                    {uploads.length} DATASETS
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* User Frequency Chart - Upgraded to Area Chart */}
                            <div className={`${colors.bgSecondary} rounded-[2rem] p-8 border ${colors.borderPrimary} shadow-2xl relative overflow-hidden group`}>
                                <div className="mb-8 flex justify-between items-start relative z-10">
                                    <div>
                                        <h3 className={`text-xl font-black ${colors.textPrimary} tracking-tight mb-1`}>Audience Growth</h3>
                                        <p className={`text-[11px] font-bold text-slate-400 uppercase tracking-widest`}>Registered users cumulative trend</p>
                                    </div>
                                    <div className="p-3.5 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 backdrop-blur-sm group-hover:scale-110 transition-transform duration-500">
                                        <TrendingUp className="w-5 h-5" />
                                    </div>
                                </div>
                                <div className="h-[300px] w-full relative z-10">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={(() => {
                                            const now = new Date();
                                            const getCount = (days: number) => {
                                                const cutoff = new Date();
                                                cutoff.setDate(now.getDate() - days);
                                                return users.filter(u => new Date(u.created_at || '') >= cutoff).length;
                                            };
                                            return [
                                                { name: 'Jan', users: 0 }, // Mock historical
                                                { name: 'Last 30d', users: getCount(30) },
                                                { name: 'Last 15d', users: getCount(15) },
                                                { name: 'Last 7d', users: getCount(7) },
                                                { name: 'Present', users: users.length },
                                            ];
                                        })()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} opacity={0.3} />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 10, fontWeight: 'bold' }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                                            <RechartsTooltip 
                                                cursor={{ stroke: '#6366f1', strokeWidth: 2 }}
                                                contentStyle={{ backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)', borderRadius: '16px', border: '1px solid rgba(99, 102, 241, 0.2)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', backdropFilter: 'blur(8px)' }}
                                            />
                                            <Area type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={4} fill="url(#colorUserTrend)" animationDuration={1500} />
                                            <defs>
                                                <linearGradient id="colorUserTrend" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* User Domain Distribution - Upgraded */}
                            <div className={`${colors.bgSecondary} rounded-[2rem] p-8 border ${colors.borderPrimary} shadow-2xl relative overflow-hidden group`}>
                                <div className="mb-8 flex justify-between items-start relative z-10">
                                    <div>
                                        <h3 className={`text-xl font-black ${colors.textPrimary} tracking-tight mb-1`}>User Ecosystem</h3>
                                        <p className={`text-[11px] font-bold text-slate-400 uppercase tracking-widest`}>Distribution by professional domain</p>
                                    </div>
                                    <div className="p-3.5 rounded-2xl bg-purple-500/10 text-purple-500 border border-purple-500/20 backdrop-blur-sm group-hover:scale-110 transition-transform duration-500">
                                        <Globe className="w-5 h-5" />
                                    </div>
                                </div>
                                <div className="flex-1 min-h-[300px] w-full flex items-center justify-center relative z-10">
                                    <div className="h-[280px] w-full max-w-[400px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={(() => {
                                                        const counts = users.reduce((acc: any, u) => {
                                                            const d = u.domain || 'Not specified';
                                                            acc[d] = (acc[d] || 0) + 1;
                                                            return acc;
                                                        }, {});
                                                        return Object.keys(counts).map(key => ({
                                                            name: key,
                                                            value: counts[key]
                                                        }));
                                                    })()}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={80}
                                                    outerRadius={110}
                                                    paddingAngle={8}
                                                    dataKey="value"
                                                    stroke="none"
                                                    animationDuration={1500}
                                                >
                                                    {users.reduce((acc: string[], u) => {
                                                        const d = u.domain || 'Not specified';
                                                        if (!acc.includes(d)) acc.push(d);
                                                        return acc;
                                                    }, []).map((_, index) => (
                                                        <Cell key={`cell-${index}`} fill={['#6366f1', '#a855f7', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'][index % 6]} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip 
                                                    contentStyle={{ backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)', borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', backdropFilter: 'blur(8px)' }}
                                                    itemStyle={{ color: theme === 'dark' ? '#f8fafc' : '#0f172a', fontWeight: 'bold' }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                <div className="flex flex-wrap justify-center gap-4 mt-4 relative z-10">
                                    {(() => {
                                        const counts = users.reduce((acc: any, u) => {
                                            const d = u.domain || 'Not specified';
                                            acc[d] = (acc[d] || 0) + 1;
                                            return acc;
                                        }, {});
                                        const total = users.length || 1;
                                        return Object.keys(counts).slice(0, 4).map((domain, index) => (
                                            <div key={domain} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-500/5 border border-slate-500/10 shadow-sm">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ['#6366f1', '#a855f7', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'][index % 6] }}></div>
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${colors.textSecondary}`}>
                                                    {domain} <span className="text-slate-400">({Math.round((counts[domain] / total) * 100)}%)</span>
                                                </span>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>
                            
                            {/* Response Performance Source - Upgraded */}
                            <div className={`${colors.bgSecondary} lg:col-span-2 rounded-[2rem] p-8 border ${colors.borderPrimary} shadow-2xl relative overflow-hidden group`}>
                                <div className="mb-8 flex justify-between items-start relative z-10">
                                    <div>
                                        <h3 className={`text-xl font-black ${colors.textPrimary} tracking-tight mb-1`}>Source Performance</h3>
                                        <p className={`text-[11px] font-bold text-slate-400 uppercase tracking-widest`}>Processing latency by ingestion source</p>
                                    </div>
                                    <div className="p-3.5 rounded-2xl bg-orange-500/10 text-orange-500 border border-orange-500/20 backdrop-blur-sm group-hover:scale-110 transition-transform duration-500">
                                        <Activity className="w-5 h-5" />
                                    </div>
                                </div>
                                <div className="h-[300px] w-full relative z-10">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={(() => {
                                            const sources: any = {
                                                'Excel/CSV': { sum: 0, count: 0 },
                                                'SQL DB': { sum: 0, count: 0 },
                                                'G-Sheets': { sum: 0, count: 0 },
                                                'SharePoint': { sum: 0, count: 0 }
                                            };
                                            
                                            uploads.forEach(f => {
                                                const type = f.mime_type || '';
                                                let sourceKey = 'Excel/CSV';
                                                if (type.includes('google')) sourceKey = 'G-Sheets';
                                                else if (type.includes('sharepoint')) sourceKey = 'SharePoint';
                                                else if (type.includes('sql')) sourceKey = 'SQL DB';
                                                
                                                const estimatedTime = 50 + ((f.size || 0) / 1024) * 0.5;
                                                sources[sourceKey].sum += estimatedTime;
                                                sources[sourceKey].count += 1;
                                            });

                                            return Object.keys(sources).map(key => ({
                                                name: key,
                                                time: sources[key].count > 0 ? Math.round(sources[key].sum / sources[key].count) : 0
                                            })).sort((a, b) => a.time - b.time);
                                        })()} margin={{ top: 10, right: 30, left: 10, bottom: 0 }} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} opacity={0.3} />
                                            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                                            <YAxis type="category" dataKey="name" width={90} axisLine={false} tickLine={false} tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 10, fontWeight: 'black' }} />
                                            <RechartsTooltip 
                                                cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                                                contentStyle={{ backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)', borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', backdropFilter: 'blur(8px)' }}
                                                formatter={(value) => [`${value} ms`, 'Latency']}
                                            />
                                            <Bar dataKey="time" radius={[0, 10, 10, 0]} maxBarSize={40} animationDuration={1000}>
                                                {(() => {
                                                     const sources: any = {
                                                        'Excel/CSV': { sum: 0, count: 0 },
                                                        'SQL DB': { sum: 0, count: 0 },
                                                        'G-Sheets': { sum: 0, count: 0 },
                                                        'SharePoint': { sum: 0, count: 0 }
                                                    };
                                                    
                                                     uploads.forEach(f => {
                                                        const type = f.mime_type || '';
                                                        let sourceKey = 'Excel/CSV';
                                                        if (type.includes('google')) sourceKey = 'G-Sheets';
                                                        else if (type.includes('sharepoint')) sourceKey = 'SharePoint';
                                                        else if (type.includes('sql')) sourceKey = 'SQL DB';
                                                        
                                                        const estimatedTime = 50 + ((f.size || 0) / 1024) * 0.5;
                                                        sources[sourceKey].sum += estimatedTime;
                                                        sources[sourceKey].count += 1;
                                                    });

                                                    return Object.keys(sources).map(key => ({
                                                        name: key,
                                                        time: sources[key].count > 0 ? Math.round(sources[key].sum / sources[key].count) : 0
                                                    })).sort((a, b) => a.time - b.time).map((entry, index) => {
                                                        const color = entry.time < 80 ? '#10b981' : entry.time < 150 ? '#f59e0b' : '#ef4444';
                                                        return <Cell key={`cell-${index}`} fill={color} opacity={0.9} />;
                                                    });
                                                })()}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                </div>
            </main>

            {/* User Viewer Modal */}
            {viewingUser && (
                <div className={`fixed inset-0 z-[100] ${colors.overlayBg} backdrop-blur-md flex items-center justify-center p-4 animate-fade-in`}>
                    <div className={`${colors.modalBg} border ${colors.borderPrimary} rounded-[2rem] w-full max-w-2xl relative shadow-2xl overflow-hidden`}>
                        {/* Decorative Background */}
                        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-700">
                             <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                        </div>
                        
                        <button
                            onClick={() => setViewingUser(null)}
                            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/30 text-white transition-all duration-300 z-50 backdrop-blur-sm shadow-sm"
                            title="Close"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        
                        <div className="pt-16 px-6 sm:px-10 pb-10 relative z-10">
                            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 mb-8">
                                {/* Avatar */}
                                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-white to-slate-50 flex items-center justify-center text-4xl font-extrabold text-indigo-600 shadow-2xl border-[4px] border-white/20 transform hover:scale-105 transition-all duration-300 relative">
                                    <div className="absolute inset-0 rounded-3xl bg-indigo-500/5 blur-xl"></div>
                                    <span className="relative z-10">{viewingUser.name.charAt(0).toUpperCase()}</span>
                                </div>
                                
                                <div className="text-center sm:text-left flex-1">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-[9px] font-black uppercase tracking-[0.2em] mb-2 border border-indigo-500/20">
                                        <Shield className="w-3 h-3" />
                                        {viewingUser.role} Account
                                    </div>
                                    <h3 className={`text-3xl font-poppins font-bold ${colors.textPrimary} mb-1 tracking-tight leading-none`}>
                                        {viewingUser.name}
                                    </h3>
                                    <p className={`text-sm ${colors.textMuted} font-medium opacity-70`}>{viewingUser.email}</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className={`p-4 rounded-2xl ${colors.bgSecondary} border ${colors.borderPrimary} shadow-sm hover:shadow-md hover:border-indigo-500/30 transition-all duration-300 group overflow-hidden relative`}>
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-full -translate-y-8 translate-x-8"></div>
                                    <div className="flex items-center gap-3 relative z-10">
                                        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-indigo-500/10 rounded-xl text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className={`text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5`}>Email</p>
                                            <p className={`text-sm font-semibold ${colors.textPrimary} truncate`}>{viewingUser.email}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className={`p-4 rounded-2xl ${colors.bgSecondary} border ${colors.borderPrimary} shadow-sm hover:shadow-md hover:border-violet-500/30 transition-all duration-300 group overflow-hidden relative`}>
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-violet-500/5 rounded-full -translate-y-8 translate-x-8"></div>
                                    <div className="flex items-center gap-3 relative z-10">
                                        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-violet-500/10 rounded-xl text-violet-500 group-hover:bg-violet-500 group-hover:text-white transition-all duration-300">
                                            <Phone className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className={`text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5`}>Phone</p>
                                            <p className={`text-sm font-semibold ${colors.textPrimary} truncate`}>{viewingUser.phone || 'Not provided'}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className={`p-4 rounded-2xl ${colors.bgSecondary} border ${colors.borderPrimary} shadow-sm hover:shadow-md hover:border-blue-500/30 transition-all duration-300 group overflow-hidden relative`}>
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full -translate-y-8 translate-x-8"></div>
                                    <div className="flex items-center gap-3 relative z-10">
                                        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-blue-500/10 rounded-xl text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                                            <Building className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className={`text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5`}>Company</p>
                                            <p className={`text-sm font-semibold ${colors.textPrimary} truncate`}>{viewingUser.company || 'Not provided'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className={`p-4 rounded-2xl ${colors.bgSecondary} border ${colors.borderPrimary} shadow-sm hover:shadow-md hover:border-sky-500/30 transition-all duration-300 group overflow-hidden relative`}>
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-sky-500/5 rounded-full -translate-y-8 translate-x-8"></div>
                                    <div className="flex items-center gap-3 relative z-10">
                                        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-sky-500/10 rounded-xl text-sky-500 group-hover:bg-sky-500 group-hover:text-white transition-all duration-300">
                                            <Globe className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className={`text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5`}>Domain</p>
                                            <p className={`text-sm font-semibold ${colors.textPrimary} truncate`}>{viewingUser.domain || 'Not provided'}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className={`p-4 rounded-2xl ${colors.bgSecondary} border ${colors.borderPrimary} shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all duration-300 group overflow-hidden relative sm:col-span-2`}>
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -translate-y-12 translate-x-12"></div>
                                    <div className="flex items-center gap-4 relative z-10">
                                        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-emerald-500/10 rounded-xl text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                                            <Briefcase className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1">
                                            <p className={`text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5`}>Job Title / Position</p>
                                            <p className={`text-sm font-bold ${colors.textPrimary}`}>{viewingUser.job_title || 'Not provided'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* File Viewer Modal */}
            {viewingFile && (
                <div className={`fixed inset-0 z-[100] ${colors.overlayBg} backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in`}>
                    <div className={`${colors.modalBg} border ${colors.borderPrimary} rounded-2xl w-full max-w-5xl h-[80vh] flex flex-col shadow-2xl`}>
                        <div className={`flex justify-between items-center p-6 border-b ${colors.borderPrimary}`}>
                            <div className="flex items-center gap-3">
                                <FileText className="w-6 h-6 text-indigo-400" />
                                <h3 className={`text-xl font-bold ${colors.textPrimary}`}>{viewingFile.fileName}</h3>
                            </div>
                            <button
                                onClick={() => setViewingFile(null)}
                                className={`p-2 rounded-lg hover:${colors.bgTertiary} ${colors.textMuted} hover:text-red-400 transition`}
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Sheet Tabs */}
                        {viewingFile.sheets && viewingFile.sheets.length > 1 && (
                            <div className={`flex gap-2 px-6 pt-4 border-b ${colors.borderPrimary}`}>
                                {viewingFile.sheets.map((sheet, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveSheet(idx)}
                                        className={`px-4 py-2 rounded-t-lg font-medium text-sm transition-all ${activeSheet === idx
                                            ? `${colors.bgSecondary} ${colors.textPrimary} border-b-2 border-indigo-500`
                                            : `${colors.textMuted} hover:${colors.textPrimary} hover:${colors.bgTertiary}`
                                            }`}
                                    >
                                        {sheet.name}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="flex-1 overflow-auto p-6">
                            {viewingFile.sheets && viewingFile.sheets.length > 0 && viewingFile.sheets[activeSheet] ? (
                                <div className={`border ${colors.borderSecondary} rounded-xl overflow-hidden`}>
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className={`${colors.bgTertiary}`}>
                                                {viewingFile.sheets[activeSheet]?.data[0]?.map((header: any, idx: number) => (
                                                    <th key={idx} className={`px-4 py-3 text-xs font-bold uppercase ${colors.textMuted} border-b ${colors.borderSecondary} border-r last:border-r-0`}>
                                                        {header}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {viewingFile.sheets[activeSheet]?.data.slice(1).map((row: any[], rIdx: number) => (
                                                <tr key={rIdx} className={`hover:${colors.bgPrimary} transition-colors border-b ${colors.borderSecondary} last:border-b-0`}>
                                                    {row.map((cell: any, cIdx: number) => (
                                                        <td key={cIdx} className={`px-4 py-2 text-sm ${colors.textSecondary} border-r ${colors.borderSecondary} last:border-r-0`}>
                                                            {cell}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <p className={`${colors.textMuted}`}>No data available to display</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
