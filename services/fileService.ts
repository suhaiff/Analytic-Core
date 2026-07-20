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
            },
            timeout: 600000 // 10 minutes — large files (50k+ rows) need time to batch-insert into Supabase
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

    importGoogleSheet: async (userId: number, spreadsheetId: string, sheetNames: string[], title?: string) => {
        const response = await axios.post(`${API_URL}/google-sheets/import`, {
            userId,
            spreadsheetId,
            sheetNames,
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
        // Get the root URL (remove /api if it exists at the end)
        const rootUrl = API_URL.endsWith('/api') ? API_URL.slice(0, -4) : API_URL;
        const redirectUrl = `${rootUrl}/auth/sharepoint/start?userId=${userId}`;

        console.log('🔗 Redirecting to SharePoint OAuth:', redirectUrl);

        // Use window.location.assign for a more standard redirect
        window.location.assign(redirectUrl);
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

    getSqlMetadata: async (fileId: number) => {
        const response = await axios.post(`${API_URL}/sql/metadata`, { fileId });
        return response.data;
    },

    importSqlTable: async (userId: number, fileId: number, tables: string[], title?: string) => {
        const response = await axios.post(`${API_URL}/sql/import`, {
            userId,
            fileId,
            tables,
            title
        });
        return response.data;
    },

    // SQL Database Live Connection Methods
    testSqlConnection: async (config: {
        engine: string;
        host: string;
        port: number;
        database: string;
        user: string;
        password: string;
    }) => {
        const response = await axios.post(`${API_URL}/sql-db/test`, config);
        return response.data;
    },

    getSqlTables: async (config: {
        engine: string;
        host: string;
        port: number;
        database: string;
        user: string;
        password: string;
    }) => {
        const response = await axios.post(`${API_URL}/sql-db/tables`, config);
        return response.data;
    },

    importSqlDatabase: async (
        userId: number,
        config: {
            engine: string;
            host: string;
            port: number;
            database: string;
            user: string;
            password: string;
        },
        tableNames: string[],
        title?: string
    ) => {
        const response = await axios.post(`${API_URL}/sql-db/import`, {
            userId,
            ...config,
            tableNames,
            title
        });
        return response.data;
    },

    refreshSqlDatabase: async (fileId: number, password: string) => {
        const response = await axios.post(`${API_URL}/sql-db/refresh/${fileId}`, { password });
        return response.data;
    },

    // ============================================
    // Cloud Storage Methods
    // ============================================

    // S3
    testS3Connection: async (credentials: any, bucket: string) => {
        const response = await axios.post(`${API_URL}/cloud-storage/s3/test`, { credentials, bucket });
        return response.data;
    },
    listS3Files: async (credentials: any, bucket: string) => {
        const response = await axios.post(`${API_URL}/cloud-storage/s3/list-files`, { credentials, bucket });
        return response.data;
    },
    fetchS3File: async (credentials: any, bucket: string, fileKey: string) => {
        const response = await axios.post(`${API_URL}/cloud-storage/s3/fetch-file`, { credentials, bucket, fileKey }, { responseType: 'blob' });
        return response.data;
    },

    // Azure Blob
    testAzureConnection: async (connectionString: string, containerName: string) => {
        const response = await axios.post(`${API_URL}/cloud-storage/azure/test`, { connectionString, containerName });
        return response.data;
    },
    listAzureFiles: async (connectionString: string, containerName: string) => {
        const response = await axios.post(`${API_URL}/cloud-storage/azure/list-files`, { connectionString, containerName });
        return response.data;
    },
    fetchAzureFile: async (connectionString: string, containerName: string, blobName: string) => {
        const response = await axios.post(`${API_URL}/cloud-storage/azure/fetch-file`, { connectionString, containerName, blobName }, { responseType: 'blob' });
        return response.data;
    },

    // Google Cloud Storage
    testGCSConnection: async (credentialsJson: string, bucketName: string) => {
        const response = await axios.post(`${API_URL}/cloud-storage/gcs/test`, { credentialsJson, bucketName });
        return response.data;
    },
    listGCSFiles: async (credentialsJson: string, bucketName: string) => {
        const response = await axios.post(`${API_URL}/cloud-storage/gcs/list-files`, { credentialsJson, bucketName });
        return response.data;
    },
    fetchGCSFile: async (credentialsJson: string, bucketName: string, fileName: string) => {
        const response = await axios.post(`${API_URL}/cloud-storage/gcs/fetch-file`, { credentialsJson, bucketName, fileName }, { responseType: 'blob' });
        return response.data;
    },

    // ============================================
    // Unified Data Warehouse Methods
    // ============================================
    testDWConnection: async (engine: string, config: any) => {
        const response = await axios.post(`${API_URL}/data-warehouse/test`, { engine, config });
        return response.data;
    },
    getDWTables: async (engine: string, config: any) => {
        const response = await axios.post(`${API_URL}/data-warehouse/tables`, { engine, config });
        return response.data;
    },
    importDWTable: async (userId: number, engine: string, config: any, tableNames: string[], title?: string) => {
        const response = await axios.post(`${API_URL}/data-warehouse/import`, {
            userId,
            engine,
            config,
            tableNames,
            title
        });
        return response.data;
    }

};
