import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { Box, Button, TextField, Grid } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { useBlocker } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { transactionSchema } from '../../utils/validators';
import type { TransactionFormData } from '../../utils/validators';
import { TransactionType } from '../../config/constants';
import TransactionTypeSelect from './TransactionTypeSelect';
import PartySelector from '../party/PartySelector';
import { usePartyStore } from '../../stores/partyStore';
import type { Party } from '../../types/party.types';
import { useOrganizationStore } from '../../stores/organizationStore';
import { getFinancialYearBounds } from '../../utils/dateUtils';
import ConfirmDialog from '../common/ConfirmDialog';

interface Props {
    initialData?: any;
    onSubmit: (data: TransactionFormData) => Promise<void>;
    isLoading: boolean;
}

export default function TransactionForm({ initialData, onSubmit, isLoading }: Props) {
    const { parties } = usePartyStore();
    const { currentOrganization } = useOrganizationStore();
    
    // Prevent closing tab/window while saving
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isLoading) {
                e.preventDefault();
                e.returnValue = ''; // Required for some browsers
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isLoading]);

    const hasSubmittedRef = React.useRef(false);

    // Prevent navigation within the app ONLY while actively saving
    const blocker = useBlocker(({ nextLocation }) => {
        return isLoading; 
    });

    const fyParams = React.useMemo(() => {
        if (currentOrganization?.subscriptionStart && currentOrganization?.subscriptionEnd) {
            return {
                startDate: currentOrganization.subscriptionStart,
                endDate: currentOrganization.subscriptionEnd,
                label: currentOrganization.subscriptionLabel || 'Active Subscription'
            };
        }
        if (currentOrganization?.createdAt) {
            const d = (currentOrganization.createdAt as any).toDate ? (currentOrganization.createdAt as any).toDate() : currentOrganization.createdAt;
            return getFinancialYearBounds(d);
        }
        return getFinancialYearBounds();
    }, [currentOrganization]);

    const boundedSchema = React.useMemo(() => {
        return transactionSchema.refine((data) => {
            const d = dayjs(data.date);
            return (d.isSame(fyParams.startDate, 'day') || d.isAfter(fyParams.startDate, 'day')) && 
                   (d.isSame(fyParams.endDate, 'day') || d.isBefore(fyParams.endDate, 'day'));
        }, {
            message: `Date must be within your subscription period (${fyParams.startDate} to ${fyParams.endDate})`,
            path: ["date"]
        });
    }, [fyParams]);

    const { control, handleSubmit, watch, setValue, register, reset, formState: { errors, isDirty } } = useForm<any>({
        resolver: zodResolver(boundedSchema),
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
            reset(initialData); // Ensure all fields are filled
            if (initialData.fromPartyId) {
                const p = parties.find(x => x.id === initialData.fromPartyId);
                if (p) setFromParty(p);
            }
            if (initialData.toPartyId) {
                const p = parties.find(x => x.id === initialData.toPartyId);
                if (p) setToParty(p);
            }
        }
    }, [initialData?.id, parties, reset]); 

    useEffect(() => {
        if (initialData || parties.length === 0) return;

        // Phase 58: Reset form on type change
        const isTypeSwitched = prevTypeRef.current !== selectedType;
        prevTypeRef.current = selectedType;

        if (isTypeSwitched) {
            setFromParty(null);
            setToParty(null);
            setValue('fromPartyId', '', { shouldDirty: false });
            setValue('toPartyId', '', { shouldDirty: false });
            setValue('description', '', { shouldDirty: false });
            setValue('amount', '' as any, { shouldDirty: false });
        }

        const cashParty = parties.find(p => p.code === 'CASH');
        const saleParty = parties.find(p => p.code === 'SALE');
        const purcParty = parties.find(p => p.code === 'PURC');
        const sretParty = parties.find(p => p.code === 'SRET');
        const pretParty = parties.find(p => p.code === 'PRET');

        if (selectedType === TransactionType.CR && cashParty) {
            setToParty(cashParty); setValue('toPartyId', cashParty.id, { shouldDirty: false });
        } else if (selectedType === TransactionType.CP && cashParty) {
            setFromParty(cashParty); setValue('fromPartyId', cashParty.id, { shouldDirty: false });
        } else if (selectedType === TransactionType.SI && saleParty) {
            setFromParty(saleParty); setValue('fromPartyId', saleParty.id, { shouldDirty: false });
        } else if (selectedType === TransactionType.PI && purcParty) {
            setToParty(purcParty); setValue('toPartyId', purcParty.id, { shouldDirty: false });
        } else if (selectedType === TransactionType.SR && sretParty) {
            setToParty(sretParty); setValue('toPartyId', sretParty.id, { shouldDirty: false });
        } else if (selectedType === TransactionType.PR && pretParty) {
            setFromParty(pretParty); setValue('fromPartyId', pretParty.id, { shouldDirty: false });
        }
    }, [selectedType, parties, setValue, initialData]);

    const handleFormSubmit = async (data: TransactionFormData) => {
        try {
            hasSubmittedRef.current = true;
            await onSubmit({
                ...data,
                amount: Math.round(Number(data.amount) * 100)
            });
            reset(); // Clear isDirty state after successful save
        } catch (err) {
            hasSubmittedRef.current = false;
            console.error("Submission error in form:", err);
        }
    };

    const renderPartyField = (role: 'from' | 'to') => {
        const isFrom = role === 'from';
        const fieldName = isFrom ? 'fromPartyId' : 'toPartyId';
        const label = isFrom ? 'From Party' : 'To Party';

        const isCashFixed = (selectedType === TransactionType.CR && !isFrom) || (selectedType === TransactionType.CP && isFrom);
        const isSaleFixed = selectedType === TransactionType.SI && isFrom;
        const isPurcFixed = selectedType === TransactionType.PI && !isFrom;
        const isSretFixed = selectedType === TransactionType.SR && !isFrom;
        const isPretFixed = selectedType === TransactionType.PR && isFrom;

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

                            // Enforce Bank rules
                            if (selectedType === TransactionType.BR && !isFrom && !p.isBank) return false; // Receiver must be a bank
                            if (selectedType === TransactionType.BP && isFrom && !p.isBank) return false; // Giver must be a bank

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
                        inputProps={{ min: fyParams.startDate, max: fyParams.endDate }}
                        {...register('date', {
                            onChange: (e) => {
                                if (e.target.value) {
                                    (e.target as any).blur();
                                }
                            }
                        })}
                        onClick={(e) => (e.target as any).showPicker?.()}
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
            <ConfirmDialog
                open={blocker.state === 'blocked'}
                variant="error"
                title="Save in Progress"
                message="Transaction is being recorded. This alert is to prevent the interruption of the save process. Are you sure you want to leave?"
                confirmText="Leave Anyway"
                cancelText="Stay and Save"
                onConfirm={() => blocker.state === 'blocked' && blocker.proceed()}
                onCancel={() => blocker.state === 'blocked' && blocker.reset()}
            />
        </Box>
    );
}
