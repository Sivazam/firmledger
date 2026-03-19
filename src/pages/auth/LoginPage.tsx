import React, { useState } from 'react';
import { Button, TextField, Typography, Box, Link as MuiLink, Alert, Paper } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { AuthService } from '../../services/auth.service';
import GoogleIcon from '@mui/icons-material/Google';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { InputAdornment, IconButton } from '@mui/material';

export default function LoginPage() {
    const navigate = useNavigate();
    const [identifier, setIdentifier] = useState(''); // email or username
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const cleanIdentifier = identifier.trim();
        const cleanPassword = password.trim();

        try {
            let emailToUse = cleanIdentifier;
            // If no @ symbol, assume it's a username
            if (!cleanIdentifier.includes('@')) {
                emailToUse = await AuthService.getEmailFromUsername(cleanIdentifier.toLowerCase());
            }

            await signInWithEmailAndPassword(auth, emailToUse.toLowerCase().trim(), cleanPassword);
            navigate('/');
        } catch (err: any) {
            console.error(err);
            let message = err.message || 'Failed to login';
            if (message.includes('auth/wrong-password')) message = 'Incorrect password.';
            else if (message.includes('auth/user-not-found')) message = 'User not found.';
            else if (message.includes('auth/invalid-email')) message = 'Invalid email format.';
            else if (message.includes('auth/too-many-requests')) message = 'Too many failed attempts. Please try again later.';
            else message = message.replace('Firebase: Error ', '').replace(/\(auth\/.*\)\./, '').trim();
            
            setError(message);
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
        <Box sx={{ 
            minHeight: '80vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            p: 2
        }}>
            <Paper elevation={0} sx={{ 
                p: 4, 
                width: '100%', 
                maxWidth: 400, 
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                display: 'flex', 
                flexDirection: 'column', 
                gap: 2 
            }} component="form" onSubmit={handleLogin}>
                <Box textAlign="center" mb={2}>
                    <Box component="img" src="/logo.svg" sx={{ height: 48, mb: 2 }} />
                    <Typography variant="h5" fontWeight="800">Welcome Back</Typography>
                    <Typography variant="body2" color="text.secondary">Enter your credentials to continue</Typography>
                </Box>

                {error && <Alert severity="error">{error}</Alert>}

                <TextField
                    label="Email or Username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                />
                <TextField
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    onClick={() => setShowPassword(!showPassword)}
                                    edge="end"
                                    size="small"
                                >
                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />

                <Box textAlign="right" sx={{ mt: -1 }}>
                    <MuiLink component={Link} to="/forgot-password" variant="body2" sx={{ fontWeight: 600 }}>
                        Forgot Password?
                    </MuiLink>
                </Box>

                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    size="large"
                    disabled={loading}
                    sx={{ mt: 1 }}
                >
                    {loading ? 'Logging in...' : 'Log In'}
                </Button>

                <Typography textAlign="center" variant="body2" color="text.secondary" sx={{ position: 'relative', '&::before, &::after': { content: '""', position: 'absolute', top: '50%', width: '40%', height: '1px', bgcolor: 'divider' }, '&::before': { left: 0 }, '&::after': { right: 0 } }}>
                    OR
                </Typography>

                <Button
                    variant="outlined"
                    startIcon={<GoogleIcon />}
                    onClick={handleGoogleLogin}
                    sx={{ color: 'text.primary', borderColor: 'divider' }}
                >
                    Sign in with Google
                </Button>

                <Typography textAlign="center" mt={2} variant="body2">
                    Don't have an account?{' '}
                    <MuiLink component={Link} to="/signup" sx={{ fontWeight: 700 }}>
                        Sign up
                    </MuiLink>
                </Typography>
            </Paper>
        </Box>
    );
}
