import { doc, getDocs, updateDoc, collection, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Organization, OrganizationStatus  } from '../types/organization.types';
import type { UserProfile } from '../types/user.types';

export const AdminService = {
    async getAllOrganizations(): Promise<Organization[]> {
        const snap = await getDocs(collection(db, 'organizations'));
        const allOrgs = snap.docs.map(doc => doc.data() as Organization);

        // Fetch all system admins (admin and super-admin) to exclude their test orgs
        const adminQuery = query(collection(db, 'users'), where('userType', 'in', ['admin', 'super-admin']));
        const adminSnap = await getDocs(adminQuery);
        const systemAdminIds = new Set(adminSnap.docs.map(d => d.id));

        // Only show orgs that are NOT system-owned
        return allOrgs.filter(org => !systemAdminIds.has(org.ownerId) && org.isOwnerAdmin !== true);
    },

    async updateOrganizationStatus(orgId: string, status: OrganizationStatus, ownerId: string, adminId: string, hasBusinessTransactions: boolean = false) {
        // Update Organization Status
        await updateDoc(doc(db, 'organizations', orgId), {
            status,
            hasBusinessTransactions,
            approvedBy: adminId,
            approvedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        // Sync Owner's User Status (so they aren't stuck on the pending screen)
        await updateDoc(doc(db, 'users', ownerId), {
            status,
            updatedAt: serverTimestamp()
        });
    },

    async getAllUsers(): Promise<UserProfile[]> {
        // ONLY fetch 'user' role (Organization Owners and Staff)
        // Exclude SaaS admins/super-admins from the customer lists
        const q = query(collection(db, 'users'), where('userType', '==', 'user'));
        const snap = await getDocs(q);
        return snap.docs.map(doc => doc.data() as UserProfile);
    },

    async updateUserStatus(uid: string, status: 'approved' | 'denied' | 'pending') {
        await updateDoc(doc(db, 'users', uid), {
            status,
            updatedAt: serverTimestamp()
        });
    },

    /**
     * Returns all non-owner members of an organization.
     * @param orgId  - The organization ID
     * @param ownerId - The owner's UID to exclude from results
     */
    async getMembersForOrg(orgId: string, ownerId: string): Promise<UserProfile[]> {
        const q = query(
            collection(db, 'users'),
            where('organizationId', '==', orgId)
        );
        const snap = await getDocs(q);
        return snap.docs
            .map(d => d.data() as UserProfile)
            .filter(u => u.uid !== ownerId); // exclude org owner
    }
};
