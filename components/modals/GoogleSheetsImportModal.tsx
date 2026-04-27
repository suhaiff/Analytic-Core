import React, { useState } from 'react';
import { FileSpreadsheet, Settings, LogOut, Info } from 'lucide-react';
import { useTheme } from '../../ThemeContext';
import { getThemeClasses } from '../../theme';
import { fileService } from '../../services/fileService';
import { User } from '../../types';

interface GoogleSheetsImportModalProps {
    user: User;
    onClose: () => void;
    onImport: (sheets: { id: number, name: string, data: any[][], fileId: number }[], title: string, spreadsheetId: string) => void;
    singleSelection?: boolean;
    onShowInfoGuide?: () => void;
}

export const GoogleSheetsImportModal: React.FC<GoogleSheetsImportModalProps> = ({ user, onClose, onImport, singleSelection = false, onShowInfoGuide }) => {
    const { theme } = useTheme();
    const colors = getThemeClasses(theme);

    const [gsUrl, setGsUrl] = useState('');
    const [gsLoading, setGsLoading] = useState(false);
    const [gsError, setGsError] = useState('');
    const [gsMetadata, setGsMetadata] = useState<{ spreadsheetId: string, title: string, sheets: string[] } | null>(null);
    const [selectedSheets, setSelectedSheets] = useState<string[]>([]);

    const handleGSConnect = async () => {
        if (!gsUrl) return;
        setGsLoading(true);
        setGsError('');
        try {
            const metadata = await fileService.getGoogleSheetsMetadata(gsUrl);
            setGsMetadata(metadata);
            if (metadata.sheets && metadata.sheets.length > 0) {
                setSelectedSheets([metadata.sheets[0]]);
            }
        } catch (err: any) {
            setGsError(err.response?.data?.error || err.message || 'Failed to connect to Google Sheet');
        } finally {
            setGsLoading(false);
        }
    };

    const handleGSImport = async () => {
        if (!gsMetadata || selectedSheets.length === 0 || !user) return;
        setGsLoading(true);
        setGsError('');
        try {
            const result = await fileService.importGoogleSheet(
                user.id,
                gsMetadata.spreadsheetId,
                selectedSheets,
                gsMetadata.title
            );
            onImport(result.sheets, gsMetadata.title, gsMetadata.spreadsheetId);
            onClose();
        } catch (err: any) {
            setGsError(err.response?.data?.error || err.message || 'Failed to import Google Sheets');
        } finally {
            setGsLoading(false);
        }
    };

    const toggleGsSheet = (sheet: string) => {
        if (singleSelection) {
            setSelectedSheets([sheet]);
        } else {
            setSelectedSheets(prev =>
                prev.includes(sheet)
                    ? prev.filter(s => s !== sheet)
                    : [...prev, sheet]
            );
        }
    };

    return (
        <div className={`fixed inset-0 z-[100] ${colors.overlayBg} backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in`}>
            <div className={`${colors.modalBg} border ${colors.borderPrimary} rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl transform scale-100 max-h-[90vh] overflow-y-auto`}>
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/10 rounded-lg">
                            <FileSpreadsheet className="w-6 h-6 text-green-500" />
                        </div>
                        <h3 className={`text-xl font-bold ${colors.textPrimary}`}>Connect Google Sheet</h3>
                    </div>
                    <div className="flex items-center gap-1">
                        {onShowInfoGuide && (
                            <button
                                onClick={onShowInfoGuide}
                                className={`p-2 rounded-lg hover:bg-green-500/10 ${colors.textMuted} hover:text-green-400 transition`}
                                title="How to use Google Sheets Import"
                            >
                                <Info className="w-5 h-5" />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-lg hover:${colors.bgTertiary} ${colors.textMuted} transition`}
                        >
                            <LogOut className="w-5 h-5 rotate-180" />
                        </button>
                    </div>
                </div>

                {!gsMetadata ? (
                    <div className="space-y-6">
                        <div>
                            <label className={`block text-sm font-medium ${colors.textSecondary} mb-2`}>
                                Google Sheet URL
                            </label>
                            <input
                                type="text"
                                value={gsUrl}
                                onChange={(e) => setGsUrl(e.target.value)}
                                placeholder="https://docs.google.com/spreadsheets/d/..."
                                className={`w-full px-4 py-3 rounded-xl ${colors.bgTertiary} border ${colors.borderPrimary} ${colors.textPrimary} focus:ring-2 focus:ring-indigo-500 outline-none transition`}
                            />
                        </div>

                        <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-indigo-500/5' : 'bg-indigo-50'} border ${theme === 'dark' ? 'border-indigo-500/20' : 'border-indigo-100'}`}>
                            <h4 className={`text-sm font-bold ${colors.textPrimary} mb-2 flex items-center gap-2`}>
                                <Settings className="w-4 h-4 text-indigo-400" />
                                Setup Instructions
                            </h4>
                            <p className={`text-xs ${colors.textSecondary} leading-relaxed`}>
                                Please share your Google Sheet with viewer access to:
                                <br />
                                <code className="block mt-2 p-2 bg-black/20 rounded font-mono text-indigo-300 break-all">
                                    dashboard-sheets-reader@diesel-skyline-479213-f1.iam.gserviceaccount.com
                                </code>
                                <br />
                                <span className="text-[10px] opacity-70 italic mt-2 block">
                                    Note: If your file is in Excel format (.xlsx) in Drive, you must first open it in Sheets and click <b>File &gt; Save as Google Sheets</b>.
                                </span>
                            </p>
                        </div>

                        {gsError && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                {gsError}
                            </div>
                        )}

                        <button
                            onClick={handleGSConnect}
                            disabled={gsLoading || !gsUrl}
                            className={`w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-lg shadow-indigo-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                        >
                            {gsLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>Connect Sheet</>
                            )}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div>
                            <div className={`text-sm font-medium ${colors.textMuted} mb-1`}>Connected to:</div>
                            <div className={`text-lg font-bold ${colors.textPrimary}`}>{gsMetadata.title}</div>
                        </div>

                        <div>
                            <label className={`block text-sm font-medium ${colors.textSecondary} mb-2`}>
                                Select Sheet Tab {singleSelection && "(Single Selection)"}
                            </label>
                            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                {gsMetadata.sheets.map((sheet) => (
                                    <button
                                        key={sheet}
                                        onClick={() => toggleGsSheet(sheet)}
                                        className={`px-4 py-3 rounded-xl border text-left transition-all ${selectedSheets.includes(sheet)
                                            ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                                            : `${colors.borderPrimary} ${colors.bgTertiary} ${colors.textSecondary} hover:border-indigo-500/50`
                                            }`}
                                    >
                                        {sheet}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {gsError && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                {gsError}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setGsMetadata(null); setSelectedSheets([]); }}
                                className={`flex-1 py-3 rounded-xl border ${colors.borderPrimary} ${colors.textSecondary} font-bold hover:${colors.bgTertiary} transition`}
                            >
                                Back
                            </button>
                            <button
                                onClick={handleGSImport}
                                disabled={gsLoading || selectedSheets.length === 0}
                                className="flex-[2] py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {gsLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>{selectedSheets.length > 1 ? `Import ${selectedSheets.length} Sheets` : 'Import Sheet'}</>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
