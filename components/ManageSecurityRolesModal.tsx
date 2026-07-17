import React, { useState, useEffect, useCallback } from 'react';
import {
    X, Plus, Trash2, Shield, Save, AlertCircle, Loader2,
    ChevronDown, Edit3, Check, Copy
} from 'lucide-react';
import { useTheme } from '../ThemeContext';
import { getThemeClasses } from '../theme';
import { SecurityRole, RLSRule, RLSCondition, RLSLogic } from '../types';
import { securityRolesService } from '../services/securityRolesService';

// ── Constants ─────────────────────────────────────────────────────────────────

const CONDITIONS: { value: RLSCondition; label: string; noValue?: boolean }[] = [
    { value: 'equals',               label: 'Equals' },
    { value: 'not_equals',           label: 'Does not equal' },
    { value: 'contains',             label: 'Contains' },
    { value: 'not_contains',         label: 'Does not contain' },
    { value: 'starts_with',          label: 'Starts with' },
    { value: 'ends_with',            label: 'Ends with' },
    { value: 'greater_than',         label: 'Greater than' },
    { value: 'less_than',            label: 'Less than' },
    { value: 'greater_than_or_equal',label: '>= (greater or equal)' },
    { value: 'less_than_or_equal',   label: '<= (less or equal)' },
    { value: 'is_blank',             label: 'Is blank',     noValue: true },
    { value: 'is_not_blank',         label: 'Is not blank', noValue: true },
];

