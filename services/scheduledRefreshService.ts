import { RefreshSchedule } from '../types';
import { API_BASE } from '../config/api';

const API_URL = API_BASE;

export const scheduledRefreshService = {
    async getSchedule(dashboardId: string): Promise<RefreshSchedule | null> {
        const response = await fetch(`${API_URL}/dashboards/${dashboardId}/refresh-schedule`);
        if (!response.ok) throw new Error('Failed to fetch refresh schedule');
        const data = await response.json();
        return data || null;
    },

    async createSchedule(
        dashboardId: string,
        userId: number,
        sourceType: string,
        sourceCredentials: any,
        refreshFrequency: string,
        refreshTimeUtc: string,
        refreshDay?: number | null
    ): Promise<RefreshSchedule> {
        const response = await fetch(`${API_URL}/dashboards/${dashboardId}/refresh-schedule`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId,
                sourceType,
                sourceCredentials,
                refreshFrequency,
                refreshTimeUtc,
                refreshDay
            })
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to create refresh schedule');
        }
        return await response.json();
    },

    async deleteSchedule(dashboardId: string, userId: number): Promise<void> {
        const response = await fetch(
            `${API_URL}/dashboards/${dashboardId}/refresh-schedule?userId=${userId}`,
            { method: 'DELETE' }
        );
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to delete refresh schedule');
        }
    },

    async testConnection(sourceType: string, sourceCredentials: any): Promise<{ success: boolean; message: string; metadata?: any }> {
        const response = await fetch(`${API_URL}/refresh-schedule/test-connection`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sourceType, sourceCredentials })
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Connection test failed');
        }
        return await response.json();
    },

    async refreshNow(dashboardId: string, userId: number): Promise<any> {
        const response = await fetch(`${API_URL}/dashboards/${dashboardId}/refresh-now`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to refresh');
        }
        return await response.json();
    }
};
