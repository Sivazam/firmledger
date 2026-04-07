import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { Organization } from '../../types/organization.types';
import { formatDate } from '../../utils/formatters';

const styles = StyleSheet.create({
    page: { padding: 30, fontSize: 9, fontFamily: 'NotoSansTelugu', backgroundColor: '#fff' },
    header: { flexDirection: 'row', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#1a237e', paddingBottom: 10 },
    logoBox: { width: 50, height: 50, marginRight: 15 },
    logo: { width: '100%', height: '100%', objectFit: 'contain' },
    orgDetails: { flex: 1 },
    orgName: { fontSize: 16, fontWeight: 'bold', color: '#1a237e', marginBottom: 2 },
    orgAddress: { fontSize: 8, color: '#555' },
    reportInfo: { textAlign: 'right', justifyContent: 'center' },
    title: { fontSize: 14, fontWeight: 'bold', color: '#1a237e', marginBottom: 2 },
    subtitle: { fontSize: 8, color: '#666' },
    table: { display: 'flex', width: 'auto', borderStyle: 'solid', borderWidth: 0.5, borderColor: '#ccc' },
    tableRow: { margin: 'auto', flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#eee' },
    tableHeader: { backgroundColor: '#1a237e', color: '#fff', fontWeight: 'bold' },
    tableCell: { margin: 'auto', padding: 4, borderRightWidth: 0.5, borderRightColor: '#eee' },
    lastCell: { borderRightWidth: 0 },
    colType: { width: '8%' },
    colDate: { width: '12%' },
    colDesc: { width: '30%' },
    colAmount: { width: '15%' },
    colBalance: { width: '20%' },
    amountText: { textAlign: 'right', fontWeight: 'bold' }
});

export interface LedgerEntry {
    id: string;
    type: string;
    date: any;
    description: string;
    debit: number;
    credit: number;
    balance: number;
}

interface Props {
    title: string;
    partyName: string;
    partyCode: string;
    dateRange: string;
    entries: LedgerEntry[];
    organization: Organization | null;
}

export default function LedgerDocument({ title, partyName, partyCode, dateRange, entries, organization }: Props) {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header Section */}
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
                        <Text style={styles.subtitle}>{partyName} ({partyCode})</Text>
                        <Text style={styles.subtitle}>Period: {dateRange}</Text>
                        <Text style={styles.subtitle}>Generated: {new Date().toLocaleDateString('en-GB')}</Text>
                    </View>
                </View>

                {/* Ledger Table */}
                <View style={styles.table}>
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <View style={[styles.tableCell, styles.colType]}><Text style={{ color: '#fff' }}>Type</Text></View>
                        <View style={[styles.tableCell, styles.colDate]}><Text style={{ color: '#fff' }}>Date</Text></View>
                        <View style={[styles.tableCell, styles.colDesc]}><Text style={{ color: '#fff' }}>Description</Text></View>
                        <View style={[styles.tableCell, styles.colAmount]}><Text style={{ color: '#fff', textAlign: 'right' }}>Debit</Text></View>
                        <View style={[styles.tableCell, styles.colAmount]}><Text style={{ color: '#fff', textAlign: 'right' }}>Credit</Text></View>
                        <View style={[styles.tableCell, styles.colBalance, styles.lastCell]}><Text style={{ color: '#fff', textAlign: 'right' }}>Balance</Text></View>
                    </View>

                    {entries.map((entry, index) => (
                        <View key={entry.id} style={styles.tableRow}>
                            <View style={[styles.tableCell, styles.colType]}><Text>{entry.type}</Text></View>
                            <View style={[styles.tableCell, styles.colDate]}>
                                <Text>{entry.id === 'opening' ? 'Opening' : (entry.date ? formatDate(entry.date) : '-')}</Text>
                            </View>
                            <View style={[styles.tableCell, styles.colDesc]}><Text>{entry.description}</Text></View>
                            <View style={[styles.tableCell, styles.colAmount]}>
                                <Text style={styles.amountText}>{entry.debit > 0 ? (entry.debit / 100).toFixed(2) : '-'}</Text>
                            </View>
                            <View style={[styles.tableCell, styles.colAmount]}>
                                <Text style={styles.amountText}>{entry.credit > 0 ? (entry.credit / 100).toFixed(2) : '-'}</Text>
                            </View>
                            <View style={[styles.tableCell, styles.colBalance, styles.lastCell]}>
                                <Text style={[styles.amountText, { color: entry.balance >= 0 ? '#10B981' : '#EF4444' }]}>
                                    {(Math.abs(entry.balance) / 100).toFixed(2)}
                                    {entry.balance !== 0 && (entry.balance > 0 ? ' Dr' : ' Cr')}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Footer totals can be added here */}
            </Page>
        </Document>
    );
}
