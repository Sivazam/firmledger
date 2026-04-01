import React, { useState } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Grid, TextField, Menu, MenuItem, Stack } from '@mui/material';
import { useTransactionStore } from '../../stores/transactionStore';
import { useOrganizationStore } from '../../stores/organizationStore';
import { TransactionType } from '../../config/constants';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { usePDF } from '../../hooks/usePDF';
import ReportPDF from '../../components/pdf/ReportPDF';
import { ReportExportService } from '../../utils/reportExport';
import DownloadIcon from '@mui/icons-material/Download';
import ShareIcon from '@mui/icons-material/Share';

export default function TradingReportPage() {
    const { transactions } = useTransactionStore();
    const { currentOrganization } = useOrganizationStore();
    const navigate = useNavigate();
    const [fromDate, setFromDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
    const [toDate, setToDate] = useState(dayjs().format('YYYY-MM-DD'));
    
    const { generatePDFBlob, sharePDF, isGenerating } = usePDF();
    const [downloadAnchor, setDownloadAnchor] = useState<null | HTMLElement>(null);
    const [shareAnchor, setShareAnchor] = useState<null | HTMLElement>(null);
    const [closingStock, setClosingStock] = useState<number | null>(null);
    const [closingStockInput, setClosingStockInput] = useState<string>('');

    const filtered = transactions.filter(tx => {
        const txDate = tx.date && (tx.date as any).toDate ? dayjs((tx.date as any).toDate()) : dayjs(tx.date as any);
        return txDate.isAfter(dayjs(fromDate).subtract(1, 'day')) && 
               txDate.isBefore(dayjs(toDate).add(1, 'day'));
    });

    const sales = filtered.filter(tx => tx.type === TransactionType.SI).reduce((sum, tx) => sum + tx.amount, 0);
    const salesReturn = filtered.filter(tx => tx.type === TransactionType.SR).reduce((sum, tx) => sum + tx.amount, 0);
    const purchases = filtered.filter(tx => tx.type === TransactionType.PI).reduce((sum, tx) => sum + tx.amount, 0);
    const purchaseReturn = filtered.filter(tx => tx.type === TransactionType.PR).reduce((sum, tx) => sum + tx.amount, 0);

    const netSales = sales - salesReturn;
    const netPurchases = purchases - purchaseReturn;
    const grossProfit = netSales + (closingStock || 0) - netPurchases;

    const handleExportPdf = async (isShare: boolean = false) => {
        const blob = await generatePDFBlob(
            <ReportPDF 
                title="Trading Account" 
                subtitle={`${fromDate} to ${toDate}`}
                headers={['Particulars (Dr)', 'Amount (Dr)', 'Particulars (Cr)', 'Amount (Cr)']}
                rows={[
                    ['To Purchases', (purchases / 100).toFixed(2), 'By Sales', (sales / 100).toFixed(2)],
                    ['Less: Purchase Return', (purchaseReturn / 100).toFixed(2), 'Less: Sales Return', (salesReturn / 100).toFixed(2)],
                    ['Net Purchases', (netPurchases / 100).toFixed(2), 'Net Sales', (netSales / 100).toFixed(2)],
                    ['', '', 'By Closing Stock', ((closingStock || 0) / 100).toFixed(2)],
                    ['Gross Profit c/o', (grossProfit / 100).toFixed(2), '', '']
                ]}
                organization={currentOrganization}
            />
        );
        
        const filename = `Trading_Account_${new Date().getTime()}.pdf`;
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

    const handleExportExcel = (isShare: boolean = false) => {
        const headers = ['Debit_Particulars', 'Debit_Amount', 'Credit_Particulars', 'Credit_Amount'];
        const csvData = [
            { Debit_Particulars: 'To Purchases', Debit_Amount: (purchases / 100).toFixed(2), Credit_Particulars: 'By Sales', Credit_Amount: (sales / 100).toFixed(2) },
            { Debit_Particulars: 'Less: Purchase Return', Debit_Amount: (purchaseReturn / 100).toFixed(2), Credit_Particulars: 'Less: Sales Return', Credit_Amount: (salesReturn / 100).toFixed(2) },
            { Debit_Particulars: 'Net Purchases', Debit_Amount: (netPurchases / 100).toFixed(2), Credit_Particulars: 'Net Sales', Credit_Amount: (netSales / 100).toFixed(2) },
            { Debit_Particulars: '', Debit_Amount: '', Credit_Particulars: 'By Closing Stock', Credit_Amount: ((closingStock || 0) / 100).toFixed(2) },
            { Debit_Particulars: 'Gross Profit c/o', Debit_Amount: (grossProfit / 100).toFixed(2), Credit_Particulars: '', Credit_Amount: '' }
        ];
        ReportExportService.exportToCSV('Trading_Account', csvData, headers, isShare);
    };

    if (closingStock === null) {
        return (
            <Box p={3} maxWidth={400} mx="auto" mt={5}>
                <Typography variant="h5" mb={2}>Closing Stock</Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                    Please enter the closing stock value to generate the Trading Account report.
                </Typography>
                <TextField
                    fullWidth
                    label="Closing Stock Value (₹)"
                    type="number"
                    inputProps={{ min: "0", inputMode: "numeric", pattern: "[0-9]*" }}
                    value={closingStockInput}
                    onChange={e => setClosingStockInput(e.target.value)}
                    autoFocus
                />
                <Stack direction="row" spacing={2} mt={3}>
                    <Button variant="outlined" onClick={() => navigate(-1)} fullWidth>Go Back</Button>
                    <Button 
                        variant="contained" 
                        onClick={() => setClosingStock(Math.round(Number(closingStockInput) * 100) || 0)} 
                        fullWidth
                    >
                        View Report
                    </Button>
                </Stack>
            </Box>
        );
    }

    return (
        <Box p={2}>
            <Button onClick={() => navigate(-1)} sx={{ mb: 2 }}>&larr; Back</Button>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" fontWeight="bold">Trading Account</Typography>
                <Stack direction="row" spacing={1}>
                    <Button 
                        variant="outlined" 
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={(e) => setDownloadAnchor(e.currentTarget)}
                        disabled={isGenerating}
                    >
                        Download
                    </Button>
                    <Button 
                        variant="outlined" 
                        size="small"
                        color="secondary"
                        startIcon={<ShareIcon />}
                        onClick={(e) => setShareAnchor(e.currentTarget)}
                        disabled={isGenerating}
                    >
                        Share
                    </Button>
                </Stack>
            </Box>

            <Grid container spacing={2} mb={3}>
                <Grid size={{ xs: 6 }}>
                    <TextField 
                        label="From" 
                        type="date" 
                        fullWidth 
                        size="small" 
                        value={fromDate} 
                        onChange={e => { setFromDate(e.target.value); if(e.target.value) (e.target as any).blur(); }} 
                        onFocus={(e) => (e.target as any).showPicker?.()}
                        InputLabelProps={{ shrink: true }} 
                    />
                </Grid>
                <Grid size={{ xs: 6 }}>
                    <TextField 
                        label="To" 
                        type="date" 
                        fullWidth 
                        size="small" 
                        value={toDate} 
                        onChange={e => { setToDate(e.target.value); if(e.target.value) (e.target as any).blur(); }} 
                        onFocus={(e) => (e.target as any).showPicker?.()}
                        InputLabelProps={{ shrink: true }} 
                    />
                </Grid>
            </Grid>

            <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'primary.main' }}>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Particulars (Debit)</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Amount (₹)</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Particulars (Credit)</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Amount (₹)</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow>
                            <TableCell>To Purchases</TableCell>
                            <TableCell align="right">{(purchases / 100).toFixed(2)}</TableCell>
                            <TableCell>By Sales</TableCell>
                            <TableCell align="right">{(sales / 100).toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>Less: Purchase Return</TableCell>
                            <TableCell align="right">{(purchaseReturn / 100).toFixed(2)}</TableCell>
                            <TableCell>Less: Sales Return</TableCell>
                            <TableCell align="right">{(salesReturn / 100).toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Net Purchases</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>{(netPurchases / 100).toFixed(2)}</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Net Sales</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>{(netSales / 100).toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>By Closing Stock</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main' }}>{((closingStock || 0) / 100).toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                            <TableCell sx={{ fontWeight: 'bold' }}>Gross Profit c/o</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', color: grossProfit >= 0 ? 'success.main' : 'error.main' }}>
                                {(grossProfit / 100).toFixed(2)}
                            </TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>

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
