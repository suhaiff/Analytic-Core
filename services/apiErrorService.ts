import { API_BASE } from '../config/api';

export interface ApiErrorLog {
    id?: number;
    error_type: string;
    error_message: string;
    source: string;
    key_index?: number;
    user_id?: number;
    user_email?: string;
    resolved?: boolean;
    created_at?: string;
}

const API_URL = API_BASE;

export const apiErrorService = {
    /**
     * Report an API key error to the backend for admin notification
     */
    async reportError(error: {
        error_type: string;
        error_message: string;
        source: string;
        key_index?: number;
        user_id?: number;
        user_email?: string;
    }): Promise<void> {
        try {
            await fetch(`${API_URL}/admin/api-errors`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(error)
            });
        } catch (e) {
            // Silently fail - we don't want error reporting to cause errors
            console.warn('[ApiErrorService] Failed to report error:', e);
        }
    },

    /**
     * Get all API error logs (admin only)
     */
    async getErrors(): Promise<ApiErrorLog[]> {
        const response = await fetch(`${API_URL}/admin/api-errors`);
        if (!response.ok) {
            throw new Error('Failed to fetch API errors');
        }
        return await response.json();
    },

    /**
     * Get unresolved error count (for notification badge)
     */
    async getUnresolvedCount(): Promise<number> {
        try {
            const response = await fetch(`${API_URL}/admin/api-errors/count`);
            if (!response.ok) return 0;
            const data = await response.json();
            return data.count || 0;
        } catch {
            return 0;
        }
    },

    /**
     * Mark an error as resolved
     */
    async resolveError(id: number): Promise<void> {
        const response = await fetch(`${API_URL}/admin/api-errors/${id}/resolve`, {
            method: 'PUT'
        });
        if (!response.ok) {
            throw new Error('Failed to resolve error');
        }
    },

    /**
     * Mark all errors as resolved
     */
    async resolveAll(): Promise<void> {
        const response = await fetch(`${API_URL}/admin/api-errors/resolve-all`, {
            method: 'PUT'
        });
        if (!response.ok) {
            throw new Error('Failed to resolve all errors');
        }
    },

    /**
     * Delete old resolved errors
     */
    async clearResolved(): Promise<void> {
        const response = await fetch(`${API_URL}/admin/api-errors/resolved`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            throw new Error('Failed to clear resolved errors');
        }
    }
};
