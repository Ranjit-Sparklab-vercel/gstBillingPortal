"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader } from "@/components/common/loader";
import { Plus, Search } from "lucide-react";
import { ROUTES } from "@/constants";

/**
 * E-Way Bill Dashboard
 * EXACTLY like Government E-Way Bill Portal
 * 
 * Features:
 * - Summary boxes: Total EWB, Active, Cancelled, Expired
 * - Filters: Date range pickers, Status dropdown, Search button
 * - Plain government-style layout (no fancy cards or colors)
 * - Numbers from DB (exactly like govt portal format)
 */

interface DashboardStats {
  total: number;
  active: number;
  cancelled: number;
  expired: number;
}

export default function EWayBillPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    active: 0,
    cancelled: 0,
    expired: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // Load E-Way Bills data and calculate stats
  // Note: In production, this would fetch from your local DB
  // We only use WhiteBooks API for operations (generate, update, cancel, etc.)
  // For dashboard stats, we calculate from local DB data
  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      
      // In production, fetch from your local DB:
      // const ewayBills = await db.ewayBills.findMany();
      // Then calculate stats from the data
      
      // For now, using mock data to simulate local DB
      const mockEWayBills = [
        { status: "ACTIVE" },
        { status: "ACTIVE" },
        { status: "ACTIVE" },
        { status: "ACTIVE" },
        { status: "ACTIVE" },
        { status: "CANCELLED" },
        { status: "CANCELLED" },
        { status: "EXPIRED" },
        { status: "EXPIRED" },
      ];
      
      // Calculate stats from data (exactly like govt portal format)
      const total = mockEWayBills.length;
      const active = mockEWayBills.filter((b) => b.status === "ACTIVE").length;
      const cancelled = mockEWayBills.filter((b) => b.status === "CANCELLED").length;
      const expired = mockEWayBills.filter((b) => b.status === "EXPIRED").length;
      
      setStats({ total, active, cancelled, expired });
      setIsLoading(false);
    };

    loadStats();
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    router.push(`${ROUTES.EWAY.BILLS}${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const handleClear = () => {
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">E-Way Bill Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Government of India E-Way Bill Portal
          </p>
        </div>
        <Button onClick={() => router.push(ROUTES.EWAY.CREATE)}>
          <Plus className="mr-2 h-4 w-4" />
          Generate E-Way Bill
        </Button>
      </div>

      {/* Summary Boxes - Government Portal Style (Plain, Simple) */}
      <div className="grid grid-cols-4 gap-4">
        {/* Total EWB */}
        <div className="border border-gray-300 bg-white p-4">
          <div className="text-sm text-gray-600 mb-1">Total EWB</div>
          <div className="text-2xl font-semibold text-gray-900">{stats.total}</div>
        </div>

        {/* Active */}
        <div className="border border-gray-300 bg-white p-4">
          <div className="text-sm text-gray-600 mb-1">Active</div>
          <div className="text-2xl font-semibold text-gray-900">{stats.active}</div>
        </div>

        {/* Cancelled */}
        <div className="border border-gray-300 bg-white p-4">
          <div className="text-sm text-gray-600 mb-1">Cancelled</div>
          <div className="text-2xl font-semibold text-gray-900">{stats.cancelled}</div>
        </div>

        {/* Expired */}
        <div className="border border-gray-300 bg-white p-4">
          <div className="text-sm text-gray-600 mb-1">Expired</div>
          <div className="text-2xl font-semibold text-gray-900">{stats.expired}</div>
        </div>
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

          {/* Search Button */}
          <div className="flex gap-2">
            <Button
              onClick={handleSearch}
              className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            {(statusFilter !== "all" || dateFrom || dateTo) && (
              <Button
                variant="outline"
                onClick={handleClear}
                className="h-9 px-4 border-gray-300"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Link to E-Way Bills List */}
      <div className="border border-gray-300 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-gray-900">View E-Way Bills</div>
            <div className="text-xs text-gray-600 mt-1">View and manage all your E-Way Bills</div>
          </div>
          <Button
            onClick={() => router.push(ROUTES.EWAY.BILLS)}
            variant="outline"
            className="border-gray-300"
          >
            View All Bills
          </Button>
        </div>
      </div>
    </div>
  );
}
