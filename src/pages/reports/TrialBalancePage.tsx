import React, { useState, useMemo } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, Paper, Grid, TextField, Button, Menu, MenuItem } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ShareIcon from '@mui/icons-material/Share';
import { Stack } from '@mui/material';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { usePartyStore } from '../../stores/partyStore';
import { useTransactionStore } from '../../stores/transactionStore';
import { useOrganizationStore } from '../../stores/organizationStore';
import PartySelector from '../../components/party/PartySelector';
import type { Party  } from '../../types/party.types';
import AmountDisplay from '../../components/transaction/AmountDisplay';
import { usePDF } from '../../hooks/usePDF';
import TrialBalanceDocument from '../../components/pdf/TrialBalanceDocument';
import type { TrialBalanceEntry } from '../../components/pdf/TrialBalanceDocument';
import { ReportExportService } from '../../utils/reportExport';

export default function TrialBalancePage() {
    const { parties } = usePartyStore();
    const { transactions } = useTransactionStore();
    const { currentOrganization } = useOrganizationStore();
    const navigate = useNavigate();

    const [selectedParty, setSelectedParty] = useState<Party | null>(null);
    const [fromDate, setFromDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
    const [toDate, setToDate] = useState(dayjs().format('YYYY-MM-DD'));
    
    const { generatePDFBlob, sharePDF, isGenerating } = usePDF();
    const [downloadAnchor, setDownloadAnchor] = useState<null | HTMLElement>(null);
    const [shareAnchor, setShareAnchor] = useState<null | HTMLElement>(null);

    const reportEntries: TrialBalanceEntry[] = useMemo(() => {
        const start = dayjs(fromDate).startOf('day');
        const end = dayjs(toDate).endOf('day');

        // Filter parties if one is selected, else process all
        const targetParties = selectedParty ? [selectedParty] : parties;

        return targetParties.map(party => {
            let opening = party.balanceType === 'Debit' ? (party.openingBalance || 0) : -(party.openingBalance || 0);
            
            let periodDebit = 0;
            let periodCredit = 0;

            transactions.forEach(tx => {
                const isFrom = tx.fromPartyId === party.id;
                const isTo = tx.toPartyId === party.id;
                if (!isFrom && !isTo) return;
                
                const txDate = tx.date && (tx.date as any).toDate ? dayjs((tx.date as any).toDate()) : dayjs(tx.date as any);
                
                if (txDate.isBefore(start)) {
                    if (isTo) opening += tx.amount;
                    if (isFrom) opening -= tx.amount;
                } else if (!txDate.isBefore(start) && !txDate.isAfter(end)) {
                    if (isTo) periodDebit += tx.amount;
                    if (isFrom) periodCredit += tx.amount;
                }
            });

            return {
                partyId: party.id,
                code: party.code,
                name: party.name,
                category: party.category,
                openingBalance: opening,
                debit: periodDebit,
                credit: periodCredit,
                closingBalance: opening + periodDebit - periodCredit
            };
        }).sort((a, b) => a.name.localeCompare(b.name));
    }, [parties, transactions, fromDate, toDate, selectedParty]);

    const totalDebit = reportEntries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredit = reportEntries.reduce((sum, e) => sum + e.credit, 0);

    const handleExportPdf = async (isShare: boolean = false) => {
        const dateRangeStr = `${dayjs(fromDate).format('DD/MM/YYYY')} to ${dayjs(toDate).format('DD/MM/YYYY')}`;
        const blob = await generatePDFBlob(
            <TrialBalanceDocument 
                entries={reportEntries} 
                organization={currentOrganization} 
                dateRange={dateRangeStr} 
            />
        );
        const filename = `Trial_Balance_${new Date().getTime()}.pdf`;
        if (isShare) {
            await sharePDF(blob, filename);
        } else {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.click();
            URL.revokeObjectURL(url);
        }
    };

    const handleExportCsv = (isShare: boolean = false) => {
        const headers = ['party_code', 'party_name', 'category', 'opening_balance', 'debit', 'credit', 'closing_balance'];
        const csvData = reportEntries.map(e => ({
            party_code: e.code,
            party_name: e.name,
            category: e.category,
            opening_balance: Math.abs(e.openingBalance) / 100 + (e.openingBalance !== 0 ? (e.openingBalance > 0 ? ' Dr' : ' Cr') : ''),
            debit: e.debit / 100,
            credit: e.credit / 100,
            closing_balance: Math.abs(e.closingBalance) / 100 + (e.closingBalance !== 0 ? (e.closingBalance > 0 ? ' Dr' : ' Cr') : '')
        }));
        
        csvData.push({
            party_code: '', party_name: 'TOTALS', category: '',
            opening_balance: '' as any, debit: totalDebit / 100, credit: totalCredit / 100, closing_balance: '' as any
        });
        
        ReportExportService.exportToCSV(`Trial_Balance`, csvData, headers, isShare);
    };

    return (
        <Box p={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Button onClick={() => navigate(-1)}>&larr; Back</Button>
                <Stack direction="row" spacing={1}>
                    <Button 
                        variant="outlined" 
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={(e) => setDownloadAnchor(e.currentTarget)}
                        disabled={isGenerating || reportEntries.length === 0}
                    >
                        Download
                    </Button>
                    <Button 
                        variant="outlined" 
                        size="small"
                        color="secondary"
                        startIcon={<ShareIcon />}
                        onClick={(e) => setShareAnchor(e.currentTarget)}
                        disabled={isGenerating || reportEntries.length === 0}
                    >
                        Share
                    </Button>
                </Stack>
            </Box>
            
            <Typography variant="h5" mb={3}>Trial Balance / Party Balances</Typography>
            
            <Grid container spacing={2} mb={3}>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <PartySelector label="All Parties (Or Select One)" value={selectedParty} onChange={setSelectedParty} />
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                    <TextField label="From" type="date" fullWidth size="small" value={fromDate} onChange={e => { setFromDate(e.target.value); if(e.target.value) (e.target as any).blur(); }} onFocus={(e) => (e.target as any).showPicker?.()} InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                    <TextField label="To" type="date" fullWidth size="small" value={toDate} onChange={e => { setToDate(e.target.value); if(e.target.value) (e.target as any).blur(); }} onFocus={(e) => (e.target as any).showPicker?.()} InputLabelProps={{ shrink: true }} />
                </Grid>
            </Grid>

            <Paper sx={{ overflowX: 'auto' }}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Code</TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell align="right">Opening</TableCell>
                            <TableCell align="right">Debit</TableCell>
                            <TableCell align="right">Credit</TableCell>
                            <TableCell align="right">Closing</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {reportEntries.map(entry => (
                            <TableRow key={entry.partyId}>
                                <TableCell>{entry.code}</TableCell>
                                <TableCell>{entry.name}</TableCell>
                                <TableCell align="right">
                                    <AmountDisplay amount={Math.abs(entry.openingBalance)} color={entry.openingBalance < 0 ? 'error.main' : 'success.main'} />
                                </TableCell>
                                <TableCell align="right">
                                    {entry.debit > 0 ? <AmountDisplay amount={entry.debit} /> : '-'}
                                </TableCell>
                                <TableCell align="right">
                                    {entry.credit > 0 ? <AmountDisplay amount={entry.credit} /> : '-'}
                                </TableCell>
                                <TableCell align="right">
                                    <AmountDisplay amount={Math.abs(entry.closingBalance)} color={entry.closingBalance < 0 ? 'error.main' : 'success.main'} />
                                    {entry.closingBalance !== 0 && (entry.closingBalance > 0 ? ' Debit' : ' Credit')}
                                </TableCell>
                            </TableRow>
                        ))}
                        {reportEntries.length > 0 && (
                            <TableRow sx={{ backgroundColor: 'action.hover' }}>
                                <TableCell colSpan={3} align="right"><strong>Totals:</strong></TableCell>
                                <TableCell align="right"><strong><AmountDisplay amount={totalDebit} /></strong></TableCell>
                                <TableCell align="right"><strong><AmountDisplay amount={totalCredit} /></strong></TableCell>
                                <TableCell />
                            </TableRow>
                        )}
                        {reportEntries.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} align="center">No parties found</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Paper>

            <Menu
                anchorEl={downloadAnchor}
                open={Boolean(downloadAnchor)}
                onClose={() => setDownloadAnchor(null)}
            >
                <MenuItem onClick={() => { handleExportCsv(); setDownloadAnchor(null); }}>Excel</MenuItem>
                <MenuItem onClick={() => { handleExportPdf(); setDownloadAnchor(null); }}>PDF</MenuItem>
            </Menu>

            <Menu
                anchorEl={shareAnchor}
                open={Boolean(shareAnchor)}
                onClose={() => setShareAnchor(null)}
            >
                <MenuItem onClick={() => { handleExportCsv(true); setShareAnchor(null); }}>Excel</MenuItem>
                <MenuItem onClick={() => { handleExportPdf(true); setShareAnchor(null); }}>PDF</MenuItem>
            </Menu>
        </Box>
    );
}
