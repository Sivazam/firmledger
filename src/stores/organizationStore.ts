import { create } from 'zustand';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { OrganizationService } from '../services/organization.service';
import type { Organization } from '../types/organization.types';

interface OrganizationState {
    currentOrganization: Organization | null;
    loading: boolean;
    initialized: boolean;
    fetchOrganization: (orgId: string) => Promise<void>;
    subscribeToOrganization: (orgId: string) => () => void;
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

    subscribeToOrganization: (orgId: string) => {
        set({ loading: true });
        const unsub = onSnapshot(doc(db, 'organizations', orgId), (snap) => {
            if (snap.exists()) {
                set({ currentOrganization: snap.data() as Organization, initialized: true, loading: false });
            } else {
                set({ currentOrganization: null, initialized: true, loading: false });
            }
        }, (error) => {
            console.error('Organization subscription error:', error);
            set({ loading: false });
        });
        return unsub;
    },

    setOrganization: (org) => set({ currentOrganization: org, initialized: true })
}));
