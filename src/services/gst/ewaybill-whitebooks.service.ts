import axios from "axios";
import { format } from "date-fns";
import { GST_API_CONFIG } from "@/config/gstApi.config";

/**
 * WhiteBooks E-Way Bill Service
 * Direct integration with WhiteBooks E-Way Bill API
 * Follows WhiteBooks Complete Json specification exactly
 * 
 * This service generates E-Way Bill directly without IRN dependency
 * Payload structure matches WhiteBooks Excel "Complete Json" sheet
 */

// WhiteBooks E-Way Bill Complete Json Structure
export interface WhiteBooksEWayBillPayload {
  supplyType: string; // "O" or "I"
  subSupplyType?: string; // "1" to "8"
  subSupplyDesc?: string; // Required if subSupplyType is "8"
  transactionType?: string; // "1" to "4"
  docType: string; // "INV" | "CHL" | "BIL" | "BOE"
  docNo: string;
  docDate: string; // Format: "dd/MM/yyyy"
  
  // From (Supplier) Details - Part A
  fromGstin: string; // 15 characters or "URP" for B2C
  fromTrdName: string;
  fromAddr1: string;
  fromAddr2?: string;
  fromPlace: string;
  fromPincode: string; // 6 digits
  fromStateCode: string; // State code (1-38, 96, 97)
  actFromStateCode?: string; // Actual from state code
  
  // To (Recipient) Details - Part A
  toGstin: string; // 15 characters or "URP" for B2C
  toTrdName: string;
  toAddr1: string;
  toAddr2?: string;
  toPlace: string;
  toPincode: string; // 6 digits
  toStateCode: string; // State code
  actToStateCode?: string; // Actual to state code
  
  // Dispatch Details (Optional)
  dispatchFromGSTIN?: string;
  dispatchFromTradeName?: string;
  
  // Shipping Details (Optional)
  shipToTradeName?: string;
  
  // Item List - Part A
  itemList: Array<{
    productName: string;
    productDesc?: string;
    hsnCode: string; // 4-8 digits
    quantity: number;
    qtyUnit: string; // From master codes
    taxableAmount: number;
    cgstRate?: number;
    sgstRate?: number;
    igstRate?: number;
    cessRate?: number;
  }>;
  
  // Value Details - Part A
  totalValue: number;
  cgstValue?: number;
  sgstValue?: number;
  igstValue?: number;
  cessValue?: number;
  cessNonAdvolValue?: number;
  totInvValue: number;
  
  // Transport Details - Part B
  transMode: string; // "1" | "2" | "3" | "4"
  distance: number; // Must be > 0
  transporterId?: string; // Transporter GSTIN
  transporterName?: string; // Can be empty if transporterId provided
  vehicleNo?: string; // Optional initially, mandatory before movement
  vehicleType?: string; // "R" | "O"
  transDocNo?: string;
  transDocDate?: string; // Format: "dd/MM/yyyy"
}

export interface WhiteBooksEWayBillConfig {
  email: string;
  username: string;
  password: string;
  ip_address?: string;
  client_id: string;
  client_secret: string;
  gstin: string;
  authToken: string;
}

export interface WhiteBooksEWayBillResponse {
  status_cd: string;
  status_desc: string;
  data?: {
    ewayBillNo?: string;
    ewayBillDate?: string;
    ewayBillValidTill?: string;
    ewayBillValidUpto?: string;
    ewayBillStatus?: string;
    qrCode?: string;
  };
}

class WhiteBooksEWayBillService {
  private baseUrl = process.env.NEXT_PUBLIC_GST_API_URL || "https://api.whitebooks.in";

