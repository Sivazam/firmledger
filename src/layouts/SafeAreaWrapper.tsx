import React from 'react';
import { Box } from '@mui/material';

export default function SafeAreaWrapper({ children }: { children: React.ReactNode }) {
    return (
        <Box
            sx={{
                pt: 'env(safe-area-inset-top, 0px)',
                pb: 'env(safe-area-inset-bottom, 0px)',
                pl: 'env(safe-area-inset-left, 0px)',
                pr: 'env(safe-area-inset-right, 0px)',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {children}
        </Box>
    );
}
