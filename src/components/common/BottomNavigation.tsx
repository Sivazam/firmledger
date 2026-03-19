import React from 'react';
import { Paper, BottomNavigation as MuiBottomNavigation, BottomNavigationAction } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import PeopleIcon from '@mui/icons-material/People';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AssessmentIcon from '@mui/icons-material/Assessment';
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
    const { isAdminMode } = useAuthStore();

    if (isSuperAdmin) return null;

    const showAdminTabs = isActuallyAdmin && isAdminMode;

    const getActiveValue = () => {
        if (showAdminTabs) {
            if (currentPath.startsWith('/admin/dashboard') || currentPath === '/') return 'admin_home';
            if (currentPath.startsWith('/admin/firms')) return 'firms';
            if (currentPath.startsWith('/settings') || currentPath.startsWith('/reports')) return 'settings';
            return 'admin_home';
        } else {
            if (currentPath === '/' || currentPath === '/dashboard') return 'home';
            if (currentPath.startsWith('/parties')) return 'parties';
            if (currentPath.startsWith('/transactions')) return 'new_tx';
            if (currentPath.startsWith('/settings') || currentPath.startsWith('/reports')) return 'settings';
            return 'home';
        }
    };

    const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
        switch (newValue) {
            case 'admin_home': navigate('/admin/dashboard'); break;
            case 'firms': navigate('/admin/firms'); break;
            case 'home': navigate('/dashboard'); break;
            case 'parties': navigate('/parties'); break;
            case 'new_tx': navigate('/transactions/record'); break;
            case 'reports': navigate('/reports'); break;
            case 'settings': navigate('/settings'); break;
        }
    };

    return (
        <Paper
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
                boxShadow: '0 -2px 10px rgba(0,0,0,0.05)'
            }}
            elevation={0}
        >
            <MuiBottomNavigation
                showLabels
                value={getActiveValue()}
                onChange={handleChange}
                sx={{ height: 64 }}
            >
                {showAdminTabs ? (
                    <BottomNavigationAction label="Home" value="admin_home" icon={<HomeIcon />} />
                ) : (
                    <BottomNavigationAction label="Home" value="home" icon={<HomeIcon />} />
                )}

                {showAdminTabs && (
                    <BottomNavigationAction label="Firms" value="firms" icon={<BusinessIcon />} />
                )}

                {!showAdminTabs && (
                    <BottomNavigationAction label="Parties" value="parties" icon={<PeopleIcon />} />
                )}
                {!showAdminTabs && (
                    <BottomNavigationAction label="New Tx" value="new_tx" icon={<AddCircleOutlineIcon />} />
                )}

                <BottomNavigationAction label="More" value="settings" icon={<MoreHorizIcon />} />
            </MuiBottomNavigation>
        </Paper>
    );
}
