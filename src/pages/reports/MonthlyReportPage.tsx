import React, { useMemo } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTransactionStore } from '../../stores/transactionStore';
import dayjs from 'dayjs';

export default function MonthlyReportPage() {
    const { transactions } = useTransactionStore();

    const data = useMemo(() => {
        const groups: Record<string, { credit: number, debit: number }> = {};

        transactions.forEach(tx => {
            const month = dayjs(tx.date.toMillis()).format('MMM YYYY');
            if (!groups[month]) groups[month] = { credit: 0, debit: 0 };

            switch (tx.type) {
                case 'receipt':
                case 'sales':
                    groups[month].credit += (tx.amount / 100);
                    break;
                case 'payment':
                case 'purchase':
                    groups[month].debit += (tx.amount / 100);
                    break;
            }
        });

        return Object.keys(groups).map(k => ({
            name: k,
            In: groups[k].credit,
            Out: groups[k].debit
        })).sort((a, b) => dayjs(a.name, 'MMM YYYY').valueOf() - dayjs(b.name, 'MMM YYYY').valueOf());
    }, [transactions]);

    return (
        <Box p={2}>
            <Typography variant="h5" mb={3}>Monthly Report</Typography>

            <Paper sx={{ p: 2, height: 400, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="subtitle1" gutterBottom>Money In vs Money Out</Typography>
                {data.length > 0 ? (
                    <Box sx={{ height: 350, width: '100%', mt: 2 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(value: any) => `₹${value}`} />
                                <Bar dataKey="In" fill="#2E7D32" />
                                <Bar dataKey="Out" fill="#C62828" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Box>
                ) : (
                    <Typography textAlign="center" mt={10}>No data to chart</Typography>
                )}
            </Paper>
        </Box>
    );
}
