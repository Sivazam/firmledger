import React, { useState } from 'react';
import { 
    Box, Typography, Button, Paper, Alert, Stack, 
    Divider, TextField, InputAdornment, IconButton 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SecurityIcon from '@mui/icons-material/Security';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LockIcon from '@mui/icons-material/Lock';
import { AuthService } from '../../services/auth.service';
import { useAuthStore } from '../../stores/authStore';

export default function SecurityPage() {
    const navigate = useNavigate();
    const { profile } = useAuthStore();
    
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus(null);

        const { currentPassword, newPassword, confirmPassword } = formData;

        if (!currentPassword || !newPassword || !confirmPassword) {
            setStatus({ type: 'error', message: 'Please fill all password fields.' });
            return;
        }

        if (newPassword.length < 6) {
            setStatus({ type: 'error', message: 'New password must be at least 6 characters.' });
            return;
        }

        if (newPassword !== confirmPassword) {
            setStatus({ type: 'error', message: 'New passwords do not match.' });
            return;
        }

        setLoading(true);
        try {
            // 1. Re-authenticate
            await AuthService.reauthenticateUser(currentPassword);
            
            // 2. Update Password
            await AuthService.updateUserPassword(newPassword);

            setStatus({ type: 'success', message: 'Password updated successfully!' });
            setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err: any) {
            console.error(err);
            let msg = err.message || 'Failed to update password.';
            if (msg.includes('auth/wrong-password')) msg = 'The current password you entered is incorrect.';
            setStatus({ type: 'error', message: msg });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box p={2} maxWidth={600} mx="auto">
            <Button 
                startIcon={<ArrowBackIcon />} 
                onClick={() => navigate(-1)} 
                sx={{ mb: 3 }}
            >
                Back to Settings
            </Button>

            <Typography variant="h5" fontWeight="800" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <SecurityIcon color="primary" /> Security
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
                Update your login credentials securely.
            </Typography>

            <Paper component="form" onSubmit={handleUpdatePassword} sx={{ p: 3, borderRadius: 3, border: '1px solid #E2E8F0', boxShadow: 'none' }}>
                <Typography variant="subtitle1" fontWeight="bold" mb={1}>Change Password</Typography>
                <Divider sx={{ mb: 2 }} />

                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
                    You must enter your current password to choose a new one. This ensures only you can make changes to your account.
                </Typography>

                {status && (
                    <Alert severity={status.type} sx={{ mb: 3, borderRadius: 2 }}>
                        {status.message}
                    </Alert>
                )}

                <Stack spacing={2.5}>
                    <TextField
                        label="Current Password"
                        name="currentPassword"
                        type={showCurrentPassword ? 'text' : 'password'}
                        fullWidth
                        size="small"
                        required
                        value={formData.currentPassword}
                        onChange={handleChange}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><LockIcon sx={{fontSize: 18, color: 'text.disabled'}} /></InputAdornment>,
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => setShowCurrentPassword(!showCurrentPassword)} edge="end" size="small">
                                        {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />

                    <Divider />

                    <TextField
                        label="New Password"
                        name="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        fullWidth
                        size="small"
                        required
                        value={formData.newPassword}
                        onChange={handleChange}
                        helperText="Minimum 6 characters"
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><LockIcon sx={{fontSize: 18, color: 'text.disabled'}} /></InputAdornment>,
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => setShowNewPassword(!showNewPassword)} edge="end" size="small">
                                        {showNewPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />

                    <TextField
                        label="Confirm New Password"
                        name="confirmPassword"
                        type="password"
                        fullWidth
                        size="small"
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                    />

                    <Button 
                        type="submit"
                        variant="contained" 
                        fullWidth 
                        disabled={loading}
                        sx={{ fontWeight: 'bold', py: 1.5, mt: 1, borderRadius: 2 }}
                    >
                        {loading ? 'Updating...' : 'Update Password'}
                    </Button>
                </Stack>
            </Paper>

            <Box mt={4} p={2} bgcolor="#F8FAFC" borderRadius={2} border="1px solid #E2E8F0">
                <Typography variant="caption" color="text.secondary" fontWeight="bold" sx={{ display: 'block', mb: 0.5 }}>
                    LOGGED IN AS
                </Typography>
                <Typography variant="body2" fontWeight="500">
                    {profile?.email}
                </Typography>
            </Box>
        </Box>
    );
}
