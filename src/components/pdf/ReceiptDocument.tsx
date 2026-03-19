import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { Transaction } from '../../types/transaction.types';
import type { Organization } from '../../types/organization.types';
import { TransactionType } from '../../config/constants';
import { formatDate, formatINRPdf, formatAmountInWords } from '../../utils/formatters';

const styles = StyleSheet.create({
    page: { padding: 30, fontSize: 12, fontFamily: 'Helvetica' },
    headerBox: { display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    logoBox: { width: 60, height: 60, marginRight: 15 },
    logo: { width: '100%', height: '100%', objectFit: 'contain' },
    orgDetails: { flex: 1 },
    orgName: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
    orgAddress: { fontSize: 10, color: '#444' },
    titleBox: { textAlign: 'center', marginBottom: 20, padding: 5, backgroundColor: '#f0f0f0' },
    titleText: { fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase' },
    metaRow: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    metaText: { fontSize: 11 },
    detailsBox: { border: '1pt solid #ccc', padding: 15, marginBottom: 20 },
    detailRow: { display: 'flex', flexDirection: 'row', marginBottom: 10 },
    detailLabel: { width: 80, fontWeight: 'bold', color: '#555' },
    detailValue: { flex: 1 },
    amountBox: { marginTop: 10, paddingTop: 10, borderTop: '0.5pt solid #ccc' },
    amountNum: { fontSize: 16, fontWeight: 'bold' },
    amountWords: { fontSize: 11, fontStyle: 'italic', marginTop: 4, color: '#333' },
    footer: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginTop: 40 },
    signBox: { width: 150, borderTop: '1pt solid #000', textAlign: 'center', paddingTop: 5 }
});

interface Props {
    transaction: Transaction;
    organization: Organization;
}

export default function ReceiptDocument({ transaction, organization }: Props) {
    const getDocTitle = () => {
        switch (transaction.type) {
            case TransactionType.CR:
            case TransactionType.BR:
                return 'Receipt Voucher';
            case TransactionType.CP:
            case TransactionType.BP:
                return 'Payment Voucher';
            case TransactionType.SI: return 'Sales Invoice / Voucher';
            case TransactionType.PI: return 'Purchase Voucher';
            case TransactionType.JV: return 'Journal Voucher';
            case TransactionType.SR: return 'Credit Note (Sales Return)';
            case TransactionType.PR: return 'Debit Note (Purchase Return)';
            default: return 'Transaction Voucher';
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
                    <Text style={styles.metaText}>Voucher No: {transaction.slNo}</Text>
                    <Text style={styles.metaText}>Date: {formatDate(transaction.date)}</Text>
                </View>

                <View style={styles.detailsBox}>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>From:</Text>
                        <Text style={styles.detailValue}>{transaction.fromPartyName}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>To:</Text>
                        <Text style={styles.detailValue}>{transaction.toPartyName}</Text>
                    </View>
                    <View style={{ ...styles.detailRow, marginTop: 10 }}>
                        <Text style={styles.detailLabel}>Description:</Text>
                        <Text style={styles.detailValue}>{transaction.description}</Text>
                    </View>

                    <View style={styles.amountBox}>
                        <Text style={styles.amountNum}>Amount: {formatINRPdf(transaction.amount)}</Text>
                        <Text style={styles.amountWords}>({formatAmountInWords(transaction.amount)})</Text>
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
