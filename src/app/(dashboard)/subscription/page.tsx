"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/common/status-badge";
import { Loader } from "@/components/common/loader";
import { Check, Calendar } from "lucide-react";
import { SubscriptionPlan, SubscriptionStatus } from "@/types";
import { SUBSCRIPTION_PLANS, ROUTES } from "@/constants";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useSubscriptionStore } from "@/store/subscriptionStore";
import api from "@/lib/api";

export default function SubscriptionPage() {
  const router = useRouter();
  const { subscriptions, setSubscriptions, isPlanActive } = useSubscriptionStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const response = await api.get("/subscriptions");
        setSubscriptions(response.data || []);
      } catch (error) {
        // Mock subscriptions for demo
        // Set expiry date to 7 April (current year or next year if already passed)
        const now = new Date();
        const currentYear = now.getFullYear();
        const april7 = new Date(currentYear, 3, 7); // Month is 0-indexed, so 3 = April
        const expiryDate = april7 > now ? april7 : new Date(currentYear + 1, 3, 7);
        
        const mockSubscriptions = [
          {
            id: "2",
            userId: "1",
            plan: SubscriptionPlan.EWAY_BILLING,
            status: SubscriptionStatus.ACTIVE,
            startDate: new Date().toISOString(),
            expiryDate: expiryDate.toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "3",
            userId: "1",
            plan: SubscriptionPlan.EINVOICE,
            status: SubscriptionStatus.ACTIVE,
            startDate: new Date().toISOString(),
            expiryDate: expiryDate.toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];
        setSubscriptions(mockSubscriptions);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptions();
  }, [setSubscriptions]);

  const handleSubscribe = (plan: SubscriptionPlan) => {
    // Redirect to payment page with plan parameter
    router.push(`${ROUTES.PAYMENT}?plan=${plan}`);
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subscription Plans</h1>
        <p className="text-muted-foreground">
          Choose a plan that fits your business needs
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => {
          const planKey = key as SubscriptionPlan;
          const subscription = subscriptions.find((sub) => sub.plan === planKey);
          const isActive = isPlanActive(planKey);

          return (
            <Card key={key} className={isActive ? "border-primary" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{plan.name}</CardTitle>
                  {isActive && <Badge variant="success">Active</Badge>}
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-3xl font-bold">
                    {formatCurrency(plan.price)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    / {plan.duration}
                  </div>
                </div>

                {subscription && (
                  <div className="space-y-2 rounded-lg bg-muted p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <StatusBadge status={subscription.status} />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Expires</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(subscription.expiryDate)}
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  className="w-full"
                  variant={isActive ? "outline" : "default"}
                  onClick={() => handleSubscribe(planKey)}
                  disabled={isActive}
                >
                  {isActive ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Active
                    </>
                  ) : (
                    "Subscribe"
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
