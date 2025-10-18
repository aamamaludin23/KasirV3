
import type { Transaction, Settings } from '../types';

// ESC/POS Commands
const ESC = '\x1B';
const GS = '\x1D';
const NUL = '\x00';

const INIT = ESC + '@';
const BOLD_ON = ESC + 'E' + '\x01';
const BOLD_OFF = ESC + 'E' + '\x00';
const DBL_H_ON = GS + '!' + '\x10';
const DBL_W_ON = GS + '!' + '\x20';
const DBL_ON = GS + '!' + '\x30';
const DBL_OFF = GS + '!' + '\x00';

const ALIGN_LEFT = ESC + 'a' + '\x00';
const ALIGN_CENTER = ESC + 'a' + '\x01';
const ALIGN_RIGHT = ESC + 'a' + '\x02';

const CUT = GS + 'V' + '\x42' + '\x00'; // Partial cut

function encode(text: string): Uint8Array {
    return new TextEncoder().encode(text);
}

function concat(...arrays: Uint8Array[]): Uint8Array {
    const totalLength = arrays.reduce((acc, arr) => acc + arr.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const arr of arrays) {
        result.set(arr, offset);
        offset += arr.length;
    }
    return result;
}

function formatLine(text: string, width: number): string {
    if (text.length > width) {
        return text.substring(0, width);
    }
    return text;
}

function formatColumns(left: string, right: string, width: number): string {
    const spaceCount = width - left.length - right.length;
    if (spaceCount < 1) {
        return (left + right).substring(0, width);
    }
    return left + ' '.repeat(spaceCount) + right;
}

function formatItem(name: string, qty: string, price: string, total: string, width: number): string {
    const nameWidth = Math.floor(width * 0.45);
    const qtyWidth = Math.floor(width * 0.12);
    const priceWidth = Math.floor(width * 0.20);
    const totalWidth = Math.floor(width * 0.23);

    const paddedName = name.padEnd(nameWidth);
    const paddedQty = qty.padStart(qtyWidth);
    const paddedPrice = price.padStart(priceWidth);
    const paddedTotal = total.padStart(totalWidth);
    
    return `${paddedName.substring(0, nameWidth)}${paddedQty}${paddedPrice}${paddedTotal}\n`;
}

export function generateEscPosReceipt(transaction: Transaction, settings: Settings): Uint8Array {
    const { paperSize = '80mm', taxRate = 11 } = settings;
    const width = paperSize === '58mm' ? 32 : 42;
    const effectiveTaxRate = (taxRate || 11) / 100;

    let receipt = INIT + ALIGN_CENTER;
    receipt += DBL_ON + formatLine(settings.storeName || 'KasirPro', width / 2) + DBL_OFF + '\n';
    receipt += formatLine(settings.address || 'Alamat Toko Anda', width) + '\n';
    receipt += formatLine(`Telp: ${settings.phone || 'Nomor Telepon Anda'}`, width) + '\n';
    receipt += '-'.repeat(width) + '\n';

    receipt += ALIGN_LEFT;
    receipt += formatColumns(`No: ...${transaction.id.slice(-8)}`, `Kasir: ${transaction.cashierName || 'Admin'}`, width) + '\n';
    receipt += formatColumns(new Date(transaction.timestamp).toLocaleDateString('id-ID'), new Date(transaction.timestamp).toLocaleTimeString('id-ID'), width) + '\n';
    receipt += '-'.repeat(width) + '\n';

    // Items
    for (const item of transaction.items) {
        receipt += formatLine(`${item.name} (${item.priceTier.name})`, width) + '\n';
        const line2 = `${item.quantity} x ${item.priceTier.price.toLocaleString('id-ID')}`;
        const total = (item.quantity * item.priceTier.price).toLocaleString('id-ID');
        receipt += formatColumns(line2, total, width) + '\n';
    }

    receipt += '-'.repeat(width) + '\n';

    const subtotal = transaction.items.reduce((sum, item) => sum + item.priceTier.price * item.quantity, 0);
    const tax = subtotal * effectiveTaxRate;

    receipt += ALIGN_RIGHT;
    receipt += formatColumns('Subtotal', `Rp ${subtotal.toLocaleString('id-ID')}`, width) + '\n';
    if (transaction.discount > 0) {
        receipt += formatColumns('Diskon', `- Rp ${transaction.discount.toLocaleString('id-ID')}`, width) + '\n';
    }
    if (transaction.otherFees > 0) {
        receipt += formatColumns('Biaya Lain', `+ Rp ${transaction.otherFees.toLocaleString('id-ID')}`, width) + '\n';
    }
    receipt += formatColumns(`PPN (${taxRate}%)`, `Rp ${tax.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`, width) + '\n';
    receipt += '-'.repeat(width) + '\n';

    receipt += BOLD_ON + DBL_H_ON;
    receipt += formatColumns('TOTAL', `Rp ${transaction.total.toLocaleString('id-ID')}`, width) + '\n';
    receipt += BOLD_OFF + DBL_OFF;
    receipt += '-'.repeat(width) + '\n';

    receipt += ALIGN_LEFT;
    receipt += formatColumns(`Bayar (${transaction.paymentMethod})`, `Rp ${transaction.amountPaid.toLocaleString('id-ID')}`, width) + '\n';
    receipt += formatColumns('Kembali', `Rp ${transaction.change.toLocaleString('id-ID')}`, width) + '\n';
    receipt += '-'.repeat(width) + '\n';

    receipt += ALIGN_CENTER;
    receipt += formatLine(settings.receiptNotes || 'Terima kasih telah berbelanja!', width) + '\n\n';
    
    // Final command
    receipt += CUT;

    return encode(receipt);
}
