import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TextField, Button, Box, Grid, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Typography, Switch } from '@mui/material';
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

    const { register, handleSubmit, setValue, watch, control, formState: { errors } } = useForm<any>({
        resolver: zodResolver(partySchema),
        defaultValues: initialData ? {
            ...initialData,
            openingBalance: initialData.balanceType === 'Credit' 
                ? -((initialData.openingBalance || 0) / 100)
                : (initialData.openingBalance || 0) / 100
        } : {
            code: '', name: '', category: 'CUSTOMER', fatherName: '', address: '', town: '', phoneNumber: '', aadharNumber: '', panNumber: '', gstNumber: '',
            openingBalance: 0,
            balanceType: 'Debit',
            isBank: false
        }
    });

    const watchedBalance = watch('openingBalance');

    React.useEffect(() => {
        const val = Number(watchedBalance);
        if (isNaN(val)) return;
        setValue('balanceType', val < 0 ? 'Credit' : 'Debit');
    }, [watchedBalance, setValue]);

    return (
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                        label="Party Code"
                        disabled={initialData?.isSystem}
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
                        helperText={errors.code?.message as any}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="Party Name" {...register('name')} disabled={initialData?.isSystem} error={!!errors.name} helperText={errors.name?.message as any} fullWidth />
                </Grid>
                <Grid size={{ xs: 12, sm: 2 }}>
                    <TextField
                        select
                        label="Category"
                        disabled={initialData?.isSystem}
                        {...register('category')}
                        error={!!errors.category}
                        helperText={errors.category?.message as any}
                        fullWidth
                        SelectProps={{ native: true }}
                    >
                        <option value="Trading">Trading</option>
                        <option value="P & L">P & L</option>
                        <option value="Balance Sheet">Balance Sheet</option>
                    </TextField>
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <TextField label="Father Name (Optional)" {...register('fatherName')} error={!!errors.fatherName} helperText={errors.fatherName?.message as any} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <TextField label="Address" multiline rows={2} {...register('address')} error={!!errors.address} helperText={errors.address?.message as any} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="Town" {...register('town')} error={!!errors.town} helperText={errors.town?.message as any} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="Phone Number" type="tel" inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }} {...register('phoneNumber')} error={!!errors.phoneNumber} helperText={errors.phoneNumber?.message as any} />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField label="Aadhar (Optional)" type="tel" inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }} {...register('aadharNumber')} error={!!errors.aadharNumber} helperText={errors.aadharNumber?.message as any} />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField label="PAN (Optional)" {...register('panNumber')} error={!!errors.panNumber} helperText={errors.panNumber?.message as any} />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField label="GST (Optional)" {...register('gstNumber')} error={!!errors.gstNumber} helperText={errors.gstNumber?.message as any} />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                        label="Opening Balance (₹)"
                        type="number"
                        inputProps={{ step: "0.01" }}
                        {...register('openingBalance', { valueAsNumber: true })}
                        error={!!errors.openingBalance}
                        helperText={errors.openingBalance ? (errors.openingBalance?.message as any) : "Use a minus sign (-) for Credit/Negative balances (e.g., -500)"}
                        fullWidth
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ ml: { sm: 2 }, mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            Auto-detected Type: <strong>{watch('balanceType')}</strong>
                        </Typography>
                    </Box>
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <FormControlLabel
                        control={
                            <Controller
                                name="isBank"
                                control={control}
                                render={({ field }) => (
                                    <Switch
                                        checked={field.value || false}
                                        onChange={(e) => field.onChange(e.target.checked)}
                                        disabled={initialData?.isSystem}
                                    />
                                )}
                            />
                        }
                        label="Is this a Bank Account?"
                    />
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
