import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  ArrowRight, X, Home, ChevronRight, Plus, Trash2, Check,
  Link2, SkipForward, Info, Edit3, RefreshCw, GitBranch,
  Circle, ArrowLeftRight, Zap
} from 'lucide-react';
import { useTheme } from '../ThemeContext';
import { getThemeClasses } from '../theme';
import { DataModel, TableRelationship, CardinalityType, CrossFilterDirection, TableCardPosition } from '../types';

// ─── Types ──────────────────────────────────────────────────────────────────

interface TableInfo {
  id: string;
  name: string;
  columns: string[];
}

interface DataModellingProps {
  dataModel: DataModel;
  onComplete: (model: DataModel) => void;
  onBack: () => void;
  onHome: () => void;
}

interface DragState {
  tableId: string;
  startX: number;
  startY: number;
  origX: number;
  origY: number;
}

interface ConnectDrag {
  fromTable: string;
  fromColumn: string;
  currentX: number;
  currentY: number;
}

interface EditRelationship {
  rel: TableRelationship;
  isNew: boolean;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const CARD_WIDTH = 220;
const COL_HEIGHT = 28;
const CARD_HEADER = 48;
const MAX_COLS_VISIBLE = 12;

const CARDINALITY_LABELS: Record<CardinalityType, { from: string; to: string; label: string; color: string }> = {
  ONE_TO_ONE:   { from: '1', to: '1',  label: 'One to One',   color: '#6366f1' },
  ONE_TO_MANY:  { from: '1', to: '*',  label: 'One to Many',  color: '#8b5cf6' },
  MANY_TO_ONE:  { from: '*', to: '1',  label: 'Many to One',  color: '#06b6d4' },
  MANY_TO_MANY: { from: '*', to: '*',  label: 'Many to Many', color: '#f59e0b' },
};

// ─── Auto-detect helpers ─────────────────────────────────────────────────────

function normalizeColName(name: string): string {
  return name.toLowerCase().replace(/[_\-\s]/g, '').replace(/(id|key|code|no|num|number)$/, '');
}

function autoDetectRelationships(tables: TableInfo[]): TableRelationship[] {
  const relationships: TableRelationship[] = [];

  for (let i = 0; i < tables.length; i++) {
    for (let j = i + 1; j < tables.length; j++) {
      const tA = tables[i];
      const tB = tables[j];

      for (const colA of tA.columns) {
        for (const colB of tB.columns) {
          const normA = normalizeColName(colA);
          const normB = normalizeColName(colB);

          // Direct match or one is the normalized prefix of the other
          if (
            normA === normB ||
            normA === normalizeColName(tA.name) + normB ||
            normB === normalizeColName(tB.name) + normA ||
            colA.toLowerCase() === colB.toLowerCase() ||
            // Pattern: tableB's column name contains tableA's name (e.g., customer_id in orders)
            colB.toLowerCase().includes(normalizeColName(tA.name)) ||
            colA.toLowerCase().includes(normalizeColName(tB.name))
          ) {
            // Avoid duplicate
            const exists = relationships.some(
              r => (r.fromTable === tA.name && r.fromColumn === colA && r.toTable === tB.name && r.toColumn === colB) ||
                   (r.fromTable === tB.name && r.fromColumn === colB && r.toTable === tA.name && r.toColumn === colA)
            );
            if (!exists) {
              relationships.push({
                id: `auto_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                fromTable: tA.name,
                fromColumn: colA,
                toTable: tB.name,
                toColumn: colB,
                cardinality: 'ONE_TO_MANY',
                crossFilter: 'SINGLE',
                isActive: true,
              });
            }
          }
        }
      }
    }
  }

  return relationships;
}

// ─── Card position helper ────────────────────────────────────────────────────

function getCardHeight(cols: number): number {
  const visible = Math.min(cols, MAX_COLS_VISIBLE);
  return CARD_HEADER + visible * COL_HEIGHT + (cols > MAX_COLS_VISIBLE ? 28 : 8);
}

function getColumnPortY(cardY: number, colIndex: number): number {
  return cardY + CARD_HEADER + colIndex * COL_HEIGHT + COL_HEIGHT / 2;
}

function getColumnPortX(cardX: number, side: 'left' | 'right'): number {
  return side === 'left' ? cardX : cardX + CARD_WIDTH;
}

// ─── SVG Bezier line between two ports ───────────────────────────────────────

function BezierLine({
  x1, y1, x2, y2, color, label1, label2, onClick, isHovered, isDashed
}: {
  x1: number; y1: number; x2: number; y2: number;
  color: string; label1: string; label2: string;
  onClick?: () => void; isHovered?: boolean; isDashed?: boolean;
}) {
  const cx1 = x1 + Math.abs(x2 - x1) * 0.45;
  const cx2 = x2 - Math.abs(x2 - x1) * 0.45;
  const path = `M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`;

  return (
    <g onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      {/* Hit zone */}
      <path d={path} fill="none" stroke="transparent" strokeWidth={16} />
      {/* Line */}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={isHovered ? 2.5 : 1.8}
        strokeDasharray={isDashed ? '6 4' : undefined}
        opacity={isHovered ? 1 : 0.75}
        style={{ transition: 'all 0.2s ease' }}
      />
      {/* From label */}
      <text x={x1 + 8} y={y1 - 5} fill={color} fontSize={11} fontWeight="700" fontFamily="monospace">
        {label1}
      </text>
      {/* To label */}
      <text x={x2 - 8} y={y2 - 5} fill={color} fontSize={11} fontWeight="700" fontFamily="monospace" textAnchor="end">
        {label2}
      </text>
    </g>
  );
}

// ─── Edit / Create Relationship Modal ────────────────────────────────────────

function RelationshipModal({
  rel, tables, onSave, onClose, theme
}: {
  rel: Partial<TableRelationship>;
  tables: TableInfo[];
  onSave: (r: TableRelationship) => void;
  onClose: () => void;
  theme: 'dark' | 'light';
}) {
  const colors = getThemeClasses(theme);
  const [form, setForm] = useState<Partial<TableRelationship>>({ ...rel });

  const fromTableObj = tables.find(t => t.name === form.fromTable);
  const toTableObj   = tables.find(t => t.name === form.toTable);

  const canSave = form.fromTable && form.fromColumn && form.toTable && form.toColumn &&
                  form.fromTable !== form.toTable;

  const inp = `appearance-none w-full px-3 py-2 rounded-lg text-sm font-medium outline-none border transition
    ${theme === 'dark'
      ? 'bg-slate-800 border-slate-600 text-slate-100 focus:border-indigo-500'
      : 'bg-white border-slate-200 text-slate-800 focus:border-indigo-400'}`;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`w-full max-w-lg rounded-2xl shadow-2xl border overflow-hidden
        ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>

        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b
          ${theme === 'dark' ? 'border-slate-700' : 'border-slate-100'}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30">
              <Edit3 className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className={`font-bold text-base ${colors.textPrimary}`}>Edit Relationship</h2>
              <p className={`text-xs ${colors.textMuted}`}>Select tables and columns that are related.</p>
            </div>
          </div>
          <button onClick={onClose} className={`p-1.5 rounded-lg hover:${colors.bgTertiary} ${colors.textMuted}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* From Table */}
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${colors.textMuted}`}>From table</label>
            <select value={form.fromTable || ''} onChange={e => setForm(p => ({ ...p, fromTable: e.target.value, fromColumn: '' }))} className={inp}>
              <option value="">Select table…</option>
              {tables.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
            </select>
            {fromTableObj && (
              <div className={`mt-2 rounded-lg overflow-hidden border text-xs font-mono
                ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                <div className={`px-3 py-1.5 font-bold text-[10px] uppercase tracking-wider
                  ${theme === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                  {fromTableObj.columns.slice(0, 4).join('  ·  ')}
                  {fromTableObj.columns.length > 4 && `  · +${fromTableObj.columns.length - 4} more`}
                </div>
                <select value={form.fromColumn || ''} onChange={e => setForm(p => ({ ...p, fromColumn: e.target.value }))}
                  className={`${inp} rounded-none border-0 border-t ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                  <option value="">Select column…</option>
                  {fromTableObj.columns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* To Table */}
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${colors.textMuted}`}>To table</label>
            <select value={form.toTable || ''} onChange={e => setForm(p => ({ ...p, toTable: e.target.value, toColumn: '' }))} className={inp}>
              <option value="">Select table…</option>
              {tables.filter(t => t.name !== form.fromTable).map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
            </select>
            {toTableObj && (
              <div className={`mt-2 rounded-lg overflow-hidden border text-xs font-mono
                ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                <div className={`px-3 py-1.5 font-bold text-[10px] uppercase tracking-wider
                  ${theme === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                  {toTableObj.columns.slice(0, 4).join('  ·  ')}
                  {toTableObj.columns.length > 4 && `  · +${toTableObj.columns.length - 4} more`}
                </div>
                <select value={form.toColumn || ''} onChange={e => setForm(p => ({ ...p, toColumn: e.target.value }))}
                  className={`${inp} rounded-none border-0 border-t ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                  <option value="">Select column…</option>
                  {toTableObj.columns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Cardinality + Cross-filter */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${colors.textMuted}`}>Cardinality</label>
              <select value={form.cardinality || 'ONE_TO_MANY'} onChange={e => setForm(p => ({ ...p, cardinality: e.target.value as CardinalityType }))} className={inp}>
                {Object.entries(CARDINALITY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${colors.textMuted}`}>Cross-filter direction</label>
              <select value={form.crossFilter || 'SINGLE'} onChange={e => setForm(p => ({ ...p, crossFilter: e.target.value as CrossFilterDirection }))} className={inp}>
                <option value="SINGLE">Single</option>
                <option value="BOTH">Both</option>
              </select>
            </div>
          </div>

          {/* Active */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))}
              className={`w-5 h-5 rounded border flex items-center justify-center transition-all
                ${form.isActive !== false
                  ? 'bg-indigo-500 border-indigo-500'
                  : theme === 'dark' ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-300'}`}>
              {form.isActive !== false && <Check className="w-3.5 h-3.5 text-white" />}
            </div>
            <span className={`text-sm font-medium ${colors.textSecondary}`}>Make this relationship active</span>
          </label>
        </div>

        {/* Footer */}
        <div className={`flex justify-end gap-3 px-6 py-4 border-t ${theme === 'dark' ? 'border-slate-700' : 'border-slate-100'}`}>
          <button onClick={onClose}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${colors.textMuted} hover:${colors.bgTertiary}`}>
            Cancel
          </button>
          <button
            onClick={() => {
              if (!canSave) return;
              onSave({
                id: form.id || `rel_${Date.now()}`,
                fromTable: form.fromTable!,
                fromColumn: form.fromColumn!,
                toTable: form.toTable!,
                toColumn: form.toColumn!,
                cardinality: form.cardinality || 'ONE_TO_MANY',
                crossFilter: form.crossFilter || 'SINGLE',
                isActive: form.isActive !== false,
              });
            }}
            disabled={!canSave}
            className={`px-6 py-2 rounded-lg text-sm font-bold text-white transition shadow-lg
              ${canSave
                ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/30'
                : 'bg-slate-600 cursor-not-allowed opacity-50'}`}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export const DataModelling: React.FC<DataModellingProps> = ({ dataModel, onComplete, onBack, onHome }) => {
  const { theme } = useTheme();
  const colors = getThemeClasses(theme);
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const connectDragRef = useRef<ConnectDrag | null>(null);

  // ── Derive tables from dataModel ─────────────────────────────────────────
  const tables: TableInfo[] = useMemo(() => {
    // If dataModel already has modellingTables (from previous visit), use those
    if (dataModel.modellingTables && dataModel.modellingTables.length > 0) {
      return dataModel.modellingTables;
    }
    // Otherwise derive from tableConfigs + columns
    if (dataModel.tableConfigs && Object.keys(dataModel.tableConfigs).length > 1) {
      return Object.entries(dataModel.tableConfigs).map(([id, cfg]) => ({
        id,
        name: cfg.name,
        columns: dataModel.columns, // best approximation; all columns visible
      }));
    }
    // Single table fallback
    return [{
      id: dataModel.name,
      name: dataModel.name,
      columns: dataModel.columns,
    }];
  }, [dataModel]);

  // ── Card positions ────────────────────────────────────────────────────────
  const [positions, setPositions] = useState<{ [tableName: string]: TableCardPosition }>(() => {
    if (dataModel.tablePositions && Object.keys(dataModel.tablePositions).length > 0) {
      return dataModel.tablePositions;
    }
    // Auto-layout: cascade
    const pos: { [k: string]: TableCardPosition } = {};
    tables.forEach((t, i) => {
      const cols = Math.floor(Math.sqrt(tables.length));
      const row = Math.floor(i / Math.max(cols, 1));
      const col = i % Math.max(cols, 1);
      pos[t.name] = { x: 80 + col * (CARD_WIDTH + 100), y: 80 + row * 320 };
    });
    return pos;
  });

  // ── Relationships ─────────────────────────────────────────────────────────
  const [relationships, setRelationships] = useState<TableRelationship[]>(() => {
    if (dataModel.relationships && dataModel.relationships.length > 0) {
      return dataModel.relationships;
    }
    // Auto-detect
    return autoDetectRelationships(tables);
  });

  // ── Dragging a card ───────────────────────────────────────────────────────
  const [dragging, setDragging] = useState<DragState | null>(null);

  const startDragCard = useCallback((e: React.MouseEvent, tableName: string) => {
    e.preventDefault();
    e.stopPropagation();
    const pos = positions[tableName] || { x: 0, y: 0 };
    setDragging({
      tableId: tableName,
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y,
    });
  }, [positions]);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - dragging.startX;
      const dy = e.clientY - dragging.startY;
      setPositions(prev => ({
        ...prev,
        [dragging.tableId]: {
          x: Math.max(0, dragging.origX + dx),
          y: Math.max(0, dragging.origY + dy),
        }
      }));
    };
    const onUp = () => setDragging(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [dragging]);

  // ── Canvas zoom/pan ───────────────────────────────────────────────────────
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

  const onCanvasMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-card]')) return;
    if ((e.target as HTMLElement).closest('[data-port]')) return;
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY, ox: panOffset.x, oy: panOffset.y };
  };

  useEffect(() => {
    if (!isPanning) return;
    const onMove = (e: MouseEvent) => {
      setPanOffset({
        x: panStart.current.ox + (e.clientX - panStart.current.x),
        y: panStart.current.oy + (e.clientY - panStart.current.y),
      });
    };
    const onUp = () => setIsPanning(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [isPanning]);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.min(2, Math.max(0.3, z - e.deltaY * 0.001)));
  };

  // ── Connect-drag (drawing a new relationship by dragging column port) ─────
  const [connectDrag, setConnectDrag] = useState<ConnectDrag | null>(null);

  const startConnect = useCallback((e: React.MouseEvent, tableName: string, col: string) => {
    e.preventDefault();
    e.stopPropagation();
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;
    const rawX = (e.clientX - canvasRect.left - panOffset.x) / zoom;
    const rawY = (e.clientY - canvasRect.top - panOffset.y) / zoom;
    const drag = {
      fromTable: tableName,
      fromColumn: col,
      currentX: rawX,
      currentY: rawY,
    };
    connectDragRef.current = drag;
    setConnectDrag(drag);
  }, [panOffset, zoom]);

  useEffect(() => {
    if (!connectDrag) return;
    const onMove = (e: MouseEvent) => {
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (!canvasRect) return;
      const rawX = (e.clientX - canvasRect.left - panOffset.x) / zoom;
      const rawY = (e.clientY - canvasRect.top - panOffset.y) / zoom;
      setConnectDrag(prev => prev ? { ...prev, currentX: rawX, currentY: rawY } : null);
    };
    const onUp = () => { setConnectDrag(null); connectDragRef.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [connectDrag, panOffset, zoom]);

  const handleColumnDrop = useCallback((toTable: string, toColumn: string) => {
    if (!connectDrag) return;
    if (connectDrag.fromTable === toTable && connectDrag.fromColumn === toColumn) return;
    if (connectDrag.fromTable === toTable) return; // same table
    const exists = relationships.some(
      r => (r.fromTable === connectDrag.fromTable && r.fromColumn === connectDrag.fromColumn &&
            r.toTable === toTable && r.toColumn === toColumn) ||
           (r.fromTable === toTable && r.fromColumn === toColumn &&
            r.toTable === connectDrag.fromTable && r.toColumn === connectDrag.fromColumn)
    );
    if (exists) { setConnectDrag(null); return; }

    const newRel: TableRelationship = {
      id: `rel_${Date.now()}`,
      fromTable: connectDrag.fromTable,
      fromColumn: connectDrag.fromColumn,
      toTable,
      toColumn,
      cardinality: 'ONE_TO_MANY',
      crossFilter: 'SINGLE',
      isActive: true,
    };
    setRelationships(prev => [...prev, newRel]);
    setEditingRel({ rel: newRel, isNew: false });
    setConnectDrag(null);
  }, [connectDrag, relationships]);

  // ── Relationship hover / edit ─────────────────────────────────────────────
  const [hoveredRelId, setHoveredRelId] = useState<string | null>(null);
  const [editingRel, setEditingRel] = useState<EditRelationship | null>(null);
  const [newRelDraft, setNewRelDraft] = useState<Partial<TableRelationship> | null>(null);


  // ── Compute canvas dimensions ─────────────────────────────────────────────
  const canvasW = useMemo(() => {
    const maxX = Math.max(...Object.values(positions).map(p => p.x + CARD_WIDTH + 120), 1200);
    return maxX;
  }, [positions]);

  const canvasH = useMemo(() => {
    const maxY = Math.max(...tables.map(t => {
      const pos = positions[t.name] || { x: 0, y: 0 };
      return pos.y + getCardHeight(t.columns.length) + 120;
    }), 800);
    return maxY;
  }, [positions, tables]);

  // ── Compute line endpoints for each relationship ──────────────────────────
  const lineData = useMemo(() => {
    return relationships.map(rel => {
      const fromPos = positions[rel.fromTable];
      const toPos   = positions[rel.toTable];
      if (!fromPos || !toPos) return null;

      const fromTable = tables.find(t => t.name === rel.fromTable);
      const toTable   = tables.find(t => t.name === rel.toTable);
      if (!fromTable || !toTable) return null;

      const fromColIdx = fromTable.columns.indexOf(rel.fromColumn);
      const toColIdx   = toTable.columns.indexOf(rel.toColumn);
      if (fromColIdx < 0 || toColIdx < 0) return null;

      const fromIsLeft = fromPos.x > toPos.x;
      const x1 = getColumnPortX(fromPos.x, fromIsLeft ? 'left' : 'right');
      const y1 = getColumnPortY(fromPos.y, fromColIdx);
      const x2 = getColumnPortX(toPos.x, fromIsLeft ? 'right' : 'left');
      const y2 = getColumnPortY(toPos.y, toColIdx);

      const card = CARDINALITY_LABELS[rel.cardinality];

      return { rel, x1, y1, x2, y2, color: card.color, label1: card.from, label2: card.to };
    }).filter(Boolean) as { rel: TableRelationship; x1: number; y1: number; x2: number; y2: number; color: string; label1: string; label2: string }[];
  }, [relationships, positions, tables]);

  // ── Finalize ──────────────────────────────────────────────────────────────
  const handleComplete = () => {
    let mergedData = [...(tables[0]?.data || dataModel.data || [])];
    let mergedColumns = [...(tables[0]?.columns || dataModel.columns || [])];

    if (relationships.length > 0 && tables.length > 0) {
      const baseTable = tables[0];
      
      // 1. Prefix base table
      mergedData = baseTable.data.map(row => {
        const newRow: any = { ...row };
        baseTable.columns.forEach(col => {
          newRow[`${baseTable.name}.${col}`] = row[col];
        });
        return newRow;
      });
      mergedColumns = baseTable.columns.map(c => `${baseTable.name}.${c}`);
      
      const joinedTables = new Set([baseTable.name]);
      let relationshipsToProcess = [...relationships];
      let iterations = 0;

      // Iteratively join tables that are connected to the already joined tables (handles Star schema)
      while (relationshipsToProcess.length > 0 && iterations < 10) {
        iterations++;
        const currentRels = [...relationshipsToProcess];
        relationshipsToProcess = [];

        for (const rel of currentRels) {
          const isFromJoined = joinedTables.has(rel.fromTable);
          const isToJoined = joinedTables.has(rel.toTable);

          if (isFromJoined && !isToJoined) {
             const toTable = tables.find(t => t.name === rel.toTable);
             if (toTable) {
                const rightMap = new Map<string, any[]>();
                 toTable.data.forEach(row => {
                    const key = String(row[rel.toColumn]);
                    if (!rightMap.has(key)) rightMap.set(key, []);
                    rightMap.get(key)!.push(row);
                 });

                 mergedData = mergedData.flatMap(row => {
                    const joinKey = String(row[`${rel.fromTable}.${rel.fromColumn}`] ?? row[rel.fromColumn]);
                    const matches = rightMap.get(joinKey);
                    
                    if (!matches || matches.length === 0) {
                       const newRow = { ...row };
                       toTable.columns.forEach(col => {
                          newRow[`${toTable.name}.${col}`] = null;
                          newRow[col] = null;
                       });
                       return [newRow];
                    }

                    return matches.map(match => {
                       const newRow = { ...row };
                       toTable.columns.forEach(col => {
                          const val = match[col];
                          newRow[`${toTable.name}.${col}`] = val;
                          newRow[col] = val; // fallback for AI processing un-prefixed
                       });
                       return newRow;
                    });
                 });
                toTable.columns.forEach(col => mergedColumns.push(`${toTable.name}.${col}`));
                joinedTables.add(toTable.name);
             }
          } else if (isToJoined && !isFromJoined) {
             const fromTable = tables.find(t => t.name === rel.fromTable);
             if (fromTable) {
                const rightMap = new Map<string, any[]>();
                 fromTable.data.forEach(row => {
                    const key = String(row[rel.fromColumn]);
                    if (!rightMap.has(key)) rightMap.set(key, []);
                    rightMap.get(key)!.push(row);
                 });

                 mergedData = mergedData.flatMap(row => {
                    const joinKey = String(row[`${rel.toTable}.${rel.toColumn}`] ?? row[rel.toColumn]);
                    const matches = rightMap.get(joinKey);
                    
                    if (!matches || matches.length === 0) {
                       const newRow = { ...row };
                       fromTable.columns.forEach(col => {
                          newRow[`${fromTable.name}.${col}`] = null;
                          newRow[col] = null;
                       });
                       return [newRow];
                    }

                    return matches.map(match => {
                       const newRow = { ...row };
                       fromTable.columns.forEach(col => {
                          const val = match[col];
                          newRow[`${fromTable.name}.${col}`] = val;
                          newRow[col] = val;
                       });
                       return newRow;
                    });
                 });
                fromTable.columns.forEach(col => mergedColumns.push(`${fromTable.name}.${col}`));
                joinedTables.add(fromTable.name);
             }
          } else if (!isFromJoined && !isToJoined) {
             relationshipsToProcess.push(rel);
          }
        }
      }
      mergedColumns = Array.from(new Set(mergedColumns));
    }

    const enriched: DataModel = {
      ...dataModel,
      data: mergedData,
      columns: mergedColumns,
      relationships,
      tablePositions: positions,
      modellingTables: tables,
    };
    onComplete(enriched);
  };


  const handleSkip = () => {
    onComplete(dataModel);
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  const isDark = theme === 'dark';

  return (
    <div className={`flex flex-col h-screen ${colors.bgPrimary} ${colors.textSecondary}`}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className={`${isDark ? 'bg-slate-900/70' : 'bg-white/90'} glass-effect border-b ${colors.borderPrimary}
        px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-20 gap-3`}>

        {/* Left */}
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onHome}
            className={`p-1.5 rounded-lg hover:${colors.bgTertiary} ${colors.textMuted} hover:${colors.textPrimary} transition flex-shrink-0`}
            title="Go Home">
            <Home className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <div className={`w-px h-6 ${colors.borderPrimary} hidden sm:block flex-shrink-0`} />

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs font-medium flex-wrap">
            <span className={colors.textMuted}>Data Config</span>
            <ChevronRight className={`w-3.5 h-3.5 ${colors.textMuted} flex-shrink-0`} />
            <span className="flex items-center gap-1.5">
              <div className="p-1 rounded-md bg-violet-500/20 border border-violet-500/30">
                <GitBranch className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <span className={`font-bold ${isDark ? 'text-violet-300' : 'text-violet-700'}`}>
                Data Modelling
              </span>
            </span>
            <ChevronRight className={`w-3.5 h-3.5 ${colors.textMuted} flex-shrink-0`} />
            <span className={colors.textMuted}>Chart Builder</span>
          </div>
        </div>

        {/* Center info */}
        <div className="hidden md:flex items-center gap-3 text-xs">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border
            ${isDark ? 'bg-slate-800/60 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
            <Circle className="w-3 h-3 text-violet-400 fill-violet-400" />
            <span>{tables.length} table{tables.length !== 1 ? 's' : ''}</span>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border
            ${isDark ? 'bg-slate-800/60 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
            <Link2 className="w-3 h-3 text-indigo-400" />
            <span>{relationships.length} relationship{relationships.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Zoom controls */}
          <div className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg border
            ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
            <button onClick={() => setZoom(z => Math.max(0.3, z - 0.1))}
              className={`w-6 h-6 flex items-center justify-center rounded text-sm font-bold ${colors.textMuted} hover:${colors.textPrimary} transition`}>−</button>
            <span className={`text-xs font-bold w-10 text-center ${colors.textMuted}`}>{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(2, z + 0.1))}
              className={`w-6 h-6 flex items-center justify-center rounded text-sm font-bold ${colors.textMuted} hover:${colors.textPrimary} transition`}>+</button>
          </div>

          <button onClick={() => setNewRelDraft({ cardinality: 'ONE_TO_MANY', crossFilter: 'SINGLE', isActive: true })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition
              ${isDark ? 'bg-violet-500/10 border-violet-500/30 text-violet-400 hover:bg-violet-500/20' : 'bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100'}`}>
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Relationship</span>
          </button>

          <button onClick={handleSkip}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition
              ${colors.textMuted} hover:${colors.textPrimary} hover:${colors.bgTertiary}`}>
            <SkipForward className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Skip</span>
          </button>

          <button onClick={handleComplete}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs sm:text-sm font-bold transition shadow-lg shadow-indigo-900/20">
            <span>Continue to Builder</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Main Layout: Canvas + Sidebar ──────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Canvas Area */}
        <div
          ref={canvasRef}
          className="flex-1 overflow-hidden relative"
          style={{ cursor: isPanning ? 'grabbing' : connectDrag ? 'crosshair' : 'grab' }}
          onMouseDown={onCanvasMouseDown}
          onWheel={onWheel}
        >
          {/* Dot-grid background */}
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle, ${isDark ? '#334155' : '#cbd5e1'} 1px, transparent 1px)`,
            backgroundSize: '28px 28px',
          }} />

          {/* Tip banner */}
          {tables.length > 1 && relationships.length === 0 && (
            <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-medium
              ${isDark ? 'bg-violet-900/40 border-violet-500/30 text-violet-300' : 'bg-violet-50 border-violet-200 text-violet-700'}`}>
              <Info className="w-3.5 h-3.5 flex-shrink-0" />
              Drag from a column dot to another table's column to create a relationship
            </div>
          )}

          {/* Transform container */}
          <div
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              width: canvasW,
              height: canvasH,
              position: 'absolute',
            }}
          >
            {/* SVG for lines */}
            <svg
              ref={svgRef}
              width={canvasW}
              height={canvasH}
              style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', overflow: 'visible' }}
            >
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                  <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>

              {/* Relationship lines */}
              {lineData.map(ld => (
                <BezierLine
                  key={ld.rel.id}
                  x1={ld.x1} y1={ld.y1} x2={ld.x2} y2={ld.y2}
                  color={ld.color}
                  label1={ld.label1} label2={ld.label2}
                  isHovered={hoveredRelId === ld.rel.id}
                  isDashed={!ld.rel.isActive}
                  onClick={() => setEditingRel({ rel: ld.rel, isNew: false })}
                />
              ))}

              {/* Live connect-drag line */}
              {connectDrag && (() => {
                const tbl = tables.find(t => t.name === connectDrag.fromTable);
                const fromPos = positions[connectDrag.fromTable];
                if (!tbl || !fromPos) return null;
                const colIdx = tbl.columns.indexOf(connectDrag.fromColumn);
                const x1 = fromPos.x + CARD_WIDTH;
                const y1 = getColumnPortY(fromPos.y, colIdx);
                return (
                  <BezierLine
                    x1={x1} y1={y1}
                    x2={connectDrag.currentX} y2={connectDrag.currentY}
                    color="#6366f1" label1="?" label2="?"
                    isDashed
                  />
                );
              })()}
            </svg>

            {/* Table Cards */}
            {tables.map(table => {
              const pos = positions[table.name] || { x: 80, y: 80 };
              const cardH = getCardHeight(table.columns.length);
              const hasRelationship = (col: string) =>
                relationships.some(r =>
                  (r.fromTable === table.name && r.fromColumn === col) ||
                  (r.toTable === table.name && r.toColumn === col)
                );

              return (
                <div
                  key={table.id}
                  data-card="true"
                  style={{
                    position: 'absolute',
                    left: pos.x,
                    top: pos.y,
                    width: CARD_WIDTH,
                    height: cardH,
                    userSelect: 'none',
                  }}
                  className={`rounded-xl overflow-hidden shadow-2xl border transition-shadow
                    ${isDark ? 'border-slate-600/60 shadow-black/40' : 'border-slate-200 shadow-slate-300/50'}
                    ${dragging?.tableId === table.name ? 'shadow-indigo-500/30 border-indigo-500/40' : ''}`}
                >
                  {/* Card Header — drag handle */}
                  <div
                    className={`flex items-center justify-between px-3 py-2.5 cursor-grab active:cursor-grabbing select-none
                      ${isDark
                        ? 'bg-gradient-to-r from-violet-900/80 to-indigo-900/80 border-b border-slate-700/60'
                        : 'bg-gradient-to-r from-violet-600 to-indigo-600 border-b border-violet-700/30'}`}
                    onMouseDown={e => startDragCard(e, table.name)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-white/10' : 'bg-white/20'}`}>
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M3 3h18v4H3zm0 7h18v4H3zm0 7h18v4H3z"/>
                        </svg>
                      </div>
                      <span className="text-white text-xs font-bold truncate" title={table.name}>{table.name}</span>
                    </div>
                    <span className={`text-[10px] font-medium flex-shrink-0 ${isDark ? 'text-white/50' : 'text-white/70'}`}>
                      {table.columns.length} cols
                    </span>
                  </div>

                  {/* Columns */}
                  <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} overflow-hidden`}
                    style={{ height: cardH - CARD_HEADER }}>
                    {table.columns.slice(0, MAX_COLS_VISIBLE).map((col, ci) => {
                      const linked = hasRelationship(col);
                      return (
                        <div
                          key={col}
                          className={`group flex items-center justify-between px-2.5 transition-colors select-none
                            ${isDark
                              ? linked ? 'bg-indigo-900/20 hover:bg-indigo-900/30' : 'hover:bg-slate-700/50'
                              : linked ? 'bg-indigo-50 hover:bg-indigo-100/80' : 'hover:bg-slate-50'}`}
                          style={{ height: COL_HEIGHT }}
                          onMouseUp={() => handleColumnDrop(table.name, col)}
                        >
                          <span className={`text-[11px] font-medium truncate flex-1
                            ${linked
                              ? isDark ? 'text-indigo-300' : 'text-indigo-700'
                              : colors.textSecondary}`}
                            title={col}>
                            {col}
                          </span>

                          {/* Port dot — drag to connect */}
                          <div
                            data-port="true"
                            onMouseDown={e => startConnect(e, table.name, col)}
                            title={`Drag to connect "${col}" to another table`}
                            style={{ pointerEvents: 'all' }}
                            className={`w-3.5 h-3.5 rounded-full flex-shrink-0 cursor-crosshair ml-1 transition-all
                              ${linked
                                ? isDark ? 'bg-indigo-400 opacity-100' : 'bg-indigo-500 opacity-100'
                                : isDark ? 'bg-slate-600 group-hover:bg-indigo-500 opacity-0 group-hover:opacity-100'
                                         : 'bg-slate-300 group-hover:bg-indigo-400 opacity-0 group-hover:opacity-100'}`}
                          />
                        </div>
                      );
                    })}
                    {table.columns.length > MAX_COLS_VISIBLE && (
                      <div className={`px-3 text-[10px] font-medium ${colors.textMuted} flex items-center`}
                        style={{ height: 28 }}>
                        +{table.columns.length - MAX_COLS_VISIBLE} more columns
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Zoom hint */}
          <div className={`absolute bottom-4 left-4 text-[10px] ${colors.textMuted} hidden sm:block`}>
            Scroll to zoom · Drag canvas to pan · Drag column dot to connect
          </div>

          {/* Fit button */}
          <button
            onClick={() => { setZoom(1); setPanOffset({ x: 0, y: 0 }); }}
            className={`absolute bottom-4 right-4 p-2 rounded-lg border transition
              ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
            title="Reset view">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* ── Relationship Sidebar ─────────────────────────────────────── */}
        <aside className={`w-72 flex-shrink-0 flex flex-col border-l overflow-hidden
          ${isDark ? 'bg-slate-900/80 border-slate-700' : 'bg-white border-slate-200'}`}>

          {/* Sidebar header */}
          <div className={`px-4 py-3 border-b flex items-center justify-between
            ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-indigo-400" />
              <span className={`text-sm font-bold ${colors.textPrimary}`}>Relationships</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold
                ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
                {relationships.length}
              </span>
            </div>
            <button
              onClick={() => setNewRelDraft({ cardinality: 'ONE_TO_MANY', crossFilter: 'SINGLE', isActive: true })}
              className={`p-1.5 rounded-lg transition
                ${isDark ? 'hover:bg-slate-700 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'}`}
              title="Add relationship">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Relationship list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {relationships.length === 0 && (
              <div className={`text-center py-8 ${colors.textMuted}`}>
                <Link2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No relationships yet.</p>
                <p className="text-xs mt-1">Drag a column dot to another table to connect.</p>
              </div>
            )}
            {relationships.map(rel => {
              const card = CARDINALITY_LABELS[rel.cardinality];
              return (
                <div
                  key={rel.id}
                  onMouseEnter={() => setHoveredRelId(rel.id)}
                  onMouseLeave={() => setHoveredRelId(null)}
                  className={`group rounded-xl border p-3 transition-all cursor-pointer
                    ${isDark
                      ? hoveredRelId === rel.id
                        ? 'bg-slate-800 border-indigo-500/40'
                        : 'bg-slate-800/50 border-slate-700/60 hover:border-slate-600'
                      : hoveredRelId === rel.id
                        ? 'bg-indigo-50 border-indigo-200'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}
                  onClick={() => setEditingRel({ rel, isNew: false })}
                >
                  {/* From */}
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0`} style={{ background: card.color }} />
                    <span className={`text-[11px] font-bold truncate ${colors.textPrimary}`}>{rel.fromTable}</span>
                    <span className={`text-[10px] truncate ${colors.textMuted}`}>· {rel.fromColumn}</span>
                  </div>

                  {/* Line */}
                  <div className="flex items-center gap-2 ml-1 mb-1.5">
                    <div className={`w-px h-5 flex-shrink-0 rounded`} style={{ background: card.color, opacity: 0.5 }} />
                    <div className="flex items-center gap-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded`}
                        style={{ background: card.color + '22', color: card.color }}>
                        {card.from}:{card.to}
                      </span>
                      <span className={`text-[10px] ${colors.textMuted}`}>{card.label}</span>
                      {rel.crossFilter === 'BOTH' && (
                        <ArrowLeftRight className="w-3 h-3" style={{ color: card.color }} title="Both directions" />
                      )}
                    </div>
                  </div>

                  {/* To */}
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0`} style={{ background: card.color }} />
                    <span className={`text-[11px] font-bold truncate ${colors.textPrimary}`}>{rel.toTable}</span>
                    <span className={`text-[10px] truncate ${colors.textMuted}`}>· {rel.toColumn}</span>
                  </div>

                  {/* Actions */}
                  <div className={`flex items-center justify-between mt-2 pt-2 border-t
                    ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                    <div className="flex items-center gap-1.5">
                      {rel.isActive
                        ? <Zap className="w-3 h-3 text-emerald-400" />
                        : <Zap className={`w-3 h-3 ${colors.textMuted}`} />}
                      <span className={`text-[10px] font-medium ${rel.isActive ? 'text-emerald-400' : colors.textMuted}`}>
                        {rel.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={e => { e.stopPropagation(); setEditingRel({ rel, isNew: false }); }}
                        className={`p-1 rounded transition ${isDark ? 'hover:bg-slate-700 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500'}`}
                        title="Edit">
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); setRelationships(prev => prev.filter(r => r.id !== rel.id)); }}
                        className={`p-1 rounded transition ${isDark ? 'hover:bg-red-900/30 text-slate-400 hover:text-red-400' : 'hover:bg-red-50 text-slate-500 hover:text-red-500'}`}
                        title="Delete">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sidebar info footer */}
          <div className={`px-4 py-3 border-t text-[10px] leading-relaxed ${colors.textMuted}
            ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
            <p className="font-semibold mb-0.5">Cardinality types:</p>
            <p>1:1 · One to One</p>
            <p>1:* · One to Many</p>
            <p>*:1 · Many to One</p>
            <p>*:* · Many to Many</p>
          </div>
        </aside>
      </div>

      {/* ── Edit Relationship Modal ────────────────────────────────────── */}
      {editingRel && (
        <RelationshipModal
          rel={editingRel.rel}
          tables={tables}
          theme={theme}
          onClose={() => setEditingRel(null)}
          onSave={updated => {
            setRelationships(prev => prev.map(r => r.id === updated.id ? updated : r));
            setEditingRel(null);
          }}
        />
      )}

      {/* ── New Relationship Modal ─────────────────────────────────────── */}
      {newRelDraft && (
        <RelationshipModal
          rel={newRelDraft}
          tables={tables}
          theme={theme}
          onClose={() => setNewRelDraft(null)}
          onSave={newRel => {
            setRelationships(prev => [...prev, newRel]);
            setNewRelDraft(null);
          }}
        />
      )}
    </div>
  );
};
