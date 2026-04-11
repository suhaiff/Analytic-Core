import React, { useState, useEffect, useRef } from 'react';
import { X, Folder, Users, Check, ChevronDown, Loader2 } from 'lucide-react';
import { WorkspaceFolder, User } from '../../types';
import { useTheme } from '../../ThemeContext';
import { getThemeClasses } from '../../theme';

interface FolderModalProps {
  mode: 'create' | 'edit';
  existingFolder?: WorkspaceFolder;
  currentUser: User;
  allUsers: User[];
  onSave: (name: string, accessUserIds: number[]) => Promise<void>;
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
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>(() => {
    if (existingFolder?.access_users) {
      return existingFolder.access_users.map(u => u.id);
    }
    return [];
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Other users (excluding current user / owner)
  const otherUsers = allUsers.filter(u => u.id !== currentUser.id);
  const filteredUsers = otherUsers.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleUser = (userId: number) => {
    setSelectedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Folder name is required');
      return;
    }
    setError('');
    setIsSaving(true);
    try {
      await onSave(name.trim(), selectedUserIds);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save folder');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedUsers = otherUsers.filter(u => selectedUserIds.includes(u.id));

  return (
    <div className={`fixed inset-0 z-[100] ${colors.overlayBg} backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in`}>
      <div className={`${colors.modalBg} border ${colors.borderPrimary} rounded-2xl p-8 max-w-md w-full shadow-2xl relative max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-xl">
              <Folder className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className={`text-xl font-bold ${colors.textPrimary}`}>
              {mode === 'create' ? 'New Folder' : 'Edit Folder'}
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
            Folder Name
          </label>
          <input
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setError(''); }}
            className={`w-full ${colors.bgPrimary} border ${error ? 'border-red-500' : colors.borderSecondary} ${colors.textPrimary} rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition`}
            placeholder="e.g. Q2 Reports"
            autoFocus
          />
          {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
        </div>

        {/* Owner Badge */}
        <div className="mb-5">
          <label className={`block text-xs font-bold uppercase tracking-wider ${colors.textMuted} mb-2`}>
            Owner
          </label>
          <div className={`flex items-center gap-3 px-4 py-3 ${colors.bgTertiary} rounded-xl border ${colors.borderPrimary}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className={`text-sm font-semibold ${colors.textPrimary}`}>{currentUser.name}</p>
              <p className={`text-xs ${colors.textMuted}`}>{currentUser.email}</p>
            </div>
            <span className="ml-auto text-xs bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-medium">Owner</span>
          </div>
        </div>

        {/* Access Users Multi-select */}
        <div className="mb-6">
          <label className={`block text-xs font-bold uppercase tracking-wider ${colors.textMuted} mb-2 flex items-center gap-1.5`}>
            <Users className="w-3.5 h-3.5" />
            Grant Access
          </label>

          {otherUsers.length === 0 ? (
            <p className={`text-sm ${colors.textMuted} italic`}>No other users registered.</p>
          ) : (
            <div className="relative" ref={dropdownRef}>
              {/* Trigger */}
              <button
                type="button"
                onClick={() => setDropdownOpen(o => !o)}
                className={`w-full flex items-center justify-between px-4 py-3 ${colors.bgPrimary} border ${colors.borderSecondary} rounded-xl ${colors.textPrimary} hover:border-indigo-500/50 transition text-sm`}
              >
                <span className={selectedUsers.length === 0 ? colors.textMuted : colors.textPrimary}>
                  {selectedUsers.length === 0
                    ? 'Select users…'
                    : `${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''} selected`}
                </span>
                <ChevronDown className={`w-4 h-4 ${colors.textMuted} transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown */}
              {dropdownOpen && (
                <div className={`absolute top-full left-0 right-0 mt-1 z-20 ${colors.modalBg} border ${colors.borderPrimary} rounded-xl shadow-2xl overflow-hidden animate-fade-in-up`}>
                  {/* Search */}
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

          {/* Selected chips */}
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {selectedUsers.map(user => (
                <span
                  key={user.id}
                  className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 rounded-full text-xs font-medium"
                >
                  {user.name}
                  <button
                    onClick={() => toggleUser(user.id)}
                    className="hover:text-white transition ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl ${colors.textTertiary} hover:${colors.textPrimary} ${colors.bgTertiary} transition text-sm font-medium`}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium transition shadow-lg shadow-indigo-900/20 flex items-center gap-2 text-sm"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Folder className="w-4 h-4" />}
            {mode === 'create' ? 'Create Folder' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};
