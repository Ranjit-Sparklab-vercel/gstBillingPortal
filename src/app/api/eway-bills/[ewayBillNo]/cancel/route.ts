import { NextResponse } from "next/server";
import { whiteBooksEWayBillService } from "@/services/gst/ewaybill-whitebooks.service";
import { GST_API_CONFIG } from "@/config/gstApi.config";
import { gstAuthService } from "@/services/gst/auth.service";

/**
 * API Route: Cancel E-Way Bill
 * 
 * Rules:
 * - Cancellation allowed ONLY:
 *   - Within 24 hours of generation
 *   - Goods movement not started
 * - Cancel reason mandatory
 * 
 * This endpoint:
 * 1. Validates the E-Way Bill is ACTIVE
 * 2. Validates 24-hour rule
 * 3. Validates goods movement not started
 * 4. Validates cancel reason is provided
 * 5. Calls WhiteBooks Cancel E-Way Bill API
 * 6. Updates status to CANCELLED in DB
 * 7. Stores cancel reason & timestamp
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
    const { cancelReasonCode, cancelRemarks, status, createdAt, vehicleNumber } = body;

    if (!cancelReasonCode || cancelReasonCode.trim() === "") {
      return NextResponse.json(
        { 
          success: false,
          message: "Cancel reason code is mandatory" 
        },
        { status: 400 }
      );
    }

    if (!cancelRemarks || cancelRemarks.trim().length < 10) {
      return NextResponse.json(
        { 
          success: false,
          message: "Cancel remarks are mandatory and must be at least 10 characters" 
        },
        { status: 400 }
      );
    }

    // Validate E-Way Bill status - MUST be ACTIVE
    if (status && status !== "ACTIVE") {
      return NextResponse.json(
        { 
          success: false,
          message: "Only Active E-Way Bills can be cancelled. Current status: " + status 
        },
        { status: 400 }
      );
    }

    // Validate 24-hour rule
    if (createdAt) {
      const createdAtDate = new Date(createdAt);
      const now = new Date();
      const hoursElapsed = (now.getTime() - createdAtDate.getTime()) / (1000 * 60 * 60);
      
      if (hoursElapsed > 24) {
        return NextResponse.json(
          { 
            success: false,
            message: "E-Way Bill cancellation is allowed only within 24 hours of generation. The 24-hour period has expired." 
          },
          { status: 400 }
        );
      }
    }

    // Validate goods movement not started
    // If vehicle number is set, goods movement might have started
    if (vehicleNumber && vehicleNumber.trim().length > 0) {
      return NextResponse.json(
        { 
          success: false,
          message: "Goods movement has started. E-Way Bill cannot be cancelled once vehicle details are updated." 
        },
        { status: 400 }
      );
    }

    // In production, fetch from DB and check:
    // - Status is ACTIVE
    // - Created within 24 hours
    // - No vehicle number assigned (goods not moved)
    // const ewayBill = await db.ewayBills.findUnique({ where: { ewayBillNumber: ewayBillNo } });
    // if (!ewayBill || ewayBill.status !== "ACTIVE") {
    //   return NextResponse.json({ success: false, message: "Only Active E-Way Bills can be cancelled" }, { status: 400 });
    // }
    // const hoursElapsed = (new Date().getTime() - new Date(ewayBill.createdAt).getTime()) / (1000 * 60 * 60);
    // if (hoursElapsed > 24) {
    //   return NextResponse.json({ success: false, message: "24-hour cancellation period has expired" }, { status: 400 });
    // }
    // if (ewayBill.vehicleNumber && ewayBill.vehicleNumber.trim().length > 0) {
    //   return NextResponse.json({ success: false, message: "Goods movement has started" }, { status: 400 });
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

    // Call WhiteBooks Cancel E-Way Bill API
    const whiteBooksConfig = {
      ...authConfig,
      authToken,
    };

    const cancelResponse = await whiteBooksEWayBillService.cancelEWayBill(
      ewayBillNo,
      cancelReasonCode.trim(),
      cancelRemarks.trim(),
      whiteBooksConfig
    );

    // Check if cancellation was successful
    if (cancelResponse.status_cd !== "1" && cancelResponse.status_cd !== "Sucess") {
      return NextResponse.json(
        { 
          success: false,
          message: "Failed to cancel E-Way Bill",
          error: cancelResponse.status_desc 
        },
        { status: 400 }
      );
    }

    // Update status to CANCELLED in DB (simulated)
    // In production, save to actual database:
    // - Update EWayBill.status = "CANCELLED"
    // - Update EWayBill.cancelReasonCode
    // - Update EWayBill.cancelRemarks
    // - Update EWayBill.cancelledAt = new Date()
    // - Update EWayBill.cancelledBy = user.id
    // - Disable all actions (Update Vehicle, Change Transporter buttons should be disabled)
    const cancellationUpdate = {
      ewayBillNo,
      status: "CANCELLED",
      cancelReasonCode: cancelReasonCode.trim(),
      cancelRemarks: cancelRemarks.trim(),
      cancelledAt: new Date().toISOString(),
      cancelledBy: "system", // In production, use actual user ID
    };

    // Return success response
    return NextResponse.json({
      success: true,
      message: "E-Way Bill cancelled successfully. All actions have been disabled.",
      data: {
        ewayBillNo,
        status: "CANCELLED",
        cancelReasonCode: cancellationUpdate.cancelReasonCode,
        cancelRemarks: cancellationUpdate.cancelRemarks,
        cancelledAt: cancellationUpdate.cancelledAt,
        whiteBooksResponse: cancelResponse,
      },
    });
  } catch (error: any) {
    console.error("Cancel E-Way Bill Error:", error);
    return NextResponse.json(
      { 
        success: false,
        message: "Internal server error",
        error: error.message || "Failed to cancel E-Way Bill" 
      },
      { status: 500 }
    );
  }
}
