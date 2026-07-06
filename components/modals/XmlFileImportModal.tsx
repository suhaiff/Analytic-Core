import React, { useState, useRef } from 'react';
import { Upload, FileCode, X, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { useTheme } from '../../ThemeContext';
import { getThemeClasses } from '../../theme';
import { parseXMLToTable } from '../../utils/fileParser';

interface XmlFileImportModalProps {
  onClose: () => void;
  onImport: (file: File) => void;
}

export const XmlFileImportModal: React.FC<XmlFileImportModalProps> = ({ onClose, onImport }) => {
  const { theme } = useTheme();
  const colors = getThemeClasses(theme);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ headers: string[]; rows: string[][] } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.xml')) {
      setError('Please select a valid XML file (.xml)');
      return;
    }
    setError('');
    setLoading(true);
    setSelectedFile(file);

    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const result = parseXMLToTable(content);
        setPreview(result);
        setError('');
      } catch (err: any) {
        setError(err.message || 'Failed to parse XML file');
        setPreview(null);
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = () => {
      setError('Failed to read file');
      setLoading(false);
    };
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleImport = () => {
    if (!selectedFile) return;
    onImport(selectedFile);
    onClose();
  };

  const previewRows = preview ? preview.rows.slice(1, 6) : [];
  const previewHeaders = preview?.headers ?? [];

  return (
    <div className={`fixed inset-0 z-[100] ${colors.overlayBg} backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in`}>
      <div className={`${colors.modalBg} border ${colors.borderPrimary} rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar`}>

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/10 rounded-lg border border-rose-500/20">
              <FileCode className="w-6 h-6 text-rose-500" />
            </div>
            <div>
              <h3 className={`text-xl font-bold ${colors.textPrimary}`}>XML File Import</h3>
              <p className={`text-xs ${colors.textMuted}`}>Upload a local .xml file</p>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg hover:${colors.bgTertiary} ${colors.textMuted} hover:text-red-400 transition`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drop Zone */}
        {!selectedFile && (
          <div
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer
              ${isDragging ? 'border-rose-400 bg-rose-500/10 scale-[1.02]' : `${theme === 'dark' ? 'border-slate-700 hover:border-rose-500/50' : 'border-slate-200 hover:border-rose-400'} hover:bg-rose-500/5`}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xml"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <div className={`p-4 rounded-2xl mb-4 transition-transform duration-300 ${isDragging ? 'scale-110 rotate-6' : ''} ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`}>
              {isDragging ? (
                <Upload className="w-8 h-8 text-rose-400" />
              ) : (
                <FileCode className={`w-8 h-8 ${colors.textTertiary}`} />
              )}
            </div>
            <p className={`font-semibold ${colors.textPrimary} mb-1`}>Drop your XML file here</p>
            <p className={`text-sm ${colors.textMuted}`}>or <span className="text-rose-400 font-medium">browse to upload</span></p>
            <p className={`text-xs ${colors.textMuted} mt-2 opacity-60`}>.xml files only • up to 10MB</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center gap-3 py-8">
            <div className="w-6 h-6 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
            <span className={`text-sm ${colors.textMuted}`}>Parsing XML...</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 mt-4">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Preview */}
        {selectedFile && preview && !loading && (
          <div className="space-y-4 mt-2">
            {/* File info */}
            <div className={`flex items-center gap-3 p-3 rounded-xl ${theme === 'dark' ? 'bg-rose-500/5 border border-rose-500/20' : 'bg-rose-50 border border-rose-100'}`}>
              <CheckCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${colors.textPrimary} truncate`}>{selectedFile.name}</p>
                <p className={`text-xs ${colors.textMuted}`}>
                  {preview.rows.length - 1} records detected • {previewHeaders.length} columns
                </p>
              </div>
              <button
                onClick={() => { setSelectedFile(null); setPreview(null); setError(''); }}
                className={`p-1.5 rounded-lg hover:bg-red-500/10 ${colors.textMuted} hover:text-red-400 transition shrink-0`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Data preview table */}
            {previewHeaders.length > 0 && (
              <div>
                <div className={`flex items-center gap-2 mb-2`}>
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
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setSelectedFile(null); setPreview(null); setError(''); }}
                className={`flex-1 py-3 rounded-xl border ${colors.borderPrimary} ${colors.textSecondary} font-bold hover:${colors.bgTertiary} transition`}
              >
                Change File
              </button>
              <button
                onClick={handleImport}
                className="flex-[2] py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition shadow-lg shadow-rose-900/20"
              >
                Import XML Data
              </button>
            </div>
          </div>
        )}

        {/* How it works note */}
        {!selectedFile && !loading && (
          <div className={`mt-4 p-4 rounded-xl ${theme === 'dark' ? 'bg-slate-800/60' : 'bg-slate-50'} border ${colors.borderPrimary}`}>
            <p className={`text-xs font-bold ${colors.textPrimary} mb-2`}>How XML parsing works</p>
            <ul className={`text-xs ${colors.textMuted} space-y-1 list-disc list-inside`}>
              <li>Repeating child elements become rows</li>
              <li>XML attributes and sub-elements become columns</li>
              <li>Nested elements are flattened with dot-notation (e.g., <code className="bg-slate-700/50 px-1 rounded">address.city</code>)</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
