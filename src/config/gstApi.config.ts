/**
 * GST API Configuration
 * This file contains the API credentials and configuration
 * Update these values based on your environment
 */

export const GST_API_CONFIG = {
  // Base URL
  BASE_URL: process.env.NEXT_PUBLIC_GST_API_URL || "https://api.whitebooks.in",
  
  // Sandbox Environment
  SANDBOX: {
    email: "shubhamkurade63@gmail.com",
    username: "API_29FTHPK8890K1ZN",
    password: "Sangram#98",
    ip_address: "192.168.1.6",
    client_id: "EINP4913288e-348b-41e8-a476-ad6c8e0fb94a",
    client_secret: "EINP81dd4f2f-c3a6-45ec-93d1-bb948ce22b04",
    gstin: "29FTHPK8890K1ZN",
  },
  
  // Production Environment (update when needed)
  PRODUCTION: {
    email: "",
    username: "",
    password: "",
    ip_address: "",
    client_id: "",
    client_secret: "",
    gstin: "",
  },
} as const;

/**
 * API Endpoints
 */
export const GST_API_ENDPOINTS = {
  // Authentication
  AUTHENTICATE: "/einvoice/authenticate",
  
  // GSTN Details
  GSTN_DETAILS: "/einvoice/type/GSTNDETAILS/version/V1_03",
  SYNC_GSTIN: "/einvoice/type/SYNCGSTIN/version/V1_03",
  
  // IRN Operations
  GENERATE_IRN: "/einvoice/type/GENERATE/version/V1_03",
  GET_IRN: "/einvoice/type/GETIRN/version/V1_03",
  GET_IRN_BY_DOC: "/einvoice/type/GETIRNBYDOC/version/V1_03",
  CANCEL_IRN: "/einvoice/type/CANCELIRN/version/V1_03",
  GET_REJECTED_IRN: "/einvoice/type/GETREJECTEDIRN/version/V1_03",
  
  // E-Way Bill
  GENERATE_EWAYBILL: "/einvoice/type/GENERATEEWAYBILL/version/V1_03",
  GET_EWAYBILL: "/einvoice/type/GETEWAYBILL/version/V1_03",
  
  // B2C QR Code
  GET_B2C_QR: "/einvoice/type/GETB2CQR/version/V1_03",
} as const;
