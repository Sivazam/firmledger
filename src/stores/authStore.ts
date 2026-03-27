import { create } from 'zustand';
import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import type { UserProfile } from '../types/user.types';
import { AuthService } from '../services/auth.service';

interface AuthState {
    user: FirebaseUser | null;
    profile: UserProfile | null;
    loading: boolean;
    initialized: boolean;
    setUser: (user: FirebaseUser | null) => void;
    setProfile: (profile: UserProfile | null) => void;
    init: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    profile: null,
    loading: true,
    initialized: false,

    setUser: (user) => set({ user }),
    setProfile: (profile) => set({ profile }),

    init: () => {
        onAuthStateChanged(auth, async (user) => {
            // Only show full loading splash if it's the first initialization
            set((state) => ({ user, loading: !state.initialized ? true : state.loading }));
            if (user) {
                try {
                    const profile = await AuthService.getUserProfile(user.uid);
                    set({ profile });
                } catch (error) {
                    console.error('Failed to fetch user profile:', error);
                }
            } else {
                set({ profile: null });
            }
            set({ loading: false, initialized: true });
        });
    }
}));
