import { Timestamp } from 'firebase/firestore';

export interface Party {
    id: string;
    code: string;
    name: string;
    fatherName: string;
    address: string;
    town: string;
    phoneNumber: string;
    aadharNumber: string;
    panNumber: string;
    gstNumber: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
