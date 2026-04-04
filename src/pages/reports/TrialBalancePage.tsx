import React, { useState, useMemo } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, Paper, Grid, TextField, Button, Menu, MenuItem, Stack, IconButton, Divider, FormControl, InputLabel, Select } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ShareIcon from '@mui/icons-material/Share';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { usePartyStore } from '../../stores/partyStore';
import { useTransactionStore } from '../../stores/transactionStore';
import { useOrganizationStore } from '../../stores/organizationStore';
import type { Party  } from '../../types/party.types';
import AmountDisplay from '../../components/transaction/AmountDisplay';
import { usePDF } from '../../hooks/usePDF';
import TrialBalanceDocument from '../../components/pdf/TrialBalanceDocument';
import type { TrialBalanceEntry } from '../../components/pdf/TrialBalanceDocument';
import { ReportExportService } from '../../utils/reportExport';

const SHOW_TOTAL_ACTIVITY = false;

export default function TrialBalancePage() {
    const { parties } = usePartyStore();
    const { transactions } = useTransactionStore();
    const { currentOrganization } = useOrganizationStore();
    const navigate = useNavigate();

    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [toDate, setToDate] = useState(dayjs().format('YYYY-MM-DD'));
    
    const { generatePDFBlob, sharePDF, isGenerating } = usePDF();
    const [downloadAnchor, setDownloadAnchor] = useState<null | HTMLElement>(null);
    const [shareAnchor, setShareAnchor] = useState<null | HTMLElement>(null);

    const reportEntries: TrialBalanceEntry[] = useMemo(() => {
        const end = dayjs(toDate).endOf('day');

        // Filter parties if a category is selected, else process all
        let targetParties = parties;
        if (selectedCategory !== 'All') {
            targetParties = parties.filter(p => p.category === selectedCategory);
        }

        return targetParties.map(party => {
            // Static Opening Balance from Profile
            const staticOpening = party.balanceType === 'Debit' ? (party.openingBalance || 0) : -(party.openingBalance || 0);
            
            let totalDebitUntilDate = 0;
            let totalCreditUntilDate = 0;

            transactions.forEach(tx => {
                const isFrom = tx.fromPartyId === party.id;
                const isTo = tx.toPartyId === party.id;
                if (!isFrom && !isTo) return;
                
                const txDate = tx.date && (tx.date as any).toDate ? dayjs((tx.date as any).toDate()) : dayjs(tx.date as any);
                
                // Track all movements from start until the selected date
                if (!txDate.isAfter(end)) {
                    if (isTo) totalDebitUntilDate += tx.amount;
                    if (isFrom) totalCreditUntilDate += tx.amount;
                }
            });

            return {
                partyId: party.id,
                code: party.code,
                name: party.name,
                category: party.category,
                openingBalance: staticOpening,
                debit: totalDebitUntilDate,
                credit: totalCreditUntilDate,
                closingBalance: staticOpening + totalDebitUntilDate - totalCreditUntilDate
            };
        }).sort((a, b) => a.name.localeCompare(b.name));
    }, [parties, transactions, toDate, selectedCategory]);

    const totalOpening = reportEntries.reduce((sum, e) => sum + e.openingBalance, 0);
    const totalDebit = reportEntries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredit = reportEntries.reduce((sum, e) => sum + e.credit, 0);
    const totalClosingDebit = reportEntries.reduce((sum, e) => sum + (e.closingBalance > 0 ? e.closingBalance : 0), 0);
    const totalClosingCredit = reportEntries.reduce((sum, e) => sum + (e.closingBalance < 0 ? Math.abs(e.closingBalance) : 0), 0);

    const handleExportPdf = async (isShare: boolean = false) => {
        const asOfStr = `As of ${dayjs(toDate).format('DD/MM/YYYY')}`;
        const blob = await generatePDFBlob(
            <TrialBalanceDocument 
                entries={reportEntries} 
                organization={currentOrganization} 
                dateRange={asOfStr} 
                showTotalActivity={SHOW_TOTAL_ACTIVITY}
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
        const headers = ['party_code', 'party_name', 'category', 'opening_balance'];
        if (SHOW_TOTAL_ACTIVITY) {
            headers.push('total_debit', 'total_credit');
        }
        headers.push('debit', 'credit');

        const csvData = reportEntries.map(e => {
            const row: any = {
                party_code: e.code,
                party_name: e.name,
                category: e.category,
                opening_balance: e.openingBalance !== 0 
                    ? (Math.abs(e.openingBalance) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 }) + (e.openingBalance > 0 ? ' Dr' : ' Cr') 
                    : '0.00'
            };
            if (SHOW_TOTAL_ACTIVITY) {
                row.total_debit = e.debit > 0 ? e.debit / 100 : 0;
                row.total_credit = e.credit > 0 ? e.credit / 100 : 0;
            }
            row.debit = e.closingBalance > 0 ? e.closingBalance / 100 : '';
            row.credit = e.closingBalance < 0 ? Math.abs(e.closingBalance) / 100 : '';
            return row;
        });
        
        const totalsRow: any = {
            party_code: '', party_name: 'TOTALS', category: '',
            opening_balance: totalOpening !== 0 
                ? (Math.abs(totalOpening) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 }) + (totalOpening > 0 ? ' Dr' : ' Cr') 
                : '0.00'
        };
        if (SHOW_TOTAL_ACTIVITY) {
            totalsRow.total_debit = totalDebit / 100;
            totalsRow.total_credit = totalCredit / 100;
        }
        totalsRow.debit = totalClosingDebit / 100;
        totalsRow.credit = totalClosingCredit / 100;

        csvData.push(totalsRow);
        
        ReportExportService.exportToCSV(`Trial_Balance`, csvData, headers, isShare);
    };

    return (
        <Box p={{ xs: 1, sm: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
                <Box display="flex" alignItems="center" gap={1}>
                    <Button size="small" onClick={() => navigate(-1)} startIcon={<ArrowBackIcon />}>Back</Button>
                    <Typography variant="h6" fontWeight="bold">Trial Balance</Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                    <Button 
                        variant="outlined" 
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={(e) => setDownloadAnchor(e.currentTarget)}
                        disabled={isGenerating || reportEntries.length === 0}
                    >
                        <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Download</Box>
                    </Button>
                    <Button 
                        variant="outlined" 
                        size="small"
                        color="secondary"
                        startIcon={<ShareIcon />}
                        onClick={(e) => setShareAnchor(e.currentTarget)}
                        disabled={isGenerating || reportEntries.length === 0}
                    >
                        <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Share</Box>
                    </Button>
                </Stack>
            </Box>
            
            <Typography variant="h5" mb={3}>Trial Balance / Party Balances</Typography>
            
            <Grid container spacing={2} mb={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Category</InputLabel>
                        <Select
                            value={selectedCategory}
                            label="Category"
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            <MenuItem value="All">All Categories</MenuItem>
                            <MenuItem value="Trading">Trading</MenuItem>
                            <MenuItem value="P & L">Profit & Loss</MenuItem>
                            <MenuItem value="Balance Sheet">Balance Sheet</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="To Date" type="date" fullWidth size="small" value={toDate} onChange={e => { setToDate(e.target.value); if(e.target.value) (e.target as any).blur(); }} onFocus={(e) => (e.target as any).showPicker?.()} InputLabelProps={{ shrink: true }} />
                </Grid>
            </Grid>

            <Paper sx={{ overflowX: 'auto' }}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Code</TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell>Category</TableCell>
                            <TableCell align="right">Op Balance</TableCell>
                            {SHOW_TOTAL_ACTIVITY && <TableCell align="right">Total Debit</TableCell>}
                            {SHOW_TOTAL_ACTIVITY && <TableCell align="right">Total Credit</TableCell>}
                            <TableCell align="right">Debit</TableCell>
                            <TableCell align="right">Credit</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {reportEntries.map(entry => (
                            <TableRow key={entry.partyId}>
                                <TableCell>{entry.code}</TableCell>
                                <TableCell>{entry.name}</TableCell>
                                <TableCell>{entry.category}</TableCell>
                                <TableCell align="right">
                                    <Box display="inline-flex" alignItems="center" gap={0.5}>
                                        <AmountDisplay 
                                            amount={Math.abs(entry.openingBalance)} 
                                            color={entry.openingBalance === 0 ? 'text.secondary' : (entry.openingBalance > 0 ? 'error.main' : 'success.main')} 
                                        />
                                        {entry.openingBalance !== 0 && (
                                            <Typography component="span" variant="body2" color={entry.openingBalance > 0 ? 'error.main' : 'success.main'}>
                                                {entry.openingBalance > 0 ? 'Dr' : 'Cr'}
                                            </Typography>
                                        )}
                                    </Box>
                                </TableCell>
                                {SHOW_TOTAL_ACTIVITY && (
                                    <>
                                        <TableCell align="right">
                                            {entry.debit > 0 ? <AmountDisplay amount={entry.debit} /> : '-'}
                                        </TableCell>
                                        <TableCell align="right">
                                            {entry.credit > 0 ? <AmountDisplay amount={entry.credit} /> : '-'}
                                        </TableCell>
                                    </>
                                )}
                                <TableCell align="right">
                                    {entry.closingBalance > 0 ? <AmountDisplay amount={entry.closingBalance} color="error.main" /> : '-'}
                                </TableCell>
                                <TableCell align="right">
                                    {entry.closingBalance < 0 ? <AmountDisplay amount={Math.abs(entry.closingBalance)} color="success.main" /> : '-'}
                                </TableCell>
                            </TableRow>
                        ))}
                        {reportEntries.length > 0 && (
                            <TableRow sx={{ backgroundColor: 'action.hover' }}>
                                <TableCell colSpan={3} align="right"><strong>Totals:</strong></TableCell>
                                <TableCell align="right">
                                    <Box display="inline-flex" alignItems="center" gap={0.5}>
                                        <strong>
                                            <AmountDisplay 
                                                amount={Math.abs(totalOpening)} 
                                                color={totalOpening === 0 ? 'text.primary' : (totalOpening > 0 ? 'error.main' : 'success.main')} 
                                            />
                                        </strong>
                                        {totalOpening !== 0 && (
                                            <Typography component="span" variant="body2" color={totalOpening > 0 ? 'error.main' : 'success.main'} sx={{ fontWeight: 'bold' }}>
                                                {totalOpening > 0 ? 'Dr' : 'Cr'}
                                            </Typography>
                                        )}
                                    </Box>
                                </TableCell>
                                {SHOW_TOTAL_ACTIVITY && (
                                    <>
                                        <TableCell align="right"><strong><AmountDisplay amount={totalDebit} /></strong></TableCell>
                                        <TableCell align="right"><strong><AmountDisplay amount={totalCredit} /></strong></TableCell>
                                    </>
                                )}
                                <TableCell align="right"><strong><AmountDisplay amount={totalClosingDebit} color="error.main" /></strong></TableCell>
                                <TableCell align="right"><strong><AmountDisplay amount={totalClosingCredit} color="success.main" /></strong></TableCell>
                            </TableRow>
                        )}
                        {reportEntries.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={SHOW_TOTAL_ACTIVITY ? 8 : 6} align="center">No parties found</TableCell>
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
