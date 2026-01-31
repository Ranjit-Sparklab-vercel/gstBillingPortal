"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/common/status-badge";
import { EmptyState } from "@/components/common/empty-state";
import { Loader } from "@/components/common/loader";
import { Receipt, Search, AlertCircle, RefreshCw } from "lucide-react";
import { EInvoice } from "@/types";
import { formatDate } from "@/lib/utils";
import { einvoiceService } from "@/services/gst/einvoice.service";
import { useToast } from "@/components/ui/use-toast";

export default function RejectedIRNsPage() {
  const { toast } = useToast();
  const [rejectedIRNs, setRejectedIRNs] = useState<EInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadRejectedIRNs();
  }, []);

  const loadRejectedIRNs = async () => {
    setIsLoading(true);
    try {
      // Mock data for frontend demo
      const mockRejected: EInvoice[] = [
        {
          id: "1",
          invoiceId: "INV-2024-101",
          invoiceNumber: "INV-2024-101",
          invoiceDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          irn: "rejected1a2b3c4d5e6f7g8h9i0j1k2l3m4n5",
          ackNo: "",
          ackDate: new Date().toISOString(),
          qrCode: "",
          status: "FAILED",
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "2",
          invoiceId: "INV-2024-102",
          invoiceNumber: "INV-2024-102",
          invoiceDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          irn: "rejected2b3c4d5e6f7g8h9i0j1k2l3m4n5o6",
          ackNo: "",
          ackDate: new Date().toISOString(),
          qrCode: "",
          status: "FAILED",
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];
      setRejectedIRNs(mockRejected);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load rejected IRNs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRejected = rejectedIRNs.filter(
    (einvoice) =>
      einvoice.irn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      einvoice.invoiceId.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <h1 className="text-3xl font-bold tracking-tight">Rejected IRNs</h1>
          <p className="text-muted-foreground">
            View all rejected Invoice Reference Numbers
          </p>
        </div>
        <Button variant="outline" onClick={loadRejectedIRNs}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by IRN or Invoice ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Rejected IRNs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Rejected IRNs</CardTitle>
          <CardDescription>
            {rejectedIRNs.length} rejected IRN{rejectedIRNs.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredRejected.length === 0 ? (
            <EmptyState
              icon={AlertCircle}
              title="No Rejected IRNs"
              description={
                rejectedIRNs.length === 0
                  ? "No rejected IRNs found. All your IRNs have been generated successfully!"
                  : "No rejected IRNs match your search"
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>IRN</TableHead>
                  <TableHead>Rejected Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRejected.map((einvoice) => (
                  <TableRow key={einvoice.id}>
                    <TableCell className="font-medium">{einvoice.invoiceId}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {einvoice.irn.substring(0, 30)}...
                    </TableCell>
                    <TableCell>{formatDate(einvoice.ackDate)}</TableCell>
                    <TableCell>
                      <StatusBadge status={einvoice.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <span className="text-sm">Validation failed</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
