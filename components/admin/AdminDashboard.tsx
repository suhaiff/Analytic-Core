import React, { useEffect, useState } from 'react';
import { authService } from '../../services/authService';
import { dashboardService } from '../../services/dashboardService';
import { fileService, FileContent } from '../../services/fileService';
import { useTheme } from '../../ThemeContext';
import { getThemeClasses } from '../../theme';
import { User, SavedDashboard } from '../../types';
import { Shield, Trash2, LogOut, Search, User as UserIcon, FileText, LayoutDashboard, Upload, Eye, X, Mail, Phone, Building, Briefcase, Users, TrendingUp, BarChart3, PieChart, Activity, HardDrive, Database, Clock } from 'lucide-react';
import { ProfileMenu } from '../navbar/ProfileMenu';
import { ThemeToggle } from '../ThemeToggle';

interface AdminDashboardProps {
    onLogout: () => void;
    user: User | null;
}

type AdminTab = 'USERS' | 'REPORTS' | 'UPLOADS';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, user }) => {
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
            if (activeTab === 'USERS') {
                const data = await authService.getUsers();
                setUsers(data);
            } else if (activeTab === 'REPORTS') {
                const data = await dashboardService.getAllDashboards();
                setDashboards(data);
            } else if (activeTab === 'UPLOADS') {
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
        <div className={`min-h-screen ${colors.bgPrimary} p-8`}>
            <div className="max-w-7xl mx-auto space-y-8">
                <div className={`flex flex-col md:flex-row justify-between items-start md:items-center p-8 rounded-[2rem] bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 text-white shadow-2xl mb-8 relative border border-white/10`}>
                    {/* Decorative Background layer - scoped overflow hidden */}
                    <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-white opacity-10 rounded-full blur-[80px] transform translate-x-1/3 -translate-y-1/3"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black opacity-20 rounded-full blur-[60px] transform -translate-x-1/3 translate-y-1/3"></div>
                    </div>
                    
                    <div className="relative z-10 flex flex-col gap-2">
                        <div className="flex items-center gap-4 mb-1">
                            <div className="p-3.5 bg-white/20 rounded-2xl backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] border border-white/20">
                                <Shield className="w-8 h-8 text-white drop-shadow-md" />
                            </div>
                            <h1 className="text-4xl font-extrabold tracking-tight drop-shadow-sm">Admin Control Center</h1>
                        </div>
                        <p className="text-indigo-100/90 font-medium text-sm md:text-base ml-1 max-w-lg leading-relaxed">
                            Monitor system activity, manage user access, and analyze comprehensive reports across the platform.
                        </p>
                    </div>
                    
                    <div className={`flex items-center gap-2 mt-6 md:mt-0 relative z-20 ${colors.bgSecondary} p-2 rounded-[1.5rem] shadow-xl border ${colors.borderPrimary}`}>
                        <div className={`hover:${colors.bgTertiary} rounded-full transition-colors`}>
                            <ThemeToggle />
                        </div>
                        <div className={`w-px h-8 ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'} mx-1`}></div>
                        <div className={`hover:${colors.bgTertiary} rounded-full transition-colors p-1`}>
                            <ProfileMenu user={user} onLogout={onLogout} />
                        </div>
                    </div>
                </div>

                <div className={`inline-flex flex-wrap items-center p-1.5 rounded-[1.25rem] ${colors.bgSecondary} border ${colors.borderPrimary} shadow-sm relative z-10 w-full md:w-auto`}>
                    <button
                        onClick={() => setActiveTab('USERS')}
                        className={`flex-1 md:flex-none px-6 py-3 rounded-[1rem] font-bold transition-all duration-300 flex items-center justify-center gap-2.5 text-sm tracking-wide ${activeTab === 'USERS' ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25 scale-[1.02]' : `bg-transparent ${colors.textMuted} hover:${colors.textPrimary} hover:${colors.bgTertiary}`}`}
                    >
                        <UserIcon className={`w-4 h-4 ${activeTab === 'USERS' ? 'text-white' : 'text-indigo-400'}`} /> 
                        <span>User Management</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('REPORTS')}
                        className={`flex-1 md:flex-none px-6 py-3 rounded-[1rem] font-bold transition-all duration-300 flex items-center justify-center gap-2.5 text-sm tracking-wide ${activeTab === 'REPORTS' ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25 scale-[1.02]' : `bg-transparent ${colors.textMuted} hover:${colors.textPrimary} hover:${colors.bgTertiary}`}`}
                    >
                        <FileText className={`w-4 h-4 ${activeTab === 'REPORTS' ? 'text-white' : 'text-indigo-400'}`} /> 
                        <span>Global Reports</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('UPLOADS')}
                        className={`flex-1 md:flex-none px-6 py-3 rounded-[1rem] font-bold transition-all duration-300 flex items-center justify-center gap-2.5 text-sm tracking-wide ${activeTab === 'UPLOADS' ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25 scale-[1.02]' : `bg-transparent ${colors.textMuted} hover:${colors.textPrimary} hover:${colors.bgTertiary}`}`}
                    >
                        <Upload className={`w-4 h-4 ${activeTab === 'UPLOADS' ? 'text-white' : 'text-indigo-400'}`} /> 
                        <span>Data Uploads</span>
                    </button>
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
            </div>

            {/* User Viewer Modal */}
            {viewingUser && (
                <div className={`fixed inset-0 z-[100] ${colors.overlayBg} backdrop-blur-md flex items-center justify-center p-4 animate-fade-in`}>
                    <div className={`${colors.modalBg} border ${colors.borderPrimary} rounded-[2rem] w-full max-w-md relative shadow-2xl overflow-hidden`}>
                        {/* Decorative Background */}
                        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-600"></div>
                        
                        <button
                            onClick={() => setViewingUser(null)}
                            className="absolute top-5 right-5 p-2.5 rounded-full bg-white/10 hover:bg-white/30 text-white transition-all duration-300 z-50 backdrop-blur-sm shadow-sm"
                            title="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        
                        <div className="pt-32 px-8 pb-8 relative z-10">
                            {/* Avatar */}
                            <div className="w-28 h-28 rounded-[1.5rem] bg-white flex items-center justify-center text-4xl font-extrabold text-indigo-600 shadow-xl border-[6px] border-white mx-auto -mt-14 mb-5 transform hover:scale-105 transition-all duration-300 bg-gradient-to-tr from-white to-slate-50">
                                {viewingUser.name.charAt(0).toUpperCase()}
                            </div>
                            
                            <div className="text-center mb-10">
                                <h3 className={`text-3xl font-poppins font-bold ${colors.textPrimary} mb-2 tracking-tight`}>{viewingUser.name}</h3>
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
                                    <Shield className="w-3.5 h-3.5" />
                                    {viewingUser.role}
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <div className={`p-4 rounded-[18px] ${colors.bgSecondary} border border-transparent shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-300 group`}>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-indigo-50 rounded-2xl text-indigo-500 group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className={`text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5`}>Email Address</p>
                                            <p className={`text-sm font-semibold ${colors.textPrimary} truncate`}>{viewingUser.email}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className={`p-4 rounded-[18px] ${colors.bgSecondary} border border-transparent shadow-sm hover:shadow-md hover:border-violet-100 transition-all duration-300 group`}>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-violet-50 rounded-2xl text-violet-500 group-hover:scale-110 group-hover:bg-violet-500 group-hover:text-white transition-all duration-500">
                                            <Phone className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className={`text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5`}>Phone Number</p>
                                            <p className={`text-sm font-semibold ${colors.textPrimary} truncate`}>{viewingUser.phone || 'Not provided'}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className={`p-4 rounded-[18px] ${colors.bgSecondary} border border-transparent shadow-sm hover:shadow-md hover:border-blue-100 transition-all duration-300 group`}>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-blue-50 rounded-2xl text-blue-500 group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white transition-all duration-500">
                                            <Building className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className={`text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5`}>Company</p>
                                            <p className={`text-sm font-semibold ${colors.textPrimary} truncate`}>{viewingUser.company || 'Not provided'}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className={`p-4 rounded-[18px] ${colors.bgSecondary} border border-transparent shadow-sm hover:shadow-md hover:border-emerald-100 transition-all duration-300 group`}>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-emerald-50 rounded-2xl text-emerald-500 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500">
                                            <Briefcase className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className={`text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5`}>Job Title</p>
                                            <p className={`text-sm font-semibold ${colors.textPrimary} truncate`}>{viewingUser.job_title || 'Not provided'}</p>
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
