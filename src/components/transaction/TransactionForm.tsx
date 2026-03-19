import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { Box, Button, TextField, Grid } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { transactionSchema } from '../../utils/validators';
import type { TransactionFormData } from '../../utils/validators';
import { TransactionType } from '../../config/constants';
import TransactionTypeSelect from './TransactionTypeSelect';
import PartySelector from '../party/PartySelector';
import { useAuthStore } from '../../stores/authStore';
import { usePartyStore } from '../../stores/partyStore';
import { OrganizationService } from '../../services/organization.service';
import type { Party } from '../../types/party.types';

interface Props {
    initialData?: any;
    onSubmit: (data: TransactionFormData) => Promise<void>;
    isLoading: boolean;
}

export default function TransactionForm({ initialData, onSubmit, isLoading }: Props) {
    const { profile } = useAuthStore();
    const { parties } = usePartyStore();
    const [orgName, setOrgName] = useState('Organization');

    useEffect(() => {
        if (profile?.organizationId) {
            OrganizationService.getOrganization(profile.organizationId).then(org => {
                if (org) setOrgName(org.orgName);
            });
        }
    }, [profile?.organizationId]);

    const { control, handleSubmit, watch, setValue, register, formState: { errors } } = useForm<any>({
        resolver: zodResolver(transactionSchema),
        defaultValues: initialData || {
            date: dayjs().format('YYYY-MM-DD'),
            type: TransactionType.CR,
            fromPartyId: '',
            toPartyId: '',
            description: '',
            amount: '' as any,
        }
    });

    const selectedType = watch('type');
    const [fromParty, setFromParty] = useState<Party | null>(null);
    const [toParty, setToParty] = useState<Party | null>(null);

    // Find CASH party
    const cashParty = parties.find(p => p.code === 'CASH');

    // Initialize from/to party states for editing
    useEffect(() => {
        if (initialData && parties.length > 0) {
            if (initialData.fromPartyId) {
                const p = parties.find(x => x.id === initialData.fromPartyId);
                if (p) setFromParty(p);
            }
            if (initialData.toPartyId) {
                const p = parties.find(x => x.id === initialData.toPartyId);
                if (p) setToParty(p);
            }
        }
    }, [initialData?.id, parties]); // Run when initialData ID or parties list changes

    useEffect(() => {
        if (!cashParty) return;

        if (selectedType === TransactionType.CR) {
            setToParty(cashParty);
            setValue('toPartyId', cashParty.id);
            if (fromParty?.id === cashParty.id) { setFromParty(null); setValue('fromPartyId', ''); }
        } else if (selectedType === TransactionType.CP) {
            setFromParty(cashParty);
            setValue('fromPartyId', cashParty.id);
            if (toParty?.id === cashParty.id) { setToParty(null); setValue('toPartyId', ''); }
        } else if (selectedType === TransactionType.SI || selectedType === TransactionType.PR) {
             // From: Org, To: Party
             setValue('fromPartyId', profile?.organizationId || ''); // Use org ID
             if (fromParty) setFromParty(null); // Clear manual selection
        } else if (selectedType === TransactionType.PI || selectedType === TransactionType.SR) {
             // From: Party, To: Org
             setValue('toPartyId', profile?.organizationId || ''); // Use org ID
             if (toParty) setToParty(null); // Clear manual selection
        } else {
            // Non-cash transactions: If current selection is CASH, clear it
            if (fromParty?.id === cashParty.id) { setFromParty(null); setValue('fromPartyId', ''); }
            if (toParty?.id === cashParty.id) { setToParty(null); setValue('toPartyId', ''); }
        }
    }, [selectedType, cashParty, setValue, profile?.organizationId]);

    const handleFormSubmit = (data: TransactionFormData) => {
        onSubmit({
            ...data,
            amount: Math.round(Number(data.amount) * 100)
        });
    };

    const renderPartyField = (role: 'from' | 'to') => {
        const isFrom = role === 'from';
        const fieldName = isFrom ? 'fromPartyId' : 'toPartyId';
        const label = isFrom ? 'From Party' : 'To Party';

        // Logic for default/fixed values
        const isCashFixed = (selectedType === TransactionType.CR && !isFrom) || (selectedType === TransactionType.CP && isFrom);
        const isOrgFixed = 
            ((selectedType === TransactionType.SI || selectedType === TransactionType.PR) && isFrom) ||
            ((selectedType === TransactionType.PI || selectedType === TransactionType.SR) && !isFrom);

        if (isCashFixed) {
            return (
                <TextField
                    label={label}
                    value="Cash in Hand (CASH)"
                    disabled
                    fullWidth
                    size="small"
                />
            );
        }

        if (isOrgFixed) {
            return (
                <TextField
                    label={label}
                    value={`${orgName} (Fixed)`}
                    disabled
                    fullWidth
                    size="small"
                />
            );
        }

        return (
            <Controller
                name={fieldName}
                control={control}
                render={({ field }) => (
                    <PartySelector
                        label={label}
                        value={isFrom ? fromParty : toParty}
                        filter={(p) => {
                            // If CR/CP, the OTHER side must NOT be cash
                            if (selectedType === TransactionType.CR || selectedType === TransactionType.CP) {
                                return p.code !== 'CASH';
                            }
                            // Otherwise, NO side can be cash
                            return p.code !== 'CASH';
                        }}
                        onChange={(p) => {
                            if (isFrom) setFromParty(p);
                            else setToParty(p);
                            field.onChange(p?.id || '');
                        }}
                        error={!!errors[fieldName]}
                        helperText={errors[fieldName]?.message}
                    />
                )}
            />
        );
    };

    return (
        <Box component="form" onSubmit={handleSubmit(handleFormSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <Controller
                        name="type"
                        control={control}
                        render={({ field }) => (
                            <TransactionTypeSelect value={field.value} onChange={field.onChange} />
                        )}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                        label="Date"
                        type="date"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        {...register('date')}
                        onFocus={(e) => (e.target as any).showPicker?.()}
                        error={!!errors.date}
                        helperText={errors.date?.message}
                    />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                    {renderPartyField('from')}
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    {renderPartyField('to')}
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <TextField
                        label="Description"
                        multiline rows={2}
                        fullWidth
                        {...register('description')}
                        error={!!errors.description}
                        helperText={errors.description?.message}
                    />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                        label="Amount (₹)"
                        inputMode="numeric"
                        type="number"
                        inputProps={{ step: "0.01", min: "0" }}
                        fullWidth
                        {...register('amount', { valueAsNumber: true })}
                        error={!!errors.amount}
                        helperText={errors.amount?.message}
                    />
                </Grid>
            </Grid>

            <Button type="submit" variant="contained" size="large" disabled={isLoading} sx={{ mt: 2, color: 'white' }}>
                {isLoading ? 'Saving...' : 'Save Transaction'}
            </Button>
        </Box>
    );
}
