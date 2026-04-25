import axios from 'axios';
import { API_BASE } from '../config/api';
import {
    MLAlgorithm,
    MLModel,
    MLPredictionJob,
    MLPredictionResponse,
    MLProblemType,
    MLTrainResponse,
} from '../types';

const ML_URL = `${API_BASE}/ml`;

export interface MLTrainParams {
    userId: number;
    name: string;
    description?: string;
    targetColumn: string;
    algorithm: MLAlgorithm;
    featureColumns?: string[];
    problemType?: MLProblemType;
    testSize?: number;
    sourceFileId?: number;
    file: File;
}

export interface MLRetrainParams {
    userId: number;
    modelId: string;
    name: string;
    description?: string;
    targetColumn: string;
    algorithm: MLAlgorithm;
    featureColumns?: string[];
    problemType?: MLProblemType;
    file: File;
}

export interface MLPredictParams {
    userId: number;
    modelId: string;
    file: File;
    includeProbabilities?: boolean;
}

export interface MLAlgorithmDescriptor {
    id: MLAlgorithm;
    type: MLProblemType;
}

export const mlService = {
    /** Confirm that the backend + python service are reachable. */
    health: async () => {
        const { data } = await axios.get(`${ML_URL}/health`);
        return data as { ok: boolean; service?: any; error?: string; url: string };
    },

    /** Get available algorithms from the python service. */
    listAlgorithms: async (): Promise<MLAlgorithmDescriptor[]> => {
        const { data } = await axios.get(`${ML_URL}/algorithms`);
        return (data.algorithms || []) as MLAlgorithmDescriptor[];
    },

    /** List current user's trained models. */
    listModels: async (userId: number): Promise<MLModel[]> => {
        const { data } = await axios.get(`${ML_URL}/models`, { params: { userId } });
        return data as MLModel[];
    },

    /** Fetch details of a single model. */
    getModel: async (userId: number, modelId: string): Promise<MLModel> => {
        const { data } = await axios.get(`${ML_URL}/models/${modelId}`, { params: { userId } });
        return data as MLModel;
    },

    /** Train a new model. */
    trainModel: async (params: MLTrainParams): Promise<MLTrainResponse> => {
        const form = new FormData();
        form.append('file', params.file);
        form.append('userId', String(params.userId));
        form.append('name', params.name);
        if (params.description) form.append('description', params.description);
        form.append('targetColumn', params.targetColumn);
        form.append('algorithm', params.algorithm);
        if (params.featureColumns) form.append('featureColumns', JSON.stringify(params.featureColumns));
        if (params.problemType) form.append('problemType', params.problemType);
        if (params.testSize !== undefined) form.append('testSize', String(params.testSize));
        if (params.sourceFileId !== undefined) form.append('sourceFileId', String(params.sourceFileId));

        const { data } = await axios.post(`${ML_URL}/train`, form, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 10 * 60 * 1000,
        });
        return data as MLTrainResponse;
    },

    /** Run predictions on uploaded data. */
    predict: async (params: MLPredictParams): Promise<MLPredictionResponse> => {
        const form = new FormData();
        form.append('file', params.file);
        form.append('userId', String(params.userId));
        form.append('modelId', params.modelId);
        if (params.includeProbabilities) form.append('includeProbabilities', 'true');

        const { data } = await axios.post(`${ML_URL}/predict`, form, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 10 * 60 * 1000,
        });
        return data as MLPredictionResponse;
    },

    /** Retrain an existing model with additional data. */
    retrainModel: async (params: MLRetrainParams): Promise<MLTrainResponse> => {
        const form = new FormData();
        form.append('file', params.file);
        form.append('userId', String(params.userId));
        form.append('name', params.name);
        if (params.description) form.append('description', params.description);
        form.append('targetColumn', params.targetColumn);
        form.append('algorithm', params.algorithm);
        if (params.featureColumns) form.append('featureColumns', JSON.stringify(params.featureColumns));
        if (params.problemType) form.append('problemType', params.problemType);
        form.append('modelId', params.modelId);

        const { data } = await axios.post(`${ML_URL}/train`, form, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 10 * 60 * 1000,
        });
        return data as MLTrainResponse;
    },

    /** Delete a trained model. */
    deleteModel: async (userId: number, modelId: string): Promise<void> => {
        await axios.delete(`${ML_URL}/models/${modelId}`, { params: { userId } });
    },

    /** List recent prediction jobs for a user. */
    listPredictions: async (userId: number, modelId?: string): Promise<MLPredictionJob[]> => {
        const params: Record<string, string | number> = { userId };
        if (modelId) params.modelId = modelId;
        const { data } = await axios.get(`${ML_URL}/predictions`, { params });
        return data as MLPredictionJob[];
    },
};
