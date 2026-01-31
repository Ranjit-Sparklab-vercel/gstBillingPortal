/**
 * IRN Linked E-Way Bill View Page
 * 
 * Government-compliant IRN linked E-Way Bill view
 * UI is 1:1 clone of Government E-Way Bill Portal
 * 
 * Rules:
 * - Show IRN reference exactly like govt portal
 * - Disable editing of invoice fields (read-only)
 * - Display linkage labels same as govt site
 * - Purely informational - no custom design
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader } from "@/components/common/loader";
import { useToast } from "@/components/ui/use-toast";
import { StatusBadge } from "@/components/common/status-badge";
import {
  Search,
  FileText,
  Truck,
  AlertCircle,
  CheckCircle2,
  Link as LinkIcon,
} from "lucide-react";
import { ROUTES } from "@/constants";
import { formatDate } from "@/lib/utils";
import { einvoiceService } from "@/services/gst/einvoice.service";
import { gstAuthService } from "@/services/gst/auth.service";
import { GST_API_CONFIG } from "@/config/gstApi.config";

export default function IRNLinkedEWayBillViewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [irn, setIrn] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [ewayBillData, setEwayBillData] = useState<any>(null);
  const [einvoiceData, setEinvoiceData] = useState<any>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Auto-fill IRN from query parameter
  useEffect(() => {
    if (typeof window !== "undefined") {
      const irnParam = searchParams.get("irn");
      if (irnParam && irnParam !== irn) {
        setIrn(irnParam);
        // Auto lookup after a short delay
        const timer = setTimeout(() => {
          if (irnParam.trim().length > 0) {
            handleLookup();
          }
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [searchParams]);

  // Authenticate
  useEffect(() => {
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
    authenticate();
  }, []);

  const handleLookup = async () => {
    if (!irn || irn.trim().length === 0) {
      toast({
        title: "IRN Required",
        description: "Please enter IRN to proceed",
        variant: "destructive",
      });
      return;
    }

    if (!authToken) {
      toast({
        title: "Authentication Required",
        description: "Please wait for authentication to complete",
        variant: "destructive",
      });
      return;
    }

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

      // Fetch E-Way Bill by IRN
      const ewayBillResponse = await einvoiceService.getEWayBillByIRN(irn.trim(), config);
      
      if (ewayBillResponse.status_cd === "1" || ewayBillResponse.status_cd === "Sucess") {
        setEwayBillData(ewayBillResponse.data || ewayBillResponse);
        
        // Also fetch E-Invoice data to show IRN linkage
        try {
          const einvoiceResponse = await einvoiceService.getEInvoiceByIRN(irn.trim(), config);
          if (einvoiceResponse.status_cd === "1" || einvoiceResponse.status_cd === "Sucess") {
            setEinvoiceData(einvoiceResponse.data || einvoiceResponse);
          }
        } catch (error) {
          console.error("Error fetching E-Invoice:", error);
          // Continue even if E-Invoice fetch fails
        }
      } else {
        throw new Error(ewayBillResponse.status_desc || "Failed to fetch E-Way Bill");
      }
    } catch (error: any) {
      console.error("Lookup Error:", error);
      toast({
        title: "Lookup Failed",
        description: error.message || "Failed to fetch E-Way Bill details",
        variant: "destructive",
      });
      setEwayBillData(null);
      setEinvoiceData(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">IRN Linked E-Way Bill</h1>
        <p className="text-muted-foreground">
          View E-Way Bill linked to Invoice Reference Number (IRN)
        </p>
      </div>

      {/* IRN Input - Government Portal Style */}
      {!ewayBillData && (
        <Card>
          <CardHeader>
            <CardTitle>Enter IRN</CardTitle>
            <CardDescription>
              Enter Invoice Reference Number (IRN) to view linked E-Way Bill
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="irn">
                Invoice Reference Number (IRN) <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="irn"
                  value={irn}
                  onChange={(e) => setIrn(e.target.value)}
                  placeholder="Enter IRN"
                  disabled={isLoading}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && irn.trim().length > 0) {
                      handleLookup();
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={handleLookup}
                  disabled={!irn || irn.trim().length === 0 || isLoading || !authToken}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? (
                    <>
                      <Loader size="sm" className="mr-2" />
                      Fetching...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Get E-Way Bill
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* IRN Reference Section - Government Portal Style */}
      {ewayBillData && (
        <div className="space-y-4">
          {/* IRN Linkage Info - Government Portal Style */}
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <LinkIcon className="h-5 w-5 text-blue-600" />
                <div>
                  <CardTitle className="text-blue-900 dark:text-blue-200">IRN Linkage Information</CardTitle>
                  <CardDescription className="text-blue-700 dark:text-blue-300 mt-1">
                    E-Way Bill is linked to the following Invoice Reference Number
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white rounded border border-blue-200">
                  <div>
                    <p className="text-sm text-muted-foreground">Invoice Reference Number (IRN)</p>
                    <p className="text-lg font-semibold text-blue-900 break-all">
                      {irn}
                    </p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                </div>
                
                {einvoiceData && (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-2 bg-white rounded border border-blue-200">
                      <span className="text-muted-foreground">Ack. No:</span>
                      <span className="ml-2 font-semibold">
                        {einvoiceData.AckNo || einvoiceData.ackNo || "N/A"}
                      </span>
                    </div>
                    <div className="p-2 bg-white rounded border border-blue-200">
                      <span className="text-muted-foreground">Ack. Date:</span>
                      <span className="ml-2 font-semibold">
                        {einvoiceData.AckDt || einvoiceData.ackDt || "N/A"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* E-Way Bill Details - Read-Only - Government Portal Style */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>E-Way Bill Details</CardTitle>
                  <CardDescription>
                    Linked to IRN: {irn}
                  </CardDescription>
                </div>
                {ewayBillData.EwayBillNo && (
                  <StatusBadge status="ACTIVE" />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* E-Way Bill Number */}
              {ewayBillData.EwayBillNo && (
                <div className="p-4 bg-gray-50 rounded border border-gray-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">E-Way Bill Number</p>
                      <p className="text-xl font-bold text-gray-900">
                        {ewayBillData.EwayBillNo || ewayBillData.ewayBillNo}
                      </p>
                    </div>
                    <Truck className="h-8 w-8 text-gray-400" />
                  </div>
                </div>
              )}

              {/* Linkage Labels - Government Portal Style */}
              <div className="border border-gray-300 bg-white">
                <div className="bg-gray-100 px-4 py-2 border-b border-gray-300">
                  <p className="font-semibold text-sm text-gray-900">Linkage Information</p>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Linked to IRN:</span>
                    <span className="text-sm font-semibold text-gray-900">{irn}</span>
                  </div>
                  {ewayBillData.EwayBillDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">E-Way Bill Date:</span>
                      <span className="text-sm text-gray-900">
                        {ewayBillData.EwayBillDate || ewayBillData.ewayBillDate || "N/A"}
                      </span>
                    </div>
                  )}
                  {ewayBillData.EwayBillValidTill && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Valid Until:</span>
                      <span className="text-sm text-gray-900">
                        {ewayBillData.EwayBillValidTill || ewayBillData.ewayBillValidTill || "N/A"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Invoice Details - Read-Only - Government Portal Style */}
              {einvoiceData && (
                <div className="border border-gray-300 bg-white">
                  <div className="bg-gray-100 px-4 py-2 border-b border-gray-300">
                    <p className="font-semibold text-sm text-gray-900">Invoice Details (Linked from IRN)</p>
                    <p className="text-xs text-muted-foreground mt-1">All fields are read-only as per Government rules</p>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Document Number</Label>
                        <Input
                          value={einvoiceData.DocDtls?.No || einvoiceData.docDtls?.no || "N/A"}
                          disabled
                          className="mt-1 bg-gray-50"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Document Date</Label>
                        <Input
                          value={einvoiceData.DocDtls?.Dt || einvoiceData.docDtls?.dt || "N/A"}
                          disabled
                          className="mt-1 bg-gray-50"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Document Type</Label>
                        <Input
                          value={einvoiceData.DocDtls?.Typ || einvoiceData.docDtls?.typ || "N/A"}
                          disabled
                          className="mt-1 bg-gray-50"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Supply Type</Label>
                        <Input
                          value={einvoiceData.TranDtls?.SupTyp || einvoiceData.tranDtls?.supTyp || "N/A"}
                          disabled
                          className="mt-1 bg-gray-50"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Party Details - Read-Only */}
              {einvoiceData && (
                <div className="grid grid-cols-2 gap-4">
                  {/* From Party */}
                  <div className="border border-gray-300 bg-white">
                    <div className="bg-gray-100 px-4 py-2 border-b border-gray-300">
                      <p className="font-semibold text-sm text-gray-900">From (Supplier) Details</p>
                      <p className="text-xs text-muted-foreground mt-1">Read-only - Linked from IRN</p>
                    </div>
                    <div className="p-4 space-y-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">GSTIN</Label>
                        <Input
                          value={einvoiceData.SellerDtls?.Gstin || einvoiceData.sellerDtls?.gstin || "N/A"}
                          disabled
                          className="mt-1 bg-gray-50"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Trade Name</Label>
                        <Input
                          value={einvoiceData.SellerDtls?.TrdNm || einvoiceData.sellerDtls?.trdNm || "N/A"}
                          disabled
                          className="mt-1 bg-gray-50"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Address</Label>
                        <Input
                          value={einvoiceData.SellerDtls?.Addr1 || einvoiceData.sellerDtls?.addr1 || "N/A"}
                          disabled
                          className="mt-1 bg-gray-50"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Place</Label>
                        <Input
                          value={einvoiceData.SellerDtls?.Loc || einvoiceData.sellerDtls?.loc || "N/A"}
                          disabled
                          className="mt-1 bg-gray-50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* To Party */}
                  <div className="border border-gray-300 bg-white">
                    <div className="bg-gray-100 px-4 py-2 border-b border-gray-300">
                      <p className="font-semibold text-sm text-gray-900">To (Recipient) Details</p>
                      <p className="text-xs text-muted-foreground mt-1">Read-only - Linked from IRN</p>
                    </div>
                    <div className="p-4 space-y-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">GSTIN</Label>
                        <Input
                          value={einvoiceData.BuyerDtls?.Gstin || einvoiceData.buyerDtls?.gstin || "N/A"}
                          disabled
                          className="mt-1 bg-gray-50"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Trade Name</Label>
                        <Input
                          value={einvoiceData.BuyerDtls?.TrdNm || einvoiceData.buyerDtls?.trdNm || "N/A"}
                          disabled
                          className="mt-1 bg-gray-50"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Address</Label>
                        <Input
                          value={einvoiceData.BuyerDtls?.Addr1 || einvoiceData.buyerDtls?.addr1 || "N/A"}
                          disabled
                          className="mt-1 bg-gray-50"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Place</Label>
                        <Input
                          value={einvoiceData.BuyerDtls?.Loc || einvoiceData.buyerDtls?.loc || "N/A"}
                          disabled
                          className="mt-1 bg-gray-50"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Transport Details */}
              {ewayBillData && (
                <div className="border border-gray-300 bg-white">
                  <div className="bg-gray-100 px-4 py-2 border-b border-gray-300">
                    <p className="font-semibold text-sm text-gray-900">Transport Details (Part-B)</p>
                  </div>
                  <div className="p-4 space-y-2">
                    {ewayBillData.VehicleNo && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Vehicle Number</Label>
                        <Input
                          value={ewayBillData.VehicleNo || ewayBillData.vehicleNo || "N/A"}
                          disabled
                          className="mt-1 bg-gray-50"
                        />
                      </div>
                    )}
                    {ewayBillData.TransporterId && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Transporter ID</Label>
                        <Input
                          value={ewayBillData.TransporterId || ewayBillData.transporterId || "N/A"}
                          disabled
                          className="mt-1 bg-gray-50"
                        />
                      </div>
                    )}
                    {ewayBillData.TransporterName && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Transporter Name</Label>
                        <Input
                          value={ewayBillData.TransporterName || ewayBillData.transporterName || "N/A"}
                          disabled
                          className="mt-1 bg-gray-50"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEwayBillData(null);
                    setEinvoiceData(null);
                    setIrn("");
                  }}
                >
                  New Search
                </Button>
                {ewayBillData?.EwayBillNo && (
                  <Button
                    onClick={() => router.push(`${ROUTES.EWAY.PRINT}?ewayBillNo=${ewayBillData.EwayBillNo}`)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Print E-Way Bill
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
