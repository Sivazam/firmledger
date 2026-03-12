import React, { useState } from 'react';
import { Button, TextField, Typography, Box, Link as MuiLink, Alert } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { AuthService } from '../../services/auth.service';
import GoogleIcon from '@mui/icons-material/Google';

export default function LoginPage() {
    const navigate = useNavigate();
    const [identifier, setIdentifier] = useState(''); // email or username
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            let emailToUse = identifier;
            // If no @ symbol, assume it's a username
            if (!identifier.includes('@')) {
                emailToUse = await AuthService.getEmailFromUsername(identifier);
            }

            await signInWithEmailAndPassword(auth, emailToUse, password);
            navigate('/');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to login');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            await AuthService.loginWithGoogle();
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Google sign in failed');
        }
    };

    return (
        <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h5" textAlign="center" mb={2}>Log In</Typography>

            {error && <Alert severity="error">{error}</Alert>}

            <TextField
                label="Email or Username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
            />
            <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />

            <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                disabled={loading}
            >
                {loading ? 'Logging in...' : 'Log In'}
            </Button>

            <Typography textAlign="center" variant="body2" color="text.secondary" my={1}>
                OR
            </Typography>

            <Button
                variant="outlined"
                startIcon={<GoogleIcon />}
                onClick={handleGoogleLogin}
            >
                Sign in with Google
            </Button>

            <Typography textAlign="center" mt={2}>
                Don't have an account?{' '}
                <MuiLink component={Link} to="/signup">
                    Sign up
                </MuiLink>
            </Typography>
        </Box>
    );
}
