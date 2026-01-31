/**
 * Consolidated E-Way Bill Page
 * 
 * Government-compliant Consolidated E-Way Bill generation
 * UI is 1:1 clone of Government E-Way Bill Portal
 * 
 * Features:
 * - Multi-select EWB list table exactly like govt portal
 * - Same columns and checkboxes
 * - Same "Generate Consolidated EWB" button
 * - Result page showing Consolidated EWB number and list of EWBs included
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
  CheckCircle2,
  FileText,
  Truck,
  CheckSquare,
  Square,
} from "lucide-react";
import { ROUTES } from "@/constants";
import { formatDate } from "@/lib/utils";
import { EWayBill } from "@/types";

export default function ConsolidatedEWayBillPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [ewayBills, setEwayBills] = useState<EWayBill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEWBs, setSelectedEWBs] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [consolidatedResult, setConsolidatedResult] = useState<{
    consolidatedEWBNo: string;
    includedEWBs: string[];
  } | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // Load E-Way Bills data
  useEffect(() => {
    const loadEWayBills = async () => {
      setIsLoading(true);
      
      // In production, fetch from your local DB
      // Only Active E-Way Bills can be consolidated
      const mockEWayBills: EWayBill[] = [
        {
          id: "1",
          ewayBillNumber: "EWB-2024-001",
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
        },
        {
          id: "2",
          ewayBillNumber: "EWB-2024-002",
          invoiceId: "INV-2024-002",
          transporterName: "Quick Logistics",
          transporterId: "27ABCDE1234F1Z5",
          vehicleNumber: "DL-01-CD-5678",
          fromPlace: "Delhi",
          toPlace: "Gurgaon",
          validFrom: new Date().toISOString(),
          validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          status: "ACTIVE",
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "3",
          ewayBillNumber: "EWB-2024-003",
          invoiceId: "INV-2024-003",
          transporterName: "Express Logistics",
          vehicleNumber: "",
          fromPlace: "Bangalore",
          toPlace: "Chennai",
          validFrom: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          validUntil: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
          status: "EXPIRED",
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "4",
          ewayBillNumber: "EWB-2024-004",
          invoiceId: "INV-2024-004",
          transporterName: "Speed Cargo",
          transporterId: "29FTHPK8890K1ZN",
          vehicleNumber: "KA-03-EF-9012",
          fromPlace: "Bangalore",
          toPlace: "Mysore",
          validFrom: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          validUntil: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: "CANCELLED",
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "5",
          ewayBillNumber: "EWB-2024-005",
          invoiceId: "INV-2024-005",
          transporterName: "Reliable Transport",
          vehicleNumber: "TN-09-GH-3456",
          fromPlace: "Chennai",
          toPlace: "Coimbatore",
          validFrom: new Date().toISOString(),
          validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          status: "ACTIVE",
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "6",
          ewayBillNumber: "EWB-2024-006",
          invoiceId: "INV-2024-006",
          transporterName: "Express Cargo",
          vehicleNumber: "GJ-01-JK-7890",
          fromPlace: "Ahmedabad",
          toPlace: "Surat",
          validFrom: new Date().toISOString(),
          validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          status: "ACTIVE",
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

  // Filter E-Way Bills (only show Active for consolidation)
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

  // Get only Active E-Way Bills (only these can be consolidated)
  const activeEWayBills = useMemo(() => {
    return filteredEWayBills.filter((b) => b.status === "ACTIVE");
  }, [filteredEWayBills]);

  // Toggle selection
  const toggleSelection = (ewayBillNo: string) => {
    const newSelected = new Set(selectedEWBs);
    if (newSelected.has(ewayBillNo)) {
      newSelected.delete(ewayBillNo);
    } else {
      newSelected.add(ewayBillNo);
    }
    setSelectedEWBs(newSelected);
  };

  // Select all active
  const selectAll = () => {
    if (selectedEWBs.size === activeEWayBills.length) {
      setSelectedEWBs(new Set());
    } else {
      setSelectedEWBs(new Set(activeEWayBills.map((b) => b.ewayBillNumber)));
    }
  };

  // Handle generate consolidated EWB
  const handleGenerate = async () => {
    if (selectedEWBs.size === 0) {
      toast({
        title: "No E-Way Bills Selected",
        description: "Please select at least one Active E-Way Bill to consolidate",
        variant: "destructive",
      });
      return;
    }

    if (selectedEWBs.size < 2) {
      toast({
        title: "Minimum 2 E-Way Bills Required",
        description: "At least 2 Active E-Way Bills are required to generate Consolidated E-Way Bill",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const ewayBillNumbers = Array.from(selectedEWBs);

      // Call API route (which calls WhiteBooks API)
      const response = await fetch("/api/eway-bills/consolidated/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ewayBillNumbers }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to generate Consolidated E-Way Bill");
      }

      // Show result
      setConsolidatedResult({
        consolidatedEWBNo: result.data.consolidatedEWBNo,
        includedEWBs: ewayBillNumbers,
      });

      toast({
        title: "Success",
        description: "Consolidated E-Way Bill generated successfully",
      });
    } catch (error: any) {
      console.error("Generate Consolidated E-Way Bill Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate Consolidated E-Way Bill",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader size="lg" />
      </div>
    );
  }

  // Show result page if consolidated EWB is generated
  if (consolidatedResult) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Consolidated E-Way Bill Generated</h1>
          <p className="text-muted-foreground">
            Consolidated E-Way Bill has been generated successfully
          </p>
        </div>

        {/* Success Message - Government Portal Style */}
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <div>
                <CardTitle className="text-green-900 dark:text-green-200">
                  Consolidated E-Way Bill Generated Successfully
                </CardTitle>
                <CardDescription className="text-green-700 dark:text-green-300 mt-1">
                  Your Consolidated E-Way Bill has been generated as per Government rules
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Consolidated EWB Number */}
              <div className="border border-green-300 bg-white p-4 rounded">
                <div className="text-sm text-gray-600 mb-1">Consolidated E-Way Bill Number</div>
                <div className="text-2xl font-bold text-green-700">{consolidatedResult.consolidatedEWBNo}</div>
              </div>

              {/* List of EWBs Included */}
              <div className="border border-gray-300 bg-white p-4 rounded">
                <div className="text-sm font-semibold text-gray-900 mb-3">
                  E-Way Bills Included ({consolidatedResult.includedEWBs.length})
                </div>
                <div className="space-y-2">
                  {consolidatedResult.includedEWBs.map((ewbNo, index) => (
                    <div
                      key={ewbNo}
                      className="flex items-center justify-between p-2 border border-gray-200 rounded bg-gray-50"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-600">{index + 1}.</span>
                        <span className="text-sm font-semibold text-gray-900">{ewbNo}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setConsolidatedResult(null);
              setSelectedEWBs(new Set());
            }}
          >
            Generate Another
          </Button>
          <Button onClick={() => router.push(ROUTES.EWAY.BILLS)}>
            View All E-Way Bills
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Consolidated E-Way Bill</h1>
        <p className="text-muted-foreground">
          Select multiple Active E-Way Bills to generate Consolidated E-Way Bill
        </p>
      </div>

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
              <option value="ACTIVE">Active</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="EXPIRED">Expired</option>
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

      {/* Selection Info */}
      <div className="border border-gray-300 bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            <span className="font-semibold">Selected:</span> {selectedEWBs.size} E-Way Bill(s)
            {selectedEWBs.size > 0 && (
              <span className="ml-2 text-gray-500">
                (Minimum 2 required for consolidation)
              </span>
            )}
          </div>
          {activeEWayBills.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={selectAll}
              className="border-gray-300"
            >
              {selectedEWBs.size === activeEWayBills.length ? (
                <>
                  <Square className="h-4 w-4 mr-2" />
                  Deselect All
                </>
              ) : (
                <>
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Select All Active
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* E-Way Bills Table - Government Portal Style with Checkboxes */}
      <Card>
        <CardHeader>
          <CardTitle>E-Way Bills</CardTitle>
          <CardDescription>
            Select Active E-Way Bills to consolidate (Only Active E-Way Bills can be selected)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeEWayBills.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Truck className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No Active E-Way Bills found</p>
              <p className="text-sm mt-1">Only Active E-Way Bills can be consolidated</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedEWBs.size === activeEWayBills.length && activeEWayBills.length > 0}
                        onChange={selectAll}
                        className="h-4 w-4 cursor-pointer"
                      />
                    </TableHead>
                    <TableHead>E-Way Bill Number</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Vehicle Number</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeEWayBills.map((bill) => {
                    const isSelected = selectedEWBs.has(bill.ewayBillNumber);
                    return (
                      <TableRow
                        key={bill.id}
                        className={isSelected ? "bg-blue-50" : ""}
                      >
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelection(bill.ewayBillNumber)}
                            className="h-4 w-4 cursor-pointer"
                          />
                        </TableCell>
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
                        <TableCell>{formatDate(bill.validUntil)}</TableCell>
                        <TableCell>
                          <StatusBadge status={bill.status} />
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

      {/* Generate Button - Government Portal Style */}
      <div className="flex justify-end">
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || selectedEWBs.size < 2}
          className="bg-blue-600 hover:bg-blue-700 px-6"
          title={
            selectedEWBs.size < 2
              ? "Please select at least 2 Active E-Way Bills to consolidate"
              : ""
          }
        >
          {isGenerating ? (
            <>
              <Loader size="sm" className="mr-2" />
              Generating...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Generate Consolidated EWB
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
