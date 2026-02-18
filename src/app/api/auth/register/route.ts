import { NextResponse } from "next/server";
import { UserRole } from "@/types";
import { corsHeaders, handleCorsPreflight } from "@/lib/cors-headers";

// Mock API route - Replace with actual backend integration
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // Mock registration - Replace with actual database insertion
    if (name && email && password) {
      const mockUser = {
        id: "1",
        email,
        name,
        role: UserRole.USER,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const mockToken = `mock-jwt-token-${Date.now()}`;

      return NextResponse.json(
        {
          user: mockUser,
          token: mockToken,
        },
        {
          headers: corsHeaders,
        }
      );
    }

    return NextResponse.json(
      { message: "Invalid data" },
      { 
        status: 400,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Internal server error" },
      { 
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return handleCorsPreflight();
}
