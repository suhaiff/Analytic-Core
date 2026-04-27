import React, { useState, useEffect, useCallback } from 'react';
import { Globe, X, Info, Settings } from 'lucide-react';
import { useTheme } from '../../ThemeContext';
import { getThemeClasses } from '../../theme';
import { fileService } from '../../services/fileService';
import { User } from '../../types';

interface SharePointImportModalProps {
    user: User;
    onClose: () => void;
    onImport: (siteId: string, listId: string, listName: string, data: any[][], siteName: string, fileId: number) => void;
    onShowInfoGuide?: () => void;
}

export const SharePointImportModal: React.FC<SharePointImportModalProps> = ({ user, onClose, onImport, onShowInfoGuide }) => {
    const { theme } = useTheme();
    const colors = getThemeClasses(theme);

    const [spStep, setSpStep] = useState<'CONNECT' | 'SITES' | 'LISTS' | 'IMPORT'>('CONNECT');
    const [spLoading, setSpLoading] = useState(false);
    const [spError, setSpError] = useState('');
    const [spSites, setSpSites] = useState<any[]>([]);
    const [selectedSite, setSelectedSite] = useState<any>(null);
    const [spLists, setSpLists] = useState<any[]>([]);
    const [selectedList, setSelectedList] = useState<any>(null);
    const [spConnected, setSpConnected] = useState<boolean>(false);
    const [spConfigured, setSpConfigured] = useState<boolean>(true);

    const fetchSPSites = useCallback(async () => {
        if (!user) return;
        setSpLoading(true);
        setSpError('');
        try {
            const response = await fileService.getUserSharePointSites(user.id);
            setSpSites(response.sites || []);
            setSpStep('SITES');
        } catch (err: any) {
            if (err.response?.status === 401 || err.response?.data?.requiresAuth) {
                setSpConnected(false);
                setSpStep('CONNECT');
                setSpError('Please connect your SharePoint account first');
            } else {
                setSpError(err.response?.data?.error || err.message || 'Failed to fetch SharePoint sites');
            }
        } finally {
            setSpLoading(false);
        }
    }, [user]);

    useEffect(() => {
        const checkConnection = async () => {
            if (user) {
                try {
                    const status = await fileService.checkSharePointConnection(user.id);
                    setSpConnected(status.connected);
                    setSpConfigured(status.oauthConfigured);
                    if (status.connected) {
                        fetchSPSites();
                    }
                } catch (err) {
                    console.error('Error checking SharePoint connection:', err);
                }
            }
        };
        checkConnection();

        // Check for OAuth callback parameters
        const params = new URLSearchParams(window.location.search);
        if (params.get('sharepoint_connected') === 'true') {
            setSpConnected(true);
            fetchSPSites();
            const cleanUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, '', cleanUrl);
        }
        if (params.get('sharepoint_error')) {
            setSpStep('CONNECT');
            setSpError(decodeURIComponent(params.get('sharepoint_error') || ''));
            const cleanUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, '', cleanUrl);
        }
    }, [user, fetchSPSites]);

    const handleConnectSharePoint = () => {
        if (!user) return;
        fileService.connectSharePoint(user.id);
    };

    const handleSiteSelect = async (site: any) => {
        if (!user) return;
        setSelectedSite(site);
        setSpLoading(true);
        setSpError('');
        try {
            const response = await fileService.getUserSharePointLists(user.id, site.id);
            setSpLists(response.lists || []);
            setSpStep('LISTS');
        } catch (err: any) {
            setSpError(err.response?.data?.error || err.message || 'Failed to fetch SharePoint lists');
        } finally {
            setSpLoading(false);
        }
    };

    const handleListSelect = (list: any) => {
        setSelectedList(list);
        setSpStep('IMPORT');
    };

    const handleSPImport = async () => {
        if (!selectedSite || !selectedList || !user) return;
        setSpLoading(true);
        setSpError('');
        try {
            const result = await fileService.importUserSharePointList(
                user.id,
                selectedSite.id,
                selectedList.id,
                selectedList.name,
                selectedSite.name,
                `SP: ${selectedList.name}`
            );
            onImport(selectedSite.id, selectedList.id, selectedList.name, result.data, selectedSite.name, result.fileId);
            onClose();
        } catch (err: any) {
            setSpError(err.response?.data?.error || err.message || 'Failed to import SharePoint list');
        } finally {
            setSpLoading(false);
        }
    };

    return (
        <div className={`fixed inset-0 z-[100] ${colors.overlayBg} backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in`}>
            <div className={`${colors.modalBg} border ${colors.borderPrimary} rounded-2xl p-6 sm:p-8 max-w-xl w-full shadow-2xl transform scale-100 max-h-[90vh] overflow-y-auto`}>
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-500/10 rounded-lg">
                            <Globe className="w-6 h-6 text-orange-500" />
                        </div>
                        <h3 className={`text-xl font-bold ${colors.textPrimary}`}>Import from SharePoint</h3>
                    </div>
                    <div className="flex items-center gap-1">
                        {onShowInfoGuide && (
                            <button
                                onClick={onShowInfoGuide}
                                className={`p-2 rounded-lg hover:bg-orange-500/10 ${colors.textMuted} hover:text-orange-400 transition`}
                                title="How to use SharePoint Import"
                            >
                                <Info className="w-5 h-5" />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-lg hover:${colors.bgTertiary} ${colors.textMuted} transition`}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {!spConfigured ? (
                    <div className="text-center py-8">
                        <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20 text-red-400 mb-6">
                            <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <h4 className="font-bold mb-2">Configuration Required</h4>
                            <p className="text-sm">SharePoint integration has not been set up in the environment variables.</p>
                        </div>
                        <button
                            onClick={onClose}
                            className={`px-6 py-2 rounded-xl bg-indigo-600 text-white font-bold transition`}
                        >
                            Close
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {spStep !== 'CONNECT' && (
                            <div className="flex items-center gap-2 mb-8">
                                {[
                                    { id: 'SITES', label: 'Select Site' },
                                    { id: 'LISTS', label: 'Select List' },
                                    { id: 'IMPORT', label: 'Confirm' }
                                ].map((step, idx) => (
                                    <React.Fragment key={step.id}>
                                        <div className={`flex items-center gap-2 ${spStep === step.id ? 'text-indigo-400' : colors.textMuted}`}>
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${spStep === step.id ? 'bg-indigo-600 text-white' : 'bg-slate-800'}`}>
                                                {idx + 1}
                                            </div>
                                            <span className="text-xs font-medium hidden sm:inline">{step.label}</span>
                                        </div>
                                        {idx < 2 && <div className={`h-px flex-1 ${idx === 0 && (spStep === 'LISTS' || spStep === 'IMPORT') ? 'bg-indigo-600' : idx === 1 && spStep === 'IMPORT' ? 'bg-indigo-600' : 'bg-slate-800'}`} />}
                                    </React.Fragment>
                                ))}
                            </div>
                        )}

                        {spError && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-shake">
                                {spError}
                            </div>
                        )}

                        {spStep === 'CONNECT' && (
                            <div className="space-y-6 text-center">
                                <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-8">
                                    <Globe className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
                                    <h4 className="text-xl font-bold text-white mb-3">Connect to SharePoint</h4>
                                    <p className="text-sm text-slate-400 mb-6">
                                        You'll be redirected to Microsoft to sign in and authorize access to your SharePoint sites.
                                    </p>
                                    <button
                                        onClick={handleConnectSharePoint}
                                        className="px-8 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold transition shadow-lg shadow-orange-900/20"
                                    >
                                        Connect SharePoint Account
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500">
                                    Your data remains secure. You can disconnect anytime from your account settings.
                                </p>
                            </div>
                        )}

                        {spStep === 'SITES' && (
                            <div className="space-y-4">
                                <div className="max-h-64 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                                    {spLoading && spSites.length === 0 ? (
                                        <div className="py-12 text-center animate-pulse text-slate-500">Fetching sites...</div>
                                    ) : spSites.length > 0 ? (
                                        spSites.map((site) => (
                                            <button
                                                key={site.id}
                                                onClick={() => handleSiteSelect(site)}
                                                className={`w-full p-4 rounded-xl border ${colors.borderPrimary} ${colors.bgTertiary} text-left hover:border-indigo-500/50 transition-all group`}
                                            >
                                                <div className="font-bold text-sm text-white group-hover:text-indigo-400">{site.name}</div>
                                                <div className="text-[10px] text-slate-500 truncate">{site.webUrl}</div>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="py-12 text-center text-slate-500">No SharePoint sites found.</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {spStep === 'LISTS' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm font-medium text-slate-400">Site: <span className="text-white">{selectedSite?.name}</span></div>
                                    <button onClick={() => setSpStep('SITES')} className="text-xs text-indigo-400 hover:underline">Change Site</button>
                                </div>
                                <div className="max-h-64 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                                    {spLoading && spLists.length === 0 ? (
                                        <div className="py-12 text-center animate-pulse text-slate-500">Fetching lists...</div>
                                    ) : spLists.length > 0 ? (
                                        spLists.map((list) => (
                                            <button
                                                key={list.id}
                                                onClick={() => handleListSelect(list)}
                                                className={`w-full p-4 rounded-xl border ${colors.borderPrimary} ${colors.bgTertiary} text-left hover:border-indigo-500/50 transition-all group`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold text-sm text-white group-hover:text-indigo-400">{list.name}</span>
                                                    <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">{list.itemCount} items</span>
                                                </div>
                                                <div className="text-[10px] text-slate-500 truncate mt-1">{list.description || 'No description available'}</div>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="py-12 text-center text-slate-500">No lists found in this site.</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {spStep === 'IMPORT' && (
                            <div className="space-y-6">
                                <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-6 text-center">
                                    <Globe className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
                                    <h4 className="text-lg font-bold text-white mb-2">Ready to Import</h4>
                                    <p className="text-sm text-slate-400 px-4">
                                        You are about to import data from the list <span className="text-white font-bold">{selectedList?.name}</span> from the site <span className="text-white font-bold">{selectedSite?.name}</span>.
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setSpStep('LISTS')}
                                        className={`flex-1 py-3 rounded-xl border ${colors.borderPrimary} ${colors.textSecondary} font-bold hover:${colors.bgTertiary} transition`}
                                        disabled={spLoading}
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleSPImport}
                                        disabled={spLoading}
                                        className={`flex-[2] py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold transition shadow-lg shadow-orange-900/20 flex items-center justify-center gap-2`}
                                    >
                                        {spLoading ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>Import SharePoint Data</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
