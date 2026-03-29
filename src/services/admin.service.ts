import { doc, getDocs, updateDoc, collection, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Organization, OrganizationStatus  } from '../types/organization.types';

export const AdminService = {
    async getAllOrganizations(): Promise<Organization[]> {
        const snap = await getDocs(collection(db, 'organizations'));
        const orgs = snap.docs.map(doc => doc.data() as Organization);
        
        // Efficiently fetch ONLY admin/super-admin users to catch legacy organizations mapping
        const q = query(collection(db, 'users'), where('userType', 'in', ['admin', 'super-admin']));
        const adminsSnap = await getDocs(q);
        const adminUserIds = new Set(adminsSnap.docs.map(d => d.id));

        return orgs.filter(org => org.isOwnerAdmin !== true && !adminUserIds.has(org.ownerId));
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
