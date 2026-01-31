/**
 * Received E-Way Bills Page
 * 
 * Government-compliant E-Way Bill Accept/Reject module
 * UI is 1:1 clone of Government E-Way Bill Portal
 * 
 * Features:
 * - List of EWBs received
 * - Accept / Reject buttons in same placement as govt portal
 * - 72 hours warning text same as govt portal
 * - No UI customization allowed
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader } from "@/components/common/loader";
import { useToast } from "@/components/ui/use-toast";
import { StatusBadge } from "@/components/common/status-badge";
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileText,
  Truck,
  Clock,
} from "lucide-react";
import { ROUTES } from "@/constants";
import { formatDate } from "@/lib/utils";
import { EWayBill } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ReceivedEWayBillsPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [ewayBills, setEwayBills] = useState<EWayBill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedEWB, setSelectedEWB] = useState<EWayBill | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // Load Received E-Way Bills data
  useEffect(() => {
    const loadEWayBills = async () => {
      setIsLoading(true);
      
      // In production, fetch from your local DB where status = "RECEIVED"
      // Mock data for received E-Way Bills
      const mockEWayBills: EWayBill[] = [
        {
          id: "1",
          ewayBillNumber: "EWB-2024-101",
          invoiceId: "INV-2024-101",
          transporterName: "Fast Transport",
          transporterId: "29FTHPK8890K1ZN",
          vehicleNumber: "MH-12-AB-1234",
          fromPlace: "Mumbai",
          toPlace: "Pune",
          validFrom: new Date().toISOString(),
          validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          status: "RECEIVED",
          createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), // 10 hours ago
        },
        {
          id: "2",
          ewayBillNumber: "EWB-2024-102",
          invoiceId: "INV-2024-102",
          transporterName: "Quick Logistics",
          transporterId: "27ABCDE1234F1Z5",
          vehicleNumber: "DL-01-CD-5678",
          fromPlace: "Delhi",
          toPlace: "Gurgaon",
          validFrom: new Date().toISOString(),
          validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          status: "RECEIVED",
          createdAt: new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString(), // 50 hours ago
        },
        {
          id: "3",
          ewayBillNumber: "EWB-2024-103",
          invoiceId: "INV-2024-103",
          transporterName: "Express Logistics",
          vehicleNumber: "",
          fromPlace: "Bangalore",
          toPlace: "Chennai",
          validFrom: new Date().toISOString(),
          validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          status: "RECEIVED",
          createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
        },
        {
          id: "4",
          ewayBillNumber: "EWB-2024-104",
          invoiceId: "INV-2024-104",
          transporterName: "Speed Cargo",
          transporterId: "29FTHPK8890K1ZN",
          vehicleNumber: "KA-03-EF-9012",
          fromPlace: "Bangalore",
          toPlace: "Mysore",
          validFrom: new Date().toISOString(),
          validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          status: "ACCEPTED",
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "5",
          ewayBillNumber: "EWB-2024-105",
          invoiceId: "INV-2024-105",
          transporterName: "Reliable Transport",
          vehicleNumber: "TN-09-GH-3456",
          fromPlace: "Chennai",
          toPlace: "Coimbatore",
          validFrom: new Date().toISOString(),
          validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          status: "REJECTED",
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];
      
      setTimeout(() => {
        setEwayBills(mockEWayBills);
        setIsLoading(false);
      }, 500);
    };

    loadEWayBills();
  }, []);

  // Filter E-Way Bills
  const filteredEWayBills = useMemo(() => {
    let filtered = [...ewayBills];

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((b) => b.status === statusFilter);
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter((b) => {
        const billDate = new Date(b.createdAt);
        const fromDate = new Date(dateFrom);
        return billDate >= fromDate;
      });
    }
    if (dateTo) {
      filtered = filtered.filter((b) => {
        const billDate = new Date(b.createdAt);
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        return billDate <= toDate;
      });
    }

    return filtered;
  }, [ewayBills, statusFilter, dateFrom, dateTo]);

  // Calculate hours remaining for Accept/Reject (72-hour rule)
  const getHoursRemaining = (createdAt: string): number | null => {
    const receivedAt = new Date(createdAt);
    const now = new Date();
    const hoursElapsed = (now.getTime() - receivedAt.getTime()) / (1000 * 60 * 60);
    return Math.max(0, 72 - hoursElapsed);
  };

  // Check if Accept/Reject is allowed (within 72 hours and status is RECEIVED)
  const canAcceptOrReject = (bill: EWayBill): boolean => {
    if (bill.status !== "RECEIVED") return false;
    const hoursRemaining = getHoursRemaining(bill.createdAt);
    return hoursRemaining !== null && hoursRemaining > 0;
  };

  // Handle Accept
  const handleAccept = async (bill: EWayBill) => {
    if (!canAcceptOrReject(bill)) {
      toast({
        title: "Accept Not Allowed",
        description: "E-Way Bill can be accepted only within 72 hours of receipt",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(bill.ewayBillNumber);

    try {
      const response = await fetch(
        `/api/eway-bills/${bill.ewayBillNumber}/accept`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: bill.status,
            createdAt: bill.createdAt,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to accept E-Way Bill");
      }

      toast({
        title: "Success",
        description: "E-Way Bill accepted successfully",
      });

      // Update status in local state
      setEwayBills((prev) =>
        prev.map((b) =>
          b.id === bill.id ? { ...b, status: "ACCEPTED" as const } : b
        )
      );
    } catch (error: any) {
      console.error("Accept E-Way Bill Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to accept E-Way Bill",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(null);
    }
  };

  // Handle Reject
  const handleReject = (bill: EWayBill) => {
    if (!canAcceptOrReject(bill)) {
      toast({
        title: "Reject Not Allowed",
        description: "E-Way Bill can be rejected only within 72 hours of receipt",
        variant: "destructive",
      });
      return;
    }

    setSelectedEWB(bill);
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  // Confirm Reject
  const handleConfirmReject = async () => {
    if (!selectedEWB) return;

    if (!rejectReason || rejectReason.trim().length < 10) {
      toast({
        title: "Reject Reason Required",
        description: "Please provide reject reason (minimum 10 characters)",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(selectedEWB.ewayBillNumber);
    setRejectDialogOpen(false);

    try {
      const response = await fetch(
        `/api/eway-bills/${selectedEWB.ewayBillNumber}/reject`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rejectReason: rejectReason.trim(),
            status: selectedEWB.status,
            createdAt: selectedEWB.createdAt,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to reject E-Way Bill");
      }

      toast({
        title: "Success",
        description: "E-Way Bill rejected successfully",
      });

      // Update status in local state
      setEwayBills((prev) =>
        prev.map((b) =>
          b.id === selectedEWB.id ? { ...b, status: "REJECTED" as const } : b
        )
      );

      setSelectedEWB(null);
      setRejectReason("");
    } catch (error: any) {
      console.error("Reject E-Way Bill Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to reject E-Way Bill",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Received E-Way Bills</h1>
        <p className="text-muted-foreground">
          Accept or Reject received E-Way Bills as per Government rules
        </p>
      </div>

      {/* 72 Hours Warning - Government Portal Style */}
      <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
        <CardHeader>
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <CardTitle className="text-orange-900 dark:text-orange-200">
                Important: 72 Hours Rule
              </CardTitle>
              <CardDescription className="text-orange-700 dark:text-orange-300 mt-1">
                E-Way Bills must be accepted or rejected within 72 hours of receipt
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-2 text-sm text-orange-800 dark:text-orange-200">
            <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              <strong>Government Rule:</strong> You have 72 hours from the time of receipt to accept or reject an E-Way Bill. 
              After 72 hours, the E-Way Bill will be automatically accepted as per Government regulations.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Filters Section - Government Portal Style */}
      <div className="border border-gray-300 bg-white p-4">
        <div className="text-sm font-semibold text-gray-900 mb-4">Filters</div>
        
        <div className="grid grid-cols-4 gap-4 items-end">
          {/* Status Dropdown */}
          <div>
            <Label htmlFor="statusFilter" className="text-sm text-gray-700 mb-1 block">
              Status
            </Label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-9 border border-gray-300 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="RECEIVED">Received</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {/* Date From */}
          <div>
            <Label htmlFor="dateFrom" className="text-sm text-gray-700 mb-1 block">
              Date From
            </Label>
            <Input
              id="dateFrom"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 border-gray-300 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Date To */}
          <div>
            <Label htmlFor="dateTo" className="text-sm text-gray-700 mb-1 block">
              Date To
            </Label>
            <Input
              id="dateTo"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              min={dateFrom || undefined}
              className="h-9 border-gray-300 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Clear Button */}
          <div>
            {(statusFilter !== "all" || dateFrom || dateTo) && (
              <Button
                variant="outline"
                onClick={() => {
                  setStatusFilter("all");
                  setDateFrom("");
                  setDateTo("");
                }}
                className="h-9 px-4 border-gray-300"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* E-Way Bills Table - Government Portal Style */}
      <Card>
        <CardHeader>
          <CardTitle>Received E-Way Bills</CardTitle>
          <CardDescription>
            {filteredEWayBills.length} E-Way Bill(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredEWayBills.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Truck className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No received E-Way Bills found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>E-Way Bill Number</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Vehicle Number</TableHead>
                    <TableHead>Received At</TableHead>
                    <TableHead>Hours Remaining</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEWayBills.map((bill) => {
                    const hoursRemaining = getHoursRemaining(bill.createdAt);
                    const canAction = canAcceptOrReject(bill);
                    const isProcessingThis = isProcessing === bill.ewayBillNumber;

                    return (
                      <TableRow key={bill.id}>
                        <TableCell className="font-medium">
                          {bill.ewayBillNumber}
                        </TableCell>
                        <TableCell>{bill.invoiceId}</TableCell>
                        <TableCell>{bill.fromPlace}</TableCell>
                        <TableCell>{bill.toPlace}</TableCell>
                        <TableCell>
                          {bill.vehicleNumber || (
                            <span className="text-muted-foreground text-sm">Not set</span>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(bill.createdAt)}</TableCell>
                        <TableCell>
                          {bill.status === "RECEIVED" && hoursRemaining !== null ? (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-amber-600" />
                              <span className={hoursRemaining < 24 ? "text-red-600 font-semibold" : "text-gray-700"}>
                                {hoursRemaining.toFixed(1)} hrs
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusBadge 
                            status={
                              bill.status === "RECEIVED" ? "ACTIVE" :
                              bill.status === "ACCEPTED" ? "ACTIVE" :
                              bill.status === "REJECTED" ? "CANCELLED" :
                              bill.status
                            } 
                          />
                        </TableCell>
                        <TableCell>
                          {bill.status === "RECEIVED" ? (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAccept(bill)}
                                disabled={!canAction || isProcessingThis}
                                className="bg-green-50 hover:bg-green-100 border-green-300 text-green-700"
                                title={
                                  !canAction
                                    ? "E-Way Bill can be accepted only within 72 hours of receipt"
                                    : "Accept E-Way Bill"
                                }
                              >
                                {isProcessingThis ? (
                                  <>
                                    <Loader size="sm" className="mr-1" />
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="h-4 w-4 mr-1" />
                                    Accept
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReject(bill)}
                                disabled={!canAction || isProcessingThis}
                                className="bg-red-50 hover:bg-red-100 border-red-300 text-red-700"
                                title={
                                  !canAction
                                    ? "E-Way Bill can be rejected only within 72 hours of receipt"
                                    : "Reject E-Way Bill"
                                }
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              {bill.status === "ACCEPTED" ? "Accepted" : "Rejected"}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Dialog - Government Portal Style */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Reject E-Way Bill
            </DialogTitle>
            <DialogDescription>
              Please provide reason for rejecting E-Way Bill: {selectedEWB?.ewayBillNumber}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 p-4">
              <p className="text-sm font-bold text-red-900 dark:text-red-200 mb-2">
                Warning: Rejection Action
              </p>
              <p className="text-xs text-red-800 dark:text-red-300">
                Once rejected, this E-Way Bill cannot be accepted. Please ensure you have valid reason for rejection.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rejectReason">
                Reject Reason <span className="text-red-500">*</span>
              </Label>
              <textarea
                id="rejectReason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter detailed reason for rejecting E-Way Bill (minimum 10 characters required)"
                rows={4}
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              <p className="text-xs text-muted-foreground">
                Provide detailed reason for rejection (minimum 10 characters required)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectReason("");
                setSelectedEWB(null);
              }}
              disabled={isProcessing !== null}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmReject}
              disabled={!rejectReason || rejectReason.trim().length < 10 || isProcessing !== null}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing !== null ? (
                <>
                  <Loader size="sm" className="mr-2" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Confirm Reject
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
