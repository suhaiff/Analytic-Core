import React, { useState } from 'react';
import { Globe, X, Plus, Trash2, Eye, AlertCircle, CheckCircle, Loader, ChevronDown } from 'lucide-react';
import { useTheme } from '../../ThemeContext';
import { getThemeClasses } from '../../theme';
import { parseJSONToTable } from '../../utils/fileParser';

interface ApiImportModalProps {
  onClose: () => void;
  onImport: (file: File) => void;
}

interface KeyValuePair {
  key: string;
  value: string;
}

export const ApiImportModal: React.FC<ApiImportModalProps> = ({ onClose, onImport }) => {
  const { theme } = useTheme();
  const colors = getThemeClasses(theme);

  const [method, setMethod] = useState<'GET' | 'POST'>('GET');
  const [url, setUrl] = useState('');
  const [authType, setAuthType] = useState<'none' | 'bearer' | 'apikey'>('none');
  const [authValue, setAuthValue] = useState('');
  const [apiKeyHeader, setApiKeyHeader] = useState('X-API-Key');
  const [headers, setHeaders] = useState<KeyValuePair[]>([{ key: '', value: '' }]);
  const [params, setParams] = useState<KeyValuePair[]>([{ key: '', value: '' }]);
  const [body, setBody] = useState('');
  const [showBody, setShowBody] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<{ headers: string[]; rows: string[][] } | null>(null);
  const [rawResponse, setRawResponse] = useState<string>('');
  const [datasetName, setDatasetName] = useState('api-data');

  const buildUrl = () => {
    const activeParams = params.filter(p => p.key.trim());
    if (activeParams.length === 0) return url;
    const qs = new URLSearchParams(activeParams.map(p => [p.key, p.value])).toString();
    return `${url}${url.includes('?') ? '&' : '?'}${qs}`;
  };

  const buildHeaders = (): Record<string, string> => {
    const h: Record<string, string> = {};
    headers.filter(kv => kv.key.trim()).forEach(kv => { h[kv.key] = kv.value; });
    if (authType === 'bearer' && authValue) h['Authorization'] = `Bearer ${authValue}`;
    if (authType === 'apikey' && authValue) h[apiKeyHeader || 'X-API-Key'] = authValue;
    return h;
  };

  const handleFetch = async () => {
    if (!url.trim()) {
      setError('Please enter an API URL');
      return;
    }
    setLoading(true);
    setError('');
    setPreview(null);

    try {
      const fetchUrl = buildUrl();
      const fetchHeaders = buildHeaders();
      const fetchOptions: RequestInit = {
        method,
        headers: { 'Content-Type': 'application/json', ...fetchHeaders },
      };
      if (method === 'POST' && body.trim()) {
        fetchOptions.body = body;
      }

      const res = await fetch(fetchUrl, fetchOptions);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('json')) {
        throw new Error('Response is not JSON. Only JSON APIs are supported.');
      }

      const text = await res.text();
      setRawResponse(text);

      const result = parseJSONToTable(text);
      if (result.headers.length === 0) {
        throw new Error('No tabular data found in the response. Ensure the API returns an array of objects.');
      }
      setPreview(result);

      // Auto-generate name from URL
      try {
        const u = new URL(url);
        const pathPart = u.pathname.split('/').filter(Boolean).pop() || 'api-data';
        setDatasetName(pathPart);
      } catch { /* keep default */ }

    } catch (err: any) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Network error: The API may not allow cross-origin requests (CORS). Try enabling CORS on the server or use a CORS proxy.');
      } else {
        setError(err.message || 'Failed to fetch data from API');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImport = () => {
    if (!rawResponse || !preview) return;
    const blob = new Blob([rawResponse], { type: 'application/json' });
    const file = new File([blob], `${datasetName || 'api-data'}.json`, { type: 'application/json' });
    onImport(file);
    onClose();
  };

  const addRow = (setter: React.Dispatch<React.SetStateAction<KeyValuePair[]>>) =>
    setter(prev => [...prev, { key: '', value: '' }]);

  const removeRow = (setter: React.Dispatch<React.SetStateAction<KeyValuePair[]>>, idx: number) =>
    setter(prev => prev.filter((_, i) => i !== idx));

  const updateRow = (setter: React.Dispatch<React.SetStateAction<KeyValuePair[]>>, idx: number, field: 'key' | 'value', val: string) =>
    setter(prev => prev.map((p, i) => i === idx ? { ...p, [field]: val } : p));

  const previewRows = preview ? preview.rows.slice(1, 6) : [];
  const previewHeaders = preview?.headers ?? [];

  const inputClass = `w-full px-4 py-2.5 rounded-xl ${colors.bgTertiary} border ${colors.borderPrimary} ${colors.textPrimary} focus:ring-2 focus:ring-violet-500 outline-none transition text-sm`;
  const labelClass = `block text-xs font-bold uppercase tracking-wider ${colors.textMuted} mb-1.5`;

  return (
    <div className={`fixed inset-0 z-[100] ${colors.overlayBg} backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in`}>
      <div className={`${colors.modalBg} border ${colors.borderPrimary} rounded-2xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar`}>

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-500/10 rounded-lg border border-violet-500/20">
              <Globe className="w-6 h-6 text-violet-500" />
            </div>
            <div>
              <h3 className={`text-xl font-bold ${colors.textPrimary}`}>REST API Import</h3>
              <p className={`text-xs ${colors.textMuted}`}>Fetch JSON data from any API endpoint</p>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg hover:${colors.bgTertiary} ${colors.textMuted} hover:text-red-400 transition`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          {/* URL + Method */}
          <div>
            <label className={labelClass}>Endpoint URL</label>
            <div className="flex gap-2">
              {/* Method selector */}
              <div className="relative">
                <select
                  value={method}
                  onChange={e => setMethod(e.target.value as 'GET' | 'POST')}
                  className={`h-full pl-3 pr-8 rounded-xl ${colors.bgTertiary} border ${colors.borderPrimary} ${colors.textPrimary} focus:ring-2 focus:ring-violet-500 outline-none transition text-sm font-bold appearance-none cursor-pointer`}
                >
                  <option>GET</option>
                  <option>POST</option>
                </select>
                <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 ${colors.textMuted} pointer-events-none`} />
              </div>
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://api.example.com/data"
                className={`flex-1 ${inputClass}`}
                onKeyDown={e => e.key === 'Enter' && handleFetch()}
              />
            </div>
          </div>

          {/* Authentication */}
          <div>
            <label className={labelClass}>Authentication</label>
            <div className="flex gap-2 mb-3">
              {(['none', 'bearer', 'apikey'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setAuthType(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${authType === type
                    ? 'bg-violet-600 text-white border-violet-600'
                    : `${colors.bgTertiary} ${colors.textMuted} ${colors.borderPrimary} hover:border-violet-500/50`
                  }`}
                >
                  {type === 'none' ? 'None' : type === 'bearer' ? 'Bearer Token' : 'API Key'}
                </button>
              ))}
            </div>
            {authType === 'bearer' && (
              <input
                type="password"
                value={authValue}
                onChange={e => setAuthValue(e.target.value)}
                placeholder="Enter Bearer token..."
                className={inputClass}
              />
            )}
            {authType === 'apikey' && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={apiKeyHeader}
                  onChange={e => setApiKeyHeader(e.target.value)}
                  placeholder="Header name"
                  className={`w-36 ${inputClass}`}
                />
                <input
                  type="password"
                  value={authValue}
                  onChange={e => setAuthValue(e.target.value)}
                  placeholder="API Key value..."
                  className={`flex-1 ${inputClass}`}
                />
              </div>
            )}
          </div>

          {/* Headers */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={labelClass}>Custom Headers</label>
              <button onClick={() => addRow(setHeaders)} className={`text-xs ${colors.textMuted} hover:text-violet-400 transition flex items-center gap-1`}>
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            <div className="space-y-2">
              {headers.map((h, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={h.key}
                    onChange={e => updateRow(setHeaders, i, 'key', e.target.value)}
                    placeholder="Header name"
                    className={`flex-1 ${inputClass}`}
                  />
                  <input
                    type="text"
                    value={h.value}
                    onChange={e => updateRow(setHeaders, i, 'value', e.target.value)}
                    placeholder="Value"
                    className={`flex-1 ${inputClass}`}
                  />
                  {headers.length > 1 && (
                    <button onClick={() => removeRow(setHeaders, i)} className={`p-2 rounded-xl ${colors.textMuted} hover:text-red-400 hover:bg-red-500/10 transition`}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Query Params */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={labelClass}>Query Parameters</label>
              <button onClick={() => addRow(setParams)} className={`text-xs ${colors.textMuted} hover:text-violet-400 transition flex items-center gap-1`}>
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            <div className="space-y-2">
              {params.map((p, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={p.key}
                    onChange={e => updateRow(setParams, i, 'key', e.target.value)}
                    placeholder="Parameter name"
                    className={`flex-1 ${inputClass}`}
                  />
                  <input
                    type="text"
                    value={p.value}
                    onChange={e => updateRow(setParams, i, 'value', e.target.value)}
                    placeholder="Value"
                    className={`flex-1 ${inputClass}`}
                  />
                  {params.length > 1 && (
                    <button onClick={() => removeRow(setParams, i)} className={`p-2 rounded-xl ${colors.textMuted} hover:text-red-400 hover:bg-red-500/10 transition`}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* POST Body (toggle) */}
          {method === 'POST' && (
            <div>
              <button
                onClick={() => setShowBody(!showBody)}
                className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${colors.textMuted} hover:text-violet-400 transition mb-2`}
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showBody ? 'rotate-180' : ''}`} />
                Request Body (JSON)
              </button>
              {showBody && (
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder={'{\n  "key": "value"\n}'}
                  rows={4}
                  className={`${inputClass} font-mono resize-none`}
                />
              )}
            </div>
          )}

          {/* CORS Note */}
          <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-violet-500/5 border border-violet-500/15' : 'bg-violet-50 border border-violet-100'}`}>
            <p className={`text-xs ${colors.textMuted}`}>
              <span className="font-bold text-violet-400">Note:</span> The API must allow cross-origin requests (CORS) from the browser. 
              Private/internal APIs may require a backend proxy.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Preview */}
          {preview && !loading && (
            <div className="space-y-3">
              <div className={`flex items-center gap-3 p-3 rounded-xl ${theme === 'dark' ? 'bg-violet-500/5 border border-violet-500/20' : 'bg-violet-50 border border-violet-100'}`}>
                <CheckCircle className="w-5 h-5 text-violet-400 shrink-0" />
                <div>
                  <p className={`text-sm font-semibold ${colors.textPrimary}`}>Data fetched successfully</p>
                  <p className={`text-xs ${colors.textMuted}`}>
                    {preview.rows.length - 1} records • {previewHeaders.length} columns
                  </p>
                </div>
              </div>

              {/* Dataset name */}
              <div>
                <label className={labelClass}>Dataset name</label>
                <input
                  type="text"
                  value={datasetName}
                  onChange={e => setDatasetName(e.target.value)}
                  className={inputClass}
                />
              </div>

              {/* Preview table */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Eye className={`w-4 h-4 ${colors.textMuted}`} />
                  <span className={`text-xs font-bold uppercase tracking-wider ${colors.textMuted}`}>Preview (first 5 rows)</span>
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-700/50">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className={`${theme === 'dark' ? 'bg-slate-800/80' : 'bg-slate-100'}`}>
                        {previewHeaders.slice(0, 6).map((h, i) => (
                          <th key={i} className={`px-3 py-2 text-left font-bold ${colors.textMuted} truncate max-w-[120px]`}>{h}</th>
                        ))}
                        {previewHeaders.length > 6 && (
                          <th className={`px-3 py-2 text-left font-bold ${colors.textMuted}`}>+{previewHeaders.length - 6} more</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row, ri) => (
                        <tr key={ri} className={`border-t ${colors.borderPrimary} ${ri % 2 === 0 ? '' : (theme === 'dark' ? 'bg-slate-800/30' : 'bg-slate-50/50')}`}>
                          {row.slice(0, 6).map((cell, ci) => (
                            <td key={ci} className={`px-3 py-2 ${colors.textSecondary} truncate max-w-[120px]`}>{cell || <span className="opacity-30">—</span>}</td>
                          ))}
                          {row.length > 6 && <td className={`px-3 py-2 ${colors.textMuted} opacity-50`}>...</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            {!preview ? (
              <button
                onClick={handleFetch}
                disabled={loading || !url.trim()}
                className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold transition shadow-lg shadow-violet-900/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader className="w-4 h-4 animate-spin" /> Fetching...</>
                ) : (
                  <><Globe className="w-4 h-4" /> Fetch & Preview Data</>
                )}
              </button>
            ) : (
              <>
                <button
                  onClick={() => { setPreview(null); setRawResponse(''); }}
                  className={`flex-1 py-3 rounded-xl border ${colors.borderPrimary} ${colors.textSecondary} font-bold hover:${colors.bgTertiary} transition`}
                >
                  Re-fetch
                </button>
                <button
                  onClick={handleImport}
                  className="flex-[2] py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold transition shadow-lg shadow-violet-900/20"
                >
                  Import API Data
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
