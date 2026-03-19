import { create } from 'zustand';
import type { Transaction  } from '../types/transaction.types';
import { TransactionService } from '../services/transaction.service';

interface TransactionState {
    transactions: Transaction[];
    loading: boolean;
    initialized: boolean;
    fetchTransactions: (orgId: string) => Promise<void>;
    addTransactionLocal: (tx: Transaction) => void;
    updateTransactionLocal: (txId: string, data: Partial<Transaction>) => void;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
    transactions: [],
    loading: false,
    initialized: false,

    fetchTransactions: async (orgId: string) => {
        set({ loading: true });
        try {
            const data = await TransactionService.getAllTransactions(orgId);
            set({ transactions: data, initialized: true });
        } catch (error) {
            console.error(error);
        } finally {
            set({ loading: false });
        }
    },

    addTransactionLocal: (tx) => {
        const newTx = [tx, ...get().transactions];
        set({ transactions: newTx.sort((a, b) => {
            const da = (b.date as any).toMillis ? (b.date as any).toMillis() : new Date(b.date as any).getTime();
            const db = (a.date as any).toMillis ? (a.date as any).toMillis() : new Date(a.date as any).getTime();
            if (da !== db) return da - db;
            return String(b.slNo).localeCompare(String(a.slNo), undefined, { numeric: true });
        }) });
    },

    updateTransactionLocal: (txId, data) => {
        const updated = get().transactions.map(t => t.id === txId ? { ...t, ...data } : t);
        set({ transactions: updated.sort((a, b) => {
            const da = (b.date as any).toMillis ? (b.date as any).toMillis() : new Date(b.date as any).getTime();
            const db = (a.date as any).toMillis ? (a.date as any).toMillis() : new Date(a.date as any).getTime();
            if (da !== db) return da - db;
            return String(b.slNo).localeCompare(String(a.slNo), undefined, { numeric: true });
        }) });
    }
}));
