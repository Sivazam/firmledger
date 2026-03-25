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
import { usePDF } from '../../hooks/usePDF';
import { pdf } from '@react-pdf/renderer';
import ReportDocument from '../../components/pdf/ReportDocument';
import { TRANSACTION_TYPE_LABELS } from '../../config/constants';

export default function TransactionsListPage() {
    const { transactions, fetchTransactions, loading, initialized } = useTransactionStore();
    const { profile } = useAuthStore();
    const { sharePDF } = usePDF();
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

    const handleExportExcel = async () => {
        if (filteredTransactions.length === 0) return;
        
        const headers = ['SL No', 'Date', 'Type', 'From Party', 'To Party', 'Amount', 'Description'];
        const rows = filteredTransactions.map(tx => {
            const date = tx.date && (tx.date as any).toDate ? (tx.date as any).toDate().toLocaleDateString() : new Date(tx.date as any).toLocaleDateString();
            return [
                tx.slNo,
                date,
                TRANSACTION_TYPE_LABELS[tx.type] || tx.type,
                tx.fromPartyName,
                tx.toPartyName,
                tx.amount,
                tx.description.replace(/,/g, ' ') // Simple CSV escape
            ];
        });

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const filename = `Transactions_${fromDate}_to_${toDate}.csv`;

        const file = new File([blob], filename, { type: 'text/csv' });
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: 'Transactions Export' });
        } else {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    };

    const handleExportPDF = async () => {
        if (filteredTransactions.length === 0) return;
        try {
            const doc = <ReportDocument title={`Transactions Report (${fromDate} to ${toDate})`} transactions={filteredTransactions} />;
            const blob = await pdf(doc).toBlob();
            await sharePDF(blob, `Transactions_${fromDate}_to_${toDate}.pdf`);
        } catch (err) {
            console.error('PDF export failed', err);
        }
    };

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
                onExportExcel={handleExportExcel}
                onExportPDF={handleExportPDF}
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
