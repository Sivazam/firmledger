import { Timestamp } from 'firebase/firestore';
import { TransactionType } from '../config/constants';

export interface Transaction {
    id: string;
    slNo: string | number;
    date: Timestamp;
    type: TransactionType;
    fromPartyId: string;
    fromPartyName: string;
    toPartyId: string;
    toPartyName: string;
    description: string;
    amount: number; // in paisa
    createdBy: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
