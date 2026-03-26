import React, { useState, useMemo } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, Paper, Grid, TextField, Button } from '@mui/material';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { usePartyStore } from '../../stores/partyStore';
import { useTransactionStore } from '../../stores/transactionStore';
import { useOrganizationStore } from '../../stores/organizationStore';
import PartySelector from '../../components/party/PartySelector';
import type { Party  } from '../../types/party.types';
import { formatDate } from '../../utils/formatters';
import AmountDisplay from '../../components/transaction/AmountDisplay';

export default function LedgerPage() {
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [fromDate, setFromDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [toDate, setToDate] = useState(dayjs().format('YYYY-MM-DD'));
  const { transactions } = useTransactionStore();
  const { currentOrganization } = useOrganizationStore();
  const navigate = useNavigate();

  const ledgerEntries = useMemo(() => {
    if (!selectedParty) return [];
    
    // Sort transactions chronologically (oldest first)
    const partyTxs = transactions.filter(t => {
      const isParty = t.fromPartyId === selectedParty.id || t.toPartyId === selectedParty.id;
      if (!isParty) return false;
      
      const txDate = t.date && (t.date as any).toDate ? dayjs((t.date as any).toDate()) : dayjs(t.date as any);
      return txDate.isAfter(dayjs(fromDate).subtract(1, 'day')) && 
             txDate.isBefore(dayjs(toDate).add(1, 'day'));
    }).sort((a, b) => {
        const da = a.date && (a.date as any).toDate ? a.date.toDate().getTime() : new Date(a.date as any).getTime();
        const db = b.date && (b.date as any).toDate ? b.date.toDate().getTime() : new Date(b.date as any).getTime();
        return da - db;
    });
    
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
      <Button onClick={() => navigate(-1)} sx={{ mb: 2 }}>&larr; Back</Button>
      <Typography variant="h5" mb={3}>Party Ledger</Typography>
      
      <Grid container spacing={2} mb={3}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <PartySelector label="Select Party" value={selectedParty} onChange={setSelectedParty} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <TextField label="From" type="date" fullWidth size="small" value={fromDate} onChange={e => { setFromDate(e.target.value); if(e.target.value) (e.target as any).blur(); }} onFocus={(e) => (e.target as any).showPicker?.()} InputLabelProps={{ shrink: true }} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <TextField label="To" type="date" fullWidth size="small" value={toDate} onChange={e => { setToDate(e.target.value); if(e.target.value) (e.target as any).blur(); }} onFocus={(e) => (e.target as any).showPicker?.()} InputLabelProps={{ shrink: true }} />
        </Grid>
      </Grid>

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
