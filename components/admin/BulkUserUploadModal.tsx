import React, { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Loader2, UserPlus, HelpCircle, Download } from 'lucide-react';
import { useTheme } from '../../ThemeContext';
import { getThemeClasses } from '../../theme';
import { authService } from '../../services/authService';
import * as XLSX from 'xlsx';

interface BulkUserUploadModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

interface ParsedUser {
    name: string;
    email: string;
    password?: string;
    phone?: string;
    company?: string;
    job_title?: string;
    domain?: string;
    role?: 'USER' | 'ADMIN';
}

export const BulkUserUploadModal: React.FC<BulkUserUploadModalProps> = ({ onClose, onSuccess }) => {
    const { theme } = useTheme();
    const colors = getThemeClasses(theme);
    const [isParsing, setIsParsing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [fileData, setFileData] = useState<ParsedUser[]>([]);
    const [fileName, setFileName] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<{ success: number; failed: number; errors: any[] } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setIsParsing(true);
        setError(null);
        setResults(null);

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws) as any[];

                // Map data to ParsedUser format
                const users: ParsedUser[] = data.map((item: any) => ({
                    name: item['Name'] || item['name'] || item['Full Name'] || '',
                    email: item['Email'] || item['email'] || '',
                    password: item['Password'] || item['password'] || undefined,
                    phone: item['Phone'] || item['phone'] || item['Phone Number'] || item['Phone number'] || undefined,
                    company: item['Company'] || item['company'] || item['Business'] || item['business'] || undefined,
                    job_title: item['Job Title'] || item['job_title'] || item['Designation'] || undefined,
                    domain: item['Domain'] || item['domain'] || undefined,
                    role: item['Role']?.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER'
                })).filter(u => u.name && u.email && u.phone && u.company && u.domain && u.job_title);

                if (users.length === 0) {
                    throw new Error('No valid user records found. Please check column headers (Name, Email, Phone Number, Business, Domain, Job Title).');
                }

                setFileData(users);
            } catch (err: any) {
                setError(err.message || 'Failed to parse file');
                setFileData([]);
            } finally {
                setIsParsing(false);
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleBulkUpload = async () => {
        if (fileData.length === 0) return;

        setIsUploading(true);
        setError(null);
        try {
            const res = await authService.bulkSignup(fileData);
            setResults(res);
            if (res.success > 0) {
                setTimeout(() => {
                    onSuccess();
                }, 2000);
            }
        } catch (err: any) {
            setError(err.message || 'Bulk upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDownloadTemplate = () => {
        const headers = [['name', 'email', 'phone', 'company', 'domain', 'job_title']];
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(headers);
        XLSX.utils.book_append_sheet(wb, ws, 'Template');
        XLSX.writeFile(wb, 'bulk_upload_template.csv');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-8 animate-fade-in">
            {/* Backdrop */}
            <div 
                className={`absolute inset-0 ${colors.overlayBg} backdrop-blur-md transition-opacity duration-300`} 
                onClick={!isUploading ? onClose : undefined}
            />

            {/* Modal Container */}
            <div className={`relative w-full max-w-4xl max-h-[90vh] overflow-hidden ${colors.modalBg} border ${colors.borderPrimary} rounded-[2.5rem] shadow-2xl flex flex-col animate-scale-in`}>
                
                {/* Header */}
                <div className={`px-8 py-6 border-b ${colors.borderPrimary} flex items-center justify-between bg-gradient-to-r ${theme === 'dark' ? 'from-slate-800/50 to-transparent' : 'from-slate-50/50 to-transparent'}`}>
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500">
                            <UserPlus className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className={`text-xl font-black tracking-tight ${colors.textPrimary}`}>Bulk Upload Employees</h2>
                            <p className={`text-xs ${colors.textMuted} font-bold uppercase tracking-widest`}>Add multiple new users from Excel/CSV</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handleDownloadTemplate}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border ${colors.borderSecondary} ${colors.textSecondary} hover:${colors.bgTertiary} hover:${colors.textPrimary} transition-all duration-500 font-black text-[10px] uppercase tracking-widest group shadow-lg shadow-black/5`}
                            title="Download CSV Template"
                        >
                            <Download className="w-4 h-4 text-emerald-500 transition-transform group-hover:-translate-y-0.5" />
                            <span>Download Template</span>
                        </button>
                        <div className={`h-8 w-px ${colors.borderSecondary} opacity-30 mx-1`}></div>
                        <button 
                            onClick={onClose}
                            disabled={isUploading}
                            className={`p-2.5 rounded-xl transition-all duration-300 ${colors.textMuted} hover:${colors.textPrimary} hover:bg-slate-500/10 active:scale-95`}
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-8 scrollbar-thin">
                    {!results ? (
                        <div className="space-y-8">
                            {/* Upload Area */}
                            <div 
                                onClick={() => !isParsing && !isUploading && fileInputRef.current?.click()}
                                className={`group relative border-2 border-dashed rounded-3xl p-12 transition-all duration-500 cursor-pointer flex flex-col items-center justify-center gap-4 overflow-hidden
                                    ${fileName 
                                        ? 'border-emerald-500/50 bg-emerald-500/5' 
                                        : `${colors.borderSecondary} hover:border-indigo-500/50 bg-slate-500/5 hover:bg-indigo-500/5`
                                    }`}
                            >
                                <input 
                                    type="file" 
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    accept=".xlsx, .xls, .csv"
                                    className="hidden"
                                />
                                
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg
                                    ${fileName ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-indigo-500 text-white shadow-indigo-500/20 group-hover:scale-110'}`}>
                                    {isParsing ? <Loader2 className="w-8 h-8 animate-spin" /> : fileName ? <CheckCircle2 className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
                                </div>

                                <div className="text-center relative z-10">
                                    <p className={`text-lg font-black ${colors.textPrimary} mb-1`}>
                                        {fileName ? fileName : 'Select Excel or CSV File'}
                                    </p>
                                    <p className={`text-sm ${colors.textMuted} font-medium`}>
                                        {fileName ? 'Click to change file' : 'Drag and drop or click to browse'}
                                    </p>
                                </div>

                                {/* Instruction Tooltip */}
                                <div className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-500/10 border border-slate-500/10">
                                    <HelpCircle className="w-4 h-4 text-slate-400" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        Required Columns: "Name", "Email", "Phone Number", "Business", "Domain", "Job Title"
                                    </p>
                                </div>
                            </div>

                            {/* Preview Table */}
                            {fileData.length > 0 && (
                                <div className="animate-fade-in-up">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className={`text-xs font-black uppercase tracking-widest ${colors.textMuted}`}>Data Preview ({fileData.length} users)</h3>
                                        <span className="px-2 py-1 rounded-md bg-indigo-500/10 text-indigo-500 text-[10px] font-black border border-indigo-500/20">VALID READY</span>
                                    </div>
                                    <div className={`rounded-2xl border ${colors.borderSecondary} overflow-hidden font-medium`}>
                                        <table className="w-full text-left border-collapse">
                                            <thead className={`${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-50'} text-[10px] uppercase font-black tracking-widest ${colors.textMuted} border-b border-white/5`}>
                                                <tr>
                                                    <th className="px-4 py-3">Name</th>
                                                    <th className="px-4 py-3">Email</th>
                                                    <th className="px-4 py-3">Role</th>
                                                    <th className="px-4 py-3">Job Title</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {fileData.slice(0, 5).map((user, idx) => (
                                                    <tr key={idx} className={`text-xs ${colors.textSecondary}`}>
                                                        <td className="px-4 py-3 font-bold">{user.name}</td>
                                                        <td className="px-4 py-3">{user.email}</td>
                                                        <td className="px-4 py-3">
                                                            <span className="px-2 py-0.5 rounded bg-slate-500/10 border border-slate-500/10">{user.role}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-400 italic">{user.job_title || '-'}</td>
                                                    </tr>
                                                ))}
                                                {fileData.length > 5 && (
                                                    <tr className={`text-[10px] ${colors.textMuted}`}>
                                                        <td colSpan={4} className="px-4 py-2 bg-slate-500/5 text-center font-bold italic tracking-wider">
                                                            Showing first 5 of {fileData.length} records...
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 animate-shake">
                                    <AlertCircle className="w-5 h-5 text-rose-500" />
                                    <p className="text-sm font-bold text-rose-500">{error}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Results Summary */
                        <div className="flex flex-col items-center justify-center py-12 space-y-6 animate-fade-in">
                            <div className={`w-24 h-24 rounded-full flex items-center justify-center ${results.failed === 0 ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-amber-500 shadow-amber-500/20'} text-white shadow-2xl`}>
                                {results.failed === 0 ? <CheckCircle2 className="w-12 h-12" /> : <AlertCircle className="w-12 h-12" />}
                            </div>
                            
                            <div className="text-center">
                                <h3 className={`text-2xl font-black ${colors.textPrimary} mb-2`}>Upload Results</h3>
                                <p className={`text-sm ${colors.textMuted} font-medium`}>Our automated engine has finished processing your records.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                                <div className={`p-6 rounded-3xl border ${colors.borderSecondary} bg-slate-500/5 text-center`}>
                                    <p className="text-3xl font-black text-emerald-500 mb-1">{results.success}</p>
                                    <p className={`text-[10px] font-black uppercase tracking-widest ${colors.textMuted}`}>Successful</p>
                                </div>
                                <div className={`p-6 rounded-3xl border ${colors.borderSecondary} bg-slate-500/5 text-center`}>
                                    <p className={`text-3xl font-black ${results.failed > 0 ? 'text-rose-500' : 'text-slate-500'} mb-1`}>{results.failed}</p>
                                    <p className={`text-[10px] font-black uppercase tracking-widest ${colors.textMuted}`}>Failed</p>
                                </div>
                            </div>

                            {results.errors.length > 0 && (
                                <div className="w-full max-w-lg mt-6">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-3 ml-2">Error Log</p>
                                    <div className="max-h-40 overflow-y-auto rounded-2xl border border-rose-500/20 bg-rose-500/5 divide-y divide-rose-500/10 scrollbar-thin">
                                        {results.errors.map((err, i) => (
                                            <div key={i} className="px-4 py-3 flex justify-between gap-4">
                                                <span className="text-xs font-bold text-slate-400">{err.email}</span>
                                                <span className="text-xs font-bold text-rose-500">{err.error}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className={`px-8 py-6 border-t ${colors.borderPrimary} flex items-center justify-end gap-4 bg-slate-500/5`}>
                    <button 
                        onClick={onClose}
                        disabled={isUploading}
                        className={`px-6 py-2.5 rounded-2xl border ${colors.borderSecondary} ${colors.textSecondary} hover:${colors.bgTertiary} hover:${colors.textPrimary} transition-all duration-300 font-bold text-sm`}
                    >
                        {results ? 'Close' : 'Cancel'}
                    </button>
                    {!results && (
                        <button 
                            onClick={handleBulkUpload}
                            disabled={fileData.length === 0 || isUploading}
                            className={`px-8 py-2.5 rounded-2xl bg-indigo-600 text-white font-black text-sm shadow-xl shadow-indigo-900/20 transition-all duration-300 flex items-center gap-2
                                ${fileData.length === 0 || isUploading ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:bg-indigo-500 hover:-translate-y-0.5 active:scale-95'}
                            `}
                        >
                            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                            {isUploading ? 'Processing Users...' : 'Confirm Bulk Creation'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
