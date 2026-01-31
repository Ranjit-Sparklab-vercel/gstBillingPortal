/**
 * Get E-Invoice Page
 * 
 * Government portal-like E-Invoice retrieval
 * 
 * Flow:
 * 1. User enters IRN
 * 2. First check local DB (sessionStorage)
 * 3. If not found or outdated → call Whitebooks Get IRN API
 * 4. Display complete invoice details
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader } from "@/components/common/loader";
import { useToast } from "@/components/ui/use-toast";
import { StatusBadge } from "@/components/common/status-badge";
import {
  Search,
  RefreshCw,
  FileText,
  Building2,
  Receipt,
  QrCode,
  AlertCircle,
  CheckCircle2,
  Eye,
} from "lucide-react";
import { ROUTES } from "@/constants";
import { einvoiceService } from "@/services/gst/einvoice.service";
import { gstAuthService } from "@/services/gst/auth.service";
import { GST_API_CONFIG } from "@/config/gstApi.config";
import { format } from "date-fns";
import { jwtDecode } from "jwt-decode";
import { STATE_CODES } from "@/constants/stateCodes";
import { EInvoicePrintLayout, EInvoicePrintData } from "@/components/einvoice/EInvoicePrintLayout";

export default function GetEInvoicePage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [irn, setIrn] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [einvoiceData, setEinvoiceData] = useState<any>(null);
  const [dataSource, setDataSource] = useState<"local" | "api" | null>(null);
  const [showDetailView, setShowDetailView] = useState(false);

  useEffect(() => {
    authenticate();
  }, []);

  // Auto-fill IRN from query parameter
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const irnParam = params.get("irn");
      if (irnParam && irnParam.trim().length > 0) {
        setIrn(irnParam.trim());
        // Wait for auth token before fetching
        if (authToken) {
          setTimeout(() => {
            handleGetEInvoice();
          }, 500);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]);

  const authenticate = async () => {
    try {
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
    } catch (error) {
      console.error("Authentication error:", error);
    }
  };

  const checkLocalStorage = (irnToCheck: string): any | null => {
    try {
      // Check sessionStorage for einvoiceData
      const storedData = sessionStorage.getItem("einvoiceData");
      if (storedData) {
        const data = JSON.parse(storedData);
        const storedIRN = data.data?.Irn || data.data?.irn || data.Irn || data.irn;
        if (storedIRN === irnToCheck) {
          return data;
        }
      }
      
      // Check localStorage (if used elsewhere)
      const localData = localStorage.getItem(`einvoice_${irnToCheck}`);
      if (localData) {
        return JSON.parse(localData);
      }
    } catch (error) {
      console.error("Error reading from local storage:", error);
    }
    return null;
  };

  const handleGetEInvoice = async () => {
    const trimmedIrn = irn?.trim() || "";
    if (!trimmedIrn || trimmedIrn.length === 0) {
      toast({
        title: "IRN Required",
        description: "Please enter an IRN to fetch E-Invoice details.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setEinvoiceData(null);
    setDataSource(null);

    try {
      // Step 1: Check local storage first
      const localData = checkLocalStorage(irn);
      if (localData && (localData.status_cd === "1" || localData.status_cd === "Sucess")) {
        setEinvoiceData(localData);
        setDataSource("local");
        toast({
          title: "E-Invoice Found",
          description: "Loaded from local storage. Click 'Refresh from Govt' to get latest data.",
        });
        setIsLoading(false);
        return;
      }

      // Step 2: If not found locally, fetch from API
      if (!authToken) {
        toast({
          title: "Authentication Required",
          description: "Please wait for authentication to complete.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const config = {
        email: GST_API_CONFIG.SANDBOX.email,
        username: GST_API_CONFIG.SANDBOX.username,
        ip_address: GST_API_CONFIG.SANDBOX.ip_address,
        client_id: GST_API_CONFIG.SANDBOX.client_id,
        client_secret: GST_API_CONFIG.SANDBOX.client_secret,
        gstin: GST_API_CONFIG.SANDBOX.gstin,
        authToken: authToken,
      };

      const response = await einvoiceService.getEInvoiceByIRN(irn, config);
      
      // Debug: Log the API response structure
      if (process.env.NODE_ENV === 'development') {
        console.log("API Response Structure:", {
          status_cd: response.status_cd,
          hasData: !!response.data,
          topLevelKeys: Object.keys(response),
          dataKeys: response.data ? Object.keys(response.data) : [],
          hasSignedInvoice: !!(response.data?.SignedInvoice || response.data?.signedInvoice),
        });
      }
      
      if (response.status_cd === "1" || response.status_cd === "Sucess") {
        setEinvoiceData(response);
        setDataSource("api");
        
        // Store in sessionStorage for future use
        sessionStorage.setItem("einvoiceData", JSON.stringify(response));
        
        toast({
          title: "E-Invoice Retrieved",
          description: "E-Invoice details fetched from Government portal.",
        });
      } else {
        throw new Error(response.status_desc || "Failed to get E-Invoice");
      }
    } catch (error: any) {
      console.error("Get E-Invoice Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch E-Invoice details.",
        variant: "destructive",
      });
      setEinvoiceData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshFromGovt = async () => {
    if (!irn || !authToken) return;
    
    setIsLoading(true);
    try {
      const config = {
        email: GST_API_CONFIG.SANDBOX.email,
        username: GST_API_CONFIG.SANDBOX.username,
        ip_address: GST_API_CONFIG.SANDBOX.ip_address,
        client_id: GST_API_CONFIG.SANDBOX.client_id,
        client_secret: GST_API_CONFIG.SANDBOX.client_secret,
        gstin: GST_API_CONFIG.SANDBOX.gstin,
        authToken: authToken,
      };

      const response = await einvoiceService.getEInvoiceByIRN(irn, config);
      
      if (response.status_cd === "1" || response.status_cd === "Sucess") {
        setEinvoiceData(response);
        setDataSource("api");
        sessionStorage.setItem("einvoiceData", JSON.stringify(response));
        
        toast({
          title: "Refreshed",
          description: "E-Invoice details updated from Government portal.",
        });
      } else {
        throw new Error(response.status_desc || "Failed to refresh");
      }
    } catch (error: any) {
      toast({
        title: "Refresh Failed",
        description: error.message || "Failed to refresh from Government portal.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      if (!dateStr) return "N/A";
      // Handle different date formats
      const date = new Date(dateStr);
      return format(date, "dd/MM/yyyy");
    } catch {
      return dateStr || "N/A";
    }
  };

  const formatDateTime = (dateStr: string) => {
    try {
      if (!dateStr) return "N/A";
      const date = new Date(dateStr);
      return format(date, "dd/MM/yyyy HH:mm:ss");
    } catch {
      return dateStr || "N/A";
    }
  };



  // Convert data to EInvoicePrintData format for exact Government layout
  const preparePrintData = (): EInvoicePrintData | null => {
    if (!einvoiceData) return null;

    const responseData = einvoiceData.data || einvoiceData || {};
    let invoiceData: any = {};
    const signedInvoiceStr = responseData.SignedInvoice || responseData.signedInvoice || responseData.SignedInvoiceString || responseData.signedInvoiceString;

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
        console.error("Failed to parse SignedInvoice for print data:", error);
        invoiceData = {};
      }
    }

    const dataToUse = (invoiceData.DocDtls || invoiceData.SellerDtls || invoiceData.BuyerDtls || invoiceData.ItemList || invoiceData.ValDtls)
      ? invoiceData
      : responseData;

    const docDetails = dataToUse.DocDtls || dataToUse.docDtls || {};
    const sellerDetails = dataToUse.SellerDtls || dataToUse.sellerDtls || {};
    const buyerDetails = dataToUse.BuyerDtls || dataToUse.buyerDtls || {};
    const shipDetails = dataToUse.ShipDtls || dataToUse.shipDtls || {};
    const itemList = dataToUse.ItemList || dataToUse.itemList || [];
    const valDetails = dataToUse.ValDtls || dataToUse.valDtls || {};
    const tranDetails = dataToUse.TranDtls || dataToUse.tranDtls || {};
    const ewbDetails = dataToUse.EwbDtls || dataToUse.ewbDtls || {};

    const getStateName = (stateCode?: string) => {
      if (!stateCode) return "";
      const state = STATE_CODES.find(s => s.value === stateCode);
      return state ? state.label : stateCode;
    };

    // QR Code handling
    const qrCodeRaw = responseData.SignedQRCode || responseData.signedQRCode || responseData.QRCode || responseData.qrCode || "";
    let qrCodeBase64 = "";
    if (qrCodeRaw) {
      if (qrCodeRaw.startsWith("data:image")) {
        qrCodeBase64 = qrCodeRaw;
      } else if (qrCodeRaw.startsWith("http://") || qrCodeRaw.startsWith("https://")) {
        qrCodeBase64 = qrCodeRaw;
      } else if (qrCodeRaw.startsWith("eyJ")) {
        qrCodeBase64 = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qrCodeRaw)}`;
      } else {
        qrCodeBase64 = `data:image/png;base64,${qrCodeRaw}`;
      }
    }

    // Calculate tax rate text for items
    const getTaxRateText = (item: any) => {
      const gstRt = parseFloat(item.GstRt || item.gstRt || 0);
      const cessRt = parseFloat(item.CesRt || item.cesRt || 0);
      const stateCessRt = parseFloat(item.StCesRt || item.stCesRt || 0);
      const cessNonAdvol = parseFloat(item.CesNonAdvol || item.cesNonAdvol || 0);
      
      const gstCess = `${gstRt.toFixed(2)}+${cessRt.toFixed(2)}`;
      const stateCessNonAdvol = `${stateCessRt.toFixed(2)}+${cessNonAdvol.toFixed(2)}`;
      
      return `${gstCess} | ${stateCessNonAdvol}`;
    };

    return {
      supplierGSTIN: sellerDetails.Gstin || sellerDetails.gstin || "",
      supplierName: sellerDetails.TrdNm || sellerDetails.trdNm || sellerDetails.LglNm || sellerDetails.lglNm || "",
      supplierAddress: {
        line1: sellerDetails.Addr1 || sellerDetails.addr1 || "",
        line2: sellerDetails.Addr2 || sellerDetails.addr2 || "",
        city: sellerDetails.Loc || sellerDetails.loc || "",
        district: "",
        pin: sellerDetails.Pin || sellerDetails.pin || "",
        state: getStateName(sellerDetails.Stcd || sellerDetails.stcd),
      },
      recipientGSTIN: buyerDetails.Gstin || buyerDetails.gstin || "",
      recipientName: buyerDetails.TrdNm || buyerDetails.trdNm || buyerDetails.LglNm || buyerDetails.lglNm || "",
      recipientAddress: {
        line1: buyerDetails.Addr1 || buyerDetails.addr1 || "",
        line2: buyerDetails.Addr2 || buyerDetails.addr2 || "",
        city: buyerDetails.Loc || buyerDetails.loc || "",
        pin: buyerDetails.Pin || buyerDetails.pin || "",
        state: getStateName(buyerDetails.Stcd || buyerDetails.stcd),
        placeOfSupply: getStateName(buyerDetails.Pos || buyerDetails.pos || sellerDetails.Stcd || sellerDetails.stcd),
      },
      shipToGSTIN: shipDetails.Gstin || shipDetails.gstin || undefined,
      shipToName: shipDetails.LglNm || shipDetails.lglNm || undefined,
      shipToAddress: shipDetails.Gstin ? {
        line1: shipDetails.Addr1 || shipDetails.addr1 || "",
        line2: shipDetails.Addr2 || shipDetails.addr2 || "",
        city: shipDetails.Loc || shipDetails.loc || "",
        pin: shipDetails.Pin || shipDetails.pin || "",
        state: getStateName(shipDetails.Stcd || shipDetails.stcd),
      } : undefined,
      irn: responseData.Irn || responseData.irn || "",
      ackNo: responseData.AckNo || responseData.ackNo || "",
      ackDateTime: formatDateTime(responseData.AckDt || responseData.ackDt || ""),
      supplyTypeCode: tranDetails.SupTyp || tranDetails.supTyp || "",
      documentNo: docDetails.No || docDetails.no || "",
      documentType: docDetails.Typ || docDetails.typ || "Tax Invoice",
      documentDate: formatDate(docDetails.Dt || docDetails.dt || ""),
      placeOfSupply: getStateName(buyerDetails.Pos || buyerDetails.pos || sellerDetails.Stcd || sellerDetails.stcd),
      items: itemList.map((item: any, idx: number) => ({
        slNo: item.SlNo || item.slNo || idx + 1,
        description: item.PrdDesc || item.prdDesc || item.PrdNm || item.prdNm || "",
        hsn: item.HsnCd || item.hsnCd || "",
        qty: parseFloat(item.Qty || item.qty || 0),
        unit: item.Unit || item.unit || "",
        unitPrice: parseFloat(item.UnitPrice || item.unitPrice || 0),
        discount: parseFloat(item.Discount || item.discount || 0),
        taxable: parseFloat(item.AssAmt || item.assAmt || 0),
        taxRateText: getTaxRateText(item),
        otherCharges: parseFloat(item.OthChrg || item.othChrg || 0),
        total: parseFloat(item.TotItemVal || item.totItemVal || 0),
      })),
      summary: {
        taxableAmt: parseFloat(valDetails.AssVal || valDetails.assVal || 0),
        cgstAmt: parseFloat(valDetails.CgstVal || valDetails.cgstVal || 0),
        sgstAmt: parseFloat(valDetails.SgstVal || valDetails.sgstVal || 0),
        igstAmt: parseFloat(valDetails.IgstVal || valDetails.igstVal || 0),
        cessAmt: parseFloat(valDetails.CesVal || valDetails.cesVal || 0),
        stateCessAmt: parseFloat(valDetails.StCesVal || valDetails.stCesVal || 0),
        discount: parseFloat(valDetails.DisAmt || valDetails.disAmt || 0),
        otherCharges: parseFloat(valDetails.OthChrg || valDetails.othChrg || 0),
        roundOff: parseFloat(valDetails.RndOffAmt || valDetails.rndOffAmt || 0),
        totalInvAmt: parseFloat(valDetails.TotInvVal || valDetails.totInvVal || 0),
      },
      ewaybill: (ewbDetails.EwbNo || ewbDetails.ewbNo || responseData.EwbNo || responseData.ewbNo) ? {
        ewayBillNo: ewbDetails.EwbNo || ewbDetails.ewbNo || responseData.EwbNo || responseData.ewbNo || "",
        ewayBillDate: formatDate(ewbDetails.EwbDt || ewbDetails.ewbDt || responseData.EwbDt || responseData.ewbDt || ""),
        validTill: formatDate(ewbDetails.EwbValidTill || ewbDetails.ewbValidTill || responseData.EwbValidTill || responseData.ewbValidTill || ""),
      } : undefined,
      generatedBy: sellerDetails.Gstin || sellerDetails.gstin || "",
      printDateTime: format(new Date(), "dd/MM/yyyy, hh:mm:ss a"),
      signedByText: "Digitally Signed by NIC-IRP",
      signedOnDateTime: formatDateTime(responseData.AckDt || responseData.ackDt || ""),
      signedQRCodeBase64: qrCodeBase64 || undefined,
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Get E-Invoice</h1>
          <p className="text-muted-foreground">
            Retrieve E-Invoice details using IRN number
          </p>
        </div>
      </div>

      {/* Search Card */}
      <Card>
        <CardHeader>
          <CardTitle>Enter IRN</CardTitle>
          <CardDescription>Enter Invoice Reference Number (IRN) to fetch E-Invoice details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="irn" className="sr-only">IRN</Label>
              <Input
                id="irn"
                placeholder="Enter IRN"
                value={irn || ""}
                onChange={(e) => {
                  setIrn(e.target.value);
                  setEinvoiceData(null);
                  setDataSource(null);
                  setShowDetailView(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleGetEInvoice();
                  }
                }}
              />
            </div>
            <Button
              onClick={handleGetEInvoice}
              disabled={isLoading || !irn.trim() || !authToken}
            >
              {isLoading ? (
                <>
                  <Loader size="sm" className="mr-2" />
                  Fetching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Get E-Invoice
                </>
              )}
            </Button>
          </div>
          {dataSource && (
            <div className="mt-4 flex items-center gap-2 text-sm">
              {dataSource === "local" ? (
                <>
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  <span className="text-muted-foreground">
                    Loaded from local storage. Click "Refresh from Govt" to get latest data.
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshFromGovt}
                    disabled={isLoading || !authToken}
                    className="ml-auto"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh from Govt
                  </Button>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-muted-foreground">
                    Fetched from Government portal
                  </span>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* E-Invoice Summary - Invoice Style Layout */}
      {einvoiceData && preparePrintData() && !showDetailView && (
        <div className="space-y-4">
          {/* Summary Container - Similar to Invoice Page */}
          <div className="bg-white border-2 border-gray-300 rounded-lg p-6 shadow-lg">
            {/* Header - Similar to Invoice Header */}
            <div className="mb-6 pb-4 border-b-2 border-gray-300">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl font-bold text-gray-900 mb-1">
                    {preparePrintData()!.supplierGSTIN}
                  </div>
                  <div className="text-xl font-bold text-gray-900">
                    {preparePrintData()!.supplierName}
                  </div>
                </div>
                <div className="bg-blue-50 px-4 py-3 rounded-lg border border-blue-200">
                  <p className="text-xs text-gray-600 mb-1">Total Invoice Amount</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ₹{preparePrintData()!.summary.totalInvAmt.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Section 1: e-Invoice Details - Table Style */}
            <div className="mb-4">
              <table className="w-full border-collapse border border-gray-400">
                <thead>
                  <tr>
                    <th colSpan={2} className="bg-gray-100 border border-gray-400 px-4 py-2 text-left font-bold text-sm">
                      1. e-Invoice Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-400 px-4 py-2 w-1/2">
                      <span className="font-semibold text-sm">IRN : </span>
                      <span className="text-sm break-all">{preparePrintData()!.irn}</span>
                    </td>
                    <td className="border border-gray-400 px-4 py-2 w-1/2">
                      <span className="font-semibold text-sm">Ack. No : </span>
                      <span className="text-sm">{preparePrintData()!.ackNo}</span>
                      <span className="font-semibold text-sm ml-4">Ack. Date : </span>
                      <span className="text-sm">{preparePrintData()!.ackDateTime}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section 2: Transaction Details - Table Style */}
            <div className="mb-4">
              <table className="w-full border-collapse border border-gray-400">
                <thead>
                  <tr>
                    <th colSpan={2} className="bg-gray-100 border border-gray-400 px-4 py-2 text-left font-bold text-sm">
                      2. Transaction Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-400 px-4 py-2 w-1/2">
                      <span className="font-semibold text-sm">Supply Type Code : </span>
                      <span className="text-sm">{preparePrintData()!.supplyTypeCode}</span>
                    </td>
                    <td className="border border-gray-400 px-4 py-2 w-1/2">
                      <span className="font-semibold text-sm">Document No : </span>
                      <span className="text-sm">{preparePrintData()!.documentNo}</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 px-4 py-2">
                      <span className="font-semibold text-sm">Place of Supply : </span>
                      <span className="text-sm">{preparePrintData()!.placeOfSupply}</span>
                    </td>
                    <td className="border border-gray-400 px-4 py-2">
                      <span className="font-semibold text-sm">Document Type : </span>
                      <span className="text-sm">{preparePrintData()!.documentType}</span>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="border border-gray-400 px-4 py-2">
                      <span className="font-semibold text-sm">Document Date : </span>
                      <span className="text-sm">{preparePrintData()!.documentDate}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section 3: Party Details - Table Style */}
            <div className="mb-4">
              <table className="w-full border-collapse border border-gray-400">
                <thead>
                  <tr>
                    <th colSpan={3} className="bg-gray-100 border border-gray-400 px-4 py-2 text-left font-bold text-sm">
                      3. Party Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {/* Supplier */}
                    <td className="border border-gray-400 px-4 py-3 w-1/3 align-top">
                      <div className="font-bold text-sm mb-2">Supplier:</div>
                      <div className="text-sm space-y-1">
                        <div><span className="font-semibold">GSTIN:</span> {preparePrintData()!.supplierGSTIN}</div>
                        <div><span className="font-semibold">Name:</span> {preparePrintData()!.supplierName}</div>
                        <div className="leading-tight">
                          <span className="font-semibold">Address:</span><br />
                          <span className="block">{preparePrintData()!.supplierAddress.line1}{preparePrintData()!.supplierAddress.line2 ? `, ${preparePrintData()!.supplierAddress.line2}` : ''}</span>
                          <span className="block">{preparePrintData()!.supplierAddress.city}{preparePrintData()!.supplierAddress.district ? `, ${preparePrintData()!.supplierAddress.district}` : ''}</span>
                          <span className="block">{preparePrintData()!.supplierAddress.pin} - {preparePrintData()!.supplierAddress.state}</span>
                        </div>
                      </div>
                    </td>
                    {/* Recipient */}
                    <td className="border border-gray-400 px-4 py-3 w-1/3 align-top">
                      <div className="font-bold text-sm mb-2">Recipient:</div>
                      <div className="text-sm space-y-1">
                        <div><span className="font-semibold">GSTIN:</span> {preparePrintData()!.recipientGSTIN}</div>
                        <div><span className="font-semibold">Name:</span> {preparePrintData()!.recipientName}</div>
                        <div className="leading-tight">
                          <span className="font-semibold">Address:</span><br />
                          <span className="block">{preparePrintData()!.recipientAddress.line1}{preparePrintData()!.recipientAddress.line2 ? `, ${preparePrintData()!.recipientAddress.line2}` : ''}</span>
                          <span className="block">{preparePrintData()!.recipientAddress.city}</span>
                          <span className="block">{preparePrintData()!.recipientAddress.pin} - {preparePrintData()!.recipientAddress.state}</span>
                        </div>
                        <div><span className="font-semibold">Place of Supply:</span> {preparePrintData()!.recipientAddress.placeOfSupply}</div>
                      </div>
                    </td>
                    {/* Ship To */}
                    <td className="border border-gray-400 px-4 py-3 w-1/3 align-top">
                      {preparePrintData()!.shipToGSTIN ? (
                        <>
                          <div className="font-bold text-sm mb-2">Ship To:</div>
                          <div className="text-sm space-y-1">
                            <div><span className="font-semibold">GSTIN:</span> {preparePrintData()!.shipToGSTIN}</div>
                            <div><span className="font-semibold">Name:</span> {preparePrintData()!.shipToName}</div>
                            {preparePrintData()!.shipToAddress && (
                              <div>
                                <span className="font-semibold">Address:</span><br />
                                {preparePrintData()!.shipToAddress.line1}
                                {preparePrintData()!.shipToAddress.line2 && <>, {preparePrintData()!.shipToAddress.line2}</>}
                                <br />
                                {preparePrintData()!.shipToAddress.city}
                                <br />
                                {preparePrintData()!.shipToAddress.pin} - {preparePrintData()!.shipToAddress.state}
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-gray-500">No Ship To details</div>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section 4: Items Summary - Table Style */}
            <div className="mb-4">
              <table className="w-full border-collapse border border-gray-400">
                <thead>
                  <tr>
                    <th colSpan={6} className="bg-gray-100 border border-gray-400 px-4 py-2 text-left font-bold text-sm">
                      4. Details of Goods / Services (Summary)
                    </th>
                  </tr>
                </thead>
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-400 px-3 py-2 text-center text-xs font-bold">S.No</th>
                    <th className="border border-gray-400 px-3 py-2 text-left text-xs font-bold">Item Description</th>
                    <th className="border border-gray-400 px-3 py-2 text-center text-xs font-bold">HSN</th>
                    <th className="border border-gray-400 px-3 py-2 text-center text-xs font-bold">Qty</th>
                    <th className="border border-gray-400 px-3 py-2 text-right text-xs font-bold">Unit Price</th>
                    <th className="border border-gray-400 px-3 py-2 text-right text-xs font-bold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {preparePrintData()!.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="border border-gray-400 px-3 py-2 text-center text-sm">{item.slNo}</td>
                      <td className="border border-gray-400 px-3 py-2 text-sm">{item.description}</td>
                      <td className="border border-gray-400 px-3 py-2 text-center text-sm">{item.hsn}</td>
                      <td className="border border-gray-400 px-3 py-2 text-center text-sm">{item.qty} {item.unit}</td>
                      <td className="border border-gray-400 px-3 py-2 text-right text-sm">₹{item.unitPrice.toFixed(2)}</td>
                      <td className="border border-gray-400 px-3 py-2 text-right text-sm font-semibold">₹{item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary of Amounts - Table Style */}
            <div className="mb-4">
              <table className="w-full border-collapse border border-gray-400">
                <thead>
                  <tr>
                    <th colSpan={10} className="bg-gray-100 border border-gray-400 px-4 py-2 text-left font-bold text-sm">
                      Summary of Amounts
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={10} className="border border-gray-400 px-4 py-2">
                      <div className="grid grid-cols-5 gap-4 text-sm">
                        <div>
                          <span className="font-semibold">Tax'ble Amt:</span><br />
                          <span className="text-base">₹{preparePrintData()!.summary.taxableAmt.toFixed(2)}</span>
                        </div>
                        {preparePrintData()!.summary.cgstAmt > 0 && (
                          <div>
                            <span className="font-semibold">CGST Amt:</span><br />
                            <span className="text-base">₹{preparePrintData()!.summary.cgstAmt.toFixed(2)}</span>
                          </div>
                        )}
                        {preparePrintData()!.summary.sgstAmt > 0 && (
                          <div>
                            <span className="font-semibold">SGST Amt:</span><br />
                            <span className="text-base">₹{preparePrintData()!.summary.sgstAmt.toFixed(2)}</span>
                          </div>
                        )}
                        {preparePrintData()!.summary.igstAmt > 0 && (
                          <div>
                            <span className="font-semibold">IGST Amt:</span><br />
                            <span className="text-base">₹{preparePrintData()!.summary.igstAmt.toFixed(2)}</span>
                          </div>
                        )}
                        <div>
                          <span className="font-semibold">Total Inv. Amt:</span><br />
                          <span className="text-lg font-bold text-blue-600">₹{preparePrintData()!.summary.totalInvAmt.toFixed(2)}</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Additional Information */}
            {(preparePrintData()!.ewaybill || preparePrintData()!.generatedBy) && (
              <div className="mb-4">
                <table className="w-full border-collapse border border-gray-400">
                  <thead>
                    <tr>
                      <th colSpan={3} className="bg-gray-100 border border-gray-400 px-4 py-2 text-left font-bold text-sm">
                        Additional Information
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-400 px-4 py-2 w-1/3">
                        {preparePrintData()!.ewaybill && (
                          <>
                            <span className="font-semibold text-sm">E-Waybill No:</span><br />
                            <span className="text-sm">{preparePrintData()!.ewaybill.ewayBillNo}</span>
                          </>
                        )}
                      </td>
                      <td className="border border-gray-400 px-4 py-2 w-1/3">
                        {preparePrintData()!.ewaybill && (
                          <>
                            <span className="font-semibold text-sm">E-Waybill Date:</span><br />
                            <span className="text-sm">{preparePrintData()!.ewaybill.ewayBillDate}</span>
                          </>
                        )}
                      </td>
                      <td className="border border-gray-400 px-4 py-2 w-1/3">
                        <span className="font-semibold text-sm">Generated By:</span><br />
                        <span className="text-sm">{preparePrintData()!.generatedBy}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Detail View Button */}
            <div className="flex justify-center pt-6 border-t-2 border-gray-300">
              <Button
                onClick={() => setShowDetailView(true)}
                size="lg"
                className="px-8 bg-blue-600 hover:bg-blue-700"
              >
                <Eye className="h-5 w-5 mr-2" />
                View Full Invoice
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* E-Invoice Details - EXACT Government Format */}
      {einvoiceData && preparePrintData() && showDetailView && (
        <EInvoicePrintLayout
          data={preparePrintData()!}
        />
      )}
    </div>
  );
}
