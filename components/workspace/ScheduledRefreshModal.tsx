import React, { useState, useEffect } from 'react';
import {
  X, Loader2, Check, ChevronRight, FileSpreadsheet, Database, Globe,
  Clock, CalendarDays, RefreshCw, Trash2, AlertCircle, Hourglass, Zap
} from 'lucide-react';
import { RefreshSchedule, User } from '../../types';
import { useTheme } from '../../ThemeContext';
import { getThemeClasses } from '../../theme';
import { scheduledRefreshService } from '../../services/scheduledRefreshService';

interface ScheduledRefreshModalProps {
  dashboardId: string;
  dashboardName: string;
  user: User;
  onClose: () => void;
  onScheduleChange?: (schedule: RefreshSchedule | null) => void;
}

type SourceType = 'google_sheet' | 'sql_database' | 'sharepoint';
type Step = 'SELECT_SOURCE' | 'CREDENTIALS' | 'SCHEDULE' | 'EXISTING';

const SOURCE_OPTIONS: { id: SourceType; label: string; desc: string; icon: React.ReactNode; color: string; bgColor: string; borderColor: string }[] = [
  {
    id: 'google_sheet',
    label: 'Google Sheets',
    desc: 'Auto-refresh data from a shared Google Sheet',
    icon: <FileSpreadsheet className="w-6 h-6" />,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30'
  },
  {
    id: 'sql_database',
    label: 'SQL Database',
    desc: 'Refresh from MySQL or PostgreSQL',
    icon: <Database className="w-6 h-6" />,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30'
  },
  {
    id: 'sharepoint',
    label: 'SharePoint',
    desc: 'Refresh from SharePoint list via Microsoft Graph',
    icon: <Globe className="w-6 h-6" />,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30'
  }
];

const FREQUENCY_OPTIONS = [
  { id: 'hourly', label: 'Every Hour', desc: 'Refreshes once per hour' },
  { id: 'every_6_hours', label: 'Every 6 Hours', desc: 'Refreshes 4 times a day' },
  { id: 'daily', label: 'Daily', desc: 'Refreshes once per day' },
  { id: 'weekly', label: 'Weekly', desc: 'Refreshes once per week' }
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ── IST <-> UTC time conversion ─────────────────────────────────────────────
// The backend stores refresh_time_utc and refresh_day in UTC, but the UI
// surfaces them as IST (UTC+5:30) for the user. These helpers handle the
// 5h30m offset, wrapping around midnight and shifting the day-of-week when
// the conversion crosses midnight.
const IST_OFFSET_MIN = 5 * 60 + 30; // 330 minutes

function shiftHHMM(hhmm: string, deltaMinutes: number, day?: number | null): { time: string; day: number | null } {
  const [hRaw, mRaw] = (hhmm || '00:00').split(':');
  const h = parseInt(hRaw, 10) || 0;
  const m = parseInt(mRaw, 10) || 0;
  let total = h * 60 + m + deltaMinutes;
  let dayDelta = 0;
  while (total >= 1440) { total -= 1440; dayDelta += 1; }
  while (total < 0)    { total += 1440; dayDelta -= 1; }
  const hh = String(Math.floor(total / 60)).padStart(2, '0');
  const mm = String(total % 60).padStart(2, '0');
  const newDay = (day === null || day === undefined)
    ? null
    : ((day + dayDelta) % 7 + 7) % 7;
  return { time: `${hh}:${mm}`, day: newDay };
}

const utcToIst = (utcHHMM: string, utcDay?: number | null) => shiftHHMM(utcHHMM, IST_OFFSET_MIN, utcDay ?? null);
const istToUtc = (istHHMM: string, istDay?: number | null) => shiftHHMM(istHHMM, -IST_OFFSET_MIN, istDay ?? null);

const getCurrentIstHHMM = (): string => {
  const now = new Date();
  // Use en-GB for HH:mm and force the IST timezone so this is correct regardless of the user's system timezone.
  return now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false });
};

