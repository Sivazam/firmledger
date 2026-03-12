import React from 'react';
import { Box, Typography, Card, CardContent, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function ReportsPage() {
    const navigate = useNavigate();

    const reports = [
        { title: 'Ledger', description: 'Party-wise transaction ledger', path: '/reports/ledger' },
        { title: 'Balance Sheet', description: 'Overall summary of all parties', path: '/reports/balance-sheet' },
        { title: 'Monthly Report', description: 'Month-wise aggregation', path: '/reports/monthly' },
        { title: 'Audit Checklist', description: 'Transaction counts and totals', path: '/reports/checklist' },
    ];

    return (
        <Box p={2}>
            <Typography variant="h5" mb={3}>Reports</Typography>
            <Grid container spacing={2}>
                {reports.map((r, i) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={i}>
                        <Card sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }} onClick={() => navigate(r.path)}>
                            <CardContent>
                                <Typography variant="h6">{r.title}</Typography>
                                <Typography color="text.secondary">{r.description}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}
