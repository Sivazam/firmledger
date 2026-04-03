import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { firebaseConfig } from '../config/firebase';

/**
 * Utility to create a secondary user account in Firebase Auth
 * without signing out the currently logged-in user (Admin).
 * 
 * It initializes a temporary secondary Firebase app instance,
 * performs the creation, and then cleans up the app.
 */
export const SecondaryAuthService = {
    async createUser(email: string, password: string, username: string): Promise<string> {
        // Unique app name to avoid collisions if multiple creations happen rapidly
        const appName = `secondary-app-${Date.now()}`;
        const tempApp = initializeApp(firebaseConfig, appName);
        const tempAuth = getAuth(tempApp);

        try {
            const userCredential = await createUserWithEmailAndPassword(tempAuth, email.trim().toLowerCase(), password);
            const user = userCredential.user;

            // Set displayName to username immediately
            await updateProfile(user, { displayName: username });

            return user.uid;
        } finally {
            // Always clean up the secondary app to free memory and prevent leaks
            await deleteApp(tempApp);
        }
    }
};
