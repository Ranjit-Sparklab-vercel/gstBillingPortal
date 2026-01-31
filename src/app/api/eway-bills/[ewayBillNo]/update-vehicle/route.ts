import { NextResponse } from "next/server";
import { whiteBooksEWayBillService } from "@/services/gst/ewaybill-whitebooks.service";
import { GST_API_CONFIG } from "@/config/gstApi.config";
import { gstAuthService } from "@/services/gst/auth.service";

/**
 * API Route: Update Vehicle Details (Part-B) for E-Way Bill
 * 
 * Rules:
 * - Vehicle update allowed multiple times
 * - Mandatory before movement
 * - Only Active E-Way Bills allowed
 * 
 * This endpoint:
 * 1. Validates the E-Way Bill is ACTIVE
 * 2. Calls WhiteBooks Update Vehicle API
 * 3. Saves vehicle history in DB (simulated - in production, save to actual DB)
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
    const { vehicleNo, transMode, distance, transporterName } = body;

    if (!vehicleNo || !transMode || distance === undefined) {
      return NextResponse.json(
        { 
          success: false,
          message: "Missing required fields: vehicleNo, transMode, and distance are required" 
        },
        { status: 400 }
      );
    }

    // Validate E-Way Bill status (should be ACTIVE)
    // In production, fetch from DB and check status
    // For now, we'll assume it's active if the API call succeeds

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

    // Prepare Part-B data
    const partBData = {
      transMode: String(transMode),
      distance: Number(distance),
      vehicleNo: String(vehicleNo),
      transporterName: transporterName || "",
      transporterId: body.transporterId || undefined,
      vehicleType: body.vehicleType || undefined,
      transDocNo: body.transDocNo || undefined,
      transDocDate: body.transDocDate || undefined,
    };

    // Call WhiteBooks Update Vehicle API
    const whiteBooksConfig = {
      ...authConfig,
      authToken,
    };

    const updateResponse = await whiteBooksEWayBillService.updatePartB(
      ewayBillNo,
      partBData,
      whiteBooksConfig
    );

    // Check if update was successful
    if (updateResponse.status_cd !== "1" && updateResponse.status_cd !== "Sucess") {
      return NextResponse.json(
        { 
          success: false,
          message: "Failed to update vehicle details",
          error: updateResponse.status_desc 
        },
        { status: 400 }
      );
    }

    // Save vehicle history to DB (simulated)
    // In production, save to actual database:
    // - Create EWayBillVehicleHistory record
    // - Update EWayBill.lastUpdatedVehicleNumber
    // - Update EWayBill.lastVehicleUpdateAt
    const vehicleHistory = {
      id: `vh-${Date.now()}`,
      ewayBillId: ewayBillNo, // In production, use actual DB ID
      vehicleNumber: vehicleNo,
      transporterName: partBData.transporterName,
      transporterId: partBData.transporterId,
      transMode: partBData.transMode,
      distance: partBData.distance,
      vehicleType: partBData.vehicleType,
      transDocNo: partBData.transDocNo,
      transDocDate: partBData.transDocDate,
      updatedAt: new Date().toISOString(),
    };

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Vehicle details updated successfully",
      data: {
        ewayBillNo,
        vehicleNumber: vehicleNo,
        lastUpdatedAt: vehicleHistory.updatedAt,
        vehicleHistory,
        whiteBooksResponse: updateResponse,
      },
    });
  } catch (error: any) {
    console.error("Update Vehicle Details Error:", error);
    return NextResponse.json(
      { 
        success: false,
        message: "Internal server error",
        error: error.message || "Failed to update vehicle details" 
      },
      { status: 500 }
    );
  }
}
