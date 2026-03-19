import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: { padding: 30, fontSize: 10, fontFamily: 'Helvetica' },
    title: { fontSize: 18, marginBottom: 20, textAlign: 'center', fontWeight: 'bold' },
    subtitle: { fontSize: 12, marginBottom: 20, textAlign: 'center', color: '#666' },
    table: { display: 'flex', width: 'auto', borderStyle: 'solid', borderWidth: 1, borderRightWidth: 0, borderBottomWidth: 0 },
    tableRow: { margin: 'auto', flexDirection: 'row' },
    tableColHeader: { width: '25%', borderStyle: 'solid', borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0, backgroundColor: '#f0f0f0' },
    tableCol: { width: '25%', borderStyle: 'solid', borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0 },
    tableCellHeader: { margin: 5, fontSize: 10, fontWeight: 'bold' },
    tableCell: { margin: 5, fontSize: 10 }
});

interface Props {
    title: string;
    subtitle: string;
    headers: string[];
    rows: any[][];
}

export default function ReportPDF({ title, subtitle, headers, rows }: Props) {
    const colWidth = `${100 / headers.length}%`;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.subtitle}>{subtitle}</Text>
                
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
