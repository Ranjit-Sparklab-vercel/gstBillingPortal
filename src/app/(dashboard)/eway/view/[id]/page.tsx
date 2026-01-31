/**
 * E-Way Bill View/Print Page
 * 
 * Displays E-Way Bill in print-ready format
 * Same flow as E-Invoice view page
 */

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader } from "@/components/common/loader";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";
import { EWayBill } from "@/types";
import { formatDate } from "@/lib/utils";
import { downloadEWayBillPDF, printEWayBillPDF, EWayBillPDFData } from "@/lib/ewaybill-pdf-generator";
import { EWayBillPrintLayout } from "@/components/eway/EWayBillPrintLayout";

export default function EWayBillViewPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [ewayBillData, setEwayBillData] = useState<EWayBill | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const ewayBillId = params.id as string;

  useEffect(() => {
    const loadEWayBillData = async () => {
      try {
        // Try to get from sessionStorage first
        const storedData = sessionStorage.getItem("ewayBillData");
        if (storedData) {
          const billData = JSON.parse(storedData);
          setEwayBillData(billData);
          setLoading(false);
          return;
        }

        // If not in storage, fetch by EWB Number
        // In production, fetch from API/DB
        const mockEWayBill: EWayBill = {
          id: "1",
          ewayBillNumber: ewayBillId,
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
          setLoading(false);
        }, 500);
      } catch (error: any) {
        console.error("Error loading E-Way Bill:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to load E-Way Bill",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    loadEWayBillData();
  }, [ewayBillId]);

  // Convert EWayBill to PDF Data format
  const convertToPDFData = (bill: EWayBill): EWayBillPDFData => {
    return {
      ewayBillNumber: bill.ewayBillNumber,
      ewayBillDate: formatDate(bill.createdAt),
      validFrom: formatDate(bill.validFrom),
      validUntil: formatDate(bill.validUntil),
      status: bill.status,
      qrCode: undefined,
      
      docType: "INV",
      docNo: bill.invoiceId,
      docDate: formatDate(bill.createdAt),
      supplyType: "O",
      
      fromGstin: "29FTHPK8890K1ZN",
      fromTradeName: "Sample Supplier",
      fromLegalName: "Sample Supplier Private Limited",
      fromAddr1: "123, Business Street",
      fromAddr2: "Industrial Area",
      fromPlace: bill.fromPlace,
      fromPincode: "400001",
      fromStateCode: "27",
      fromStateName: "Maharashtra",
      
      toGstin: "27ABCDE1234F1Z5",
      toTradeName: "Sample Buyer",
      toLegalName: "Sample Buyer Private Limited",
      toAddr1: "456, Commercial Avenue",
      toAddr2: "Business District",
      toPlace: bill.toPlace,
      toPincode: "110001",
      toStateCode: "07",
      toStateName: "Delhi",
      
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
      
      totalValue: 10000,
      cgstValue: 900,
      sgstValue: 900,
      igstValue: 0,
      cessValue: 0,
      grandTotal: 11800,
      
      transMode: "1",
      distance: 150,
      transporterId: bill.transporterId,
      transporterName: bill.transporterName,
      vehicleNo: bill.vehicleNumber,
      vehicleType: "R",
      
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }

  if (!ewayBillData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">E-Way Bill Not Found</h2>
          <p className="text-muted-foreground">Unable to load E-Way Bill data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4">
      {/* Print/Download Buttons */}
      <div className="flex justify-end gap-2 mb-4 print:hidden">
        <Button
          onClick={handlePrint}
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
              <Printer className="h-4 w-4 mr-2" />
              Print
            </>
          )}
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

      {/* Print Layout */}
      <EWayBillPrintLayout
        data={convertToPDFData(ewayBillData)}
      />
    </div>
  );
}
