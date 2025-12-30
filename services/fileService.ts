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
    }
};
