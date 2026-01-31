import { NextResponse } from "next/server";
import { SubscriptionPlan, SubscriptionStatus } from "@/types";

// Mock API route - Replace with actual backend integration
export async function GET() {
  try {
    // Mock subscriptions - Replace with actual database query
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
    ];

    return NextResponse.json(mockSubscriptions);
  } catch (error) {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { plan } = body;

    // Mock subscription creation - Replace with actual payment processing
    const mockSubscription = {
      id: Date.now().toString(),
      userId: "1",
      plan: plan as SubscriptionPlan,
      status: SubscriptionStatus.ACTIVE,
      startDate: new Date().toISOString(),
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(mockSubscription);
  } catch (error) {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
