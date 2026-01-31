import { NextResponse } from "next/server";
import { UserRole } from "@/types";

// Mock API route - Replace with actual backend integration
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Mock authentication - Replace with actual database check
    if (email && password) {
      const mockUser = {
        id: "1",
        email,
        name: "Demo User",
        role: UserRole.USER,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const mockToken = `mock-jwt-token-${Date.now()}`;

      return NextResponse.json({
        user: mockUser,
        token: mockToken,
      });
    }

    return NextResponse.json(
      { message: "Invalid credentials" },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
