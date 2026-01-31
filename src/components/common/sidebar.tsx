"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Truck,
  Receipt,
  Settings,
  LogOut,
  User,
  Plus,
  Users,
  Package,
  BarChart3,
  ArrowLeft,
  FileCheck,
  FilePlus,
  Search,
  AlertCircle,
  X,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants";
import { LucideIcon } from "lucide-react";

// Menu Item Type
type MenuItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  exact: boolean;
};

// Main Dashboard Menu Items
const mainMenuItems: MenuItem[] = [
  {
    title: "Dashboard",
    href: ROUTES.DASHBOARD,
    icon: LayoutDashboard,
    exact: true, // Exact match only
  },
  {
    title: "GST Billing",
    href: ROUTES.GST.ROOT,
    icon: FileText,
    exact: false, // Match with children
  },
  {
    title: "E-Way Bill",
    href: ROUTES.EWAY.ROOT,
    icon: Truck,
    exact: false, // Match with children
  },
  {
    title: "E-Invoice",
    href: ROUTES.EINVOICE.ROOT,
    icon: Receipt,
    exact: false, // Match with children
  },
  {
    title: "Subscription",
    href: ROUTES.SUBSCRIPTION,
    icon: Settings,
    exact: true, // Exact match only
  },
];

// GST Billing Menu Items
const gstMenuItems: MenuItem[] = [
  {
    title: "Overview",
    href: ROUTES.GST.ROOT,
    icon: LayoutDashboard,
    exact: true, // Only active on exact /gst
  },
  {
    title: "Invoices",
    href: ROUTES.GST.INVOICES,
    icon: FileText,
    exact: false, // Active on /gst/invoices and /gst/invoices/create
  },
  {
    title: "Create Invoice",
    href: ROUTES.GST.CREATE_INVOICE,
    icon: Plus,
    exact: true, // Only active on exact /gst/invoices/create
  },
  {
    title: "Customers",
    href: ROUTES.GST.CUSTOMERS,
    icon: Users,
    exact: true, // Only active on exact /gst/customers
  },
  {
    title: "Products",
    href: ROUTES.GST.PRODUCTS,
    icon: Package,
    exact: true, // Only active on exact /gst/products
  },
  {
    title: "Reports",
    href: ROUTES.GST.REPORTS,
    icon: BarChart3,
    exact: true, // Only active on exact /gst/reports
  },
];

// E-Way Bill Menu Items
const ewayMenuItems: MenuItem[] = [
  {
    title: "Overview",
    href: ROUTES.EWAY.ROOT,
    icon: LayoutDashboard,
    exact: true, // Only active on exact /eway
  },
  {
    title: "E-Way Bills",
    href: ROUTES.EWAY.BILLS,
    icon: FileText,
    exact: true, // Only active on exact /eway/bills
  },
  {
    title: "Generate Bill",
    href: ROUTES.EWAY.CREATE,
    icon: Plus,
    exact: true, // Only active on exact /eway/bills/create
  },
];

// E-Invoice Menu Items - Organized by priority and user workflow
const einvoiceMenuItems: MenuItem[] = [
  // 1. Overview - Dashboard/Home
  {
    title: "Overview",
    href: ROUTES.EINVOICE.ROOT,
    icon: LayoutDashboard,
    exact: true, // Only active on exact /einvoice
  },
  // 2. Primary Actions - Generate (Most Common)
  {
    title: "Generate E-Invoice",
    href: ROUTES.EINVOICE.GENERATE,
    icon: FilePlus,
    exact: true, // Only active on exact /einvoice/generate
  },
  // 3. View/Manage - List all invoices
  {
    title: "E-Invoices",
    href: ROUTES.EINVOICE.INVOICES,
    icon: FileCheck,
    exact: true, // Only active on exact /einvoice/invoices
  },
  // 4. Retrieve Actions - Get by IRN (Most Common Retrieval)
  {
    title: "Get E-Invoice",
    href: ROUTES.EINVOICE.GET,
    icon: FileText,
    exact: true, // Only active on exact /einvoice/get
  },
  // 5. Retrieve Actions - Get by Document Details
  {
    title: "Get IRN by Doc Details",
    href: ROUTES.EINVOICE.GET_BY_DOC,
    icon: Search,
    exact: true, // Only active on exact /einvoice/get-by-doc
  },
  // 6. Management Actions - Cancel
  {
    title: "Cancel E-Invoice",
    href: ROUTES.EINVOICE.CANCEL,
    icon: X,
    exact: true, // Only active on exact /einvoice/cancel
  },
  // 7. Utilities - GSTN Lookup
  {
    title: "GSTN Lookup",
    href: ROUTES.EINVOICE.GSTN_LOOKUP,
    icon: Search,
    exact: true, // Only active on exact /einvoice/gstn-lookup
  },
  // 8. Reports/Status - Rejected IRNs
  {
    title: "Rejected IRNs",
    href: ROUTES.EINVOICE.REJECTED,
    icon: AlertCircle,
    exact: true, // Only active on exact /einvoice/rejected
  },
];

// Helper function to check if a route is active
function isRouteActive(pathname: string, href: string, exact: boolean): boolean {
  if (exact) {
    // Exact match only
    return pathname === href;
  } else {
    // Match exact or if pathname starts with href followed by / or end of string
    if (pathname === href) {
      return true;
    }
    // Check if pathname starts with href and the next character is / or end of string
    return pathname.startsWith(href + "/");
  }
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const router = useRouter();

  // Mock user data when not logged in
  const displayUser = user || {
    name: "Demo User",
    email: "demo@example.com",
  };

  const handleLogout = () => {
    logout();
    router.push(ROUTES.LOGIN);
  };

  // Determine which menu to show based on current route
  let menuItems: MenuItem[] = mainMenuItems;
  let moduleTitle = "GST Portal";
  let backToDashboard = false;

  if (pathname.startsWith(ROUTES.GST.ROOT + "/") || pathname === ROUTES.GST.ROOT) {
    menuItems = gstMenuItems;
    moduleTitle = "GST Billing";
    backToDashboard = true;
  } else if (pathname.startsWith(ROUTES.EWAY.ROOT + "/") || pathname === ROUTES.EWAY.ROOT) {
    menuItems = ewayMenuItems;
    moduleTitle = "E-Way Bill";
    backToDashboard = true;
  } else if (pathname.startsWith(ROUTES.EINVOICE.ROOT + "/") || pathname === ROUTES.EINVOICE.ROOT) {
    menuItems = einvoiceMenuItems;
    moduleTitle = "E-Invoice";
    backToDashboard = true;
  }

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            G
          </div>
          <h1 className="text-lg font-bold text-primary">{moduleTitle}</h1>
        </div>
      </div>

      {/* Back to Dashboard Link */}
      {backToDashboard && (
        <div className="border-b px-4 py-2">
          <Link
            href={ROUTES.DASHBOARD}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = isRouteActive(pathname, item.href, item.exact ?? false);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="border-t p-4">
        <div className="mb-2 flex items-center gap-3 px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{displayUser.name}</p>
            <p className="text-xs text-muted-foreground truncate">{displayUser.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
}
