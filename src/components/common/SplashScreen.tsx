import React from 'react';
import { Box, Typography } from '@mui/material';

export default function SplashScreen() {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                width: '100vw',
                bgcolor: '#F1F5F9',
                position: 'fixed',
                top: 0,
                left: 0,
                zIndex: 9999
            }}
        >
            <Box
                component="img"
                src="/logo-splash.svg"
                sx={{
                    height: 140,
                    animation: 'splash-pulse 2s infinite ease-in-out',
                    '@keyframes splash-pulse': {
                        '0%': { transform: 'scale(0.95)', opacity: 0.85 },
                        '50%': { transform: 'scale(1.05)', opacity: 1 },
                        '100%': { transform: 'scale(0.95)', opacity: 0.85 },
                    }
                }}
                alt="Loading FirmLedger..."
            />
            <Box
                sx={{
                    position: 'absolute',
                    bottom: 24,
                    textAlign: 'center'
                }}
            >
                <Typography variant="caption" color="text.secondary">
                    Built by <span style={{ color: '#1E40AF', fontWeight: 600 }}>Harte Labs</span>
                </Typography>
            </Box>
        </Box>
    );
}
