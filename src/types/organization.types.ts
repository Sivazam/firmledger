import { Timestamp } from 'firebase/firestore';

export type OrganizationStatus = 'pending' | 'approved' | 'denied';

export interface Organization {
    id: string;
    ownerId: string;
    orgName: string;
    address: string;
    city: string;
    pincode: string;
    gstNumber: string;
    logoUrl: string | null;
    status: OrganizationStatus;
    approvedBy: string | null;
    approvedAt: Timestamp | null;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
