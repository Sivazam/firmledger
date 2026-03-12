import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';

export function usePDF() {
    const [isGenerating, setIsGenerating] = useState(false);

    const generatePDFBlob = async (document: React.ReactElement): Promise<Blob> => {
        setIsGenerating(true);
        try {
            const asPdf = pdf();
            asPdf.updateContainer(document);
            const blob = await asPdf.toBlob();
            return blob;
        } finally {
            setIsGenerating(false);
        }
    };

    const sharePDF = async (blob: Blob, filename: string) => {
        const file = new File([blob], filename, { type: 'application/pdf' });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: filename,
                });
                return true;
            } catch (err) {
                console.error('Share failed, falling back to download', err);
            }
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return true;
    };

    return { generatePDFBlob, sharePDF, isGenerating };
}
