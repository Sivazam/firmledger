import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { Organization } from '../../types/organization.types';
import type { Party } from '../../types/party.types';

const styles = StyleSheet.create({
    page: { padding: 30, fontSize: 8, fontFamily: 'Helvetica', backgroundColor: '#fff' },
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
    colCode: { width: '8%' },
    colName: { width: '15%' },
    colFather: { width: '12%' },
    colTown: { width: '10%' },
    colPhone: { width: '12%' },
    colGST: { width: '12%' },
    colCategory: { width: '12%' },
    colBalance: { width: '17%' },
    amountText: { textAlign: 'right', fontWeight: 'bold' }
});

export default function PartiesDocument({ parties, organization }: { parties: Party[], organization: Organization | null }) {
    return (
        <Document>
            <Page size="A4" orientation="landscape" style={styles.page}>
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
                        <Text style={styles.title}>Parties Master List</Text>
                        <Text style={styles.dateRange}>Generated on: {new Date().toLocaleDateString('en-GB')}</Text>
                    </View>
                </View>
                
                <View style={styles.table}>
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <View style={[styles.tableCell, styles.colCode]}><Text style={{ color: '#fff' }}>Code</Text></View>
                        <View style={[styles.tableCell, styles.colName]}><Text style={{ color: '#fff' }}>Party Name</Text></View>
                        <View style={[styles.tableCell, styles.colFather]}><Text style={{ color: '#fff' }}>Father Name</Text></View>
                        <View style={[styles.tableCell, styles.colTown]}><Text style={{ color: '#fff' }}>Town</Text></View>
                        <View style={[styles.tableCell, styles.colPhone]}><Text style={{ color: '#fff' }}>Phone</Text></View>
                        <View style={[styles.tableCell, styles.colGST]}><Text style={{ color: '#fff' }}>GST No</Text></View>
                        <View style={[styles.tableCell, styles.colCategory]}><Text style={{ color: '#fff' }}>Category</Text></View>
                        <View style={[styles.tableCell, styles.colBalance, styles.lastCell]}><Text style={{ color: '#fff' }}>Closing Balance</Text></View>
                    </View>
                    
                    {parties.map((party, index) => (
                        <View key={index} style={styles.tableRow}>
                            <View style={[styles.tableCell, styles.colCode]}><Text>{party.code}</Text></View>
                            <View style={[styles.tableCell, styles.colName]}><Text>{party.name}</Text></View>
                            <View style={[styles.tableCell, styles.colFather]}><Text>{party.fatherName || '-'}</Text></View>
                            <View style={[styles.tableCell, styles.colTown]}><Text>{party.town}</Text></View>
                            <View style={[styles.tableCell, styles.colPhone]}><Text>{party.phoneNumber}</Text></View>
                            <View style={[styles.tableCell, styles.colGST]}><Text>{party.gstNumber || '-'}</Text></View>
                            <View style={[styles.tableCell, styles.colCategory]}><Text>{party.category}</Text></View>
                            <View style={[styles.tableCell, styles.colBalance, styles.lastCell]}>
                                <Text style={styles.amountText}>
                                    {((party.openingBalance || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })} {party.balanceType}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>
            </Page>
        </Document>
    );
}
