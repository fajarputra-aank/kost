export type PromoType = "percentage" | "nominal" | "bogo" | "bundle";

export type PosProduct = {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  cost: number;
  price: number;
  stock: number;
  min: number;
  supplier: string;
  status: boolean;
  accent: string;
};

export type PosCustomer = {
  id: string;
  name: string;
  phone: string;
  segment: string;
  purchases: number;
  balance: number;
};

export type PosPromotion = {
  id: string;
  name: string;
  code: string;
  type: PromoType;
  value: number;
  memberOnly: boolean;
  memberLevels: string[];
  minPurchase: number;
  active: boolean;
  startDate: string;
  endDate: string;
  buyProductId?: string;
  getProductId?: string;
  buyQuantity?: number;
  getQuantity?: number;
  bundleProductIds?: string[];
  bundleQuantity?: number;
  bundlePrice?: number;
  usageLimitPerMember?: number;
  usageByMember?: Record<string, number>;
};

export type PosTransactionItem = { name: string; qty: number; price: number };

export type PosTransaction = {
  id: string;
  invoice: string;
  date: string;
  customer: string;
  cashier: string;
  total: number;
  subtotal: number;
  discount: number;
  payment: string;
  status: string;
  items: PosTransactionItem[];
  promoId?: string;
  promoCode?: string;
  promoMemberId?: string;
  promoUsage?: number;
};

export type PosSnapshot = {
  products: PosProduct[];
  customers: PosCustomer[];
  promos: PosPromotion[];
  transactions: PosTransaction[];
  [key: string]: unknown;
};
