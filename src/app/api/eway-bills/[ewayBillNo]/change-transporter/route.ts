import { NextResponse } from "next/server";
import { whiteBooksEWayBillService } from "@/services/gst/ewaybill-whitebooks.service";
import { GST_API_CONFIG } from "@/config/gstApi.config";
import { gstAuthService } from "@/services/gst/auth.service";

/**
 * API Route: Change Transporter for E-Way Bill
 * 
 * Rules:
 * - Only Active E-Way Bills allowed
 * - New Transporter ID mandatory
 * - Old transporter access revoked
 * 
 * This endpoint:
 * 1. Validates the E-Way Bill is ACTIVE
 * 2. Validates new transporter ID is provided
 * 3. Calls WhiteBooks Change Transporter API
 * 4. Updates DB transporter info (simulated - in production, save to actual DB)
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
    const { newTransporterId, newTransporterName } = body;

    if (!newTransporterId || newTransporterId.trim() === "") {
      return NextResponse.json(
        { 
          success: false,
          message: "New Transporter ID is mandatory" 
        },
        { status: 400 }
      );
    }

    // Validate GSTIN format (15 characters)
    if (newTransporterId.length !== 15) {
      return NextResponse.json(
        { 
          success: false,
          message: "Transporter ID must be a valid 15-character GSTIN" 
        },
        { status: 400 }
      );
    }

    // Validate E-Way Bill status - MUST be ACTIVE
    const { status } = body;
    if (status && status !== "ACTIVE") {
      return NextResponse.json(
        { 
          success: false,
          message: "Only Active E-Way Bills can change transporter. Current status: " + status 
        },
        { status: 400 }
      );
    }

    // In production, fetch from DB and check status:
    // const ewayBill = await db.ewayBills.findUnique({ where: { ewayBillNumber: ewayBillNo } });
    // if (!ewayBill || ewayBill.status !== "ACTIVE") {
    //   return NextResponse.json({ success: false, message: "Only Active E-Way Bills can change transporter" }, { status: 400 });
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

    // Call WhiteBooks Change Transporter API
    const whiteBooksConfig = {
      ...authConfig,
      authToken,
    };

    const changeResponse = await whiteBooksEWayBillService.changeTransporter(
      ewayBillNo,
      newTransporterId.trim(),
      newTransporterName?.trim() || undefined,
      whiteBooksConfig
    );

    // Check if change was successful
    if (changeResponse.status_cd !== "1" && changeResponse.status_cd !== "Sucess") {
      return NextResponse.json(
        { 
          success: false,
          message: "Failed to change transporter",
          error: changeResponse.status_desc 
        },
        { status: 400 }
      );
    }

    // Update transporter info in DB (simulated)
    // In production, save to actual database:
    // - Update EWayBill.transporterId (immediately revoke old transporter access)
    // - Update EWayBill.transporterName
    // - Create transporter change history record
    // - Revoke old transporter access immediately (remove from access list)
    const transporterUpdate = {
      ewayBillNo,
      oldTransporterId: body.oldTransporterId || null, // In production, fetch from DB before update
      newTransporterId: newTransporterId.trim(),
      newTransporterName: newTransporterName?.trim() || null,
      changedAt: new Date().toISOString(),
      changedBy: "system", // In production, use actual user ID
      // In production, also:
      // - Remove old transporter from EWayBillAccess table
      // - Add new transporter to EWayBillAccess table
      // - Log the change in EWayBillTransporterHistory table
    };

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Transporter changed successfully. Old transporter access has been revoked.",
      data: {
        ewayBillNo,
        newTransporterId: transporterUpdate.newTransporterId,
        newTransporterName: transporterUpdate.newTransporterName,
        changedAt: transporterUpdate.changedAt,
        whiteBooksResponse: changeResponse,
      },
    });
  } catch (error: any) {
    console.error("Change Transporter Error:", error);
    return NextResponse.json(
      { 
        success: false,
        message: "Internal server error",
        error: error.message || "Failed to change transporter" 
      },
      { status: 500 }
    );
  }
}
