import React, { useState } from 'react';
import { LogOut, Settings, Info, Cloud, FileSpreadsheet } from 'lucide-react';
import { useTheme } from '../../ThemeContext';
import { getThemeClasses } from '../../theme';
import { fileService } from '../../services/fileService';

interface AzureBlobImportModalProps {
    onClose: () => void;
    onImport: (file: File) => void;
    onShowInfoGuide?: () => void;
}

export const AzureBlobImportModal: React.FC<AzureBlobImportModalProps> = ({ onClose, onImport, onShowInfoGuide }) => {
    const { theme } = useTheme();
    const colors = getThemeClasses(theme);

    const [config, setConfig] = useState({
        connectionString: '',
        containerName: ''
    });
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [connected, setConnected] = useState(false);
    const [files, setFiles] = useState<any[]>([]);
    const [selectedBlobName, setSelectedBlobName] = useState<string | null>(null);

    const handleTest = async () => {
        setLoading(true);
        setError('');
        try {
            await fileService.testAzureConnection(config.connectionString, config.containerName);
            setConnected(true);
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Connection failed');
        } finally {
            setLoading(false);
        }
    };

    const handleFetchFiles = async () => {
        setLoading(true);
        setError('');
        try {
            const result = await fileService.listAzureFiles(config.connectionString, config.containerName);
            setFiles(result.files || []);
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Failed to list files');
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        if (!selectedBlobName) return;
        setLoading(true);
        setError('');
        try {
            const blob = await fileService.fetchAzureFile(config.connectionString, config.containerName, selectedBlobName);
            
            const fileName = selectedBlobName.split('/').pop() || 'azure-import.csv';
            const file = new File([blob], fileName, { type: blob.type || 'text/csv' });
            
            onImport(file);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to download file');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`fixed inset-0 z-[100] ${colors.overlayBg} backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in`}>
            <div className={`${colors.modalBg} border ${colors.borderPrimary} rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl transform scale-100 max-h-[90vh] overflow-y-auto custom-scrollbar`}>
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-sky-500/10 rounded-lg border border-sky-500/20">
                            <Cloud className="w-6 h-6 text-sky-500" />
                        </div>
                        <h3 className={`text-xl font-bold ${colors.textPrimary}`}>Azure Blob Import</h3>
                    </div>
                    <div className="flex items-center gap-1">
                        {onShowInfoGuide && (
                            <button onClick={onShowInfoGuide} className={`p-2 rounded-lg hover:bg-sky-500/10 ${colors.textMuted} hover:text-sky-400 transition`}>
                                <Info className="w-5 h-5" />
                            </button>
                        )}
                        <button onClick={onClose} className={`p-2 rounded-lg hover:${colors.bgTertiary} ${colors.textMuted} transition`}>
                            <LogOut className="w-5 h-5 rotate-180" />
                        </button>
                    </div>
                </div>

                {!connected ? (
                    <div className="space-y-4">
                        <div>
                            <label className={`block text-sm font-medium ${colors.textSecondary} mb-1`}>Connection String</label>
                            <input
                                type="password"
                                value={config.connectionString}
                                onChange={(e) => setConfig({ ...config, connectionString: e.target.value })}
                                className={`w-full px-4 py-3 rounded-xl ${colors.bgTertiary} border ${colors.borderPrimary} ${colors.textPrimary} focus:ring-2 focus:ring-sky-500 outline-none transition`}
                                placeholder="DefaultEndpointsProtocol=https;AccountName=...;"
                            />
                        </div>
                        <div>
                            <label className={`block text-sm font-medium ${colors.textSecondary} mb-1`}>Container Name</label>
                            <input
                                type="text"
                                value={config.containerName}
                                onChange={(e) => setConfig({ ...config, containerName: e.target.value })}
                                className={`w-full px-4 py-3 rounded-xl ${colors.bgTertiary} border ${colors.borderPrimary} ${colors.textPrimary} focus:ring-2 focus:ring-sky-500 outline-none transition`}
                                placeholder="my-container"
                            />
                        </div>

                        <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-sky-500/5' : 'bg-sky-50'} border ${theme === 'dark' ? 'border-sky-500/20' : 'border-sky-100'} mt-4`}>
                            <h4 className={`text-sm font-bold ${colors.textPrimary} mb-1 flex items-center gap-2`}>
                                <Settings className="w-4 h-4 text-sky-500" /> Security Note
                            </h4>
                            <p className={`text-xs ${colors.textSecondary}`}>Credentials are transmitted securely to the server to establish a stream. They are not stored persistently.</p>
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mt-2">{error}</div>
                        )}

                        <button
                            onClick={handleTest}
                            disabled={loading || !config.connectionString || !config.containerName}
                            className={`w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold transition shadow-lg shadow-sky-900/20 disabled:opacity-50 mt-6 flex justify-center items-center`}
                        >
                            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Connect & Test'}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <div className={`text-sm font-medium ${colors.textMuted} mb-1`}>Connected to Container:</div>
                            <div className={`text-lg font-bold ${colors.textPrimary}`}>{config.containerName}</div>
                        </div>

                        {files.length === 0 ? (
                            <div>
                                {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">{error}</div>}
                                <button
                                    onClick={handleFetchFiles}
                                    disabled={loading}
                                    className={`w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold transition flex justify-center items-center`}
                                >
                                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'List Files'}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className={`block text-sm font-medium ${colors.textSecondary} mb-2`}>Select a CSV/Excel File</label>
                                    <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                        {files.map((file) => (
                                            <button
                                                key={file.id}
                                                onClick={() => setSelectedBlobName(file.id)}
                                                className={`px-4 py-3 rounded-xl border text-left transition-all flex items-center gap-3 ${selectedBlobName === file.id ? 'border-sky-500 bg-sky-500/10 text-sky-500' : `${colors.borderPrimary} ${colors.bgTertiary} ${colors.textPrimary} hover:border-sky-500/50`}`}
                                            >
                                                <FileSpreadsheet className={`w-5 h-5 ${selectedBlobName === file.id ? 'text-sky-500' : colors.textMuted}`} />
                                                <div className="flex-1 overflow-hidden">
                                                    <div className="truncate font-medium text-sm">{file.name}</div>
                                                    <div className={`text-[10px] ${colors.textMuted}`}>{(file.size / 1024).toFixed(1)} KB • {new Date(file.lastModified).toLocaleDateString()}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => { setConnected(false); setFiles([]); setSelectedBlobName(null); }}
                                        className={`flex-1 py-3 rounded-xl border ${colors.borderPrimary} ${colors.textSecondary} font-bold hover:${colors.bgTertiary} transition`}
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleImport}
                                        disabled={loading || !selectedBlobName}
                                        className={`flex-[2] py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold transition flex justify-center items-center disabled:opacity-50`}
                                    >
                                        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Import File'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
