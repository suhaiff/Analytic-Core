import React, { useState, useEffect, useRef } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
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

const DAX_FUNCTIONS = [
  { name: 'ADD', snippet: 'ADD([${1:ColumnName}], [${2:ColumnName}])', syntax: 'ADD([ColumnName], [ColumnName])' },
  { name: 'DIVIDE', snippet: 'DIVIDE([${1:Numerator}], [${2:Denominator}])', syntax: 'DIVIDE([Numerator], [Denominator])' },
  { name: 'MULTIPLY', snippet: 'MULTIPLY([${1:ColumnName}], [${2:ColumnName}])', syntax: 'MULTIPLY([ColumnName], [ColumnName])' },
  { name: 'SUBTRACT', snippet: 'SUBTRACT([${1:ColumnName}], [${2:ColumnName}])', syntax: 'SUBTRACT([ColumnName], [ColumnName])' },
  { name: 'SUM', snippet: 'SUM([${1:ColumnName}])', syntax: 'SUM([ColumnName])' },
  { name: 'AVERAGE', snippet: 'AVERAGE([${1:ColumnName}])', syntax: 'AVERAGE([ColumnName])' },
  { name: 'COUNT', snippet: 'COUNT([${1:ColumnName}])', syntax: 'COUNT([ColumnName])' },
  { name: 'DISTINCTCOUNT', snippet: 'DISTINCTCOUNT([${1:ColumnName}])', syntax: 'DISTINCTCOUNT([ColumnName])' },
  { name: 'MIN', snippet: 'MIN([${1:ColumnName}])', syntax: 'MIN([ColumnName])' },
  { name: 'MAX', snippet: 'MAX([${1:ColumnName}])', syntax: 'MAX([ColumnName])' },
  { name: 'MEDIAN', snippet: 'MEDIAN([${1:ColumnName}])', syntax: 'MEDIAN([ColumnName])' },
  { name: 'TOTALMTD', snippet: "TOTALMTD(SUM([${1:Sales Amount}]), [${2:Order Date}])", syntax: "TOTALMTD(SUM([Sales Amount]), [Order Date])" },
  { name: 'TOTALQTD', snippet: "TOTALQTD(SUM([${1:Sales}]), [${2:Order Date}])", syntax: "TOTALQTD(SUM([Sales]), [Order Date])" },
  { name: 'TOTALWTD', snippet: "TOTALWTD(SUM([${1:Sales}]), [${2:Order Date}])", syntax: "TOTALWTD(SUM([Sales]), [Order Date])" },
  { name: 'PREVIOUSYEAR', snippet: "PREVIOUSYEAR(SUM([${1:Sales Amount}]), [${2:Order Date}])", syntax: "PREVIOUSYEAR(SUM([Sales Amount]), [Order Date])" },
  { name: 'PREVIOUSQUARTER', snippet: "PREVIOUSQUARTER(SUM([${1:Sales Amount}]), [${2:Order Date}])", syntax: "PREVIOUSQUARTER(SUM([Sales Amount]), [Order Date])" },
  { name: 'PREVIOUSMONTH', snippet: "PREVIOUSMONTH(SUM([${1:Sales Amount}]), [${2:Order Date}])", syntax: "PREVIOUSMONTH(SUM([Sales Amount]), [Order Date])" },
  { name: 'SAMEPERIODLASTYEAR', snippet: "SAMEPERIODLASTYEAR(SUM([${1:Sales Amount}]), [${2:Order Date}])", syntax: "SAMEPERIODLASTYEAR(SUM([Sales Amount]), [Order Date])" },
  { name: 'DATEADD', snippet: "DATEADD(SUM([${1:Sales Amount}]), [${2:Order Date}], ${3:-1}, ${4:MONTH})", syntax: "DATEADD(SUM([Sales Amount]), [Order Date], -1, MONTH)" },
  { name: 'DATESBETWEEN', snippet: "DATESBETWEEN(SUM([${1:Sales Amount}]), [${2:Order Date}], \"${3:2024-01-01}\", \"${4:2024-06-30}\")", syntax: "DATESBETWEEN(SUM([Sales Amount]), [Order Date], \"2024-01-01\", \"2024-06-30\")" },
  { name: 'DATESINPERIOD', snippet: "DATESINPERIOD(SUM([${1:Sales Amount}]), [${2:Order Date}], \"${3:2024-01-01}\", ${4:90}, ${5:DAY})", syntax: "DATESINPERIOD(SUM([Sales Amount]), [Order Date], \"2024-01-01\", 90, DAY)" },
  { name: 'DATEDIFF', snippet: "DATEDIFF(MIN([${1:Order Date}]), MAX([${2:Order Date}]), ${3:MONTH})", syntax: "DATEDIFF(MIN([Order Date]), MAX([Order Date]), MONTH)" },
  { name: 'CALCULATE', snippet: "CALCULATE(SUM([${1:Sales Amount}]), [${2:Region}] = \"${3:West}\")", syntax: "CALCULATE(SUM([Sales Amount]), [Region] = \"West\")" }
];

