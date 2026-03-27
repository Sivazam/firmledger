import { doc, getDocs, updateDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Organization, OrganizationStatus  } from '../types/organization.types';

export const AdminService = {
    async getAllOrganizations(): Promise<Organization[]> {
        const snap = await getDocs(collection(db, 'organizations'));
        const orgs = snap.docs.map(doc => doc.data() as Organization);
        
        // Fetch all user profiles to determine roles accurately
        const usersSnap = await getDocs(collection(db, 'users'));
        const userRoles = new Map<string, string>();
        usersSnap.forEach(doc => {
            userRoles.set(doc.id, doc.data().userType);
        });

        // Filter out any organization where the owner is an admin or super-admin
        return orgs.filter(org => {
            if (org.isOwnerAdmin === true) return false;
            const role = userRoles.get(org.ownerId);
            if (role === 'admin' || role === 'super-admin') return false;
            return true;
        });
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
