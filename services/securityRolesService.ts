import { fetchWithAuth } from '../utils/fetchWithAuth';
import { SecurityRole, SecurityRoleAssignment } from '../types';
import { API_BASE } from '../config/api';

const API_URL = API_BASE;

export const securityRolesService = {
    // ── Security Roles ────────────────────────────────────────────────────────

    async getRoles(dashboardId: string): Promise<SecurityRole[]> {
        const res = await fetchWithAuth(`${API_URL}/dashboards/${dashboardId}/security-roles`);
        if (!res.ok) throw new Error('Failed to fetch security roles');
        return res.json();
    },

    async createRole(
        dashboardId: string,
        role: Omit<SecurityRole, 'id' | 'dashboard_id' | 'created_at' | 'updated_at'>,
        createdBy: number
    ): Promise<SecurityRole> {
        const res = await fetchWithAuth(`${API_URL}/dashboards/${dashboardId}/security-roles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...role, createdBy }),
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Failed to create security role');
        }
        return res.json();
    },

    async updateRole(
        dashboardId: string,
        roleId: string,
        role: Partial<Omit<SecurityRole, 'id' | 'dashboard_id' | 'created_at'>>
    ): Promise<SecurityRole> {
        const res = await fetchWithAuth(`${API_URL}/dashboards/${dashboardId}/security-roles/${roleId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(role),
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Failed to update security role');
        }
        return res.json();
    },

    async deleteRole(dashboardId: string, roleId: string): Promise<void> {
        const res = await fetchWithAuth(
            `${API_URL}/dashboards/${dashboardId}/security-roles/${roleId}`,
            { method: 'DELETE' }
        );
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Failed to delete security role');
        }
    },

    // ── Security Role Assignments ─────────────────────────────────────────────

    async getAssignments(dashboardId: string): Promise<SecurityRoleAssignment[]> {
        const res = await fetchWithAuth(`${API_URL}/dashboards/${dashboardId}/security-role-assignments`);
        if (!res.ok) throw new Error('Failed to fetch security role assignments');
        return res.json();
    },

    async assignRole(
        dashboardId: string,
        userEmail: string,
        securityRoleId: string,
        assignedBy: number
    ): Promise<SecurityRoleAssignment> {
        const res = await fetchWithAuth(`${API_URL}/dashboards/${dashboardId}/security-role-assignments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userEmail, securityRoleId, assignedBy }),
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Failed to assign security role');
        }
        return res.json();
    },

    async removeAssignment(dashboardId: string, assignmentId: string): Promise<void> {
        const res = await fetchWithAuth(
            `${API_URL}/dashboards/${dashboardId}/security-role-assignments/${assignmentId}`,
            { method: 'DELETE' }
        );
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Failed to remove security role assignment');
        }
    },

    /** Called when a shared user opens a dashboard — fetches their assigned role (if any) */
    async getMyRole(dashboardId: string, email: string): Promise<SecurityRole | null> {
        const res = await fetchWithAuth(
            `${API_URL}/dashboards/${dashboardId}/my-security-role?email=${encodeURIComponent(email)}`
        );
        if (res.status === 404) return null;
        if (!res.ok) throw new Error('Failed to fetch security role');
        const data = await res.json();
        return data.role ?? null;
    },
};
