import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import type { Organization } from '../types/organization.types';

export const OrganizationService = {
    async createOrganization(orgId: string, orgData: Partial<Organization>, isAdmin: boolean = false) {
        await setDoc(doc(db, 'organizations', orgId), {
            ...orgData,
            id: orgId,
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

            // Create default CASH party
            const cashPartyId = 'party_cash'; // or use a random ID, but 'CASH' as code is important
            await setDoc(doc(db, 'organizations', orgId, 'parties', cashPartyId), {
                id: cashPartyId,
                code: 'CASH',
                name: 'Cash in Hand',
                category: 'CASH',
                address: 'System Default',
                town: orgData.city || 'Local',
                phoneNumber: '0000000000',
                openingBalance: 0,
                balanceType: 'Debit',
                isSystem: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
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
    }
};
