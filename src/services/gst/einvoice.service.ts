import axios from "axios";
import { EInvoice } from "@/types";

// Response Interfaces
export interface EInvoiceResponse {
  einvoice: EInvoice;
  irn: string;
  qrCode: string;
  ackNo: string;
  ackDate: string;
  status: string;
}

export interface GSTNDetailsResponse {
  gstin: string;
  tradeName: string;
  legalName: string;
  address: string;
  state: string;
  pincode: string;
  status: string;
}

export interface IRNDetailsResponse {
  irn: string;
  ackNo: string;
  ackDate: string;
  qrCode: string;
  status: string;
  einvoice: any;
}

export interface CancelIRNDTO {
  irn: string;
  reason: string;
  remark?: string;
}

// Generate IRN Payload Structure (as per Whitebooks API)
export interface GenerateIRNPayload {
  Version: string;
  TranDtls: {
    TaxSch: string;
    SupTyp: string;
    // Optional fields
    RegRev?: string;
    EcmGstin?: string | null;
    IgstOnIntra?: string;
  };
  DocDtls: {
    Typ: string; // INV, CRN, DBN
    No: string;
    Dt: string; // Format: dd/MM/yyyy
  };
  SellerDtls: {
    Gstin: string;
    LglNm: string;
    TrdNm: string;
    Addr1: string;
    Addr2: string;
    Loc: string;
    Pin: string;
    Stcd: string;
    Ph?: string;
    Em?: string;
  };
  BuyerDtls: {
    Gstin: string;
    LglNm: string;
    TrdNm: string;
    Pos: string; // Place of Supply State Code
    Addr1: string;
    Addr2: string;
    Loc: string;
    Pin: string;
    Stcd: string;
    Ph?: string;
    Em?: string;
  };
  DispDtls?: {
    Nm: string;
    Addr1: string;
    Addr2: string;
    Loc: string;
    Pin: string;
    Stcd: string;
  };
  ShipDtls?: {
    Gstin: string;
    LglNm: string;
    TrdNm?: string;
    Addr1: string;
    Addr2?: string;
    Loc: string;
    Pin: string;
    Stcd: string;
  };
  ItemList: Array<{
    SlNo: string;
    IsServc: string; // "Y" or "N"
    PrdDesc: string;
    HsnCd: string;
    BchDtls?: {
      Nm: string;
    };
    Qty: string;
    Unit: string;
    UnitPrice: string;
    TotAmt: string;
    AssAmt: string;
    GstRt: string; // Combined rate if CGST+SGST, or IGST rate
    SgstAmt: string;
    IgstAmt: string;
    CgstAmt: string;
    TotItemVal: string;
  }>;
  ValDtls: {
    AssVal: string;
    CgstVal: string;
    SgstVal: string;
    IgstVal: string;
    TotInvVal: string;
    // Optional fields
    RndOffAmt?: string;
    TotCess?: string;
    TotCessHsn?: string;
  };
  PayDtls?: {
    Nm: string;
    Accdet: string;
    Mode: string;
    Fininsbr?: string;
    Payterm?: string;
    Payinstr?: string;
    Crtrn?: string;
    Dirdr?: string;
    Crday?: string;
    Paidamt?: string;
    Paymtdue?: string;
  };
  RefDtls?: {
    InvRm?: string;
    DocPerdDtls?: {
      InvStDt: string;
      InvEndDt: string;
    };
    PrecDocDtls?: Array<{
      InvNo: string;
      InvDt: string;
      OthRefNo?: string;
    }>;
    ContrDtls?: Array<{
      RecAdvRefr?: string;
      RecAdvDt?: string;
      Tendrefr?: string;
      Contrrefr?: string;
      Extrefr?: string;
      Projrefr?: string;
      Porefr?: string;
      PoRefDt?: string;
    }>;
  };
  AddlDocDtls?: Array<{
    Url: string;
    Docs: string;
    Info: string;
  }>;
  ExpDtls?: {
    ShipBNo: string;
    ShipBDt: string;
    Port: string;
    RefClm: string;
    ForCur: string;
    CntCode: string;
  };
  EwbDtls?: {
    Transid?: string;
    Transname: string;
    Distance: string;
    Transdocno: string;
    TransdocDt?: string;
    Vehno: string;
    Vehtype: string;
    TransMode: string;
  };
}

// API Configuration
export interface GenerateIRNConfig {
  email: string;
  username: string;
  password: string;
  ip_address?: string;
  client_id: string;
  client_secret: string;
  gstin: string;
  authToken: string;
}

export interface GSTNLookupConfig {
  email: string;
  username: string;
  ip_address?: string;
  client_id: string;
  client_secret: string;
  gstin: string;
  authToken: string;
}

