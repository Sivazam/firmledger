import { Timestamp } from 'firebase/firestore';

export type UserType = 'admin' | 'user';

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    phone: string;
    address: string;
    city: string;
    pincode: string;
    userType: UserType;
    organizationId: string | null;
    profileComplete: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface UsernameMapping {
    uid: string;
    email: string;
}
