import React, { useState, useEffect } from 'react';
import { Landing } from './components/Landing';
import { DataConfig } from './components/DataConfig';
import { ChartBuilder } from './components/ChartBuilder';
import { Dashboard } from './components/Dashboard';
import { Login } from './components/auth/Login';
import { Signup } from './components/auth/Signup';
import { Welcome } from './components/Welcome';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { processFile } from './utils/fileParser';
import { DataModel, ChartConfig, DataTable, SavedDashboard, User, ProcessedRow } from './types';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { ThemeProvider, useTheme } from './ThemeContext';
import { getThemeClasses } from './theme';
import { authService } from './services/authService';
import { dashboardService } from './services/dashboardService';
import { fileService } from './services/fileService';

enum Step {
  WELCOME = 'WELCOME',
  LOGIN = 'LOGIN',
  SIGNUP = 'SIGNUP',
  ADMIN = 'ADMIN',
  LANDING = 0,
  CONFIG = 1,
  BUILDER = 2,
  DASHBOARD = 3
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
  const [sourceType, setSourceType] = useState<'file' | 'google_sheet'>('file');

  // UI State
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' });
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Saved Dashboards State
  const [savedDashboards, setSavedDashboards] = useState<SavedDashboard[]>([]);

  // Check for logged in user on init
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      if (user.role === 'ADMIN') {
        setStep(Step.ADMIN);
      } else {
        setStep(Step.LANDING);
      }
    } else {
      setStep(Step.WELCOME);
    }
  }, []);

  // Load saved dashboards from DB on init or user change
  useEffect(() => {
    if (currentUser && currentUser.role !== 'ADMIN') {
      loadUserDashboards(currentUser.id);
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
      if (user.role === 'ADMIN') {
        setStep(Step.ADMIN);
      } else {
        setStep(Step.LANDING);
      }
      showToast(`Welcome back, ${user.name}!`);
    }
  };

  const handleSignupSuccess = () => {
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setStep(Step.LANDING);
      showToast(`Welcome to InsightAI, ${user.name}!`);
    }
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
    }
  };

  const handleGoogleSheetImport = (spreadsheetId: string, sheetName: string, data: any[][], title: string, fileId: number) => {
    // Convert array of arrays to DataTable format
    const headers = data[0] || [];
    const rows = data; // Keep all rows including headers for DataConfig to handle header index

    const table: DataTable = {
      id: spreadsheetId,
      name: sheetName,
      rawData: {
        headers,
        rows
      }
    };

    setInitialTables([table]);
    setFileName(title || `GS: ${sheetName}`);
    setSourceType('google_sheet');
    setUploadedFileId(fileId);
  };

  const handleRefresh = async () => {
    if (!dataModel || !dataModel.fileId || dataModel.sourceType !== 'google_sheet') return;

    try {
      const result = await fileService.refreshGoogleSheet(dataModel.fileId);
      const rawData = result.data;
      if (!rawData || rawData.length === 0) return;

      // Re-process data
      const headerIdx = dataModel.headerIndex || 0;
      const headers = rawData[headerIdx] || [];
      const rows = rawData.slice(headerIdx + 1);

      const processedData: ProcessedRow[] = rows.map(row => {
        const rowObj: ProcessedRow = {};
        dataModel.columns.forEach(col => {
          const colIdx = headers.indexOf(col);
          if (colIdx !== -1) {
            const val = row[colIdx];
            if (dataModel.numericColumns.includes(col)) {
              rowObj[col] = val === '' || val === null ? 0 : Number(val);
            } else {
              rowObj[col] = val === null || val === undefined ? '' : String(val);
            }
          }
        });
        return rowObj;
      });

      setDataModel({
        ...dataModel,
        data: processedData
      });

      showToast("Data refreshed successfully", 'success');
    } catch (error) {
      console.error("Refresh failed", error);
      showToast("Failed to refresh data", 'error');
    }
  };

  const handleConfigFinalize = (model: DataModel) => {
    setDataModel(model);
    setStep(Step.BUILDER);
  };

  const handleGenerateReport = (charts: ChartConfig[]) => {
    setChartConfigs(charts);
    setStep(Step.DASHBOARD);
  };

  const handleReturnHomeRequest = () => {
    setShowExitConfirm(true);
  };

  const confirmReturnHome = () => {
    setShowExitConfirm(false);
    setStep(Step.LANDING);
    setInitialTables([]);
    setFileName('');
    setDataModel(null);
    setChartConfigs([]);
  };

  const handleSaveDashboard = async (name: string, currentCharts: ChartConfig[]) => {
    if (!dataModel || !currentUser) return;

    const newDash: SavedDashboard = {
      id: Date.now().toString(),
      name,
      date: new Date().toLocaleDateString(),
      dataModel: dataModel,
      chartConfigs: currentCharts
    };

    try {
      await dashboardService.saveDashboard(currentUser.id, newDash);
      // Reload dashboards
      await loadUserDashboards(currentUser.id);
      showToast(`Dashboard "${name}" saved successfully!`, 'success');
    } catch (error) {
      console.error("Failed to save dashboard", error);
      showToast("Failed to save dashboard", 'error');
    }
  };

  const handleLoadDashboard = (dash: SavedDashboard) => {
    setDataModel(dash.dataModel);
    setChartConfigs(dash.chartConfigs);
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
            onLoginSuccess={handleLoginSuccess}
            onNavigateToSignup={() => setStep(Step.SIGNUP)}
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

        {step === Step.ADMIN && (
          <AdminDashboard onLogout={handleLogout} />
        )}

        {step === Step.LANDING && (
          <Landing
            onFileUpload={handleFileUpload}
            onGoogleSheetImport={(spreadsheetId, sheetName, data, title, fileId) => {
              handleGoogleSheetImport(spreadsheetId, sheetName, data, title, fileId);
              setStep(Step.CONFIG);
            }}
            savedDashboards={savedDashboards}
            onLoadDashboard={handleLoadDashboard}
            onDeleteDashboard={handleDeleteDashboard}
            onLogout={handleLogout}
            user={currentUser}
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
          />
        )}

        {step === Step.DASHBOARD && dataModel && (
          <Dashboard
            dataModel={dataModel}
            chartConfigs={chartConfigs}
            onHome={handleReturnHomeRequest}
            onSave={handleSaveDashboard}
            onRefresh={handleRefresh}
          />
        )}
      </div>
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