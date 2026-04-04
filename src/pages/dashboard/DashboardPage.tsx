import React, { useEffect, useMemo } from 'react';
import { Box, Typography, Grid, Card, CardContent, CircularProgress, Paper } from '@mui/material';
import { useAuthStore } from '../../stores/authStore';
import { usePartyStore } from '../../stores/partyStore';
import { useTransactionStore } from '../../stores/transactionStore';
import { TransactionType } from '../../config/constants';
import { formatINR } from '../../utils/formatters';
import dayjs from 'dayjs';

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
                if (isToday) { todaysReceipts += tx.amount; sumCrToday += tx.amount; }
                else if (isBeforeToday) { sumCrBeforeToday += tx.amount; }
            } else if (tx.type === TransactionType.CP) {
                if (isToday) { todaysPayments += tx.amount; sumCpToday += tx.amount; }
                else if (isBeforeToday) { sumCpBeforeToday += tx.amount; }
            }
        });

        const dashboardOpeningBalance = baseBalance + sumCrBeforeToday - sumCpBeforeToday;
        const dashboardClosingBalance = dashboardOpeningBalance + sumCrToday - sumCpToday;

        return {
            todaysReceipts, todaysPayments,
            dashboardOpeningBalance, dashboardClosingBalance
        };
    }, [parties, transactions]);

    if (partiesLoading || txLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
                <CircularProgress />
            </Box>
        );
    }

    const CardItem = ({ label, value, color }: { label: string, value: string, color: string }) => (
        <Card sx={{ 
            borderRadius: 2.5, 
            boxShadow: 'none', 
            border: '1px solid #E2E8F0', 
            borderLeft: `4px solid ${color}`,
            transition: 'all 0.18s ease',
            '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }
        }}>
            <CardContent sx={{ 
                py: { xs: 1, sm: 1.5 }, 
                px: 2, 
                '&:last-child': { pb: { xs: 1, sm: 1.5 } }, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between' 
            }}>
                <Typography variant="body2" fontWeight="700" color="text.secondary" sx={{ textTransform: 'uppercase', fontSize: { xs: '0.65rem', sm: '0.7rem' } }}>
                    {label}
                </Typography>
                <Typography variant="h6" fontWeight="900" color={color} sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                    {value}
                </Typography>
            </CardContent>
        </Card>
    );

    return (
        <Box>
            <Box mb={2}>
                <Typography variant="body2" fontWeight="900" sx={{ color: 'primary.main', opacity: 0.8, letterSpacing: '0.05em' }}>
                    USER - {profile?.displayName || 'GUEST'}
                </Typography>
            </Box>

            <Grid container spacing={1}>
                <Grid size={{ xs: 12 }}>
                    <CardItem label="Cash Opening Balance" value={formatINR(stats.dashboardOpeningBalance)} color="#1565c0" />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <CardItem label="Today's Receipts" value={formatINR(stats.todaysReceipts)} color="#2e7d32" />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <CardItem label="Today's Payments" value={formatINR(stats.todaysPayments)} color="#c62828" />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <CardItem label="Cash Closing Balance" value={formatINR(stats.dashboardClosingBalance)} color="#6a1b9a" />
                </Grid>
            </Grid>

            <Box mt={1.5}>
                <Typography variant="subtitle2" fontWeight="900" color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    Today's Reminders
                </Typography>
                <Paper variant="outlined" sx={{ p: { xs: 2 }, borderRadius: 3, borderStyle: 'dashed', bgcolor: '#F8FAFC', textAlign: 'center', borderColor: '#CBD5E1' }}>
                    <Typography variant="body2" color="text.secondary" fontWeight="700">
                        ✨ You're all caught up!
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                        No pending tasks or reminders for today.
                    </Typography>
                </Paper>
            </Box>
        </Box>
    );
}
