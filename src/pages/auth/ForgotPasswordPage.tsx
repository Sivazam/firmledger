import React, { useState } from 'react';
import { Button, TextField, Typography, Box, Link as MuiLink, Alert, Paper } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { AuthService } from '../../services/auth.service';

export default function ForgotPasswordPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            await AuthService.sendPasswordResetEmail(email.trim().toLowerCase());
            setMessage('Check your inbox for further instructions.');
        } catch (err: any) {
            console.error(err);
            let msg = err.message || 'Failed to reset password';
            if (msg.includes('auth/user-not-found')) msg = 'User not found.';
            else if (msg.includes('auth/invalid-email')) msg = 'Invalid email format.';
            else msg = msg.replace('Firebase: Error ', '').replace(/\(auth\/.*\)\./, '').trim();
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
            <Typography variant="h5" textAlign="center" mb={2}>Reset Password</Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center" mb={3}>
                Enter your email address and we'll send you a link to reset your password.
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    fullWidth
                />

                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    size="large"
                    disabled={loading}
                >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>

                <Typography textAlign="center" mt={2}>
                    <MuiLink component={Link} to="/login">
                        Back to Login
                    </MuiLink>
                </Typography>
            </Box>
        </Box>
    );
}
