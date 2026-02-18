"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Receipt, Truck, Users, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ROUTES } from "@/constants";
import { einvoiceStorage } from "@/lib/einvoice-storage";
import { EInvoice, Customer, Product, EWayBill } from "@/types";
import { cn } from "@/lib/utils";

interface SearchResult {
  type: "einvoice" | "ewaybill" | "customer" | "product";
  id: string;
  title: string;
  subtitle: string;
  route: string;
  icon: React.ReactNode;
}

interface GlobalSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialQuery?: string;
}

export function GlobalSearchDialog({
  open,
  onOpenChange,
  initialQuery = "",
}: GlobalSearchDialogProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Load all data and search
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setResults([]);
      return;
    }

    if (initialQuery) {
      setSearchQuery(initialQuery);
      performSearch(initialQuery);
    }
  }, [open, initialQuery]);

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      performSearch(searchQuery);
    } else {
      setResults([]);
    }
  }, [searchQuery]);

  const performSearch = (query: string) => {
    setIsSearching(true);
    const searchResults: SearchResult[] = [];
    const lowerQuery = query.toLowerCase().trim();

    try {
      // Search E-Invoices
      const einvoices = einvoiceStorage.getAllEInvoices();
      einvoices.forEach((einvoice) => {
        const matches =
          einvoice.invoiceNumber?.toLowerCase().includes(lowerQuery) ||
          einvoice.irn?.toLowerCase().includes(lowerQuery) ||
          einvoice.ackNo?.toLowerCase().includes(lowerQuery) ||
          einvoice.buyerGstin?.toLowerCase().includes(lowerQuery);

        if (matches) {
          searchResults.push({
            type: "einvoice",
            id: einvoice.id,
            title: `Invoice: ${einvoice.invoiceNumber || "N/A"}`,
            subtitle: `IRN: ${einvoice.irn || "N/A"} | GSTIN: ${einvoice.buyerGstin || "N/A"}`,
            route: `${ROUTES.EINVOICE.INVOICES}?search=${encodeURIComponent(query)}`,
            icon: <Receipt className="h-4 w-4" />,
          });
        }
      });

      // Search E-Way Bills (from localStorage)
      try {
        const ewayBillsData = localStorage.getItem("ewaybills_list");
        if (ewayBillsData) {
          const ewayBills: EWayBill[] = JSON.parse(ewayBillsData);
          ewayBills.forEach((bill) => {
            const matches =
              bill.ewayBillNumber?.toLowerCase().includes(lowerQuery) ||
              bill.vehicleNumber?.toLowerCase().includes(lowerQuery) ||
              bill.transporterName?.toLowerCase().includes(lowerQuery) ||
              bill.fromPlace?.toLowerCase().includes(lowerQuery) ||
              bill.toPlace?.toLowerCase().includes(lowerQuery);

            if (matches) {
              searchResults.push({
                type: "ewaybill",
                id: bill.id,
                title: `E-Way Bill: ${bill.ewayBillNumber || "N/A"}`,
                subtitle: `Vehicle: ${bill.vehicleNumber || "N/A"} | ${bill.fromPlace || ""} → ${bill.toPlace || ""}`,
                route: `${ROUTES.EWAY.BILLS}?search=${encodeURIComponent(query)}`,
                icon: <Truck className="h-4 w-4" />,
              });
            }
          });
        }
      } catch (error) {
        console.error("Error searching E-Way Bills:", error);
      }

      // Search Customers (from localStorage or mock data)
      try {
        const customersData = localStorage.getItem("customers_list");
        let customers: Customer[] = [];
        
        if (customersData) {
          customers = JSON.parse(customersData);
        } else {
          // Fallback to mock data structure
          const mockCustomers: Customer[] = [
            {
              id: "1",
              name: "ABC Enterprises",
              email: "contact@abcent.com",
              phone: "+91 98765 43210",
              gstin: "27AABCU9603R1ZM",
              address: "123 Business Street",
              city: "Mumbai",
              state: "Maharashtra",
              pincode: "400001",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: "2",
              name: "XYZ Corporation",
              email: "info@xyzcorp.com",
              phone: "+91 98765 43211",
              gstin: "29AAECX1234F1Z5",
              address: "456 Corporate Avenue",
              city: "Bangalore",
              state: "Karnataka",
              pincode: "560001",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: "3",
              name: "Tech Solutions Pvt Ltd",
              email: "sales@techsol.com",
              phone: "+91 98765 43212",
              gstin: "09AADCT1234M1Z6",
              address: "789 Tech Park",
              city: "Delhi",
              state: "Delhi",
              pincode: "110001",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ];
          customers = mockCustomers;
        }

        customers.forEach((customer) => {
          const matches =
            customer.name?.toLowerCase().includes(lowerQuery) ||
            customer.email?.toLowerCase().includes(lowerQuery) ||
            customer.phone?.toLowerCase().includes(lowerQuery) ||
            customer.gstin?.toLowerCase().includes(lowerQuery) ||
            customer.city?.toLowerCase().includes(lowerQuery) ||
            customer.state?.toLowerCase().includes(lowerQuery);

          if (matches) {
            searchResults.push({
              type: "customer",
              id: customer.id,
              title: customer.name,
              subtitle: `${customer.gstin || "No GSTIN"} | ${customer.city || ""}, ${customer.state || ""}`,
              route: ROUTES.GST.CUSTOMERS,
              icon: <Users className="h-4 w-4" />,
            });
          }
        });
      } catch (error) {
        console.error("Error searching Customers:", error);
      }

      // Search Products (from localStorage or mock data)
      try {
        const productsData = localStorage.getItem("products_list");
        let products: Product[] = [];
        
        if (productsData) {
          products = JSON.parse(productsData);
        } else {
          // Fallback to mock data structure
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
          products = mockProducts;
        }

        products.forEach((product) => {
          const matches =
            product.name?.toLowerCase().includes(lowerQuery) ||
            product.description?.toLowerCase().includes(lowerQuery) ||
            product.hsnCode?.toLowerCase().includes(lowerQuery);

          if (matches) {
            searchResults.push({
              type: "product",
              id: product.id,
              title: product.name,
              subtitle: `HSN: ${product.hsnCode} | ₹${product.price} | ${product.unit}`,
              route: ROUTES.GST.PRODUCTS,
              icon: <Package className="h-4 w-4" />,
            });
          }
        });
      } catch (error) {
        console.error("Error searching Products:", error);
      }
    } catch (error) {
      console.error("Error performing search:", error);
    } finally {
      setIsSearching(false);
      setResults(searchResults);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    router.push(result.route);
    onOpenChange(false);
    setSearchQuery("");
  };

  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {
      einvoice: [],
      ewaybill: [],
      customer: [],
      product: [],
    };

    results.forEach((result) => {
      groups[result.type].push(result);
    });

    return groups;
  }, [results]);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "einvoice":
        return "E-Invoices";
      case "ewaybill":
        return "E-Way Bills";
      case "customer":
        return "Customers";
      case "product":
        return "Products";
      default:
        return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>Global Search</DialogTitle>
          <DialogDescription>
            Search across all invoices, bills, customers, and products
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by Invoice No, IRN, GSTIN, Customer, Product, HSN..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto px-6 pb-6">
          {isSearching && searchQuery.trim().length >= 2 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          ) : searchQuery.trim().length < 2 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Type at least 2 characters to search
            </div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No results found for "{searchQuery}"
            </div>
          ) : (
            <div className="space-y-6 pt-4">
              {Object.entries(groupedResults).map(([type, typeResults]) => {
                if (typeResults.length === 0) return null;

                return (
                  <div key={type}>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                      {getTypeLabel(type)} ({typeResults.length})
                    </h3>
                    <div className="space-y-1">
                      {typeResults.map((result) => (
                        <button
                          key={`${result.type}-${result.id}`}
                          onClick={() => handleResultClick(result)}
                          className={cn(
                            "w-full flex items-start gap-3 p-3 rounded-lg text-left",
                            "hover:bg-accent transition-colors",
                            "border border-transparent hover:border-border"
                          )}
                        >
                          <div className="mt-0.5 text-muted-foreground">
                            {result.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {result.title}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {result.subtitle}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
