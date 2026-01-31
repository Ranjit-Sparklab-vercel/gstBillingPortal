"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/common/empty-state";
import { Loader } from "@/components/common/loader";
import { Plus, Package } from "lucide-react";
import { Product } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import api from "@/lib/api";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock data for frontend demo - no API calls
    const mockProducts: Product[] = [
      {
        id: "1",
        name: "Web Development Service",
        description: "Custom web application development",
        hsnCode: "998314",
        taxRate: 18,
        price: 50000,
        unit: "Project",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "2",
        name: "Mobile App Development",
        description: "iOS and Android app development",
        hsnCode: "998314",
        taxRate: 18,
        price: 75000,
        unit: "Project",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "3",
        name: "Consulting Services",
        description: "IT consulting and advisory services",
        hsnCode: "998315",
        taxRate: 18,
        price: 2000,
        unit: "Hour",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "4",
        name: "Software License",
        description: "Annual software license",
        hsnCode: "852349",
        taxRate: 18,
        price: 25000,
        unit: "License",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    
    setTimeout(() => {
      setProducts(mockProducts);
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
          <h1 className="text-3xl font-bold tracking-tight">Products & Services</h1>
          <p className="text-muted-foreground">Manage your product and service catalog</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product List</CardTitle>
          <CardDescription>All your products and services</CardDescription>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No products yet"
              description="Get started by adding your first product or service"
              actionLabel="Add Product"
              onAction={() => {}}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>HSN Code</TableHead>
                  <TableHead>Tax Rate</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.hsnCode}</TableCell>
                    <TableCell>{product.taxRate}%</TableCell>
                    <TableCell>{formatCurrency(product.price)}</TableCell>
                    <TableCell>{product.unit}</TableCell>
                    <TableCell>{formatDate(product.createdAt)}</TableCell>
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
