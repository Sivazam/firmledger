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
            <Container maxWidth="xs">
                <Card sx={{ 
                    p: { xs: 3, sm: 4 }, 
                    borderRadius: 4, 
                    boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
                    border: '1px solid #E2E8F0'
                }}>
                    <Outlet />
                </Card>

                <Box sx={{ mt: 4, textAlign: 'center', opacity: 0.6 }}>
                    <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, letterSpacing: '0.02em', mb: 0.5 }}>
                        Built with ❤️ by <a href="https://wa.me/919014882779?text=I%20have%20a%20software/app/website%20requirement" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none', borderBottom: '1px solid currentColor' }}>Harte Labs</a>
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 500 }}>
                        version 2.23
                    </Typography>
                </Box>
            </Container>
        </Box>
    );
}
