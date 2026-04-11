import { WorkspaceFolder, SavedDashboard } from '../types';
import { API_BASE } from '../config/api';

const API_URL = API_BASE;

export const workspaceService = {
    async getFolders(userId: number): Promise<WorkspaceFolder[]> {
        const response = await fetch(`${API_URL}/workspace/folders?userId=${userId}`);
        if (!response.ok) throw new Error('Failed to fetch workspace folders');
        return await response.json();
    },

    async createFolder(ownerId: number, name: string, accessUserIds: number[]): Promise<WorkspaceFolder> {
        const response = await fetch(`${API_URL}/workspace/folders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ownerId, name, accessUserIds })
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to create folder');
        }
        return await response.json();
    },

    async updateFolder(
        folderId: string,
        name: string,
        accessUserIds: number[],
        requestingUserId: number
    ): Promise<void> {
        const response = await fetch(`${API_URL}/workspace/folders/${folderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, accessUserIds, requestingUserId })
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to update folder');
        }
    },

    async deleteFolder(folderId: string, requestingUserId: number): Promise<void> {
        const response = await fetch(
            `${API_URL}/workspace/folders/${folderId}?userId=${requestingUserId}`,
            { method: 'DELETE' }
        );
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to delete folder');
        }
    },

    async getFolderDashboards(folderId: string, userId: number): Promise<SavedDashboard[]> {
        const response = await fetch(
            `${API_URL}/workspace/folders/${folderId}/dashboards?userId=${userId}`
        );
        if (!response.ok) throw new Error('Failed to fetch folder dashboards');
        return await response.json();
    }
};
