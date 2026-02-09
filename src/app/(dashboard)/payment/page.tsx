"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader } from "@/components/common/loader";
import { ArrowLeft, CreditCard, Lock } from "lucide-react";
import { ROUTES, SUBSCRIPTION_PLANS } from "@/constants";
import { SubscriptionPlan } from "@/types";
import { formatCurrency } from "@/lib/utils";

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planKey = searchParams.get("plan") as SubscriptionPlan | null;
  const [isProcessing, setIsProcessing] = useState(false);

  const plan = planKey ? SUBSCRIPTION_PLANS[planKey] : null;

  const [paymentData, setPaymentData] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
  });

  useEffect(() => {
    if (!planKey || !plan) {
      router.push(ROUTES.SUBSCRIPTION);
    }
  }, [planKey, plan, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Format card number with spaces
    if (name === "cardNumber") {
      const formatted = value.replace(/\s/g, "").replace(/(.{4})/g, "$1 ").trim();
      if (formatted.length <= 19) {
        setPaymentData((prev) => ({ ...prev, [name]: formatted }));
      }
    }
    // Format expiry date as MM/YY
    else if (name === "expiryDate") {
      const formatted = value.replace(/\D/g, "").replace(/(\d{2})(\d)/, "$1/$2").slice(0, 5);
      setPaymentData((prev) => ({ ...prev, [name]: formatted }));
    }
    // CVV - only numbers, max 3 digits
    else if (name === "cvv") {
      const formatted = value.replace(/\D/g, "").slice(0, 3);
      setPaymentData((prev) => ({ ...prev, [name]: formatted }));
    }
    else {
      setPaymentData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // TODO: Implement actual payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Redirect to subscription page after successful payment
      router.push(ROUTES.SUBSCRIPTION);
    } catch (error) {
      console.error("Payment failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!plan) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(ROUTES.SUBSCRIPTION)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment</h1>
          <p className="text-muted-foreground">
            Complete your subscription payment
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Payment Form */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Details
              </CardTitle>
              <CardDescription>
                Enter your payment information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardholderName">Cardholder Name</Label>
                  <Input
                    id="cardholderName"
                    name="cardholderName"
                    value={paymentData.cardholderName}
                    onChange={handleChange}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    name="cardNumber"
                    value={paymentData.cardNumber}
                    onChange={handleChange}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiryDate">Expiry Date</Label>
                    <Input
                      id="expiryDate"
                      name="expiryDate"
                      value={paymentData.expiryDate}
                      onChange={handleChange}
                      placeholder="MM/YY"
                      maxLength={5}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      name="cvv"
                      type="password"
                      value={paymentData.cvv}
                      onChange={handleChange}
                      placeholder="123"
                      maxLength={3}
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader size="sm" className="mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Pay {formatCurrency(plan.price)}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Plan</span>
                  <span className="text-sm font-medium">{plan.name}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Duration</span>
                  <span className="text-sm font-medium">{plan.duration}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Price</span>
                  <span className="text-sm font-medium">{formatCurrency(plan.price)}</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold">Total</span>
                  <span className="text-lg font-bold">{formatCurrency(plan.price)}</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <p>Your payment information is secure and encrypted</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
