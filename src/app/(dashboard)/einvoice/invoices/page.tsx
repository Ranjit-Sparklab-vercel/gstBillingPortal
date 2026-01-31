"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/common/status-badge";
import { EmptyState } from "@/components/common/empty-state";
import { Loader } from "@/components/common/loader";
import { useToast } from "@/components/ui/use-toast";
import {
  Plus,
  Receipt,
  QrCode,
  Search,
  Eye,
  X,
  Download,
  Filter,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  Calendar,
  ArrowUpDown,
} from "lucide-react";
import { EInvoice } from "@/types";
import { ROUTES } from "@/constants";
import { formatDate } from "@/lib/utils";
import { format } from "date-fns";
import { einvoiceStorage } from "@/lib/einvoice-storage";
import { einvoiceService } from "@/services/gst/einvoice.service";
import { gstAuthService } from "@/services/gst/auth.service";
import { GST_API_CONFIG } from "@/config/gstApi.config";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type SortField = "invoiceNumber" | "invoiceDate" | "buyerGstin" | "invoiceValue" | "irn" | "status";
type SortDirection = "asc" | "desc";

const ITEMS_PER_PAGE = 10;

export default function EInvoicesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [einvoices, setEinvoices] = useState<EInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  
  // Sorting
  const [sortField, setSortField] = useState<SortField>("invoiceDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  
  // Dialog
  const [selectedEInvoice, setSelectedEInvoice] = useState<EInvoice | null>(null);
  const [isQRDialogOpen, setIsQRDialogOpen] = useState(false);

  useEffect(() => {
    authenticate();
    loadEInvoices();
  }, []);

  useEffect(() => {
    loadEInvoices();
  }, [statusFilter, invoiceTypeFilter, dateFrom, dateTo]);

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
    }
  };

  const loadEInvoices = () => {
    setIsLoading(true);
    try {
      // Sync from sessionStorage first (in case new IRN was generated)
      einvoiceStorage.syncFromSessionStorage();
      
      // Load from localStorage
      const stored = einvoiceStorage.getAllEInvoices();
      
      // Convert to EInvoice format
      const converted: EInvoice[] = stored.map((item) => ({
        id: item.id,
        invoiceId: item.invoiceNumber,
        invoiceNumber: item.invoiceNumber,
        invoiceDate: item.invoiceDate,
        invoiceType: item.invoiceType,
        buyerGstin: item.buyerGstin,
        invoiceValue: item.invoiceValue,
        irn: item.irn,
        ackNo: item.ackNo,
        ackDate: item.ackDate,
        qrCode: item.qrCode,
        status: item.status,
        createdAt: item.createdAt,
      }));
      
      setEinvoices(converted);
    } catch (error) {
      console.error("Error loading E-Invoices:", error);
      toast({
        title: "Error",
        description: "Failed to load E-Invoices.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  // Filter and sort E-Invoices
  const filteredAndSortedEInvoices = useMemo(() => {
    let filtered = [...einvoices];

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((e) => e.status === statusFilter);
    }

    // Invoice type filter
    if (invoiceTypeFilter !== "all") {
      filtered = filtered.filter((e) => e.invoiceType === invoiceTypeFilter);
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter((e) => e.invoiceDate >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter((e) => e.invoiceDate <= dateTo);
    }

    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.invoiceNumber?.toLowerCase().includes(query) ||
          e.invoiceId?.toLowerCase().includes(query) ||
          e.irn.toLowerCase().includes(query) ||
          e.ackNo.toLowerCase().includes(query) ||
          e.buyerGstin?.toLowerCase().includes(query)
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case "invoiceNumber":
          aValue = a.invoiceNumber || "";
          bValue = b.invoiceNumber || "";
          break;
        case "invoiceDate":
          aValue = new Date(a.invoiceDate || 0).getTime();
          bValue = new Date(b.invoiceDate || 0).getTime();
          break;
        case "buyerGstin":
          aValue = a.buyerGstin || "";
          bValue = b.buyerGstin || "";
          break;
        case "invoiceValue":
          aValue = a.invoiceValue || 0;
          bValue = b.invoiceValue || 0;
          break;
        case "irn":
          aValue = a.irn;
          bValue = b.irn;
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [einvoices, statusFilter, invoiceTypeFilter, dateFrom, dateTo, searchQuery, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedEInvoices.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedEInvoices = filteredAndSortedEInvoices.slice(startIndex, endIndex);

  const handleSyncWithGovt = async () => {
    if (!authToken) {
      toast({
        title: "Authentication Required",
        description: "Please wait for authentication to complete.",
        variant: "destructive",
      });
      return;
    }

    setIsSyncing(true);
    let syncedCount = 0;
    let failedCount = 0;

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

      // Sync each E-Invoice
      for (const einvoice of einvoices.slice(0, 10)) { // Limit to 10 for performance
        try {
          const response = await einvoiceService.getEInvoiceByIRN(einvoice.irn, config);
          if (response.status_cd === "1" || response.status_cd === "Sucess") {
            // Update local storage with synced data
            const data = response.data || response;
            const status = data.Status || data.status || "GENERATED";
            einvoiceStorage.updateEInvoiceStatus(
              einvoice.irn,
              status === "1" || status === "Active" ? "GENERATED" : status === "Cancelled" ? "CANCELLED" : "FAILED"
            );
            syncedCount++;
          }
        } catch (error) {
          failedCount++;
          console.error(`Error syncing IRN ${einvoice.irn}:`, error);
        }
      }

      // Reload after sync
      loadEInvoices();

      toast({
        title: "Sync Complete",
        description: `Synced ${syncedCount} E-Invoices. ${failedCount > 0 ? `${failedCount} failed.` : ""}`,
      });
    } catch (error: any) {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync with Government portal.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const formatDateForDisplay = (dateStr: string) => {
    try {
      if (!dateStr) return "N/A";
      // Handle dd/MM/yyyy format
      if (dateStr.includes("/")) {
        return dateStr;
      }
      const date = new Date(dateStr);
      return format(date, "dd/MM/yyyy");
    } catch {
      return dateStr || "N/A";
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="h-4 w-4 ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 ml-1" />
    );
  };

  const handleViewQR = (einvoice: EInvoice) => {
    setSelectedEInvoice(einvoice);
    setIsQRDialogOpen(true);
  };

  const handleViewDetails = (einvoice: EInvoice) => {
    router.push(`${ROUTES.EINVOICE.GET}?irn=${einvoice.irn}`);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">E-Invoices</h1>
          <p className="text-muted-foreground">View and manage all your E-Invoices</p>
        </div>
        <Button onClick={() => router.push(ROUTES.EINVOICE.GENERATE)}>
          <Plus className="mr-2 h-4 w-4" />
          Generate IRN
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <CardTitle>Filters</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncWithGovt}
              disabled={isSyncing || !authToken}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
              Sync with Govt
            </Button>
          </div>
          <CardDescription>Filter E-Invoices by status, type, and date range</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by Invoice No, IRN, Ack No, Buyer GSTIN..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Status</Label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="GENERATED">Active (Generated)</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Invoice Type</Label>
                <select
                  value={invoiceTypeFilter}
                  onChange={(e) => {
                    setInvoiceTypeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="INV">Invoice</option>
                  <option value="CRN">Credit Note</option>
                  <option value="DBN">Debit Note</option>
                </select>
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Date From</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Date To</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>
            {(dateFrom || dateTo || statusFilter !== "all" || invoiceTypeFilter !== "all" || searchQuery) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                  setStatusFilter("all");
                  setInvoiceTypeFilter("all");
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* E-Invoices Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>E-Invoice List</CardTitle>
              <CardDescription>
                {filteredAndSortedEInvoices.length > 0
                  ? `Showing ${startIndex + 1}-${Math.min(endIndex, filteredAndSortedEInvoices.length)} of ${filteredAndSortedEInvoices.length} E-Invoices`
                  : "All your E-Invoices with IRN"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader size="lg" />
            </div>
          ) : paginatedEInvoices.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No E-Invoices found"
              description="Try adjusting your search or filters"
              actionLabel="Generate IRN"
              onAction={() => router.push(ROUTES.EINVOICE.GENERATE)}
            />
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <button
                          onClick={() => handleSort("invoiceNumber")}
                          className="flex items-center hover:text-foreground"
                        >
                          Invoice No
                          <SortIcon field="invoiceNumber" />
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort("invoiceDate")}
                          className="flex items-center hover:text-foreground"
                        >
                          Invoice Date
                          <SortIcon field="invoiceDate" />
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort("buyerGstin")}
                          className="flex items-center hover:text-foreground"
                        >
                          Buyer GSTIN
                          <SortIcon field="buyerGstin" />
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort("invoiceValue")}
                          className="flex items-center hover:text-foreground"
                        >
                          Invoice Value
                          <SortIcon field="invoiceValue" />
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort("irn")}
                          className="flex items-center hover:text-foreground"
                        >
                          IRN
                          <SortIcon field="irn" />
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort("status")}
                          className="flex items-center hover:text-foreground"
                        >
                          Status
                          <SortIcon field="status" />
                        </button>
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedEInvoices.map((einvoice) => (
                      <TableRow
                        key={einvoice.id}
                        className="cursor-pointer hover:bg-accent/50"
                        onClick={() => handleViewDetails(einvoice)}
                      >
                        <TableCell className="font-medium">
                          {einvoice.invoiceNumber || einvoice.invoiceId}
                        </TableCell>
                        <TableCell>{formatDateForDisplay(einvoice.invoiceDate)}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {einvoice.buyerGstin || "N/A"}
                        </TableCell>
                        <TableCell>
                          ₹{einvoice.invoiceValue ? einvoice.invoiceValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {einvoice.irn.substring(0, 20)}...
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={einvoice.status} />
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            {einvoice.status === "GENERATED" && einvoice.qrCode && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewQR(einvoice)}
                                title="View QR Code"
                              >
                                <QrCode className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(einvoice)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages} ({filteredAndSortedEInvoices.length} total)
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
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

      {/* QR Code Dialog */}
      <Dialog open={isQRDialogOpen} onOpenChange={setIsQRDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Signed QR Code</DialogTitle>
            <DialogDescription>
              Scan this QR code to verify the E-Invoice
            </DialogDescription>
          </DialogHeader>
          {selectedEInvoice && (
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-white rounded-lg border">
                <Image
                  src={selectedEInvoice.qrCode}
                  alt="QR Code"
                  width={256}
                  height={256}
                  className="w-64 h-64"
                  unoptimized
                />
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm font-medium">IRN: {selectedEInvoice.irn}</p>
                <p className="text-xs text-muted-foreground">Invoice: {selectedEInvoice.invoiceId}</p>
                <p className="text-xs text-muted-foreground italic pt-2">
                  QR Code digitally signed by Govt IRP
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = selectedEInvoice.qrCode;
                  link.download = `QR-${selectedEInvoice.invoiceId}.png`;
                  link.click();
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Download QR Code
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
