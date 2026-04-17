import { WorkspaceFolder, SavedDashboard, WorkspaceGroup } from '../types';
import { API_BASE } from '../config/api';

const API_URL = API_BASE;

export const workspaceService = {
    async getFolders(userId: number): Promise<WorkspaceFolder[]> {
        const response = await fetch(`${API_URL}/workspace/folders?userId=${userId}`);
        if (!response.ok) throw new Error('Failed to fetch workspace folders');
        return await response.json();
    },

    async createFolder(
        ownerId: number, 
        name: string, 
        accessUsers: { id: number; level: string }[], 
        accessGroups: { id: string; level: string }[]
    ): Promise<WorkspaceFolder> {
        const response = await fetch(`${API_URL}/workspace/folders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ownerId, name, accessUsers, accessGroups })
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
        accessUsers: { id: number; level: string }[],
        accessGroups: { id: string; level: string }[],
        requestingUserId: number
    ): Promise<void> {
        const response = await fetch(`${API_URL}/workspace/folders/${folderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, accessUsers, accessGroups, requestingUserId })
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

    async getFolderDashboards(folderId: string, userId: number): Promise<{ dashboards: SavedDashboard[], effectiveLevel: string }> {
        const response = await fetch(
            `${API_URL}/workspace/folders/${folderId}/dashboards?userId=${userId}`
        );
        if (!response.ok) throw new Error('Failed to fetch folder dashboards');
        return await response.json();
    },

    // Workspace Groups
    async getGroups(userId: number): Promise<WorkspaceGroup[]> {
        const response = await fetch(`${API_URL}/workspace/groups?userId=${userId}`);
        if (!response.ok) throw new Error('Failed to fetch workspace groups');
        return await response.json();
    },

    async createGroup(ownerId: number, name: string, userIds: number[]): Promise<WorkspaceGroup> {
        const response = await fetch(`${API_URL}/workspace/groups`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ownerId, name, userIds })
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to create group');
        }
        return await response.json();
    },

    async updateGroup(groupId: string, name: string, userIds: number[], requestingUserId: number): Promise<void> {
        const response = await fetch(`${API_URL}/workspace/groups/${groupId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, userIds, requestingUserId })
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to update group');
        }
    },

    async deleteGroup(groupId: string, userId: number): Promise<void> {
        const response = await fetch(`${API_URL}/workspace/groups/${groupId}?userId=${userId}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to delete group');
        }
    }
};
