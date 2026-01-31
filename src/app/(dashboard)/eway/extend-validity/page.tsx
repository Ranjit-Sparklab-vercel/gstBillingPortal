/**
 * Extend Validity Page
 * 
 * Government-compliant E-Way Bill validity extension
 * UI is 1:1 clone of Government E-Way Bill Portal
 * 
 * Rules:
 * - Allowed ONLY for Active E-Way Bills
 * - Reason mandatory
 * - Current Place mandatory
 * - Vehicle Number (optional but shown)
 * - Valid only within govt-allowed window (72 hours)
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
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  MapPin,
  Truck,
} from "lucide-react";
import { ROUTES } from "@/constants";
import { formatDate } from "@/lib/utils";
import { format } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ExtendValidityPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  // Form fields in exact sequence as govt portal
  const [ewayBillNo, setEwayBillNo] = useState("");
  const [extendReason, setExtendReason] = useState("");
  const [currentPlace, setCurrentPlace] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [newValidUntilDate, setNewValidUntilDate] = useState<Date | null>(null);
  const [newValidUntilTime, setNewValidUntilTime] = useState<string>("23:59");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingBill, setIsLoadingBill] = useState(false);
  const [ewayBillDetails, setEwayBillDetails] = useState<any>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

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
      const mockEWayBill = {
        ewayBillNumber: ewayBillNo.trim(),
        status: "ACTIVE",
        validUntil: new Date(Date.now() + 14 * 60 * 60 * 1000).toISOString(), // 14 hours from now
        vehicleNumber: "MH-12-AB-1234",
        fromPlace: "Mumbai",
        toPlace: "Pune",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      };

      setTimeout(() => {
        setEwayBillDetails(mockEWayBill);
        // Auto-fill vehicle number if available
        if (mockEWayBill.vehicleNumber) {
          setVehicleNumber(mockEWayBill.vehicleNumber);
        }
        // Set default extension date (current validity + 1 day, max 72 hours)
        const currentValidUntil = new Date(mockEWayBill.validUntil);
        const now = new Date();
        const maxValidUntil = new Date(now.getTime() + 72 * 60 * 60 * 1000);
        const defaultDate = new Date(currentValidUntil);
        defaultDate.setDate(defaultDate.getDate() + 1);
        const finalDate = defaultDate > maxValidUntil ? maxValidUntil : defaultDate;
        setNewValidUntilDate(finalDate);
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

  // Calculate max validity (72 hours from now)
  const maxValidUntil = new Date(Date.now() + 72 * 60 * 60 * 1000);
  const currentValidUntil = ewayBillDetails?.validUntil ? new Date(ewayBillDetails.validUntil) : null;
  
  const canExtend =
    ewayBillDetails?.status === "ACTIVE" &&
    currentValidUntil &&
    newValidUntilDate &&
    newValidUntilDate > currentValidUntil &&
    newValidUntilDate <= maxValidUntil;

  const handleSubmit = () => {
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
        title: "Extension Not Allowed",
        description: "Only Active E-Way Bills can be extended. Current status: " + ewayBillDetails.status,
        variant: "destructive",
      });
      return;
    }

    // Validation: Reason
    if (!extendReason || extendReason.trim().length < 10) {
      toast({
        title: "Reason Required",
        description: "Please enter reason for extension (minimum 10 characters)",
        variant: "destructive",
      });
      return;
    }

    // Validation: Current Place
    if (!currentPlace || currentPlace.trim().length < 3) {
      toast({
        title: "Current Place Required",
        description: "Please enter current place (minimum 3 characters)",
        variant: "destructive",
      });
      return;
    }

    // Validation: Extension Date
    if (!newValidUntilDate) {
      toast({
        title: "Extension Date Required",
        description: "Please select new validity date",
        variant: "destructive",
      });
      return;
    }

    if (!canExtend) {
      if (newValidUntilDate <= (currentValidUntil || new Date())) {
        toast({
          title: "Invalid Date",
          description: "New validity date must be after current validity date",
          variant: "destructive",
        });
      } else if (newValidUntilDate > maxValidUntil) {
        toast({
          title: "Extension Not Allowed",
          description: "E-Way Bill validity can be extended only up to 72 hours from current time as per Government rules",
          variant: "destructive",
        });
      }
      return;
    }

    // Open confirmation dialog
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmSubmit = async () => {
    setIsConfirmDialogOpen(false);
    setIsSubmitting(true);

    try {
      const newValidUntil = format(newValidUntilDate!, "dd/MM/yyyy") + " " + newValidUntilTime;

      const response = await fetch(
        `/api/eway-bills/${ewayBillNo}/extend-validity`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            extendReason: extendReason.trim(),
            currentLocation: currentPlace.trim(),
            newValidUntil: newValidUntil,
            status: ewayBillDetails.status,
            currentValidUntil: ewayBillDetails.validUntil,
            vehicleNumber: vehicleNumber.trim() || "",
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to extend validity");
      }

      toast({
        title: "Validity Extended Successfully",
        description: "E-Way Bill validity has been extended as per Government rules. New validity date: " + newValidUntil,
      });

      // Reset form
      setEwayBillNo("");
      setExtendReason("");
      setCurrentPlace("");
      setVehicleNumber("");
      setNewValidUntilDate(null);
      setNewValidUntilTime("23:59");
      setEwayBillDetails(null);

      // Redirect to bills list after 2 seconds
      setTimeout(() => {
        router.push(ROUTES.EWAY.BILLS);
      }, 2000);
    } catch (error: any) {
      console.error("Extend Validity Error:", error);
      toast({
        title: "Extension Failed",
        description: error.message || "Failed to extend validity. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Extend E-Way Bill Validity</h1>
        <p className="text-muted-foreground">
          Extend E-Way Bill validity as per Government E-Way Bill Portal rules
        </p>
      </div>

      {/* Government Rules Info */}
      <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
        <CardHeader>
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <CardTitle className="text-orange-900 dark:text-orange-200">Government Rules for Validity Extension</CardTitle>
              <CardDescription className="text-orange-700 dark:text-orange-300 mt-1">
                Please read the following rules carefully before proceeding:
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-orange-800 dark:text-orange-200">
            <li className="flex items-start gap-2">
              <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>72-Hour Rule:</strong> Validity can be extended only up to 72 hours from current time.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Status Requirement:</strong> Only Active E-Way Bills can be extended.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Current Place:</strong> Must provide accurate current location where goods are present.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Truck className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Extension Details:</strong> New validity date must be after current validity date.
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Extend Validity Form - Exact sequence as govt portal */}
      <Card>
        <CardHeader>
          <CardTitle>Extend E-Way Bill Validity</CardTitle>
          <CardDescription>
            Enter E-Way Bill details and extension information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 1. EWB Number */}
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
              {currentValidUntil && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Current Validity:</span>
                  <span className="text-sm">{formatDate(ewayBillDetails.validUntil)}</span>
                </div>
              )}
              {maxValidUntil && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Maximum Extension Allowed:</span>
                  <span className="text-sm text-amber-600 font-semibold">
                    {format(maxValidUntil, "dd/MM/yyyy HH:mm")} (72 hours from now)
                  </span>
                </div>
              )}
              {!canExtend && ewayBillDetails.status === "ACTIVE" && newValidUntilDate && (
                <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                  {newValidUntilDate <= (currentValidUntil || new Date())
                    ? "⚠️ New validity date must be after current validity date"
                    : newValidUntilDate > maxValidUntil
                    ? "⚠️ Extension cannot exceed 72 hours from current time"
                    : "⚠️ Invalid extension date"}
                </div>
              )}
            </div>
          )}

          {/* 2. Reason */}
          <div className="space-y-2">
            <Label htmlFor="extendReason">
              Reason <span className="text-red-500">*</span>
            </Label>
            <textarea
              id="extendReason"
              value={extendReason}
              onChange={(e) => setExtendReason(e.target.value)}
              placeholder="Enter detailed reason for extending validity (minimum 10 characters required)"
              rows={3}
              disabled={!ewayBillDetails || !canExtend || isSubmitting}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">
              Provide detailed reason for extending validity (minimum 10 characters required)
            </p>
          </div>

          {/* 3. Current Place */}
          <div className="space-y-2">
            <Label htmlFor="currentPlace">
              Current Place <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="currentPlace"
                value={currentPlace}
                onChange={(e) => setCurrentPlace(e.target.value)}
                placeholder="Enter current place (e.g., Mumbai, Maharashtra)"
                disabled={!ewayBillDetails || !canExtend || isSubmitting}
                className="pl-10 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Enter the current location where the goods are present (minimum 3 characters required)
            </p>
          </div>

          {/* 4. Vehicle Number */}
          <div className="space-y-2">
            <Label htmlFor="vehicleNumber">
              Vehicle Number
            </Label>
            <div className="relative">
              <Truck className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="vehicleNumber"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value.toUpperCase().replace(/\s/g, ""))}
                placeholder="Enter vehicle number (e.g., MH12AB1234)"
                disabled={!ewayBillDetails || !canExtend || isSubmitting}
                className="pl-10 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Vehicle number (optional) - Format: XX##XX####
            </p>
          </div>

          {/* 5. Extension Details */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Extension Details <span className="text-red-500">*</span></Label>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="newValidUntilDate" className="text-sm">
                  New Validity Date
                </Label>
                <DatePicker
                  selected={newValidUntilDate}
                  onChange={(date) => setNewValidUntilDate(date)}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="dd/mm/yyyy"
                  minDate={currentValidUntil || new Date()}
                  maxDate={maxValidUntil}
                  disabled={!ewayBillDetails || !canExtend || isSubmitting}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  wrapperClassName="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newValidUntilTime" className="text-sm">
                  New Validity Time
                </Label>
                <Input
                  id="newValidUntilTime"
                  type="time"
                  value={newValidUntilTime}
                  onChange={(e) => setNewValidUntilTime(e.target.value)}
                  disabled={!ewayBillDetails || !canExtend || isSubmitting}
                  className="disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Maximum validity extension allowed: {format(maxValidUntil, "dd/MM/yyyy HH:mm")} (72 hours from now)
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => router.push(ROUTES.EWAY.BILLS)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                !ewayBillDetails ||
                !canExtend ||
                !extendReason ||
                extendReason.trim().length < 10 ||
                !currentPlace ||
                currentPlace.trim().length < 3 ||
                !newValidUntilDate
              }
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader size="sm" className="mr-2" />
                  Extending...
                </>
              ) : (
                "Extend Validity"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog - Government Portal Style */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Confirm Validity Extension
            </DialogTitle>
            <DialogDescription>
              Please confirm that you want to extend the validity of this E-Way Bill.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 p-4">
              <p className="text-sm font-bold text-blue-900 dark:text-blue-200 mb-2">
                Extension Details:
              </p>
              <div className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
                <div className="flex justify-between">
                  <span className="font-medium">E-Way Bill Number:</span>
                  <span className="font-semibold">{ewayBillNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Current Validity:</span>
                  <span>{currentValidUntil ? formatDate(ewayBillDetails.validUntil) : "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">New Validity:</span>
                  <span className="font-semibold text-green-700">
                    {newValidUntilDate ? format(newValidUntilDate, "dd/MM/yyyy") + " " + newValidUntilTime : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Current Place:</span>
                  <span>{currentPlace}</span>
                </div>
                {vehicleNumber && (
                  <div className="flex justify-between">
                    <span className="font-medium">Vehicle Number:</span>
                    <span>{vehicleNumber}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsConfirmDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmSubmit}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader size="sm" className="mr-2" />
                  Extending...
                </>
              ) : (
                "Confirm Extension"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