function newRule(): RLSRule {
    return { id: `rule_${Date.now()}_${Math.random().toString(36).slice(2)}`, column: '', condition: 'equals', value: '' };
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface ManageSecurityRolesModalProps {
    dashboardId: string;
    columns: string[];
    currentUserId: number;
    onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const ManageSecurityRolesModal: React.FC<ManageSecurityRolesModalProps> = ({
    dashboardId,
    columns,
    currentUserId,
    onClose,
}) => {
    const { theme } = useTheme();
    const colors = getThemeClasses(theme);
    const isDark = theme === 'dark';

    const [roles, setRoles] = useState<SecurityRole[]>([]);
    const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editingName, setEditingName] = useState(false);

    // Draft state for the currently selected role
    const [draftName, setDraftName] = useState('');
    const [draftDesc, setDraftDesc] = useState('');
    const [draftLogic, setDraftLogic] = useState<RLSLogic>('AND');
    const [draftRules, setDraftRules] = useState<RLSRule[]>([]);
    const [isDirty, setIsDirty] = useState(false);

    const selectedRole = roles.find(r => r.id === selectedRoleId) ?? null;

    // ── Load roles ──────────────────────────────────────────────────────────
    const loadRoles = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await securityRolesService.getRoles(dashboardId);
            setRoles(data);
            if (data.length > 0 && !selectedRoleId) {
                setSelectedRoleId(data[0].id);
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [dashboardId, selectedRoleId]);

    useEffect(() => { loadRoles(); }, [dashboardId]);

    // ── Sync draft from selected role ───────────────────────────────────────
    useEffect(() => {
        if (selectedRole) {
            setDraftName(selectedRole.name);
            setDraftDesc(selectedRole.description || '');
            setDraftLogic(selectedRole.logic || 'AND');
            setDraftRules(selectedRole.rules?.length ? [...selectedRole.rules] : [newRule()]);
            setIsDirty(false);
            setEditingName(false);
        } else {
            setDraftName('');
            setDraftDesc('');
            setDraftLogic('AND');
            setDraftRules([newRule()]);
            setIsDirty(false);
        }
    }, [selectedRoleId]);

    // ── Rule helpers ────────────────────────────────────────────────────────
    const updateRule = (id: string, patch: Partial<RLSRule>) => {
        setDraftRules(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
        setIsDirty(true);
    };

    const removeRule = (id: string) => {
        setDraftRules(prev => {
            const next = prev.filter(r => r.id !== id);
            return next.length ? next : [newRule()];
        });
        setIsDirty(true);
    };

    const addRule = () => {
        setDraftRules(prev => [...prev, newRule()]);
        setIsDirty(true);
    };

    // ── Create new role ─────────────────────────────────────────────────────
    const handleCreateRole = async () => {
        setSaving(true);
        setError(null);
        try {
            const role = await securityRolesService.createRole(dashboardId, {
                name: 'New Role',
                description: '',
                logic: 'AND',
                rules: [newRule()],
            }, currentUserId);
            setRoles(prev => [...prev, role]);
            setSelectedRoleId(role.id);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    // ── Save draft ──────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!selectedRoleId || !draftName.trim()) return;
        setSaving(true);
        setError(null);
        try {
            const updated = await securityRolesService.updateRole(dashboardId, selectedRoleId, {
                name: draftName.trim(),
                description: draftDesc.trim(),
                logic: draftLogic,
                rules: draftRules.filter(r => r.column), // strip empty rows
            });
            setRoles(prev => prev.map(r => r.id === updated.id ? updated : r));
            setIsDirty(false);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    // ── Delete role ─────────────────────────────────────────────────────────
    const handleDelete = async (roleId: string) => {
        if (!confirm('Delete this security role? All assignments for this role will also be removed.')) return;
        setSaving(true);
        setError(null);
        try {
            await securityRolesService.deleteRole(dashboardId, roleId);
            const remaining = roles.filter(r => r.id !== roleId);
            setRoles(remaining);
            setSelectedRoleId(remaining.length ? remaining[0].id : null);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    // ── Duplicate role ──────────────────────────────────────────────────────
    const handleDuplicate = async (role: SecurityRole) => {
        setSaving(true);
        setError(null);
        try {
            const duped = await securityRolesService.createRole(dashboardId, {
                name: `${role.name} (Copy)`,
                description: role.description || '',
                logic: role.logic,
                rules: role.rules.map(r => ({ ...r, id: `rule_${Date.now()}_${Math.random().toString(36).slice(2)}` })),
            }, currentUserId);
            setRoles(prev => [...prev, duped]);
            setSelectedRoleId(duped.id);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    // ── Shared styles ───────────────────────────────────────────────────────
    const panelBg    = isDark ? 'bg-slate-900'   : 'bg-white';
    const sideBg     = isDark ? 'bg-slate-950'   : 'bg-slate-50';
    const borderCol  = isDark ? 'border-slate-700' : 'border-slate-200';
    const inp        = `w-full px-3 py-2 rounded-lg text-sm font-medium outline-none border transition
        ${isDark ? 'bg-slate-800 border-slate-600 text-slate-100 focus:border-indigo-500 placeholder:text-slate-500'
                 : 'bg-white border-slate-200 text-slate-800 focus:border-indigo-400 placeholder:text-slate-400'}`;

    // ── Render ──────────────────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className={`relative w-full max-w-5xl h-[85vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden border
                ${panelBg} ${borderCol}`}>

                {/* ── Modal Header ─────────────────────────────────────── */}
                <div className={`flex items-center justify-between px-6 py-4 border-b flex-shrink-0 ${borderCol}`}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-indigo-500/15 border border-indigo-500/25">
                            <Shield className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className={`text-base font-bold ${colors.textPrimary}`}>Manage Security Roles</h2>
                            <p className={`text-xs ${colors.textMuted}`}>
                                Create roles with filter rules to restrict which rows each user sees.
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className={`p-2 rounded-xl ${colors.textMuted} hover:${colors.bgTertiary} transition`}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* ── Error Banner ──────────────────────────────────────── */}
                {error && (
                    <div className="px-6 py-2 flex items-center gap-2 bg-red-500/10 border-b border-red-500/20 text-red-400 text-sm flex-shrink-0">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {error}
                    </div>
                )}

                {/* ── Body: 3-column layout ─────────────────────────────── */}
                <div className="flex flex-1 overflow-hidden">

                    {/* ── LEFT: Roles list ──────────────────────────────── */}
                    <aside className={`w-52 flex-shrink-0 flex flex-col border-r overflow-hidden ${sideBg} ${borderCol}`}>
                        <div className={`px-3 py-3 border-b ${borderCol} flex items-center justify-between`}>
                            <span className={`text-xs font-bold uppercase tracking-wider ${colors.textMuted}`}>Roles</span>
                            <button
                                onClick={handleCreateRole}
                                disabled={saving}
                                title="New role"
                                className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition"
                            >
                                <Plus className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {loading ? (
                                <div className="flex justify-center py-6">
                                    <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                                </div>
                            ) : roles.length === 0 ? (
                                <div className={`text-center py-8 px-3 ${colors.textMuted}`}>
                                    <Shield className="w-7 h-7 mx-auto mb-2 opacity-30" />
                                    <p className="text-xs">No roles yet.</p>
                                    <p className="text-xs mt-1">Click + to create one.</p>
                                </div>
                            ) : (
                                roles.map(role => (
                                    <div
                                        key={role.id}
                                        onClick={() => {
                                            if (isDirty && selectedRoleId && !confirm('You have unsaved changes. Switch anyway?')) return;
                                            setSelectedRoleId(role.id);
                                        }}
                                        className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all
                                            ${selectedRoleId === role.id
                                                ? isDark ? 'bg-indigo-500/20 border border-indigo-500/40' : 'bg-indigo-50 border border-indigo-200'
                                                : isDark ? 'hover:bg-slate-800 border border-transparent' : 'hover:bg-slate-100 border border-transparent'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${selectedRoleId === role.id ? 'bg-indigo-400' : isDark ? 'bg-slate-600' : 'bg-slate-300'}`} />
                                            <span className={`text-xs font-semibold truncate ${selectedRoleId === role.id ? (isDark ? 'text-indigo-300' : 'text-indigo-700') : colors.textSecondary}`}>
                                                {role.name}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
                                            <button
                                                onClick={e => { e.stopPropagation(); handleDuplicate(role); }}
                                                title="Duplicate"
                                                className={`p-1 rounded transition ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}
                                            ><Copy className="w-3 h-3" /></button>
                                            <button
                                                onClick={e => { e.stopPropagation(); handleDelete(role.id); }}
                                                title="Delete"
                                                className={`p-1 rounded transition ${isDark ? 'hover:bg-red-900/30 text-slate-400 hover:text-red-400' : 'hover:bg-red-50 text-slate-400 hover:text-red-500'}`}
                                            ><Trash2 className="w-3 h-3" /></button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </aside>

                    {/* ── RIGHT: Rule editor ────────────────────────────── */}
                    {selectedRole || (!loading && roles.length === 0) ? (
                        <div className="flex-1 flex flex-col overflow-hidden">
                            {!selectedRole ? (
                                <div className={`flex-1 flex flex-col items-center justify-center gap-3 ${colors.textMuted}`}>
                                    <Shield className="w-10 h-10 opacity-20" />
                                    <p className="text-sm">Select a role from the left panel, or create a new one.</p>
                                </div>
                            ) : (
                                <>
                                    {/* Role name + description */}
                                    <div className={`px-6 py-4 border-b flex-shrink-0 space-y-3 ${borderCol}`}>
                                        {editingName ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    autoFocus
                                                    value={draftName}
                                                    onChange={e => { setDraftName(e.target.value); setIsDirty(true); }}
                                                    onBlur={() => setEditingName(false)}
                                                    onKeyDown={e => { if (e.key === 'Enter') setEditingName(false); }}
                                                    className={`${inp} text-base font-bold flex-1`}
                                                    placeholder="Role name..."
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3 group">
                                                <h3 className={`text-base font-bold ${colors.textPrimary}`}>{draftName || 'Untitled Role'}</h3>
                                                <button
                                                    onClick={() => setEditingName(true)}
                                                    className={`px-2 py-1 flex items-center gap-1.5 rounded transition ${
                                                        isDark 
                                                            ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                    }`}
                                                >
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                    <span className="text-xs font-semibold">Rename</span>
                                                </button>
                                                {isDirty && (
                                                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider ml-1">Unsaved</span>
                                                )}
                                            </div>
                                        )}
                                        <input
                                            value={draftDesc}
                                            onChange={e => { setDraftDesc(e.target.value); setIsDirty(true); }}
                                            className={`${inp} text-xs`}
                                            placeholder="Description (optional)..."
                                        />
                                    </div>

                                    {/* Logic toggle + Rules area */}
                                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                        {/* Show data if [All/Any] of these rules are true */}
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className={`text-sm font-medium ${colors.textSecondary}`}>Show data if</span>
                                            <div className={`flex rounded-lg overflow-hidden border ${borderCol}`}>
                                                {(['AND', 'OR'] as RLSLogic[]).map(opt => (
                                                    <button
                                                        key={opt}
                                                        onClick={() => { setDraftLogic(opt); setIsDirty(true); }}
                                                        className={`px-4 py-1.5 text-xs font-bold transition
                                                            ${draftLogic === opt
                                                                ? 'bg-indigo-600 text-white'
                                                                : isDark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-white text-slate-500 hover:text-slate-800'
                                                            }`}
                                                    >
                                                        {opt === 'AND' ? 'All' : 'Any'}
                                                    </button>
                                                ))}
                                            </div>
                                            <span className={`text-sm font-medium ${colors.textSecondary}`}>
                                                of these rules are true
                                            </span>
                                        </div>

                                        {/* Column header */}
                                        <div className={`grid grid-cols-[2fr_1.8fr_2fr_auto] gap-2 px-1 text-[10px] font-bold uppercase tracking-wider ${colors.textMuted}`}>
                                            <span>Column</span>
                                            <span>Condition</span>
                                            <span>Value</span>
                                            <span />
                                        </div>

                                        {/* Rules */}
                                        <div className="space-y-2">
                                            {draftRules.map((rule, idx) => {
                                                const condDef = CONDITIONS.find(c => c.value === rule.condition);
                                                const noValue = condDef?.noValue ?? false;
                                                return (
                                                    <div key={rule.id} className="grid grid-cols-[2fr_1.8fr_2fr_auto] gap-2 items-start">
                                                        {/* Column select */}
                                                        <div className="relative">
                                                            <select
                                                                value={rule.column}
                                                                onChange={e => updateRule(rule.id, { column: e.target.value })}
                                                                className={`${inp} appearance-none pr-7`}
                                                            >
                                                                <option value="">Select column…</option>
                                                                {columns.map(c => <option key={c} value={c}>{c}</option>)}
                                                            </select>
                                                            <ChevronDown className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${colors.textMuted}`} />
                                                        </div>
                                                        {/* Condition select */}
                                                        <div className="relative">
                                                            <select
                                                                value={rule.condition}
                                                                onChange={e => updateRule(rule.id, { condition: e.target.value as RLSCondition, value: '' })}
                                                                className={`${inp} appearance-none pr-7`}
                                                            >
                                                                {CONDITIONS.map(c => (
                                                                    <option key={c.value} value={c.value}>{c.label}</option>
                                                                ))}
                                                            </select>
                                                            <ChevronDown className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${colors.textMuted}`} />
                                                        </div>
                                                        {/* Value input */}
                                                        <input
                                                            type="text"
                                                            value={noValue ? '' : rule.value}
                                                            onChange={e => updateRule(rule.id, { value: e.target.value })}
                                                            disabled={noValue}
                                                            placeholder={noValue ? '(no value needed)' : 'Enter value…'}
                                                            className={`${inp} ${noValue ? 'opacity-40 cursor-not-allowed' : ''}`}
                                                        />
                                                        {/* Remove button */}
                                                        <button
                                                            onClick={() => removeRule(rule.id)}
                                                            className={`p-2 mt-0.5 rounded-lg transition
                                                                ${isDark ? 'text-slate-500 hover:text-red-400 hover:bg-red-900/20' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}`}
                                                            title="Remove rule"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Add rule button */}
                                        <button
                                            onClick={addRule}
                                            className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg border transition
                                                ${isDark ? 'border-slate-700 text-slate-400 hover:text-white hover:border-indigo-500 hover:bg-indigo-500/10'
                                                         : 'border-slate-200 text-slate-500 hover:text-indigo-700 hover:border-indigo-300 hover:bg-indigo-50'}`}
                                        >
                                            <Plus className="w-4 h-4" /> Add rule
                                        </button>

                                        {/* Info note */}
                                        <div className={`flex items-start gap-2 text-xs rounded-xl p-3 border
                                            ${isDark ? 'bg-indigo-500/5 border-indigo-500/15 text-indigo-300' : 'bg-indigo-50 border-indigo-100 text-indigo-700'}`}>
                                            <Shield className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                                            <span>
                                                Users assigned this role will only see rows where {draftLogic === 'AND' ? 'all' : 'any'} of the above rules match.
                                                Assign this role to users via the <strong>Share</strong> button on the dashboard.
                                            </span>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className={`flex items-center justify-between px-6 py-4 border-t flex-shrink-0 ${borderCol}`}>
                                        <span className={`text-xs ${colors.textMuted}`}>
                                            {draftRules.filter(r => r.column).length} active rule{draftRules.filter(r => r.column).length !== 1 ? 's' : ''}
                                        </span>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={onClose}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${colors.textMuted} hover:${colors.bgTertiary}`}
                                            >
                                                Close
                                            </button>
                                            <button
                                                onClick={handleSave}
                                                disabled={saving || !isDirty || !draftName.trim()}
                                                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold text-white transition shadow-lg
                                                    ${(saving || !isDirty || !draftName.trim())
                                                        ? 'bg-slate-600 opacity-50 cursor-not-allowed'
                                                        : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/30'}`}
                                            >
                                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                Save Role
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className={`flex-1 flex flex-col items-center justify-center gap-4 ${colors.textMuted}`}>
                            {loading
                                ? <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                                : (
                                    <>
                                        <Shield className="w-12 h-12 opacity-20" />
                                        <div className="text-center">
                                            <p className="text-sm font-semibold">No security roles yet</p>
                                            <p className="text-xs mt-1">Click <strong>+</strong> in the left panel to create your first role.</p>
                                        </div>
                                        <button
                                            onClick={handleCreateRole}
                                            disabled={saving}
                                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition shadow-lg shadow-indigo-900/30"
                                        >
                                            <Plus className="w-4 h-4" /> Create First Role
                                        </button>
                                    </>
                                )
                            }
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
