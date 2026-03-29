import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, ListItemIcon, Divider, Button } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import LogoutIcon from '@mui/icons-material/Logout';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../../services/auth.service';
import { useAuthStore } from '../../stores/authStore';
import { useOrganizationStore } from '../../stores/organizationStore';
import { getFinancialYearBounds } from '../../utils/dateUtils';

export default function SettingsPage() {
    const navigate = useNavigate();
    const { profile } = useAuthStore();
    const { currentOrganization } = useOrganizationStore();
    const isActuallyAdmin = profile?.userType === 'admin';
    const showAdminSettings = isActuallyAdmin;

    const handleLogout = async () => {
        await AuthService.logout();
        navigate('/login');
    };

    return (
        <Box p={2}>
            <Typography variant="h5" mb={3}>Settings</Typography>

            <List sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
                {!showAdminSettings && (
                    <>
                        <ListItem component="button" onClick={() => navigate('/reports')} sx={{ textAlign: 'left', width: '100%', border: 'none', background: 'none' }}>
                            <ListItemIcon><AssessmentIcon color="secondary" /></ListItemIcon>
                            <ListItemText primary="Reports" secondary="View Ledger, Balance Sheet, and more" />
                        </ListItem>
                        <Divider />
                    </>
                )}

                <ListItem component="button" onClick={() => navigate('/settings/personal')} sx={{ textAlign: 'left', width: '100%', border: 'none', background: 'none' }}>
                    <ListItemIcon><PersonIcon /></ListItemIcon>
                    <ListItemText primary="Personal Details" secondary="Update your profile, address and contact info" />
                </ListItem>
                <Divider />

                {!showAdminSettings && (
                    <>
                        <ListItem component="button" onClick={() => navigate('/settings/organization')} sx={{ textAlign: 'left', width: '100%', border: 'none', background: 'none' }}>
                            <ListItemIcon><BusinessIcon /></ListItemIcon>
                            <ListItemText primary="Organization Details" secondary="Update firm address, logo and GST" />
                        </ListItem>
                        <Divider />
                    </>
                )}
            </List>

            {!showAdminSettings && currentOrganization && currentOrganization.createdAt && (
                <Box sx={{ bgcolor: '#F8FAFC', p: 2, borderRadius: 2, mt: 3, border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle2" color="text.secondary">Active Subscription Period</Typography>
                    <Typography variant="body1" fontWeight="bold" color="text.primary" sx={{ mt: 0.5 }}>
                        {currentOrganization.subscriptionLabel || getFinancialYearBounds((currentOrganization.createdAt as any).toDate ? (currentOrganization.createdAt as any).toDate() : currentOrganization.createdAt).label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {currentOrganization.subscriptionDescription || getFinancialYearBounds((currentOrganization.createdAt as any).toDate ? (currentOrganization.createdAt as any).toDate() : currentOrganization.createdAt).description}
                    </Typography>
                </Box>
            )}

            <Box mt={6} textAlign="center">
                <Typography variant="body2" color="text.secondary">
                    Built by <a href="https://wa.me/919014882779?text=I%20have%20a%20software/app/website%20requirement" target="_blank" rel="noopener noreferrer" style={{ color: '#1E40AF', textDecoration: 'none', fontWeight: 600 }}>Harte Labs</a>
                </Typography>
            </Box>
        </Box>
    );
}
