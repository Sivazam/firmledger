import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    signInWithPopup,
    sendPasswordResetEmail,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import type { UserProfile } from '../types/user.types';

const googleProvider = new GoogleAuthProvider();

export const AuthService = {
    async isUsernameAvailable(username: string): Promise<boolean> {
        const cleanUsername = username.trim().toLowerCase();
        const userDoc = doc(db, 'usernames', cleanUsername);
        const snap = await getDoc(userDoc);
        return !snap.exists();
    },

    async registerWithUsername(username: string, email: string, uid: string) {
        const cleanUsername = username.trim().toLowerCase();
        const userDoc = doc(db, 'usernames', cleanUsername);
        const snap = await getDoc(userDoc);
        if (snap.exists()) {
            throw new Error('Username already taken.');
        }
        await setDoc(userDoc, { uid, email });
    },

    async getEmailFromUsername(username: string): Promise<string> {
        const cleanUsername = username.trim().toLowerCase();
        const userDoc = doc(db, 'usernames', cleanUsername);
        const snap = await getDoc(userDoc);
        if (!snap.exists()) {
            throw new Error('Username not found.');
        }
        return snap.data().email;
    },

    async createUserProfile(uid: string, profileData: Partial<UserProfile>) {
        await setDoc(doc(db, 'users', uid), {
            status: 'approved',
            profileComplete: true,
            ...profileData,
            uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
    },

    async getUserProfile(uid: string): Promise<UserProfile | null> {
        const snap = await getDoc(doc(db, 'users', uid));
        if (!snap.exists()) return null;
        return snap.data() as UserProfile;
    },

    async loginWithGoogle() {
        return signInWithPopup(auth, googleProvider);
    },

    sendPasswordResetEmail(email: string) {
        return sendPasswordResetEmail(auth, email);
    },

    async reauthenticateUser(currentPassword: string) {
        const user = auth.currentUser;
        if (!user || !user.email) throw new Error('No user logged in');
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        return reauthenticateWithCredential(user, credential);
    },

    async updateUserPassword(newPassword: string) {
        const user = auth.currentUser;
        if (!user) throw new Error('No user logged in');
        return updatePassword(user, newPassword);
    },

    logout() {
        return signOut(auth);
    }
};
