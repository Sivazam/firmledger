import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { Transaction } from '../../types/transaction.types';
import type { Organization } from '../../types/organization.types';
import { TransactionType } from '../../config/constants';
import { formatDate, formatINRPdf, formatAmountInWords } from '../../utils/formatters';

const styles = StyleSheet.create({
    page: { padding: 20, fontSize: 10, fontFamily: 'NotoSansTelugu', backgroundColor: '#fff' },
    headerBox: { flexDirection: 'row', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1a237e', paddingBottom: 10 },
    logoBox: { width: 50, height: 50, marginRight: 15 },
    logo: { width: '100%', height: '100%', objectFit: 'contain' },
    orgDetails: { flex: 1 },
    orgName: { fontSize: 18, fontWeight: 'bold', color: '#1a237e', marginBottom: 2 },
    orgAddress: { fontSize: 9, color: '#555', marginBottom: 1 },
    titleBox: { textAlign: 'center', marginBottom: 12, padding: 6, backgroundColor: '#f5f5f5', borderRadius: 4 },
    titleText: { fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', color: '#333', letterSpacing: 1 },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    metaLabel: { fontSize: 9, color: '#666' },
    metaValue: { fontSize: 10, fontWeight: 'bold', color: '#111' },
    detailsBox: { border: '0.5pt solid #ccc', padding: 12, marginBottom: 15, borderRadius: 2 },
    detailRow: { flexDirection: 'row', marginBottom: 8 },
    detailLabel: { width: 110, fontSize: 10, color: '#777', fontWeight: 'bold' },
    detailValue: { flex: 1, fontSize: 10, color: '#222' },
    amountBox: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#eee', flexDirection: 'column' },
    amountLabel: { fontSize: 9, color: '#777', marginBottom: 4 },
    amountNum: { fontSize: 16, fontWeight: 'bold', color: '#1a237e' },
    amountWords: { fontSize: 9, fontStyle: 'italic', marginTop: 4, color: '#555' },
    footer: { flexDirection: 'row', justifyContent: 'space-between', position: 'absolute', bottom: 20, left: 20, right: 20 },
    signBox: { width: 140, borderTopWidth: 1, borderTopColor: '#ccc', textAlign: 'center', paddingTop: 6 }
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
                    {transaction.phoneNumber && (
                        <View style={{ ...styles.detailRow, marginTop: 4 }}>
                            <Text style={styles.detailLabel}>Phone No:</Text>
                            <Text style={styles.detailValue}>{transaction.phoneNumber}</Text>
                        </View>
                    )}
                    {transaction.referenceNumber && (
                        <View style={{ ...styles.detailRow, marginTop: 4 }}>
                            <Text style={styles.detailLabel}>Receipt No:</Text>
                            <Text style={styles.detailValue}>{transaction.referenceNumber}</Text>
                        </View>
                    )}
                    <View style={{ ...styles.detailRow, marginTop: 10 }}>
                        <Text style={styles.detailLabel}>Description:</Text>
                        <Text style={styles.detailValue}>{transaction.description}</Text>
                    </View>

                    <View style={styles.amountBox}>
                        <Text style={styles.amountLabel}>Total Amount (in numbers):</Text>
                        <Text style={styles.amountNum}>{formatINRPdf(transaction.amount)}</Text>
                        <Text style={styles.amountWords}>{formatAmountInWords(transaction.amount)}</Text>
                    </View>
                </View>

                <View style={styles.footer}>
                    <View>
                        {transaction.createdBy_name && (
                            <Text style={{ fontSize: 8, color: '#777', marginTop: 10 }}>
                                Recorded by: {transaction.createdBy_name}
                            </Text>
                        )}
                    </View>
                    <View style={styles.signBox}>
                        <Text style={{ fontSize: 10 }}>Authorized Signatory</Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
}
