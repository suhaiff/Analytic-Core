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
    }
};
