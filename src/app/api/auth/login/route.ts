import { NextResponse } from "next/server";
import { UserRole } from "@/types";

// Default login credentials
const VALID_CREDENTIALS = [
  {
    username: "glowline.thermoplastic@gmail.com",
    password: "Sangram@98",
    user: {
      id: "1",
      email: "glowline.thermoplastic@gmail.com",
      name: "SANGRAM SANTRAM KURADE",
      role: UserRole.USER,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
  {
    username: "29FTHPK8890K1ZN",
    password: "Glowline@98",
    user: {
      id: "2",
      email: "glowline.thermoplastic@gmail.com",
      name: "SANGRAM SANTRAM KURADE",
      role: UserRole.USER,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
];

// Mock API route - Replace with actual backend integration
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate credentials against default credentials
    const validCredential = VALID_CREDENTIALS.find(
      (cred) => cred.username === email && cred.password === password
    );

    if (validCredential) {
      const mockToken = `mock-jwt-token-${Date.now()}`;

      return NextResponse.json({
        user: validCredential.user,
        token: mockToken,
      });
    }

    return NextResponse.json(
      { message: "Invalid username or password" },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
