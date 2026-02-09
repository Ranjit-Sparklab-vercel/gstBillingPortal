export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api";

export const GST_API_ENV = {
  SANDBOX: "sandbox",
  PRODUCTION: "production",
} as const;

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  DASHBOARD: "/dashboard",
  GST: {
    ROOT: "/gst",
    INVOICES: "/gst/invoices",
    CREATE_INVOICE: "/gst/invoices/create",
    CUSTOMERS: "/gst/customers",
    PRODUCTS: "/gst/products",
    REPORTS: "/gst/reports",
  },
  EWAY: {
    ROOT: "/eway",
    BILLS: "/eway/bills",
    CREATE: "/eway/bills/create",
    GENERATE: "/eway/generate",
    CANCEL: "/eway/cancel",
    EXTEND_VALIDITY: "/eway/extend-validity",
    CONSOLIDATED: "/eway/consolidated",
    RECEIVED: "/eway/received",
    UPDATE_VEHICLE: "/eway/update-vehicle",
    CHANGE_TRANSPORTER: "/eway/change-transporter",
    PRINT: "/eway/print",
    VIEW: "/eway/view",
    VIEW_IRN: "/eway/view-irn",
  },
  EINVOICE: {
    ROOT: "/einvoice",
    INVOICES: "/einvoice/invoices",
    GENERATE: "/einvoice/generate",
    GET: "/einvoice/get",
    GET_BY_DOC: "/einvoice/get-by-doc",
    CANCEL: "/einvoice/cancel",
    GSTN_LOOKUP: "/einvoice/gstn-lookup",
    REJECTED: "/einvoice/rejected",
    ADD_CUSTOMER: "/einvoice/customers/add",
    ADD_PRODUCT: "/einvoice/products/add",
  },
  SUBSCRIPTION: "/subscription",
  PROFILE: "/profile",
  PAYMENT: "/payment",
} as const;

export const SUBSCRIPTION_PLANS = {
  GST_BILLING: {
    name: "GST Billing",
    description: "Create and manage GST invoices",
    price: 999,
    duration: "monthly",
  },
  EWAY_BILLING: {
    name: "E-Way Billing",
    description: "Generate and manage E-Way bills",
    price: 1499,
    duration: "monthly",
  },
  EINVOICE: {
    name: "E-Invoice",
    description: "Generate IRN and E-Invoices",
    price: 1999,
    duration: "monthly",
  },
  COMBO: {
    name: "Combo Plan",
    description: "All features included",
    price: 3499,
    duration: "monthly",
  },
} as const;
