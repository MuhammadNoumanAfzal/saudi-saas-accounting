/**
 * ZATCA Phase 1 E-Invoicing TLV (Tag-Length-Value) Base64 QR Code Encoder
 * 
 * Saudi ZATCA (GAZT) mandatory fields for Phase 1 E-Invoicing:
 * Tag 1: Seller's Name
 * Tag 2: Seller's VAT Registration Number (15 digits)
 * Tag 3: Time stamp of the Invoice (ISO 8601 UTC e.g. 2026-09-19T14:30:00Z)
 * Tag 4: Invoice Total (with VAT)
 * Tag 5: VAT Total
 */

export interface ZatcaQrInput {
  sellerName: string;
  vatNumber: string;
  timestamp: string; // ISO string or YYYY-MM-DDTHH:mm:ssZ
  totalAmount: string; // e.g. "115.00"
  taxAmount: string; // e.g. "15.00"
}

function encodeTlvTag(tagNumber: number, value: string): Buffer {
  const valueBuffer = Buffer.from(value, 'utf-8');
  const tagBuffer = Buffer.from([tagNumber]);
  const lengthBuffer = Buffer.from([valueBuffer.length]);
  return Buffer.concat([tagBuffer, lengthBuffer, valueBuffer]);
}

export function generateZatcaTlvQrCode(input: ZatcaQrInput): string {
  const tlvTag1 = encodeTlvTag(1, input.sellerName || 'KHANBAS NEXUS Store');
  const tlvTag2 = encodeTlvTag(2, input.vatNumber || '310000000000003');
  const tlvTag3 = encodeTlvTag(3, input.timestamp || new Date().toISOString());
  const tlvTag4 = encodeTlvTag(4, parseFloat(input.totalAmount || '0').toFixed(2));
  const tlvTag5 = encodeTlvTag(5, parseFloat(input.taxAmount || '0').toFixed(2));

  const concatenatedBuffer = Buffer.concat([tlvTag1, tlvTag2, tlvTag3, tlvTag4, tlvTag5]);
  return concatenatedBuffer.toString('base64');
}
