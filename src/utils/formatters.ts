import dayjs from 'dayjs';
import { Timestamp } from 'firebase/firestore';

export const formatINR = (amountInPaisa: number): string => {
    const rupees = amountInPaisa / 100;
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
    }).format(rupees);
};

export const formatINRPdf = (amountInPaisa: number): string => {
    const rupees = amountInPaisa / 100;
    return 'Rs. ' + rupees.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

export const formatDate = (date: Date | Timestamp): string => {
    if (date instanceof Timestamp) {
        return dayjs(date.toDate()).format('DD/MM/YYYY');
    }
    return dayjs(date).format('DD/MM/YYYY');
};

const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

export const formatAmountInWords = (amountInPaisa: number): string => {
    let num = Math.floor(amountInPaisa / 100).toString();
    if (num === '0') return 'Zero Rupees Only';
    if (num.length > 9) return 'Amount too large';

    const n = ('000000000' + num).slice(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';

    let str = '';
    str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[Number(n[1].charAt(0))] + ' ' + a[Number(n[1].charAt(1))]) + 'Crore ' : '';
    str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[Number(n[2].charAt(0))] + ' ' + a[Number(n[2].charAt(1))]) + 'Lakh ' : '';
    str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[Number(n[3].charAt(0))] + ' ' + a[Number(n[3].charAt(1))]) + 'Thousand ' : '';
    str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[Number(n[4].charAt(0))] + ' ' + a[Number(n[4].charAt(1))]) + 'Hundred ' : '';
    str += (Number(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[Number(n[5].charAt(0))] + ' ' + a[Number(n[5].charAt(1))]) : '';

    return str.trim() + ' Rupees Only';
};
