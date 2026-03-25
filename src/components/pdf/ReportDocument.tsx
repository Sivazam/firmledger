import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: { padding: 30, fontSize: 10, fontFamily: 'Helvetica' },
    title: { fontSize: 16, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    table: { display: 'flex', width: 'auto', borderStyle: 'solid', borderWidth: 1, borderColor: '#bfbfbf' },
    tableRow: { margin: 'auto', flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#bfbfbf' },
    tableHeader: { backgroundColor: '#f0f0f0', fontWeight: 'bold' },
    tableCell: { margin: 'auto', padding: 5, borderRightWidth: 1, borderRightColor: '#bfbfbf' },
    lastCell: { borderRightWidth: 0 },
    colSl: { width: '8%' },
    colDate: { width: '15%' },
    colType: { width: '12%' },
    colParties: { width: '45%' },
    colAmount: { width: '20%' },
    amountText: { textAlign: 'right' }
});

export default function ReportDocument({ title, transactions }: { title: string, transactions: any[] }) {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <Text style={styles.title}>{title}</Text>
                
                <View style={styles.table}>
                    {/* Header */}
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <View style={[styles.tableCell, styles.colSl]}><Text>SL</Text></View>
                        <View style={[styles.tableCell, styles.colDate]}><Text>Date</Text></View>
                        <View style={[styles.tableCell, styles.colType]}><Text>Type</Text></View>
                        <View style={[styles.tableCell, styles.colParties]}><Text>{"Parties (From -> To)"}</Text></View>
                        <View style={[styles.tableCell, styles.colAmount, styles.lastCell]}><Text>Amount</Text></View>
                    </View>

                    {/* Rows */}
                    {transactions.map((tx, index) => (
                        <View key={index} style={styles.tableRow}>
                            <View style={[styles.tableCell, styles.colSl]}><Text>{tx.slNo}</Text></View>
                            <View style={[styles.tableCell, styles.colDate]}><Text>{tx.date ? (tx.date.toDate ? tx.date.toDate().toLocaleDateString() : new Date(tx.date).toLocaleDateString()) : ''}</Text></View>
                            <View style={[styles.tableCell, styles.colType]}><Text>{tx.type}</Text></View>
                            <View style={[styles.tableCell, styles.colParties]}><Text>{tx.fromPartyName + " -> " + tx.toPartyName}</Text></View>
                            <View style={[styles.tableCell, styles.colAmount, styles.lastCell]}><Text style={styles.amountText}>{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text></View>
                        </View>
                    ))}
                </View>

                {/* Footer or total can be added here if needed */}
            </Page>
        </Document>
    );
}
