import { doc, runTransaction } from 'firebase/firestore';
import { db } from '../config/firebase';

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

    async getNextSlNo(orgId: string): Promise<number> {
        const counterRef = doc(db, 'counters', orgId);
        return runTransaction(db, async (transaction) => {
            const docSnap = await transaction.get(counterRef);
            let lastSlNo = 0;
            if (docSnap.exists() && docSnap.data().lastSlNo) {
                lastSlNo = docSnap.data().lastSlNo;
            }
            const nextSlNo = lastSlNo + 1;
            transaction.set(counterRef, { lastSlNo: nextSlNo }, { merge: true });
            return nextSlNo;
        });
    }
};
