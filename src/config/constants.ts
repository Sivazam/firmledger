export enum TransactionType {
    CR = 'CR', // CASH RECEIPT
    CP = 'CP', // CASH PAYMENT
    BR = 'BR', // BANK RECEIPT
    BP = 'BP', // BANK PAYMENT
    SI = 'SI', // SALES
    SR = 'SR', // SALES RETURN
    PI = 'PI', // PURCHASE
    PR = 'PR', // PURCHASE RETURN
    JV = 'JV', // JOURNAL VOUCHER
}

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
    [TransactionType.CR]: 'CASH RECEIPT',
    [TransactionType.CP]: 'CASH PAYMENT',
    [TransactionType.BR]: 'BANK RECEIPT',
    [TransactionType.BP]: 'BANK PAYMENT',
    [TransactionType.SI]: 'SALES',
    [TransactionType.SR]: 'SALES RETURN',
    [TransactionType.PI]: 'PURCHASE',
    [TransactionType.PR]: 'PURCHASE RETURN',
    [TransactionType.JV]: 'JOURNAL VOUCHER',
};

export const VALIDATION_PATTERNS = {
    AADHAR: /^\d{12}$/,
    PAN: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
    GST: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    PHONE: /^\d{10}$/
};
