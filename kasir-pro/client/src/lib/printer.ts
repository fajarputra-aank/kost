import type { ReceiptTemplate } from "@shared/receipt";

export type ReceiptSettings = {
  storeName: string;
  address: string;
  phone: string;
  tax: number;
  service: number;
  receiptFooter: string;
  receiptTemplate: ReceiptTemplate;
};

export type PrintableTransaction = { invoice: string; date: string; customer: string; cashier: string; total: number; subtotal: number; discount: number; payment: string; items: { name: string; qty: number; price: number }[] };
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
function align(template: ReceiptTemplate) { return new Uint8Array([esc, 0x61, template.alignment === "left" ? 0x00 : template.alignment === "right" ? 0x02 : 0x01]); }
function bold(enabled: boolean) { return new Uint8Array([esc, 0x45, enabled ? 0x01 : 0x00]); }
function cut() { return new Uint8Array([gs, 0x56, 0x42, 0x00]); }
function divider(template: ReceiptTemplate) { return text(template.divider === "double" ? "==========================================" : template.divider === "solid" ? "------------------------------------------" : "- - - - - - - - - - - - - - - - - - - -"); }
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

async function logoRaster(dataUrl: string | undefined) {
  if (!dataUrl || typeof Image === "undefined" || typeof document === "undefined") return new Uint8Array();
  const image = new Image(); image.src = dataUrl; await new Promise<void>((resolve) => { image.onload = () => resolve(); image.onerror = () => resolve(); });
  if (!image.naturalWidth) return new Uint8Array();
  const width = Math.min(paperWidth === 80 ? 360 : 260, image.naturalWidth); const height = Math.max(1, Math.round(image.naturalHeight * (width / image.naturalWidth))); const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height; const context = canvas.getContext("2d"); if (!context) return new Uint8Array(); context.drawImage(image, 0, 0, width, height); const pixels = context.getImageData(0, 0, width, height).data; const rowBytes = Math.ceil(width / 8); const raster = new Uint8Array(rowBytes * height); for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) { const index = (y * width + x) * 4; const grayscale = (pixels[index] * 0.299) + (pixels[index + 1] * 0.587) + (pixels[index + 2] * 0.114); if (pixels[index + 3] > 32 && grayscale < 180) raster[y * rowBytes + Math.floor(x / 8)] |= 0x80 >> (x % 8); }
  return bytes([gs, 0x76, 0x30, 0x00, rowBytes & 0xff, (rowBytes >> 8) & 0xff, height & 0xff, (height >> 8) & 0xff], raster);
}

export async function printReceiptThermal(transaction: PrintableTransaction, settings: ReceiptSettings) {
  const template = settings.receiptTemplate;
  paperWidth = template.paperWidth;
  const logo = template.logoEnabled ? await logoRaster(template.logoDataUrl) : new Uint8Array();
  const itemLines = transaction.items.map((item) => line(`${item.name} x${item.qty}`, formatMoney(item.price * item.qty)));
  const taxAmount = Math.max(0, transaction.total - transaction.subtotal + transaction.discount);
  const payload = bytes([esc, 0x40], align(template), logo, bold(true), text(settings.storeName), bold(false), template.headerText ? text(template.headerText) : new Uint8Array(), template.showAddress ? text(settings.address) : new Uint8Array(), template.showPhone ? text(settings.phone) : new Uint8Array(), divider(template), align({ ...template, alignment: "left" }), line(transaction.invoice, formatDate(transaction.date)), template.showCashier ? text(`Kasir: ${transaction.cashier}`) : new Uint8Array(), template.showCustomer ? text(`Customer: ${transaction.customer}`) : new Uint8Array(), divider(template), ...itemLines, divider(template), line("Subtotal", formatMoney(transaction.subtotal)), template.showDiscount ? line("Diskon", `-${formatMoney(transaction.discount)}`) : new Uint8Array(), template.showTax ? line(`Pajak (${settings.tax}%)`, formatMoney(taxAmount)) : new Uint8Array(), bold(true), line("TOTAL", formatMoney(transaction.total)), bold(false), template.showPayment ? line("Pembayaran", transaction.payment) : new Uint8Array(), text(""), align(template), text(template.footerText || settings.receiptFooter), text("KASIR PRO FNP"), text("\n\n"), cut());
  await send(payload);
}

export async function printBarcodeLabelThermal(product: PrintableProduct, settings: ReceiptSettings) { const template = settings.receiptTemplate; paperWidth = template.paperWidth; const code = product.code.replace(/[^a-zA-Z0-9\-]/g, "").slice(0, 24); const barcodeData = encoder.encode(`{B${code}`); const payload = bytes([esc, 0x40], align(template), template.logoEnabled ? await logoRaster(template.logoDataUrl) : new Uint8Array(), bold(true), text(product.name.slice(0, paperWidth === 80 ? 40 : 28)), bold(false), text(product.category), [gs, 0x68, 0x50], [gs, 0x77, 0x02], [gs, 0x6b, 0x49, barcodeData.length], barcodeData, text(code), text(formatMoney(product.price)), text("\n\n"), cut()); await send(payload); }
function formatMoney(value: number) { return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value); }
function formatDate(value: string) { return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value)); }
