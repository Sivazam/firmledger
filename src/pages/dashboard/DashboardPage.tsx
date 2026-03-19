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
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import TransactionCard from '../../components/transaction/TransactionCard';
import { Link } from 'react-router-dom';

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
            const txDate = (tx.date as any).toDate ? (tx.date as any).toDate() : new Date(tx.date as any);
            const isToday = dayjs(txDate).isSame(today, 'day');

            if (tx.type === TransactionType.CR || tx.type === TransactionType.BR) {
                if (isToday) todaysReceipts += tx.amount;
                totalReceivables -= tx.amount; 
            } else if (tx.type === TransactionType.CP || tx.type === TransactionType.BP) {
                if (isToday) todaysPayments += tx.amount;
                totalPayables -= tx.amount;
            } else if (tx.type === TransactionType.SI) {
                totalReceivables += tx.amount;
            } else if (tx.type === TransactionType.PI) {
                totalPayables += tx.amount;
            }
        });

        return {
            totalParties: parties.length,
            totalTransactions: transactions.length,
            todaysReceipts,
            todaysPayments,
            recentTransactions: [...transactions]
                .sort((a, b) => {
                    const dateA = (a.date as any).toDate ? (a.date as any).toDate().getTime() : new Date(a.date as any).getTime();
                    const dateB = (b.date as any).toDate ? (b.date as any).toDate().getTime() : new Date(b.date as any).getTime();
                    return dateB - dateA;
                })
                .slice(0, 5)
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

            <Grid container spacing={3}>
                <Grid size={{ xs: 6, sm: 3 }}>
                    <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
                        <CardContent>
                            <PeopleIcon sx={{ mb: 1, opacity: 0.8 }} />
                            <Typography variant="h4" fontWeight="800">{stats.totalParties}</Typography>
                            <Typography variant="body2" sx={{ opacity: 0.8, textTransform: 'uppercase', fontWeight: 700, fontSize: '0.7rem' }}>Parties</Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 6, sm: 3 }}>
                    <Card sx={{ bgcolor: 'secondary.main', color: 'white' }}>
                        <CardContent>
                            <ReceiptIcon sx={{ mb: 1, opacity: 0.8 }} />
                            <Typography variant="h4" fontWeight="800">{stats.totalTransactions}</Typography>
                            <Typography variant="body2" sx={{ opacity: 0.8, textTransform: 'uppercase', fontWeight: 700, fontSize: '0.7rem' }}>Transactions</Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                    <Card>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography variant="body2" color="text.secondary" textTransform="uppercase" fontWeight="700" fontSize="0.7rem" gutterBottom>Today's Receipts</Typography>
                                <Typography variant="h5" fontWeight="800" color="success.main">
                                    {formatINR(stats.todaysReceipts)}
                                </Typography>
                            </Box>
                            <Box sx={{ bgcolor: 'success.light', p: 1, borderRadius: 2, opacity: 0.2 }}>
                                <TrendingUpIcon sx={{ fontSize: 32, color: 'success.main' }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                    <Card>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography variant="body2" color="text.secondary" textTransform="uppercase" fontWeight="700" fontSize="0.7rem" gutterBottom>Today's Payments</Typography>
                                <Typography variant="h5" fontWeight="800" color="error.main">
                                    {formatINR(stats.todaysPayments)}
                                </Typography>
                            </Box>
                            <Box sx={{ bgcolor: 'error.light', p: 1, borderRadius: 2, opacity: 0.2 }}>
                                <TrendingDownIcon sx={{ fontSize: 32, color: 'error.main' }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mt={2} mb={1}>
                        <Typography variant="h6" fontWeight="bold">Recent Transactions</Typography>
                        <Typography component={Link} to="/transactions" sx={{ color: 'primary.main', textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            View All <ArrowForwardIosIcon sx={{ fontSize: 12 }} />
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        {stats.recentTransactions.length > 0 ? (
                            stats.recentTransactions.map(tx => <TransactionCard key={tx.id} tx={tx} />)
                        ) : (
                            <Typography color="text.secondary" textAlign="center" py={4}>No recent transactions</Typography>
                        )}
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
}
