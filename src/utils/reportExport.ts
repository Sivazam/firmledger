export const ReportExportService = {
    exportToCSV: async (filename: string, data: any[], headers: string[], isShare: boolean = false) => {
        const csvRows = [];
        const csvHeaders = headers.map(h => h.replace(/_/g, ' '));
        csvRows.push(csvHeaders.join(','));

        for (const row of data) {
            const values = headers.map(header => {
                const val = (row as any)[header] ?? '';
                const escaped = ('' + val).replace(/"/g, '""');
                return `"${escaped}"`;
            });
            csvRows.push(values.join(','));
        }

        const csvString = csvRows.join('\n');
        const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
        const name = `${filename}.csv`;

        if (isShare && navigator.share) {
            const file = new File([blob], name, { type: 'text/csv' });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        files: [file],
                        title: filename,
                        text: `Exported ${filename}`
                    });
                    return;
                } catch (err) {
                    console.error('Share failed, falling back to download', err);
                }
            }
        }

        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', name);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    }
};
