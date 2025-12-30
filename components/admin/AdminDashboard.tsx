import React, { useEffect, useState } from 'react';
import { authService } from '../../services/authService';
import { dashboardService } from '../../services/dashboardService';
import { fileService, FileContent } from '../../services/fileService';
import { useTheme } from '../../ThemeContext';
import { getThemeClasses } from '../../theme';
import { User, SavedDashboard } from '../../types';
import { Shield, Trash2, LogOut, Search, User as UserIcon, FileText, LayoutDashboard, Upload, Eye, X } from 'lucide-react';
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

    return (
        <div className={`min-h-screen ${colors.bgPrimary} p-8`}>
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Shield className="w-8 h-8 text-indigo-500" />
                            <h1 className={`text-3xl font-bold ${colors.textPrimary}`}>Admin Dashboard</h1>
                        </div>
                        <p className={colors.textMuted}>Manage users, reports, and uploads</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <ProfileMenu user={user} onLogout={onLogout} />
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('USERS')}
                        className={`px-6 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${activeTab === 'USERS' ? 'bg-indigo-600 text-white' : `${colors.bgSecondary} ${colors.textMuted} hover:${colors.textPrimary}`}`}
                    >
                        <UserIcon className="w-4 h-4" /> Users
                    </button>
                    <button
                        onClick={() => setActiveTab('REPORTS')}
                        className={`px-6 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${activeTab === 'REPORTS' ? 'bg-indigo-600 text-white' : `${colors.bgSecondary} ${colors.textMuted} hover:${colors.textPrimary}`}`}
                    >
                        <FileText className="w-4 h-4" /> All Reports
                    </button>
                    <button
                        onClick={() => setActiveTab('UPLOADS')}
                        className={`px-6 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${activeTab === 'UPLOADS' ? 'bg-indigo-600 text-white' : `${colors.bgSecondary} ${colors.textMuted} hover:${colors.textPrimary}`}`}
                    >
                        <Upload className="w-4 h-4" /> Uploads
                    </button>
                </div>

                <div className={`${colors.bgSecondary} rounded-2xl border ${colors.borderPrimary} shadow-xl overflow-hidden`}>
                    <div className={`p-6 border-b ${colors.borderPrimary} flex justify-between items-center`}>
                        <h2 className={`text-lg font-bold ${colors.textPrimary} flex items-center gap-2`}>
                            {activeTab === 'USERS' && <><UserIcon className="w-5 h-5 text-indigo-400" /> Registered Users ({users.length})</>}
                            {activeTab === 'REPORTS' && <><LayoutDashboard className="w-5 h-5 text-indigo-400" /> Total Reports ({dashboards.length})</>}
                            {activeTab === 'UPLOADS' && <><Upload className="w-5 h-5 text-indigo-400" /> Total Uploads ({uploads.length})</>}
                        </h2>
                        <div className="relative w-64">
                            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${colors.textMuted}`} />
                            <input
                                type="text"
                                placeholder={`Search ${activeTab.toLowerCase()}...`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={`w-full bg-transparent border ${colors.borderSecondary} rounded-lg pl-10 pr-4 py-2 text-sm ${colors.textPrimary} focus:ring-2 focus:ring-indigo-500 outline-none`}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className={`${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-50'} text-xs uppercase font-bold ${colors.textMuted}`}>
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
                                            <tr key={user.id} className={`hover:${colors.bgTertiary}/50 transition-colors`}>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-600'}`}>
                                                            {user.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className={`font-bold ${colors.textPrimary}`}>{user.name}</div>
                                                            <div className={`text-xs ${colors.textMuted}`}>{user.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'}`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500">
                                                    {new Date(user.created_at || '').toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {user.role !== 'ADMIN' && (
                                                        <button
                                                            onClick={() => handleDeleteUser(user.id)}
                                                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                                            title="Delete User"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}

                                        {activeTab === 'REPORTS' && filteredDashboards.map(dash => (
                                            <tr key={dash.id} className={`hover:${colors.bgTertiary}/50 transition-colors`}>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                                                            <LayoutDashboard className="w-5 h-5 text-indigo-400" />
                                                        </div>
                                                        <div className={`font-bold ${colors.textPrimary}`}>{dash.name}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <div className={`font-medium ${colors.textPrimary}`}>{dash.user_name}</div>
                                                        <div className={`text-xs ${colors.textMuted}`}>{dash.user_email}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500">
                                                    {dash.date}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleDeleteDashboard(dash.id)}
                                                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                                        title="Delete Report"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}

                                        {activeTab === 'UPLOADS' && filteredUploads.map(file => (
                                            <tr key={file.id} className={`hover:${colors.bgTertiary}/50 transition-colors`}>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-blue-500/10 rounded-lg">
                                                            <FileText className="w-5 h-5 text-blue-400" />
                                                        </div>
                                                        <div>
                                                            <div className={`font-bold ${colors.textPrimary}`}>{file.original_name}</div>
                                                            <div className={`text-xs ${colors.textMuted}`}>{file.filename}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <div className={`font-medium ${colors.textPrimary}`}>{file.user_name}</div>
                                                        <div className={`text-xs ${colors.textMuted}`}>{file.user_email}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500">
                                                    {(file.size / 1024).toFixed(2)} KB
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500">
                                                    {new Date(file.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleViewFile(file.id)}
                                                        className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-colors"
                                                        title="View File Content"
                                                    >
                                                        {loadingFile ? <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div> : <Eye className="w-4 h-4" />}
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
