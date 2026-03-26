import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { Transaction } from '../../types/transaction.types';
import type { Organization } from '../../types/organization.types';
import { TransactionType } from '../../config/constants';
import { formatDate, formatINRPdf, formatAmountInWords } from '../../utils/formatters';

const styles = StyleSheet.create({
    page: { padding: 30, fontSize: 11, fontFamily: 'Helvetica', backgroundColor: '#fff' },
    headerBox: { flexDirection: 'row', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#1a237e', paddingBottom: 15 },
    logoBox: { width: 60, height: 60, marginRight: 20 },
    logo: { width: '100%', height: '100%', objectFit: 'contain' },
    orgDetails: { flex: 1 },
    orgName: { fontSize: 20, fontWeight: 'bold', color: '#1a237e', marginBottom: 2 },
    orgAddress: { fontSize: 9, color: '#555', marginBottom: 1 },
    titleBox: { textAlign: 'center', marginBottom: 20, padding: 8, backgroundColor: '#f5f5f5', borderRadius: 4 },
    titleText: { fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', color: '#333', letterSpacing: 1 },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
    metaLabel: { fontSize: 10, color: '#666' },
    metaValue: { fontSize: 11, fontWeight: 'bold', color: '#111' },
    detailsBox: { border: '0.5pt solid #ccc', padding: 20, marginBottom: 25, borderRadius: 2 },
    detailRow: { flexDirection: 'row', marginBottom: 12 },
    detailLabel: { width: 90, fontSize: 10, color: '#777', fontWeight: 'bold' },
    detailValue: { flex: 1, fontSize: 11, color: '#222' },
    amountBox: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#eee', flexDirection: 'column' },
    amountLabel: { fontSize: 10, color: '#777', marginBottom: 5 },
    amountNum: { fontSize: 20, fontWeight: 'bold', color: '#1a237e' },
    amountWords: { fontSize: 10, fontStyle: 'italic', marginTop: 8, color: '#555' },
    footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 50 },
    signBox: { width: 160, borderTopWidth: 1, borderTopColor: '#ccc', textAlign: 'center', paddingTop: 8 }
});

interface Props {
    transaction: Transaction;
    organization: Organization;
}

export default function ReceiptDocument({ transaction, organization }: Props) {
    const getDocTitle = () => {
        switch (transaction.type) {
            case TransactionType.CR: return 'Cash Receipt';
            case TransactionType.BR: return 'Bank Receipt';
            case TransactionType.CP: return 'Cash Payment';
            case TransactionType.BP: return 'Bank Payment';
            case TransactionType.SI: return 'Sales Invoice';
            case TransactionType.PI: return 'Purchase Invoice';
            case TransactionType.JV: return 'Journal Voucher';
            case TransactionType.SR: return 'Sales Return (Credit Note)';
            case TransactionType.PR: return 'Purchase Return (Debit Note)';
            default: return 'Transaction Receipt';
        }
    };

    return (
        <Document>
            <Page size="A5" style={styles.page}>
                <View style={styles.headerBox}>
                    {organization.logoUrl && (
                        <View style={styles.logoBox}>
                            <Image src={organization.logoUrl} style={styles.logo} />
                        </View>
                    )}
                    <View style={styles.orgDetails}>
                        <Text style={styles.orgName}>{organization.orgName}</Text>
                        <Text style={styles.orgAddress}>{organization.address}, {organization.city} - {organization.pincode}</Text>
                        {organization.gstNumber && <Text style={styles.orgAddress}>GST: {organization.gstNumber}</Text>}
                    </View>
                </View>

                <View style={styles.titleBox}>
                    <Text style={styles.titleText}>{getDocTitle()}</Text>
                </View>

                <View style={styles.metaRow}>
                    <View>
                        <Text style={styles.metaLabel}>Voucher No:</Text>
                        <Text style={styles.metaValue}>{transaction.slNo}</Text>
                    </View>
                    <View style={{ textAlign: 'right' }}>
                        <Text style={styles.metaLabel}>Date:</Text>
                        <Text style={styles.metaValue}>{formatDate(transaction.date)}</Text>
                    </View>
                </View>

                <View style={styles.detailsBox}>
                    {!(transaction.type === TransactionType.CP && transaction.fromPartyName === 'Cash in Hand') && (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>From:</Text>
                            <Text style={styles.detailValue}>{transaction.fromPartyName}</Text>
                        </View>
                    )}
                    {!(transaction.type === TransactionType.CR && transaction.toPartyName === 'Cash in Hand') && (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>To:</Text>
                            <Text style={styles.detailValue}>{transaction.toPartyName}</Text>
                        </View>
                    )}
                    <View style={{ ...styles.detailRow, marginTop: 10 }}>
                        <Text style={styles.detailLabel}>Description:</Text>
                        <Text style={styles.detailValue}>{transaction.description}</Text>
                    </View>

                    <View style={styles.amountBox}>
                        <Text style={styles.amountLabel}>Total Amount (in numbers):</Text>
                        <Text style={styles.amountNum}>{formatINRPdf(transaction.amount)}</Text>
                        <Text style={styles.amountWords}>Rupees {formatAmountInWords(transaction.amount)} only.</Text>
                    </View>
                </View>

                <View style={styles.footer}>
                    <View />
                    <View style={styles.signBox}>
                        <Text style={{ fontSize: 10 }}>Authorized Signatory</Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
}
