import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import dayjs from 'dayjs';
import AddIcon from '@mui/icons-material/Add';
import { useTransactionStore } from '../../stores/transactionStore';
import { useAuthStore } from '../../stores/authStore';
import TransactionCard from '../../components/transaction/TransactionCard';
import TransactionFilters from '../../components/transaction/TransactionFilters';
import FloatingActionButton from '../../components/common/FloatingActionButton';
import { useNavigate } from 'react-router-dom';

export default function TransactionsListPage() {
    const { transactions, fetchTransactions, loading, initialized } = useTransactionStore();
    const { profile } = useAuthStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [fromDate, setFromDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
    const [toDate, setToDate] = useState(dayjs().format('YYYY-MM-DD'));
    const navigate = useNavigate();

    useEffect(() => {
        if (profile?.organizationId && !initialized) {
            fetchTransactions(profile.organizationId);
        }
    }, [profile?.organizationId, initialized, fetchTransactions]);

    const filteredTransactions = transactions.filter(tx => {
        const txDate = tx.date && (tx.date as any).toDate ? dayjs((tx.date as any).toDate()) : dayjs(tx.date as any);
        const isWithinDate = txDate.isAfter(dayjs(fromDate).subtract(1, 'day')) && 
                             txDate.isBefore(dayjs(toDate).add(1, 'day'));
        
        const matchSearch = tx.slNo.toString().includes(searchTerm) ||
            tx.fromPartyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tx.toPartyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tx.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchType = selectedType ? tx.type === selectedType : true;
        
        return isWithinDate && matchSearch && matchType;
    });

    return (
        <Box>
            <TransactionFilters
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedType={selectedType}
                setSelectedType={setSelectedType}
                fromDate={fromDate}
                setFromDate={setFromDate}
                toDate={toDate}
                setToDate={setToDate}
            />

            {loading ? (
                <Typography textAlign="center">Loading transactions...</Typography>
            ) : filteredTransactions.length > 0 ? (
                filteredTransactions.map(tx => <TransactionCard key={tx.id} tx={tx} />)
            ) : (
                <Typography textAlign="center" color="text.secondary" mt={4}>
                    No transactions found.
                </Typography>
            )}

            <FloatingActionButton
                key="transactions-fab"
                icon={<AddIcon />}
                onClick={() => navigate('/transactions/record')}
            />
        </Box>
    );
}