  /**
   * Generate E-Way Bill directly using WhiteBooks API
   * API Endpoint: POST /ewaybill/generate
   * Payload must match WhiteBooks Complete Json structure exactly
   */
  async generateEWayBill(
    payload: WhiteBooksEWayBillPayload,
    config: WhiteBooksEWayBillConfig
  ): Promise<WhiteBooksEWayBillResponse> {
    try {
      // Validate payload before sending
      this.validatePayload(payload);

      // Build headers as per WhiteBooks specification
      const headers = {
        email: config.email,
        username: config.username,
        password: config.password,
        ip_address: config.ip_address || "192.168.1.6",
        client_id: config.client_id,
        client_secret: config.client_secret,
        gstin: config.gstin,
        "auth-token": config.authToken,
        "Content-Type": "application/json",
      };

      // Call WhiteBooks E-Way Bill Generate API
      // Note: Actual endpoint may vary - check WhiteBooks documentation
      const response = await axios.post(
        `${this.baseUrl}/ewaybill/generate?email=${config.email}`,
        payload,
        {
          headers,
          timeout: 60000, // 60 seconds timeout
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("WhiteBooks E-Way Bill Generation Error:", error);
      const errorMessage = error.response?.data?.status_desc || 
                          error.response?.data?.message || 
                          error.message || 
                          "Failed to generate E-Way Bill";
      throw new Error(errorMessage);
    }
  }

  /**
   * Update Part-B (Transport Details) of E-Way Bill
   * API Endpoint: POST /ewaybill/update-partb
   */
  async updatePartB(
    ewayBillNo: string,
    partBData: {
      transMode: string;
      distance: number;
      transporterId?: string;
      transporterName?: string;
      vehicleNo: string;
      vehicleType?: string;
      transDocNo?: string;
      transDocDate?: string;
    },
    config: WhiteBooksEWayBillConfig
  ): Promise<WhiteBooksEWayBillResponse> {
    try {
      const headers = {
        email: config.email,
        username: config.username,
        password: config.password,
        ip_address: config.ip_address || "192.168.1.6",
        client_id: config.client_id,
        client_secret: config.client_secret,
        gstin: config.gstin,
        "auth-token": config.authToken,
        "Content-Type": "application/json",
      };

      const payload = {
        ewayBillNo,
        ...partBData,
      };

      const response = await axios.post(
        `${this.baseUrl}/ewaybill/update-partb?email=${config.email}`,
        payload,
        {
          headers,
          timeout: 30000,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("Update Part-B Error:", error);
      const errorMessage = error.response?.data?.status_desc || 
                          error.response?.data?.message || 
                          error.message || 
                          "Failed to update Part-B";
      throw new Error(errorMessage);
    }
  }

  /**
   * Get E-Way Bill Details
   * API Endpoint: GET /ewaybill/get?ewayBillNo={ewayBillNo}
   */
  async getEWayBillDetails(
    ewayBillNo: string,
    config: Omit<WhiteBooksEWayBillConfig, "password">
  ): Promise<any> {
    try {
      const headers = {
        email: config.email,
        username: config.username,
        ip_address: config.ip_address || "192.168.1.6",
        client_id: config.client_id,
        client_secret: config.client_secret,
        gstin: config.gstin,
        "auth-token": config.authToken,
      };

      const response = await axios.get(
        `${this.baseUrl}/ewaybill/get`,
        {
          params: {
            ewayBillNo,
            email: config.email,
          },
          headers,
          timeout: 30000,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("Get E-Way Bill Details Error:", error);
      throw error;
    }
  }

  /**
   * Change Transporter for E-Way Bill
   * API Endpoint: POST /ewaybill/change-transporter
   * 
   * Rules:
   * - Only Active E-Way Bills allowed
   * - New Transporter ID mandatory
   * - Old transporter access revoked
   */
  async changeTransporter(
    ewayBillNo: string,
    newTransporterId: string,
    newTransporterName?: string,
    config: WhiteBooksEWayBillConfig
  ): Promise<WhiteBooksEWayBillResponse> {
    try {
      const headers = {
        email: config.email,
        username: config.username,
        password: config.password,
        ip_address: config.ip_address || "192.168.1.6",
        client_id: config.client_id,
        client_secret: config.client_secret,
        gstin: config.gstin,
        "auth-token": config.authToken,
        "Content-Type": "application/json",
      };

      const payload = {
        ewayBillNo,
        newTransporterId,
        newTransporterName: newTransporterName || "",
      };

      const response = await axios.post(
        `${this.baseUrl}/ewaybill/change-transporter?email=${config.email}`,
        payload,
        {
          headers,
          timeout: 30000,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("Change Transporter Error:", error);
      const errorMessage = error.response?.data?.status_desc || 
                          error.response?.data?.message || 
                          error.message || 
                          "Failed to change transporter";
      throw new Error(errorMessage);
    }
  }

  /**
   * Cancel E-Way Bill
   * API Endpoint: POST /ewaybill/cancel
   * 
   * Rules:
   * - Cancellation allowed only within 24 hours of generation
   * - Goods movement not started
   * - Cancel reason mandatory
   */
  async cancelEWayBill(
    ewayBillNo: string,
    cancelReasonCode: string,
    cancelRemarks: string,
    config: WhiteBooksEWayBillConfig
  ): Promise<WhiteBooksEWayBillResponse> {
    try {
      const headers = {
        email: config.email,
        username: config.username,
        password: config.password,
        ip_address: config.ip_address || "192.168.1.6",
        client_id: config.client_id,
        client_secret: config.client_secret,
        gstin: config.gstin,
        "auth-token": config.authToken,
        "Content-Type": "application/json",
      };

      const payload = {
        ewayBillNo,
        cancelReasonCode,
        cancelRemarks,
      };

      const response = await axios.post(
        `${this.baseUrl}/ewaybill/cancel?email=${config.email}`,
        payload,
        {
          headers,
          timeout: 30000,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("Cancel E-Way Bill Error:", error);
      const errorMessage = error.response?.data?.status_desc ||
                          error.response?.data?.message ||
                          error.message ||
                          "Failed to cancel E-Way Bill";
      throw new Error(errorMessage);
    }
  }

  /**
   * Extend Validity of E-Way Bill
   * API Endpoint: POST /ewaybill/extend-validity
   * 
   * Rules:
   * - Allowed ONLY for Active E-Way Bills
   * - Reason mandatory
   * - Current location mandatory
   * - Valid only within govt-allowed window
   */
  async extendValidity(
    ewayBillNo: string,
    extendReason: string,
    currentLocation: string,
    newValidUntil: string, // Format: "dd/MM/yyyy HH:mm"
    config: WhiteBooksEWayBillConfig
  ): Promise<WhiteBooksEWayBillResponse> {
    try {
      const headers = {
        email: config.email,
        username: config.username,
        password: config.password,
        ip_address: config.ip_address || "192.168.1.6",
        client_id: config.client_id,
        client_secret: config.client_secret,
        gstin: config.gstin,
        "auth-token": config.authToken,
        "Content-Type": "application/json",
      };

      const payload = {
        ewayBillNo,
        extendReason,
        currentLocation,
        newValidUntil,
      };

      const response = await axios.post(
        `${this.baseUrl}/ewaybill/extend-validity?email=${config.email}`,
        payload,
        {
          headers,
          timeout: 30000,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("Extend Validity Error:", error);
      const errorMessage = error.response?.data?.status_desc ||
                          error.response?.data?.message ||
                          error.message ||
                          "Failed to extend E-Way Bill validity";
      throw new Error(errorMessage);
    }
  }

  /**
   * Reject E-Way Bill
   * API Endpoint: POST /ewaybill/reject
   * 
   * Rejects a received E-Way Bill
   * Rules:
   * - Only received E-Way Bills can be rejected
   * - Rejection must be within 72 hours of receipt
   */
  async rejectEWayBill(
    ewayBillNo: string,
    rejectReason: string,
    config: WhiteBooksEWayBillConfig
  ): Promise<WhiteBooksEWayBillResponse> {
    try {
      const headers = {
        email: config.email,
        username: config.username,
        password: config.password,
        ip_address: config.ip_address || "192.168.1.6",
        client_id: config.client_id,
        client_secret: config.client_secret,
        gstin: config.gstin,
        "auth-token": config.authToken,
        "Content-Type": "application/json",
      };

      const payload = {
        ewayBillNo,
        rejectReason,
      };

      const response = await axios.post(
        `${this.baseUrl}/ewaybill/reject?email=${config.email}`,
        payload,
        {
          headers,
          timeout: 30000,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("Reject E-Way Bill Error:", error);
      const errorMessage = error.response?.data?.status_desc ||
                          error.response?.data?.message ||
                          error.message ||
                          "Failed to reject E-Way Bill";
      throw new Error(errorMessage);
    }
  }

  /**
   * Accept E-Way Bill
   * API Endpoint: POST /ewaybill/accept
   * 
   * Accepts a received E-Way Bill
   * Rules:
   * - Only received E-Way Bills can be accepted
   * - Acceptance must be within 72 hours of receipt
   */
  async acceptEWayBill(
    ewayBillNo: string,
    config: WhiteBooksEWayBillConfig
  ): Promise<WhiteBooksEWayBillResponse> {
    try {
      const headers = {
        email: config.email,
        username: config.username,
        password: config.password,
        ip_address: config.ip_address || "192.168.1.6",
        client_id: config.client_id,
        client_secret: config.client_secret,
        gstin: config.gstin,
        "auth-token": config.authToken,
        "Content-Type": "application/json",
      };

      const payload = {
        ewayBillNo,
      };

      const response = await axios.post(
        `${this.baseUrl}/ewaybill/accept?email=${config.email}`,
        payload,
        {
          headers,
          timeout: 30000,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("Accept E-Way Bill Error:", error);
      const errorMessage = error.response?.data?.status_desc ||
                          error.response?.data?.message ||
                          error.message ||
                          "Failed to accept E-Way Bill";
      throw new Error(errorMessage);
    }
  }

  /**
   * Generate Consolidated E-Way Bill
   * API Endpoint: POST /ewaybill/consolidated
   * 
   * Consolidates multiple E-Way Bills into a single Consolidated E-Way Bill
   */
  async generateConsolidatedEWayBill(
    ewayBillNumbers: string[],
    config: WhiteBooksEWayBillConfig
  ): Promise<WhiteBooksEWayBillResponse> {
    try {
      const headers = {
        email: config.email,
        username: config.username,
        password: config.password,
        ip_address: config.ip_address || "192.168.1.6",
        client_id: config.client_id,
        client_secret: config.client_secret,
        gstin: config.gstin,
        "auth-token": config.authToken,
        "Content-Type": "application/json",
      };

      const payload = {
        ewayBillNumbers,
      };

      const response = await axios.post(
        `${this.baseUrl}/ewaybill/consolidated?email=${config.email}`,
        payload,
        {
          headers,
          timeout: 30000,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("Generate Consolidated E-Way Bill Error:", error);
      const errorMessage = error.response?.data?.status_desc ||
                          error.response?.data?.message ||
                          error.message ||
                          "Failed to generate Consolidated E-Way Bill";
      throw new Error(errorMessage);
    }
  }

  /**
   * Validate payload as per WhiteBooks specification
   * Implements validation rules from "Specification And Validations" sheet
   */
  private validatePayload(payload: WhiteBooksEWayBillPayload): void {
    // Validate GSTIN format
    if (payload.fromGstin !== "URP" && !this.isValidGSTIN(payload.fromGstin)) {
      throw new Error("Invalid fromGstin format");
    }

    if (payload.toGstin !== "URP" && !this.isValidGSTIN(payload.toGstin)) {
      throw new Error("Invalid toGstin format");
    }

    // URP validation - allowed only for B2C
    if ((payload.fromGstin === "URP" || payload.toGstin === "URP") && payload.supplyType !== "O") {
      throw new Error("URP is allowed only for Outward (B2C) supplies");
    }

    // Validate pincode
    if (!/^[0-9]{6}$/.test(payload.fromPincode)) {
      throw new Error("Invalid fromPincode format");
    }
    if (!/^[0-9]{6}$/.test(payload.toPincode)) {
      throw new Error("Invalid toPincode format");
    }

    // Validate document date (cannot be future)
    const docDate = new Date(payload.docDate.split("/").reverse().join("-"));
    if (docDate > new Date()) {
      throw new Error("Document date cannot be in the future");
    }

    // Validate distance
    if (payload.distance < 0) {
      throw new Error("Distance must be greater than or equal to 0");
    }

    // Validate items
    if (!payload.itemList || payload.itemList.length === 0) {
      throw new Error("At least one item is required");
    }

    // Validate HSN codes
    payload.itemList.forEach((item, index) => {
      if (!/^[0-9]{4,8}$/.test(item.hsnCode)) {
        throw new Error(`Invalid HSN code in item ${index + 1}`);
      }
    });

    // Validate sub supply description
    if (payload.subSupplyType === "8" && !payload.subSupplyDesc) {
      throw new Error("Sub supply description is required when sub supply type is Others");
    }
  }

  /**
   * Validate GSTIN format
   */
  private isValidGSTIN(gstin: string): boolean {
    if (gstin.length !== 15) return false;
    const pattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return pattern.test(gstin);
  }
}

export const whiteBooksEWayBillService = new WhiteBooksEWayBillService();
