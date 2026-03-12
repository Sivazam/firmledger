import React, { useEffect, useMemo } from 'react';
import { Box, Typography, Grid, Card, CardContent, CircularProgress } from '@mui/material';
import { useAuthStore } from '../../stores/authStore';
import { usePartyStore } from '../../stores/partyStore';
import { useTransactionStore } from '../../stores/transactionStore';
import { TransactionType } from '../../config/constants';
import { formatINR } from '../../utils/formatters';
import dayjs from 'dayjs';
import PeopleIcon from '@mui/icons-material/People';
import ReceiptIcon from '@mui/icons-material/Receipt';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

export default function DashboardPage() {
    const { profile } = useAuthStore();
    const { parties, fetchParties, loading: partiesLoading, initialized: partiesInit } = usePartyStore();
    const { transactions, fetchTransactions, loading: txLoading, initialized: txInit } = useTransactionStore();

    useEffect(() => {
        if (profile?.organizationId) {
            if (!partiesInit) fetchParties(profile.organizationId);
            if (!txInit) fetchTransactions(profile.organizationId);
        }
    }, [profile?.organizationId, partiesInit, txInit, fetchParties, fetchTransactions]);

    const stats = useMemo(() => {
        const today = dayjs().startOf('day');

        let todaysReceipts = 0;
        let todaysPayments = 0;
        let totalReceivables = 0; // Simplified
        let totalPayables = 0; // Simplified

        transactions.forEach(tx => {
            const txDate = tx.date.toDate();
            const isToday = dayjs(txDate).isSame(today, 'day');

            if (tx.type === TransactionType.RECEIPT) {
                if (isToday) todaysReceipts += tx.amount;
                totalReceivables -= tx.amount; // Very basic logic just for dashboard visuals
            } else if (tx.type === TransactionType.PAYMENT) {
                if (isToday) todaysPayments += tx.amount;
                totalPayables -= tx.amount;
            } else if (tx.type === TransactionType.SALES) {
                totalReceivables += tx.amount;
            } else if (tx.type === TransactionType.PURCHASE) {
                totalPayables += tx.amount;
            }
        });

        return {
            totalParties: parties.length,
            totalTransactions: transactions.length,
            todaysReceipts,
            todaysPayments,
        };
    }, [parties, transactions]);

    if (partiesLoading || txLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h5" fontWeight="bold" mb={1}>Dashboard</Typography>
            <Typography color="text.secondary" mb={4}>Welcome back to FirmLedger</Typography>

            <Grid container spacing={2}>
                <Grid size={{ xs: 6, sm: 3 }}>
                    <Card sx={{ height: '100%', borderTop: '4px solid #1E40AF' }}>
                        <CardContent>
                            <PeopleIcon color="primary" sx={{ mb: 1 }} />
                            <Typography variant="h4" fontWeight="bold" color="text.primary">{stats.totalParties}</Typography>
                            <Typography variant="body2" color="text.secondary" textTransform="uppercase" fontWeight="500">Total Parties</Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 6, sm: 3 }}>
                    <Card sx={{ height: '100%', borderTop: '4px solid #0F766E' }}>
                        <CardContent>
                            <ReceiptIcon color="secondary" sx={{ mb: 1 }} />
                            <Typography variant="h4" fontWeight="bold" color="text.primary">{stats.totalTransactions}</Typography>
                            <Typography variant="body2" color="text.secondary" textTransform="uppercase" fontWeight="500">Total Transactions</Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                    <Card sx={{ height: '100%', borderTop: '4px solid #10b981' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography variant="body2" color="text.secondary" textTransform="uppercase" fontWeight="500" gutterBottom>Today's Receipts</Typography>
                                <Typography variant="h5" fontWeight="bold" color="text.primary">
                                    {formatINR(stats.todaysReceipts)}
                                </Typography>
                            </Box>
                            <TrendingUpIcon sx={{ fontSize: 40, color: '#10b981', opacity: 0.15 }} />
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                    <Card sx={{ height: '100%', borderTop: '4px solid #ef4444' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography variant="body2" color="text.secondary" textTransform="uppercase" fontWeight="500" gutterBottom>Today's Payments</Typography>
                                <Typography variant="h5" fontWeight="bold" color="text.primary">
                                    {formatINR(stats.todaysPayments)}
                                </Typography>
                            </Box>
                            <TrendingDownIcon sx={{ fontSize: 40, color: '#ef4444', opacity: 0.15 }} />
                        </CardContent>
                    </Card>
                </Grid>

            </Grid>
        </Box>
    );
}
