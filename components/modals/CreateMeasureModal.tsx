import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { API_BASE } from '../../config/api';
import { fetchWithAuth } from '../../utils/fetchWithAuth';

interface CreateMeasureModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheetId: string;
  availableColumns: string[];
  onMeasureSaved: (measure?: any) => void;
  initialMeasure?: any;
}

export default function CreateMeasureModal({ isOpen, onClose, sheetId, availableColumns, onMeasureSaved, initialMeasure }: CreateMeasureModalProps) {
  const [name, setName] = useState('');
  const [formula, setFormula] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Pre-fill when editing an existing measure
  useEffect(() => {
    if (isOpen && initialMeasure) {
      setName(initialMeasure.name || '');
      setFormula(initialMeasure.dax_formula || '');
      setError(null);
      setSuccess(null);
    } else if (!isOpen) {
      setName('');
      setFormula('');
      setError(null);
      setSuccess(null);
    }
  }, [isOpen, initialMeasure]);

  if (!isOpen) return null;

  const handleValidate = async () => {
    try {
      const response = await fetchWithAuth(`${API_BASE}/dax/parse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ formula })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Syntax Error');
        setSuccess(null);
        return false;
      } else {
        setError(null);
        setSuccess('Valid formula! Translates to: ' + data.sqlSnippet);
        return true;
      }
    } catch (err: any) {
      setError(err.message);
      setSuccess(null);
      return false;
    }
  };

  const handleSave = async () => {
    const isValid = await handleValidate();
    if (!isValid) return;

    if (!name.trim()) {
      setError('Please provide a name for the measure.');
      return;
    }

    const isEditing = !!initialMeasure?.id;
    const url = isEditing
      ? `${API_BASE}/dax/measure/${initialMeasure.id}`
      : `${API_BASE}/dax/measure`;
    const method = isEditing ? 'PUT' : 'POST';

    setIsSaving(true);
    try {
      const response = await fetchWithAuth(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sheet_id: sheetId, name, dax_formula: formula })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to save measure');
      }

      const data = await response.json();
      onMeasureSaved(data);
      onClose();
      // Reset state
      setName('');
      setFormula('');
      setError(null);
      setSuccess(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const insertColumn = (col: string) => {
    setFormula(prev => prev + `[${col}]`);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white">{initialMeasure ? 'Edit Measure' : 'Create Custom Measure'}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Main Editor Area */}
          <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Measure Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Total Profit Margin"
                className="w-full px-4 py-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            
            <div className="flex-1 flex flex-col min-h-[300px]">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                DAX Formula (e.g., SUM([Revenue]) - SUM([Cost]))
              </label>
              <div className="flex-1 border rounded-md overflow-hidden dark:border-slate-600">
                <Editor
                  height="100%"
                  defaultLanguage="javascript" // Monaco doesn't have DAX built-in, JS gives okay coloring
                  value={formula}
                  onChange={(val) => setFormula(val || '')}
                  theme="vs-dark"
                  options={{ minimap: { enabled: false }, fontSize: 14 }}
                />
              </div>
            </div>

            {/* Validation Feedback */}
            {error && <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm">{error}</div>}
            {success && <div className="p-3 bg-green-50 text-green-700 border border-green-200 rounded-md text-sm">{success}</div>}
          </div>

          {/* Sidebar - Available Columns */}
          <div className="w-64 border-l border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 flex flex-col">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-3 uppercase tracking-wider">Available Columns</h3>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {availableColumns.length === 0 ? (
                <p className="text-sm text-slate-500 italic">No columns found.</p>
              ) : (
                <ul className="space-y-1">
                  {availableColumns.map((col, idx) => (
                    <li key={idx}>
                      <button 
                        onClick={() => insertColumn(col)}
                        className="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-700 dark:text-slate-300 transition-colors"
                        title="Click to insert"
                      >
                        {col}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
          <button 
            onClick={handleValidate}
            className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            Validate Syntax
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Measure'}
          </button>
        </div>

      </div>
    </div>
  );
}
