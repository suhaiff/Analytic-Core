import React, { useState, useEffect } from 'react';
import { Landing } from './components/Landing';
import { DataConfig } from './components/DataConfig';
import { ChartBuilder } from './components/ChartBuilder';
import { Dashboard } from './components/Dashboard';
import { DataProfiling } from './components/DataProfiling';
import { Login } from './components/auth/Login';
import { Signup } from './components/auth/Signup';
import { ChangePassword } from './components/auth/ChangePassword';
import { ForgotPassword } from './components/auth/ForgotPassword';
import { Welcome } from './components/Welcome';
import { Overview } from './components/Overview';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { MLModelHub } from './components/ml/MLModelHub';

import { processFile } from './utils/fileParser';
import { processRawData, performJoins } from './utils/dataProcessing';
import { DashboardLoader } from './components/DashboardLoader';
import { DataModel, ChartConfig, DataTable, SavedDashboard, User, ProcessedRow, DashboardSection, RawData, WorkspaceFolder, AccessLevel } from './types';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { ThemeProvider, useTheme } from './ThemeContext';
import { getThemeClasses } from './theme';
import { authService } from './services/authService';
import { dashboardService } from './services/dashboardService';
import { fileService } from './services/fileService';
import { workspaceService } from './services/workspaceService';

enum Step {
  WELCOME = 'WELCOME',
  LOGIN = 'LOGIN',
  SIGNUP = 'SIGNUP',
  FORGOT_PASSWORD = 'FORGOT_PASSWORD',
  CHANGE_PASSWORD = 'CHANGE_PASSWORD',
  ADMIN = 'ADMIN',
  OVERVIEW = 'OVERVIEW',
  LANDING = 0,
  DATA_PROFILING = 'DATA_PROFILING',
  CONFIG = 1,
  BUILDER = 2,
  DASHBOARD = 3,
  ML_MODELS = 'ML_MODELS'
}

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

