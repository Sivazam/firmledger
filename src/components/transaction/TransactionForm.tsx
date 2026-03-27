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
import { usePartyStore } from '../../stores/partyStore';
import type { Party } from '../../types/party.types';

interface Props {
    initialData?: any;
    onSubmit: (data: TransactionFormData) => Promise<void>;
    isLoading: boolean;
}

export default function TransactionForm({ initialData, onSubmit, isLoading }: Props) {
    const { parties } = usePartyStore();

    const { control, handleSubmit, watch, setValue, register, formState: { errors } } = useForm<any>({
        resolver: zodResolver(transactionSchema),
        defaultValues: initialData || {
            date: dayjs.tz().format('YYYY-MM-DD'),
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

    const prevTypeRef = React.useRef(selectedType);

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
    }, [initialData?.id, parties]); 

    useEffect(() => {
        if (initialData || parties.length === 0) return;

        // Phase 58: Reset form on type change
        const isTypeSwitched = prevTypeRef.current !== selectedType;
        prevTypeRef.current = selectedType;

        if (isTypeSwitched) {
            setFromParty(null);
            setToParty(null);
            setValue('fromPartyId', '');
            setValue('toPartyId', '');
            setValue('description', '');
            setValue('amount', '' as any);
        }

        const cashParty = parties.find(p => p.code === 'CASH');
        const saleParty = parties.find(p => p.code === 'SALE');
        const purcParty = parties.find(p => p.code === 'PURC');
        const sretParty = parties.find(p => p.code === 'SRET');
        const pretParty = parties.find(p => p.code === 'PRET');

        if (selectedType === TransactionType.CR && cashParty) {
            setToParty(cashParty); setValue('toPartyId', cashParty.id);
        } else if (selectedType === TransactionType.CP && cashParty) {
            setFromParty(cashParty); setValue('fromPartyId', cashParty.id);
        } else if (selectedType === TransactionType.SI && saleParty) {
            setToParty(saleParty); setValue('toPartyId', saleParty.id);
        } else if (selectedType === TransactionType.PI && purcParty) {
            setFromParty(purcParty); setValue('fromPartyId', purcParty.id);
        } else if (selectedType === TransactionType.SR && sretParty) {
            setFromParty(sretParty); setValue('fromPartyId', sretParty.id);
        } else if (selectedType === TransactionType.PR && pretParty) {
            setToParty(pretParty); setValue('toPartyId', pretParty.id);
        }
    }, [selectedType, parties, setValue, initialData]);

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

        const isCashFixed = (selectedType === TransactionType.CR && !isFrom) || (selectedType === TransactionType.CP && isFrom);
        const isSaleFixed = selectedType === TransactionType.SI && !isFrom;
        const isPurcFixed = selectedType === TransactionType.PI && isFrom;
        const isSretFixed = selectedType === TransactionType.SR && isFrom;
        const isPretFixed = selectedType === TransactionType.PR && !isFrom;

        if (isCashFixed) return <TextField label={label} value="Cash in Hand (CASH)" disabled fullWidth size="small" />;
        if (isSaleFixed) return <TextField label={label} value="SALES (SALE)" disabled fullWidth size="small" />;
        if (isPurcFixed) return <TextField label={label} value="PURCHASE (PURC)" disabled fullWidth size="small" />;
        if (isSretFixed) return <TextField label={label} value="SALES RETURN (SRET)" disabled fullWidth size="small" />;
        if (isPretFixed) return <TextField label={label} value="PURCHASE RETURN (PRET)" disabled fullWidth size="small" />;

        return (
            <Controller
                name={fieldName}
                control={control}
                render={({ field }) => (
                    <PartySelector
                        label={label}
                        value={isFrom ? fromParty : toParty}
                        filter={(p) => {
                            // Only allow system parties when they are actively being used manually (like in JV or explicitly needed).
                            // Otherwise, rigidly hide them from generic selections to prevent dirty entries.
                            if (p.code === 'CASH' && !isCashFixed) return false;
                            if (p.code === 'SALE' && !isSaleFixed) return false;
                            if (p.code === 'PURC' && !isPurcFixed) return false;
                            if (p.code === 'SRET' && !isSretFixed) return false;
                            if (p.code === 'PRET' && !isPretFixed) return false;
                            return true;
                        }}
                        onChange={(p) => {
                            if (isFrom) setFromParty(p);
                            else setToParty(p);
                            field.onChange(p?.id || '');
                        }}
                        error={!!errors[fieldName]}
                        helperText={errors[fieldName]?.message as any}
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
                            <TransactionTypeSelect value={field.value} onChange={field.onChange} disabled={!!initialData} />
                        )}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                        label="Date"
                        type="date"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        {...register('date', {
                            onChange: (e) => {
                                if (e.target.value) {
                                    (e.target as any).blur();
                                }
                            }
                        })}
                        onFocus={(e) => (e.target as any).showPicker?.()}
                        error={!!errors.date}
                        helperText={errors.date?.message as any}
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
                        helperText={errors.description?.message as any}
                    />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                        label="Amount (₹)"
                        type="number"
                        inputProps={{ step: "0.01", min: "0", inputMode: 'decimal' }}
                        fullWidth
                        {...register('amount', { valueAsNumber: true })}
                        error={!!errors.amount}
                        helperText={errors.amount?.message as any}
                    />
                </Grid>
            </Grid>

            <Button type="submit" variant="contained" size="large" disabled={isLoading} sx={{ mt: 2, color: 'white' }}>
                {isLoading ? 'Saving...' : 'Save Transaction'}
            </Button>
        </Box>
    );
}
