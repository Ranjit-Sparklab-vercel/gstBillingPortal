import axios from "axios";
import { format } from "date-fns";
import { GST_API_CONFIG } from "@/config/gstApi.config";
import { GenerateIRNPayload, GenerateIRNConfig, GSTNLookupConfig } from "./einvoice.service";
import { einvoiceService } from "./einvoice.service";
import {
  calculateTotals,
  calculateItemGST,
  calculateUnitPrice,
  formatToTwoDecimals,
} from "@/lib/calculations";

/**
 * E-Way Bill Service
 * Handles all E-Way Bill operations using WhiteBooks APIs
 * This service generates E-Way Bills by first creating an IRN (if needed) 
 * and then generating the E-Way Bill from that IRN
 */

export interface GenerateEWayBillPayload {
  // Part-A: Invoice Details (will be converted to IRN first)
  supplyType: string;
  subSupplyType?: string;
  subSupplyDesc?: string;
  transactionType?: string;
  documentType: "INV" | "CRN" | "DBN";
  documentNo: string;
  documentDate: Date;
  
  // From (Supplier) Details
  fromGstin: string;
  fromTradeName: string;
  fromLegalName?: string;
  fromAddress1: string;
  fromAddress2?: string;
  fromLocation: string;
  fromPincode: string;
  fromStateCode: string;
  actFromStateCode?: string;
  fromPhone?: string;
  fromEmail?: string;
  
  // To (Recipient) Details
  toGstin: string; // Can be "URP" for unregistered
  toTradeName: string;
  toLegalName?: string;
  toAddress1: string;
  toAddress2?: string;
  toLocation: string;
  toPincode: string;
  toStateCode: string;
  actToStateCode?: string;
  posStateCode?: string;
  toPhone?: string;
  toEmail?: string;
  
  // Dispatch Details (Optional)
  dispatchFromGSTIN?: string;
  dispatchFromTradeName?: string;
  
  // Shipping Details (Optional)
  shipToTradeName?: string;
  
  // Items
  items: Array<{
    productName: string;
    productDesc?: string;
    hsn: string;
    quantity: string;
    unit: string;
    value: string;
    cgst: string;
    sgst: string;
    igst: string;
    cessRate?: string;
    isService?: "Y" | "N";
  }>;
  
  // Part-B: Transport Details
  transporterId?: string;
  transporterName?: string; // Can be empty
  transportMode: string; // "1" | "2" | "3" | "4"
  vehicleType?: string; // "R" | "O"
  vehicleNo?: string; // Optional initially
  approximateDistance: string;
  transportDocNo?: string;
  transportDocDate?: string;
  
  // Optional Value fields
  roundOffAmount?: string;
  totalCess?: string;
  cessNonAdvolValue?: string;
}

export interface GenerateEWayBillConfig extends GenerateIRNConfig {}

export interface UpdatePartBPayload {
  irn: string;
  transporterId?: string;
  transporterName: string;
  transportMode: string;
  vehicleType?: string;
  vehicleNo: string;
  approximateDistance: string;
  transportDocNo?: string;
  transportDocDate?: string;
}

export interface EWayBillResponse {
  status_cd: string;
  status_desc: string;
  data?: {
    EwbNo?: string;
    EwbDt?: string;
    EwbValidTill?: string;
    EwayBillDate?: string;
    EwayBillNo?: string;
    EwayBillValidTill?: string;
    Irn?: string;
    QRCode?: string;
  };
}

class EWayBillService {
  private baseUrl = process.env.NEXT_PUBLIC_GST_API_URL || "https://api.whitebooks.in";

