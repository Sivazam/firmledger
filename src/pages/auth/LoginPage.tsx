import React, { useState } from 'react';
import { Button, TextField, Typography, Box, Link as MuiLink, Alert, InputAdornment, IconButton } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { AuthService } from '../../services/auth.service';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

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
        const cleanPassword = password;

        try {
            let emailToUse = cleanIdentifier;
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

    return (
        <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box textAlign="center" mb={1}>
                <Box 
                    component="img" 
                    src="/logo.svg" 
                    sx={{ 
                        height: 60, 
                        mb: 2,
                        filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.1))'
                    }} 
                />
                <Typography variant="h5" fontWeight="900" letterSpacing="-0.02em">
                    Welcome Back
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.8 }}>
                    Please enter your credentials to login
                </Typography>
            </Box>

            {error && (
                <Alert severity="error" sx={{ borderRadius: 2, fontSize: '0.85rem' }}>
                    {error}
                </Alert>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                    label="Email or Username"
                    placeholder="Enter email or username"
                    variant="outlined"
                    fullWidth
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                />
                
                <Box>
                    <TextField
                        label="Password"
                        placeholder="••••••••"
                        type={showPassword ? 'text' : 'password'}
                        variant="outlined"
                        fullWidth
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
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
                    <Box textAlign="right" sx={{ mt: 1 }}>
                        <MuiLink 
                            component={Link} 
                            to="/forgot-password" 
                            variant="caption" 
                            sx={{ 
                                fontWeight: 700, 
                                textDecoration: 'none',
                                color: 'primary.main',
                                '&:hover': { textDecoration: 'underline' }
                            }}
                        >
                            Forgot Password?
                        </MuiLink>
                    </Box>
                </Box>
            </Box>

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
                    textTransform: 'none'
                }}
            >
                {loading ? 'Logging in...' : 'Log In'}
            </Button>
        </Box>
    );
}
