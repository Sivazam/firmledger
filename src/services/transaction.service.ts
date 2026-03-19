import { collection, doc, setDoc, getDocs, getDoc, updateDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Transaction  } from '../types/transaction.types';
import { CounterService } from './counter.service';

export const TransactionService = {
    async addTransaction(orgId: string, data: Omit<Transaction, 'id' | 'slNo' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
        const slNo = await CounterService.getNextSlNo(orgId, data.type);
        const newDocRef = doc(collection(db, `organizations/${orgId}/transactions`));

        const newTransaction: Transaction = {
            ...data,
            id: newDocRef.id,
            slNo,
            createdAt: serverTimestamp() as any,
            updatedAt: serverTimestamp() as any,
        };

        await setDoc(newDocRef, newTransaction);
        return newTransaction;
    },

    async getTransaction(orgId: string, txId: string): Promise<Transaction | null> {
        const docRef = doc(db, `organizations/${orgId}/transactions`, txId);
        const snap = await getDoc(docRef);
        if (!snap.exists()) return null;
        return snap.data() as Transaction;
    },

    async updateTransaction(orgId: string, txId: string, data: Partial<Transaction>): Promise<void> {
        const docRef = doc(db, `organizations/${orgId}/transactions`, txId);
        await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
    },

    async getAllTransactions(orgId: string): Promise<Transaction[]> {
        const q = query(collection(db, `organizations/${orgId}/transactions`), orderBy('date', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(doc => doc.data() as Transaction);
    }
};
