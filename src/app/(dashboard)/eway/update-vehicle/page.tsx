/**
 * Update Vehicle Details (Part-B) Page
 * 
 * Government-compliant E-Way Bill vehicle update
 * UI is 1:1 clone of Government E-Way Bill Portal
 * 
 * Rules:
 * - Allow only if status = Active
 * - Maintain vehicle update history table exactly like govt portal
 * 
 * Fields in same order as govt portal:
 * - EWB Number
 * - Vehicle Number OR
 * - Transport Document Number
 * - Transport Document Date
 * - Place
 * 
 * Buttons: "Submit" and "Reset"
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader } from "@/components/common/loader";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertCircle,
  CheckCircle2,
  Truck,
  FileText,
} from "lucide-react";
import { ROUTES } from "@/constants";
import { formatDate } from "@/lib/utils";
import { format } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { EWayBillVehicleHistory } from "@/types";

export default function UpdateVehiclePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  // Form fields in exact order as govt portal
  const [ewayBillNo, setEwayBillNo] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [transDocNo, setTransDocNo] = useState("");
  const [transDocDate, setTransDocDate] = useState<Date | null>(null);
  const [place, setPlace] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingBill, setIsLoadingBill] = useState(false);
  const [ewayBillDetails, setEwayBillDetails] = useState<any>(null);
  const [vehicleHistory, setVehicleHistory] = useState<EWayBillVehicleHistory[]>([]);

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
      // In production, fetch from actual API/DB
      // For now, simulate with mock data
      const mockEWayBill = {
        ewayBillNumber: ewayBillNo.trim(),
        status: "ACTIVE",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        vehicleNumber: "MH-12-AB-1234",
        fromPlace: "Mumbai",
        toPlace: "Pune",
        validUntil: new Date(Date.now() + 14 * 60 * 60 * 1000).toISOString(),
      };

      // Mock vehicle history
      const mockHistory: EWayBillVehicleHistory[] = [
        {
          id: "1",
          ewayBillId: "1",
          vehicleNumber: "MH-12-AB-1234",
          transMode: "1",
          distance: 150,
          updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          updatedBy: "system",
        },
        {
          id: "2",
          ewayBillId: "1",
          vehicleNumber: "DL-01-CD-5678",
          transMode: "1",
          distance: 200,
          updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          updatedBy: "system",
        },
      ];

      setTimeout(() => {
        setEwayBillDetails(mockEWayBill);
        setVehicleHistory(mockHistory);
        setIsLoadingBill(false);
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

  const canUpdate = ewayBillDetails?.status === "ACTIVE";

  const handleSubmit = async () => {
    // Validation: EWB Number
    if (!ewayBillNo || ewayBillNo.trim().length === 0) {
      toast({
        title: "E-Way Bill Number Required",
        description: "Please enter E-Way Bill Number",
        variant: "destructive",
      });
      return;
    }

    if (!ewayBillDetails) {
      toast({
        title: "E-Way Bill Not Found",
        description: "Please lookup E-Way Bill details first",
        variant: "destructive",
      });
      return;
    }

    // Validation: Status must be ACTIVE
    if (ewayBillDetails.status !== "ACTIVE") {
      toast({
        title: "Update Not Allowed",
        description: "Only Active E-Way Bills can be updated. Current status: " + ewayBillDetails.status,
        variant: "destructive",
      });
      return;
    }

    // Validation: Either Vehicle Number OR (Transport Document No + Date)
    const hasVehicleNo = vehicleNumber && vehicleNumber.trim().length > 0;
    const hasTransDoc = transDocNo && transDocNo.trim().length > 0 && transDocDate;

    if (!hasVehicleNo && !hasTransDoc) {
      toast({
        title: "Vehicle Details Required",
        description: "Please provide either Vehicle Number OR Transport Document Number + Date",
        variant: "destructive",
      });
      return;
    }

    // Validation: Place
    if (!place || place.trim().length < 3) {
      toast({
        title: "Place Required",
        description: "Please enter place (minimum 3 characters)",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: any = {
        transMode: "1", // Default to Road
        distance: "0", // Default distance
        status: ewayBillDetails.status,
        place: place.trim(),
      };

      // Add vehicleNo if provided
      if (hasVehicleNo) {
        payload.vehicleNo = vehicleNumber.toUpperCase().replace(/\s/g, "");
      }

      // Add transport document details if provided
      if (hasTransDoc) {
        payload.transDocNo = transDocNo.trim();
        payload.transDocDate = format(transDocDate!, "dd/MM/yyyy");
      }

      const response = await fetch(
        `/api/eway-bills/${ewayBillNo}/update-vehicle`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update vehicle details");
      }

      toast({
        title: "Success",
        description: "Vehicle details updated successfully",
      });

      // Refresh vehicle history
      const updatedHistory: EWayBillVehicleHistory[] = [
        {
          id: String(Date.now()),
          ewayBillId: ewayBillDetails.id || "1",
          vehicleNumber: hasVehicleNo ? vehicleNumber.toUpperCase().replace(/\s/g, "") : undefined,
          transDocNo: hasTransDoc ? transDocNo.trim() : undefined,
          transDocDate: hasTransDoc ? format(transDocDate!, "dd/MM/yyyy") : undefined,
          transMode: "1",
          distance: 0,
          updatedAt: new Date().toISOString(),
          updatedBy: "system",
        },
        ...vehicleHistory,
      ];
      setVehicleHistory(updatedHistory);

      // Reset form (keep EWB number)
      setVehicleNumber("");
      setTransDocNo("");
      setTransDocDate(null);
      setPlace("");
    } catch (error: any) {
      console.error("Update Vehicle Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update vehicle details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setVehicleNumber("");
    setTransDocNo("");
    setTransDocDate(null);
    setPlace("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Update Vehicle Details (Part-B)</h1>
        <p className="text-muted-foreground">
          Update vehicle details for E-Way Bill as per Government rules
        </p>
      </div>

      {/* Government Rules Info */}
      <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
        <CardHeader>
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <CardTitle className="text-orange-900 dark:text-orange-200">Government Rules for Vehicle Update</CardTitle>
              <CardDescription className="text-orange-700 dark:text-orange-300 mt-1">
                Please read the following rules carefully before proceeding:
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-orange-800 dark:text-orange-200">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Status Requirement:</strong> Only Active E-Way Bills can be updated.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Truck className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Update Options:</strong> Provide either Vehicle Number OR Transport Document Number + Date.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Multiple Updates:</strong> Vehicle details can be updated multiple times. All updates are maintained in history.
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Update Vehicle Form - Exact sequence as govt portal */}
      <Card>
        <CardHeader>
          <CardTitle>Update Vehicle Details (Part-B)</CardTitle>
          <CardDescription>
            Enter E-Way Bill details and vehicle information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 1. EWB Number */}
          <div className="space-y-2">
            <Label htmlFor="ewayBillNo">
              EWB Number <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="ewayBillNo"
                value={ewayBillNo}
                onChange={(e) => setEwayBillNo(e.target.value.toUpperCase().trim())}
                placeholder="Enter E-Way Bill Number (e.g., EWB-2024-001)"
                disabled={isSubmitting}
                className="flex-1"
              />
              <Button
                type="button"
                onClick={handleEWayBillLookup}
                disabled={!ewayBillNo || ewayBillNo.trim().length === 0 || isLoadingBill || isSubmitting}
              >
                {isLoadingBill ? (
                  <>
                    <Loader size="sm" className="mr-2" />
                    Looking up...
                  </>
                ) : (
                  "Lookup"
                )}
              </Button>
            </div>
          </div>

          {/* E-Way Bill Details */}
          {ewayBillDetails && (
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Status:</span>
                <span className={`text-sm font-semibold ${
                  ewayBillDetails.status === "ACTIVE" ? "text-green-600" : "text-red-600"
                }`}>
                  {ewayBillDetails.status}
                </span>
              </div>
              {!canUpdate && (
                <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                  ⚠️ Update not allowed: Only Active E-Way Bills can be updated. Current status: {ewayBillDetails.status}
                </div>
              )}
            </div>
          )}

          {/* 2. Vehicle Number OR Transport Document */}
          <div className="space-y-4">
            <div className="border border-gray-300 bg-gray-50 p-3 rounded text-sm">
              <p className="font-medium mb-1">Update Options:</p>
              <p className="text-muted-foreground">
                Provide <strong>Vehicle Number</strong> OR <strong>Transport Document Number + Date</strong>
              </p>
            </div>

            {/* Vehicle Number - Option 1 */}
            <div className="space-y-2">
              <Label htmlFor="vehicleNumber">
                Vehicle Number <span className="text-muted-foreground text-xs">(Option 1)</span>
              </Label>
              <Input
                id="vehicleNumber"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value.toUpperCase().replace(/\s/g, ""))}
                placeholder="Enter vehicle number (e.g., MH12AB1234)"
                disabled={!ewayBillDetails || !canUpdate || isSubmitting}
                className="disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">
                Format: XX##XX#### (e.g., MH12AB1234)
              </p>
            </div>

            {/* OR Separator */}
            <div className="flex items-center gap-2">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="text-sm text-muted-foreground font-medium">OR</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            {/* Transport Document Number - Option 2 */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="transDocNo">
                  Transport Document Number <span className="text-muted-foreground text-xs">(Option 2)</span>
                </Label>
                <Input
                  id="transDocNo"
                  value={transDocNo}
                  onChange={(e) => setTransDocNo(e.target.value)}
                  placeholder="Enter transport document number"
                  disabled={!ewayBillDetails || !canUpdate || isSubmitting}
                  className="disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transDocDate">
                  Transport Document Date <span className="text-muted-foreground text-xs">(Required if Document No provided)</span>
                </Label>
                <DatePicker
                  selected={transDocDate}
                  onChange={(date) => setTransDocDate(date)}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="dd/mm/yyyy"
                  maxDate={new Date()}
                  disabled={!ewayBillDetails || !canUpdate || isSubmitting}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  wrapperClassName="w-full"
                />
              </div>
            </div>
          </div>

          {/* 3. Place */}
          <div className="space-y-2">
            <Label htmlFor="place">
              Place <span className="text-red-500">*</span>
            </Label>
            <Input
              id="place"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              placeholder="Enter place (e.g., Mumbai, Maharashtra)"
              disabled={!ewayBillDetails || !canUpdate || isSubmitting}
              className="disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">
              Enter the place where vehicle details are being updated (minimum 3 characters required)
            </p>
          </div>

          {/* Submit and Reset Buttons - Government Portal Style */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={isSubmitting || !ewayBillDetails}
              className="border-gray-300"
            >
              Reset
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                !ewayBillDetails ||
                !canUpdate ||
                (!vehicleNumber && (!transDocNo || !transDocDate)) ||
                !place ||
                place.trim().length < 3
              }
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader size="sm" className="mr-2" />
                  Submitting...
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Update History Table - Exactly like govt portal */}
      {ewayBillDetails && vehicleHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Update History</CardTitle>
            <CardDescription>
              History of all vehicle updates for this E-Way Bill
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sr. No.</TableHead>
                    <TableHead>Vehicle Number</TableHead>
                    <TableHead>Transport Document No</TableHead>
                    <TableHead>Transport Document Date</TableHead>
                    <TableHead>Place</TableHead>
                    <TableHead>Updated At</TableHead>
                    <TableHead>Updated By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicleHistory.map((history, index) => (
                    <TableRow key={history.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        {history.vehicleNumber || (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {history.transDocNo || (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {history.transDocDate || (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground text-sm">-</span>
                      </TableCell>
                      <TableCell>{formatDate(history.updatedAt)}</TableCell>
                      <TableCell>
                        {history.updatedBy || (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
