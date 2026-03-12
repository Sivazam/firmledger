import { create } from 'zustand';
import type { Party } from '../types/party.types';
import { PartyService } from '../services/party.service';

interface PartyState {
    parties: Party[];
    loading: boolean;
    initialized: boolean;
    fetchParties: (orgId: string) => Promise<void>;
    addPartyLocal: (party: Party) => void;
    updatePartyLocal: (partyId: string, data: Partial<Party>) => void;
    removePartyLocal: (partyId: string) => void;
}

export const usePartyStore = create<PartyState>((set, get) => ({
    parties: [],
    loading: false,
    initialized: false,

    fetchParties: async (orgId: string) => {
        set({ loading: true });
        try {
            const data = await PartyService.getAllParties(orgId);
            set({ parties: data, initialized: true });
        } catch (error) {
            console.error(error);
        } finally {
            set({ loading: false });
        }
    },

    addPartyLocal: (party) => {
        const newParties = [...get().parties, party].sort((a, b) => a.name.localeCompare(b.name));
        set({ parties: newParties });
    },

    updatePartyLocal: (partyId, data) => {
        const updated = get().parties.map(p => p.id === partyId ? { ...p, ...data } : p);
        set({ parties: updated.sort((a, b) => a.name.localeCompare(b.name)) });
    },

    removePartyLocal: (partyId) => {
        const remaining = get().parties.filter(p => p.id !== partyId);
        set({ parties: remaining });
    }
}));
