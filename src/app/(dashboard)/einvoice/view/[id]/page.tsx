/**
 * E-Invoice View/Print Page
 * 
 * Displays E-Invoice in print-ready format
 */

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { EInvoicePrintLayout, EInvoicePrintData } from "@/components/einvoice/EInvoicePrintLayout";
import { Loader } from "@/components/common/loader";
import { useToast } from "@/components/ui/use-toast";
import { einvoiceService } from "@/services/gst/einvoice.service";
import { gstAuthService } from "@/services/gst/auth.service";
import { GST_API_CONFIG } from "@/config/gstApi.config";
import { format } from "date-fns";
import { jwtDecode } from "jwt-decode";

export default function EInvoiceViewPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [printData, setPrintData] = useState<EInvoicePrintData | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  const einvoiceId = params.id as string;

  useEffect(() => {
    const initialize = async () => {
      try {
        // Authenticate
        const config = {
          email: GST_API_CONFIG.SANDBOX.email,
          username: GST_API_CONFIG.SANDBOX.username,
          password: GST_API_CONFIG.SANDBOX.password,
          ip_address: GST_API_CONFIG.SANDBOX.ip_address,
          client_id: GST_API_CONFIG.SANDBOX.client_id,
          client_secret: GST_API_CONFIG.SANDBOX.client_secret,
          gstin: GST_API_CONFIG.SANDBOX.gstin,
        };
        const response = await gstAuthService.authenticate(config);
        if (response.status_cd === "Sucess" || response.status_cd === "1") {
          setAuthToken(response.data.AuthToken);
        }

        // Load E-Invoice data
        await loadEInvoiceData();
      } catch (error: any) {
        console.error("Error initializing:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to load E-Invoice",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [einvoiceId]);

  const loadEInvoiceData = async () => {
    try {
      // Try to get from sessionStorage first
      const storedData = sessionStorage.getItem("einvoiceData");
      if (storedData) {
        const einvoiceData = JSON.parse(storedData);
        const printData = convertToPrintData(einvoiceData);
        setPrintData(printData);
        return;
      }

      // If not in storage, try to fetch by IRN (if einvoiceId is IRN)
      if (authToken && einvoiceId.length > 20) {
        // Likely an IRN
        const config = {
          email: GST_API_CONFIG.SANDBOX.email,
          username: GST_API_CONFIG.SANDBOX.username,
          ip_address: GST_API_CONFIG.SANDBOX.ip_address,
          client_id: GST_API_CONFIG.SANDBOX.client_id,
          client_secret: GST_API_CONFIG.SANDBOX.client_secret,
          gstin: GST_API_CONFIG.SANDBOX.gstin,
          authToken: authToken,
        };

        const response = await einvoiceService.getEInvoiceByIRN(einvoiceId, config);
        if (response.status_cd === "1" || response.status_cd === "Sucess") {
          const printData = convertToPrintData(response);
          setPrintData(printData);
          sessionStorage.setItem("einvoiceData", JSON.stringify(response));
        }
      }
    } catch (error: any) {
      console.error("Error loading E-Invoice:", error);
      throw error;
    }
  };

  const convertToPrintData = (einvoiceData: any): EInvoicePrintData => {
    const responseData = einvoiceData.data || einvoiceData || {};
    
    // Parse SignedInvoice
    let invoiceData: any = {};
    const signedInvoiceStr = responseData.SignedInvoice || responseData.signedInvoice;
    
    if (signedInvoiceStr) {
      try {
        let parsedData: any;
        if (typeof signedInvoiceStr === 'string' && signedInvoiceStr.startsWith("eyJ")) {
          const decoded = jwtDecode<any>(signedInvoiceStr);
          if (decoded.data && typeof decoded.data === 'string') {
            parsedData = JSON.parse(decoded.data);
          } else if (decoded.data && typeof decoded.data === 'object') {
            parsedData = decoded.data;
          } else {
            parsedData = decoded;
          }
        } else {
          parsedData = typeof signedInvoiceStr === 'string' ? JSON.parse(signedInvoiceStr) : signedInvoiceStr;
        }
        invoiceData = parsedData.data || parsedData;
      } catch (error) {
        console.error("Failed to parse SignedInvoice:", error);
      }
    }

    const data = (invoiceData.DocDtls || invoiceData.SellerDtls || invoiceData.BuyerDtls || invoiceData.ItemList || invoiceData.ValDtls) 
      ? invoiceData 
      : responseData;

    const docDetails = data.DocDtls || data.docDtls || {};
    const tranDetails = data.TranDtls || data.tranDtls || {};
    const sellerDetails = data.SellerDtls || data.sellerDtls || {};
    const buyerDetails = data.BuyerDtls || data.buyerDtls || {};
    const shipDetails = data.ShipDtls || data.shipDtls || {};
    const itemList = data.ItemList || data.itemList || [];
    const valDetails = data.ValDtls || data.valDtls || {};

    // Format dates
    const formatDateTime = (dateStr: string) => {
      if (!dateStr) return "";
      try {
        const date = new Date(dateStr);
        return format(date, "dd-MM-yyyy HH:mm:ss");
      } catch {
        return dateStr;
      }
    };

    const formatDate = (dateStr: string) => {
      if (!dateStr) return "";
      try {
        if (dateStr.includes("/")) {
          const [day, month, year] = dateStr.split("/");
          return `${day}-${month}-${year}`;
        }
        const date = new Date(dateStr);
        return format(date, "dd-MM-yyyy");
      } catch {
        return dateStr;
      }
    };

    // Get state name
    const getStateName = (code: string): string => {
      if (!code) return "";
      const stateMap: { [key: string]: string } = {
        "29": "KARNATAKA", "27": "MAHARASHTRA", "09": "UTTAR PRADESH", "10": "BIHAR",
        "24": "GUJARAT", "06": "HARYANA", "02": "HIMACHAL PRADESH", "20": "JHARKHAND",
        "32": "KERALA", "23": "MADHYA PRADESH", "21": "ODISHA", "08": "RAJASTHAN",
        "33": "TAMIL NADU", "36": "TELANGANA", "19": "WEST BENGAL", "07": "DELHI",
      };
      return stateMap[code] || code;
    };

    // QR Code
    const qrCodeRaw = responseData.SignedQRCode || responseData.signedQRCode || "";
    let qrCodeBase64 = "";
    if (qrCodeRaw) {
      if (qrCodeRaw.startsWith("data:image")) {
        qrCodeBase64 = qrCodeRaw;
      } else if (qrCodeRaw.startsWith("http://") || qrCodeRaw.startsWith("https://")) {
        qrCodeBase64 = qrCodeRaw;
      } else if (qrCodeRaw.startsWith("eyJ")) {
        qrCodeBase64 = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeRaw)}`;
      } else {
        qrCodeBase64 = `data:image/png;base64,${qrCodeRaw}`;
      }
    }

    return {
      supplierGSTIN: sellerDetails.Gstin || sellerDetails.gstin || "",
      supplierName: sellerDetails.TrdNm || sellerDetails.trdNm || "",
      supplierAddress: {
        line1: sellerDetails.Addr1 || sellerDetails.addr1 || "",
        line2: sellerDetails.Addr2 || sellerDetails.addr2,
        city: sellerDetails.Loc || sellerDetails.loc || "",
        district: "",
        pin: sellerDetails.Pin || sellerDetails.pin || "",
        state: getStateName(sellerDetails.Stcd || sellerDetails.stcd || ""),
      },
      recipientGSTIN: buyerDetails.Gstin || buyerDetails.gstin || "",
      recipientName: buyerDetails.TrdNm || buyerDetails.trdNm || "",
      recipientAddress: {
        line1: buyerDetails.Addr1 || buyerDetails.addr1 || "",
        line2: buyerDetails.Addr2 || buyerDetails.addr2,
        city: buyerDetails.Loc || buyerDetails.loc || "",
        pin: buyerDetails.Pin || buyerDetails.pin || "",
        state: getStateName(buyerDetails.Stcd || buyerDetails.stcd || ""),
        placeOfSupply: getStateName(buyerDetails.Pos || buyerDetails.pos || ""),
      },
      shipToGSTIN: shipDetails.Gstin || shipDetails.gstin,
      shipToName: shipDetails.TrdNm || shipDetails.trdNm,
      shipToAddress: shipDetails.Gstin ? {
        line1: shipDetails.Addr1 || shipDetails.addr1 || "",
        line2: shipDetails.Addr2 || shipDetails.addr2,
        city: shipDetails.Loc || shipDetails.loc || "",
        pin: shipDetails.Pin || shipDetails.pin || "",
        state: getStateName(shipDetails.Stcd || shipDetails.stcd || ""),
      } : undefined,
      irn: responseData.Irn || responseData.irn || "",
      ackNo: responseData.AckNo || responseData.ackNo || "",
      ackDateTime: formatDateTime(responseData.AckDt || responseData.ackDt || ""),
      supplyTypeCode: tranDetails.SupTyp || tranDetails.supTyp || "",
      documentNo: docDetails.No || docDetails.no || "",
      documentType: docDetails.Typ === "INV" ? "Tax Invoice" : docDetails.Typ || docDetails.typ || "",
      documentDate: formatDate(docDetails.Dt || docDetails.dt || ""),
      placeOfSupply: getStateName(buyerDetails.Pos || buyerDetails.pos || ""),
      items: itemList.map((item: any, index: number) => {
        const taxRate = parseFloat(item.GstRt || item.gstRt || 0);
        const cgstRate = parseFloat(item.CgstRt || item.cgstRt || 0);
        const sgstRate = parseFloat(item.SgstRt || item.sgstRt || 0);
        const igstRate = parseFloat(item.IgstRt || item.igstRt || 0);
        
        // Format tax rate as per PDF: "18.00+0.00|0.00+0"
        let taxRateText = "0.00+0.00|0.00+0";
        if (cgstRate > 0 && sgstRate > 0) {
          taxRateText = `${taxRate.toFixed(2)}+0.00|0.00+0`;
        } else if (igstRate > 0) {
          taxRateText = `0.00+0.00|${igstRate.toFixed(2)}+0`;
        } else if (taxRate > 0) {
          taxRateText = `${taxRate.toFixed(2)}+0.00|0.00+0`;
        }

        return {
          slNo: item.SlNo || item.slNo || index + 1,
          description: item.PrdNm || item.prdNm || item.PrdDesc || item.prdDesc || "",
          hsn: item.HsnCd || item.hsnCd || "",
          qty: parseFloat(item.Qty || item.qty || 0),
          unit: item.Unit || item.unit || "",
          unitPrice: parseFloat(item.UnitPrice || item.unitPrice || 0),
          discount: parseFloat(item.Discount || item.discount || 0),
          taxable: parseFloat(item.AssAmt || item.assAmt || 0),
          taxRateText: taxRateText,
          otherCharges: parseFloat(item.OtherCharges || item.otherCharges || 0),
          total: parseFloat(item.TotItemVal || item.totItemVal || 0),
        };
      }),
      summary: {
        taxableAmt: parseFloat(valDetails.AssVal || valDetails.assVal || 0),
        cgstAmt: parseFloat(valDetails.CgstVal || valDetails.cgstVal || 0),
        sgstAmt: parseFloat(valDetails.SgstVal || valDetails.sgstVal || 0),
        igstAmt: parseFloat(valDetails.IgstVal || valDetails.igstVal || 0),
        cessAmt: parseFloat(valDetails.CessVal || valDetails.cessVal || 0),
        stateCessAmt: 0, // Not in standard response
        discount: 0, // Calculate if needed
        otherCharges: 0, // Calculate if needed
        roundOff: 0, // Calculate if needed
        totalInvAmt: parseFloat(valDetails.TotInvVal || valDetails.totInvVal || 0),
      },
      ewaybill: responseData.EwbNo ? {
        ewayBillNo: responseData.EwbNo || "",
        ewayBillDate: formatDate(responseData.EwbDt || responseData.ewbDt || ""),
        validTill: formatDate(responseData.EwbValidTill || responseData.ewbValidTill || ""),
      } : undefined,
      generatedBy: sellerDetails.Gstin || sellerDetails.gstin || "",
      printDateTime: new Date().toLocaleString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      signedByText: "Digitally Signed by NIC-IRP",
      signedOnDateTime: formatDateTime(responseData.AckDt || responseData.ackDt || ""),
      signedQRCodeBase64: qrCodeBase64 || undefined,
    };
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }

  if (!printData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">E-Invoice Not Found</h2>
          <p className="text-muted-foreground">Unable to load E-Invoice data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4">
      <EInvoicePrintLayout
        data={printData}
      />
    </div>
  );
}
