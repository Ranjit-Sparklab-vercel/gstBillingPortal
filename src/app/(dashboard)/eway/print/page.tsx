/**
 * E-Way Bill Print Page
 * 
 * Government-compliant E-Way Bill print flow
 * Same flow as E-Invoice panel
 * 
 * Flow:
 * 1. User enters EWB Number
 * 2. Lookup E-Way Bill details
 * 3. Show preview/summary
 * 4. "View Detail Print" button
 * 5. Show full print layout
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
  RefreshCw,
  FileText,
  Truck,
  QrCode,
  AlertCircle,
  CheckCircle2,
  Eye,
  Printer,
  Download,
} from "lucide-react";
import { ROUTES } from "@/constants";
import { formatDate } from "@/lib/utils";
import { EWayBill } from "@/types";
import { downloadEWayBillPDF, printEWayBillPDF, EWayBillPDFData } from "@/lib/ewaybill-pdf-generator";
import { EWayBillPrintLayout } from "@/components/eway/EWayBillPrintLayout";

export default function EWayBillPrintPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [ewayBillNo, setEwayBillNo] = useState("");
  const [isLoadingBill, setIsLoadingBill] = useState(false);
  const [ewayBillData, setEwayBillData] = useState<EWayBill | null>(null);
  const [showDetailView, setShowDetailView] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Auto-fill E-Way Bill Number from query parameter
  useEffect(() => {
    if (typeof window !== "undefined") {
      const ewayBillNoParam = searchParams.get("ewayBillNo");
      if (ewayBillNoParam && ewayBillNoParam !== ewayBillNo) {
        setEwayBillNo(ewayBillNoParam);
        // Auto lookup after a short delay
        const timer = setTimeout(() => {
          if (ewayBillNoParam.trim().length > 0) {
            handleEWayBillLookup();
          }
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [searchParams]);

  const handleEWayBillLookup = async () => {
    if (!ewayBillNo || ewayBillNo.trim().length === 0) {
      toast({
        title: "E-Way Bill Number Required",
        description: "Please enter E-Way Bill Number to proceed",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingBill(true);
    try {
      // In production, fetch from actual API/DB or WhiteBooks API
      // For now, simulate with mock data
      const mockEWayBill: EWayBill = {
        id: "1",
        ewayBillNumber: ewayBillNo.trim(),
        invoiceId: "INV-2024-001",
        transporterName: "Fast Transport",
        transporterId: "29FTHPK8890K1ZN",
        vehicleNumber: "MH-12-AB-1234",
        fromPlace: "Mumbai",
        toPlace: "Pune",
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: "ACTIVE",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        lastUpdatedVehicleNumber: "MH-12-AB-1234",
        lastVehicleUpdateAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      };

      setTimeout(() => {
        setEwayBillData(mockEWayBill);
        setIsLoadingBill(false);
        setShowDetailView(false);
      }, 500);
    } catch (error: any) {
      console.error("Lookup Error:", error);
      toast({
        title: "Lookup Failed",
        description: error.message || "Failed to fetch E-Way Bill details",
        variant: "destructive",
      });
      setIsLoadingBill(false);
    }
  };

  // Convert EWayBill to PDF Data format
  const convertToPDFData = (bill: EWayBill): EWayBillPDFData => {
    return {
      ewayBillNumber: bill.ewayBillNumber,
      ewayBillDate: formatDate(bill.createdAt),
      validFrom: formatDate(bill.validFrom),
      validUntil: formatDate(bill.validUntil),
      status: bill.status,
      qrCode: undefined, // In production, fetch QR code from API/DB
      
      // Part-A: Document Details
      docType: "INV",
      docNo: bill.invoiceId,
      docDate: formatDate(bill.createdAt),
      supplyType: "O",
      
      // From Party (mock - in production fetch from invoice)
      fromGstin: "29FTHPK8890K1ZN",
      fromTradeName: "Sample Supplier",
      fromLegalName: "Sample Supplier Private Limited",
      fromAddr1: "123, Business Street",
      fromAddr2: "Industrial Area",
      fromPlace: bill.fromPlace,
      fromPincode: "400001",
      fromStateCode: "27",
      fromStateName: "Maharashtra",
      
      // To Party (mock - in production fetch from invoice)
      toGstin: "27ABCDE1234F1Z5",
      toTradeName: "Sample Buyer",
      toLegalName: "Sample Buyer Private Limited",
      toAddr1: "456, Commercial Avenue",
      toAddr2: "Business District",
      toPlace: bill.toPlace,
      toPincode: "110001",
      toStateCode: "07",
      toStateName: "Delhi",
      
      // Items (mock - in production fetch from invoice)
      items: [
        {
          slNo: "1",
          productName: "Sample Product",
          hsn: "85171200",
          quantity: "1",
          unit: "NOS",
          taxableValue: 10000,
          taxRate: 18,
          cgstRate: 9,
          sgstRate: 9,
          igstRate: 18,
          cgstAmount: 900,
          sgstAmount: 900,
          igstAmount: 0,
          total: 11800,
        },
      ],
      
      // Value Details
      totalValue: 10000,
      cgstValue: 900,
      sgstValue: 900,
      igstValue: 0,
      cessValue: 0,
      grandTotal: 11800,
      
      // Part-B: Transport Details
      transMode: "1", // Road
      distance: 150,
      transporterId: bill.transporterId,
      transporterName: bill.transporterName,
      vehicleNo: bill.vehicleNumber,
      vehicleType: "R",
      
      // Additional
      generatedBy: "System",
    };
  };

  // Handle Print
  const handlePrint = async () => {
    if (!ewayBillData) return;
    
    setIsGeneratingPDF(true);
    try {
      const pdfData = convertToPDFData(ewayBillData);
      await printEWayBillPDF(pdfData);
      toast({
        title: "Success",
        description: "E-Way Bill PDF opened for printing",
      });
    } catch (error: any) {
      console.error("Print Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate PDF for printing",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Handle Download
  const handleDownload = async () => {
    if (!ewayBillData) return;
    
    setIsGeneratingPDF(true);
    try {
      const pdfData = convertToPDFData(ewayBillData);
      await downloadEWayBillPDF(pdfData);
      toast({
        title: "Success",
        description: "E-Way Bill PDF downloaded successfully",
      });
    } catch (error: any) {
      console.error("Download Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to download PDF",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Print E-Way Bill</h1>
        <p className="text-muted-foreground">
          Enter E-Way Bill Number to view and print
        </p>
      </div>

      {/* EWB Number Input - Government Portal Style */}
      {!ewayBillData && (
        <Card>
          <CardHeader>
            <CardTitle>Enter E-Way Bill Number</CardTitle>
            <CardDescription>
              Enter E-Way Bill Number to lookup and print
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ewayBillNo">
                E-Way Bill Number <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="ewayBillNo"
                  value={ewayBillNo}
                  onChange={(e) => setEwayBillNo(e.target.value.toUpperCase().trim())}
                  placeholder="Enter E-Way Bill Number (e.g., EWB-2024-001)"
                  disabled={isLoadingBill}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && ewayBillNo.trim().length > 0) {
                      handleEWayBillLookup();
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={handleEWayBillLookup}
                  disabled={!ewayBillNo || ewayBillNo.trim().length === 0 || isLoadingBill}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLoadingBill ? (
                    <>
                      <Loader size="sm" className="mr-2" />
                      Looking up...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Lookup
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* E-Way Bill Preview/Summary - Government Portal Style */}
      {ewayBillData && !showDetailView && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>E-Way Bill Details</CardTitle>
                  <CardDescription>
                    E-Way Bill Number: {ewayBillData.ewayBillNumber}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={ewayBillData.status} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Summary Table - Government Portal Style */}
              <div className="border border-gray-300">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-400 px-4 py-2 text-left">Field</th>
                      <th className="border border-gray-400 px-4 py-2 text-left">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-400 px-4 py-2 font-semibold">E-Way Bill Number</td>
                      <td className="border border-gray-400 px-4 py-2">{ewayBillData.ewayBillNumber}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 px-4 py-2 font-semibold">Invoice Number</td>
                      <td className="border border-gray-400 px-4 py-2">{ewayBillData.invoiceId}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 px-4 py-2 font-semibold">From Place</td>
                      <td className="border border-gray-400 px-4 py-2">{ewayBillData.fromPlace}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 px-4 py-2 font-semibold">To Place</td>
                      <td className="border border-gray-400 px-4 py-2">{ewayBillData.toPlace}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 px-4 py-2 font-semibold">Vehicle Number</td>
                      <td className="border border-gray-400 px-4 py-2">
                        {ewayBillData.vehicleNumber || (
                          <span className="text-muted-foreground">Not set</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 px-4 py-2 font-semibold">Transporter</td>
                      <td className="border border-gray-400 px-4 py-2">
                        {ewayBillData.transporterName}
                        {ewayBillData.transporterId && (
                          <span className="text-muted-foreground ml-2">({ewayBillData.transporterId})</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 px-4 py-2 font-semibold">Valid From</td>
                      <td className="border border-gray-400 px-4 py-2">{formatDate(ewayBillData.validFrom)}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 px-4 py-2 font-semibold">Valid Until</td>
                      <td className="border border-gray-400 px-4 py-2">{formatDate(ewayBillData.validUntil)}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 px-4 py-2 font-semibold">Status</td>
                      <td className="border border-gray-400 px-4 py-2">
                        <StatusBadge status={ewayBillData.status} />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center gap-4 pt-6 border-t-2 border-gray-300">
                <Button
                  onClick={() => setShowDetailView(true)}
                  size="lg"
                  className="px-8 bg-blue-600 hover:bg-blue-700"
                >
                  <Eye className="h-5 w-5 mr-2" />
                  View Detail Print
                </Button>
                <Button
                  onClick={handlePrint}
                  size="lg"
                  variant="outline"
                  disabled={isGeneratingPDF}
                  className="px-8"
                >
                  {isGeneratingPDF ? (
                    <>
                      <Loader size="sm" className="mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Printer className="h-5 w-5 mr-2" />
                      Print PDF
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleDownload}
                  size="lg"
                  variant="outline"
                  disabled={isGeneratingPDF}
                  className="px-8"
                >
                  {isGeneratingPDF ? (
                    <>
                      <Loader size="sm" className="mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="h-5 w-5 mr-2" />
                      Download PDF
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Full Print View - Show print layout directly */}
      {ewayBillData && showDetailView && (
        <div className="space-y-4">
          <div className="flex justify-end gap-2 print:hidden">
            <Button
              variant="outline"
              onClick={() => setShowDetailView(false)}
            >
              Back to Summary
            </Button>
            <Button
              onClick={() => window.print()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button
              onClick={handleDownload}
              variant="outline"
              disabled={isGeneratingPDF}
            >
              {isGeneratingPDF ? (
                <>
                  <Loader size="sm" className="mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </>
              )}
            </Button>
          </div>
          <EWayBillPrintLayout
            data={convertToPDFData(ewayBillData)}
          />
        </div>
      )}
    </div>
  );
}
