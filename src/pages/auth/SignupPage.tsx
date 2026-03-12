import React, { useState } from 'react';
import { Button, TextField, Typography, Box, Link as MuiLink, Alert } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { AuthService } from '../../services/auth.service';

export default function SignupPage() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!username.trim() || !email.trim() || !password.trim()) {
            return setError('All fields are required');
        }

        setLoading(true);
        try {
            // Check username availabilityFIRST to prevent ghost accounts
            const isAvailable = await AuthService.isUsernameAvailable(username.toLowerCase());
            if (!isAvailable) {
                setError('Username already taken.');
                return;
            }

            // Create auth user
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const uid = userCredential.user.uid;

            // Register username map
            await AuthService.registerWithUsername(username.toLowerCase(), email, uid);

            // Navigate to profile setup
            navigate('/setup-profile');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to create account');
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
