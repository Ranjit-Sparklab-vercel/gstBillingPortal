/**
 * Change Transporter Page
 * 
 * Government-compliant E-Way Bill transporter change
 * UI is 1:1 clone of Government E-Way Bill Portal
 * 
 * Rules:
 * - Only Active E-Way Bills allowed
 * - New Transporter ID mandatory
 * - Old transporter access revoked
 * 
 * Fields:
 * - EWB Number
 * - New Transporter ID
 * 
 * Buttons and placement must be same as govt portal
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
  AlertTriangle,
  Users,
  CheckCircle2,
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

export default function ChangeTransporterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  // Form fields - Government Portal Style
  const [ewayBillNo, setEwayBillNo] = useState("");
  const [newTransporterId, setNewTransporterId] = useState("");
  
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
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        transporterId: "29FTHPK8890K1ZN",
        transporterName: "Fast Transport",
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

  const canChange = ewayBillDetails?.status === "ACTIVE";

  // Validate GSTIN format
  const validateGSTIN = (gstin: string): boolean => {
    if (gstin.length !== 15) return false;
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstinRegex.test(gstin);
  };

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
        title: "Change Not Allowed",
        description: "Only Active E-Way Bills can change transporter. Current status: " + ewayBillDetails.status,
        variant: "destructive",
      });
      return;
    }

    // Validation: New Transporter ID
    if (!newTransporterId || newTransporterId.trim().length === 0) {
      toast({
        title: "New Transporter ID Required",
        description: "Please enter New Transporter ID (GSTIN)",
        variant: "destructive",
      });
      return;
    }

    const cleanedGSTIN = newTransporterId.toUpperCase().replace(/\s/g, "");
    if (cleanedGSTIN.length !== 15) {
      toast({
        title: "Invalid GSTIN",
        description: "Transporter ID must be exactly 15 characters (GSTIN format)",
        variant: "destructive",
      });
      return;
    }

    if (!validateGSTIN(cleanedGSTIN)) {
      toast({
        title: "Invalid GSTIN Format",
        description: "Transporter ID must be a valid 15-character GSTIN format",
        variant: "destructive",
      });
      return;
    }

    // Validation: New Transporter ID must be different from current
    if (ewayBillDetails.transporterId && cleanedGSTIN === ewayBillDetails.transporterId.toUpperCase()) {
      toast({
        title: "Invalid Transporter",
        description: "New transporter ID must be different from current transporter ID",
        variant: "destructive",
      });
      return;
    }

    // Open confirmation dialog
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmSubmit = async () => {
    setIsConfirmDialogOpen(false);
    setIsSubmitting(true);

    try {
      const cleanedGSTIN = newTransporterId.toUpperCase().replace(/\s/g, "");

      const response = await fetch(
        `/api/eway-bills/${ewayBillNo}/change-transporter`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            newTransporterId: cleanedGSTIN,
            oldTransporterId: ewayBillDetails.transporterId || undefined,
            status: ewayBillDetails.status,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to change transporter");
      }

      toast({
        title: "Transporter Changed Successfully",
        description: "Transporter has been changed successfully. Old transporter access has been revoked.",
      });

      // Reset form
      setEwayBillNo("");
      setNewTransporterId("");
      setEwayBillDetails(null);

      // Redirect to bills list after 2 seconds
      setTimeout(() => {
        router.push(ROUTES.EWAY.BILLS);
      }, 2000);
    } catch (error: any) {
      console.error("Change Transporter Error:", error);
      toast({
        title: "Change Failed",
        description: error.message || "Failed to change transporter. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setNewTransporterId("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Change Transporter</h1>
        <p className="text-muted-foreground">
          Change transporter for E-Way Bill as per Government rules
        </p>
      </div>

      {/* Government Rules Info - Same warning message text as govt portal */}
      <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
        <CardHeader>
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <CardTitle className="text-orange-900 dark:text-orange-200">Government Rules for Transporter Change</CardTitle>
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
                <strong>Status Requirement:</strong> Only Active E-Way Bills can change transporter.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Users className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>New Transporter ID:</strong> Must be a valid 15-character GSTIN. New transporter ID must be different from current transporter.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Access Revocation:</strong> Old transporter access will be revoked immediately upon confirmation. This action cannot be undone.
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Change Transporter Form - Government Portal Style */}
      <Card>
        <CardHeader>
          <CardTitle>Change Transporter</CardTitle>
          <CardDescription>
            Enter E-Way Bill Number and new transporter details
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
              {ewayBillDetails.transporterId && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Current Transporter ID:</span>
                  <span className="text-sm font-semibold">{ewayBillDetails.transporterId}</span>
                </div>
              )}
              {ewayBillDetails.transporterName && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Current Transporter Name:</span>
                  <span className="text-sm">{ewayBillDetails.transporterName}</span>
                </div>
              )}
              {!canChange && (
                <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                  ⚠️ Change not allowed: Only Active E-Way Bills can change transporter. Current status: {ewayBillDetails.status}
                </div>
              )}
            </div>
          )}

          {/* 2. New Transporter ID */}
          <div className="space-y-2">
            <Label htmlFor="newTransporterId">
              New Transporter ID <span className="text-red-500">*</span>
            </Label>
            <Input
              id="newTransporterId"
              value={newTransporterId}
              onChange={(e) => {
                const value = e.target.value.toUpperCase().replace(/\s/g, "");
                setNewTransporterId(value);
              }}
              placeholder="Enter 15-digit GSTIN (e.g., 29FTHPK8890K1ZN)"
              maxLength={15}
              disabled={!ewayBillDetails || !canChange || isSubmitting}
              className="disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">
              Must be a valid 15-character GSTIN. Old transporter access will be revoked immediately.
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
                !canChange ||
                !newTransporterId ||
                newTransporterId.trim().length !== 15
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

      {/* Confirmation Dialog - Same wording as govt portal */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirm Transporter Change
            </DialogTitle>
            <DialogDescription>
              Please confirm that you want to change the transporter for this E-Way Bill.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Government-style Warning Box - Same warning message text as govt portal */}
            <div className="rounded-lg border-2 border-destructive bg-destructive/5 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-bold text-destructive">
                    WARNING: Transporter Change Confirmation
                  </p>
                  <div className="text-sm text-foreground space-y-1">
                    <p className="font-medium">This action will:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Immediately revoke access for the old transporter</li>
                      <li>Assign the E-Way Bill to the new transporter</li>
                      <li>This action cannot be undone</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Details Box */}
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
              <div className="text-sm space-y-2">
                <div className="flex justify-between items-start">
                  <span className="font-medium text-muted-foreground">E-Way Bill Number:</span>
                  <span className="font-semibold">{ewayBillDetails?.ewayBillNumber}</span>
                </div>
                
                {ewayBillDetails?.transporterId && (
                  <>
                    <div className="flex justify-between items-start pt-2 border-t">
                      <span className="font-medium text-muted-foreground">Current Transporter ID:</span>
                      <span className="font-semibold text-destructive">{ewayBillDetails.transporterId}</span>
                    </div>
                    {ewayBillDetails.transporterName && (
                      <div className="flex justify-between items-start">
                        <span className="font-medium text-muted-foreground">Current Transporter Name:</span>
                        <span className="font-semibold">{ewayBillDetails.transporterName}</span>
                      </div>
                    )}
                  </>
                )}
                
                <div className="flex justify-between items-start pt-2 border-t border-primary/20">
                  <span className="font-medium text-muted-foreground">New Transporter ID:</span>
                  <span className="font-semibold text-primary">{newTransporterId.toUpperCase()}</span>
                </div>
              </div>
            </div>

            {/* Government-style Notice - Same wording as govt portal */}
            <div className="rounded-lg border border-amber-500/50 bg-amber-50 dark:bg-amber-950/20 p-3">
              <p className="text-xs text-amber-900 dark:text-amber-200">
                <strong>Note:</strong> As per Government E-Way Bill Portal rules, the old transporter's access will be revoked immediately upon confirmation. 
                Please ensure you have entered the correct new transporter details.
              </p>
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
              onClick={handleConfirmSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader size="sm" className="mr-2" />
                  Changing...
                </>
              ) : (
                "Confirm Change Transporter"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
