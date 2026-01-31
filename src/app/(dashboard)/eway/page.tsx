"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/common/status-badge";
import { EmptyState } from "@/components/common/empty-state";
import { Loader } from "@/components/common/loader";
import { Plus, Truck, Edit } from "lucide-react";
import { EWayBill } from "@/types";
import { ROUTES } from "@/constants";
import { formatDate } from "@/lib/utils";
import { useSubscriptionStore } from "@/store/subscriptionStore";
import { SubscriptionPlan } from "@/types";
import { ewayBillService } from "@/services/gst/eway.service";
import { UpdateVehicleDialog } from "@/components/eway/UpdateVehicleDialog";

export default function EWayBillPage() {
  const router = useRouter();
  const { hasAccess } = useSubscriptionStore();
  const [ewayBills, setEwayBills] = useState<EWayBill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState<EWayBill | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);

  useEffect(() => {
    // Mock data for frontend demo - no API calls
    const mockEWayBills: EWayBill[] = [
      {
        id: "1",
        ewayBillNumber: "EWB-2024-001",
        invoiceId: "INV-2024-001",
        transporterName: "Fast Transport",
        vehicleNumber: "MH-12-AB-1234",
        fromPlace: "Mumbai",
        toPlace: "Pune",
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
        lastUpdatedVehicleNumber: "MH-12-AB-1234",
        lastVehicleUpdateAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "2",
        ewayBillNumber: "EWB-2024-002",
        invoiceId: "INV-2024-002",
        transporterName: "Quick Logistics",
        vehicleNumber: "DL-01-CD-5678",
        fromPlace: "Delhi",
        toPlace: "Gurgaon",
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
      },
      {
        id: "3",
        ewayBillNumber: "EWB-2024-003",
        invoiceId: "INV-2024-003",
        transporterName: "Express Logistics",
        vehicleNumber: "",
        fromPlace: "Bangalore",
        toPlace: "Chennai",
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: "EXPIRED",
        createdAt: new Date().toISOString(),
      },
    ];
    
    setTimeout(() => {
      setEwayBills(mockEWayBills);
      setIsLoading(false);
    }, 500);
  }, []);

  const handleUpdateVehicle = (bill: EWayBill) => {
    setSelectedBill(bill);
    setIsUpdateDialogOpen(true);
  };

  const handleUpdateSuccess = () => {
    // Refresh the list or update the specific bill
    // In production, refetch from API or update local state
    setIsUpdateDialogOpen(false);
    setSelectedBill(null);
    
    // For demo, we'll just show a message
    // In production, refetch the bills list
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
          <h1 className="text-3xl font-bold tracking-tight">E-Way Bill</h1>
          <p className="text-muted-foreground">
            Generate and manage E-Way bills for transportation
          </p>
        </div>
        <Button onClick={() => router.push(ROUTES.EWAY.CREATE)}>
          <Plus className="mr-2 h-4 w-4" />
          Generate E-Way Bill
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>E-Way Bills</CardTitle>
          <CardDescription>All your E-Way bills in one place</CardDescription>
        </CardHeader>
        <CardContent>
          {ewayBills.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="No E-Way bills yet"
              description="Get started by generating your first E-Way bill"
              actionLabel="Generate E-Way Bill"
              onAction={() => router.push(ROUTES.EWAY.CREATE)}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>E-Way Bill Number</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Vehicle Number</TableHead>
                  <TableHead>Last Updated Vehicle</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ewayBills.map((bill) => (
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
                    <TableCell>
                      {bill.lastUpdatedVehicleNumber ? (
                        <div className="space-y-1">
                          <div className="font-medium">{bill.lastUpdatedVehicleNumber}</div>
                          {bill.lastVehicleUpdateAt && (
                            <div className="text-xs text-muted-foreground">
                              {formatDate(bill.lastVehicleUpdateAt)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(bill.validUntil)}</TableCell>
                    <TableCell>
                      <StatusBadge status={bill.status} />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateVehicle(bill)}
                        disabled={bill.status !== "ACTIVE"}
                        title={
                          bill.status !== "ACTIVE"
                            ? "Only Active E-Way Bills can be updated"
                            : "Update Vehicle Details"
                        }
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Update Vehicle
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Update Vehicle Dialog */}
      {selectedBill && (
        <UpdateVehicleDialog
          open={isUpdateDialogOpen}
          onOpenChange={setIsUpdateDialogOpen}
          ewayBill={selectedBill}
          onSuccess={handleUpdateSuccess}
        />
      )}
    </div>
  );
}
