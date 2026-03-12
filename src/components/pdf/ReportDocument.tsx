import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: { padding: 30, fontSize: 12, fontFamily: 'Helvetica' },
    title: { fontSize: 16, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
});

export default function ReportDocument({ title, children }: any) {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <Text style={styles.title}>{title}</Text>
                <View>
                    <Text>This is a placeholder for the PDF export of reports.</Text>
                </View>
            </Page>
        </Document>
    );
}
