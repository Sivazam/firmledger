import React from 'react';
import { AppBar, Toolbar, IconButton, Box, Typography } from '@mui/material';
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
    const { profile } = useAuthStore();
    const { currentOrganization } = useOrganizationStore();
    const [logoutDialogOpen, setLogoutDialogOpen] = React.useState(false);

    const handleLogout = async () => {
        await AuthService.logout();
        navigate('/login');
    };

    const toTitleCase = (str: string) => {
        return str
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const displayTitle = React.useMemo(() => {
        let title = 'Viswa Ledger';
        if (profile?.userType === 'super-admin') title = 'Super Admin';
        else if (profile?.userType === 'admin') title = 'Admin';
        else if (currentOrganization?.orgName) title = currentOrganization.orgName;
        
        return toTitleCase(title);
    }, [profile?.userType, currentOrganization?.orgName]);

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
                        alt="Viswa Ledger" 
                        sx={{ height: 32, cursor: 'pointer' }} 
                        onClick={() => navigate('/')}
                    />
                    <Typography 
                        variant="h6" 
                        sx={{ 
                            fontWeight: 900, 
                            color: 'inherit',
                            lineHeight: 1.1,
                            fontSize: { xs: '1.35rem', sm: '1.6rem' },
                            letterSpacing: '-0.02em',
                            textTransform: 'none' // Ensure it respects the Title Case from JS
                        }}
                    >
                        {displayTitle}
                    </Typography>
                </Box>
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
