import { User } from '../types';
import { API_BASE } from '../config/api';

const API_URL = API_BASE;

export const authService = {
    async login(email: string, password: string): Promise<User> {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }

        localStorage.setItem('insightAI_currentUser', JSON.stringify(data));
        return data;
    },

    async signup(name: string, email: string, password: string): Promise<User> {
        const response = await fetch(`${API_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Signup failed');
        }

        localStorage.setItem('insightAI_currentUser', JSON.stringify(data));
        return data;
    },

    logout() {
        localStorage.removeItem('insightAI_currentUser');
    },

    getCurrentUser(): User | null {
        const userStr = localStorage.getItem('insightAI_currentUser');
        return userStr ? JSON.parse(userStr) : null;
    },

    async getUsers(): Promise<User[]> {
        const response = await fetch(`${API_URL}/users`);
        return await response.json();
    },

    async deleteUser(id: number): Promise<void> {
        const response = await fetch(`${API_URL}/users/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to delete user');
        }
    }
};
