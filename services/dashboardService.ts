import { fetchWithAuth } from '../utils/fetchWithAuth';
import { SavedDashboard } from '../types';
import { API_BASE } from '../config/api';

const API_URL = API_BASE;

export const dashboardService = {
    async getUserDashboards(userId: number): Promise<SavedDashboard[]> {
        const response = await fetchWithAuth(`${API_URL}/dashboards?userId=${userId}`);
        if (!response.ok) throw new Error('Failed to fetch dashboards');
        return await response.json();
    },

    async getDashboardById(id: string | number): Promise<SavedDashboard | null> {
        const response = await fetchWithAuth(`${API_URL}/dashboards/${id}`);
        if (response.status === 404) return null;
        if (!response.ok) throw new Error('Failed to fetch dashboard');
        return await response.json();
    },

    async saveDashboard(userId: number, dashboard: SavedDashboard): Promise<void> {
        console.log('💾 Saving new dashboard:', { userId, name: dashboard.name, API_URL });
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            // Strip the raw data rows from dataModel before sending to the server.
            // The `data` array can contain tens of thousands of rows, easily exceeding
            // Netlify's 6 MB CDN proxy limit in production and causing a 400 error.
            // Only the metadata (columns, types, fileId, joins, etc.) needs to be
            // persisted — the actual rows are re-fetched from the stored file on load.
            const { data: _stripped, ...dataModelWithoutRows } = dashboard.dataModel;

            const response = await fetchWithAuth(`${API_URL}/dashboards`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    dashboard: {
                        name: dashboard.name,
                        dataModel: dataModelWithoutRows,
                        chartConfigs: dashboard.chartConfigs,
                        sections: dashboard.sections,
                        filterColumns: dashboard.filterColumns,
                        folderId: dashboard.folder_id || null,
                        isWorkspace: dashboard.is_workspace || false
                    }
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Save failed:', { status: response.status, statusText: response.statusText, errorText });
                throw new Error(`Failed to save dashboard: ${response.status} ${response.statusText} - ${errorText}`);
            }
            
            console.log('✅ Dashboard saved successfully');
        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.error('❌ Save request timeout');
                throw new Error('Request timeout - please check your connection and try again');
            }
            console.error('❌ Save dashboard error:', error);
            throw error;
        }
    },

    async updateDashboard(id: string, dashboard: SavedDashboard): Promise<void> {
        console.log('🔄 Updating dashboard:', { id, name: dashboard.name, API_URL });
        
        try {
            // Add timeout to prevent hanging requests
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

            // Strip the raw data rows from dataModel before sending to the server.
            // Same reason as saveDashboard: the `data` array is too large for Netlify's
            // 6 MB CDN proxy limit in production, causing a 400 error.
            const { data: _stripped, ...dataModelWithoutRows } = dashboard.dataModel;

            const response = await fetchWithAuth(`${API_URL}/dashboards/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dashboard: {
                        name: dashboard.name,
                        dataModel: dataModelWithoutRows,
                        chartConfigs: dashboard.chartConfigs,
                        sections: dashboard.sections,
                        filterColumns: dashboard.filterColumns,
                        folderId: dashboard.folder_id || null,
                        isWorkspace: dashboard.is_workspace || false
                    }
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Update failed:', { status: response.status, statusText: response.statusText, errorText });
                throw new Error(`Failed to update dashboard: ${response.status} ${response.statusText} - ${errorText}`);
            }
            
            console.log('✅ Dashboard updated successfully');
        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.error('❌ Update request timeout');
                throw new Error('Request timeout - please check your connection and try again');
            }
            console.error('❌ Update dashboard error:', error);
            throw error;
        }
    },

    async deleteDashboard(id: string): Promise<void> {
        const response = await fetchWithAuth(`${API_URL}/dashboards/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete dashboard');
    },

    async getAllDashboards(): Promise<(SavedDashboard & { user_name: string, user_email: string })[]> {
        const response = await fetchWithAuth(`${API_URL}/admin/dashboards`);
        if (!response.ok) throw new Error('Failed to fetch all dashboards');
        return await response.json();
    }
};
