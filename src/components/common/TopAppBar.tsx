import React from 'react';
import { AppBar, Toolbar, IconButton, Box, FormControlLabel, Switch, Typography } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useOrganizationStore } from '../../stores/organizationStore';
import { AuthService } from '../../services/auth.service';
import ConfirmDialog from './ConfirmDialog';

export default function TopAppBar({ showBack = false }: { title?: string, showBack?: boolean }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { profile, isAdminMode, setAdminMode } = useAuthStore();
    const { currentOrganization } = useOrganizationStore();
    const [logoutDialogOpen, setLogoutDialogOpen] = React.useState(false);

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

    const handleLogout = async () => {
        await AuthService.logout();
        navigate('/login');
    };

    return (
        <AppBar position="fixed" elevation={1}>
            <Toolbar>
                {showBack && (
                    <IconButton edge="start" color="inherit" onClick={() => navigate(-1)} sx={{ mr: 2 }}>
                        <ArrowBackIcon />
                    </IconButton>
                )}
                <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box 
                        component="img" 
                        src="/logo.svg" 
                        alt="FirmLedger" 
                        sx={{ height: 32, cursor: 'pointer' }} 
                        onClick={() => navigate('/')}
                    />
                    <Typography 
                        variant="h6" 
                        sx={{ 
                            fontWeight: 800, 
                            color: 'inherit',
                            display: { xs: 'block', sm: 'block' },
                            maxWidth: { xs: '180px', sm: 'none' },
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontSize: { xs: '1rem', sm: '1.25rem' }
                        }}
                    >
                        {currentOrganization?.orgName || 'FirmLedger'}
                    </Typography>
                </Box>
                {profile?.userType === 'admin' && !isSettings && (
                    <FormControlLabel
                        control={<Switch checked={isAdminMode} onChange={handleModeToggle} color="default" />}
                        label={isAdminMode ? "Admin Mode" : "Firm Mode"}
                        sx={{ mr: 2, '& .MuiFormControlLabel-label': { fontSize: '0.875rem', fontWeight: 600 } }}
                    />
                )}
                <IconButton color="inherit" onClick={() => setLogoutDialogOpen(true)}>
                    <LogoutIcon />
                </IconButton>
            </Toolbar>
            <ConfirmDialog
                open={logoutDialogOpen}
                title="Logout"
                message="Are you sure you want to log out?"
                onConfirm={handleLogout}
                onCancel={() => setLogoutDialogOpen(false)}
                variant="error"
            />
        </AppBar>
    );
}
