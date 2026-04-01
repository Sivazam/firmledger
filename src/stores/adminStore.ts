import { create } from 'zustand';
import { AdminService } from '../services/admin.service';
import type { Organization } from '../types/organization.types';
import type { UserProfile } from '../types/user.types';

interface AdminState {
    organizations: Organization[];
    users: UserProfile[];
    loading: boolean;
    initialized: boolean;
    error: string | null;
    fetchOrganizations: () => Promise<void>;
    fetchUsers: () => Promise<void>;
}

export const useAdminStore = create<AdminState>((set) => ({
    organizations: [],
    users: [],
    loading: false,
    initialized: false,
    error: null,

    fetchOrganizations: async () => {
        set({ loading: true, error: null });
        try {
            const orgs = await AdminService.getAllOrganizations();
            // Server-side logic ensures we only get relevant non-admin orgs, but sort them here by newest
            orgs.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
            set({ organizations: orgs, initialized: true, loading: false });
        } catch (err: any) {
            console.error('Failed to fetch admin organizations:', err);
            set({ error: err.message, loading: false });
        }
    },

    fetchUsers: async () => {
        set({ loading: true, error: null });
        try {
            const users = await AdminService.getAllUsers();
            // Sort by newest
            users.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
            set({ users, loading: false });
        } catch (err: any) {
            console.error('Failed to fetch admin users:', err);
            set({ error: err.message, loading: false });
        }
    }
}));
