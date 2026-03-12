import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

export type DialogVariant = 'success' | 'error' | 'confirm' | 'info';

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message: string;
    variant?: DialogVariant;
    onConfirm: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
}

export default function ConfirmDialog({
    open,
    title,
    message,
    variant = 'info',
    onConfirm,
    onCancel,
    confirmText = 'OK',
    cancelText = 'Cancel'
}: ConfirmDialogProps) {
    const getIcon = () => {
        switch (variant) {
            case 'success': return <CheckCircleOutlineIcon color="success" sx={{ fontSize: 48, mb: 2 }} />;
            case 'error': return <ErrorOutlineIcon color="error" sx={{ fontSize: 48, mb: 2 }} />;
            case 'confirm': return <HelpOutlineIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />;
            default: return null;
        }
    };

    return (
        <Dialog open={open} onClose={onCancel || onConfirm} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 2, p: 1, textAlign: 'center' } }}>
            <DialogContent>
                <Box display="flex" flexDirection="column" alignItems="center" pt={2}>
                    {getIcon()}
                    <Typography variant="h6" fontWeight="bold" gutterBottom>{title}</Typography>
                    <Typography color="text.secondary">{message}</Typography>
                </Box>
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'center', pb: 3, pt: 1, gap: 1 }}>
                {variant === 'confirm' && onCancel && (
                    <Button onClick={onCancel} variant="outlined" color="inherit">
                        {cancelText}
                    </Button>
                )}
                <Button
                    onClick={onConfirm}
                    variant="contained"
                    color={variant === 'error' ? 'error' : variant === 'success' ? 'success' : 'primary'}
                    autoFocus
                >
                    {confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
