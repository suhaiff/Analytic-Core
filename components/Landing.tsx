import React, { useState, useRef } from 'react';
import { Upload, FileText, Clock, LayoutDashboard, Sparkles, ChevronRight, FileSpreadsheet, Trash2, FolderOpen, PlusCircle, Settings, LogOut, Database, Globe, X } from 'lucide-react';
import { SavedDashboard, User } from '../types';
import { useTheme } from '../ThemeContext';
import { getThemeClasses } from '../theme';
import { ThemeToggle } from './ThemeToggle';
import { fileService } from '../services/fileService';
import { ProfileMenu } from './navbar/ProfileMenu';

interface LandingProps {
  onFileUpload: (file: File) => void;
  onGoogleSheetImport: (sheets: { id: number, name: string, data: any[][], fileId: number }[], title: string, spreadsheetId: string) => void;
  onSharePointImport: (siteId: string, listId: string, listName: string, data: any[][], siteName: string, fileId: number) => void;
  onSqlDatabaseImport: (tables: { id: number, name: string, data: any[][], fileId: number }[], title: string, connectionId: string) => void;
  savedDashboards: SavedDashboard[];
  onLoadDashboard: (dashboard: SavedDashboard) => void;
  onDeleteDashboard: (id: string) => void;
  onLogout: () => void;
  user: User | null;
}

