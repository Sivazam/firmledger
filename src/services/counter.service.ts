import { doc, runTransaction } from 'firebase/firestore';
import { db } from '../config/firebase';
import { TransactionType } from '../config/constants';

export const CounterService = {
    async getNextPartyCode(orgId: string): Promise<string> {
        const counterRef = doc(db, 'counters', orgId);
        return runTransaction(db, async (transaction) => {
            const docSnap = await transaction.get(counterRef);
            let lastPartyCode = 0;
            if (docSnap.exists() && docSnap.data().lastPartyCode) {
                lastPartyCode = docSnap.data().lastPartyCode;
            }
            const nextCodeNum = lastPartyCode + 1;
            transaction.set(counterRef, { lastPartyCode: nextCodeNum }, { merge: true });
            return `P${nextCodeNum.toString().padStart(3, '0')}`;
        });
    },

    async getNextSlNo(orgId: string, type: TransactionType): Promise<string> {
        const counterRef = doc(db, 'counters', orgId);
        return runTransaction(db, async (transaction) => {
            const docSnap = await transaction.get(counterRef);
            const fieldName = `lastSlNo_${type}`;
            let lastSlNo = 0;
            if (docSnap.exists() && docSnap.data()[fieldName]) {
                lastSlNo = docSnap.data()[fieldName];
            }
            const nextSlNo = lastSlNo + 1;
            transaction.set(counterRef, { [fieldName]: nextSlNo }, { merge: true });
            return `${type}-${nextSlNo}`;
        });
    }
};
