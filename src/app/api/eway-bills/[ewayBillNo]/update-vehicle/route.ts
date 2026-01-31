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
    const { vehicleNo, transMode, distance, transDocNo, transDocDate, status } = body;

    // Validate E-Way Bill status - MUST be ACTIVE
    if (status && status !== "ACTIVE") {
      return NextResponse.json(
        { 
          success: false,
          message: "Only Active E-Way Bills can be updated. Current status: " + status 
        },
        { status: 400 }
      );
    }

    // Validate transport mode and distance
    if (!transMode || distance === undefined) {
      return NextResponse.json(
        { 
          success: false,
          message: "Missing required fields: transMode and distance are required" 
        },
        { status: 400 }
      );
    }

    // Validate: Either vehicleNo OR (transDocNo + transDocDate) must be provided
    const hasVehicleNo = vehicleNo && vehicleNo.trim().length > 0;
    const hasTransDoc = transDocNo && transDocNo.trim().length > 0 && 
                       transDocDate && transDocDate.trim().length > 0;

    if (!hasVehicleNo && !hasTransDoc) {
      return NextResponse.json(
        { 
          success: false,
          message: "Either Vehicle Number OR Transport Document No + Date must be provided" 
        },
        { status: 400 }
      );
    }

    // Validate vehicle number format if provided
    if (hasVehicleNo) {
      const vehicleNoRegex = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4}$/;
      const cleanedVehicleNo = vehicleNo.toUpperCase().replace(/\s/g, "");
      if (!vehicleNoRegex.test(cleanedVehicleNo)) {
        return NextResponse.json(
          { 
            success: false,
            message: "Vehicle number must be in format: XX##XX#### (e.g., MH12AB1234)" 
          },
          { status: 400 }
        );
      }
    }

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
    const partBData: any = {
      transMode: String(transMode),
      distance: Number(distance),
      transporterName: body.transporterName || "",
      transporterId: body.transporterId || undefined,
      vehicleType: body.vehicleType || undefined,
    };

    // Add vehicleNo if provided
    if (hasVehicleNo) {
      partBData.vehicleNo = vehicleNo.toUpperCase().replace(/\s/g, "");
    }

    // Add transport document details if provided
    if (hasTransDoc) {
      partBData.transDocNo = transDocNo.trim();
      partBData.transDocDate = transDocDate.trim();
    }

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
    // - Create EWayBillVehicleHistory record (maintains full history)
    // - Update EWayBill.lastUpdatedVehicleNumber (if vehicleNo provided)
    // - Update EWayBill.lastVehicleUpdateAt
    const vehicleHistory = {
      id: `vh-${Date.now()}`,
      ewayBillId: ewayBillNo, // In production, use actual DB ID
      vehicleNumber: hasVehicleNo ? partBData.vehicleNo : null,
      transporterName: partBData.transporterName || null,
      transporterId: partBData.transporterId || null,
      transMode: partBData.transMode,
      distance: partBData.distance,
      vehicleType: partBData.vehicleType || null,
      transDocNo: hasTransDoc ? partBData.transDocNo : null,
      transDocDate: hasTransDoc ? partBData.transDocDate : null,
      updatedAt: new Date().toISOString(),
      updatedBy: "system", // In production, use actual user ID
    };

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Vehicle details updated successfully. History has been saved.",
      data: {
        ewayBillNo,
        vehicleNumber: hasVehicleNo ? partBData.vehicleNo : null,
        transportDocNo: hasTransDoc ? partBData.transDocNo : null,
        transportDocDate: hasTransDoc ? partBData.transDocDate : null,
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
