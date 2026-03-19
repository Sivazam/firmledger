import { create } from 'zustand';
import { OrganizationService } from '../services/organization.service';
import type { Organization } from '../types/organization.types';

interface OrganizationState {
    currentOrganization: Organization | null;
    loading: boolean;
    initialized: boolean;
    fetchOrganization: (orgId: string) => Promise<void>;
    setOrganization: (org: Organization | null) => void;
}

export const useOrganizationStore = create<OrganizationState>((set) => ({
    currentOrganization: null,
    loading: false,
    initialized: false,

    fetchOrganization: async (orgId: string) => {
        set({ loading: true });
        try {
            const org = await OrganizationService.getOrganization(orgId);
            set({ currentOrganization: org, initialized: true });
        } catch (error) {
            console.error('Failed to fetch organization:', error);
        } finally {
            set({ loading: false });
        }
    },

    setOrganization: (org) => set({ currentOrganization: org, initialized: true })
}));
