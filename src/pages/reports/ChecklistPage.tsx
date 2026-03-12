import React, { useMemo } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, Paper } from '@mui/material';
import { useTransactionStore } from '../../stores/transactionStore';
import AmountDisplay from '../../components/transaction/AmountDisplay';
import { TransactionType } from '../../config/constants';

export default function ChecklistPage() {
    const { transactions } = useTransactionStore();

    const stats = useMemo(() => {
        const types = Object.values(TransactionType);
        return types.map(type => {
            const txs = transactions.filter(t => t.type === type);
            const totalAmount = txs.reduce((acc, curr) => acc + curr.amount, 0);
            return { type, count: txs.length, total: totalAmount };
        });
    }, [transactions]);

    return (
        <Box p={2}>
            <Typography variant="h5" mb={3}>Audit Checklist</Typography>

            <Paper sx={{ overflowX: 'auto' }}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Transaction Type</TableCell>
                            <TableCell align="right">Count</TableCell>
                            <TableCell align="right">Total Value</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {stats.map((s) => (
                            <TableRow key={s.type}>
                                <TableCell>{s.type.replace('_', ' ').toUpperCase()}</TableCell>
                                <TableCell align="right">{s.count}</TableCell>
                                <TableCell align="right">
                                    <AmountDisplay amount={s.total} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Paper>
        </Box>
    );
}
