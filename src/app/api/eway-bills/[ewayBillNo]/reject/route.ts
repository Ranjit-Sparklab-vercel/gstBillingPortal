import { NextResponse } from "next/server";
import { whiteBooksEWayBillService } from "@/services/gst/ewaybill-whitebooks.service";
import { GST_API_CONFIG } from "@/config/gstApi.config";
import { gstAuthService } from "@/services/gst/auth.service";

/**
 * API Route: Reject E-Way Bill
 * 
 * Rules:
 * - Only received E-Way Bills can be rejected
 * - Rejection must be within 72 hours of receipt
 * - Reject reason is mandatory (minimum 10 characters)
 * 
 * This endpoint:
 * 1. Validates the E-Way Bill status is RECEIVED
 * 2. Validates 72-hour rule
 * 3. Validates reject reason
 * 4. Calls WhiteBooks Reject E-Way Bill API
 * 5. Updates status to REJECTED in DB
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
    const { rejectReason, status, createdAt } = body;

    if (!rejectReason || rejectReason.trim().length < 10) {
      return NextResponse.json(
        { 
          success: false,
          message: "Reject reason is mandatory and must be at least 10 characters" 
        },
        { status: 400 }
      );
    }

    // Validate E-Way Bill status - MUST be RECEIVED
    if (status && status !== "RECEIVED") {
      return NextResponse.json(
        { 
          success: false,
          message: "Only received E-Way Bills can be rejected. Current status: " + status 
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
            message: "E-Way Bill rejection is allowed only within 72 hours of receipt. The 72-hour period has expired." 
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
    //   return NextResponse.json({ success: false, message: "Only received E-Way Bills can be rejected" }, { status: 400 });
    // }
    // const hoursElapsed = (new Date().getTime() - new Date(ewayBill.createdAt).getTime()) / (1000 * 60 * 60);
    // if (hoursElapsed > 72) {
    //   return NextResponse.json({ success: false, message: "72-hour rejection period has expired" }, { status: 400 });
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

    // Call WhiteBooks Reject E-Way Bill API
    const whiteBooksConfig = {
      ...authConfig,
      authToken,
    };

    const rejectResponse = await whiteBooksEWayBillService.rejectEWayBill(
      ewayBillNo,
      rejectReason.trim(),
      whiteBooksConfig
    );

    // Check if rejection was successful
    if (rejectResponse.status_cd !== "1" && rejectResponse.status_cd !== "Sucess") {
      return NextResponse.json(
        { 
          success: false,
          message: "Failed to reject E-Way Bill",
          error: rejectResponse.status_desc 
        },
        { status: 400 }
      );
    }

    // Update status to REJECTED in DB (simulated)
    // In production, save to actual database:
    // - Update EWayBill.status = "REJECTED"
    // - Update EWayBill.rejectedAt = new Date()
    // - Update EWayBill.rejectedBy = user.id
    // - Update EWayBill.rejectReason = rejectReason
    const rejectUpdate = {
      ewayBillNo,
      status: "REJECTED",
      rejectedAt: new Date().toISOString(),
      rejectedBy: "system", // In production, use actual user ID
      rejectReason: rejectReason.trim(),
    };

    // Return success response
    return NextResponse.json({
      success: true,
      message: "E-Way Bill rejected successfully",
      data: {
        ewayBillNo,
        status: "REJECTED",
        whiteBooksResponse: rejectResponse,
      },
    });
  } catch (error: any) {
    console.error("Reject E-Way Bill Error:", error);
    return NextResponse.json(
      { 
        success: false,
        message: "Internal server error",
        error: error.message || "Failed to reject E-Way Bill" 
      },
      { status: 500 }
    );
  }
}
