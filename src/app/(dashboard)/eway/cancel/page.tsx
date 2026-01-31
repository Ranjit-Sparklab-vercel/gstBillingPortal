/**
 * Cancel E-Way Bill Page
 * 
 * Government-compliant E-Way Bill cancellation
 * 
 * Rules:
 * - Only Active E-Way Bills can be cancelled
 * - Cancellation allowed ONLY within 24 hours of generation
 * - Goods movement not started
 * - Required: E-Way Bill Number, Cancel Reason, Cancel Remarks
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
  XCircle,
  Clock,
  FileText,
  Truck,
} from "lucide-react";
import { ROUTES } from "@/constants";
import { formatDate } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Cancel reason codes as per Government E-Way Bill Portal
const CANCEL_REASON_CODES = [
  { value: "1", label: "Duplicate E-Way Bill" },
  { value: "2", label: "Data Entry Mistake" },
  { value: "3", label: "Order Cancelled" },
  { value: "4", label: "Goods Not Moved" },
  { value: "5", label: "Other" },
] as const;

export default function CancelEWayBillPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [ewayBillNo, setEwayBillNo] = useState("");
  const [cancelReasonCode, setCancelReasonCode] = useState("");
  const [cancelRemarks, setCancelRemarks] = useState("");
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
      // In production, fetch from actual API/DB
      // For now, simulate with mock data
      const mockEWayBill = {
        ewayBillNumber: ewayBillNo.trim(),
        status: "ACTIVE",
        createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), // 10 hours ago
        vehicleNumber: "",
        fromPlace: "Mumbai",
        toPlace: "Pune",
        validUntil: new Date(Date.now() + 14 * 60 * 60 * 1000).toISOString(),
      };

      setTimeout(() => {
        setEwayBillDetails(mockEWayBill);
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

  // Calculate hours remaining for cancellation (24-hour rule)
  const hoursRemaining = ewayBillDetails?.createdAt
    ? (() => {
        const createdAt = new Date(ewayBillDetails.createdAt);
        const now = new Date();
        const hoursElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        return Math.max(0, 24 - hoursElapsed);
      })()
    : null;

  const canCancel =
    ewayBillDetails?.status === "ACTIVE" &&
    hoursRemaining !== null &&
    hoursRemaining > 0 &&
    (!ewayBillDetails?.vehicleNumber || ewayBillDetails.vehicleNumber.trim().length === 0);

  const handleSubmit = () => {
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

    if (!cancelReasonCode || cancelReasonCode.trim().length === 0) {
      toast({
        title: "Cancel Reason Required",
        description: "Please select a cancel reason",
        variant: "destructive",
      });
      return;
    }

    if (!cancelRemarks || cancelRemarks.trim().length < 10) {
      toast({
        title: "Cancel Remarks Required",
        description: "Please enter cancel remarks (minimum 10 characters)",
        variant: "destructive",
      });
      return;
    }

    if (!canCancel) {
      if (ewayBillDetails.status !== "ACTIVE") {
        toast({
          title: "Cancellation Not Allowed",
          description: "Only Active E-Way Bills can be cancelled. Current status: " + ewayBillDetails.status,
          variant: "destructive",
        });
      } else if (hoursRemaining !== null && hoursRemaining <= 0) {
        toast({
          title: "Cancellation Not Allowed",
          description: "E-Way Bill cancellation is allowed only within 24 hours of generation. The 24-hour period has expired.",
          variant: "destructive",
        });
      } else if (ewayBillDetails.vehicleNumber && ewayBillDetails.vehicleNumber.trim().length > 0) {
        toast({
          title: "Cancellation Not Allowed",
          description: "Goods movement has started. E-Way Bill cannot be cancelled once vehicle details are updated.",
          variant: "destructive",
        });
      }
      return;
    }

    // Open confirmation dialog
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    setIsConfirmDialogOpen(false);
    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/eway-bills/${ewayBillNo}/cancel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cancelReasonCode: cancelReasonCode.trim(),
            cancelRemarks: cancelRemarks.trim(),
            status: ewayBillDetails.status,
            createdAt: ewayBillDetails.createdAt,
            vehicleNumber: ewayBillDetails.vehicleNumber || "",
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to cancel E-Way Bill");
      }

      toast({
        title: "E-Way Bill Cancelled Successfully",
        description: "The E-Way Bill has been cancelled as per Government rules. All actions have been disabled.",
      });

      // Reset form
      setEwayBillNo("");
      setCancelReasonCode("");
      setCancelRemarks("");
      setEwayBillDetails(null);

      // Redirect to bills list after 2 seconds
      setTimeout(() => {
        router.push(ROUTES.EWAY.BILLS);
      }, 2000);
    } catch (error: any) {
      console.error("Cancel E-Way Bill Error:", error);
      toast({
        title: "Cancel Failed",
        description: error.message || "Failed to cancel E-Way Bill. Please try again.",
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
        <h1 className="text-3xl font-bold tracking-tight">Cancel E-Way Bill</h1>
        <p className="text-muted-foreground">
          Cancel E-Way Bill as per Government E-Way Bill Portal rules
        </p>
      </div>

      {/* Government Rules Info */}
      <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
        <CardHeader>
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <CardTitle className="text-orange-900 dark:text-orange-200">Government Rules for E-Way Bill Cancellation</CardTitle>
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
                <strong>24-Hour Rule:</strong> E-Way Bill cancellation is allowed ONLY within 24 hours of generation.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Status Requirement:</strong> Only Active E-Way Bills can be cancelled.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Truck className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Goods Movement:</strong> Cancellation is not allowed once goods movement has started (vehicle details updated).
              </span>
            </li>
            <li className="flex items-start gap-2">
              <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Permanent Action:</strong> Once cancelled, the E-Way Bill cannot be reactivated and all actions will be permanently disabled.
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Cancel Form */}
      <Card>
        <CardHeader>
          <CardTitle>Cancel E-Way Bill</CardTitle>
          <CardDescription>
            Enter E-Way Bill Number and cancellation details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* E-Way Bill Number */}
          <div className="space-y-2">
            <Label htmlFor="ewayBillNo">E-Way Bill Number <span className="text-red-500">*</span></Label>
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
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Created At:</span>
                <span className="text-sm">{formatDate(ewayBillDetails.createdAt)}</span>
              </div>
              {hoursRemaining !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Time Remaining:</span>
                  <span className={`text-sm font-semibold ${
                    hoursRemaining > 0 ? "text-green-600" : "text-red-600"
                  }`}>
                    {hoursRemaining > 0
                      ? `${Math.floor(hoursRemaining)} hours ${Math.floor((hoursRemaining % 1) * 60)} minutes`
                      : "Expired"}
                  </span>
                </div>
              )}
              {ewayBillDetails.vehicleNumber && ewayBillDetails.vehicleNumber.trim().length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Vehicle Number:</span>
                  <span className="text-sm text-destructive font-semibold">{ewayBillDetails.vehicleNumber}</span>
                </div>
              )}
              {!canCancel && ewayBillDetails.status === "ACTIVE" && (
                <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                  {hoursRemaining !== null && hoursRemaining <= 0
                    ? "⚠️ 24-hour cancellation period has expired"
                    : ewayBillDetails.vehicleNumber && ewayBillDetails.vehicleNumber.trim().length > 0
                    ? "⚠️ Goods movement has started. Cancellation not allowed."
                    : "⚠️ Cancellation not allowed"}
                </div>
              )}
            </div>
          )}

          {/* Cancel Reason */}
          <div className="space-y-2">
            <Label htmlFor="cancelReasonCode">
              Cancel Reason <span className="text-red-500">*</span>
            </Label>
            <select
              id="cancelReasonCode"
              value={cancelReasonCode}
              onChange={(e) => setCancelReasonCode(e.target.value)}
              disabled={!ewayBillDetails || !canCancel || isSubmitting}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Select Cancel Reason</option>
              {CANCEL_REASON_CODES.map((reason) => (
                <option key={reason.value} value={reason.value}>
                  {reason.label}
                </option>
              ))}
            </select>
          </div>

          {/* Cancel Remarks */}
          <div className="space-y-2">
            <Label htmlFor="cancelRemarks">
              Cancel Remarks <span className="text-red-500">*</span>
            </Label>
            <textarea
              id="cancelRemarks"
              value={cancelRemarks}
              onChange={(e) => setCancelRemarks(e.target.value)}
              placeholder="Enter detailed cancellation remarks (minimum 10 characters required)"
              rows={4}
              disabled={!ewayBillDetails || !canCancel || isSubmitting}
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">
              Provide detailed reason for cancellation (minimum 10 characters required)
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-2">
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
                !canCancel ||
                !cancelReasonCode ||
                !cancelRemarks ||
                cancelRemarks.trim().length < 10
              }
              variant="destructive"
            >
              {isSubmitting ? (
                <>
                  <Loader size="sm" className="mr-2" />
                  Cancelling...
                </>
              ) : (
                "Cancel E-Way Bill"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Confirm E-Way Bill Cancellation
            </DialogTitle>
            <DialogDescription>
              Please confirm that you want to cancel this E-Way Bill. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-lg border-2 border-destructive bg-destructive/10 p-4">
              <p className="text-sm font-bold text-destructive mb-2">
                WARNING: This action will permanently cancel the E-Way Bill
              </p>
              <ul className="text-sm text-foreground space-y-1 list-disc list-inside ml-2">
                <li>E-Way Bill will be marked as CANCELLED</li>
                <li>All actions (Update Vehicle, Change Transporter) will be disabled</li>
                <li>This action cannot be undone</li>
              </ul>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">E-Way Bill Number:</span>
                <span className="font-semibold">{ewayBillNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Cancel Reason:</span>
                <span>{CANCEL_REASON_CODES.find((r) => r.value === cancelReasonCode)?.label}</span>
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
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader size="sm" className="mr-2" />
                  Cancelling...
                </>
              ) : (
                "Confirm Cancel"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
