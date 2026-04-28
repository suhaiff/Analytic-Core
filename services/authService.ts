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

    async signup(name: string, email: string, phone?: string, company?: string, job_title?: string, domain?: string): Promise<any> {
        const response = await fetch(`${API_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phone, company, job_title, domain })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Signup failed');
        }

        // Don't store user in localStorage — they need to login with temp password
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
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to fetch users');
        }
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
    },

    // Password Management
    async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
        const response = await fetch(`${API_URL}/users/${userId}/password`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword, newPassword })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to change password');
        }

        // Update stored user to clear must_change_password
        const userStr = localStorage.getItem('insightAI_currentUser');
        if (userStr) {
            const user = JSON.parse(userStr);
            user.must_change_password = false;
            localStorage.setItem('insightAI_currentUser', JSON.stringify(user));
        }
    },

    async forgotPassword(email: string): Promise<any> {
        const response = await fetch(`${API_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to send OTP');
        }
        return data;
    },

    async verifyOtp(email: string, otp: string): Promise<any> {
        const response = await fetch(`${API_URL}/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'OTP verification failed');
        }
        return data;
    },

    async resetPassword(email: string, otp: string, newPassword: string): Promise<any> {
        const response = await fetch(`${API_URL}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp, newPassword })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Password reset failed');
        }
        return data;
    },

    // Organization Management
    async getOrganizations(): Promise<any[]> {
        const response = await fetch(`${API_URL}/organizations`);
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to fetch organizations');
        }
        return await response.json();
    },

    async createOrganization(name: string): Promise<any> {
        const response = await fetch(`${API_URL}/organizations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to create organization');
        }
        return await response.json();
    },

    async deleteOrganization(id: string): Promise<void> {
        const response = await fetch(`${API_URL}/organizations/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to delete organization');
        }
    },

    async getOrganizationUsers(orgId: string): Promise<any[]> {
        const response = await fetch(`${API_URL}/organizations/${orgId}/users`);
        if (!response.ok) throw new Error('Failed to fetch organization users');
        return await response.json();
    },

    // User Organization & Superuser
    async updateUserOrganization(userId: number, organizationId: string | null): Promise<void> {
        const response = await fetch(`${API_URL}/users/${userId}/organization`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ organizationId })
        });
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to update user organization');
        }
    },

    async updateUserSuperuser(userId: number, isSuperuser: boolean): Promise<void> {
        const response = await fetch(`${API_URL}/users/${userId}/superuser`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isSuperuser })
        });
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to update superuser status');
        }
    },

    async updateUserPricing(userId: number, pricing: 'Pro' | 'Premium' | 'Elite'): Promise<void> {
        const response = await fetch(`${API_URL}/users/${userId}/pricing`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pricing })
        });
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to update pricing');
        }
    },

    async updateUserDuration(userId: number, duration: string): Promise<void> {
        const response = await fetch(`${API_URL}/users/${userId}/duration`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ duration })
        });
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to update duration');
        }
    },
    
    async bulkSignup(users: any[]): Promise<any> {
        const response = await fetch(`${API_URL}/admin/users/bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ users })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Bulk signup failed');
        }
        return data;
    }
};