export const Landing: React.FC<LandingProps> = ({ onFileUpload, onGoogleSheetImport, onSharePointImport, onSqlDatabaseImport, savedDashboards, onLoadDashboard, onDeleteDashboard, onLogout, user }) => {
  const { theme } = useTheme();
  const colors = getThemeClasses(theme);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<'NEW' | 'SAVED'>('NEW');

  // UI State for Grouping
  const [showImportMenu, setShowImportMenu] = useState(false);

  // Google Sheets State
  const [showGSModal, setShowGSModal] = useState(false);
  const [gsUrl, setGsUrl] = useState('');
  const [gsLoading, setGsLoading] = useState(false);
  const [gsError, setGsError] = useState('');
  const [gsMetadata, setGsMetadata] = useState<{ spreadsheetId: string, title: string, sheets: string[] } | null>(null);
  const [selectedSheets, setSelectedSheets] = useState<string[]>([]);

  // SQL Database Connection State
  const [showSqlDbModal, setShowSqlDbModal] = useState(false);
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

  // SharePoint State
  const [showSPModal, setShowSPModal] = useState(false);
  const [spStep, setSpStep] = useState<'CONNECT' | 'SITES' | 'LISTS' | 'IMPORT'>('CONNECT');
  const [spLoading, setSpLoading] = useState(false);
  const [spError, setSpError] = useState('');
  const [spSites, setSpSites] = useState<any[]>([]);
  const [selectedSite, setSelectedSite] = useState<any>(null);
  const [spLists, setSpLists] = useState<any[]>([]);
  const [selectedList, setSelectedList] = useState<any>(null);
  const [spConnected, setSpConnected] = useState<boolean>(false);
  const [spConfigured, setSpConfigured] = useState<boolean>(true);

  // SQL State
  const [showSQLModal, setShowSQLModal] = useState(false);
  const [sqlStep, setSqlStep] = useState<'CONNECT' | 'TABLES' | 'IMPORT'>('CONNECT');
  const [sqlLoading, setSqlLoading] = useState(false);
  const [sqlError, setSqlError] = useState('');
  const [sqlConfig, setSqlConfig] = useState({
    host: '',
    port: '',
    user: '',
    password: '',
    database: '',
    type: 'mysql' as 'mysql' | 'mariadb' | 'postgresql'
  });
  const [sqlTables, setSqlTables] = useState<string[]>([]);
  const [selectedSqlTable, setSelectedSqlTable] = useState<string>('');

  // Check SharePoint connection status on mount
  React.useEffect(() => {
    const checkConnection = async () => {
      if (user) {
        try {
          const status = await fileService.checkSharePointConnection(user.id);
          setSpConnected(status.connected);
          setSpConfigured(status.oauthConfigured);
        } catch (err) {
          console.error('Error checking SharePoint connection:', err);
        }
      }
    };
    checkConnection();

    // Check for OAuth callback parameters
    const params = new URLSearchParams(window.location.search);
    if (params.get('sharepoint_connected') === 'true') {
      setSpConnected(true);
      // Remove the parameter from URL
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (params.get('sharepoint_error')) {
      setSpError(decodeURIComponent(params.get('sharepoint_error') || ''));
    }
  }, [user]);

  const handleConnectSharePoint = () => {
    if (!user) return;
    fileService.connectSharePoint(user.id);
  };

  const fetchSPSites = async () => {
    if (!user) return;
    setSpLoading(true);
    setSpError('');
    try {
      const response = await fileService.getUserSharePointSites(user.id);
      setSpSites(response.sites || []);
      setSpStep('SITES');
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.data?.requiresAuth) {
        setSpConnected(false);
        setSpStep('CONNECT');
        setSpError('Please connect your SharePoint account first');
      } else {
        setSpError(err.response?.data?.error || err.message || 'Failed to fetch SharePoint sites');
      }
    } finally {
      setSpLoading(false);
    }
  };

  const handleSiteSelect = async (site: any) => {
    if (!user) return;
    setSelectedSite(site);
    setSpLoading(true);
    setSpError('');
    try {
      const response = await fileService.getUserSharePointLists(user.id, site.id);
      setSpLists(response.lists || []);
      setSpStep('LISTS');
    } catch (err: any) {
      setSpError(err.response?.data?.error || err.message || 'Failed to fetch SharePoint lists');
    } finally {
      setSpLoading(false);
    }
  };

  const handleListSelect = (list: any) => {
    setSelectedList(list);
    setSpStep('IMPORT');
  };

  const handleSPImport = async () => {
    if (!selectedSite || !selectedList || !user) return;
    setSpLoading(true);
    setSpError('');
    try {
      const result = await fileService.importUserSharePointList(
        user.id,
        selectedSite.id,
        selectedList.id,
        selectedList.name,
        selectedSite.name,
        `SP: ${selectedList.name}`
      );
      onSharePointImport(selectedSite.id, selectedList.id, selectedList.name, result.data, selectedSite.name, result.fileId);
      setShowSPModal(false);
      resetSPState();
    } catch (err: any) {
      setSpError(err.response?.data?.error || err.message || 'Failed to import SharePoint list');
    } finally {
      setSpLoading(false);
    }
  };

  const resetSPState = () => {
    setSpStep(spConnected ? 'SITES' : 'CONNECT');
    setSelectedSite(null);
    setSelectedList(null);
    setSpError('');
    setSpSites([]);
    setSpLists([]);
  };

  // SQL Handlers
  const handleSqlTestConnection = async () => {
    setSqlLoading(true);
    setSqlError('');
    try {
      const result = await fileService.testSqlConnection({
        engine: sqlConfig.type,
        host: sqlConfig.host,
        port: sqlConfig.port ? parseInt(sqlConfig.port) : (sqlConfig.type === 'postgresql' ? 5432 : 3306),
        user: sqlConfig.user,
        password: sqlConfig.password,
        database: sqlConfig.database
      });

      if (result.success) {
        // Fetch tables after successful connection
        const tablesResult = await fileService.getSqlTables({
          engine: sqlConfig.type,
          host: sqlConfig.host,
          port: sqlConfig.port ? parseInt(sqlConfig.port) : (sqlConfig.type === 'postgresql' ? 5432 : 3306),
          user: sqlConfig.user,
          password: sqlConfig.password,
          database: sqlConfig.database
        });

        setSqlTables(tablesResult.tables || []);
        setSqlStep('TABLES');
      }
    } catch (err: any) {
      setSqlError(err.response?.data?.error || err.message || 'Failed to connect to database');
    } finally {
      setSqlLoading(false);
    }
  };

  const handleSqlTableSelect = (tableName: string) => {
    setSelectedSqlTable(tableName);
    setSqlStep('IMPORT');
  };

  const handleSqlImport = async () => {
    if (!selectedSqlTable || !user) return;
    setSqlLoading(true);
    setSqlError('');
    try {
      const result = await fileService.importSqlDatabase(
        user.id,
        {
          engine: sqlConfig.type,
          host: sqlConfig.host,
          port: sqlConfig.port ? parseInt(sqlConfig.port) : (sqlConfig.type === 'postgresql' ? 5432 : 3306),
          user: sqlConfig.user,
          password: sqlConfig.password,
          database: sqlConfig.database
        },
        [selectedSqlTable],
        `${sqlConfig.type.toUpperCase()}: ${selectedSqlTable}`
      );


      // Import successful - pass to parent using SQL Database import handler
      onSqlDatabaseImport(
        result.tables,
        result.title,
        `${sqlConfig.type}:${sqlConfig.host}:${sqlConfig.database}`
      );

      setShowSQLModal(false);
      resetSqlState();
    } catch (err: any) {
      setSqlError(err.response?.data?.error || err.message || 'Failed to import table');
    } finally {
      setSqlLoading(false);
    }
  };

  const resetSqlState = () => {
    setSqlStep('CONNECT');
    setSqlConfig({
      host: '',
      port: '',
      user: '',
      password: '',
      database: '',
      type: 'mysql'
    });
    setSqlTables([]);
    setSelectedSqlTable('');
    setSqlError('');
  };

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
      onGoogleSheetImport(result.sheets, gsMetadata.title, gsMetadata.spreadsheetId);
      setShowGSModal(false);
      setGsUrl('');
      setGsMetadata(null);
      setSelectedSheets([]);
    } catch (err: any) {
      setGsError(err.response?.data?.error || err.message || 'Failed to import Google Sheets');
    } finally {
      setGsLoading(false);
    }
  };

  const toggleGsSheet = (sheet: string) => {
    setSelectedSheets(prev =>
      prev.includes(sheet)
        ? prev.filter(s => s !== sheet)
        : [...prev, sheet]
    );
  };

  // SQL Database Connection Handlers
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
      // We'll update the backend to handle multiple tables in one go for better performance
      // For now, let's call the service which we will also update to handle an array
      const result = await fileService.importSqlDatabase(
        user.id,
        sqlDbConfig,
        selectedTables,
        `${sqlDbConfig.engine.toUpperCase()}: ${sqlDbConfig.database}`
      );

      onSqlDatabaseImport(
        result.tables,
        result.title,
        `${sqlDbConfig.engine}:${sqlDbConfig.host}:${sqlDbConfig.database}`
      );

      // Reset modal
      setShowSqlDbModal(false);
      setSqlDbConfig({ engine: 'mysql', host: '', port: 3306, database: '', user: '', password: '' });
      setSqlDbConnected(false);
      setSqlDbTables([]);
      setSelectedTables([]);
    } catch (err: any) {
      setSqlDbError(err.response?.data?.error || err.message || 'Failed to import tables');
    } finally {
      setSqlDbLoading(false);
    }
  };

  const toggleSqlTable = (table: string) => {
    setSelectedTables(prev =>
      prev.includes(table)
        ? prev.filter(t => t !== table)
        : [...prev, table]
    );
  };


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

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className={`absolute top-0 left-0 w-full h-full ${colors.gradientTop} blur-[120px] opacity-30`}></div>
        <div className={`absolute bottom-0 right-0 w-full h-full ${colors.gradientBottom} blur-[120px] opacity-30`}></div>
      </div>

      {/* Header - Responsive */}
      <header className="px-4 sm:px-6 md:px-8 py-4 md:py-6 flex justify-between items-center relative z-10">
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
          <ProfileMenu user={user} onLogout={onLogout} />
        </div>
      </header>

      <main className="responsive-container flex-1 flex flex-col pb-24">
        {/* Tabs - Responsive */}
        <div className="flex justify-center mb-6 sm:mb-8 md:mb-12">
          <div className={`${colors.bgSecondary} p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border ${colors.borderPrimary} inline-flex w-full sm:w-auto`}>
            <button
              onClick={() => setActiveTab('NEW')}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2
                  ${activeTab === 'NEW' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : `${colors.textMuted} hover:${colors.textPrimary}`}
                `}
            >
              <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">New Analysis</span>
            </button>
            <button
              onClick={() => setActiveTab('SAVED')}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2
                  ${activeTab === 'SAVED' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : `${colors.textMuted} hover:${colors.textPrimary}`}
                `}
            >
              <FolderOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">My Dashboards</span>
            </button>
          </div>
        </div>

        {activeTab === 'NEW' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-12 lg:gap-16 items-center animate-fade-in">
            {/* Left Column: Texts + How it works */}
            <div className="flex flex-col gap-8 md:gap-12">
              {/* Texts */}
              <div>
                <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs sm:text-sm font-medium mb-4 sm:mb-6">
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Powered by Gemini 2.0 Flash</span>
                </div>
                <h2 className={`hero-title font-extrabold ${colors.textPrimary} leading-tight mb-4 sm:mb-6`}>
                  Data to Dashboard <br className="hidden sm:block" />
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
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent rounded-3xl blur-xl" />

                <div className={`responsive-card relative ${theme === 'dark' ? 'bg-slate-900/80' : 'bg-white/80'} backdrop-blur-xl rounded-2xl sm:rounded-3xl border ${colors.borderPrimary} shadow-2xl`}>
                  <h3 className={`responsive-text-lg font-semibold ${colors.textPrimary} mb-6 sm:mb-8`}>How it works</h3>
                  <div className="space-y-6 sm:space-y-8 relative">
                    <div className={`absolute left-6 top-4 bottom-4 w-0.5 ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'}`}></div>

                    {[
                      { title: "Upload Data", desc: "Supports multiple CSV & Excel files", icon: FileSpreadsheet },
                      { title: "Configure & Join", desc: "Merge tables and select key columns", icon: Settings },
                      { title: "AI Analysis", desc: "Gemini suggests relevant charts", icon: Sparkles },
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
                className={`upload-area relative group border-2 border-dashed rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer
                  ${isDragging
                    ? 'border-indigo-400 bg-indigo-500/10 scale-[1.02]'
                    : `${colors.borderSecondary} ${theme === 'dark' ? 'bg-slate-900/50 hover:bg-slate-800/80' : 'bg-white/50 hover:bg-slate-100/80'} hover:border-indigo-500/50`
                  }
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
                  className={`w-full py-4 px-6 rounded-2xl border ${colors.borderPrimary} ${colors.bgSecondary} hover:${colors.bgTertiary} transition-all flex items-center justify-center gap-3 group shadow-lg hover:shadow-indigo-500/10`}
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <PlusCircle className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div className="text-left flex-1">
                    <div className={`text-sm font-bold ${colors.textPrimary}`}>Other Import Options</div>
                    <div className={`text-xs ${colors.textMuted}`}>Google Sheets, SQL, SharePoint</div>
                  </div>
                  <ChevronRight className={`w-5 h-5 ${colors.textMuted} transition-transform ${showImportMenu ? 'rotate-90' : ''}`} />
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
                        if (spConnected) {
                          fetchSPSites();
                        } else {
                          setSpStep('CONNECT');
                        }
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
          <div className="animate-fade-in">
            {savedDashboards.length === 0 ? (
              <div className={`flex flex-col items-center justify-center py-12 sm:py-16 md:py-20 border-2 border-dashed ${colors.borderPrimary} rounded-2xl sm:rounded-3xl ${theme === 'dark' ? 'bg-slate-900/30' : 'bg-slate-100/30'}`}>
                <FolderOpen className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 ${theme === 'dark' ? 'text-slate-700' : 'text-slate-300'} mb-3 sm:mb-4`} />
                <h3 className={`responsive-text-lg md:text-xl font-bold ${colors.textPrimary}`}>No Saved Dashboards</h3>
                <p className={`${colors.textMuted} responsive-text-sm mt-2 mb-4 sm:mb-6 text-center px-4`}>You haven't saved any projects yet.</p>
                <button
                  onClick={() => setActiveTab('NEW')}
                  className="responsive-button bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition"
                >
                  Start New Analysis
                </button>
              </div>
            ) : (
              <div className="saved-dashboards-grid">
                {savedDashboards.map((dash, idx) => (
                  <div
                    key={dash.id}
                    className={`responsive-card group ${colors.bgSecondary} border ${colors.borderPrimary} rounded-xl sm:rounded-2xl hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-900/20 transition-all cursor-pointer relative`}
                    onClick={() => onLoadDashboard(dash)}
                  >
                    <button
                      onClick={(e) => {
                        console.log('Delete button clicked!', dash.id);
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('About to call onDeleteDashboard');
                        onDeleteDashboard(dash.id);
                        console.log('onDeleteDashboard called');
                      }}
                      className={`absolute top-3 right-3 sm:top-4 sm:right-4 z-20 p-1.5 sm:p-2 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'} hover:text-red-400 hover:bg-red-400/10 rounded-lg transition pointer-events-auto`}
                      title="Delete dashboard"
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>

                    <div className="flex justify-between items-start mb-3 sm:mb-4">
                      <div className="p-2 sm:p-3 bg-indigo-500/10 rounded-lg sm:rounded-xl">
                        <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
                      </div>
                    </div>

                    <h3 className={`responsive-text-base sm:text-lg font-bold ${colors.textPrimary} mb-1 group-hover:text-indigo-400 transition`}>{dash.name}</h3>
                    <div className={`flex items-center gap-1.5 sm:gap-2 ${colors.textMuted} responsive-text-xs sm:text-sm mb-4 sm:mb-6`}>
                      <Clock className="w-3 h-3" />
                      <span>{dash.date}</span>
                    </div>

                    <div className={`flex items-center justify-between pt-3 sm:pt-4 border-t ${colors.borderPrimary}`}>
                      <span className={`responsive-text-xs font-medium ${colors.textMuted} ${colors.bgPrimary} px-2 py-1 rounded`}>
                        {dash.chartConfigs.length} Charts
                      </span>
                      <div className="flex items-center gap-1 text-indigo-400 responsive-text-xs sm:text-sm font-medium">
                        Open <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Google Sheets Modal */}
        {showGSModal && (
          <div className={`fixed inset-0 z-[100] ${colors.overlayBg} backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in`}>
            <div className={`${colors.modalBg} border ${colors.borderPrimary} rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl transform scale-100 max-h-[90vh] overflow-y-auto`}>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <FileSpreadsheet className="w-6 h-6 text-green-500" />
                  </div>
                  <h3 className={`text-xl font-bold ${colors.textPrimary}`}>Connect Google Sheet</h3>
                </div>
                <button
                  onClick={() => { setShowGSModal(false); setGsMetadata(null); setGsError(''); }}
                  className={`p-2 rounded-lg hover:${colors.bgTertiary} ${colors.textMuted} transition`}
                >
                  <LogOut className="w-5 h-5 rotate-180" />
                </button>
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
                      Select Sheet Tab
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
        )}
        {/* SharePoint Modal */}
        {showSPModal && (
          <div className={`fixed inset-0 z-[100] ${colors.overlayBg} backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in`}>
            <div className={`${colors.modalBg} border ${colors.borderPrimary} rounded-2xl p-6 sm:p-8 max-w-xl w-full shadow-2xl transform scale-100 max-h-[90vh] overflow-y-auto`}>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/10 rounded-lg">
                    <Globe className="w-6 h-6 text-orange-500" />
                  </div>
                  <h3 className={`text-xl font-bold ${colors.textPrimary}`}>Import from SharePoint</h3>
                </div>
                <button
                  onClick={() => { setShowSPModal(false); resetSPState(); }}
                  className={`p-2 rounded-lg hover:${colors.bgTertiary} ${colors.textMuted} transition`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {!spConfigured ? (
                <div className="text-center py-8">
                  <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20 text-red-400 mb-6">
                    <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <h4 className="font-bold mb-2">Configuration Required</h4>
                    <p className="text-sm">SharePoint integration has not been set up in the environment variables.</p>
                  </div>
                  <button
                    onClick={() => setShowSPModal(false)}
                    className={`px-6 py-2 rounded-xl bg-indigo-600 text-white font-bold transition`}
                  >
                    Close
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Step Progress */}
                  {spStep !== 'CONNECT' && (
                    <div className="flex items-center gap-2 mb-8">
                      {[
                        { id: 'SITES', label: 'Select Site' },
                        { id: 'LISTS', label: 'Select List' },
                        { id: 'IMPORT', label: 'Confirm' }
                      ].map((step, idx) => (
                        <React.Fragment key={step.id}>
                          <div className={`flex items-center gap-2 ${spStep === step.id ? 'text-indigo-400' : colors.textMuted}`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${spStep === step.id ? 'bg-indigo-600 text-white' : 'bg-slate-800'}`}>
                              {idx + 1}
                            </div>
                            <span className="text-xs font-medium hidden sm:inline">{step.label}</span>
                          </div>
                          {idx < 2 && <div className={`h-px flex-1 ${idx === 0 && (spStep === 'LISTS' || spStep === 'IMPORT') ? 'bg-indigo-600' : idx === 1 && spStep === 'IMPORT' ? 'bg-indigo-600' : 'bg-slate-800'}`} />}
                        </React.Fragment>
                      ))}
                    </div>
                  )}

                  {spError && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-shake">
                      {spError}
                    </div>
                  )}

                  {/* CONNECT Step - OAuth Authentication */}
                  {spStep === 'CONNECT' && (
                    <div className="space-y-6 text-center">
                      <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-8">
                        <Globe className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
                        <h4 className="text-xl font-bold text-white mb-3">Connect to SharePoint</h4>
                        <p className="text-sm text-slate-400 mb-6">
                          You'll be redirected to Microsoft to sign in and authorize access to your SharePoint sites.
                        </p>
                        <button
                          onClick={handleConnectSharePoint}
                          className="px-8 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold transition shadow-lg shadow-orange-900/20"
                        >
                          Connect SharePoint Account
                        </button>
                      </div>
                      <p className="text-xs text-slate-500">
                        Your data remains secure. You can disconnect anytime from your account settings.
                      </p>
                    </div>
                  )}

                  {spStep === 'SITES' && (

                    <div className="space-y-4">
                      <div className="max-h-64 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                        {spLoading && spSites.length === 0 ? (
                          <div className="py-12 text-center animate-pulse text-slate-500">Fetching sites...</div>
                        ) : spSites.length > 0 ? (
                          spSites.map((site) => (
                            <button
                              key={site.id}
                              onClick={() => handleSiteSelect(site)}
                              className={`w-full p-4 rounded-xl border ${colors.borderPrimary} ${colors.bgTertiary} text-left hover:border-indigo-500/50 transition-all group`}
                            >
                              <div className="font-bold text-sm text-white group-hover:text-indigo-400">{site.name}</div>
                              <div className="text-[10px] text-slate-500 truncate">{site.webUrl}</div>
                            </button>
                          ))
                        ) : (
                          <div className="py-12 text-center text-slate-500">No SharePoint sites found.</div>
                        )}
                      </div>
                    </div>
                  )}

                  {spStep === 'LISTS' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-slate-400">Site: <span className="text-white">{selectedSite?.name}</span></div>
                        <button onClick={() => setSpStep('SITES')} className="text-xs text-indigo-400 hover:underline">Change Site</button>
                      </div>
                      <div className="max-h-64 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                        {spLoading && spLists.length === 0 ? (
                          <div className="py-12 text-center animate-pulse text-slate-500">Fetching lists...</div>
                        ) : spLists.length > 0 ? (
                          spLists.map((list) => (
                            <button
                              key={list.id}
                              onClick={() => handleListSelect(list)}
                              className={`w-full p-4 rounded-xl border ${colors.borderPrimary} ${colors.bgTertiary} text-left hover:border-indigo-500/50 transition-all group`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-sm text-white group-hover:text-indigo-400">{list.name}</span>
                                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">{list.itemCount} items</span>
                              </div>
                              <div className="text-[10px] text-slate-500 truncate mt-1">{list.description || 'No description available'}</div>
                            </button>
                          ))
                        ) : (
                          <div className="py-12 text-center text-slate-500">No lists found in this site.</div>
                        )}
                      </div>
                    </div>
                  )}

                  {spStep === 'IMPORT' && (
                    <div className="space-y-6">
                      <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-6 text-center">
                        <Globe className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
                        <h4 className="text-lg font-bold text-white mb-2">Ready to Import</h4>
                        <p className="text-sm text-slate-400 px-4">
                          You are about to import data from the list <span className="text-white font-bold">{selectedList?.name}</span> from the site <span className="text-white font-bold">{selectedSite?.name}</span>.
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => setSpStep('LISTS')}
                          className={`flex-1 py-3 rounded-xl border ${colors.borderPrimary} ${colors.textSecondary} font-bold hover:${colors.bgTertiary} transition`}
                          disabled={spLoading}
                        >
                          Back
                        </button>
                        <button
                          onClick={handleSPImport}
                          disabled={spLoading}
                          className={`flex-[2] py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold transition shadow-lg shadow-orange-900/20 flex items-center justify-center gap-2`}
                        >
                          {spLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>Import SharePoint Data</>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}


        {/* SQL Database Connection Modal */}
        {showSqlDbModal && (
          <div className={`fixed inset-0 z-[100] ${colors.overlayBg} backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in`}>
            <div className={`${colors.modalBg} border ${colors.borderPrimary} rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl transform scale-100 max-h-[90vh] overflow-y-auto`}>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <FileText className="w-6 h-6 text-blue-500" />
                  </div>
                  <h3 className={`text-xl font-bold ${colors.textPrimary}`}>Connect SQL Database</h3>
                </div>
                <button
                  onClick={() => {
                    setShowSqlDbModal(false);
                    setSqlDbConnected(false);
                    setSqlDbTables([]);
                    setSqlDbError('');
                  }}
                  className={`p-2 rounded-lg hover:${colors.bgTertiary} ${colors.textMuted} transition`}
                >
                  <LogOut className="w-5 h-5 rotate-180" />
                </button>
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
                          Select Table
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
        )}
      </main>
    </div>
  );
};