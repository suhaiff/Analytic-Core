import React, { useState } from 'react';
import { FileText, Settings, LogOut, Info, Database, Sparkles } from 'lucide-react';
import { useTheme } from '../../ThemeContext';
import { getThemeClasses } from '../../theme';
import { fileService } from '../../services/fileService';
import { User } from '../../types';

interface SqlDatabaseImportModalProps {
    user: User;
    onClose: () => void;
    onImport: (tables: { id: number, name: string, data: any[][], fileId: number }[], title: string, connectionId: string) => void;
    singleSelection?: boolean;
    onShowInfoGuide?: () => void;
}

export const SqlDatabaseImportModal: React.FC<SqlDatabaseImportModalProps> = ({ user, onClose, onImport, singleSelection = false, onShowInfoGuide }) => {
    const { theme } = useTheme();
    const colors = getThemeClasses(theme);

    const [sqlDbConfig, setSqlDbConfig] = useState({
        engine: 'mysql',
        host: '',
        port: 3306,
        database: '',
        user: '',
        password: ''
    });
    const [sqlDbLoading, setSqlDbLoading] = useState(false);
    const [sqlDbError, setSqlDbError] = useState('');
    const [sqlDbConnected, setSqlDbConnected] = useState(false);
    const [sqlDbTables, setSqlDbTables] = useState<string[]>([]);
    const [selectedTables, setSelectedTables] = useState<string[]>([]);

    const handleSqlDbTest = async () => {
        setSqlDbLoading(true);
        setSqlDbError('');
        try {
            const result = await fileService.testSqlConnection(sqlDbConfig);
            if (result.success) {
                setSqlDbConnected(true);
                setSqlDbError('');
            } else {
                setSqlDbError(result.error || 'Connection test failed');
            }
        } catch (err: any) {
            setSqlDbError(err.response?.data?.error || err.message || 'Failed to test connection');
        } finally {
            setSqlDbLoading(false);
        }
    };

    const handleSqlDbFetchTables = async () => {
        setSqlDbLoading(true);
        setSqlDbError('');
        try {
            const result = await fileService.getSqlTables(sqlDbConfig);
            setSqlDbTables(result.tables || []);
            if (result.tables && result.tables.length > 0) {
                setSelectedTables([result.tables[0]]);
            }
        } catch (err: any) {
            setSqlDbError(err.response?.data?.error || err.message || 'Failed to fetch tables');
        } finally {
            setSqlDbLoading(false);
        }
    };

    const handleSqlDbImport = async () => {
        if (selectedTables.length === 0 || !user) return;
        setSqlDbLoading(true);
        setSqlDbError('');
        try {
            const result = await fileService.importSqlDatabase(
                user.id,
                sqlDbConfig,
                selectedTables,
                `${sqlDbConfig.engine.toUpperCase()}: ${sqlDbConfig.database}`
            );

            onImport(
                result.tables,
                result.title,
                `${sqlDbConfig.engine}:${sqlDbConfig.host}:${sqlDbConfig.database}`
            );

            onClose();
        } catch (err: any) {
            setSqlDbError(err.response?.data?.error || err.message || 'Failed to import tables');
        } finally {
            setSqlDbLoading(false);
        }
    };

    const toggleSqlTable = (table: string) => {
        if (singleSelection) {
            setSelectedTables([table]);
        } else {
            setSelectedTables(prev =>
                prev.includes(table)
                    ? prev.filter(t => t !== table)
                    : [...prev, table]
            );
        }
    };

    return (
        <div className={`fixed inset-0 z-[100] ${colors.overlayBg} backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in`}>
            <div className={`${colors.modalBg} border ${colors.borderPrimary} rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl transform scale-100 max-h-[90vh] overflow-y-auto`}>
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <FileText className="w-6 h-6 text-blue-500" />
                        </div>
                        <h3 className={`text-xl font-bold ${colors.textPrimary}`}>Connect SQL Database</h3>
                    </div>
                    <div className="flex items-center gap-1">
                        {onShowInfoGuide && (
                            <button
                                onClick={onShowInfoGuide}
                                className={`p-2 rounded-lg hover:bg-blue-500/10 ${colors.textMuted} hover:text-blue-400 transition`}
                                title="How to use SQL Database Import"
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

                {!sqlDbConnected ? (
                    <div className="space-y-6">
                        <div>
                            <label className={`block text-sm font-medium ${colors.textSecondary} mb-2`}>
                                Database Type
                            </label>
                            <select
                                value={sqlDbConfig.engine}
                                onChange={(e) => {
                                    const engine = e.target.value;
                                    setSqlDbConfig({
                                        ...sqlDbConfig,
                                        engine,
                                        port: engine === 'mysql' ? 3306 : 5432
                                    });
                                }}
                                className={`w-full px-4 py-3 rounded-xl ${colors.bgTertiary} border ${colors.borderPrimary} ${colors.textPrimary} focus:ring-2 focus:ring-blue-500 outline-none transition`}
                            >
                                <option value="mysql">MySQL</option>
                                <option value="postgresql">PostgreSQL</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={`block text-sm font-medium ${colors.textSecondary} mb-2`}>
                                    Host
                                </label>
                                <input
                                    type="text"
                                    value={sqlDbConfig.host}
                                    onChange={(e) => setSqlDbConfig({ ...sqlDbConfig, host: e.target.value })}
                                    placeholder="localhost"
                                    className={`w-full px-4 py-3 rounded-xl ${colors.bgTertiary} border ${colors.borderPrimary} ${colors.textPrimary} focus:ring-2 focus:ring-blue-500 outline-none transition`}
                                />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium ${colors.textSecondary} mb-2`}>
                                    Port
                                </label>
                                <input
                                    type="number"
                                    value={sqlDbConfig.port}
                                    onChange={(e) => setSqlDbConfig({ ...sqlDbConfig, port: parseInt(e.target.value) || 3306 })}
                                    className={`w-full px-4 py-3 rounded-xl ${colors.bgTertiary} border ${colors.borderPrimary} ${colors.textPrimary} focus:ring-2 focus:ring-blue-500 outline-none transition`}
                                />
                            </div>
                        </div>

                        <div>
                            <label className={`block text-sm font-medium ${colors.textSecondary} mb-2`}>
                                Database Name
                            </label>
                            <input
                                type="text"
                                value={sqlDbConfig.database}
                                onChange={(e) => setSqlDbConfig({ ...sqlDbConfig, database: e.target.value })}
                                placeholder="my_database"
                                className={`w-full px-4 py-3 rounded-xl ${colors.bgTertiary} border ${colors.borderPrimary} ${colors.textPrimary} focus:ring-2 focus:ring-blue-500 outline-none transition`}
                            />
                        </div>

                        <div>
                            <label className={`block text-sm font-medium ${colors.textSecondary} mb-2`}>
                                Username
                            </label>
                            <input
                                type="text"
                                value={sqlDbConfig.user}
                                onChange={(e) => setSqlDbConfig({ ...sqlDbConfig, user: e.target.value })}
                                placeholder="username"
                                className={`w-full px-4 py-3 rounded-xl ${colors.bgTertiary} border ${colors.borderPrimary} ${colors.textPrimary} focus:ring-2 focus:ring-blue-500 outline-none transition`}
                            />
                        </div>

                        <div>
                            <label className={`block text-sm font-medium ${colors.textSecondary} mb-2`}>
                                Password
                            </label>
                            <input
                                type="password"
                                value={sqlDbConfig.password}
                                onChange={(e) => setSqlDbConfig({ ...sqlDbConfig, password: e.target.value })}
                                placeholder="••••••••"
                                className={`w-full px-4 py-3 rounded-xl ${colors.bgTertiary} border ${colors.borderPrimary} ${colors.textPrimary} focus:ring-2 focus:ring-blue-500 outline-none transition`}
                            />
                        </div>

                        <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-blue-500/5' : 'bg-blue-50'} border ${theme === 'dark' ? 'border-blue-500/20' : 'border-blue-100'}`}>
                            <h4 className={`text-sm font-bold ${colors.textPrimary} mb-2 flex items-center gap-2`}>
                                <Settings className="w-4 h-4 text-blue-400" />
                                Security Note
                            </h4>
                            <p className={`text-xs ${colors.textSecondary} leading-relaxed`}>
                                Connection credentials are transmitted securely and NOT stored. Only SELECT queries are allowed.
                            </p>
                        </div>

                        {(sqlDbConfig.host === 'localhost' || sqlDbConfig.host === '127.0.0.1') && window.location.hostname !== 'localhost' && (
                            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs leading-relaxed">
                                <div className="font-bold flex items-center gap-2 mb-1">
                                    <Database className="w-3.5 h-3.5" />
                                    Network Tip: Localhost detected
                                </div>
                                You are using a hosted app but trying to connect to 'localhost'. The server cannot reach your physical computer. Use a public IP or a tunnel (e.g., ngrok) to expose your local database.
                            </div>
                        )}

                        {sqlDbError && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                {sqlDbError}
                            </div>
                        )}

                        <button
                            onClick={handleSqlDbTest}
                            disabled={sqlDbLoading || !sqlDbConfig.host || !sqlDbConfig.database || !sqlDbConfig.user}
                            className={`w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                        >
                            {sqlDbLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>Test Connection</>
                            )}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div>
                            <div className={`text-sm font-medium ${colors.textMuted} mb-1`}>Connected to:</div>
                            <div className={`text-lg font-bold ${colors.textPrimary}`}>{sqlDbConfig.host}:{sqlDbConfig.port}/{sqlDbConfig.database}</div>
                        </div>

                        {sqlDbTables.length === 0 ? (
                            <div>
                                {sqlDbError && (
                                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
                                        {sqlDbError}
                                    </div>
                                )}
                                <button
                                    onClick={handleSqlDbFetchTables}
                                    disabled={sqlDbLoading}
                                    className={`w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                                >
                                    {sqlDbLoading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>Fetch Tables</>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <>
                                <div>
                                    <label className={`block text-sm font-medium ${colors.textSecondary} mb-2`}>
                                        Select Table {singleSelection && "(Single Selection)"}
                                    </label>
                                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                        {sqlDbTables.map((table) => {
                                            const isSelected = selectedTables.includes(table);
                                            return (
                                                <button
                                                    key={table}
                                                    onClick={() => toggleSqlTable(table)}
                                                    className={`px-4 py-3 rounded-xl border text-left transition-all flex justify-between items-center ${isSelected
                                                        ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                                                        : `${colors.borderPrimary} ${colors.bgTertiary} ${colors.textSecondary} hover:border-blue-500/50`
                                                        }`}
                                                >
                                                    <span>{table}</span>
                                                    {isSelected && <Sparkles className="w-4 h-4 animate-pulse" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {sqlDbError && (
                                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                        {sqlDbError}
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setSqlDbConnected(false);
                                            setSqlDbTables([]);
                                            setSelectedTables([]);
                                        }}
                                        className={`flex-1 py-3 rounded-xl border ${colors.borderPrimary} ${colors.textSecondary} font-bold hover:${colors.bgTertiary} transition`}
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleSqlDbImport}
                                        disabled={sqlDbLoading || selectedTables.length === 0}
                                        className={`flex-[2] py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                                    >
                                        {sqlDbLoading ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>{selectedTables.length > 1 ? `Import ${selectedTables.length} Tables` : 'Import Table'}</>
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
