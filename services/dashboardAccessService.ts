import { DashboardAccessEntry, DashboardAccessLevel, SavedDashboard } from '../types';
import { API_BASE } from '../config/api';

const API_URL = API_BASE;

export const dashboardAccessService = {
    async grantAccess(
        dashboardId: string,
        userId: number,
        accessLevel: DashboardAccessLevel,
        grantedBy: number
    ): Promise<DashboardAccessEntry> {
        const response = await fetch(`${API_URL}/dashboards/${dashboardId}/access`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, accessLevel, grantedBy })
        });
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to grant access');
        }
        return await response.json();
    },

    async revokeAccess(
        dashboardId: string,
        userId: number,
        requestingUserId: number
    ): Promise<void> {
        const response = await fetch(
            `${API_URL}/dashboards/${dashboardId}/access/${userId}?requestingUserId=${requestingUserId}`,
            { method: 'DELETE' }
        );
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to revoke access');
        }
    },

    async getAccessList(dashboardId: string): Promise<DashboardAccessEntry[]> {
        const response = await fetch(`${API_URL}/dashboards/${dashboardId}/access`);
        if (!response.ok) throw new Error('Failed to fetch access list');
        return await response.json();
    },

    async getSharedDashboards(userId: number): Promise<SavedDashboard[]> {
        const response = await fetch(`${API_URL}/dashboards/shared?userId=${userId}`);
        if (!response.ok) throw new Error('Failed to fetch shared dashboards');
        return await response.json();
    }
};
