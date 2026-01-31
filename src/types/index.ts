export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  USER = "USER",
}

export enum SubscriptionPlan {
  GST_BILLING = "GST_BILLING",
  EWAY_BILLING = "EWAY_BILLING",
  EINVOICE = "EINVOICE",
  COMBO = "COMBO",
}

export enum SubscriptionStatus {
  ACTIVE = "ACTIVE",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
  PENDING = "PENDING",
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: string;
  expiryDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  status: "DRAFT" | "SENT" | "PAID" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  taxRate: number;
  amount: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
}

export interface EWayBillVehicleHistory {
  id: string;
  ewayBillId: string;
  vehicleNumber: string;
  transporterName?: string;
  transporterId?: string;
  transMode: string;
  distance: number;
  vehicleType?: string;
  transDocNo?: string;
  transDocDate?: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface EWayBill {
  id: string;
  ewayBillNumber: string;
  invoiceId: string;
  transporterName: string;
  vehicleNumber: string;
  fromPlace: string;
  toPlace: string;
  validFrom: string;
  validUntil: string;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED";
  createdAt: string;
  lastUpdatedVehicleNumber?: string;
  lastVehicleUpdateAt?: string;
  vehicleHistory?: EWayBillVehicleHistory[];
}

export interface EInvoice {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceType?: "INV" | "CRN" | "DBN";
  buyerGstin?: string;
  invoiceValue?: number;
  irn: string;
  ackNo: string;
  ackDate: string;
  qrCode: string;
  status: "GENERATED" | "CANCELLED" | "FAILED";
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  gstin?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  hsnCode: string;
  taxRate: number;
  price: number;
  unit: string;
  createdAt: string;
  updatedAt: string;
}
