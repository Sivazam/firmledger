import React from 'react';
import { Fab, useTheme } from '@mui/material';

interface Props {
    icon: React.ReactNode;
    onClick: () => void;
    color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
}

export default function FloatingActionButton({ icon, onClick, color = 'primary' }: Props) {
    const theme = useTheme();
    return (
        <Fab
            color={color}
            onClick={onClick}
            sx={{
                position: 'fixed',
                bottom: `calc(80px + env(safe-area-inset-bottom) + ${theme.spacing(2)})`, // Shifted up to clear BottomNav completely
                right: theme.spacing(3),
                zIndex: 1100, // Higher than bottom nav 
                boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.2)', // Premium shadow
                transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                '&:active': { transform: 'scale(0.92)' }
            }}
        >
            {icon}
        </Fab>
    );
}
