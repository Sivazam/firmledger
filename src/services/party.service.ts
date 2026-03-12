import { collection, doc, setDoc, getDocs, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Party } from '../types/party.types';

export const PartyService = {
    async addParty(orgId: string, partyData: Omit<Party, 'id' | 'createdAt' | 'updatedAt'>): Promise<Party> {
        const newDocRef = doc(collection(db, `organizations/${orgId}/parties`));

        const newParty: Party = {
            ...partyData,
            id: newDocRef.id,
            createdAt: serverTimestamp() as any,
            updatedAt: serverTimestamp() as any,
        };

        await setDoc(newDocRef, newParty);
        return newParty;
    },

    async updateParty(orgId: string, partyId: string, partyData: Partial<Party>): Promise<void> {
        const docRef = doc(db, `organizations/${orgId}/parties`, partyId);
        await updateDoc(docRef, {
            ...partyData,
            updatedAt: serverTimestamp()
        });
    },

    async deleteParty(orgId: string, partyId: string): Promise<void> {
        const docRef = doc(db, `organizations/${orgId}/parties`, partyId);
        await deleteDoc(docRef);
    },

    async getAllParties(orgId: string): Promise<Party[]> {
        const q = query(collection(db, `organizations/${orgId}/parties`), orderBy('name', 'asc'));
        const snap = await getDocs(q);
        return snap.docs.map(doc => doc.data() as Party);
    }
};
