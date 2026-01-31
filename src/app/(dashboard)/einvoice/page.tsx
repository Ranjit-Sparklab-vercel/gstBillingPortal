"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/common/status-badge";
import { Plus, Receipt, CheckCircle2, XCircle, AlertCircle, Search, FileSearch, Clock, Info, Download } from "lucide-react";
import { ROUTES } from "@/constants";
import { einvoiceService } from "@/services/gst/einvoice.service";

export default function EInvoicePage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    total: 0,
    generated: 0,
    cancelled: 0,
    failed: 0,
  });

  useEffect(() => {
    // Mock stats for demo
    setStats({
      total: 45,
      generated: 38,
      cancelled: 5,
      failed: 2,
    });
  }, []);

  const statCards = [
    {
      title: "Total E-Invoices",
      value: stats.total,
      icon: Receipt,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Generated",
      value: stats.generated,
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Cancelled",
      value: stats.cancelled,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Failed",
      value: stats.failed,
      icon: AlertCircle,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  const quickActions = [
    {
      title: "Generate IRN",
      description: "Generate Invoice Reference Number for your invoice",
      icon: Plus,
      action: () => router.push(ROUTES.EINVOICE.GENERATE),
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "View All E-Invoices",
      description: "Browse all generated E-Invoices",
      icon: Receipt,
      action: () => router.push(ROUTES.EINVOICE.INVOICES),
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "GSTN Lookup",
      description: "Get GSTN details for a GST number",
      icon: Search,
      action: () => router.push(`${ROUTES.EINVOICE.ROOT}/gstn-lookup`),
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Get IRN by Doc Details",
      description: "Get IRN details using document number and date",
      icon: FileSearch,
      action: () => router.push(ROUTES.EINVOICE.GET_BY_DOC),
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      title: "Rejected IRNs",
      description: "View all rejected Invoice Reference Numbers",
      icon: FileSearch,
      action: () => router.push(`${ROUTES.EINVOICE.ROOT}/rejected`),
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">E-Invoice</h1>
          <p className="text-muted-foreground">
            Generate IRN and E-Invoices compliant with government standards
          </p>
        </div>
        <Button onClick={() => router.push(ROUTES.EINVOICE.GENERATE)}>
          <Plus className="mr-2 h-4 w-4" />
          Generate IRN
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`${stat.bgColor} p-2 rounded-lg`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Card
                key={index}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={action.action}
              >
                <CardHeader>
                  <div className={`${action.bgColor} w-12 h-12 rounded-lg flex items-center justify-center mb-2`}>
                    <Icon className={`h-6 w-6 ${action.color}`} />
                  </div>
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent E-Invoices */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent E-Invoices</CardTitle>
              <CardDescription>Your recently generated E-Invoices</CardDescription>
            </div>
            <Button variant="outline" onClick={() => router.push(ROUTES.EINVOICE.INVOICES)}>
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No recent E-Invoices</p>
            <Button
              variant="link"
              className="mt-2"
              onClick={() => router.push(ROUTES.EINVOICE.GENERATE)}
            >
              Generate your first E-Invoice
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Important Information & Guidelines */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Key Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              Key Guidelines
            </CardTitle>
            <CardDescription>Important rules for E-Invoice generation</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>IRN Validity:</strong> Valid for 24 hours from generation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>Cancellation Window:</strong> Only within 24 hours of generation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>GSTIN Required:</strong> Valid 15-digit GSTIN for all parties</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>Unique Invoice:</strong> Document number must be unique per GSTIN</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>Date Format:</strong> Use dd/MM/yyyy for all dates</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Quick Stats & Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-green-600" />
              Monthly Summary
            </CardTitle>
            <CardDescription>Current month statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm text-muted-foreground">Success Rate</span>
                <span className="text-lg font-bold">{stats.total > 0 ? Math.round((stats.generated / stats.total) * 100) : 0}%</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm text-muted-foreground">Generated This Month</span>
                <span className="text-lg font-bold text-green-600">{stats.generated}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm text-muted-foreground">Cancelled This Month</span>
                <span className="text-lg font-bold text-red-600">{stats.cancelled}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Failed This Month</span>
                <span className="text-lg font-bold text-orange-600">{stats.failed}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Important Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-purple-600" />
            Important Resources
          </CardTitle>
          <CardDescription>Quick links to important documents and forms</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Button variant="outline" className="justify-start">
              <FileSearch className="h-4 w-4 mr-2" />
              GST Documentation
            </Button>
            <Button variant="outline" className="justify-start">
              <FileSearch className="h-4 w-4 mr-2" />
              API Reference
            </Button>
            <Button variant="outline" className="justify-start">
              <FileSearch className="h-4 w-4 mr-2" />
              Error Codes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <span className="text-sm font-medium">E-Invoice Service</span>
              <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">Operational</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <span className="text-sm font-medium">GSTN Lookup Service</span>
              <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">Operational</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <span className="text-sm font-medium">E-Waybill Integration</span>
              <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">Operational</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
