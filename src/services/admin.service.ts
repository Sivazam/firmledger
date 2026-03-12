import { doc, getDocs, updateDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Organization, OrganizationStatus  } from '../types/organization.types';

export const AdminService = {
    async getAllOrganizations(): Promise<Organization[]> {
        const snap = await getDocs(collection(db, 'organizations'));
        return snap.docs.map(doc => doc.data() as Organization);
    },

    async updateOrganizationStatus(orgId: string, status: OrganizationStatus, adminId: string) {
        await updateDoc(doc(db, 'organizations', orgId), {
            status,
            approvedBy: adminId,
            approvedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
    }
};
