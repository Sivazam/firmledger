import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    signInWithPopup,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import type { UserProfile } from '../types/user.types';

const googleProvider = new GoogleAuthProvider();

export const AuthService = {
    async isUsernameAvailable(username: string): Promise<boolean> {
        const userDoc = doc(db, 'usernames', username);
        const snap = await getDoc(userDoc);
        return !snap.exists();
    },

    async registerWithUsername(username: string, email: string, uid: string) {
        const userDoc = doc(db, 'usernames', username);
        const snap = await getDoc(userDoc);
        if (snap.exists()) {
            throw new Error('Username already taken.');
        }
        await setDoc(userDoc, { uid, email });
    },

    async getEmailFromUsername(username: string): Promise<string> {
        const userDoc = doc(db, 'usernames', username);
        const snap = await getDoc(userDoc);
        if (!snap.exists()) {
            throw new Error('Username not found.');
        }
        return snap.data().email;
    },

    async createUserProfile(uid: string, profileData: Partial<UserProfile>) {
        await setDoc(doc(db, 'users', uid), {
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

    logout() {
        return signOut(auth);
    }
};
