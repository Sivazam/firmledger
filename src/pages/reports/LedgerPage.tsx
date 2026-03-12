import React, { useState, useMemo } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, Paper } from '@mui/material';
import { usePartyStore } from '../../stores/partyStore';
import { useTransactionStore } from '../../stores/transactionStore';
import PartySelector from '../../components/party/PartySelector';
import type { Party  } from '../../types/party.types';
import { formatDate } from '../../utils/formatters';
import AmountDisplay from '../../components/transaction/AmountDisplay';

export default function LedgerPage() {
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const { transactions } = useTransactionStore();

  const ledgerEntries = useMemo(() => {
    if (!selectedParty) return [];
    
    // Sort transactions chronologically (oldest first)
    const partyTxs = transactions.filter(t => t.fromPartyId === selectedParty.id || t.toPartyId === selectedParty.id)
                                 .sort((a, b) => a.date.toMillis() - b.date.toMillis());
    
    let runningBalance = 0; 
    return partyTxs.map(tx => {
      const isFromParty = tx.fromPartyId === selectedParty.id; // Credit
      const isToParty = tx.toPartyId === selectedParty.id;     // Debit

      let credit = 0;
      let debit = 0;

      if (isFromParty) credit = tx.amount;
      if (isToParty) debit = tx.amount;

      runningBalance += credit - debit;

      return { ...tx, debit, credit, balance: runningBalance };
    });
  }, [selectedParty, transactions]);

  return (
    <Box p={2}>
      <Typography variant="h5" mb={3}>Party Ledger</Typography>
      <Box mb={3} maxWidth={400}>
        <PartySelector label="Select Party" value={selectedParty} onChange={setSelectedParty} />
      </Box>

      {selectedParty && (
        <Paper sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Desc</TableCell>
                <TableCell align="right">Debit</TableCell>
                <TableCell align="right">Credit</TableCell>
                <TableCell align="right">Balance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ledgerEntries.map(entry => (
                <TableRow key={entry.id}>
                  <TableCell>{formatDate(entry.date)}</TableCell>
                  <TableCell>{entry.type}</TableCell>
                  <TableCell>{entry.description}</TableCell>
                  <TableCell align="right">{entry.debit > 0 ? <AmountDisplay amount={entry.debit} /> : '-'}</TableCell>
                  <TableCell align="right">{entry.credit > 0 ? <AmountDisplay amount={entry.credit} /> : '-'}</TableCell>
                  <TableCell align="right">
                    <AmountDisplay 
                      amount={Math.abs(entry.balance)} 
                      color={entry.balance >= 0 ? 'success.main' : 'error.main'} 
                    />
                    {entry.balance >= 0 ? ' (Cr)' : ' (Dr)'}
                  </TableCell>
                </TableRow>
              ))}
              {ledgerEntries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">No transactions</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
}
