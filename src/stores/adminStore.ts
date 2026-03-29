import { create } from 'zustand';
import { AdminService } from '../services/admin.service';
import type { Organization } from '../types/organization.types';

interface AdminState {
    organizations: Organization[];
    loading: boolean;
    initialized: boolean;
    error: string | null;
    fetchOrganizations: () => Promise<void>;
}

export const useAdminStore = create<AdminState>((set) => ({
    organizations: [],
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
    }
}));