export const ScheduledRefreshModal: React.FC<ScheduledRefreshModalProps> = ({
  dashboardId,
  dashboardName,
  user,
  onClose,
  onScheduleChange
}) => {
  const { theme } = useTheme();
  const colors = getThemeClasses(theme);

  // State
  const [step, setStep] = useState<Step>('SELECT_SOURCE');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [existingSchedule, setExistingSchedule] = useState<RefreshSchedule | null>(null);

  // Source selection
  const [selectedSource, setSelectedSource] = useState<SourceType | null>(null);

  // Connection state
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState('');

  // Google Sheets credentials
  const [gsUrl, setGsUrl] = useState('');
  const [gsMetadata, setGsMetadata] = useState<{ title: string; sheets: string[] } | null>(null);
  const [gsSelectedSheets, setGsSelectedSheets] = useState<string[]>([]);

  // SQL credentials
  const [sqlConfig, setSqlConfig] = useState({
    engine: 'mysql',
    host: '',
    port: 3306,
    database: '',
    user: '',
    password: ''
  });
  const [sqlTables, setSqlTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState('');

  // SharePoint credentials
  const [spSiteId, setSpSiteId] = useState('');
  const [spListId, setSpListId] = useState('');
  const [spSiteName, setSpSiteName] = useState('');
  const [spListName, setSpListName] = useState('');

  // Schedule config — stored in IST in the UI; converted to UTC when saving.
  const [frequency, setFrequency] = useState('daily');
  const [timeIst, setTimeIst] = useState('00:00');
  const [dayOfWeek, setDayOfWeek] = useState(1); // Monday (IST)

  // Refreshing now
  const [refreshingNow, setRefreshingNow] = useState(false);

  // Load existing schedule on mount
  useEffect(() => {
    loadExistingSchedule();
  }, [dashboardId]);

  const loadExistingSchedule = async () => {
    setLoading(true);
    try {
      const schedule = await scheduledRefreshService.getSchedule(dashboardId);
      if (schedule) {
        setExistingSchedule(schedule);
        setStep('EXISTING');
        // Pre-populate fields — convert stored UTC values to IST for the UI
        setSelectedSource(schedule.source_type);
        setFrequency(schedule.refresh_frequency);
        const utcTime = schedule.refresh_time_utc?.substring(0, 5) || '00:00';
        const utcDay = (schedule.refresh_day !== null && schedule.refresh_day !== undefined)
          ? schedule.refresh_day
          : null;
        const istConverted = utcToIst(utcTime, utcDay);
        setTimeIst(istConverted.time);
        if (istConverted.day !== null) {
          setDayOfWeek(istConverted.day);
        }
      }
    } catch (err) {
      console.error('Failed to load schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  const extractSpreadsheetId = (url: string): string | null => {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  };

  const handleTestConnection = async () => {
    setError('');
    setConnecting(true);
    setConnectionMessage('');

    try {
      let credentials: any = {};

      if (selectedSource === 'google_sheet') {
        const spreadsheetId = extractSpreadsheetId(gsUrl);
        if (!spreadsheetId) {
          setError('Invalid Google Sheets URL');
          return;
        }
        credentials = { spreadsheetId };
      } else if (selectedSource === 'sql_database') {
        credentials = { ...sqlConfig };
      } else if (selectedSource === 'sharepoint') {
        credentials = { siteId: spSiteId, listId: spListId };
      }

      const result = await scheduledRefreshService.testConnection(selectedSource!, credentials);

      if (result.success) {
        setConnected(true);
        setConnectionMessage(result.message);

        // For Google Sheets, populate sheet names
        if (selectedSource === 'google_sheet' && result.metadata) {
          setGsMetadata(result.metadata);
          if (result.metadata.sheets?.length > 0) {
            setGsSelectedSheets([result.metadata.sheets[0]]);
          }
        }
      } else {
        setError(result.message || 'Connection failed');
      }
    } catch (err: any) {
      setError(err.message || 'Connection test failed');
    } finally {
      setConnecting(false);
    }
  };

  const handleFetchTables = async () => {
    setConnecting(true);
    setError('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3001`}/api/sql/tables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sqlConfig)
      });

      if (!response.ok) {
        // Fallback: use test connection endpoint to validate, then use a direct query
        // For now, just mark as connected since test passed
        setSqlTables([]);
        return;
      }

      const data = await response.json();
      setSqlTables(data.tables || []);
    } catch (err: any) {
      // Tables endpoint might not exist, that's ok - user can type table name
      console.warn('Fetch tables failed:', err);
    } finally {
      setConnecting(false);
    }
  };

  const handleSave = async () => {
    setError('');
    setSaving(true);

    try {
      let credentials: any = {};

      if (selectedSource === 'google_sheet') {
        const spreadsheetId = extractSpreadsheetId(gsUrl);
        credentials = {
          spreadsheetId,
          sheetNames: gsSelectedSheets,
          sheetUrl: gsUrl,
          title: gsMetadata?.title || ''
        };
      } else if (selectedSource === 'sql_database') {
        credentials = {
          ...sqlConfig,
          tableName: selectedTable
        };
      } else if (selectedSource === 'sharepoint') {
        credentials = {
          siteId: spSiteId,
          listId: spListId,
          siteName: spSiteName,
          listName: spListName
        };
      }

      // Convert IST UI values back to UTC for storage.
      const utcConverted = istToUtc(
        timeIst,
        frequency === 'weekly' ? dayOfWeek : null
      );
      const schedule = await scheduledRefreshService.createSchedule(
        dashboardId,
        user.id,
        selectedSource!,
        credentials,
        frequency,
        utcConverted.time,
        frequency === 'weekly' ? utcConverted.day : null
      );

      setExistingSchedule(schedule);
      onScheduleChange?.(schedule);
      setStep('EXISTING');
    } catch (err: any) {
      setError(err.message || 'Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Remove the scheduled refresh? Data will no longer auto-update.')) return;
    setSaving(true);
    setError('');
    try {
      await scheduledRefreshService.deleteSchedule(dashboardId, user.id);
      setExistingSchedule(null);
      onScheduleChange?.(null);
      setStep('SELECT_SOURCE');
      // Reset all state
      setSelectedSource(null);
      setConnected(false);
      setGsUrl('');
      setGsMetadata(null);
      setGsSelectedSheets([]);
      setSqlConfig({ engine: 'mysql', host: '', port: 3306, database: '', user: '', password: '' });
      setSqlTables([]);
      setSelectedTable('');
      setSpSiteId('');
      setSpListId('');
    } catch (err: any) {
      setError(err.message || 'Failed to delete schedule');
    } finally {
      setSaving(false);
    }
  };

  const handleRefreshNow = async () => {
    setRefreshingNow(true);
    setError('');
    try {
      const result = await scheduledRefreshService.refreshNow(dashboardId, user.id);
      if (result.schedule) {
        setExistingSchedule(result.schedule);
        onScheduleChange?.(result.schedule);
        // Surface a clear hint that dashboard must be reopened to see new data
        setError('');
        alert('Data refreshed successfully. Re-open the dashboard to view the latest data.');
      }
    } catch (err: any) {
      setError(err.message || 'Refresh failed');
    } finally {
      setRefreshingNow(false);
    }
  };

  const canProceedToSchedule = () => {
    if (!connected) return false;
    if (selectedSource === 'google_sheet') return gsSelectedSheets.length > 0;
    if (selectedSource === 'sql_database') return !!selectedTable;
    if (selectedSource === 'sharepoint') return !!spSiteId && !!spListId;
    return false;
  };

  const renderSourceSelection = () => (
    <div className="space-y-4">
      <div className="mb-2">
        <h4 className={`text-sm font-bold uppercase tracking-wider ${colors.textMuted} mb-1`}>
          Choose Data Source
        </h4>
        <p className={`text-xs ${colors.textMuted} opacity-60`}>Select the live data source to auto-refresh this dashboard from</p>
      </div>

      {SOURCE_OPTIONS.map(source => (
        <button
          key={source.id}
          onClick={() => { setSelectedSource(source.id); setStep('CREDENTIALS'); setConnected(false); setError(''); setConnectionMessage(''); }}
          className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 group hover:scale-[1.01] active:scale-[0.99] ${
            theme === 'dark'
              ? `${colors.bgTertiary} ${colors.borderPrimary} hover:border-indigo-500/40`
              : `bg-white ${colors.borderPrimary} hover:border-indigo-300`
          }`}
        >
          <div className={`w-12 h-12 rounded-xl ${source.bgColor} flex items-center justify-center ${source.color} group-hover:scale-110 transition-transform`}>
            {source.icon}
          </div>
          <div className="text-left flex-1">
            <div className={`text-sm font-bold ${colors.textPrimary}`}>{source.label}</div>
            <div className={`text-[11px] ${colors.textMuted} opacity-70`}>{source.desc}</div>
          </div>
          <ChevronRight className={`w-5 h-5 ${colors.textMuted} group-hover:translate-x-1 group-hover:text-indigo-400 transition-all`} />
        </button>
      ))}
    </div>
  );

  const renderGoogleSheetsCredentials = () => (
    <div className="space-y-5">
      <div>
        <label className={`block text-xs font-bold uppercase tracking-wider ${colors.textMuted} mb-2`}>
          Google Sheet URL
        </label>
        <input
          type="text"
          value={gsUrl}
          onChange={e => { setGsUrl(e.target.value); setConnected(false); setGsMetadata(null); }}
          placeholder="https://docs.google.com/spreadsheets/d/..."
          className={`w-full px-4 py-3 rounded-xl ${colors.bgPrimary} border ${colors.borderSecondary} ${colors.textPrimary} focus:ring-2 focus:ring-green-500 outline-none transition text-sm`}
        />
      </div>

      <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-green-500/5' : 'bg-green-50'} border ${theme === 'dark' ? 'border-green-500/20' : 'border-green-100'} text-xs ${colors.textMuted} leading-relaxed`}>
        Ensure the sheet is shared with viewer access to:<br />
        <code className="block mt-1.5 p-1.5 bg-black/20 rounded font-mono text-green-400 break-all text-[10px]">
          dashboard-sheets-reader@diesel-skyline-479213-f1.iam.gserviceaccount.com
        </code>
      </div>

      {!connected ? (
        <button
          onClick={handleTestConnection}
          disabled={connecting || !gsUrl}
          className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold transition shadow-lg shadow-green-900/20 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
        >
          {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          Connect Sheet
        </button>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
            <Check className="w-5 h-5 text-green-400" />
            <span className="text-sm font-bold text-green-400">{connectionMessage}</span>
          </div>

          {gsMetadata && (
            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider ${colors.textMuted} mb-2`}>
                Select Sheets to Refresh
              </label>
              <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar">
                {gsMetadata.sheets.map(sheet => (
                  <button
                    key={sheet}
                    onClick={() => {
                      setGsSelectedSheets(prev =>
                        prev.includes(sheet)
                          ? prev.filter(s => s !== sheet)
                          : [...prev, sheet]
                      );
                    }}
                    className={`w-full px-4 py-2.5 rounded-xl border text-left text-sm transition-all ${
                      gsSelectedSheets.includes(sheet)
                        ? 'border-green-500 bg-green-500/10 text-green-400 font-bold'
                        : `${colors.borderPrimary} ${colors.bgTertiary} ${colors.textSecondary} hover:border-green-500/50`
                    }`}
                  >
                    {sheet}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderSqlCredentials = () => (
    <div className="space-y-4">
      <div>
        <label className={`block text-xs font-bold uppercase tracking-wider ${colors.textMuted} mb-2`}>Database Type</label>
        <select
          value={sqlConfig.engine}
          onChange={e => setSqlConfig({ ...sqlConfig, engine: e.target.value, port: e.target.value === 'postgresql' ? 5432 : 3306 })}
          className={`w-full px-4 py-3 rounded-xl ${colors.bgPrimary} border ${colors.borderSecondary} ${colors.textPrimary} focus:ring-2 focus:ring-blue-500 outline-none transition text-sm`}
        >
          <option value="mysql">MySQL</option>
          <option value="postgresql">PostgreSQL</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={`block text-xs font-bold uppercase tracking-wider ${colors.textMuted} mb-2`}>Host</label>
          <input
            type="text" value={sqlConfig.host}
            onChange={e => setSqlConfig({ ...sqlConfig, host: e.target.value })}
            placeholder="db.example.com"
            className={`w-full px-4 py-3 rounded-xl ${colors.bgPrimary} border ${colors.borderSecondary} ${colors.textPrimary} focus:ring-2 focus:ring-blue-500 outline-none transition text-sm`}
          />
        </div>
        <div>
          <label className={`block text-xs font-bold uppercase tracking-wider ${colors.textMuted} mb-2`}>Port</label>
          <input
            type="number" value={sqlConfig.port}
            onChange={e => setSqlConfig({ ...sqlConfig, port: parseInt(e.target.value) || 3306 })}
            className={`w-full px-4 py-3 rounded-xl ${colors.bgPrimary} border ${colors.borderSecondary} ${colors.textPrimary} focus:ring-2 focus:ring-blue-500 outline-none transition text-sm`}
          />
        </div>
      </div>

      <div>
        <label className={`block text-xs font-bold uppercase tracking-wider ${colors.textMuted} mb-2`}>Database</label>
        <input
          type="text" value={sqlConfig.database}
          onChange={e => setSqlConfig({ ...sqlConfig, database: e.target.value })}
          placeholder="my_database"
          className={`w-full px-4 py-3 rounded-xl ${colors.bgPrimary} border ${colors.borderSecondary} ${colors.textPrimary} focus:ring-2 focus:ring-blue-500 outline-none transition text-sm`}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={`block text-xs font-bold uppercase tracking-wider ${colors.textMuted} mb-2`}>Username</label>
          <input
            type="text" value={sqlConfig.user}
            onChange={e => setSqlConfig({ ...sqlConfig, user: e.target.value })}
            placeholder="username"
            className={`w-full px-4 py-3 rounded-xl ${colors.bgPrimary} border ${colors.borderSecondary} ${colors.textPrimary} focus:ring-2 focus:ring-blue-500 outline-none transition text-sm`}
          />
        </div>
        <div>
          <label className={`block text-xs font-bold uppercase tracking-wider ${colors.textMuted} mb-2`}>Password</label>
          <input
            type="password" value={sqlConfig.password}
            onChange={e => setSqlConfig({ ...sqlConfig, password: e.target.value })}
            placeholder="••••••••"
            className={`w-full px-4 py-3 rounded-xl ${colors.bgPrimary} border ${colors.borderSecondary} ${colors.textPrimary} focus:ring-2 focus:ring-blue-500 outline-none transition text-sm`}
          />
        </div>
      </div>

      {!connected ? (
        <button
          onClick={handleTestConnection}
          disabled={connecting || !sqlConfig.host || !sqlConfig.database || !sqlConfig.user}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-lg shadow-blue-900/20 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
        >
          {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          Test Connection
        </button>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <Check className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-bold text-blue-400">{connectionMessage}</span>
          </div>

          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider ${colors.textMuted} mb-2`}>Table Name</label>
            <input
              type="text"
              value={selectedTable}
              onChange={e => setSelectedTable(e.target.value)}
              placeholder="Enter table name to refresh from"
              className={`w-full px-4 py-3 rounded-xl ${colors.bgPrimary} border ${colors.borderSecondary} ${colors.textPrimary} focus:ring-2 focus:ring-blue-500 outline-none transition text-sm`}
            />
          </div>
        </div>
      )}
    </div>
  );

  const renderSharePointCredentials = () => (
    <div className="space-y-4">
      <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-orange-500/5' : 'bg-orange-50'} border ${theme === 'dark' ? 'border-orange-500/20' : 'border-orange-100'}`}>
        <p className={`text-xs ${colors.textMuted} leading-relaxed`}>
          For scheduled refresh, SharePoint uses the server-side service account (Client Credentials flow). Enter the Site ID and List ID from your initial import.
        </p>
      </div>

      <div>
        <label className={`block text-xs font-bold uppercase tracking-wider ${colors.textMuted} mb-2`}>SharePoint Site ID</label>
        <input
          type="text" value={spSiteId}
          onChange={e => setSpSiteId(e.target.value)}
          placeholder="site-id-from-import"
          className={`w-full px-4 py-3 rounded-xl ${colors.bgPrimary} border ${colors.borderSecondary} ${colors.textPrimary} focus:ring-2 focus:ring-orange-500 outline-none transition text-sm`}
        />
      </div>

      <div>
        <label className={`block text-xs font-bold uppercase tracking-wider ${colors.textMuted} mb-2`}>Site Name (optional label)</label>
        <input
          type="text" value={spSiteName}
          onChange={e => setSpSiteName(e.target.value)}
          placeholder="e.g. Marketing Hub"
          className={`w-full px-4 py-3 rounded-xl ${colors.bgPrimary} border ${colors.borderSecondary} ${colors.textPrimary} focus:ring-2 focus:ring-orange-500 outline-none transition text-sm`}
        />
      </div>

      <div>
        <label className={`block text-xs font-bold uppercase tracking-wider ${colors.textMuted} mb-2`}>SharePoint List ID</label>
        <input
          type="text" value={spListId}
          onChange={e => setSpListId(e.target.value)}
          placeholder="list-id-from-import"
          className={`w-full px-4 py-3 rounded-xl ${colors.bgPrimary} border ${colors.borderSecondary} ${colors.textPrimary} focus:ring-2 focus:ring-orange-500 outline-none transition text-sm`}
        />
      </div>

      <div>
        <label className={`block text-xs font-bold uppercase tracking-wider ${colors.textMuted} mb-2`}>List Name (optional label)</label>
        <input
          type="text" value={spListName}
          onChange={e => setSpListName(e.target.value)}
          placeholder="e.g. Sales Data"
          className={`w-full px-4 py-3 rounded-xl ${colors.bgPrimary} border ${colors.borderSecondary} ${colors.textPrimary} focus:ring-2 focus:ring-orange-500 outline-none transition text-sm`}
        />
      </div>

      {!connected ? (
        <button
          onClick={handleTestConnection}
          disabled={connecting || !spSiteId || !spListId}
          className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold transition shadow-lg shadow-orange-900/20 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
        >
          {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          Test SharePoint Connection
        </button>
      ) : (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
          <Check className="w-5 h-5 text-orange-400" />
          <span className="text-sm font-bold text-orange-400">{connectionMessage}</span>
        </div>
      )}
    </div>
  );

  const renderScheduleConfig = () => (
    <div className="space-y-6">
      {/* Summary */}
      <div className={`p-4 rounded-2xl ${colors.bgTertiary} border ${colors.borderPrimary}`}>
        <div className="flex items-center gap-3 mb-2">
          {SOURCE_OPTIONS.find(s => s.id === selectedSource) && (
            <div className={`p-2 rounded-lg ${SOURCE_OPTIONS.find(s => s.id === selectedSource)!.bgColor}`}>
              {React.cloneElement(SOURCE_OPTIONS.find(s => s.id === selectedSource)!.icon as React.ReactElement, { className: `w-4 h-4 ${SOURCE_OPTIONS.find(s => s.id === selectedSource)!.color}` })}
            </div>
          )}
          <div>
            <div className={`text-sm font-bold ${colors.textPrimary}`}>
              {SOURCE_OPTIONS.find(s => s.id === selectedSource)?.label}
            </div>
            <div className={`text-[10px] ${colors.textMuted}`}>
              {selectedSource === 'google_sheet' && gsMetadata?.title}
              {selectedSource === 'sql_database' && `${sqlConfig.host}/${sqlConfig.database} → ${selectedTable}`}
              {selectedSource === 'sharepoint' && (spSiteName || spSiteId)}
            </div>
          </div>
          <Check className="w-5 h-5 text-green-400 ml-auto" />
        </div>
      </div>

      {/* Frequency */}
      <div>
        <label className={`block text-xs font-bold uppercase tracking-wider ${colors.textMuted} mb-3 flex items-center gap-2`}>
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Frequency
        </label>
        <div className="grid grid-cols-2 gap-2">
          {FREQUENCY_OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => setFrequency(opt.id)}
              className={`p-3 rounded-xl border text-left transition-all ${
                frequency === opt.id
                  ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                  : `${colors.borderPrimary} ${colors.bgTertiary} ${colors.textSecondary} hover:border-indigo-500/50`
              }`}
            >
              <div className="text-sm font-bold">{opt.label}</div>
              <div className={`text-[10px] ${colors.textMuted}`}>{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Time */}
      <div>
        <label className={`block text-xs font-bold uppercase tracking-wider ${colors.textMuted} mb-2 flex items-center gap-2`}>
          <Clock className="w-3.5 h-3.5" /> Refresh Time (IST)
        </label>
        <input
          type="time"
          value={timeIst}
          onChange={e => setTimeIst(e.target.value)}
          className={`w-full px-4 py-3 rounded-xl ${colors.bgPrimary} border ${colors.borderSecondary} ${colors.textPrimary} focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm`}
        />
        <p className={`text-[10px] ${colors.textMuted} mt-1.5 opacity-60`}>
          Current IST time: {getCurrentIstHHMM()} · stored as UTC {istToUtc(timeIst).time}
        </p>
      </div>

      {/* Day of Week (for weekly) */}
      {frequency === 'weekly' && (
        <div>
          <label className={`block text-xs font-bold uppercase tracking-wider ${colors.textMuted} mb-2 flex items-center gap-2`}>
            <CalendarDays className="w-3.5 h-3.5" /> Day of Week
          </label>
          <select
            value={dayOfWeek}
            onChange={e => setDayOfWeek(parseInt(e.target.value))}
            className={`w-full px-4 py-3 rounded-xl ${colors.bgPrimary} border ${colors.borderSecondary} ${colors.textPrimary} focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm`}
          >
            {DAY_NAMES.map((name, idx) => (
              <option key={idx} value={idx}>{name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-lg shadow-indigo-900/20 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Hourglass className="w-4 h-4" />}
        {existingSchedule ? 'Update Schedule' : 'Enable Scheduled Refresh'}
      </button>
    </div>
  );

  const renderExisting = () => {
    if (!existingSchedule) return null;
    const src = SOURCE_OPTIONS.find(s => s.id === existingSchedule.source_type);
    const freq = FREQUENCY_OPTIONS.find(f => f.id === existingSchedule.refresh_frequency);

    return (
      <div className="space-y-5">
        {/* Status card */}
        <div className={`p-5 rounded-2xl border ${colors.borderPrimary} ${colors.bgTertiary} relative overflow-hidden`}>
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl" />
          <div className="flex items-center gap-3 mb-4">
            {src && (
              <div className={`p-2.5 rounded-xl ${src.bgColor}`}>
                {React.cloneElement(src.icon as React.ReactElement, { className: `w-5 h-5 ${src.color}` })}
              </div>
            )}
            <div className="flex-1">
              <div className={`text-sm font-bold ${colors.textPrimary}`}>{src?.label}</div>
              <div className={`text-[10px] ${colors.textMuted}`}>
                {existingSchedule.source_type === 'google_sheet' && existingSchedule.source_credentials?.title}
                {existingSchedule.source_type === 'sql_database' && `${existingSchedule.source_credentials?.host}/${existingSchedule.source_credentials?.database}`}
                {existingSchedule.source_type === 'sharepoint' && (existingSchedule.source_credentials?.siteName || 'SharePoint')}
              </div>
            </div>
            <div className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
              existingSchedule.is_active
                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}>
              {existingSchedule.is_active ? 'Active' : 'Paused'}
            </div>
          </div>

          {(() => {
            const storedUtcTime = existingSchedule.refresh_time_utc?.substring(0, 5) || '00:00';
            const storedUtcDay = (existingSchedule.refresh_day !== null && existingSchedule.refresh_day !== undefined)
              ? existingSchedule.refresh_day
              : null;
            const istView = utcToIst(storedUtcTime, storedUtcDay);
            return (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-3 rounded-xl ${colors.bgPrimary} border ${colors.borderPrimary}`}>
                    <div className={`text-[10px] font-bold uppercase tracking-wider ${colors.textMuted} mb-1`}>Frequency</div>
                    <div className={`text-sm font-bold ${colors.textPrimary}`}>{freq?.label}</div>
                  </div>
                  <div className={`p-3 rounded-xl ${colors.bgPrimary} border ${colors.borderPrimary}`}>
                    <div className={`text-[10px] font-bold uppercase tracking-wider ${colors.textMuted} mb-1`}>Time (IST)</div>
                    <div className={`text-sm font-bold ${colors.textPrimary}`}>{istView.time}</div>
                    <div className={`text-[9px] ${colors.textMuted} opacity-60 mt-0.5`}>UTC {storedUtcTime}</div>
                  </div>
                </div>

                {existingSchedule.refresh_frequency === 'weekly' && istView.day !== null && (
                  <div className={`mt-3 p-3 rounded-xl ${colors.bgPrimary} border ${colors.borderPrimary}`}>
                    <div className={`text-[10px] font-bold uppercase tracking-wider ${colors.textMuted} mb-1`}>Day (IST)</div>
                    <div className={`text-sm font-bold ${colors.textPrimary}`}>{DAY_NAMES[istView.day]}</div>
                  </div>
                )}
              </>
            );
          })()}
        </div>

        {/* Last refresh status */}
        {existingSchedule.last_refreshed_at && (
          <div className={`p-4 rounded-2xl border ${
            existingSchedule.last_refresh_status === 'success'
              ? 'bg-green-500/5 border-green-500/20'
              : existingSchedule.last_refresh_status === 'failed'
              ? 'bg-red-500/5 border-red-500/20'
              : existingSchedule.last_refresh_status === 'running'
              ? 'bg-yellow-500/5 border-yellow-500/20'
              : `${colors.bgTertiary} ${colors.borderPrimary}`
          }`}>
            <div className="flex items-center gap-2 mb-1">
              {existingSchedule.last_refresh_status === 'success' && <Check className="w-4 h-4 text-green-400" />}
              {existingSchedule.last_refresh_status === 'failed' && <AlertCircle className="w-4 h-4 text-red-400" />}
              {existingSchedule.last_refresh_status === 'running' && <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />}
              <span className={`text-xs font-bold ${
                existingSchedule.last_refresh_status === 'success' ? 'text-green-400' :
                existingSchedule.last_refresh_status === 'failed' ? 'text-red-400' :
                existingSchedule.last_refresh_status === 'running' ? 'text-yellow-400' :
                colors.textSecondary
              }`}>
                Last Refresh: {existingSchedule.last_refresh_status === 'running' ? 'Running...' : existingSchedule.last_refresh_status?.toUpperCase()}
              </span>
            </div>
            <div className={`text-[10px] ${colors.textMuted}`}>
              {new Date(existingSchedule.last_refreshed_at).toLocaleString()} (UTC: {new Date(existingSchedule.last_refreshed_at).toISOString().substring(0, 19).replace('T', ' ')})
            </div>
            {existingSchedule.last_refresh_status === 'failed' && existingSchedule.last_refresh_error && (
              <div className="text-[10px] text-red-400 mt-1.5 font-mono bg-red-500/5 p-2 rounded-lg">
                {existingSchedule.last_refresh_error}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleRefreshNow}
            disabled={refreshingNow}
            className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-lg shadow-indigo-900/20 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
          >
            {refreshingNow ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh Now
          </button>
          <button
            onClick={() => { setStep('SELECT_SOURCE'); setConnected(false); }}
            className={`px-4 py-3 rounded-xl border ${colors.borderPrimary} ${colors.textSecondary} font-bold hover:${colors.bgTertiary} transition text-sm`}
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={saving}
            className="px-4 py-3 rounded-xl border border-red-500/30 text-red-400 font-bold hover:bg-red-500/10 transition text-sm"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const getStepTitle = () => {
    if (step === 'EXISTING') return 'Scheduled Refresh';
    if (step === 'SELECT_SOURCE') return 'Setup Scheduled Refresh';
    if (step === 'CREDENTIALS') return `Connect ${SOURCE_OPTIONS.find(s => s.id === selectedSource)?.label || 'Source'}`;
    if (step === 'SCHEDULE') return 'Set Refresh Schedule';
    return 'Scheduled Refresh';
  };

  return (
    <div className={`fixed inset-0 z-[100] ${colors.overlayBg} backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in`}>
      <div className={`${colors.modalBg} border ${colors.borderPrimary} rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500/20 to-violet-500/20 rounded-xl border border-indigo-500/10">
              <Hourglass className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className={`text-lg font-bold ${colors.textPrimary}`}>{getStepTitle()}</h3>
              <p className={`text-[10px] ${colors.textMuted} truncate max-w-[200px]`}>{dashboardName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl hover:${colors.bgTertiary} ${colors.textMuted} hover:${colors.textPrimary} transition`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          </div>
        ) : (
          <>
            {/* Step navigation breadcrumb (only for new setup flow) */}
            {step !== 'EXISTING' && (
              <div className="flex items-center gap-2 mb-6">
                {[
                  { id: 'SELECT_SOURCE', label: 'Source' },
                  { id: 'CREDENTIALS', label: 'Connect' },
                  { id: 'SCHEDULE', label: 'Schedule' }
                ].map((s, idx) => (
                  <React.Fragment key={s.id}>
                    <div className={`flex items-center gap-1.5 ${step === s.id ? 'text-indigo-400' : colors.textMuted}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        step === s.id ? 'bg-indigo-600 text-white' : `${colors.bgTertiary} ${colors.textMuted}`
                      }`}>
                        {idx + 1}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">{s.label}</span>
                    </div>
                    {idx < 2 && <div className={`h-px flex-1 ${
                      (idx === 0 && (step === 'CREDENTIALS' || step === 'SCHEDULE')) ||
                      (idx === 1 && step === 'SCHEDULE')
                        ? 'bg-indigo-500' : `${colors.borderPrimary}`
                    }`} />}
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Steps */}
            {step === 'SELECT_SOURCE' && renderSourceSelection()}
            {step === 'CREDENTIALS' && (
              <div>
                {selectedSource === 'google_sheet' && renderGoogleSheetsCredentials()}
                {selectedSource === 'sql_database' && renderSqlCredentials()}
                {selectedSource === 'sharepoint' && renderSharePointCredentials()}

                {/* Navigation */}
                <div className="flex gap-3 mt-6 pt-4 border-t border-white/5">
                  <button
                    onClick={() => { setStep('SELECT_SOURCE'); setConnected(false); setError(''); }}
                    className={`flex-1 py-2.5 rounded-xl border ${colors.borderPrimary} ${colors.textSecondary} font-bold hover:${colors.bgTertiary} transition text-sm`}
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep('SCHEDULE')}
                    disabled={!canProceedToSchedule()}
                    className="flex-[2] py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-lg disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                  >
                    Continue <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
            {step === 'SCHEDULE' && (
              <div>
                {renderScheduleConfig()}
                <div className="mt-4">
                  <button
                    onClick={() => setStep('CREDENTIALS')}
                    className={`w-full py-2.5 rounded-xl border ${colors.borderPrimary} ${colors.textSecondary} font-medium hover:${colors.bgTertiary} transition text-sm`}
                  >
                    ← Back to Connection
                  </button>
                </div>
              </div>
            )}
            {step === 'EXISTING' && renderExisting()}
          </>
        )}
      </div>
    </div>
  );
};
