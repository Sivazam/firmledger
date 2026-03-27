import React from 'react';
import { Paper, BottomNavigation as MuiBottomNavigation, BottomNavigationAction, Box, Fab } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import PeopleIcon from '@mui/icons-material/People';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AddIcon from '@mui/icons-material/Add';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export default function BottomNavigation() {
    const navigate = useNavigate();
    const location = useLocation();
    const { profile } = useAuthStore();

    const currentPath = location.pathname;
    const isActuallyAdmin = profile?.userType === 'admin';
    const isSuperAdmin = profile?.userType === 'super-admin';

    if (isSuperAdmin) return null;

    const showAdminTabs = isActuallyAdmin;

    const getActiveValue = () => {
        if (showAdminTabs) {
            if (currentPath.startsWith('/admin/dashboard') || currentPath === '/') return 'admin_home';
            if (currentPath.startsWith('/admin/organizations')) return 'firms';
            if (currentPath.startsWith('/settings/personal')) return 'profile';
            return 'admin_home';
        } else {
            if (currentPath === '/' || currentPath === '/dashboard') return 'home';
            if (currentPath.startsWith('/parties')) return 'parties';
            if (currentPath.startsWith('/transactions') && currentPath !== '/transactions/record') return 'ledger';
            if (currentPath.startsWith('/reports')) return 'reports';
            if (currentPath.startsWith('/settings')) return 'settings';
            return 'home';
        }
    };

    const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
        switch (newValue) {
            case 'admin_home': navigate('/admin/dashboard'); break;
            case 'firms': navigate('/admin/organizations'); break;
            case 'home': navigate('/dashboard'); break;
            case 'parties': navigate('/parties'); break;
            case 'ledger': navigate('/transactions'); break;
            case 'reports': navigate('/reports'); break;
            case 'settings': navigate('/settings'); break;
            case 'profile': navigate('/settings/personal'); break;
        }
    };

    return (
        <Box
            sx={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 1000,
                pb: 'env(safe-area-inset-bottom)',
                backgroundColor: 'background.paper',
                borderTop: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
                borderTopLeftRadius: showAdminTabs ? 0 : 20,
                borderTopRightRadius: showAdminTabs ? 0 : 20
            }}
        >
            <MuiBottomNavigation
                showLabels
                value={getActiveValue()}
                onChange={handleChange}
                sx={{ height: 65, backgroundColor: 'transparent' }}
            >
                {showAdminTabs ? (
                    <BottomNavigationAction label="Home" value="admin_home" icon={<HomeIcon />} />
                ) : (
                    <BottomNavigationAction label="Home" value="home" icon={<HomeIcon />} sx={{ minWidth: 0, flex: 1 }} />
                )}

                {showAdminTabs && (
                    <BottomNavigationAction label="Organizations" value="firms" icon={<BusinessIcon />} sx={{ minWidth: 0, flex: 1 }} />
                )}

                {!showAdminTabs && (
                    <BottomNavigationAction label="Parties" value="parties" icon={<PeopleIcon />} sx={{ minWidth: 0, flex: 1, mr: 2 }} />
                )}

                {!showAdminTabs && (
                    <BottomNavigationAction disabled sx={{ minWidth: 0, padding: 0, flex: 0.5 }} />
                )}

                {!showAdminTabs && (
                    <BottomNavigationAction label="Transactions" value="ledger" icon={<ReceiptIcon />} sx={{ minWidth: 0, flex: 1, ml: 2 }} />
                )}

                {showAdminTabs ? (
                    <BottomNavigationAction label="Profile" value="profile" icon={<PersonIcon />} sx={{ minWidth: 0, flex: 1 }} />
                ) : (
                    <BottomNavigationAction label="More" value="settings" icon={<MoreHorizIcon />} sx={{ minWidth: 0, flex: 1 }} />
                )}
            </MuiBottomNavigation>

            {!showAdminTabs && (
                <Box 
                    sx={{ 
                        position: 'absolute', 
                        top: -24, 
                        left: '50%', 
                        transform: 'translateX(-50%)',
                        zIndex: 1001 
                    }}
                >
                    <Fab 
                        color="primary" 
                        onClick={() => navigate('/transactions/record')} 
                        sx={{ 
                            width: 60, 
                            height: 60, 
                            boxShadow: '0 4px 14px rgba(30, 64, 175, 0.4)',
                            border: '4px solid #fff'
                        }}
                    >
                        <AddIcon sx={{ fontSize: 32 }} />
                    </Fab>
                </Box>
            )}
        </Box>
    );
}
