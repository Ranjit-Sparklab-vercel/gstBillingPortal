/**
 * Cancel E-Invoice Page
 * 
 * Government-compliant IRN cancellation
 * 
 * Rules:
 * - Only Active (GENERATED) IRNs can be cancelled
 * - Cancellation allowed ONLY within 24 hours of IRN generation
 * - Required: IRN, Cancel Reason (Govt predefined), Cancel Remarks
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
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
} from "lucide-react";
import { ROUTES } from "@/constants";
import { einvoiceService } from "@/services/gst/einvoice.service";
import { gstAuthService } from "@/services/gst/auth.service";
import { GST_API_CONFIG } from "@/config/gstApi.config";
import { einvoiceStorage } from "@/lib/einvoice-storage";
import {
  canCancelIRN,
  getHoursRemainingForCancellation,
  validateCancelRequest,
  CANCEL_REASONS,
  CancelReason,
} from "@/lib/einvoice-cancel-utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function CancelEInvoicePage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [irn, setIrn] = useState("");
  const [cancelReason, setCancelReason] = useState<CancelReason | "">("");
  const [cancelRemarks, setCancelRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isLoadingIRN, setIsLoadingIRN] = useState(false);
  const [irnDetails, setIrnDetails] = useState<any>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  useEffect(() => {
    authenticate();
  }, []);

  // Auto-fill IRN from query parameter and lookup
  useEffect(() => {
    if (authToken && typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const irnParam = params.get("irn");
      if (irnParam && irnParam !== irn) {
        setIrn(irnParam);
        // Auto lookup after a short delay
        const timer = setTimeout(() => {
          if (irnParam.trim().length > 0) {
            handleIRNLookup();
          }
        }, 500);
        return () => clearTimeout(timer);
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
      toast({
        title: "Authentication Failed",
        description: "Failed to authenticate. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleIRNLookup = async () => {
    if (!irn || irn.trim().length === 0) {
      toast({
        title: "IRN Required",
        description: "Please enter an IRN to lookup.",
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

    setIsLoadingIRN(true);
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
        const data = response.data || response;
        setIrnDetails(data);
        
        // Check if can be cancelled
        const ackDate = data.AckDt || data.ackDt || data.AckDate || data.ackDate;
        if (ackDate) {
          const canCancel = canCancelIRN(ackDate);
          const hoursRemaining = getHoursRemainingForCancellation(ackDate);
          
          if (!canCancel) {
            toast({
              title: "Cannot Cancel",
              description: `IRN cancellation is allowed only within 24 hours of generation. ${hoursRemaining === 0 ? "The 24-hour period has expired." : `${hoursRemaining} hours remaining.`}`,
              variant: "destructive",
            });
          } else {
            toast({
              title: "IRN Found",
              description: `${hoursRemaining} hours remaining for cancellation.`,
            });
          }
        }
      } else {
        toast({
          title: "IRN Not Found",
          description: response.status_desc || "IRN not found or invalid.",
          variant: "destructive",
        });
        setIrnDetails(null);
      }
    } catch (error: any) {
      console.error("IRN Lookup Error:", error);
      toast({
        title: "Lookup Failed",
        description: error.message || "Failed to lookup IRN details.",
        variant: "destructive",
      });
      setIrnDetails(null);
    } finally {
      setIsLoadingIRN(false);
    }
  };

  const handleSubmit = async () => {
    if (!irnDetails) {
      toast({
        title: "IRN Required",
        description: "Please lookup IRN details first.",
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

    // Get IRN status and ack date
    const status = irnDetails.Status || irnDetails.status || "GENERATED";
    const ackDate = irnDetails.AckDt || irnDetails.ackDt || irnDetails.AckDate || irnDetails.ackDate || new Date().toISOString();

    // Validate cancel request
    const validation = validateCancelRequest(
      irn,
      status,
      ackDate,
      cancelReason as CancelReason,
      cancelRemarks
    );

    if (!validation.valid) {
      toast({
        title: "Validation Failed",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    // Open confirmation dialog
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    setIsConfirmDialogOpen(false);
    setIsSubmitting(true);

    try {
      const config = {
        email: GST_API_CONFIG.SANDBOX.email,
        username: GST_API_CONFIG.SANDBOX.username,
        password: GST_API_CONFIG.SANDBOX.password,
        ip_address: GST_API_CONFIG.SANDBOX.ip_address,
        client_id: GST_API_CONFIG.SANDBOX.client_id,
        client_secret: GST_API_CONFIG.SANDBOX.client_secret,
        gstin: GST_API_CONFIG.SANDBOX.gstin,
        authToken: authToken!,
      };

      const response = await einvoiceService.cancelIRN(
        {
          irn: irn,
          reason: cancelReason as string,
          remark: cancelRemarks || undefined,
        },
        config
      );

      if (response.status_cd === "1" || response.status_cd === "Sucess") {
        // Update local storage (sessionStorage)
        const einvoiceData = sessionStorage.getItem("einvoiceData");
        if (einvoiceData) {
          try {
            const data = JSON.parse(einvoiceData);
            if (data.data?.Irn === irn || data.data?.irn === irn) {
              data.data.Status = "CANCELLED";
              data.data.CancelDate = new Date().toISOString();
              data.data.CancelReason = cancelReason;
              data.data.CancelRemarks = cancelRemarks;
              sessionStorage.setItem("einvoiceData", JSON.stringify(data));
            }
          } catch (e) {
            console.error("Error updating session storage:", e);
          }
        }
        
        // Update localStorage for list page
        einvoiceStorage.updateEInvoiceStatus(irn, "CANCELLED");

        toast({
          title: "IRN Cancelled Successfully",
          description: "The IRN has been cancelled as per Government rules.",
        });

        // Reset form
        setIrn("");
        setCancelReason("");
        setCancelRemarks("");
        setIrnDetails(null);

        // Redirect to invoices list after 2 seconds
        setTimeout(() => {
          router.push(ROUTES.EINVOICE.INVOICES);
        }, 2000);
      } else {
        throw new Error(response.status_desc || "Failed to cancel IRN");
      }
    } catch (error: any) {
      console.error("Cancel IRN Error:", error);
      toast({
        title: "Cancel Failed",
        description: error.message || "Failed to cancel IRN. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const ackDate = irnDetails?.AckDt || irnDetails?.ackDt || irnDetails?.AckDate || irnDetails?.ackDate;
  const canCancel = ackDate ? canCancelIRN(ackDate) : false;
  const hoursRemaining = ackDate ? getHoursRemainingForCancellation(ackDate) : 0;
  const status = irnDetails?.Status || irnDetails?.status || "";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cancel E-Invoice</h1>
        <p className="text-muted-foreground">
          Cancel IRN as per Government E-Invoice Portal rules
        </p>
      </div>

      {/* Government Rules Info */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <CardTitle className="text-orange-900">Government Rules for IRN Cancellation</CardTitle>
              <CardDescription className="text-orange-700 mt-1">
                Please read the following rules carefully before proceeding:
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-orange-800">
            <li className="flex items-start gap-2">
              <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>24-Hour Rule:</strong> IRN cancellation is allowed ONLY within 24 hours of IRN generation.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Status Requirement:</strong> Only Active (GENERATED) IRNs can be cancelled.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Required Information:</strong> IRN, Cancel Reason (Govt predefined), and Cancel Remarks.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>After Cancellation:</strong> Download and Print options will be disabled. IRN status will be marked as "Cancelled".
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Cancel Form */}
      <Card>
        <CardHeader>
          <CardTitle>Cancel IRN</CardTitle>
          <CardDescription>Enter IRN and cancellation details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* IRN Input */}
          <div className="space-y-2">
            <Label htmlFor="irn">
              IRN <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="irn"
                placeholder="Enter IRN"
                value={irn}
                onChange={(e) => {
                  setIrn(e.target.value);
                  setIrnDetails(null);
                }}
                className="flex-1"
              />
              <Button
                type="button"
                onClick={handleIRNLookup}
                disabled={isLoadingIRN || !irn.trim() || !authToken}
              >
                {isLoadingIRN ? (
                  <Loader size="sm" />
                ) : (
                  "Lookup"
                )}
              </Button>
            </div>
          </div>

          {/* IRN Details Display */}
          {irnDetails && (
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">IRN Status:</span>
                    <span className={`text-sm font-semibold ${
                      status === "GENERATED" ? "text-green-600" : 
                      status === "CANCELLED" ? "text-red-600" : 
                      "text-orange-600"
                    }`}>
                      {status || "Unknown"}
                    </span>
                  </div>
                  {ackDate && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Ack Date:</span>
                        <span className="text-sm">{new Date(ackDate).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Hours Remaining:</span>
                        <span className={`text-sm font-semibold ${
                          canCancel ? "text-green-600" : "text-red-600"
                        }`}>
                          {hoursRemaining > 0 ? `${hoursRemaining} hours` : "Expired"}
                        </span>
                      </div>
                    </>
                  )}
                  {!canCancel && ackDate && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-800">
                        ⚠️ This IRN cannot be cancelled. {hoursRemaining === 0 
                          ? "The 24-hour period has expired." 
                          : "IRN is not in Active status."}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cancel Reason */}
          <div className="space-y-2">
            <Label htmlFor="cancelReason">
              Cancel Reason <span className="text-red-500">*</span>
            </Label>
            <select
              id="cancelReason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value as CancelReason)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              disabled={!irnDetails || !canCancel}
            >
              <option value="">Select Cancel Reason</option>
              {CANCEL_REASONS.map((reason) => (
                <option key={reason.value} value={reason.value}>
                  {reason.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Select a reason from the Government predefined list
            </p>
          </div>

          {/* Cancel Remarks */}
          <div className="space-y-2">
            <Label htmlFor="cancelRemarks">
              Cancel Remarks {cancelReason === "Other" && <span className="text-red-500">*</span>}
            </Label>
            <textarea
              id="cancelRemarks"
              value={cancelRemarks}
              onChange={(e) => setCancelRemarks(e.target.value)}
              placeholder="Enter cancellation remarks (Required if reason is 'Other')"
              rows={4}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!irnDetails || !canCancel}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(ROUTES.EINVOICE.INVOICES)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !irnDetails || !canCancel || !cancelReason || (cancelReason === "Other" && !cancelRemarks.trim())}
            >
              {isSubmitting ? (
                <>
                  <Loader size="sm" className="mr-2" />
                  Cancelling...
                </>
              ) : (
                "Cancel IRN"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm IRN Cancellation</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this IRN? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-md space-y-2">
              <div>
                <span className="text-sm font-medium">IRN:</span>
                <span className="text-sm ml-2 font-mono">{irn}</span>
              </div>
              <div>
                <span className="text-sm font-medium">Reason:</span>
                <span className="text-sm ml-2">{cancelReason}</span>
              </div>
              {cancelRemarks && (
                <div>
                  <span className="text-sm font-medium">Remarks:</span>
                  <span className="text-sm ml-2">{cancelRemarks}</span>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsConfirmDialogOpen(false)}
              >
                No, Keep IRN
              </Button>
              <Button
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
                  "Yes, Cancel IRN"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