function AppContent() {
  const { theme } = useTheme();
  const colors = getThemeClasses(theme);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [step, setStep] = useState<Step>(Step.WELCOME);
  const [initialTables, setInitialTables] = useState<DataTable[]>([]);
  const [fileName, setFileName] = useState('');
  const [uploadedFileId, setUploadedFileId] = useState<number | undefined>(undefined);
  const [dataModel, setDataModel] = useState<DataModel | null>(null);
  const [chartConfigs, setChartConfigs] = useState<ChartConfig[]>([]);
  const [dashboardSections, setDashboardSections] = useState<DashboardSection[]>([]);
  const [filterColumns, setFilterColumns] = useState<string[]>([]);
  const [sourceType, setSourceType] = useState<'file' | 'google_sheet' | 'sharepoint'>('file');
  const [currentDashboardId, setCurrentDashboardId] = useState<string | null>(null);
  const [currentDashboard, setCurrentDashboard] = useState<SavedDashboard | null>(null);
  const [currentFolderRole, setCurrentFolderRole] = useState<AccessLevel | null>(null);


  // UI State
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' });
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [returnToAdmin, setReturnToAdmin] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');

  // Auth: temp password for first-time change
  const [tempPasswordForChange, setTempPasswordForChange] = useState('');

  // Saved Dashboards State
  const [savedDashboards, setSavedDashboards] = useState<SavedDashboard[]>([]);

  // Workspace Folders State
  const [workspaceFolders, setWorkspaceFolders] = useState<WorkspaceFolder[]>([]);

  // Check for logged in user on init
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      if (user.role === 'ADMIN') {
        setStep(Step.ADMIN);
      } else {
        setStep(Step.OVERVIEW);
      }
    } else {
      setStep(Step.WELCOME);
    }
  }, []);

  // Load saved dashboards and workspace folders from DB on init or user change
  useEffect(() => {
    if (currentUser && currentUser.role !== 'ADMIN') {
      loadUserDashboards(currentUser.id);
      loadWorkspaceFolders(currentUser.id);
    }
  }, [currentUser]);

  const loadUserDashboards = async (userId: number) => {
    try {
      const dashboards = await dashboardService.getUserDashboards(userId);
      setSavedDashboards(dashboards);
    } catch (error) {
      console.error("Failed to load dashboards", error);
      showToast("Failed to load dashboards", 'error');
    }
  };

  const loadWorkspaceFolders = async (userId: number) => {
    try {
      const folders = await workspaceService.getFolders(userId);
      setWorkspaceFolders(folders);
    } catch (error) {
      console.error("Failed to load workspace folders", error);
    }
  };

  // Reset scroll position when changing steps
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const handleLoginSuccess = () => {
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      if (user.must_change_password) {
        // Redirect to change password
        setStep(Step.CHANGE_PASSWORD);
        showToast('Please set a new password to continue');
      } else if (user.role === 'ADMIN') {
        setStep(Step.ADMIN);
        showToast(`Welcome back, ${user.name}!`);
      } else {
        setStep(Step.OVERVIEW);
        showToast(`Welcome back, ${user.name}!`);
      }
    }
  };

  // Store the temp password when user logs in (needed for change password API)
  const handleLoginSuccessWithPassword = (password: string) => {
    setTempPasswordForChange(password);
    handleLoginSuccess();
  };

  const handlePasswordChanged = () => {
    const user = authService.getCurrentUser();
    if (user) {
      // Update local storage
      user.must_change_password = false;
      localStorage.setItem('insightAI_currentUser', JSON.stringify(user));
      setCurrentUser(user);
      if (user.role === 'ADMIN') {
        setStep(Step.ADMIN);
      } else {
        setStep(Step.OVERVIEW);
      }
      showToast('Password set successfully! Welcome to InsightAI.');
    }
  };

  const handleResetSuccess = () => {
    setStep(Step.LOGIN);
    showToast('Password reset successfully! Please login with your new password.');
  };

  const handleSignupSuccess = () => {
    // Don't auto-login — user needs to check email for temp password
    setStep(Step.LOGIN);
    showToast('Account created! Check your email for the temporary password.');
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setStep(Step.WELCOME);
    setInitialTables([]);
    setFileName('');
    setDataModel(null);
    setChartConfigs([]);
    showToast('Logged out successfully');
  };

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    setProcessingMessage("Uploading and analyzing data...");
    try {
      // 1. Process locally for the app
      const tables = await processFile(file);
      setInitialTables(tables);
      setFileName(file.name);

      // 2. Upload to server for storage (if user is logged in)
      if (currentUser) {
        try {
          const response = await fileService.uploadFile(currentUser.id, file);
          if (response.file && response.file.id) {
            setUploadedFileId(response.file.id);
          }
          console.log("File uploaded to server successfully");
        } catch (uploadError) {
          console.error("Failed to upload file to server", uploadError);
          // Don't block the user flow if upload fails, just log it
        }
      }

      setStep(Step.CONFIG);
    } catch (error) {
      console.error("File processing failed", error);
      showToast("Failed to process file. Please ensure it is a valid CSV or Excel file.", 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoogleSheetImport = (sheets: { id: number, name: string, data: any[][], fileId: number }[], title: string, spreadsheetId: string) => {
    setIsProcessing(true);
    setProcessingMessage("Importing Google Sheets...");

    setTimeout(() => {
      const dataTables: DataTable[] = sheets.map(s => ({
        id: s.id.toString(),
        name: s.name,
        rawData: {
          headers: s.data[0] || [],
          rows: s.data
        }
      }));

      setInitialTables(dataTables);
      setFileName(title || `GS: ${sheets.map(s => s.name).join(', ')}`);
      setSourceType('google_sheet');
      setUploadedFileId(sheets[0]?.fileId);
      setStep(Step.LANDING);
      setTimeout(() => setStep(Step.CONFIG), 10);
      setIsProcessing(false);
      showToast(`${sheets.length} sheets imported successfully`, 'success');
    }, 1500);
  };

  const handleSqlDatabaseImport = (tables: { id: number, name: string, data: any[][], fileId: number }[], title: string, connectionId: string) => {
    setIsProcessing(true);
    setProcessingMessage("Importing SQL database tables...");

    setTimeout(() => {
      const dataTables: DataTable[] = tables.map(t => ({
        id: t.id.toString(),
        name: t.name,
        rawData: {
          headers: t.data[0] || [],
          rows: t.data
        }
      }));

      setInitialTables(dataTables);
      setFileName(title || `SQL DB: ${tables.map(t => t.name).join(', ')}`);
      setSourceType('sql_database');
      // For multi-table, we use the first table's fileId as primary reference if needed,
      // but DataConfig will manage multiple tables.
      setUploadedFileId(tables[0]?.fileId);
      setStep(Step.LANDING);
      setTimeout(() => setStep(Step.CONFIG), 10);
      setIsProcessing(false);
      showToast(`${tables.length} tables imported successfully`, 'success');
    }, 1500);
  };

  const handleSharePointImport = (siteId: string, listId: string, listName: string, data: any[][], siteName: string, fileId: number) => {
    // Convert array of arrays to DataTable format
    const headers = data[0] || [];
    const rows = data; // Keep all rows including headers for DataConfig to handle header index

    const table: DataTable = {
      id: listId,
      name: listName,
      rawData: {
        headers,
        rows
      }
    };

    setInitialTables([table]);
    setFileName(`SP: ${siteName} - ${listName}`);
    setSourceType('sharepoint');
    setUploadedFileId(fileId);
    setStep(Step.CONFIG);
  };

  const handleRefresh = async () => {
    if (!dataModel || !dataModel.fileId) return;

    // Support Google Sheets, SharePoint, and SQL Database refresh
    if (!['google_sheet', 'sharepoint', 'sql_database'].includes(dataModel.sourceType || '')) return;

    setIsProcessing(true);
    setProcessingMessage("Refreshing live data...");
    try {
      let result;
      if (dataModel.sourceType === 'google_sheet') {
        result = await fileService.refreshGoogleSheet(dataModel.fileId);
      } else if (dataModel.sourceType === 'sharepoint') {
        result = await fileService.refreshSharePointList(dataModel.fileId);
      } else {
        const password = prompt("Enter database password to refresh:");
        if (!password) {
          setIsProcessing(false);
          return;
        }
        result = await fileService.refreshSqlDatabase(dataModel.fileId, password);
      }

      // ── Determine which sheets to process ───────────────────────────────────
      let sheetsToProcess: { name: string; data: any[][] }[] = [];
      if (result.sheets && result.sheets.length > 0) {
        sheetsToProcess = result.sheets;
      } else if (result.data && result.data.length > 0) {
        sheetsToProcess = [{ name: 'Sheet1', data: result.data }];
      } else {
        showToast('No data returned from refresh', 'error');
        return;
      }

      let finalRows: any[] = [];

      // ── Handle Multi-sheet Join Scenario ──────────────────────────────────
      if (dataModel.joinConfigs && dataModel.joinConfigs.length > 0 && dataModel.tableConfigs) {
        // Convert refreshed sheets into DataTable format for performJoins
        // We MUST map the refreshed sheets back to their original IDs stored in tableConfigs
        const tables: DataTable[] = [];
        
        Object.entries(dataModel.tableConfigs).forEach(([tableId, config]: [string, any]) => {
          // Find the refreshed sheet that matches this table's name
          const refreshedSheet = sheetsToProcess.find(s => s.name === config.name);
          
          if (refreshedSheet) {
            tables.push({
              id: tableId,
              name: refreshedSheet.name,
              rawData: {
                headers: refreshedSheet.data[config.headerIndex] || [],
                rows: refreshedSheet.data
              }
            });
          }
        });

        // Re-construct header indices map for performJoins
        const headerIndices: { [tableId: string]: number } = {};
        Object.entries(dataModel.tableConfigs).forEach(([id, cfg]: [string, any]) => {
          headerIndices[id] = cfg.headerIndex;
        });

        // Re-perform joins and appends on refreshed data
        const joinResult = performJoins(tables, dataModel.joinConfigs, headerIndices, dataModel.appendConfigs);
        finalRows = joinResult.data;
      } else {
        // ── Single-sheet fallback ──
        const headerIdx = dataModel.headerIndex || 0;
        const primarySheet = sheetsToProcess[0];
        const rawDataObj: RawData = {
          headers: primarySheet.data[headerIdx] || [],
          rows: primarySheet.data
        };
        const { rows } = processRawData(rawDataObj, headerIdx);
        finalRows = rows;
      }

      // ── Map refreshed data to ProcessedRow objects ───────────────────────
      // We iterate over dataModel.columns to ensure we pick up the correct values,
      // including prefixed ones if the data was joined.
      const newProcessedData: ProcessedRow[] = finalRows.map(row => {
        const rowObj: ProcessedRow = {};
        dataModel.columns.forEach(col => {
          const val = row[col];
          if (dataModel.numericColumns.includes(col)) {
            rowObj[col] = (val === '' || val === null || val === undefined || isNaN(Number(val))) ? 0 : Number(val);
          } else {
            rowObj[col] = (val === null || val === undefined) ? '' : String(val);
          }
        });
        return rowObj;
      });

      setDataModel({
        ...dataModel,
        data: newProcessedData
      });

      showToast("Data refreshed successfully", 'success');
    } catch (error) {
      console.error("Refresh failed", error);
      showToast("Failed to refresh data", 'error');
    } finally {
      setIsProcessing(false);
    }
  };


  const handleConfigFinalize = (model: DataModel) => {
    setDataModel(model);
    setStep(Step.BUILDER);
  };

  const handleGenerateReport = (charts: ChartConfig[], cols: string[], sections?: DashboardSection[]) => {
    setChartConfigs(charts);
    setFilterColumns(cols);
    if (sections) setDashboardSections(sections);
    setStep(Step.DASHBOARD);
    setCurrentDashboardId(null);
  };

  const handleReturnHomeRequest = () => {
    setShowExitConfirm(true);
  };

  const confirmReturnHome = () => {
    setShowExitConfirm(false);
    setStep(returnToAdmin ? Step.ADMIN : Step.LANDING);
    setReturnToAdmin(false);
    setInitialTables([]);
    setFileName('');
    setDataModel(null);
    setChartConfigs([]);
    setDashboardSections([]);
    setCurrentDashboardId(null);
  };

  const handleSaveDashboard = async (name: string, currentCharts: ChartConfig[], currentSections?: DashboardSection[], updatedFilterColumns?: string[], overwriteId?: string | null, folderId?: string | null, isWorkspace?: boolean) => {
    if (!dataModel || !currentUser) return;

    // Use updated filter columns if provided (from Dashboard state), otherwise fall back to App state
    const finalFilterColumns = updatedFilterColumns || filterColumns;

    const targetId = overwriteId || currentDashboardId;

    const dashData: SavedDashboard = {
      id: targetId || Date.now().toString(),
      name,
      date: new Date().toLocaleDateString(),
      dataModel: dataModel,
      chartConfigs: currentCharts,
      sections: currentSections,
      filterColumns: finalFilterColumns,
      folder_id: folderId || null,
      is_workspace: isWorkspace || false
    };

    // Update App state after successful save so Dashboard props match current state
    setChartConfigs(currentCharts);
    if (currentSections) setDashboardSections(currentSections);
    if (updatedFilterColumns) setFilterColumns(updatedFilterColumns);

    try {
      if (targetId) {
        // Update existing dashboard
        await dashboardService.updateDashboard(targetId, dashData);
        showToast(`Dashboard "${name}" updated successfully!`, 'success');
      } else {
        // Create new dashboard
        await dashboardService.saveDashboard(currentUser.id, dashData);
        showToast(`Dashboard "${name}" saved successfully!`, 'success');
      }
      setCurrentDashboardId(targetId || dashData.id);
      // Reload dashboards and workspace folders
      await loadUserDashboards(currentUser.id);
      if (isWorkspace) await loadWorkspaceFolders(currentUser.id);
    } catch (error: any) {
      console.error("Failed to save dashboard", error);
      const errorMessage = error?.message || 'Unknown error occurred';
      showToast(`Failed to save dashboard: ${errorMessage}`, 'error');
    }
  };

  const handleLoadDashboard = async (dash: SavedDashboard, role?: AccessLevel | null) => {
    if (step === Step.ADMIN) {
      setReturnToAdmin(true);
    } else {
      setReturnToAdmin(false);
    }

    // Always fetch the latest dashboard from the server before opening, so any
    // server-side refresh (scheduled or manual "Refresh Now") is reflected in the UI.
    let latest = dash;
    try {
      if (currentUser) {
        const freshList = await dashboardService.getUserDashboards(currentUser.id);
        setSavedDashboards(freshList);
        const found = freshList.find(d => d.id === dash.id);
        if (found) latest = found;
      }
    } catch (err) {
      console.warn('Failed to refresh dashboards before load, using cached copy', err);
    }

    setDataModel(latest.dataModel);
    setChartConfigs(latest.chartConfigs);
    setDashboardSections(latest.sections || []);
    setFilterColumns(latest.filterColumns || []);
    setCurrentDashboardId(latest.id);
    setCurrentDashboard(latest);
    setCurrentFolderRole(role || null);
    setStep(Step.DASHBOARD);
  };

  const handleDeleteDashboard = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this dashboard?")) {
      try {
        await dashboardService.deleteDashboard(id);
        if (currentUser) {
          await loadUserDashboards(currentUser.id);
        }
        showToast("Dashboard deleted.", 'success');
      } catch (error) {
        console.error("Failed to delete dashboard", error);
        showToast("Failed to delete dashboard", 'error');
      }
    }
  };


  return (
    <div className={`min-h-screen ${colors.bgPrimary} ${colors.textSecondary} relative selection:bg-indigo-500/30`}>
      {/* Toast Notification */}
      <div className={`fixed top-6 right-6 z-[100] transition-all duration-300 transform ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'}`}>
        <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border ${toast.type === 'success' ? `${colors.bgSecondary} ${colors.successBorder} ${colors.success}` : `${colors.bgSecondary} ${colors.errorBorder} ${colors.error}`}`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className={`font-medium ${colors.textPrimary}`}>{toast.message}</span>
        </div>
      </div>

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className={`fixed inset-0 z-[100] ${colors.overlayBg} backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in`}>
          <div className={`${colors.modalBg} border ${colors.borderPrimary} rounded-2xl p-8 max-w-md w-full shadow-2xl transform scale-100`}>
            <h3 className={`text-xl font-bold ${colors.textPrimary} mb-2`}>Return to Home?</h3>
            <p className={`${colors.textMuted} mb-6`}>
              Any unsaved progress in your current analysis will be lost. Are you sure you want to leave?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className={`px-4 py-2 rounded-lg ${colors.textTertiary} hover:${colors.bgTertiary} transition`}
              >
                Cancel
              </button>
              <button
                onClick={confirmReturnHome}
                className="px-6 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition shadow-lg shadow-red-900/20"
              >
                Yes, Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className={`absolute top-0 left-0 w-full h-96 ${colors.gradientTop} blur-[120px] rounded-full -translate-y-1/2`}></div>
        <div className={`absolute bottom-0 right-0 w-full h-96 ${colors.gradientBottom} blur-[120px] rounded-full translate-y-1/2`}></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {step === Step.WELCOME && (
          <Welcome
            onNavigateToLogin={() => setStep(Step.LOGIN)}
            onNavigateToSignup={() => setStep(Step.SIGNUP)}
          />
        )}

        {step === Step.LOGIN && (
          <Login
            onLoginSuccess={handleLoginSuccessWithPassword}
            onNavigateToSignup={() => setStep(Step.SIGNUP)}
            onForgotPassword={() => setStep(Step.FORGOT_PASSWORD)}
            onBack={() => setStep(Step.WELCOME)}
          />
        )}

        {step === Step.SIGNUP && (
          <Signup
            onSignupSuccess={handleSignupSuccess}
            onNavigateToLogin={() => setStep(Step.LOGIN)}
            onBack={() => setStep(Step.WELCOME)}
          />
        )}

        {step === Step.FORGOT_PASSWORD && (
          <ForgotPassword
            onBack={() => setStep(Step.LOGIN)}
            onResetSuccess={handleResetSuccess}
          />
        )}

        {step === Step.CHANGE_PASSWORD && currentUser && (
          <ChangePassword
            userId={currentUser.id}
            userName={currentUser.name}
            tempPassword={tempPasswordForChange}
            onPasswordChanged={handlePasswordChanged}
          />
        )}

        {step === Step.ADMIN && (
          <AdminDashboard 
            onLogout={handleLogout} 
            user={currentUser} 
            onNavigateToUserApp={() => setStep(Step.LANDING)} 
            onViewDashboard={handleLoadDashboard}
          />
        )}

        {step === Step.OVERVIEW && (
          <Overview 
            user={currentUser} 
            onNavigateToLanding={() => setStep(Step.LANDING)} 
          />
        )}

        {step === Step.LANDING && (
          <Landing
            onFileUpload={handleFileUpload}
            onGoogleSheetImport={handleGoogleSheetImport}
            onSharePointImport={handleSharePointImport}
            onSqlDatabaseImport={handleSqlDatabaseImport}
            savedDashboards={savedDashboards}
            onLoadDashboard={handleLoadDashboard}
            onDeleteDashboard={handleDeleteDashboard}
            onLogout={handleLogout}
            onNavigateToAdmin={() => setStep(Step.ADMIN)}
            onNavigateToMLModels={() => setStep(Step.ML_MODELS)}
            user={currentUser}
            workspaceFolders={workspaceFolders}
            onFoldersChange={() => { if (currentUser) loadWorkspaceFolders(currentUser.id); }}
            onDashboardsChange={() => { if (currentUser) loadUserDashboards(currentUser.id); }}
          />
        )}

        {step === Step.ML_MODELS && currentUser && (
          <MLModelHub
            user={currentUser}
            onHome={() => setStep(Step.LANDING)}
          />
        )}

        {step === Step.CONFIG && initialTables.length > 0 && (
          <DataConfig
            initialTables={initialTables}
            fileName={fileName}
            uploadedFileId={uploadedFileId}
            sourceType={sourceType}
            onFinalize={handleConfigFinalize}
            onHome={handleReturnHomeRequest}
          />
        )}

        {step === Step.BUILDER && dataModel && (
          <ChartBuilder
            dataModel={dataModel}
            onGenerateReport={handleGenerateReport}
            onHome={handleReturnHomeRequest}
            onBack={() => setStep(Step.CONFIG)}
            initialFilterColumns={filterColumns}
            initialBucket={chartConfigs}
            sections={dashboardSections}
          />
        )}

        {step === Step.DASHBOARD && dataModel && (
          <Dashboard
            dataModel={dataModel}
            chartConfigs={chartConfigs}
            sections={dashboardSections}
            filterColumns={filterColumns}
            onHome={handleReturnHomeRequest}
            onSave={handleSaveDashboard}
            onRefresh={handleRefresh}
            dashboardId={currentDashboardId}
            currentDashboard={currentDashboard}
            currentUser={currentUser}
            savedDashboards={savedDashboards}
            workspaceFolders={workspaceFolders}
            homeTitle={returnToAdmin ? "Admin Portal" : "Home"}
            activeRole={currentFolderRole}
          />
        )}
      </div>
      {isProcessing && <DashboardLoader message={processingMessage} />}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}