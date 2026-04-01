import React, { useState } from 'react';
import { Button, TextField, Typography, Box, Link as MuiLink, Alert } from '@mui/material';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { AuthService } from '../../services/auth.service';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { InputAdornment, IconButton } from '@mui/material';

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
            // Check username availability FIRST to prevent ghost accounts
            const isAvailable = await AuthService.isUsernameAvailable(cleanUsername);
            if (!isAvailable) {
                setError('Username already taken.');
                return;
            }

            // Create auth user
            const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
            const uid = userCredential.user.uid;

            // Register username map
            await AuthService.registerWithUsername(cleanUsername, cleanEmail, uid);

            // Navigate to profile setup
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
        <Box component="form" onSubmit={handleSignup} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h5" textAlign="center" mb={2}>Sign Up</Typography>

            {error && <Alert severity="error">{error}</Alert>}

            <TextField
                label="Username (must be unique)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
            />
            <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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

            <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                disabled={loading}
            >
                {loading ? 'Creating...' : 'Sign Up'}
            </Button>

            <Typography textAlign="center" mt={2}>
                Already have an account?{' '}
                <MuiLink component={Link} to="/login">
                    Log in
                </MuiLink>
            </Typography>
        </Box>
    );
}
