import { doc, setDoc, getDoc, updateDoc, serverTimestamp, collection, query, where, getCountFromServer, onSnapshot, QuerySnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import type { Organization } from '../types/organization.types';

export const OrganizationService = {
    async createOrganization(orgId: string, orgData: Partial<Organization>, autoApprove: boolean = false) {
        const isSystemAdmin = orgData.isOwnerAdmin === true;
        const status = autoApprove ? 'approved' : 'pending';
        
        await setDoc(doc(db, 'organizations', orgId), {
            ...orgData,
            id: orgId,
            isOwnerAdmin: isSystemAdmin,
            status: status,
            approvedBy: autoApprove ? 'system' : null,
            approvedAt: autoApprove ? serverTimestamp() : null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        if (orgData.ownerId) {
            await updateDoc(doc(db, 'users', orgData.ownerId), {
                organizationId: orgId,
                status: status,
                profileComplete: true,
                updatedAt: serverTimestamp()
            });

            // Create default system parties (Restricted)
            const restrictedParties = [
                { id: 'party_cash', code: 'CASH', name: 'Cash in Hand', category: 'Balance Sheet' },
                { id: 'party_sale', code: 'SALE', name: 'SALES', category: 'Trading' },
                { id: 'party_purc', code: 'PURC', name: 'PURCHASE', category: 'Trading' },
                { id: 'party_sret', code: 'SRET', name: 'SALES RETURN', category: 'Trading' },
                { id: 'party_pret', code: 'PRET', name: 'PURCHASE RETURN', category: 'Trading' },
                { id: 'party_disc', code: 'DISC', name: 'DISCOUNT', category: 'P & L' }
            ];

            // Create new P&L default parties (Editable/Deletable)
            const plParties = [
                { code: '3001', name: 'LICENCES & FEES A/C' },
                { code: '3002', name: 'TRAVELLING A/C' },
                { code: '3003', name: 'INTEREST A/C' },
                { code: '3004', name: 'AUDIT FEE A/C' },
                { code: '3006', name: 'BANK CHARGES A/C' },
                { code: '3007', name: 'REMUNITATIONS A/C' },
                { code: '3008', name: 'INCOME TAX A/C' },
                { code: '3009', name: 'INSURANCE A/C' },
                { code: '3010', name: 'POSTAGE A/C' },
                { code: '3011', name: 'PACKING MATERIAL A/C' },
                { code: '3012', name: 'PRINTING & STATIONERY A/C' },
                { code: '3013', name: 'REPAIRS A/C' },
                { code: '3014', name: 'RENT A/C' },
                { code: '3015', name: 'SADAR A/C' },
                { code: '3016', name: 'ELECTRICITY A/C' },
                { code: '3017', name: 'TRANSPORT CHARGES A/C' },
                { code: '3018', name: 'INCENTIVE A/C' },
                { code: '3019', name: 'TELEPHONE CHARGES A/C' },
                { code: '3020', name: 'VEHICLE MAINTANENCE A/C' },
                { code: '3021', name: 'GIFTS A/C' },
                { code: '3022', name: 'SALARIES A/C' },
                { code: '3025', name: 'BONUS A/C' },
                { code: '3026', name: 'STAFF WELFARE A/C' },
                { code: '3027', name: 'PROFESSIONAL TAX A/C' },
                { code: '3028', name: 'ROUTE CHARGES (LINE EXP) A/C' },
                { code: '3029', name: 'DEPRECIATION A/C' },
                { code: '3030', name: 'INTEREST ON OD A/C' },
                { code: '3031', name: 'INTEREST TO CREDITORS A/C' },
                { code: '3032', name: 'INTEREST ON DEPOSITS A/C' },
                { code: '3033', name: 'INTEREST ON CAPITALS A/C' },
                { code: '3034', name: 'COMPUTER MAINTENANCE A/C' },
                { code: '3038', name: 'VATTAX PAID A/C' }
            ];

            const restrictedPromises = restrictedParties.map(party => 
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

            const plPromises = plParties.map(party => {
                const id = `party_${party.code}`;
                return setDoc(doc(db, 'organizations', orgId, 'parties', id), {
                    id: id,
                    code: party.code,
                    name: party.name,
                    category: 'P & L',
                    address: 'Local',
                    town: orgData.city || 'Local',
                    phoneNumber: '0000000000',
                    openingBalance: 0,
                    balanceType: 'Debit',
                    isSystem: false, // User can edit/delete these
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
            });

            await Promise.all([...restrictedPromises, ...plPromises]);
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
