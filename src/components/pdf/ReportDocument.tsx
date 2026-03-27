import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { TRANSACTION_TYPE_LABELS, TransactionType } from '../../config/constants';
import type { Organization } from '../../types/organization.types';

const styles = StyleSheet.create({
    page: { padding: 30, fontSize: 9, fontFamily: 'Helvetica', backgroundColor: '#fff' },
    header: { flexDirection: 'row', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#1a237e', paddingBottom: 10 },
    logoBox: { width: 50, height: 50, marginRight: 15 },
    logo: { width: '100%', height: '100%', objectFit: 'contain' },
    orgDetails: { flex: 1 },
    orgName: { fontSize: 16, fontWeight: 'bold', color: '#1a237e', marginBottom: 2 },
    orgAddress: { fontSize: 8, color: '#555' },
    reportInfo: { textAlign: 'right', justifyContent: 'center' },
    title: { fontSize: 14, fontWeight: 'bold', color: '#1a237e', marginBottom: 2 },
    dateRange: { fontSize: 8, color: '#666' },
    table: { display: 'flex', width: 'auto', borderStyle: 'solid', borderWidth: 0.5, borderColor: '#ccc' },
    tableRow: { margin: 'auto', flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#eee' },
    tableHeader: { backgroundColor: '#1a237e', color: '#fff', fontWeight: 'bold' },
    tableCell: { margin: 'auto', padding: 4, borderRightWidth: 0.5, borderRightColor: '#eee' },
    lastCell: { borderRightWidth: 0 },
    colNo: { width: '10%' },
    colDate: { width: '10%' },
    colType: { width: '10%' },
    colFrom: { width: '18%' },
    colTo: { width: '17%' },
    colAmount: { width: '10%' },
    colDesc: { width: '25%' },
    amountText: { textAlign: 'right', fontWeight: 'bold' }
});

export default function ReportDocument({ title, transactions, organization, dateRange }: { title: string, transactions: any[], organization: Organization | null, dateRange?: string }) {
    return (
        <Document>
            <Page size="A4" orientation="landscape" style={styles.page}>
                {/* Premium Header */}
                <View style={styles.header}>
                    {organization?.logoUrl && (
                        <View style={styles.logoBox}>
                            <Image src={organization.logoUrl} style={styles.logo} />
                        </View>
                    )}
                    <View style={styles.orgDetails}>
                        <Text style={styles.orgName}>{organization?.orgName || 'Viswa Ledger'}</Text>
                        <Text style={styles.orgAddress}>{organization?.address || ''}</Text>
                        <Text style={styles.orgAddress}>{organization?.city && organization?.pincode ? `${organization.city} - ${organization.pincode}` : ''}</Text>
                    </View>
                    <View style={styles.reportInfo}>
                        <Text style={styles.title}>{title}</Text>
                        {dateRange && <Text style={styles.dateRange}>{dateRange}</Text>}
                        <Text style={styles.dateRange}>Generated on: {new Date().toLocaleDateString('en-GB')}</Text>
                    </View>
                </View>
                
                <View style={styles.table}>
                    {/* Header */}
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <View style={[styles.tableCell, styles.colNo]}><Text style={{ color: '#fff' }}>Txn No</Text></View>
                        <View style={[styles.tableCell, styles.colDate]}><Text style={{ color: '#fff' }}>Date</Text></View>
                        <View style={[styles.tableCell, styles.colType]}><Text style={{ color: '#fff' }}>Type</Text></View>
                        <View style={[styles.tableCell, styles.colFrom]}><Text style={{ color: '#fff' }}>From Party</Text></View>
                        <View style={[styles.tableCell, styles.colTo]}><Text style={{ color: '#fff' }}>To Party</Text></View>
                        <View style={[styles.tableCell, styles.colAmount]}><Text style={{ color: '#fff' }}>Amount</Text></View>
                        <View style={[styles.tableCell, styles.colDesc, styles.lastCell]}><Text style={{ color: '#fff' }}>Description</Text></View>
                    </View>
                    {/* Rows */}
                    {transactions.map((tx, index) => (
                        <View key={index} style={styles.tableRow}>
                            <View style={[styles.tableCell, styles.colNo]}><Text>{tx.slNo}</Text></View>
                            <View style={[styles.tableCell, styles.colDate]}><Text>{tx.date ? (tx.date.toDate ? tx.date.toDate().toLocaleDateString('en-GB') : new Date(tx.date).toLocaleDateString('en-GB')) : ''}</Text></View>
                            <View style={[styles.tableCell, styles.colType]}><Text>{TRANSACTION_TYPE_LABELS[tx.type as TransactionType] || tx.type}</Text></View>
                            <View style={[styles.tableCell, styles.colFrom]}><Text>{tx.fromPartyName}</Text></View>
                            <View style={[styles.tableCell, styles.colTo]}><Text>{tx.toPartyName}</Text></View>
                            <View style={[styles.tableCell, styles.colAmount]}><Text style={styles.amountText}>{(tx.amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text></View>
                            <View style={[styles.tableCell, styles.colDesc, styles.lastCell]}><Text>{tx.description}</Text></View>
                        </View>
                    ))}
                </View>

                {/* Footer or total can be added here if needed */}
            </Page>
        </Document>
    );
}
