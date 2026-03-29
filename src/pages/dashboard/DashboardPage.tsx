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
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import HistoryIcon from '@mui/icons-material/History';
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

    const getFirstName = (name: string) => {
        const parts = name.trim().split(/\s+/);
        if (parts.length > 1 && parts[0].length === 1) {
            return parts[1];
        }
        return parts[0] || 'User';
    };

    const stats = useMemo(() => {
        const today = dayjs.tz().startOf('day');

        const cashParty = parties.find(p => p.code === 'CASH');
        const baseBalance = cashParty ? (cashParty.balanceType === 'Debit' ? (cashParty.openingBalance || 0) : -(cashParty.openingBalance || 0)) : 0;

        let todaysReceipts = 0;
        let todaysPayments = 0;
        let sumCrBeforeToday = 0;
        let sumCpBeforeToday = 0;
        let sumCrToday = 0;
        let sumCpToday = 0;

        transactions.forEach(tx => {
            const txDateRaw = (tx.date as any).toDate ? (tx.date as any).toDate() : new Date(tx.date as any);
            const txDate = dayjs.tz(txDateRaw).startOf('day');
            const isToday = txDate.isSame(today, 'day');
            const isBeforeToday = txDate.isBefore(today);

            if (tx.type === TransactionType.CR) {
                if (isToday) {
                    todaysReceipts += tx.amount;
                    sumCrToday += tx.amount;
                } else if (isBeforeToday) {
                    sumCrBeforeToday += tx.amount;
                }
            } else if (tx.type === TransactionType.CP) {
                if (isToday) {
                    todaysPayments += tx.amount;
                    sumCpToday += tx.amount;
                } else if (isBeforeToday) {
                    sumCpBeforeToday += tx.amount;
                }
            }
        });

        const dashboardOpeningBalance = baseBalance + sumCrBeforeToday - sumCpBeforeToday;
        const dashboardClosingBalance = dashboardOpeningBalance + sumCrToday - sumCpToday;

        return {
            todaysReceipts,
            todaysPayments,
            dashboardOpeningBalance,
            dashboardClosingBalance
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
        <Box mb={3}>
            <Typography 
                variant="h4" 
                sx={{ 
                    fontWeight: 800, 
                    color: 'text.primary',
                    letterSpacing: '-0.04em'
                }}
            >
                Good {dayjs().hour() < 12 ? 'Morning' : dayjs().hour() < 17 ? 'Afternoon' : 'Evening'}, 
                <Box component="span" sx={{ color: 'primary.main', ml: 1.5 }}>
                    {getFirstName(profile?.displayName || 'User')}
                </Box>
            </Typography>
        </Box>

            <Grid container spacing={3}>
                {/* 1. Cash Opening Balance */}
                <Grid size={{ xs: 12, sm: 6 }}>
                    <Card sx={{ borderLeft: 6, borderColor: 'info.main' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography variant="body2" color="text.secondary" textTransform="uppercase" fontWeight="700" fontSize="0.7rem" gutterBottom>Cash Opening Balance</Typography>
                                <Typography variant="h5" fontWeight="800" color="info.main">
                                    {formatINR(stats.dashboardOpeningBalance)}
                                </Typography>
                            </Box>
                            <Box sx={{ bgcolor: 'rgba(3, 169, 244, 0.15)', p: 1, borderRadius: 2 }}>
                                <HistoryIcon sx={{ fontSize: 32, color: 'info.main' }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* 2. Todays Receipts */}
                <Grid size={{ xs: 12, sm: 6 }}>
                    <Card>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography variant="body2" color="text.secondary" textTransform="uppercase" fontWeight="700" fontSize="0.7rem" gutterBottom>Today's Receipts</Typography>
                                <Typography variant="h5" fontWeight="800" color="success.main">
                                    {formatINR(stats.todaysReceipts)}
                                </Typography>
                            </Box>
                            <Box sx={{ bgcolor: 'rgba(76, 175, 80, 0.15)', p: 1, borderRadius: 2 }}>
                                <TrendingUpIcon sx={{ fontSize: 32, color: 'success.main' }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* 3. Todays Payments */}
                <Grid size={{ xs: 12, sm: 6 }}>
                    <Card>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography variant="body2" color="text.secondary" textTransform="uppercase" fontWeight="700" fontSize="0.7rem" gutterBottom>Today's Payments</Typography>
                                <Typography variant="h5" fontWeight="800" color="error.main">
                                    {formatINR(stats.todaysPayments)}
                                </Typography>
                            </Box>
                            <Box sx={{ bgcolor: 'rgba(211, 47, 47, 0.15)', p: 1, borderRadius: 2 }}>
                                <TrendingDownIcon sx={{ fontSize: 32, color: 'error.main' }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* 4. Cash Closing Balance */}
                <Grid size={{ xs: 12, sm: 6 }}>
                    <Card sx={{ borderLeft: 6, borderColor: 'primary.main', bgcolor: 'primary.light', color: 'primary.contrastText', backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography variant="body2" sx={{ opacity: 0.8 }} textTransform="uppercase" fontWeight="700" fontSize="0.7rem" gutterBottom>Cash Closing Balance</Typography>
                                <Typography variant="h5" fontWeight="800">
                                    {formatINR(stats.dashboardClosingBalance)}
                                </Typography>
                            </Box>
                            <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.2)' }}>
                                <AccountBalanceWalletIcon sx={{ fontSize: 36, color: 'white' }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

            </Grid>
        </Box>
    );
}
