import React from 'react';
import { Box, Card, Container, Typography } from '@mui/material';
import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'background.default',
                padding: 2
            }}
        >
            <Container maxWidth="sm">
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Typography variant="h4" color="primary" fontWeight="bold">
                        FirmLedger
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        Enterprise Transaction Recording
                    </Typography>
                </Box>
                <Card sx={{ p: { xs: 3, md: 5 }, boxShadow: 3 }}>
                    <Outlet />
                </Card>
            </Container>
        </Box>
    );
}
