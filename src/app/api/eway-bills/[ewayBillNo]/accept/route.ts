import { NextResponse } from "next/server";
import { whiteBooksEWayBillService } from "@/services/gst/ewaybill-whitebooks.service";
import { GST_API_CONFIG } from "@/config/gstApi.config";
import { gstAuthService } from "@/services/gst/auth.service";

/**
 * API Route: Accept E-Way Bill
 * 
 * Rules:
 * - Only received E-Way Bills can be accepted
 * - Acceptance must be within 72 hours of receipt
 * 
 * This endpoint:
 * 1. Validates the E-Way Bill status is RECEIVED
 * 2. Validates 72-hour rule
 * 3. Calls WhiteBooks Accept E-Way Bill API
 * 4. Updates status to ACCEPTED in DB
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ ewayBillNo: string }> | { ewayBillNo: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const { ewayBillNo } = resolvedParams;
    const body = await request.json();

    // Validate required fields
    const { status, createdAt } = body;

    // Validate E-Way Bill status - MUST be RECEIVED
    if (status && status !== "RECEIVED") {
      return NextResponse.json(
        { 
          success: false,
          message: "Only received E-Way Bills can be accepted. Current status: " + status 
        },
        { status: 400 }
      );
    }

    // Validate 72-hour rule
    if (createdAt) {
      const receivedAt = new Date(createdAt);
      const now = new Date();
      const hoursElapsed = (now.getTime() - receivedAt.getTime()) / (1000 * 60 * 60);
      
      if (hoursElapsed > 72) {
        return NextResponse.json(
          { 
            success: false,
            message: "E-Way Bill acceptance is allowed only within 72 hours of receipt. The 72-hour period has expired." 
          },
          { status: 400 }
        );
      }
    }

    // In production, fetch from DB and check:
    // - Status is RECEIVED
    // - Received within 72 hours
    // const ewayBill = await db.ewayBills.findUnique({ where: { ewayBillNumber: ewayBillNo } });
    // if (!ewayBill || ewayBill.status !== "RECEIVED") {
    //   return NextResponse.json({ success: false, message: "Only received E-Way Bills can be accepted" }, { status: 400 });
    // }
    // const hoursElapsed = (new Date().getTime() - new Date(ewayBill.createdAt).getTime()) / (1000 * 60 * 60);
    // if (hoursElapsed > 72) {
    //   return NextResponse.json({ success: false, message: "72-hour acceptance period has expired" }, { status: 400 });
    // }

    // Authenticate with WhiteBooks
    const authConfig = {
      email: GST_API_CONFIG.SANDBOX.email,
      username: GST_API_CONFIG.SANDBOX.username,
      password: GST_API_CONFIG.SANDBOX.password,
      ip_address: GST_API_CONFIG.SANDBOX.ip_address,
      client_id: GST_API_CONFIG.SANDBOX.client_id,
      client_secret: GST_API_CONFIG.SANDBOX.client_secret,
      gstin: GST_API_CONFIG.SANDBOX.gstin,
    };

    const authResponse = await gstAuthService.authenticate(authConfig);
    
    if (authResponse.status_cd !== "Sucess" && authResponse.status_cd !== "1") {
      return NextResponse.json(
        { 
          success: false,
          message: "Authentication failed",
          error: authResponse.status_desc 
        },
        { status: 401 }
      );
    }

    const authToken = authResponse.data.AuthToken;

    // Call WhiteBooks Accept E-Way Bill API
    const whiteBooksConfig = {
      ...authConfig,
      authToken,
    };

    const acceptResponse = await whiteBooksEWayBillService.acceptEWayBill(
      ewayBillNo,
      whiteBooksConfig
    );

    // Check if acceptance was successful
    if (acceptResponse.status_cd !== "1" && acceptResponse.status_cd !== "Sucess") {
      return NextResponse.json(
        { 
          success: false,
          message: "Failed to accept E-Way Bill",
          error: acceptResponse.status_desc 
        },
        { status: 400 }
      );
    }

    // Update status to ACCEPTED in DB (simulated)
    // In production, save to actual database:
    // - Update EWayBill.status = "ACCEPTED"
    // - Update EWayBill.acceptedAt = new Date()
    // - Update EWayBill.acceptedBy = user.id
    const acceptUpdate = {
      ewayBillNo,
      status: "ACCEPTED",
      acceptedAt: new Date().toISOString(),
      acceptedBy: "system", // In production, use actual user ID
    };

    // Return success response
    return NextResponse.json({
      success: true,
      message: "E-Way Bill accepted successfully",
      data: {
        ewayBillNo,
        status: "ACCEPTED",
        whiteBooksResponse: acceptResponse,
      },
    });
  } catch (error: any) {
    console.error("Accept E-Way Bill Error:", error);
    return NextResponse.json(
      { 
        success: false,
        message: "Internal server error",
        error: error.message || "Failed to accept E-Way Bill" 
      },
      { status: 500 }
    );
  }
}
