export enum TransactionType {
    RECEIPT = 'receipt',
    PAYMENT = 'payment',
    JOURNAL = 'journal',
    SALES = 'sales',
    PURCHASE = 'purchase',
    SALES_RETURN = 'sales_return',
    PURCHASE_RETURN = 'purchase_return',
}

export const VALIDATION_PATTERNS = {
    AADHAR: /^\d{12}$/,
    PAN: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
    GST: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    PHONE: /^\d{10}$/
};
