"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/status-badge";
import { useSubscriptionStore } from "@/store/subscriptionStore";
import { SubscriptionPlan, SubscriptionStatus } from "@/types";
import { ROUTES, SUBSCRIPTION_PLANS } from "@/constants";
import { FileText, Truck, Receipt, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";
import api from "@/lib/api";

const moduleCards = [
  {
    plan: SubscriptionPlan.GST_BILLING,
    title: "GST Billing",
    description: "Create and manage GST invoices with automatic tax calculations",
    icon: FileText,
    route: ROUTES.GST.ROOT,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    plan: SubscriptionPlan.EWAY_BILLING,
    title: "E-Way Bill",
    description: "Generate and manage E-Way bills for transportation",
    icon: Truck,
    route: ROUTES.EWAY.ROOT,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    plan: SubscriptionPlan.EINVOICE,
    title: "E-Invoice",
    description: "Generate IRN and E-Invoices compliant with government standards",
    icon: Receipt,
    route: ROUTES.EINVOICE.ROOT,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const { subscriptions, setSubscriptions, hasAccess } = useSubscriptionStore();

  useEffect(() => {
    // Fetch subscriptions - mock data for demo
    const fetchSubscriptions = async () => {
      try {
        const response = await api.get("/subscriptions");
        setSubscriptions(response.data || []);
      } catch (error) {
        // Mock subscriptions for demo
        const mockSubscriptions = [
          {
            id: "1",
            userId: "1",
            plan: SubscriptionPlan.GST_BILLING,
            status: SubscriptionStatus.ACTIVE,
            startDate: new Date().toISOString(),
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "2",
            userId: "1",
            plan: SubscriptionPlan.EWAY_BILLING,
            status: SubscriptionStatus.ACTIVE,
            startDate: new Date().toISOString(),
            expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];
        setSubscriptions(mockSubscriptions);
      }
    };

    fetchSubscriptions();
  }, [setSubscriptions]);

  const handleCardClick = (route: string, hasAccess: boolean) => {
    // Allow access to all routes without subscription check
    router.push(route);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your GST billing, E-Way bills, and E-Invoices
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {moduleCards.map((module) => {
          const Icon = module.icon;
          const subscription = subscriptions.find((sub) => sub.plan === module.plan);
          const isActive = hasAccess(module.plan);
          const planInfo = SUBSCRIPTION_PLANS[module.plan];

          return (
            <Card
              key={module.plan}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                !isActive ? "opacity-60" : ""
              }`}
              onClick={() => handleCardClick(module.route, isActive)}
            >
              <CardHeader>
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${module.bgColor} mb-4`}>
                  <Icon className={`h-6 w-6 ${module.color}`} />
                </div>
                <CardTitle>{module.title}</CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <StatusBadge
                      status={isActive ? SubscriptionStatus.ACTIVE : SubscriptionStatus.EXPIRED}
                    />
                  </div>
                  {subscription && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Expires</span>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4" />
                        {formatDate(subscription.expiryDate)}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={isActive ? "default" : "outline"}
                  disabled={!isActive}
                >
                  {isActive ? "Open Panel" : "Subscribe"}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
