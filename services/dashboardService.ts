import { SavedDashboard } from '../types';
import { API_BASE } from '../config/api';

const API_URL = API_BASE;

export const dashboardService = {
    async getUserDashboards(userId: number): Promise<SavedDashboard[]> {
        const response = await fetch(`${API_URL}/dashboards?userId=${userId}`);
        if (!response.ok) throw new Error('Failed to fetch dashboards');
        return await response.json();
    },

    async saveDashboard(userId: number, dashboard: SavedDashboard): Promise<void> {
        const response = await fetch(`${API_URL}/dashboards`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId,
                dashboard: {
                    name: dashboard.name,
                    dataModel: dashboard.dataModel,
                    chartConfigs: dashboard.chartConfigs
                }
            })
        });
        if (!response.ok) throw new Error('Failed to save dashboard');
    },

    async deleteDashboard(id: string): Promise<void> {
        const response = await fetch(`${API_URL}/dashboards/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete dashboard');
    },

    async getAllDashboards(): Promise<(SavedDashboard & { user_name: string, user_email: string })[]> {
        const response = await fetch(`${API_URL}/admin/dashboards`);
        if (!response.ok) throw new Error('Failed to fetch all dashboards');
        return await response.json();
    }
};
