/**
 * E-Way Bills List Page
 * 
 * Government-compliant E-Way Bill list
 * UI is 1:1 clone of Government E-Way Bill Portal
 * 
 * Requirements:
 * - Table columns EXACTLY same as govt portal: EWB No, Invoice No, Date, Validity, Status
 * - Search panel same as govt portal: EWB No, Date Range, Status dropdown
 * - Same pagination style
 * - No custom table designs
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
import { StatusBadge } from "@/components/common/status-badge";
import { EmptyState } from "@/components/common/empty-state";
import { Truck, Printer } from "lucide-react";
import { EWayBill } from "@/types";
import { ROUTES } from "@/constants";
import { formatDate } from "@/lib/utils";

const ITEMS_PER_PAGE = 10;

export default function EWayBillsPage() {
  const router = useRouter();
  const [ewayBills, setEwayBills] = useState<EWayBill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Search filters - Government Portal Style
  const [ewayBillNo, setEwayBillNo] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Load E-Way Bills data
  useEffect(() => {
    const loadEWayBills = async () => {
      setIsLoading(true);
      
      // In production, fetch from your local DB
      // Mock data for E-Way Bills
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
        {
          id: "7",
          ewayBillNumber: "EWB-2024-007",
          invoiceId: "INV-2024-007",
          transporterName: "Fast Logistics",
          vehicleNumber: "UP-14-LM-4567",
          fromPlace: "Lucknow",
          toPlace: "Kanpur",
          validFrom: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          validUntil: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          status: "EXPIRED",
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "8",
          ewayBillNumber: "EWB-2024-008",
          invoiceId: "INV-2024-008",
          transporterName: "Quick Transport",
          vehicleNumber: "RJ-14-NO-8901",
          fromPlace: "Jaipur",
          toPlace: "Udaipur",
          validFrom: new Date().toISOString(),
          validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          status: "ACTIVE",
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "9",
          ewayBillNumber: "EWB-2024-009",
          invoiceId: "INV-2024-009",
          transporterName: "Reliable Cargo",
          vehicleNumber: "MP-09-PQ-2345",
          fromPlace: "Bhopal",
          toPlace: "Indore",
          validFrom: new Date().toISOString(),
          validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          status: "ACTIVE",
          createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "10",
          ewayBillNumber: "EWB-2024-010",
          invoiceId: "INV-2024-010",
          transporterName: "Speed Logistics",
          vehicleNumber: "WB-19-RS-6789",
          fromPlace: "Kolkata",
          toPlace: "Durgapur",
          validFrom: new Date().toISOString(),
          validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          status: "ACTIVE",
          createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "11",
          ewayBillNumber: "EWB-2024-011",
          invoiceId: "INV-2024-011",
          transporterName: "Express Transport",
          vehicleNumber: "AP-28-TU-0123",
          fromPlace: "Hyderabad",
          toPlace: "Vijayawada",
          validFrom: new Date().toISOString(),
          validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          status: "ACTIVE",
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "12",
          ewayBillNumber: "EWB-2024-012",
          invoiceId: "INV-2024-012",
          transporterName: "Fast Cargo",
          vehicleNumber: "KL-32-VW-3456",
          fromPlace: "Kochi",
          toPlace: "Trivandrum",
          validFrom: new Date().toISOString(),
          validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          status: "ACTIVE",
          createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];
      
      setTimeout(() => {
        setEwayBills(mockEWayBills);
        setIsLoading(false);
      }, 500);
    };

    loadEWayBills();
  }, []);

  // Filter E-Way Bills - Government Portal Style
  const filteredEWayBills = useMemo(() => {
    let filtered = [...ewayBills];

    // EWB No filter
    if (ewayBillNo && ewayBillNo.trim().length > 0) {
      filtered = filtered.filter((b) =>
        b.ewayBillNumber.toLowerCase().includes(ewayBillNo.toLowerCase().trim())
      );
    }

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
  }, [ewayBills, ewayBillNo, statusFilter, dateFrom, dateTo]);

  // Pagination
  const totalPages = Math.ceil(filteredEWayBills.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedEWayBills = filteredEWayBills.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [ewayBillNo, statusFilter, dateFrom, dateTo]);

  const clearFilters = () => {
    setEwayBillNo("");
    setDateFrom("");
    setDateTo("");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  const hasActiveFilters = ewayBillNo || dateFrom || dateTo || statusFilter !== "all";

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
        <h1 className="text-3xl font-bold tracking-tight">E-Way Bills</h1>
        <p className="text-muted-foreground">
          View and manage all your E-Way Bills
        </p>
      </div>

      {/* Search Panel - Government Portal Style */}
      <div className="border border-gray-300 bg-white p-4">
        <div className="text-sm font-semibold text-gray-900 mb-4">Search</div>
        
        <div className="grid grid-cols-4 gap-4 items-end">
          {/* EWB No */}
          <div>
            <Label htmlFor="ewayBillNo" className="text-sm text-gray-700 mb-1 block">
              EWB No
            </Label>
            <Input
              id="ewayBillNo"
              value={ewayBillNo}
              onChange={(e) => setEwayBillNo(e.target.value)}
              placeholder="Enter E-Way Bill Number"
              className="h-9 border-gray-300 focus:ring-1 focus:ring-blue-500"
            />
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
        </div>

        {/* Search Button and Clear - Government Portal Style */}
        <div className="flex justify-end gap-2 mt-4">
          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={clearFilters}
              className="h-9 px-4 border-gray-300"
            >
              Clear
            </Button>
          )}
          <Button
            onClick={() => setCurrentPage(1)}
            className="h-9 px-4 bg-blue-600 hover:bg-blue-700"
          >
            Search
          </Button>
        </div>
      </div>

      {/* E-Way Bills Table - Government Portal Style */}
      <Card>
        <CardHeader>
          <CardTitle>E-Way Bills</CardTitle>
          <CardDescription>
            {filteredEWayBills.length} E-Way Bill(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredEWayBills.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="No E-Way bills found"
              description={
                hasActiveFilters
                  ? "Try adjusting your search or filters"
                  : "Get started by generating your first E-Way bill"
              }
              actionLabel={hasActiveFilters ? "Clear Filters" : "Generate E-Way Bill"}
              onAction={hasActiveFilters ? clearFilters : () => router.push(ROUTES.EWAY.CREATE)}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>EWB No</TableHead>
                      <TableHead>Invoice No</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Validity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedEWayBills.map((bill) => (
                      <TableRow key={bill.id}>
                        <TableCell className="font-medium">
                          {bill.ewayBillNumber}
                        </TableCell>
                        <TableCell>{bill.invoiceId}</TableCell>
                        <TableCell>{formatDate(bill.createdAt)}</TableCell>
                        <TableCell>{formatDate(bill.validUntil)}</TableCell>
                        <TableCell>
                          <StatusBadge status={bill.status} />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`${ROUTES.EWAY.PRINT}?ewayBillNo=${bill.ewayBillNumber}`)}
                            title="Print E-Way Bill"
                          >
                            <Printer className="h-4 w-4 mr-1" />
                            Print
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination - Government Portal Style */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages} ({filteredEWayBills.length} total)
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="border-gray-300"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="border-gray-300"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
