export type ReceiptSettings = {
  storeName: string;
  address: string;
  phone: string;
  tax: number;
  service: number;
  receiptFooter: string;
};

export type PrintableTransaction = {
  invoice: string;
  date: string;
  customer: string;
  cashier: string;
  total: number;
  subtotal: number;
  discount: number;
  payment: string;
  items: { name: string; qty: number; price: number }[];
};

export type PrintableProduct = { code: string; name: string; category: string; price: number };
type SerialWriter = { write(data: Uint8Array): Promise<void>; releaseLock(): void };
type SerialPortLike = { readable?: unknown; writable?: { getWriter(): SerialWriter }; open(options: { baudRate: number }): Promise<void>; close(): Promise<void> };
type SerialApi = { requestPort(): Promise<SerialPortLike> };
type UsbApi = { getDevices(): Promise<unknown[]>; requestDevice(options: { filters: unknown[] }): Promise<unknown> };

let connectedPort: SerialPortLike | null = null;
let paperWidth: 58 | 80 = 58;
const encoder = new TextEncoder();
const esc = 0x1b;
const gs = 0x1d;

function bytes(...chunks: (Uint8Array | number[])[]) { const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0); const output = new Uint8Array(total); let offset = 0; chunks.forEach((chunk) => { output.set(chunk, offset); offset += chunk.length; }); return output; }
function text(value: string) { return encoder.encode(`${value}\n`); }
function center(value: string) { return bytes([esc, 0x61, 0x01], text(value)); }
function left() { return new Uint8Array([esc, 0x61, 0x00]); }
function bold(enabled: boolean) { return new Uint8Array([esc, 0x45, enabled ? 0x01 : 0x00]); }
function cut() { return new Uint8Array([gs, 0x56, 0x42, 0x00]); }
function line(leftValue: string, rightValue: string) { const columns = paperWidth === 80 ? 48 : 32; const safeLeft = leftValue.slice(0, Math.max(12, columns - 12)); const safeRight = rightValue.slice(0, 16); const spaces = Math.max(1, columns - safeLeft.length - safeRight.length); return text(`${safeLeft}${" ".repeat(spaces)}${safeRight}`); }
function getSerialApi() { return (navigator as Navigator & { serial?: SerialApi }).serial; }
function getUsbApi() { return (navigator as Navigator & { usb?: UsbApi }).usb; }

export function isThermalPrinterSupported() { return typeof navigator !== "undefined" && Boolean(getSerialApi()); }
export function isThermalPrinterWebUsbSupported() { return typeof navigator !== "undefined" && Boolean(getUsbApi()); }
export function setThermalPrinterPaperWidth(width: 58 | 80) { paperWidth = width; }
export function getThermalPrinterPaperWidth() { return paperWidth; }
export function isThermalPrinterConnected() { return Boolean(connectedPort); }
export async function connectThermalPrinter() { const serial = getSerialApi(); if (!serial) throw new Error("Browser ini belum mendukung Web Serial. Gunakan Chrome atau Edge desktop."); const port = await serial.requestPort(); await port.open({ baudRate: 9600 }); connectedPort = port; }
export async function disconnectThermalPrinter() { if (!connectedPort) return; await connectedPort.close(); connectedPort = null; }
async function send(data: Uint8Array) { if (!connectedPort?.writable) throw new Error("Printer belum terhubung atau tidak siap menerima data."); const writer = connectedPort.writable.getWriter(); try { await writer.write(data); } finally { writer.releaseLock(); } }

export async function printReceiptThermal(transaction: PrintableTransaction, settings: ReceiptSettings) {
  const itemLines = transaction.items.map((item) => line(`${item.name} x${item.qty}`, formatMoney(item.price * item.qty)));
  const payload = bytes([esc, 0x40], center(settings.storeName), center(settings.address), center(settings.phone), text("------------------------------------------"), left(), line(transaction.invoice, formatDate(transaction.date)), text(`Kasir: ${transaction.cashier}`), text(`Customer: ${transaction.customer}`), text("------------------------------------------"), ...itemLines, text("------------------------------------------"), line("Subtotal", formatMoney(transaction.subtotal)), line("Diskon", `-${formatMoney(transaction.discount)}`), bold(true), line("TOTAL", formatMoney(transaction.total)), bold(false), line("Pembayaran", transaction.payment), text(""), center(settings.receiptFooter), center("KASIR PRO FNP"), text("\n\n"), cut());
  await send(payload);
}

export async function printBarcodeLabelThermal(product: PrintableProduct, settings: ReceiptSettings) {
  const code = product.code.replace(/[^a-zA-Z0-9\-]/g, "").slice(0, 24);
  const barcodeData = encoder.encode(`{B${code}`);
  const payload = bytes([esc, 0x40], center(settings.storeName), bold(true), center(product.name.slice(0, paperWidth === 80 ? 40 : 28)), bold(false), center(product.category), [gs, 0x68, 0x50], [gs, 0x77, 0x02], [gs, 0x6b, 0x49, barcodeData.length], barcodeData, center(code), center(formatMoney(product.price)), text("\n\n"), cut());
  await send(payload);
}

function formatMoney(value: number) { return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value); }
function formatDate(value: string) { return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value)); }
