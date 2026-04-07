import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { Organization } from '../../types/organization.types';

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
    tableColHeader: { borderStyle: 'solid', borderWidth: 0, backgroundColor: '#1a237e', color: '#fff' },
    tableCol: { borderStyle: 'solid', borderBottomWidth: 0, borderTopWidth: 0 },
    tableCellHeader: { margin: 4, fontSize: 9, fontWeight: 'bold', color: '#fff' },
    tableCell: { margin: 4, fontSize: 9 }
});

interface Props {
    title: string;
    subtitle: string;
    headers: string[];
    rows: any[][];
    organization: Organization | null;
}

export default function ReportPDF({ title, subtitle, headers, rows, organization }: Props) {
    const colWidth = `${100 / headers.length}%`;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
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
                        <Text style={styles.subtitle}>{subtitle}</Text>
                        <Text style={styles.subtitle}>Generated on: {new Date().toLocaleDateString('en-GB')}</Text>
                    </View>
                </View>
                
                <View style={styles.table}>
                    <View style={styles.tableRow}>
                        {headers.map((header, i) => (
                            <View key={i} style={{ ...styles.tableColHeader, width: colWidth }}>
                                <Text style={styles.tableCellHeader}>{header}</Text>
                            </View>
                        ))}
                    </View>
                    {rows.map((row, i) => (
                        <View key={i} style={styles.tableRow}>
                            {row.map((cell, j) => (
                                <View key={j} style={{ ...styles.tableCol, width: colWidth }}>
                                    <Text style={styles.tableCell}>{cell}</Text>
                                </View>
                            ))}
                        </View>
                    ))}
                </View>
            </Page>
        </Document>
    );
}
