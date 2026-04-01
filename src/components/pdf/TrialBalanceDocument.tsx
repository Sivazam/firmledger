import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { Organization } from '../../types/organization.types';

export interface TrialBalanceEntry {
  partyId: string;
  code: string;
  name: string;
  category: string;
  openingBalance: number; // In natural positive/negative orientation or just raw paisa
  debit: number; // Raw paisa
  credit: number; // Raw paisa
  closingBalance: number; // Raw paisa
}

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
    colCode: { flex: 1.5 },
    colName: { flex: 3.5 },
    colCategory: { flex: 2 },
    colAmount: { flex: 1.5 },
    amountText: { textAlign: 'right', fontWeight: 'bold' }
});

const formatAmount = (amt: number) => {
    return (Math.abs(amt) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
};

export default function TrialBalanceDocument({ entries, organization, dateRange, showTotalActivity = false }: { entries: TrialBalanceEntry[], organization: Organization | null, dateRange?: string, showTotalActivity?: boolean }) {
    
    const totalOpening = entries.reduce((acc, curr) => acc + curr.openingBalance, 0);
    const totalDebit = entries.reduce((acc, curr) => acc + curr.debit, 0);
    const totalCredit = entries.reduce((acc, curr) => acc + curr.credit, 0);
    const totalClosingDebit = entries.reduce((acc, curr) => acc + (curr.closingBalance > 0 ? curr.closingBalance : 0), 0);
    const totalClosingCredit = entries.reduce((acc, curr) => acc + (curr.closingBalance < 0 ? Math.abs(curr.closingBalance) : 0), 0);
    
    return (
        <Document>
            <Page size="A4" style={styles.page}>
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
                        <Text style={styles.title}>Trial / Party Balances</Text>
                        {dateRange && <Text style={styles.dateRange}>{dateRange}</Text>}
                        <Text style={styles.dateRange}>Generated on: {new Date().toLocaleDateString('en-GB')}</Text>
                    </View>
                </View>
                
                <View style={styles.table}>
                    {/* Header */}
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <View style={[styles.tableCell, styles.colCode]}><Text style={{ color: '#fff' }}>Code</Text></View>
                        <View style={[styles.tableCell, styles.colName]}><Text style={{ color: '#fff' }}>Party Name</Text></View>
                        <View style={[styles.tableCell, styles.colCategory]}><Text style={{ color: '#fff' }}>Category</Text></View>
                        <View style={[styles.tableCell, styles.colAmount]}><Text style={{ color: '#fff', textAlign: 'right' }}>Op Balance</Text></View>
                        {showTotalActivity && <View style={[styles.tableCell, styles.colAmount]}><Text style={{ color: '#fff', textAlign: 'right' }}>Total Debit</Text></View>}
                        {showTotalActivity && <View style={[styles.tableCell, styles.colAmount]}><Text style={{ color: '#fff', textAlign: 'right' }}>Total Credit</Text></View>}
                        <View style={[styles.tableCell, styles.colAmount]}><Text style={{ color: '#fff', textAlign: 'right' }}>Debit</Text></View>
                        <View style={[styles.tableCell, styles.colAmount, styles.lastCell]}><Text style={{ color: '#fff', textAlign: 'right' }}>Credit</Text></View>
                    </View>
                    
                    {/* Rows */}
                    {entries.map((entry, index) => (
                        <View key={entry.partyId} style={styles.tableRow}>
                            <View style={[styles.tableCell, styles.colCode]}><Text>{entry.code}</Text></View>
                            <View style={[styles.tableCell, styles.colName]}><Text>{entry.name}</Text></View>
                            <View style={[styles.tableCell, styles.colCategory]}><Text>{entry.category}</Text></View>
                            
                            <View style={[styles.tableCell, styles.colAmount]}>
                                <Text style={[styles.amountText, { color: entry.openingBalance === 0 ? '#555' : (entry.openingBalance < 0 ? 'red' : 'green') }]}>
                                    {entry.openingBalance !== 0 
                                        ? formatAmount(Math.abs(entry.openingBalance)) + (entry.openingBalance > 0 ? ' Dr' : ' Cr') 
                                        : '0.00'}
                                </Text>
                            </View>
                            {showTotalActivity && (
                                <>
                                    <View style={[styles.tableCell, styles.colAmount]}>
                                        <Text style={styles.amountText}>{entry.debit > 0 ? formatAmount(entry.debit) : '-'}</Text>
                                    </View>
                                    <View style={[styles.tableCell, styles.colAmount]}>
                                        <Text style={styles.amountText}>{entry.credit > 0 ? formatAmount(entry.credit) : '-'}</Text>
                                    </View>
                                </>
                            )}
                            <View style={[styles.tableCell, styles.colAmount]}>
                                <Text style={styles.amountText}>
                                    {entry.closingBalance > 0 ? formatAmount(entry.closingBalance) : '-'}
                                </Text>
                            </View>
                            <View style={[styles.tableCell, styles.colAmount, styles.lastCell]}>
                                <Text style={styles.amountText}>
                                    {entry.closingBalance < 0 ? formatAmount(Math.abs(entry.closingBalance)) : '-'}
                                </Text>
                            </View>
                        </View>
                    ))}

                    <View style={[styles.tableRow, { backgroundColor: '#f5f5f5', fontWeight: 'bold' }]}>
                        <View style={[styles.tableCell, styles.colCode]} />
                        <View style={[styles.tableCell, styles.colName]}><Text>Totals</Text></View>
                        <View style={[styles.tableCell, styles.colCategory]} />
                        <View style={[styles.tableCell, styles.colAmount]}>
                            <Text style={[styles.amountText, { color: totalOpening === 0 ? '#000' : (totalOpening < 0 ? 'red' : 'green') }]}>
                                {totalOpening !== 0 
                                    ? formatAmount(Math.abs(totalOpening)) + (totalOpening > 0 ? ' Dr' : ' Cr') 
                                    : '0.00'}
                            </Text>
                        </View>
                        {showTotalActivity && (
                            <>
                                <View style={[styles.tableCell, styles.colAmount]}>
                                    <Text style={styles.amountText}>{formatAmount(totalDebit)}</Text>
                                </View>
                                <View style={[styles.tableCell, styles.colAmount]}>
                                    <Text style={styles.amountText}>{formatAmount(totalCredit)}</Text>
                                </View>
                            </>
                        )}
                        <View style={[styles.tableCell, styles.colAmount]}>
                            <Text style={styles.amountText}>{formatAmount(totalClosingDebit)}</Text>
                        </View>
                        <View style={[styles.tableCell, styles.colAmount, styles.lastCell]}>
                            <Text style={styles.amountText}>{formatAmount(totalClosingCredit)}</Text>
                        </View>
                    </View>
                </View>
            </Page>
        </Document>
    );
}
