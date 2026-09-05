export type ReceiptAlignment = "left" | "center" | "right";
export type ReceiptPaperWidth = 58 | 80;

export type ReceiptTemplate = {
  logoDataUrl?: string;
  logoEnabled: boolean;
  alignment: ReceiptAlignment;
  paperWidth: ReceiptPaperWidth;
  showAddress: boolean;
  showPhone: boolean;
  showCashier: boolean;
  showCustomer: boolean;
  showPayment: boolean;
  showTax: boolean;
  showDiscount: boolean;
  showSku: boolean;
  headerText: string;
  footerText: string;
  divider: "solid" | "dashed" | "double";
};

export const defaultReceiptTemplate: ReceiptTemplate = {
  logoEnabled: true,
  alignment: "center",
  paperWidth: 58,
  showAddress: true,
  showPhone: true,
  showCashier: true,
  showCustomer: true,
  showPayment: true,
  showTax: true,
  showDiscount: true,
  showSku: false,
  headerText: "",
  footerText: "Terima kasih sudah berbelanja.",
  divider: "dashed",
};
