import { z } from 'zod';
import { VALIDATION_PATTERNS, TransactionType } from '../config/constants';

export const partySchema = z.object({
    code: z.string().min(1, 'Code is required').regex(/^[a-zA-Z0-9]+$/, 'Code must be alphanumeric'),
    name: z.string().min(2, 'Name is required'),
    fatherName: z.string().optional().or(z.literal('')),
    address: z.string().min(5, 'Address is required'),
    town: z.string().min(2, 'Town is required'),
    phoneNumber: z.string().regex(VALIDATION_PATTERNS.PHONE, 'Invalid Phone Number'),
    aadharNumber: z.string().regex(VALIDATION_PATTERNS.AADHAR, 'Invalid Aadhar Number').optional().or(z.literal('')),
    panNumber: z.string().regex(VALIDATION_PATTERNS.PAN, 'Invalid PAN Number').optional().or(z.literal('')),
    gstNumber: z.string().regex(VALIDATION_PATTERNS.GST, 'Invalid GST Number').optional().or(z.literal('')),
    category: z.enum(['CASH', 'BANK', 'CUSTOMER', 'SUPPLIER', 'REVENUE', 'EXPENSE', 'CAPITAL', 'OTHER', 'Trading', 'P & L', 'Balance Sheet']),
    openingBalance: z.number().default(0),
    balanceType: z.enum(['Credit', 'Debit']).default('Debit'),
    isBank: z.boolean().default(false).optional(),
});

export type PartyFormData = z.infer<typeof partySchema>;

export const transactionSchema = z.object({
    date: z.preprocess((val) => (typeof val === 'string' ? new Date(val) : val), z.date({ message: 'Date is required' })),
    type: z.nativeEnum(TransactionType),
    fromPartyId: z.string().min(1, 'From Party is required'),
    toPartyId: z.string().min(1, 'To Party is required'),
    description: z.string().min(3, 'Description is required'),
    amount: z.number().positive('Amount must be positive'),
    phoneNumber: z.string().optional().or(z.literal('')),
    referenceNumber: z.string().optional().or(z.literal('')),
}).refine(data => data.fromPartyId !== data.toPartyId, {
    message: "From Party and To Party cannot be the same",
    path: ["toPartyId"]
});

export type TransactionFormData = z.infer<typeof transactionSchema>;
