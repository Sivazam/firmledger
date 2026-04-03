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
import { usePDF } from '../../hooks/usePDF';
import LedgerDocument from '../../components/pdf/LedgerDocument';
import type { LedgerEntry } from '../../components/pdf/LedgerDocument';
import { ReportExportService } from '../../utils/reportExport';
import { Menu, MenuItem, Stack, IconButton, Divider } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ShareIcon from '@mui/icons-material/Share';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function LedgerPage() {
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [fromDate, setFromDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [toDate, setToDate] = useState(dayjs().format('YYYY-MM-DD'));
  const { transactions } = useTransactionStore();
  const { currentOrganization } = useOrganizationStore();
  const navigate = useNavigate();
  const { generatePDFBlob, sharePDF, isGenerating } = usePDF();
  
  const [downloadAnchor, setDownloadAnchor] = useState<null | HTMLElement>(null);
  const [shareAnchor, setShareAnchor] = useState<null | HTMLElement>(null);

  const ledgerEntries = useMemo(() => {
    if (!selectedParty) return [];
    
    // 1. Separate transactions into "Pre-Period" (before From Date) and "In-Period"
    const startOfPeriod = dayjs(fromDate).startOf('day');
    const endOfPeriod = dayjs(toDate).endOf('day');

    const prePeriodTxs: any[] = [];
    const periodTxs: any[] = [];

    transactions.forEach(t => {
      const isParty = t.fromPartyId === selectedParty.id || t.toPartyId === selectedParty.id;
      if (!isParty) return;

      const txDate = t.date && (t.date as any).toDate ? dayjs((t.date as any).toDate()) : dayjs(t.date as any);
      
      if (txDate.isBefore(startOfPeriod)) {
        prePeriodTxs.push(t);
      } else if (!txDate.isAfter(endOfPeriod)) {
        periodTxs.push(t);
      }
    });

    // 2. Calculate the "Cumulative Opening Balance" (Opening Profile + all Pre-Period activity)
    let cumulativeOpeningBalance = (selectedParty.balanceType === 'Debit' ? 1 : -1) * (selectedParty.openingBalance || 0);
    
    prePeriodTxs.forEach(tx => {
      const isFromParty = tx.fromPartyId === selectedParty.id; // Credit
      const isToParty = tx.toPartyId === selectedParty.id;     // Debit
      if (isToParty) cumulativeOpeningBalance += tx.amount;
      if (isFromParty) cumulativeOpeningBalance -= tx.amount;
    });

    let runningBalance = cumulativeOpeningBalance;
    
    const openingEntry = {
        id: 'opening',
        date: null,
        type: 'OP',
        description: 'Opening Balance',
        debit: cumulativeOpeningBalance > 0 ? Math.abs(cumulativeOpeningBalance) : 0,
        credit: cumulativeOpeningBalance < 0 ? Math.abs(cumulativeOpeningBalance) : 0,
        balance: cumulativeOpeningBalance
    };

    // 3. Sort period transactions chronologically
    const sortedPeriodTxs = [...periodTxs].sort((a, b) => {
        const da = a.date && (a.date as any).toDate ? a.date.toDate().getTime() : new Date(a.date as any).getTime();
        const db = b.date && (b.date as any).toDate ? b.date.toDate().getTime() : new Date(b.date as any).getTime();
        return da - db;
    });

    const mappedEntries = sortedPeriodTxs.map(tx => {
      const isFromParty = tx.fromPartyId === selectedParty.id; // Credit
      const isToParty = tx.toPartyId === selectedParty.id;     // Debit

      let credit = 0;
      let debit = 0;

      if (isFromParty) credit = tx.amount;
      if (isToParty) debit = tx.amount;

      runningBalance += debit - credit;

      return { ...tx, debit, credit, balance: runningBalance };
    });

    return [openingEntry, ...mappedEntries] as LedgerEntry[];
  }, [selectedParty, transactions, fromDate, toDate]);

  const handleExportPdf = async (isShare: boolean = false) => {
    if (!selectedParty || ledgerEntries.length === 0) return;
    const dateRangeStr = `${dayjs(fromDate).format('DD/MM/YYYY')} to ${dayjs(toDate).format('DD/MM/YYYY')}`;
    
    const blob = await generatePDFBlob(
      <LedgerDocument 
        title="Party Ledger Statement"
        partyName={selectedParty.name}
        partyCode={selectedParty.code}
        dateRange={dateRangeStr}
        entries={ledgerEntries}
        organization={currentOrganization}
      />
    );
    
    if (isShare) {
        await sharePDF(blob, `${selectedParty.name}_Ledger_${new Date().getTime()}.pdf`);
    } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${selectedParty.name}_Ledger_${new Date().getTime()}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
    }
  };

  const handleExportExcel = (isShare: boolean = false) => {
    if (!selectedParty || ledgerEntries.length === 0) return;
    const headers = ['Type', 'Date', 'Description', 'Debit', 'Credit', 'Balance'];
    const csvData = ledgerEntries.map(e => ({
      Type: e.type,
      Date: e.id === 'opening' ? 'Opening' : (e.date ? dayjs(e.date).format('DD/MM/YYYY') : '-'),
      Description: e.description,
      Debit: e.debit / 100,
      Credit: e.credit / 100,
      Balance: Math.abs(e.balance) / 100 + (e.balance !== 0 ? (e.balance > 0 ? ' Dr' : ' Cr') : '')
    }));

    ReportExportService.exportToCSV(`${selectedParty.name}_Ledger_${new Date().getTime()}`, csvData, headers, isShare);
  };

  return (
    <Box p={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
                <Box display="flex" alignItems="center" gap={1}>
                    <Button size="small" onClick={() => navigate(-1)} startIcon={<ArrowBackIcon />}>Back</Button>
                    <Typography variant="h6" fontWeight="bold">Ledger</Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                    <Button 
                        variant="outlined" 
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={(e) => setDownloadAnchor(e.currentTarget)}
                        disabled={isGenerating || !selectedParty}
                    >
                        <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Download</Box>
                    </Button>
                    <Button 
                        variant="outlined" 
                        size="small"
                        color="secondary"
                        startIcon={<ShareIcon />}
                        onClick={(e) => setShareAnchor(e.currentTarget)}
                        disabled={isGenerating || !selectedParty}
                    >
                        <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Share</Box>
                    </Button>
                </Stack>
            </Box>
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
                <TableCell>Type</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Desc</TableCell>
                <TableCell align="right">Debit</TableCell>
                <TableCell align="right">Credit</TableCell>
                <TableCell align="right">Balance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ledgerEntries.map(entry => (
                <TableRow key={entry.id}>
                  <TableCell><strong>{entry.type}</strong></TableCell>
                  <TableCell>
                    {entry.id === 'opening' ? <strong>Opening Balance</strong> : (entry.date ? formatDate(entry.date) : '-')}
                  </TableCell>
                  <TableCell>
                    {entry.description}
                  </TableCell>
                  <TableCell align="right">
                    {entry.id === 'opening' ? (
                      selectedParty?.balanceType === 'Debit' ? <AmountDisplay amount={entry.debit} /> : '-'
                    ) : (
                      entry.debit > 0 ? <AmountDisplay amount={entry.debit} /> : '-'
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {entry.id === 'opening' ? (
                      selectedParty?.balanceType === 'Credit' ? <AmountDisplay amount={entry.credit} /> : '-'
                    ) : (
                      entry.credit > 0 ? <AmountDisplay amount={entry.credit} /> : '-'
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <AmountDisplay 
                      amount={Math.abs(entry.balance)} 
                      color={entry.balance >= 0 ? 'success.main' : 'error.main'} 
                    />
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

      <Menu
        anchorEl={downloadAnchor}
        open={Boolean(downloadAnchor)}
        onClose={() => setDownloadAnchor(null)}
      >
        <MenuItem onClick={() => { handleExportExcel(); setDownloadAnchor(null); }}>Excel</MenuItem>
        <MenuItem onClick={() => { handleExportPdf(); setDownloadAnchor(null); }}>PDF</MenuItem>
      </Menu>

      <Menu
        anchorEl={shareAnchor}
        open={Boolean(shareAnchor)}
        onClose={() => setShareAnchor(null)}
      >
        <MenuItem onClick={() => { handleExportExcel(true); setShareAnchor(null); }}>Excel</MenuItem>
        <MenuItem onClick={() => { handleExportPdf(true); setShareAnchor(null); }}>PDF</MenuItem>
      </Menu>
    </Box>
  );
}