  /**
   * Generate E-Way Bill (Standalone)
   * This method:
   * 1. First generates an IRN with all invoice details
   * 2. Then generates E-Way Bill from that IRN
   * 3. If vehicle number is not provided, generates E-Way Bill without Part-B
   *    (Part-B can be updated later using updatePartB method)
   */
  async generateEWayBill(
    payload: GenerateEWayBillPayload,
    config: GenerateEWayBillConfig
  ): Promise<EWayBillResponse> {
    try {
      // Step 1: Generate IRN first (if not already generated)
      // We need to convert the E-Way Bill payload to IRN payload format
      const irnPayload = this.convertToIRNPayload(payload);
      
      let irn: string;
      let irnResponse: any;

      try {
        // Try to generate IRN
        irnResponse = await einvoiceService.generateIRN(irnPayload, config);
        
        if (irnResponse.status_cd === "1" || irnResponse.status_cd === "Sucess") {
          irn = irnResponse.data?.Irn || irnResponse.data?.irn || irnResponse.Irn || irnResponse.irn;
          
          if (!irn) {
            throw new Error("IRN not found in response");
          }
        } else {
          throw new Error(irnResponse.status_desc || "Failed to generate IRN");
        }
      } catch (error: any) {
        console.error("IRN Generation Error:", error);
        throw new Error(`Failed to generate IRN: ${error.message}`);
      }

      // Step 2: Generate E-Way Bill from IRN
      // If vehicle number is not provided, we can still generate E-Way Bill
      // but Part-B will need to be updated later
      const ewayBillData: any = {
        irn: irn,
        transporterName: payload.transporterName,
        approximateDistance: payload.approximateDistance || "0",
        transportMode: payload.transportMode,
      };

      if (payload.transporterId) {
        ewayBillData.transporterId = payload.transporterId;
      }

      if (payload.vehicleNo) {
        ewayBillData.vehicleNumber = payload.vehicleNo;
      }

      if (payload.vehicleType) {
        ewayBillData.vehicleType = payload.vehicleType;
      }

      if (payload.transportDocNo) {
        ewayBillData.transportDocNo = payload.transportDocNo;
      }

      if (payload.transportDocDate) {
        ewayBillData.transportDocDate = payload.transportDocDate;
      }

      const ewayBillResponse = await einvoiceService.generateEWayBillByIRN(
        ewayBillData,
        config
      );

      return ewayBillResponse;
    } catch (error: any) {
      console.error("Generate E-Way Bill Error:", error);
      const errorMessage = error.response?.data?.status_desc || error.message || "Failed to generate E-Way Bill";
      throw new Error(errorMessage);
    }
  }

  /**
   * Update Part-B (Vehicle Details) of E-Way Bill
   * This is used when E-Way Bill was generated without vehicle number
   */
  async updatePartB(
    payload: UpdatePartBPayload,
    config: GenerateEWayBillConfig
  ): Promise<EWayBillResponse> {
    try {
      const updateData: any = {
        irn: payload.irn,
        transporterName: payload.transporterName,
        vehicleNumber: payload.vehicleNo,
        approximateDistance: payload.approximateDistance,
        transportMode: payload.transportMode,
      };

      if (payload.transporterId) {
        updateData.transporterId = payload.transporterId;
      }

      if (payload.vehicleType) {
        updateData.vehicleType = payload.vehicleType;
      }

      if (payload.transportDocNo) {
        updateData.transportDocNo = payload.transportDocNo;
      }

      if (payload.transportDocDate) {
        updateData.transportDocDate = payload.transportDocDate;
      }

      // Use the same API endpoint for updating Part-B
      const response = await einvoiceService.generateEWayBillByIRN(updateData, config);
      return response;
    } catch (error: any) {
      console.error("Update Part-B Error:", error);
      const errorMessage = error.response?.data?.status_desc || error.message || "Failed to update Part-B";
      throw new Error(errorMessage);
    }
  }

  /**
   * Get E-Way Bill Details by IRN
   */
  async getEWayBillByIRN(
    irn: string,
    config: GSTNLookupConfig
  ): Promise<any> {
    try {
      return await einvoiceService.getEWayBillByIRN(irn, config);
    } catch (error: any) {
      console.error("Get E-Way Bill Error:", error);
      throw error;
    }
  }