const KNOWN_PLACEHOLDERS = [
  'ColumnName', 'Numerator', 'Denominator', 'Sales Amount', 'Sales', 
  'Order Date', 'Order ID', 'Table', 'Quantity', 'Region'
];

export default function CreateMeasureModal({ isOpen, onClose, sheetId, availableColumns, onMeasureSaved, initialMeasure }: CreateMeasureModalProps) {
  const [name, setName] = useState('');
  const [formula, setFormula] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'columns' | 'functions'>('columns');
  
  const editorRef = useRef<any>(null);
  const monaco = useMonaco();
  const [popover, setPopover] = useState<{ visible: boolean; top: number; left: number; text: string } | null>(null);

  useEffect(() => {
    if (monaco && isOpen) {
      monaco.languages.register({ id: 'dax' });
      
      const provider = monaco.languages.registerCompletionItemProvider('dax', {
        provideCompletionItems: (model, position) => {
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn
          };

          const suggestions = [
            ...DAX_FUNCTIONS.map(func => ({
              label: func.name,
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: func.snippet,
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: func.syntax,
              range
            })),
            ...availableColumns.map(col => ({
               label: `[${col}]`,
               kind: monaco.languages.CompletionItemKind.Variable,
               insertText: `[${col}]`,
               range
            }))
          ];
          return { suggestions: suggestions as any };
        }
      });

      return () => provider.dispose();
    }
  }, [monaco, availableColumns, isOpen]);

  useEffect(() => {
    if (isOpen && initialMeasure) {
      setName(initialMeasure.name || '');
      setFormula(initialMeasure.dax_formula || '');
      setError(null);
      setSuccess(null);
      setPopover(null);
    } else if (!isOpen) {
      setName('');
      setFormula('');
      setError(null);
      setSuccess(null);
      setPopover(null);
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
    if (editorRef.current) {
      const editor = editorRef.current;
      const position = editor.getPosition();
      editor.executeEdits('my-source', [{
        range: new monaco!.Range(position.lineNumber, position.column, position.lineNumber, position.column),
        text: `[${col}]`,
        forceMoveMarkers: true
      }]);
      editor.focus();
    } else {
      setFormula(prev => prev + `[${col}]`);
    }
  };

  const insertFunctionSnippet = (func: typeof DAX_FUNCTIONS[0]) => {
    if (editorRef.current && monaco) {
      const editor = editorRef.current;
      const position = editor.getPosition();
      
      // We must use monaco snippet controller to insert snippets
      const snippetController = editor.getContribution('snippetController2');
      if (snippetController) {
        snippetController.insert(func.snippet);
      }
      editor.focus();
    } else {
      // Fallback
      setFormula(prev => prev + func.syntax);
    }
  };

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    
    editor.onDidChangeCursorSelection((e: any) => {
      const selection = e.selection;
      const model = editor.getModel();
      if (!model) return;
      
      const text = model.getValueInRange(selection);
      
      if (text && KNOWN_PLACEHOLDERS.includes(text)) {
        const position = { lineNumber: selection.endLineNumber, column: selection.endColumn };
        const coords = editor.getScrolledVisiblePosition(position);
        if (coords) {
          setPopover({
            visible: true,
            top: coords.top + 30, // below cursor
            left: coords.left,
            text: text
          });
          return;
        }
      }
      setPopover(null);
    });
    
    // Hide popover on scroll or outside click could be added, but simple selection change handles most
    editor.onDidScrollChange(() => {
      setPopover(null);
    });
  };

  const handleReplacePlaceholder = (col: string) => {
    if (!editorRef.current) return;
    const editor = editorRef.current;
    const selection = editor.getSelection();
    editor.executeEdits('placeholder-replace', [{
      range: selection,
      text: col, // Monaco snippets usually place the placeholder inside brackets like [${1:ColumnName}], so we just replace the text with col name. Wait, the snippet has brackets?
      // Yes, snippets are like SUM([${1:ColumnName}]). The selected text will be `ColumnName`. We just need to replace it with `Total Sales`. Then it becomes `SUM([Total Sales])`. This is perfect.
      forceMoveMarkers: true
    }]);
    setPopover(null);
    editor.focus();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700">
        
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
            
            <div className="flex-1 flex flex-col min-h-[400px]">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                DAX Formula (Press Ctrl+Space for suggestions)
              </label>
              <div className="flex-1 border rounded-md overflow-hidden dark:border-slate-600 relative">
                <Editor
                  height="100%"
                  language="dax" 
                  value={formula}
                  onChange={(val) => setFormula(val || '')}
                  theme="vs-dark"
                  onMount={handleEditorDidMount}
                  options={{ minimap: { enabled: false }, fontSize: 14 }}
                />
                
                {/* Column Picker Popover */}
                {popover && popover.visible && (
                  <div 
                    className="absolute z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg rounded-md w-48 max-h-48 flex flex-col overflow-hidden"
                    style={{ top: popover.top, left: popover.left }}
                  >
                    <div className="px-3 py-2 bg-slate-100 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600 text-xs font-semibold text-slate-500 uppercase sticky top-0">
                      Pick Column
                    </div>
                    <div className="overflow-y-auto flex-1 custom-scrollbar">
                      {availableColumns.length === 0 ? (
                        <div className="p-3 text-xs text-slate-500">No columns found</div>
                      ) : (
                        availableColumns.map(col => (
                          <button
                            key={col}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-700 dark:text-slate-300 transition-colors"
                            onClick={() => handleReplacePlaceholder(col)}
                          >
                            {col}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Validation Feedback */}
            {error && <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm">{error}</div>}
            {success && <div className="p-3 bg-green-50 text-green-700 border border-green-200 rounded-md text-sm">{success}</div>}
          </div>

          {/* Sidebar - Helper Card */}
          <div className="w-80 border-l border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col">
            <div className="flex border-b border-slate-200 dark:border-slate-700">
              <button 
                className={`flex-1 py-3 text-sm font-semibold text-center transition-colors ${activeTab === 'columns' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                onClick={() => setActiveTab('columns')}
              >
                Columns
              </button>
              <button 
                className={`flex-1 py-3 text-sm font-semibold text-center transition-colors ${activeTab === 'functions' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                onClick={() => setActiveTab('functions')}
              >
                Functions
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {activeTab === 'columns' && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-800 dark:text-white mb-3 uppercase tracking-wider">Available Columns</h3>
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
              )}
              
              {activeTab === 'functions' && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-800 dark:text-white mb-3 uppercase tracking-wider">DAX Functions</h3>
                  <div className="space-y-2">
                    {DAX_FUNCTIONS.map((func, idx) => (
                      <button 
                        key={idx}
                        onClick={() => insertFunctionSnippet(func)}
                        className="w-full text-left p-2 rounded border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
                      >
                        <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {func.name}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                          {func.syntax}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
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
