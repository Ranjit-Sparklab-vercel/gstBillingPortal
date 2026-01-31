"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/common/status-badge";
import { EmptyState } from "@/components/common/empty-state";
import { Loader } from "@/components/common/loader";
import { Plus, FileText, Eye } from "lucide-react";
import { Invoice } from "@/types";
import { ROUTES } from "@/constants";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useSubscriptionStore } from "@/store/subscriptionStore";
import { SubscriptionPlan } from "@/types";
import gstInvoiceService from "@/services/gst/gstInvoice.service";

export default function GSTBillingPage() {
  const router = useRouter();
  const { hasAccess } = useSubscriptionStore();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock data for frontend demo - no API calls
    const mockInvoices: Invoice[] = [
      {
        id: "1",
        invoiceNumber: "INV-2024-001",
        customerId: "1",
        customerName: "ABC Enterprises",
        date: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        items: [],
        subtotal: 10000,
        taxAmount: 1800,
        total: 11800,
        status: "SENT",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "2",
        invoiceNumber: "INV-2024-002",
        customerId: "2",
        customerName: "XYZ Corporation",
        date: new Date().toISOString(),
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        items: [],
        subtotal: 25000,
        taxAmount: 4500,
        total: 29500,
        status: "PAID",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    
    setTimeout(() => {
      setInvoices(mockInvoices);
      setIsLoading(false);
    }, 500);
  }, []);

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
          <h1 className="text-3xl font-bold tracking-tight">GST Billing</h1>
          <p className="text-muted-foreground">
            Create and manage your GST invoices
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(ROUTES.GST.CUSTOMERS)}
          >
            Customers
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(ROUTES.GST.PRODUCTS)}
          >
            Products
          </Button>
          <Button onClick={() => router.push(ROUTES.GST.CREATE_INVOICE)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>All your GST invoices in one place</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No invoices yet"
              description="Get started by creating your first GST invoice"
              actionLabel="Create Invoice"
              onAction={() => router.push(ROUTES.GST.CREATE_INVOICE)}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell>{invoice.customerName}</TableCell>
                    <TableCell>{formatDate(invoice.date)}</TableCell>
                    <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                    <TableCell>{formatCurrency(invoice.total)}</TableCell>
                    <TableCell>
                      <StatusBadge status={invoice.status} />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`${ROUTES.GST.INVOICES}/${invoice.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
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
