import React from 'react';
import { AppBar, Toolbar, IconButton, Box, Typography, Button, Tooltip } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GetAppIcon from '@mui/icons-material/GetApp';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useOrganizationStore } from '../../stores/organizationStore';
import { AuthService } from '../../services/auth.service';
import ConfirmDialog from './ConfirmDialog';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export default function TopAppBar({ showBack = false }: { title?: string, showBack?: boolean }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { profile } = useAuthStore();
    const { currentOrganization } = useOrganizationStore();
    const [logoutDialogOpen, setLogoutDialogOpen] = React.useState(false);
    const { isInstallable, isStandalone, isIOS, installApp } = usePWAInstall();
    const [iosDialogOpen, setIosDialogOpen] = React.useState(false);

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

    React.useEffect(() => {
        console.log('PWA Status [v1.0.6]:', { isInstallable, isStandalone, isIOS, protocol: window.location.protocol, hostname: window.location.hostname });
    }, [isInstallable, isStandalone, isIOS]);

    return (
        <AppBar position="fixed" elevation={1}>
            <Toolbar sx={{ gap: 1 }}>
                {showBack && (
                    <IconButton edge="start" color="inherit" onClick={() => navigate(-1)} sx={{ mr: 1 }}>
                        <ArrowBackIcon />
                    </IconButton>
                )}
                <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 }, minWidth: 0 }}>
                    <Box 
                        component="img" 
                        src="/logo.svg" 
                        alt="Viswa Ledger" 
                        sx={{ height: 32, cursor: 'pointer', flexShrink: 0 }} 
                        onClick={() => navigate('/')}
                    />
                    <Typography 
                        variant="h6" 
                        noWrap
                        sx={{ 
                            fontWeight: 900, 
                            color: 'inherit',
                            lineHeight: 1.1,
                            fontSize: { xs: '1.2rem', sm: '1.5rem', md: '1.85rem' },
                            letterSpacing: '-0.02em',
                            textTransform: 'none'
                        }}
                    >
                        {displayTitle}
                    </Typography>
                </Box>

                <Box display="flex" alignItems="center" gap={0.5} sx={{ flexShrink: 0 }}>
                    {(isInstallable || (isIOS && !isStandalone)) && (
                        <Tooltip title={isIOS ? "How to Install" : "Install App"}>
                            <span>
                                <Button 
                                    color="primary" 
                                    variant="contained"
                                    size="small" 
                                    startIcon={<GetAppIcon sx={{ fontSize: '1.2rem !important' }} />}
                                    onClick={isInstallable ? installApp : (isIOS ? () => setIosDialogOpen(true) : undefined)}
                                    disabled={!isInstallable && !isIOS}
                                    sx={{ 
                                        textTransform: 'none',
                                        fontWeight: 800,
                                        borderRadius: 5,
                                        px: { xs: 1.5, sm: 2 },
                                        minWidth: 'auto',
                                        boxShadow: '0 2px 8px rgba(30, 64, 175, 0.25)',
                                        '& .MuiButton-startIcon': { mr: { xs: 0.5, sm: 1 } },
                                        display: 'flex',
                                        whiteSpace: 'nowrap',
                                        fontSize: { xs: '0.7rem', sm: '0.8rem' },
                                        '&.Mui-disabled': { 
                                            bgcolor: 'action.disabledBackground',
                                            color: 'text.disabled',
                                            boxShadow: 'none'
                                        }
                                    }}
                                >
                                    Install
                                </Button>
                            </span>
                        </Tooltip>
                    )}
                    
                    <IconButton color="inherit" onClick={() => setLogoutDialogOpen(true)} sx={{ color: 'text.primary' }}>
                        <LogoutIcon />
                    </IconButton>
                </Box>

            </Toolbar>
            <ConfirmDialog
                open={logoutDialogOpen}
                title="Logout"
                message="Are you sure you want to log out?"
                onConfirm={handleLogout}
                onCancel={() => setLogoutDialogOpen(false)}
                variant="error"
            />
            <ConfirmDialog
                open={iosDialogOpen}
                title="Install on iPhone/iPad"
                message="To install this app on iOS, tap the 'Share' icon in the browser tools and select 'Add to Home Screen'."
                onConfirm={() => setIosDialogOpen(false)}
                onCancel={() => setIosDialogOpen(false)}
                confirmText="Got it"
                variant="success"
            />
        </AppBar>
    );
}
