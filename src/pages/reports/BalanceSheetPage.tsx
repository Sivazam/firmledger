import React, { useMemo } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, Paper } from '@mui/material';
import { usePartyStore } from '../../stores/partyStore';
import { useTransactionStore } from '../../stores/transactionStore';
import AmountDisplay from '../../components/transaction/AmountDisplay';

export default function BalanceSheetPage() {
    const { parties } = usePartyStore();
    const { transactions } = useTransactionStore();

    const balances = useMemo(() => {
        return parties.map(party => {
            let balance = 0;
            transactions.forEach(tx => {
                if (tx.fromPartyId === party.id) balance += tx.amount;
                if (tx.toPartyId === party.id) balance -= tx.amount;
            });
            return { party, balance };
        }).filter(p => p.balance !== 0)
            .sort((a, b) => b.balance - a.balance);
    }, [parties, transactions]);

    const totalCredit = balances.filter(b => b.balance > 0).reduce((acc, curr) => acc + curr.balance, 0);
    const totalDebit = balances.filter(b => b.balance < 0).reduce((acc, curr) => acc + Math.abs(curr.balance), 0);

    return (
        <Box p={2}>
            <Typography variant="h5" mb={3}>Balance Sheet</Typography>

            <Box display="flex" gap={4} mb={3}>
                <Box>
                    <Typography color="text.secondary">Total Payables (Credit)</Typography>
                    <AmountDisplay amount={totalCredit} variant="h6" color="success.main" />
                </Box>
                <Box>
                    <Typography color="text.secondary">Total Receivables (Debit)</Typography>
                    <AmountDisplay amount={totalDebit} variant="h6" color="error.main" />
                </Box>
            </Box>

            <Paper sx={{ overflowX: 'auto' }}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Party Name</TableCell>
                            <TableCell>Code</TableCell>
                            <TableCell align="right">Balance</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {balances.map((b) => (
                            <TableRow key={b.party.id}>
                                <TableCell>{b.party.name}</TableCell>
                                <TableCell>{b.party.code}</TableCell>
                                <TableCell align="right">
                                    <AmountDisplay
                                        amount={Math.abs(b.balance)}
                                        color={b.balance > 0 ? 'success.main' : 'error.main'}
                                    />
                                    {b.balance > 0 ? ' (Cr)' : ' (Dr)'}
                                </TableCell>
                            </TableRow>
                        ))}
                        {balances.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} align="center">No outstanding balances</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Paper>
        </Box>
    );
}
