import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Box, FormControlLabel, Switch } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export default function TopAppBar({ title, showBack = false }: { title?: string, showBack?: boolean }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { profile, isAdminMode, setAdminMode } = useAuthStore();

    const isSettings = location.pathname === '/settings';

    const handleModeToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newMode = event.target.checked;
        setAdminMode(newMode);
        if (newMode) {
            navigate('/admin/dashboard');
        } else {
            navigate('/dashboard');
        }
    };

    return (
        <AppBar position="fixed" elevation={1}>
            <Toolbar>
                {showBack && (
                    <IconButton edge="start" color="inherit" onClick={() => navigate(-1)} sx={{ mr: 2 }}>
                        <ArrowBackIcon />
                    </IconButton>
                )}
                <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
                    {title || (profile?.userType === 'admin' && isAdminMode) ? (
                        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                            {title || 'Admin Dashboard'}
                        </Typography>
                    ) : (
                        <img src="/logo-full.svg" alt="FirmLedger" style={{ height: 42 }} />
                    )}
                </Box>
                {profile?.userType === 'admin' && !isSettings && (
                    <FormControlLabel
                        control={<Switch checked={isAdminMode} onChange={handleModeToggle} color="default" />}
                        label={isAdminMode ? "Admin Mode" : "Firm Mode"}
                        sx={{ mr: 2, '& .MuiFormControlLabel-label': { fontSize: '0.875rem', fontWeight: 600 } }}
                    />
                )}
                {!isSettings && (
                    <IconButton color="inherit" onClick={() => navigate('/settings')}>
                        <SettingsIcon />
                    </IconButton>
                )}
            </Toolbar>
        </AppBar>
    );
}
