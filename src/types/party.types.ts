import { Timestamp } from 'firebase/firestore';

export type PartyCategory = 'CASH' | 'BANK' | 'CUSTOMER' | 'SUPPLIER' | 'REVENUE' | 'EXPENSE' | 'CAPITAL' | 'OTHER';

export interface Party {
    id: string;
    code: string;
    name: string;
    category: PartyCategory;
    fatherName: string;
    address: string;
    town: string;
    phoneNumber: string;
    aadharNumber: string;
    panNumber: string;
    gstNumber: string;
    isSystem?: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
