import React, { useState } from 'react';
import { Database, LogOut, Settings, Info, Cloud, Sparkles, Server } from 'lucide-react';
import { useTheme } from '../../ThemeContext';
import { getThemeClasses } from '../../theme';
import { fileService } from '../../services/fileService';
import { User } from '../../types';

interface DWImportModalProps {
    user: User;
    engine: 'bigquery' | 'snowflake' | 'azuresql' | 'databricks' | 'redshift' | 'mongodb';
    onClose: () => void;
    onImport: (tables: any[], title: string, connectionId: string) => void;
    onShowInfoGuide?: () => void;
}

export const DataWarehouseImportModal: React.FC<DWImportModalProps> = ({ user, engine, onClose, onImport, onShowInfoGuide }) => {
    const { theme } = useTheme();
    const colors = getThemeClasses(theme);

    const [config, setConfig] = useState<any>({});
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [connected, setConnected] = useState(false);
    const [tables, setTables] = useState<string[]>([]);
    const [selectedTables, setSelectedTables] = useState<string[]>([]);

    const engineDetails = {
        bigquery: { title: 'Google BigQuery', icon: Cloud, color: 'blue' },
        snowflake: { title: 'Snowflake', icon: Cloud, color: 'cyan' },
        azuresql: { title: 'Azure SQL Database', icon: Server, color: 'sky' },
        databricks: { title: 'Databricks SQL', icon: Server, color: 'orange' },
        redshift: { title: 'Amazon Redshift', icon: Database, color: 'rose' },
        mongodb: { title: 'MongoDB Atlas', icon: Database, color: 'green' }
    };
    
    const details = engineDetails[engine];

    const handleTest = async () => {
        setLoading(true);
        setError('');
        try {
            await fileService.testDWConnection(engine, config);
            setConnected(true);
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Connection failed');
        } finally {
            setLoading(false);
        }
    };

    const handleFetchTables = async () => {
        setLoading(true);
        setError('');
        try {
            const result = await fileService.getDWTables(engine, config);
            setTables(result.tables || []);
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Failed to list tables/collections');
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        if (selectedTables.length === 0) return;
        setLoading(true);
        setError('');
        try {
            const result = await fileService.importDWTable(
                user.id,
                engine,
                config,
                selectedTables,
                `${details.title} Import`
            );
            
            onImport(result.tables, result.title, `${engine}_connection`);
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Failed to import data');
        } finally {
            setLoading(false);
        }
    };

    const toggleTable = (table: string) => {
        setSelectedTables(prev => prev.includes(table) ? prev.filter(t => t !== table) : [...prev, table]);
    };

    const renderInputs = () => {
        switch (engine) {
            case 'bigquery':
                return (
                    <>
                        <div>
                            <label className={`block text-sm font-medium ${colors.textSecondary} mb-1`}>Service Account JSON key</label>
                            <textarea
                                value={config.credentials || ''}
                                onChange={(e) => setConfig({ ...config, credentials: e.target.value })}
                                className={`w-full h-32 px-4 py-3 rounded-xl ${colors.bgTertiary} border ${colors.borderPrimary} ${colors.textPrimary} focus:ring-2 focus:ring-${details.color}-500 outline-none transition custom-scrollbar font-mono text-xs`}
                                placeholder='{ "type": "service_account", ... }'
                            />
                        </div>
                        <div>
                            <label className={`block text-sm font-medium ${colors.textSecondary} mb-1`}>Dataset Name</label>
                            <input
                                type="text"
                                value={config.dataset || ''}
                                onChange={(e) => setConfig({ ...config, dataset: e.target.value })}
                                className={`w-full px-4 py-3 rounded-xl ${colors.bgTertiary} border ${colors.borderPrimary} ${colors.textPrimary} focus:ring-2 focus:ring-${details.color}-500 outline-none transition`}
                                placeholder="my_dataset"
                            />
                        </div>
                    </>
                );
            case 'snowflake':
                return (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={`block text-sm font-medium ${colors.textSecondary} mb-1`}>Account Identifier</label>
                                <input type="text" value={config.account || ''} onChange={(e) => setConfig({ ...config, account: e.target.value })} className={`w-full px-4 py-3 rounded-xl ${colors.bgTertiary} border ${colors.borderPrimary} ${colors.textPrimary} focus:ring-2 focus:ring-${details.color}-500 outline-none transition`} placeholder="xy12345.us-east-1" />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium ${colors.textSecondary} mb-1`}>Warehouse</label>
                                <input type="text" value={config.warehouse || ''} onChange={(e) => setConfig({ ...config, warehouse: e.target.value })} className={`w-full px-4 py-3 rounded-xl ${colors.bgTertiary} border ${colors.borderPrimary} ${colors.textPrimary} focus:ring-2 focus:ring-${details.color}-500 outline-none transition`} placeholder="COMPUTE_WH" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={`block text-sm font-medium ${colors.textSecondary} mb-1`}>Database</label>
                                <input type="text" value={config.database || ''} onChange={(e) => setConfig({ ...config, database: e.target.value })} className={`w-full px-4 py-3 rounded-xl ${colors.bgTertiary} border ${colors.borderPrimary} ${colors.textPrimary} focus:ring-2 focus:ring-${details.color}-500 outline-none transition`} placeholder="SNOWFLAKE_SAMPLE_DATA" />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium ${colors.textSecondary} mb-1`}>Schema</label>
                                <input type="text" value={config.schema || ''} onChange={(e) => setConfig({ ...config, schema: e.target.value })} className={`w-full px-4 py-3 rounded-xl ${colors.bgTertiary} border ${colors.borderPrimary} ${colors.textPrimary} focus:ring-2 focus:ring-${details.color}-500 outline-none transition`} placeholder="PUBLIC" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={`block text-sm font-medium ${colors.textSecondary} mb-1`}>Username</label>
                                <input type="text" value={config.username || ''} onChange={(e) => setConfig({ ...config, username: e.target.value })} className={`w-full px-4 py-3 rounded-xl ${colors.bgTertiary} border ${colors.borderPrimary} ${colors.textPrimary} focus:ring-2 focus:ring-${details.color}-500 outline-none transition`} />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium ${colors.textSecondary} mb-1`}>Password</label>
                                <input type="password" value={config.password || ''} onChange={(e) => setConfig({ ...config, password: e.target.value })} className={`w-full px-4 py-3 rounded-xl ${colors.bgTertiary} border ${colors.borderPrimary} ${colors.textPrimary} focus:ring-2 focus:ring-${details.color}-500 outline-none transition`} />
                            </div>
                        </div>
                    </>
                );
            case 'databricks':
                return (
                    <>
                        <div>
                            <label className={`block text-sm font-medium ${colors.textSecondary} mb-1`}>Server Hostname</label>
                            <input type="text" value={config.host || ''} onChange={(e) => setConfig({ ...config, host: e.target.value })} className={`w-full px-4 py-3 rounded-xl ${colors.bgTertiary} border ${colors.borderPrimary} ${colors.textPrimary} focus:ring-2 focus:ring-${details.color}-500 outline-none transition`} placeholder="adb-....azuredatabricks.net" />
                        </div>
                        <div>
                            <label className={`block text-sm font-medium ${colors.textSecondary} mb-1`}>HTTP Path</label>
                            <input type="text" value={config.path || ''} onChange={(e) => setConfig({ ...config, path: e.target.value })} className={`w-full px-4 py-3 rounded-xl ${colors.bgTertiary} border ${colors.borderPrimary} ${colors.textPrimary} focus:ring-2 focus:ring-${details.color}-500 outline-none transition`} placeholder="/sql/1.0/endpoints/..." />
                        </div>
                        <div>
                            <label className={`block text-sm font-medium ${colors.textSecondary} mb-1`}>Personal Access Token</label>
                            <input type="password" value={config.token || ''} onChange={(e) => setConfig({ ...config, token: e.target.value })} className={`w-full px-4 py-3 rounded-xl ${colors.bgTertiary} border ${colors.borderPrimary} ${colors.textPrimary} focus:ring-2 focus:ring-${details.color}-500 outline-none transition`} placeholder="dapi..." />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={`block text-sm font-medium ${colors.textSecondary} mb-1`}>Catalog</label>
                                <input type="text" value={config.catalog || ''} onChange={(e) => setConfig({ ...config, catalog: e.target.value })} className={`w-full px-4 py-3 rounded-xl ${colors.bgTertiary} border ${colors.borderPrimary} ${colors.textPrimary} focus:ring-2 focus:ring-${details.color}-500 outline-none transition`} placeholder="hive_metastore" />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium ${colors.textSecondary} mb-1`}>Schema</label>
                                <input type="text" value={config.schema || ''} onChange={(e) => setConfig({ ...config, schema: e.target.value })} className={`w-full px-4 py-3 rounded-xl ${colors.bgTertiary} border ${colors.borderPrimary} ${colors.textPrimary} focus:ring-2 focus:ring-${details.color}-500 outline-none transition`} placeholder="default" />
                            </div>
                        </div>
                    </>
                );
            case 'azuresql':
            case 'redshift':
                return (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={`block text-sm font-medium ${colors.textSecondary} mb-1`}>Server Host</label>
                                <input type="text" value={config[engine === 'azuresql' ? 'server' : 'host'] || ''} onChange={(e) => setConfig({ ...config, [engine === 'azuresql' ? 'server' : 'host']: e.target.value })} className={`w-full px-4 py-3 rounded-xl ${colors.bgTertiary} border ${colors.borderPrimary} ${colors.textPrimary} focus:ring-2 focus:ring-${details.color}-500 outline-none transition`} />
                            </div>
                            {engine === 'redshift' && (
                                <div>
                                    <label className={`block text-sm font-medium ${colors.textSecondary} mb-1`}>Port</label>
                                    <input type="text" value={config.port || '5439'} onChange={(e) => setConfig({ ...config, port: e.target.value })} className={`w-full px-4 py-3 rounded-xl ${colors.bgTertiary} border ${colors.borderPrimary} ${colors.textPrimary} focus:ring-2 focus:ring-${details.color}-500 outline-none transition`} />
                                </div>
                            )}
                        </div>
                        <div>
                            <label className={`block text-sm font-medium ${colors.textSecondary} mb-1`}>Database Name</label>
                            <input type="text" value={config.database || ''} onChange={(e) => setConfig({ ...config, database: e.target.value })} className={`w-full px-4 py-3 rounded-xl ${colors.bgTertiary} border ${colors.borderPrimary} ${colors.textPrimary} focus:ring-2 focus:ring-${details.color}-500 outline-none transition`} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={`block text-sm font-medium ${colors.textSecondary} mb-1`}>Username</label>
                                <input type="text" value={config.user || ''} onChange={(e) => setConfig({ ...config, user: e.target.value })} className={`w-full px-4 py-3 rounded-xl ${colors.bgTertiary} border ${colors.borderPrimary} ${colors.textPrimary} focus:ring-2 focus:ring-${details.color}-500 outline-none transition`} />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium ${colors.textSecondary} mb-1`}>Password</label>
                                <input type="password" value={config.password || ''} onChange={(e) => setConfig({ ...config, password: e.target.value })} className={`w-full px-4 py-3 rounded-xl ${colors.bgTertiary} border ${colors.borderPrimary} ${colors.textPrimary} focus:ring-2 focus:ring-${details.color}-500 outline-none transition`} />
                            </div>
                        </div>
                    </>
                );
            case 'mongodb':
                return (
                    <>
                        <div>
                            <label className={`block text-sm font-medium ${colors.textSecondary} mb-1`}>MongoDB Connection String</label>
                            <input
                                type="password"
                                value={config.connectionString || ''}
                                onChange={(e) => setConfig({ ...config, connectionString: e.target.value })}
                                className={`w-full px-4 py-3 rounded-xl ${colors.bgTertiary} border ${colors.borderPrimary} ${colors.textPrimary} focus:ring-2 focus:ring-${details.color}-500 outline-none transition`}
                                placeholder="mongodb+srv://user:pass@cluster.mongodb.net"
                            />
                        </div>
                        <div>
                            <label className={`block text-sm font-medium ${colors.textSecondary} mb-1`}>Database Name</label>
                            <input
                                type="text"
                                value={config.database || ''}
                                onChange={(e) => setConfig({ ...config, database: e.target.value })}
                                className={`w-full px-4 py-3 rounded-xl ${colors.bgTertiary} border ${colors.borderPrimary} ${colors.textPrimary} focus:ring-2 focus:ring-${details.color}-500 outline-none transition`}
                                placeholder="my-database"
                            />
                        </div>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div className={`fixed inset-0 z-[100] ${colors.overlayBg} backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in`}>
            <div className={`${colors.modalBg} border ${colors.borderPrimary} rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl transform scale-100 max-h-[90vh] overflow-y-auto custom-scrollbar`}>
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 bg-${details.color}-500/10 rounded-lg border border-${details.color}-500/20`}>
                            <details.icon className={`w-6 h-6 text-${details.color}-500`} />
                        </div>
                        <h3 className={`text-xl font-bold ${colors.textPrimary}`}>{details.title} Import</h3>
                    </div>
                    <div className="flex items-center gap-1">
                        {onShowInfoGuide && (
                            <button onClick={onShowInfoGuide} className={`p-2 rounded-lg hover:bg-${details.color}-500/10 ${colors.textMuted} hover:text-${details.color}-400 transition`}>
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
                        {renderInputs()}

                        <div className={`p-4 rounded-xl ${theme === 'dark' ? `bg-${details.color}-500/5` : `bg-${details.color}-50`} border ${theme === 'dark' ? `border-${details.color}-500/20` : `border-${details.color}-100`} mt-4`}>
                            <h4 className={`text-sm font-bold ${colors.textPrimary} mb-1 flex items-center gap-2`}>
                                <Settings className={`w-4 h-4 text-${details.color}-500`} /> Query Limits Enforced
                            </h4>
                            <p className={`text-xs ${colors.textSecondary}`}>Queries are strictly limited to `LIMIT 10000` rows per table/collection to prevent memory issues. Credentials are not stored.</p>
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mt-2">{error}</div>
                        )}

                        <button
                            onClick={handleTest}
                            disabled={loading || Object.keys(config).length === 0}
                            className={`w-full py-3 rounded-xl bg-${details.color}-600 hover:bg-${details.color}-500 text-white font-bold transition shadow-lg shadow-${details.color}-900/20 disabled:opacity-50 mt-6 flex justify-center items-center`}
                        >
                            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Connect & Test'}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <div className={`text-sm font-medium ${colors.textMuted} mb-1`}>Connection Status:</div>
                            <div className={`text-lg font-bold text-green-500 flex items-center gap-2`}>
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> Active
                            </div>
                        </div>

                        {tables.length === 0 ? (
                            <div>
                                {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">{error}</div>}
                                <button
                                    onClick={handleFetchTables}
                                    disabled={loading}
                                    className={`w-full py-3 rounded-xl bg-${details.color}-600 hover:bg-${details.color}-500 text-white font-bold transition flex justify-center items-center`}
                                >
                                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : `Fetch ${engine === 'mongodb' ? 'Collections' : 'Tables'}`}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className={`block text-sm font-medium ${colors.textSecondary} mb-2`}>Select {engine === 'mongodb' ? 'Collections' : 'Tables'} to Import</label>
                                    <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                        {tables.map((table) => {
                                            const isSelected = selectedTables.includes(table);
                                            return (
                                                <button
                                                    key={table}
                                                    onClick={() => toggleTable(table)}
                                                    className={`px-4 py-3 rounded-xl border text-left transition-all flex justify-between items-center ${isSelected
                                                        ? `border-${details.color}-500 bg-${details.color}-500/10 text-${details.color}-500`
                                                        : `${colors.borderPrimary} ${colors.bgTertiary} ${colors.textSecondary} hover:border-${details.color}-500/50`
                                                    }`}
                                                >
                                                    <span>{table}</span>
                                                    {isSelected && <Sparkles className="w-4 h-4 animate-pulse" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => { setConnected(false); setTables([]); setSelectedTables([]); }}
                                        className={`flex-1 py-3 rounded-xl border ${colors.borderPrimary} ${colors.textSecondary} font-bold hover:${colors.bgTertiary} transition`}
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleImport}
                                        disabled={loading || selectedTables.length === 0}
                                        className={`flex-[2] py-3 rounded-xl bg-${details.color}-600 hover:bg-${details.color}-500 text-white font-bold transition flex justify-center items-center disabled:opacity-50`}
                                    >
                                        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : `Import ${selectedTables.length} ${engine === 'mongodb' ? 'Collections' : 'Tables'}`}
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
