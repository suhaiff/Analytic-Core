import axios from 'axios';

import { API_BASE } from '../config/api';

const API_URL = API_BASE;

export interface UploadedFile {
    id: number;
    user_id: number;
    filename: string;
    original_name: string;
    file_path: string;
    mime_type: string;
    size: number;
    created_at: string;
    user_name?: string;
    user_email?: string;
}

export interface FileSheet {
    name: string;
    data: any[][];
}

export interface FileContent {
    fileName: string;
    sheets: FileSheet[];
}

export const fileService = {
    uploadFile: async (userId: number, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', userId.toString());

        const response = await axios.post(`${API_URL}/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    getAllUploads: async () => {
        const response = await axios.get(`${API_URL}/admin/uploads`);
        return response.data as UploadedFile[];
    },

    getFileContent: async (id: number): Promise<FileContent> => {
        const response = await axios.get(`${API_URL}/uploads/${id}/content`);
        return response.data;
    },

    logConfiguration: async (fileName: string, columns: string[], joinConfigs: any[]) => {
        await axios.post(`${API_URL}/log-config`, {
            fileName,
            columns,
            joinConfigs
        });
    },

    getGoogleSheetsMetadata: async (url: string) => {
        const response = await axios.post(`${API_URL}/google-sheets/metadata`, { url });
        return response.data;
    },

    importGoogleSheet: async (userId: number, spreadsheetId: string, sheetName: string, title?: string) => {
        const response = await axios.post(`${API_URL}/google-sheets/import`, {
            userId,
            spreadsheetId,
            sheetName,
            title
        });
        return response.data;
    },

    refreshGoogleSheet: async (fileId: number) => {
        const response = await axios.post(`${API_URL}/google-sheets/refresh/${fileId}`);
        return response.data;
    },

    // SharePoint methods
    checkSharePointConfig: async () => {
        const response = await axios.get(`${API_URL}/sharepoint/config-status`);
        return response.data;
    },

    getSharePointSites: async () => {
        const response = await axios.post(`${API_URL}/sharepoint/sites`);
        return response.data;
    },

    getSharePointLists: async (siteId: string) => {
        const response = await axios.post(`${API_URL}/sharepoint/lists`, { siteId });
        return response.data;
    },

    getSharePointMetadata: async (siteId: string, listId: string) => {
        const response = await axios.post(`${API_URL}/sharepoint/metadata`, { siteId, listId });
        return response.data;
    },

    importSharePointList: async (
        userId: number,
        siteId: string,
        listId: string,
        listName: string,
        siteName?: string,
        title?: string
    ) => {
        const response = await axios.post(`${API_URL}/sharepoint/import`, {
            userId,
            siteId,
            listId,
            listName,
            siteName,
            title
        });
        return response.data;
    },

    refreshSharePointList: async (fileId: number) => {
        const response = await axios.post(`${API_URL}/sharepoint/refresh/${fileId}`);
        return response.data;
    },

    // ============================================
    // SharePoint OAuth Methods (Per-User)
    // ============================================

    /**
     * Check if user has connected their SharePoint account
     */
    checkSharePointConnection: async (userId: number) => {
        const response = await axios.get(`${API_URL}/sharepoint/connection-status`, {
            params: { userId }
        });
        return response.data;
    },

    /**
     * Initiate SharePoint OAuth flow (redirects to Microsoft login)
     */
    connectSharePoint: (userId: number) => {
        window.location.href = `${API_URL.replace('/api', '')}/auth/sharepoint/start?userId=${userId}`;
    },

    /**
     * Disconnect user's SharePoint account
     */
    disconnectSharePoint: async (userId: number) => {
        const response = await axios.delete(`${API_URL}/sharepoint/disconnect`, {
            data: { userId }
        });
        return response.data;
    },

    /**
     * Get SharePoint sites for authenticated user (OAuth)
     */
    getUserSharePointSites: async (userId: number) => {
        const response = await axios.post(`${API_URL}/sharepoint/user/sites`, { userId });
        return response.data;
    },

    /**
     * Get SharePoint lists for authenticated user (OAuth)
     */
    getUserSharePointLists: async (userId: number, siteId: string) => {
        const response = await axios.post(`${API_URL}/sharepoint/user/lists`, { userId, siteId });
        return response.data;
    },

    /**
     * Import SharePoint list using user's OAuth token
     */
    importUserSharePointList: async (
        userId: number,
        siteId: string,
        listId: string,
        listName: string,
        siteName?: string,
        title?: string
    ) => {
        const response = await axios.post(`${API_URL}/sharepoint/user/import`, {
            userId,
            siteId,
            listId,
            listName,
            siteName,
            title
        });
        return response.data;
    },

    // ============================================
    // SQL Database Methods (MySQL & PostgreSQL)
    // ============================================

    /**
     * Test SQL database connection
     */
    testSqlConnection: async (config: {
        host: string;
        port?: number;
        user: string;
        password: string;
        database: string;
        type: 'mysql' | 'mariadb' | 'postgresql';
    }) => {
        const response = await axios.post(`${API_URL}/sql/test-connection`, config);
        return response.data;
    },

    /**
     * Get tables from SQL database
     */
    getSqlTables: async (config: {
        host: string;
        port?: number;
        user: string;
        password: string;
        database: string;
        type: 'mysql' | 'mariadb' | 'postgresql';
    }) => {
        const response = await axios.post(`${API_URL}/sql/tables`, config);
        return response.data;
    },

    /**
     * Import SQL table
     */
    importSqlTable: async (
        userId: number,
        config: {
            host: string;
            port?: number;
            user: string;
            password: string;
            database: string;
            type: 'mysql' | 'mariadb' | 'postgresql';
        },
        tableName: string,
        title?: string
    ) => {
        const response = await axios.post(`${API_URL}/sql/import`, {
            userId,
            ...config,
            tableName,
            title
        });
        return response.data;
    }

};