class EInvoiceService {
  private baseUrl = process.env.NEXT_PUBLIC_GST_API_URL || "https://api.whitebooks.in";

  /**
   * Generate IRN (Invoice Reference Number)
   * API: POST /einvoice/type/GENERATE/version/V1_03?email={email}
   * Headers: email, username, password, ip_address, client_id, client_secret, gstin, auth-token
   * Body: GenerateIRNPayload
   */
  async generateIRN(
    payload: GenerateIRNPayload,
    config: GenerateIRNConfig
  ): Promise<any> {
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

      // Use axios directly for external API calls
      const response = await axios.post(
        `${this.baseUrl}/einvoice/type/GENERATE/version/V1_03?email=${config.email}`,
        payload,
        { 
          headers,
          timeout: 60000, // 60 seconds timeout for generation
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("Generate IRN Error:", error);
      const errorMessage = error.response?.data?.status_desc || error.message || "Failed to generate IRN";
      throw new Error(errorMessage);
    }
  }

  /**
   * Get GSTN Details
   * API: GET /einvoice/type/GSTNDETAILS/version/V1_03?param1={gstin}&email={email}
   * Headers: username, ip_address, client_id, client_secret, gstin, auth-token
   */
  async getGSTNDetails(
    gstin: string,
    config: GSTNLookupConfig
  ): Promise<any> {
    try {
      const headers = {
        username: config.username,
        ip_address: config.ip_address || "192.168.1.6",
        client_id: config.client_id,
        client_secret: config.client_secret,
        gstin: config.gstin,
        "auth-token": config.authToken,
      };

      // Use axios directly for external API calls
      // As per reference code: response.data contains the actual data
      const response = await axios.get(
        `${this.baseUrl}/einvoice/type/GSTNDETAILS/version/V1_03`,
        {
          params: {
            param1: gstin,
            email: config.email,
          },
          headers,
          timeout: 30000, // 30 seconds timeout
        }
      );
      
      // Return the full response.data as reference code uses response.data.data
      // The structure is: response.data.data contains { LegalName, TradeName, etc. }
      return response.data;
    } catch (error: any) {
      console.error("Get GSTN Details Error:", error);
      const errorMessage = error.response?.data?.status_desc || error.message || "Failed to fetch GSTN details";
      throw new Error(errorMessage);
    }
  }

  /**
   * Get Sync GSTIN From Common Portal
   * API: POST /einvoice/type/SYNCGSTIN/version/V1_03?email={email}
   */
  async syncGSTINFromCP(
    gstin: string,
    config: GSTNLookupConfig
  ): Promise<any> {
    try {
      const headers = {
        username: config.username,
        ip_address: config.ip_address || "192.168.1.6",
        client_id: config.client_id,
        client_secret: config.client_secret,
        gstin: config.gstin,
        "auth-token": config.authToken,
      };

      const response = await axios.post(
        `${this.baseUrl}/einvoice/type/SYNCGSTIN/version/V1_03?email=${config.email}`,
        { gstin },
        { 
          headers,
          timeout: 30000,
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("Sync GSTIN from CP Error:", error);
      const errorMessage = error.response?.data?.status_desc || error.message || "Failed to sync GSTIN";
      throw new Error(errorMessage);
    }
  }

  /**
   * Get E-Invoice Details by IRN
   * API: GET /einvoice/type/GETIRN/version/V1_03?param1={irn}&email={email}
   */
  async getEInvoiceByIRN(
    irn: string,
    config: GSTNLookupConfig,
    options?: {
      supplier_gstn?: string; // Optional: Supplier GSTIN, only in case E-Commerce operator
      irp?: string; // Optional: e-Invoice Server Type (NIC1/NIC2)
    }
  ): Promise<any> {
    try {
      // Build headers as per API documentation - all required
      const headers = {
        username: config.username,
        ip_address: config.ip_address || "192.168.1.6",
        client_id: config.client_id,
        client_secret: config.client_secret,
        gstin: config.gstin,
        "auth-token": config.authToken,
      };

      // Build query params - param1 and email are required
      const params: any = {
        param1: irn, // Required: IRN
        email: config.email, // Required: User Email
      };

      // Add optional parameters if provided
      if (options?.supplier_gstn) {
        params.supplier_gstn = options.supplier_gstn;
      }
      if (options?.irp) {
        params.irp = options.irp;
      }

      // Debug: Log request details in development
      if (process.env.NODE_ENV === 'development') {
        console.log("Get E-Invoice API Request:", {
          url: `${this.baseUrl}/einvoice/type/GETIRN/version/V1_03`,
          queryParams: {
            param1: irn,
            email: config.email,
            ...(options?.supplier_gstn && { supplier_gstn: options.supplier_gstn }),
            ...(options?.irp && { irp: options.irp }),
          },
          headers: {
            username: config.username,
            ip_address: headers.ip_address,
            client_id: config.client_id ? "***" : "missing",
            client_secret: config.client_secret ? "***" : "missing",
            gstin: config.gstin,
            "auth-token": config.authToken ? "***" : "missing",
          },
        });
      }

      const response = await axios.get(
        `${this.baseUrl}/einvoice/type/GETIRN/version/V1_03`,
        {
          params,
          headers,
          timeout: 30000,
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("Get E-Invoice by IRN Error:", error);
      const errorMessage = error.response?.data?.status_desc || error.message || "Failed to get E-Invoice";
      throw new Error(errorMessage);
    }
  }

  /**
   * Get IRN Details by Document Details (GET method)
   * API: GET /einvoice/type/GETIRNBYDOCDETAILS/version/V1_03
   * Query params: param1 (Document type), email, supplier_gstn (optional), irp (optional)
   * Headers: docnum, docdate, ip_address, client_id, client_secret, username, auth-token, gstin
   */
  async getIRNByDocDetails(
    docDetails: {
      docType: string; // param1 - Document type
      docNum: string; // docnum header
      docDate: string; // docdate header (dd/MM/YYYY)
      supplierGstn?: string; // Optional: Supplier GSTIN
      irp?: string; // Optional: e-Invoice Server Type (NIC1/NIC2)
    },
    config: GSTNLookupConfig
  ): Promise<any> {
    try {
      // Build headers as per API documentation
      const headers: any = {
        username: config.username,
        ip_address: config.ip_address || "192.168.1.6",
        client_id: config.client_id,
        client_secret: config.client_secret,
        gstin: config.gstin,
        "auth-token": config.authToken,
        docnum: docDetails.docNum,
        docdate: docDetails.docDate,
      };

      // Build query params
      const params: any = {
        param1: docDetails.docType,
        email: config.email,
      };

      // Add optional parameters if provided
      if (docDetails.supplierGstn) {
        params.supplier_gstn = docDetails.supplierGstn;
      }
      if (docDetails.irp) {
        params.irp = docDetails.irp;
      }

      // Debug: Log request details in development
      if (process.env.NODE_ENV === 'development') {
        console.log("Get IRN by Doc Details API Request:", {
          url: `${this.baseUrl}/einvoice/type/GETIRNBYDOCDETAILS/version/V1_03`,
          queryParams: params,
          headers: {
            ...headers,
            client_id: headers.client_id ? "***" : "missing",
            client_secret: headers.client_secret ? "***" : "missing",
            "auth-token": headers["auth-token"] ? "***" : "missing",
          },
        });
      }

      const response = await axios.get(
        `${this.baseUrl}/einvoice/type/GETIRNBYDOCDETAILS/version/V1_03`,
        {
          params,
          headers,
          timeout: 30000,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("Get IRN by Doc Details Error:", error);
      const errorMessage = error.response?.data?.status_desc || error.message || "Failed to get IRN by document details";
      throw new Error(errorMessage);
    }
  }

  /**
   * Cancel IRN
   * API: POST /einvoice/type/CANCELIRN/version/V1_03?email={email}
   * Body: { irn, reason, remark? }
   */
  /**
   * Cancel IRN
   * API: POST /einvoice/type/CANCELIRN/version/V1_03?email={email}
   * Headers: email, username, password, ip_address, client_id, client_secret, gstin, auth-token
   * Body: { irn, reason, remark? }
   */
  async cancelIRN(
    data: {
      irn: string;
      reason: string;
      remark?: string;
    },
    config: GenerateIRNConfig
  ): Promise<any> {
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
      };

      // Debug: Log request details in development
      if (process.env.NODE_ENV === 'development') {
        console.log("Cancel IRN API Request:", {
          url: `${this.baseUrl}/einvoice/type/CANCELIRN/version/V1_03`,
          queryParams: {
            email: config.email,
          },
          body: {
            irn: data.irn,
            reason: data.reason,
            remark: data.remark || undefined,
          },
          headers: {
            email: config.email,
            username: config.username ? "***" : "missing",
            password: config.password ? "***" : "missing",
            ip_address: headers.ip_address,
            client_id: config.client_id ? "***" : "missing",
            client_secret: config.client_secret ? "***" : "missing",
            gstin: config.gstin,
            "auth-token": config.authToken ? "***" : "missing",
          },
        });
      }

      const response = await axios.post(
        `${this.baseUrl}/einvoice/type/CANCELIRN/version/V1_03?email=${config.email}`,
        {
          irn: data.irn,
          reason: data.reason,
          remark: data.remark || undefined,
        },
        { 
          headers,
          timeout: 30000,
        }
      );

      // Debug: Log response
      if (process.env.NODE_ENV === 'development') {
        console.log("Cancel IRN API Response:", response.data);
      }

      return response.data;
    } catch (error: any) {
      console.error("Cancel IRN Error:", error);
      const errorMessage = error.response?.data?.status_desc || error.message || "Failed to cancel IRN";
      throw new Error(errorMessage);
    }
  }

  /**
   * Get Rejected IRNs
   * API: GET /einvoice/type/GETREJECTEDIRN/version/V1_03?email={email}&param1={fromDate}&param2={toDate}&param3={gstin}
   */
  async getRejectedIRNs(
    filters: {
      fromDate?: string;
      toDate?: string;
      gstin?: string;
    },
    config: GSTNLookupConfig
  ): Promise<any> {
    try {
      const headers = {
        username: config.username,
        ip_address: config.ip_address || "192.168.1.6",
        client_id: config.client_id,
        client_secret: config.client_secret,
        gstin: config.gstin,
        "auth-token": config.authToken,
      };

      const params: any = {
        email: config.email,
      };
      if (filters.fromDate) params.param1 = filters.fromDate;
      if (filters.toDate) params.param2 = filters.toDate;
      if (filters.gstin) params.param3 = filters.gstin;

      const response = await axios.get(
        `${this.baseUrl}/einvoice/type/GETREJECTEDIRN/version/V1_03`,
        {
          params,
          headers,
          timeout: 30000,
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("Get Rejected IRNs Error:", error);
      const errorMessage = error.response?.data?.status_desc || error.message || "Failed to get rejected IRNs";
      throw new Error(errorMessage);
    }
  }

  /**
   * Generate E-Way Bill using IRN
   * API: POST /einvoice/type/GENERATEEWAYBILL/version/V1_03?email={email}
   */
  async generateEWayBillByIRN(
    data: {
      irn: string;
      transporterId?: string;
      transporterName?: string;
      vehicleNumber: string;
      vehicleType?: string;
      distance?: string;
      transportMode?: string;
      transportDocNo?: string;
      transportDocDt?: string;
    },
    config: GenerateIRNConfig
  ): Promise<any> {
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
      };

      const response = await axios.post(
        `${this.baseUrl}/einvoice/type/GENERATEEWAYBILL/version/V1_03?email=${config.email}`,
        data,
        { 
          headers,
          timeout: 60000,
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("Generate E-Way Bill Error:", error);
      const errorMessage = error.response?.data?.status_desc || error.message || "Failed to generate E-Way Bill";
      throw new Error(errorMessage);
    }
  }

  /**
   * Get E-Way Bill Details by IRN
   * API: GET /einvoice/type/GETEWAYBILL/version/V1_03?param1={irn}&email={email}
   */
  async getEWayBillByIRN(
    irn: string,
    config: GSTNLookupConfig
  ): Promise<any> {
    try {
      const headers = {
        username: config.username,
        ip_address: config.ip_address || "192.168.1.6",
        client_id: config.client_id,
        client_secret: config.client_secret,
        gstin: config.gstin,
        "auth-token": config.authToken,
      };

      const response = await axios.get(
        `${this.baseUrl}/einvoice/type/GETEWAYBILL/version/V1_03`,
        {
          params: {
            param1: irn,
            email: config.email,
          },
          headers,
          timeout: 30000,
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("Get E-Way Bill Error:", error);
      const errorMessage = error.response?.data?.status_desc || error.message || "Failed to get E-Way Bill";
      throw new Error(errorMessage);
    }
  }

  /**
   * Get B2C QR Code Details
   * API: POST /einvoice/type/GETB2CQR/version/V1_03?email={email}
   * Body: { docNo, docDt, docTyp? }
   */
  async getB2CQRCodeDetails(
    data: {
      docNo: string;
      docDt: string;
      docTyp?: string;
    },
    config: GSTNLookupConfig
  ): Promise<any> {
    try {
      const headers = {
        username: config.username,
        ip_address: config.ip_address || "192.168.1.6",
        client_id: config.client_id,
        client_secret: config.client_secret,
        gstin: config.gstin,
        "auth-token": config.authToken,
      };

      const response = await axios.post(
        `${this.baseUrl}/einvoice/type/GETB2CQR/version/V1_03?email=${config.email}`,
        data,
        { 
          headers,
          timeout: 30000,
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("Get B2C QR Code Error:", error);
      const errorMessage = error.response?.data?.status_desc || error.message || "Failed to get B2C QR Code";
      throw new Error(errorMessage);
    }
  }
}

export const einvoiceService = new EInvoiceService();
