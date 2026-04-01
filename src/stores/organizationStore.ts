import { create } from 'zustand';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { OrganizationService } from '../services/organization.service';
import type { Organization } from '../types/organization.types';

interface OrganizationState {
    currentOrganization: Organization | null;
    orgMemberCount: number;   // how many approved members in this org
    loading: boolean;
    initialized: boolean;
    fetchOrganization: (orgId: string) => Promise<void>;
    subscribeToOrganization: (orgId: string) => () => void;
    setOrganization: (org: Organization | null) => void;
    setOrgMemberCount: (count: number) => void;
}

export const useOrganizationStore = create<OrganizationState>((set) => ({
    currentOrganization: null,
    orgMemberCount: 1,   // default to 1 (single-user) until we know
    loading: false,
    initialized: false,

    fetchOrganization: async (orgId: string) => {
        set({ loading: true });
        try {
            const [org, memberCount] = await Promise.all([
                OrganizationService.getOrganization(orgId),
                OrganizationService.getOrgMemberCount(orgId)
            ]);
            set({ currentOrganization: org, orgMemberCount: memberCount, initialized: true });
        } catch (error) {
            console.error('Failed to fetch organization:', error);
        } finally {
            set({ loading: false });
        }
    },

    subscribeToOrganization: (orgId: string) => {
        set({ loading: true });
        // Subscription handles organization details, setOrgMemberCount handles the count via App.tsx listener
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

    setOrganization: (org) => set({ currentOrganization: org, initialized: true }),
    setOrgMemberCount: (count) => set({ orgMemberCount: count })
}));
