import { collection, getDocs, doc, updateDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { UserProfile, UserType } from '../types/user.types';

export const SuperAdminService = {
    async getAllUsers(): Promise<UserProfile[]> {
        const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(doc => doc.data() as UserProfile);
    },

    async updateUserRole(uid: string, userType: UserType) {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
            userType,
            updatedAt: serverTimestamp()
        });
    }
};
