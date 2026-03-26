import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { TRANSACTION_TYPE_LABELS, TransactionType } from '../../config/constants';

const styles = StyleSheet.create({
    page: { padding: 30, fontSize: 10, fontFamily: 'Helvetica' },
    title: { fontSize: 16, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    table: { display: 'flex', width: 'auto', borderStyle: 'solid', borderWidth: 1, borderColor: '#bfbfbf' },
    tableRow: { margin: 'auto', flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#bfbfbf' },
    tableHeader: { backgroundColor: '#f0f0f0', fontWeight: 'bold' },
    tableCell: { margin: 'auto', padding: 5, borderRightWidth: 1, borderRightColor: '#bfbfbf' },
    lastCell: { borderRightWidth: 0 },
    colSl: { width: '8%' },
    colDate: { width: '12%' },
    colType: { width: '13%' },
    colFrom: { width: '18%' },
    colTo: { width: '18%' },
    colAmount: { width: '12%' },
    colDesc: { width: '27%' },
    amountText: { textAlign: 'right' }
});

export default function ReportDocument({ title, transactions }: { title: string, transactions: any[] }) {
    return (
        <Document>
            <Page size="A4" orientation="landscape" style={styles.page}>
                <Text style={styles.title}>{title}</Text>
                
                <View style={styles.table}>
                    {/* Header */}
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <View style={[styles.tableCell, styles.colDate]}><Text>Date</Text></View>
                        <View style={[styles.tableCell, styles.colType]}><Text>Type</Text></View>
                        <View style={[styles.tableCell, styles.colFrom]}><Text>From Party</Text></View>
                        <View style={[styles.tableCell, styles.colTo]}><Text>To Party</Text></View>
                        <View style={[styles.tableCell, styles.colAmount]}><Text>Amount</Text></View>
                        <View style={[styles.tableCell, styles.colDesc, styles.lastCell]}><Text>Description</Text></View>
                    </View>
                    {/* Rows */}
                    {transactions.map((tx, index) => (
                        <View key={index} style={styles.tableRow}>
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
