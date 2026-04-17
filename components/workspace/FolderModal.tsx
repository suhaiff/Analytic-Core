import React, { useState, useEffect, useRef } from 'react';
import { X, Folder, Users, Check, ChevronDown, Loader2, Plus, UserPlus, Trash2, Shield, Eye, Edit3, Settings } from 'lucide-react';
import { WorkspaceFolder, User, WorkspaceGroup, AccessLevel } from '../../types';
import { useTheme } from '../../ThemeContext';
import { getThemeClasses } from '../../theme';
import { workspaceService } from '../../services/workspaceService';

interface FolderModalProps {
  mode: 'create' | 'edit';
  existingFolder?: WorkspaceFolder;
  currentUser: User;
  allUsers: User[];
  onSave: (
    name: string, 
    accessUsers: { id: number; level: AccessLevel }[], 
    accessGroups: { id: string; level: AccessLevel }[]
  ) => Promise<void>;
  onClose: () => void;
}

export const FolderModal: React.FC<FolderModalProps> = ({
  mode,
  existingFolder,
  currentUser,
  allUsers,
  onSave,
  onClose
}) => {
  const { theme } = useTheme();
  const colors = getThemeClasses(theme);

  const [name, setName] = useState(existingFolder?.name || '');
  
  // Maps to track levels
  const [userLevels, setUserLevels] = useState<Record<number, AccessLevel>>(() => {
    const map: Record<number, AccessLevel> = {};
    if (existingFolder?.access_users) {
      existingFolder.access_users.forEach(u => map[u.id] = u.level || AccessLevel.VIEWER);
    }
    return map;
  });

  const [groupLevels, setGroupLevels] = useState<Record<string, AccessLevel>>(() => {
    const map: Record<string, AccessLevel> = {};
    if (existingFolder?.access_groups) {
      existingFolder.access_groups.forEach(g => map[g.id] = g.level || AccessLevel.VIEWER);
    }
    return map;
  });

  const [selectedUserIds, setSelectedUserIds] = useState<number[]>(() => Object.keys(userLevels).map(Number));
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(() => Object.keys(groupLevels));
  
  const [availableGroups, setAvailableGroups] = useState<WorkspaceGroup[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  
  // Group creation state
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupMemberIds, setNewGroupMemberIds] = useState<number[]>([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const groups = await workspaceService.getGroups(currentUser.id);
        setAvailableGroups(groups);
      } catch (err) {
        console.error('Failed to load groups:', err);
      }
    };
    loadGroups();
  }, [currentUser.id]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const otherUsers = allUsers.filter(u => 
    u.id !== currentUser.id && 
    u.organization_id === currentUser.organization_id
  );
  const filteredUsers = otherUsers.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const toggleUser = (userId: number) => {
    setSelectedUserIds(prev => {
      const isSelected = prev.includes(userId);
      if (isSelected) {
        const next = prev.filter(id => id !== userId);
        const { [userId]: _, ...rest } = userLevels;
        setUserLevels(rest);
        return next;
      } else {
        setUserLevels(l => ({ ...l, [userId]: AccessLevel.VIEWER }));
        return [...prev, userId];
      }
    });
  };

  const toggleGroup = (groupId: string) => {
    setSelectedGroupIds(prev => {
      const isSelected = prev.includes(groupId);
      if (isSelected) {
        const next = prev.filter(id => id !== groupId);
        const { [groupId]: _, ...rest } = groupLevels;
        setGroupLevels(rest);
        return next;
      } else {
        setGroupLevels(l => ({ ...l, [groupId]: AccessLevel.VIEWER }));
        return [...prev, groupId];
      }
    });
  };

  const updateUserLevel = (userId: number, level: AccessLevel) => {
    setUserLevels(prev => ({ ...prev, [userId]: level }));
  };

  const updateGroupLevel = (groupId: string, level: AccessLevel) => {
    setGroupLevels(prev => ({ ...prev, [groupId]: level }));
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    setIsCreatingGroup(true);
    try {
      const group = await workspaceService.createGroup(currentUser.id, newGroupName.trim(), newGroupMemberIds);
      setAvailableGroups(prev => [group, ...prev]);
      toggleGroup(group.id);
      setShowAddGroup(false);
      setNewGroupName('');
      setNewGroupMemberIds([]);
    } catch (err: any) {
      setError(err.message || 'Failed to create group');
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Folder name is required');
      return;
    }
    setError('');
    setIsSaving(true);
    try {
      const accessUsers = selectedUserIds.map(id => ({ id, level: userLevels[id] }));
      const accessGroups = selectedGroupIds.map(id => ({ id, level: groupLevels[id] }));
      await onSave(name.trim(), accessUsers, accessGroups);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save folder');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedUsers = otherUsers.filter(u => selectedUserIds.includes(u.id));
  const selectedGroups = availableGroups.filter(g => selectedGroupIds.includes(g.id));

  const RoleBadge = ({ level, onChange }: { level: AccessLevel, onChange: (l: AccessLevel) => void }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const levels = [
      { id: AccessLevel.VIEWER, label: 'Viewer', icon: <Eye className="w-3 h-3" />, desc: 'Can only view dashboards' },
      { id: AccessLevel.EDITOR, label: 'Editor', icon: <Edit3 className="w-3 h-3" />, desc: 'Can view and edit dashboards' },
      { id: AccessLevel.ADMIN, label: 'Admin', icon: <Settings className="w-3 h-3" />, desc: 'Can manage folder and users' }
    ];

    const current = levels.find(l => l.id === level) || levels[0];

    return (
      <div className="relative" ref={ref}>
        <button
          onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border ${colors.borderPrimary} text-[10px] font-bold uppercase tracking-wider ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'} hover:${colors.bgTertiary} transition`}
        >
          {current.icon}
          {current.label}
          <ChevronDown className={`w-3 h-3 ${open ? 'rotate-180' : ''} transition-transform`} />
        </button>

        {open && (
          <div className={`absolute top-full right-0 mt-1 z-30 w-48 ${colors.modalBg} border ${colors.borderPrimary} rounded-xl shadow-2xl overflow-hidden animate-fade-in-up`}>
            {levels.map(l => (
              <button
                key={l.id}
                onClick={(e) => { e.stopPropagation(); onChange(l.id); setOpen(false); }}
                className={`w-full flex flex-col gap-0.5 px-4 py-2 hover:${colors.bgTertiary} text-left transition ${l.id === level ? 'bg-indigo-500/10' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <span className={l.id === level ? 'text-indigo-400' : colors.textPrimary}>{l.icon}</span>
                  <span className={`text-xs font-bold ${l.id === level ? 'text-indigo-400' : colors.textPrimary}`}>{l.label}</span>
                  {l.id === level && <Check className="w-3 h-3 ml-auto text-indigo-400" />}
                </div>
                <p className={`text-[10px] ${colors.textMuted}`}>{l.desc}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`fixed inset-0 z-[100] ${colors.overlayBg} backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in`}>
      <div className={`${colors.modalBg} border ${colors.borderPrimary} rounded-2xl p-8 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-xl">
              <Folder className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className={`text-xl font-bold ${colors.textPrimary}`}>
              {mode === 'create' ? 'New Workspace' : 'Edit Workspace'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl hover:${colors.bgTertiary} ${colors.textMuted} hover:${colors.textPrimary} transition`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Folder Name */}
        <div className="mb-5">
          <label className={`block text-xs font-bold uppercase tracking-wider ${colors.textMuted} mb-2`}>
            Workspace Name
          </label>
          <input
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setError(''); }}
            className={`w-full ${colors.bgPrimary} border ${error ? 'border-red-500' : colors.borderSecondary} ${colors.textPrimary} rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition`}
            placeholder="e.g. Q2 Reports"
            autoFocus
          />
        </div>

        {/* Groups Selection Area */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <label className={`text-xs font-bold uppercase tracking-wider ${colors.textMuted} flex items-center gap-1.5`}>
              <Users className="w-3.5 h-3.5" />
              User Groups
            </label>
            <button
              onClick={() => setShowAddGroup(true)}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 transition"
            >
              <Plus className="w-3 h-3" /> Add Group
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {availableGroups.length === 0 ? (
              <p className={`text-xs ${colors.textMuted} italic`}>No groups created yet.</p>
            ) : (
              availableGroups.map(group => {
                const isSelected = selectedGroupIds.includes(group.id);
                return (
                  <button
                    key={group.id}
                    onClick={() => toggleGroup(group.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                      isSelected 
                      ? 'bg-indigo-500 text-white border-indigo-400 shadow-md transform scale-105' 
                      : `${colors.bgTertiary} ${colors.textSecondary} ${colors.borderPrimary} hover:border-indigo-500/50`
                    }`}
                  >
                    <Users className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-indigo-400'}`} />
                    {group.name}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Access Users Multi-select */}
        <div className="mb-6">
          <label className={`block text-xs font-bold uppercase tracking-wider ${colors.textMuted} mb-2 flex items-center gap-1.5`}>
            <UserPlus className="w-3.5 h-3.5" />
            Grant Individual Access
          </label>

          {otherUsers.length === 0 ? (
            <p className={`text-sm ${colors.textMuted} italic`}>No other users registered.</p>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(o => !o)}
                className={`w-full flex items-center justify-between px-4 py-3 ${colors.bgPrimary} border ${colors.borderSecondary} rounded-xl ${colors.textPrimary} hover:border-indigo-500/50 transition text-sm`}
              >
                <span className={selectedUsers.length === 0 ? colors.textMuted : colors.textPrimary}>
                  {selectedUsers.length === 0
                    ? 'Select users…'
                    : `${selectedUsers.length} individual user${selectedUsers.length > 1 ? 's' : ''}`}
                </span>
                <ChevronDown className={`w-4 h-4 ${colors.textMuted} transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className={`absolute top-full left-0 right-0 mt-1 z-20 ${colors.modalBg} border ${colors.borderPrimary} rounded-xl shadow-2xl overflow-hidden animate-fade-in-up`}>
                  <div className={`p-2 border-b ${colors.borderPrimary}`}>
                    <input
                      type="text"
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      placeholder="Search users..."
                      className={`w-full ${colors.bgTertiary} border ${colors.borderPrimary} ${colors.textPrimary} rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500`}
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto custom-scrollbar">
                    {filteredUsers.length === 0 ? (
                      <div className={`px-4 py-3 text-sm ${colors.textMuted}`}>No users found</div>
                    ) : (
                      filteredUsers.map(user => {
                        const isSelected = selectedUserIds.includes(user.id);
                        return (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => toggleUser(user.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 hover:${colors.bgTertiary} transition text-left`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isSelected ? 'bg-indigo-500 text-white' : `${colors.bgTertiary} ${colors.textMuted}`}`}>
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${colors.textPrimary} truncate`}>{user.name}</p>
                              <p className={`text-xs ${colors.textMuted} truncate`}>{user.email}</p>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-indigo-400 shrink-0" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Detailed Selection List (New UI for roles) */}
          {(selectedUsers.length > 0 || selectedGroups.length > 0) && (
            <div className="mt-6 space-y-3">
              <label className={`block text-[10px] font-bold uppercase tracking-wider ${colors.textMuted} mb-3 pb-2 border-b border-white/5`}>
                Manage Participant Permissions
              </label>
              
              {selectedGroups.map(group => (
                <div key={group.id} className={`flex items-center justify-between p-3 rounded-xl border ${colors.borderPrimary} ${colors.bgTertiary} animate-fade-in-up`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${colors.textPrimary}`}>{group.name}</p>
                      <p className={`text-[10px] ${colors.textMuted}`}>Workspace Group</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <RoleBadge 
                      level={groupLevels[group.id] || AccessLevel.VIEWER} 
                      onChange={(l) => updateGroupLevel(group.id, l)} 
                    />
                    <button onClick={() => toggleGroup(group.id)} className={`${colors.textMuted} hover:text-red-400 p-1`}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {selectedUsers.map(user => (
                <div key={user.id} className={`flex items-center justify-between p-3 rounded-xl border ${colors.borderPrimary} ${colors.bgTertiary} animate-fade-in-up`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full border ${colors.borderPrimary} flex items-center justify-center text-xs font-bold shrink-0 ${colors.bgPrimary} ${colors.textPrimary}`}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${colors.textPrimary}`}>{user.name}</p>
                      <p className={`text-[10px] ${colors.textMuted}`}>{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <RoleBadge 
                      level={userLevels[user.id] || AccessLevel.VIEWER} 
                      onChange={(l) => updateUserLevel(user.id, l)} 
                    />
                    <button onClick={() => toggleUser(user.id)} className={`${colors.textMuted} hover:text-red-400 p-1`}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-red-400 text-xs mb-4 text-center">{error}</p>}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl border ${colors.borderPrimary} ${colors.textSecondary} hover:${colors.bgTertiary} transition text-sm font-medium`}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold transition shadow-lg shadow-indigo-900/20 flex items-center gap-2 text-sm"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
            {mode === 'create' ? 'Create Workspace' : 'Save Changes'}
          </button>
        </div>

        {/* Add Group Overlay */}
        {showAddGroup && (
          <div className={`absolute inset-0 z-[110] ${colors.modalBg} flex flex-col p-8 rounded-2xl animate-fade-in-up shadow-inner`}>
            <div className="flex items-center justify-between mb-6">
              <h4 className={`text-lg font-bold ${colors.textPrimary}`}>Create New Group</h4>
              <button 
                onClick={() => { setShowAddGroup(false); setNewGroupName(''); setNewGroupMemberIds([]); }}
                className={`p-2 rounded-xl hover:${colors.bgTertiary} ${colors.textMuted} transition`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5 flex-1 overflow-y-auto custom-scrollbar pr-2 -mr-2">
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider ${colors.textMuted} mb-2`}>
                  Group Name
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  className={`w-full ${colors.bgPrimary} border ${colors.borderSecondary} ${colors.textPrimary} rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none`}
                  placeholder="e.g. Marketing Team"
                  autoFocus
                />
              </div>

              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider ${colors.textMuted} mb-2`}>
                  Select Members
                </label>
                <div className={`max-h-48 overflow-y-auto rounded-xl border ${colors.borderPrimary} ${colors.bgPrimary}`}>
                  {otherUsers.map(user => {
                    const isPicked = newGroupMemberIds.includes(user.id);
                    return (
                      <button
                        key={user.id}
                        onClick={() => setNewGroupMemberIds(prev => isPicked ? prev.filter(id => id !== user.id) : [...prev, user.id])}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 hover:${colors.bgTertiary} transition text-left border-b last:border-b-0 ${colors.borderPrimary}`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${isPicked ? 'bg-indigo-500 text-white' : `${colors.bgTertiary} ${colors.textMuted}`}`}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className={`text-sm ${isPicked ? colors.textPrimary : colors.textSecondary}`}>{user.name}</span>
                        {isPicked && <Check className="w-3.5 h-3.5 ml-auto text-indigo-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/5">
              <button
                onClick={() => { setShowAddGroup(false); setNewGroupName(''); setNewGroupMemberIds([]); }}
                className={`px-4 py-2 rounded-xl ${colors.textTertiary} hover:${colors.textPrimary} transition text-sm font-medium`}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={isCreatingGroup || !newGroupName.trim() || newGroupMemberIds.length === 0}
                className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold transition shadow-lg shadow-indigo-900/20 flex items-center gap-2 text-sm"
              >
                {isCreatingGroup ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create Group
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
;