  /**
   * Convert E-Way Bill payload to IRN payload format
   */
  private convertToIRNPayload(payload: GenerateEWayBillPayload): GenerateIRNPayload {
    
    const itemList = payload.items.map((item, index) => {
      const itemCalc = calculateItemGST(item.value, item.cgst, item.sgst, item.igst);
      const unitPrice = calculateUnitPrice(item.value, item.quantity);

      const itemPayload: any = {
        SlNo: String(index + 1),
        IsServc: item.isService || "N",
        PrdDesc: String(item.productName).trim(),
        HsnCd: String(item.hsn).trim(),
        Qty: String(item.quantity || "1").trim(),
        Unit: String(item.unit || "NOS").trim().toUpperCase(),
        UnitPrice: unitPrice,
        TotAmt: itemCalc.assAmt,
        AssAmt: itemCalc.assAmt,
        GstRt: itemCalc.gstRt,
        SgstAmt: itemCalc.sgstAmt,
        IgstAmt: itemCalc.igstAmt,
        CgstAmt: itemCalc.cgstAmt,
        TotItemVal: itemCalc.totItemVal,
      };

      return itemPayload;
    });

    const totals = calculateTotals(payload.items);
    const finalInvoiceValue = payload.roundOffAmount || payload.totalCess
      ? (parseFloat(totals.totalInvVal) + 
         parseFloat(payload.roundOffAmount || "0") + 
         parseFloat(payload.totalCess || "0")).toFixed(2)
      : totals.totalInvVal;

    const irnPayload: GenerateIRNPayload = {
      Version: "1.1",
      TranDtls: {
        TaxSch: "GST",
        SupTyp: payload.supplyType,
      },
      DocDtls: {
        Typ: payload.documentType,
        No: String(payload.documentNo).trim(),
        Dt: format(payload.documentDate, "dd/MM/yyyy"),
      },
      SellerDtls: {
        Gstin: String(payload.fromGstin).trim().toUpperCase(),
        LglNm: String(payload.fromLegalName).trim(),
        TrdNm: String(payload.fromTradeName).trim(),
        Addr1: String(payload.fromAddress1).trim(),
        Addr2: String(payload.fromAddress2 || "").trim(),
        Loc: String(payload.fromLocation).trim(),
        Pin: String(payload.fromPincode).trim(),
        Stcd: String(payload.fromStateCode).trim(),
        ...(payload.fromPhone && payload.fromPhone.trim() !== "" && { Ph: String(payload.fromPhone).trim() }),
        ...(payload.fromEmail && payload.fromEmail.trim() !== "" && { Em: String(payload.fromEmail).trim() }),
      },
      BuyerDtls: {
        Gstin: String(payload.toGstin).trim().toUpperCase(),
        LglNm: String(payload.toLegalName).trim(),
        TrdNm: String(payload.toTradeName).trim(),
        Pos: String(payload.posStateCode).trim(),
        Addr1: String(payload.toAddress1).trim(),
        Addr2: String(payload.toAddress2 || "").trim(),
        Loc: String(payload.toLocation).trim(),
        Pin: String(payload.toPincode).trim(),
        Stcd: String(payload.toStateCode).trim(),
        ...(payload.toPhone && payload.toPhone.trim() !== "" && { Ph: String(payload.toPhone).trim() }),
        ...(payload.toEmail && payload.toEmail.trim() !== "" && { Em: String(payload.toEmail).trim() }),
      },
      ItemList: itemList,
      ValDtls: {
        AssVal: totals.totalAssVal,
        CgstVal: totals.totalCgstAmt,
        SgstVal: totals.totalSgstAmt,
        IgstVal: totals.totalIgstAmt,
        TotInvVal: finalInvoiceValue,
        ...(payload.roundOffAmount && payload.roundOffAmount.trim() !== "" && {
          RndOffAmt: formatToTwoDecimals(payload.roundOffAmount),
        }),
        ...(payload.totalCess && payload.totalCess.trim() !== "" && {
          TotCess: formatToTwoDecimals(payload.totalCess),
        }),
      },
      // Add E-Way Bill Details (Part-B) - will be used if vehicle number is provided
      ...(payload.vehicleNo && payload.vehicleNo.trim() !== "" && {
        EwbDtls: {
          ...(payload.transporterId && payload.transporterId.trim() !== "" && { Transid: String(payload.transporterId).trim() }),
          Transname: String(payload.transporterName).trim(),
          Distance: String(payload.approximateDistance || "0").trim(),
          Transdocno: String(payload.transportDocNo || "").trim(),
          ...(payload.transportDocDate && payload.transportDocDate.trim() !== "" && { TransdocDt: String(payload.transportDocDate).trim() }),
          Vehno: String(payload.vehicleNo).trim(),
          Vehtype: String(payload.vehicleType || "R").trim(),
          TransMode: String(payload.transportMode).trim(),
        },
      }),
    };

    return irnPayload;
  }
}

export const ewayBillService = new EWayBillService();
