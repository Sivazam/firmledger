import { doc, setDoc, getDoc, updateDoc, serverTimestamp, collection, query, where, getCountFromServer, onSnapshot, QuerySnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import type { Organization } from '../types/organization.types';

export const OrganizationService = {
    async createOrganization(orgId: string, orgData: Partial<Organization>, isAdmin: boolean = false) {
        await setDoc(doc(db, 'organizations', orgId), {
            ...orgData,
            id: orgId,
            isOwnerAdmin: isAdmin,
            status: isAdmin ? 'approved' : 'pending',
            approvedBy: isAdmin ? 'system' : null,
            approvedAt: isAdmin ? serverTimestamp() : null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        if (orgData.ownerId) {
            await updateDoc(doc(db, 'users', orgData.ownerId), {
                organizationId: orgId,
                updatedAt: serverTimestamp()
            });

            // Create default system parties
            const systemParties = [
                { id: 'party_cash', code: 'CASH', name: 'Cash in Hand', category: 'Balance Sheet' },
                { id: 'party_sale', code: 'SALE', name: 'SALES', category: 'Trading' },
                { id: 'party_purc', code: 'PURC', name: 'PURCHASE', category: 'Trading' },
                { id: 'party_sret', code: 'SRET', name: 'SALES RETURN', category: 'Trading' },
                { id: 'party_pret', code: 'PRET', name: 'PURCHASE RETURN', category: 'Trading' },
                { id: 'party_disc', code: 'DISC', name: 'DISCOUNT', category: 'P & L' }
            ];

            const partyPromises = systemParties.map(party => 
                setDoc(doc(db, 'organizations', orgId, 'parties', party.id), {
                    id: party.id,
                    code: party.code,
                    name: party.name,
                    category: party.category,
                    address: 'System Default',
                    town: orgData.city || 'Local',
                    phoneNumber: '0000000000',
                    openingBalance: 0,
                    balanceType: 'Debit',
                    isSystem: true,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                })
            );

            await Promise.all(partyPromises);
        }
    },

    async getOrganization(orgId: string): Promise<Organization | null> {
        const snap = await getDoc(doc(db, 'organizations', orgId));
        if (!snap.exists()) return null;
        return snap.data() as Organization;
    },

    async uploadLogo(orgId: string, file: File): Promise<string> {
        const storageRef = ref(storage, `logos/${orgId}/${file.name}`);
        await uploadBytes(storageRef, file);
        return getDownloadURL(storageRef);
    },

    /**
     * Returns how many users (active or deactivated) belong to this org.
     * If > 1, the UI shows attribution chips on transactions.
     */
    async getOrgMemberCount(orgId: string): Promise<number> {
        const q = query(
            collection(db, 'users'),
            where('organizationId', '==', orgId),
            where('status', '==', 'approved')
        );
        const snap = await getCountFromServer(q);
        return snap.data().count;
    },

    /**
     * Listens for changes in the organization's approved member list.
     */
    subscribeToOrgMembers(orgId: string, callback: (count: number) => void): () => void {
        const q = query(
            collection(db, 'users'),
            where('organizationId', '==', orgId),
            where('status', '==', 'approved')
        );
        return onSnapshot(q, (snap) => {
            callback(snap.size);
        });
    }
};
