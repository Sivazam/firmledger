import React, { useMemo, useState } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, Paper, Button, Menu, MenuItem, Stack } from '@mui/material';
import { useTransactionStore } from '../../stores/transactionStore';
import AmountDisplay from '../../components/transaction/AmountDisplay';
import { TransactionType } from '../../config/constants';
import { useOrganizationStore } from '../../stores/organizationStore';
import { usePDF } from '../../hooks/usePDF';
import ReportPDF from '../../components/pdf/ReportPDF';
import { ReportExportService } from '../../utils/reportExport';
import DownloadIcon from '@mui/icons-material/Download';
import ShareIcon from '@mui/icons-material/Share';
import { useNavigate } from 'react-router-dom';

export default function ChecklistPage() {
    const { transactions } = useTransactionStore();
    const { currentOrganization } = useOrganizationStore();
    const navigate = useNavigate();
    const { generatePDFBlob, sharePDF, isGenerating } = usePDF();
    const [downloadAnchor, setDownloadAnchor] = useState<null | HTMLElement>(null);
    const [shareAnchor, setShareAnchor] = useState<null | HTMLElement>(null);

    const stats = useMemo(() => {
        const types = Object.values(TransactionType);
        return types.map(type => {
            const txs = transactions.filter(t => t.type === type);
            const totalAmount = txs.reduce((acc, curr) => acc + curr.amount, 0);
            return { type, count: txs.length, total: totalAmount };
        });
    }, [transactions]);

    const handleExportPdf = async (isShare: boolean = false) => {
        const blob = await generatePDFBlob(
            <ReportPDF 
                title="Audit Checklist" 
                subtitle="Transaction Type Summary"
                headers={['Type', 'Count', 'Total (₹)']}
                rows={stats.map(s => [s.type.replace('_', ' ').toUpperCase(), s.count, (s.total / 100).toFixed(2)])}
                organization={currentOrganization}
            />
        );
        const filename = `Audit_Checklist_${new Date().getTime()}.pdf`;
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
        const headers = ['type', 'count', 'total'];
        const csvData = stats.map(s => ({
            type: s.type,
            count: s.count,
            total: (s.total / 100).toFixed(2)
        }));
        ReportExportService.exportToCSV('Audit_Checklist', csvData, headers, isShare);
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
