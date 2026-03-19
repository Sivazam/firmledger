import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TextField, Button, Box, Grid } from '@mui/material';
import { partySchema } from '../../utils/validators';
import type { PartyFormData } from '../../utils/validators';
import type { Party } from '../../types/party.types';
interface Props {
    initialData?: Party;
    onSubmit: (data: PartyFormData) => Promise<void>;
    isLoading: boolean;
}

import { usePartyStore } from '../../stores/partyStore';
import ConfirmDialog from '../common/ConfirmDialog';

export default function PartyForm({ initialData, onSubmit, isLoading }: Props) {
    const { parties } = usePartyStore();
    const [duplicateDialogOpen, setDuplicateDialogOpen] = React.useState(false);
    const [duplicateCode, setDuplicateCode] = React.useState('');

    const { register, handleSubmit, setValue, formState: { errors } } = useForm<PartyFormData>({
        resolver: zodResolver(partySchema),
        defaultValues: initialData || {
            code: '', name: '', category: 'CUSTOMER', fatherName: '', address: '', town: '', phoneNumber: '', aadharNumber: '', panNumber: '', gstNumber: ''
        }
    });

    return (
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                        label="Party Code"
                        {...register('code', {
                            onChange: (e) => {
                                const val = e.target.value.toUpperCase();
                                if (parties.some(p => p.id !== initialData?.id && p.code === val)) {
                                    setDuplicateCode(val);
                                    setDuplicateDialogOpen(true);
                                    setValue('code', ''); // Clear the invalid field immediately
                                }
                            }
                        })}
                        error={!!errors.code}
                        helperText={errors.code?.message}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="Party Name" {...register('name')} error={!!errors.name} helperText={errors.name?.message} fullWidth />
                </Grid>
                <Grid size={{ xs: 12, sm: 2 }}>
                    <TextField
                        select
                        label="Category"
                        {...register('category')}
                        error={!!errors.category}
                        helperText={errors.category?.message}
                        fullWidth
                        SelectProps={{ native: true }}
                    >
                        <option value="CUSTOMER">CUSTOMER</option>
                        <option value="SUPPLIER">SUPPLIER</option>
                        <option value="BANK">BANK</option>
                        <option value="CASH">CASH</option>
                        <option value="REVENUE">REVENUE</option>
                        <option value="EXPENSE">EXPENSE</option>
                        <option value="CAPITAL">CAPITAL</option>
                        <option value="OTHER">OTHER</option>
                    </TextField>
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <TextField label="Father Name (Optional)" {...register('fatherName')} error={!!errors.fatherName} helperText={errors.fatherName?.message} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <TextField label="Address" multiline rows={2} {...register('address')} error={!!errors.address} helperText={errors.address?.message} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="Town" {...register('town')} error={!!errors.town} helperText={errors.town?.message} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="Phone Number" type="tel" inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }} {...register('phoneNumber')} error={!!errors.phoneNumber} helperText={errors.phoneNumber?.message} />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField label="Aadhar (Optional)" type="tel" inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }} {...register('aadharNumber')} error={!!errors.aadharNumber} helperText={errors.aadharNumber?.message} />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField label="PAN (Optional)" {...register('panNumber')} error={!!errors.panNumber} helperText={errors.panNumber?.message} />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField label="GST (Optional)" {...register('gstNumber')} error={!!errors.gstNumber} helperText={errors.gstNumber?.message} />
                </Grid>
            </Grid>

            <Button type="submit" variant="contained" size="large" disabled={isLoading} sx={{ mt: 2 }}>
                {isLoading ? 'Saving...' : 'Save Party'}
            </Button>

            <ConfirmDialog
                open={duplicateDialogOpen}
                title="Duplicate Code Detected"
                message={`A party with the code "${duplicateCode}" already exists in your records. Please use a unique party code to continue.`}
                variant="error"
                onConfirm={() => setDuplicateDialogOpen(false)}
                confirmText="Got it"
            />
        </Box>
    );
}
