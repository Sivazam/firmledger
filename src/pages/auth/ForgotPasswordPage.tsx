import React, { useState } from 'react';
import { Button, TextField, Typography, Box, Link as MuiLink, Alert } from '@mui/material';
import { Link } from 'react-router-dom';
import { AuthService } from '../../services/auth.service';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await AuthService.sendPasswordResetEmail(email.trim().toLowerCase());
            setSent(true);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box textAlign="center" mb={1}>
                <Typography variant="h5" fontWeight="900" letterSpacing="-0.02em">
                    Reset Password
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.8 }}>
                    We'll send a recovery link to your inbox
                </Typography>
            </Box>

            {sent ? (
                <Alert severity="success" sx={{ borderRadius: 2 }}>
                    Success! Check your email for a password reset link.
                </Alert>
            ) : (
                <>
                    {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}
                    
                    <TextField
                        label="Email Address"
                        placeholder="user@example.com"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        fullWidth
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                    />

                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        size="large"
                        disabled={loading}
                        sx={{ 
                            py: 1.5, 
                            borderRadius: 2.5, 
                            fontWeight: '900',
                            fontSize: '1rem',
                            boxShadow: '0 4px 12px rgba(30, 64, 175, 0.25)',
                            textTransform: 'none',
                            mt: 1
                        }}
                    >
                        {loading ? 'Sending...' : 'Send Recovery Link'}
                    </Button>
                </>
            )}

            <Box textAlign="center">
                <MuiLink 
                    component={Link} 
                    to="/login" 
                    sx={{ 
                        fontWeight: 700, 
                        color: 'primary.main', 
                        textDecoration: 'none',
                        '&:hover': { textDecoration: 'underline' },
                        fontSize: '0.85rem'
                    }}
                >
                    &larr; Back to Login
                </MuiLink>
            </Box>
        </Box>
    );
}
