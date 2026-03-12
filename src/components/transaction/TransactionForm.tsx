import React, { useState, useEffect } from 'react';
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

    const { control, handleSubmit, watch, setValue, register, formState: { errors } } = useForm<TransactionFormData>({
        resolver: zodResolver(transactionSchema),
        defaultValues: initialData || {
            date: new Date(),
            type: TransactionType.RECEIPT,
            fromPartyId: '',
            toPartyId: '',
            description: '',
            amount: '' as any,
        }
    });

    const selectedType = watch('type');
    const [fromParty, setFromParty] = useState<Party | null>(null);
    const [toParty, setToParty] = useState<Party | null>(null);

    // Initialize local party state from passed IDs for edits/loading
    useEffect(() => {
        if (initialData && parties.length > 0) {
            if (initialData.fromPartyId && !fromParty) {
                const fp = parties.find(p => p.id === initialData.fromPartyId);
                if (fp) setFromParty(fp);
            }
            if (initialData.toPartyId && !toParty) {
                const tp = parties.find(p => p.id === initialData.toPartyId);
                if (tp) setToParty(tp);
            }
        }
    }, [initialData, parties]);

    useEffect(() => {
        if (!profile?.organizationId) return;
        const orgId = profile.organizationId;

        switch (selectedType) {
            case TransactionType.RECEIPT:
            case TransactionType.PURCHASE:
            case TransactionType.SALES_RETURN:
                setValue('toPartyId', orgId);
                if (fromParty?.id === orgId) { setFromParty(null); setValue('fromPartyId', ''); }
                break;
            case TransactionType.PAYMENT:
            case TransactionType.SALES:
            case TransactionType.PURCHASE_RETURN:
                setValue('fromPartyId', orgId);
                if (toParty?.id === orgId) { setToParty(null); setValue('toPartyId', ''); }
                break;
            case TransactionType.JOURNAL:
                break;
        }
    }, [selectedType, profile?.organizationId, setValue]);

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

        let isOrgFixed = false;
        if (selectedType === TransactionType.RECEIPT || selectedType === TransactionType.PURCHASE || selectedType === TransactionType.SALES_RETURN) {
            isOrgFixed = !isFrom;
        } else if (selectedType === TransactionType.PAYMENT || selectedType === TransactionType.SALES || selectedType === TransactionType.PURCHASE_RETURN) {
            isOrgFixed = isFrom;
        }

        if (isOrgFixed) {
            return (
                <TextField
                    label={label}
                    value={orgName}
                    disabled
                    fullWidth
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
                        {...register('date', { valueAsDate: true })}
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
                        type="number"
                        inputProps={{ step: "0.01", min: "0" }}
                        fullWidth
                        {...register('amount', { valueAsNumber: true })}
                        error={!!errors.amount}
                        helperText={errors.amount?.message}
                    />
                </Grid>
            </Grid>

            <Button type="submit" variant="contained" size="large" disabled={isLoading} sx={{ mt: 2 }}>
                {isLoading ? 'Saving...' : 'Save Transaction'}
            </Button>
        </Box>
    );
}
