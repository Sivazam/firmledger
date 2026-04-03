import React, { useState } from 'react';
import { Button, TextField, Typography, Box, Link as MuiLink, Alert, InputAdornment, IconButton } from '@mui/material';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { AuthService } from '../../services/auth.service';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

export default function SignupPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const cleanUsername = username.trim().toLowerCase();
        const cleanEmail = email.trim().toLowerCase();
        const cleanPassword = password.trim();

        if (!cleanUsername || !cleanEmail || !cleanPassword) {
            return setError('All fields are required');
        }

        setLoading(true);
        try {
            const isAvailable = await AuthService.isUsernameAvailable(cleanUsername);
            if (!isAvailable) {
                setError('Username already taken.');
                return;
            }

            const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
            const uid = userCredential.user.uid;
            await AuthService.registerWithUsername(cleanUsername, cleanEmail, uid);

            const inviteCode = searchParams.get('invite');
            navigate(`/setup-profile${inviteCode ? `?invite=${inviteCode}` : ''}`);
        } catch (err: any) {
            console.error(err);
            let message = err.message || 'Failed to create account';
            if (message.includes('auth/email-already-in-use')) message = 'Email already registered.';
            else if (message.includes('auth/weak-password')) message = 'Password should be at least 6 characters.';
            else message = message.replace('Firebase: Error ', '').replace(/\(auth\/.*\)\./, '').trim();
            
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box component="form" onSubmit={handleSignup} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box textAlign="center" mb={1}>
                <Typography variant="h5" fontWeight="900" letterSpacing="-0.02em">
                    Create Account
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.8 }}>
                    Secure account creation for Viswa Ledger
                </Typography>
            </Box>

            {error && (
                <Alert severity="error" sx={{ borderRadius: 2, fontSize: '0.85rem' }}>
                    {error}
                </Alert>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                    label="Username"
                    placeholder="choose_username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    fullWidth
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                />
                <TextField
                    label="Email"
                    placeholder="user@example.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    fullWidth
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                />
                <TextField
                    label="Password"
                    placeholder="••••••••"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    fullWidth
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
                    textTransform: 'none',
                    mt: 1
                }}
            >
                {loading ? 'Creating...' : 'Sign Up'}
            </Button>

            <Box textAlign="center">
                <Typography variant="body2" color="text.secondary">
                    Already have an account?{' '}
                    <MuiLink 
                        component={Link} 
                        to="/login" 
                        sx={{ 
                            fontWeight: 700, 
                            color: 'primary.main', 
                            textDecoration: 'none',
                            '&:hover': { textDecoration: 'underline' }
                        }}
                    >
                        Log in
                    </MuiLink>
                </Typography>
            </Box>
        </Box>
    );
}
