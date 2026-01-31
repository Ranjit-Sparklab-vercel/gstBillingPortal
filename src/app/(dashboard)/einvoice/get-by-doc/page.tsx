/**
 * Get IRN by Document Details Page
 * 
 * API: GET /einvoice/type/GETIRNBYDOCDETAILS/version/V1_03
 * 
 * Get IRN details by Document Details. You can fetch only past 72 hours of invoices from the time of IRN generation.
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
import {
  Search,
  FileText,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Hash,
} from "lucide-react";
import { ROUTES } from "@/constants";
import { einvoiceService } from "@/services/gst/einvoice.service";
import { gstAuthService } from "@/services/gst/auth.service";
import { GST_API_CONFIG } from "@/config/gstApi.config";

export default function GetIRNByDocDetailsPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    docType: "INV", // Document type (INV, CRN, DBN)
    docNum: "",
    docDate: "",
    supplierGstn: "",
    irp: "",
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [irnData, setIrnData] = useState<any>(null);

  useEffect(() => {
    authenticate();
  }, []);

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
      toast({
        title: "Authentication Failed",
        description: "Failed to authenticate. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const formatDateForAPI = (dateStr: string): string => {
    // Convert YYYY-MM-DD to dd/MM/yyyy
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const handleGetIRN = async () => {
    if (!formData.docNum || !formData.docDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Document Number and Document Date).",
        variant: "destructive",
      });
      return;
    }

    if (!authToken) {
      toast({
        title: "Authentication Required",
        description: "Please wait for authentication to complete.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setIrnData(null);

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

      const docDateFormatted = formatDateForAPI(formData.docDate);

      const response = await einvoiceService.getIRNByDocDetails(
        {
          docType: formData.docType,
          docNum: formData.docNum,
          docDate: docDateFormatted,
          supplierGstn: formData.supplierGstn || undefined,
          irp: formData.irp || undefined,
        },
        config
      );

      if (response.status_cd === "1" || response.status_cd === "Sucess") {
        setIrnData(response);
        toast({
          title: "IRN Found",
          description: "IRN details retrieved successfully.",
        });
      } else {
        toast({
          title: "No IRN Found",
          description: response.status_desc || "No IRN found for the given document details.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Get IRN by Doc Details Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to get IRN by document details.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Get IRN by Document Details</h1>
          <p className="text-muted-foreground">
            Get IRN details by Document Details. You can fetch only past 72 hours of invoices from the time of IRN generation.
          </p>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Enter Document Details</CardTitle>
          <CardDescription>
            Enter document type, number, and date to retrieve IRN details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Document Type */}
            <div className="space-y-2">
              <Label htmlFor="docType">
                Document Type <span className="text-red-500">*</span>
              </Label>
              <select
                id="docType"
                value={formData.docType}
                onChange={(e) => handleInputChange("docType", e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="INV">Invoice (INV)</option>
                <option value="CRN">Credit Note (CRN)</option>
                <option value="DBN">Debit Note (DBN)</option>
              </select>
            </div>

            {/* Document Number */}
            <div className="space-y-2">
              <Label htmlFor="docNum">
                Document Number <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="docNum"
                  placeholder="Enter document number"
                  value={formData.docNum}
                  onChange={(e) => handleInputChange("docNum", e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Document Date */}
            <div className="space-y-2">
              <Label htmlFor="docDate">
                Document Date <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="docDate"
                  type="date"
                  value={formData.docDate}
                  onChange={(e) => handleInputChange("docDate", e.target.value)}
                  className="pl-9"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Format: dd/MM/yyyy (will be converted automatically)
                </p>
              </div>
            </div>

            {/* Supplier GSTIN (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="supplierGstn">
                Supplier GSTIN (Optional)
              </Label>
              <Input
                id="supplierGstn"
                placeholder="Enter supplier GSTIN (only for E-Commerce operators)"
                value={formData.supplierGstn}
                onChange={(e) => handleInputChange("supplierGstn", e.target.value)}
                maxLength={15}
              />
              <p className="text-xs text-muted-foreground">
                Only in case E-Commerce operator is getting IRN details
              </p>
            </div>

            {/* IRP (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="irp">
                e-Invoice Server Type (Optional)
              </Label>
              <select
                id="irp"
                value={formData.irp}
                onChange={(e) => handleInputChange("irp", e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select Server Type</option>
                <option value="NIC1">NIC1</option>
                <option value="NIC2">NIC2</option>
              </select>
              <p className="text-xs text-muted-foreground">
                e-Invoice Server Type (NIC1/NIC2), given at the time of e-Invoice generation
              </p>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleGetIRN}
              disabled={isLoading || !formData.docNum || !formData.docDate || !authToken}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader size="sm" className="mr-2" />
                  Fetching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Get IRN Details
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Card */}
      {irnData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>IRN Details</CardTitle>
                <CardDescription>Retrieved IRN information</CardDescription>
              </div>
              {irnData.status_cd === "1" || irnData.status_cd === "Sucess" ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            {irnData.status_cd === "1" || irnData.status_cd === "Sucess" ? (
              <div className="space-y-4">
                {/* IRN */}
                {irnData.data?.Irn && (
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div>
                      <p className="text-sm text-muted-foreground">IRN</p>
                      <p className="text-lg font-semibold text-blue-900 break-all">
                        {irnData.data.Irn}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`${ROUTES.EINVOICE.GET}?irn=${irnData.data.Irn}`)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Invoice
                    </Button>
                  </div>
                )}

                {/* Acknowledgment Details */}
                {irnData.data?.AckNo && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Acknowledgment Number</p>
                      <p className="font-semibold">{irnData.data.AckNo}</p>
                    </div>
                    {irnData.data?.AckDt && (
                      <div>
                        <p className="text-sm text-muted-foreground">Acknowledgment Date</p>
                        <p className="font-semibold">{irnData.data.AckDt}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* E-Waybill Details */}
                {irnData.data?.EwayBillNo && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">E-Waybill Number</p>
                      <p className="font-semibold">{irnData.data.EwayBillNo}</p>
                    </div>
                    {irnData.data?.EwayBillDate && (
                      <div>
                        <p className="text-sm text-muted-foreground">E-Waybill Date</p>
                        <p className="font-semibold">{irnData.data.EwayBillDate}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* QR Code */}
                {irnData.data?.QRCode && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">QR Code</p>
                    <div className="flex items-center gap-4">
                      <img
                        src={irnData.data.QRCode}
                        alt="QR Code"
                        className="w-32 h-32 border rounded"
                      />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground break-all">
                          {irnData.data.QRCode}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Full Response (for debugging) */}
                {process.env.NODE_ENV === 'development' && (
                  <details className="mt-4">
                    <summary className="text-sm text-muted-foreground cursor-pointer">
                      View Full Response (Debug)
                    </summary>
                    <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto">
                      {JSON.stringify(irnData, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 mx-auto mb-2 text-red-500" />
                <p className="text-lg font-semibold mb-2">No IRN Found</p>
                <p className="text-muted-foreground">
                  {irnData.status_desc || "No IRN found for the given document details."}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Note: You can only fetch invoices from the past 72 hours from the time of IRN generation.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
