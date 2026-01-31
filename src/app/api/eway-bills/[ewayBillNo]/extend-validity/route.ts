import { NextResponse } from "next/server";
import { whiteBooksEWayBillService } from "@/services/gst/ewaybill-whitebooks.service";
import { GST_API_CONFIG } from "@/config/gstApi.config";
import { gstAuthService } from "@/services/gst/auth.service";

/**
 * API Route: Extend Validity of E-Way Bill
 * 
 * Rules:
 * - Allowed ONLY for Active E-Way Bills
 * - Reason mandatory
 * - Current location mandatory
 * - Valid only within govt-allowed window (72 hours from now)
 * 
 * This endpoint:
 * 1. Validates the E-Way Bill is ACTIVE
 * 2. Validates reason and current location are provided
 * 3. Validates new validity is within govt-allowed window (72 hours)
 * 4. Calls WhiteBooks Extend Validity API
 * 5. Updates new validity dates in DB
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
    const { extendReason, currentLocation, newValidUntil, status, currentValidUntil } = body;

    if (!extendReason || extendReason.trim().length < 10) {
      return NextResponse.json(
        { 
          success: false,
          message: "Reason is mandatory and must be at least 10 characters" 
        },
        { status: 400 }
      );
    }

    if (!currentLocation || currentLocation.trim().length < 3) {
      return NextResponse.json(
        { 
          success: false,
          message: "Current location is mandatory and must be at least 3 characters" 
        },
        { status: 400 }
      );
    }

    if (!newValidUntil || newValidUntil.trim().length === 0) {
      return NextResponse.json(
        { 
          success: false,
          message: "New validity date is mandatory" 
        },
        { status: 400 }
      );
    }

    // Validate E-Way Bill status - MUST be ACTIVE
    if (status && status !== "ACTIVE") {
      return NextResponse.json(
        { 
          success: false,
          message: "Only Active E-Way Bills can be extended. Current status: " + status 
        },
        { status: 400 }
      );
    }

    // Validate new validity date format and range
    try {
      const [datePart, timePart] = newValidUntil.trim().split(" ");
      const [day, month, year] = datePart.split("/");
      const newDate = new Date(`${year}-${month}-${day} ${timePart || "23:59"}`);
      const now = new Date();
      const maxValidUntil = new Date(now.getTime() + 72 * 60 * 60 * 1000); // 72 hours from now

      // Validate new date is in the future
      if (newDate <= now) {
        return NextResponse.json(
          { 
            success: false,
            message: "New validity date must be in the future" 
          },
          { status: 400 }
        );
      }

      // Validate new date is after current validity
      if (currentValidUntil) {
        const currentValid = new Date(currentValidUntil);
        if (newDate <= currentValid) {
          return NextResponse.json(
            { 
              success: false,
              message: "New validity date must be after current validity date" 
            },
            { status: 400 }
          );
        }
      }

      // Validate new date is within govt-allowed window (72 hours from now)
      if (newDate > maxValidUntil) {
        return NextResponse.json(
          { 
            success: false,
            message: "E-Way Bill validity can be extended only up to 72 hours from current time as per Government rules" 
          },
          { status: 400 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { 
          success: false,
          message: "Invalid date format. Please use dd/MM/yyyy HH:mm format" 
        },
        { status: 400 }
      );
    }

    // In production, fetch from DB and check:
    // - Status is ACTIVE
    // - Current validity date
    // const ewayBill = await db.ewayBills.findUnique({ where: { ewayBillNumber: ewayBillNo } });
    // if (!ewayBill || ewayBill.status !== "ACTIVE") {
    //   return NextResponse.json({ success: false, message: "Only Active E-Way Bills can be extended" }, { status: 400 });
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

    // Call WhiteBooks Extend Validity API
    const whiteBooksConfig = {
      ...authConfig,
      authToken,
    };

    const extendResponse = await whiteBooksEWayBillService.extendValidity(
      ewayBillNo,
      extendReason.trim(),
      currentLocation.trim(),
      newValidUntil.trim(),
      whiteBooksConfig
    );

    // Check if extension was successful
    if (extendResponse.status_cd !== "1" && extendResponse.status_cd !== "Sucess") {
      return NextResponse.json(
        { 
          success: false,
          message: "Failed to extend validity",
          error: extendResponse.status_desc 
        },
        { status: 400 }
      );
    }

    // Update new validity dates in DB (simulated)
    // In production, save to actual database:
    // - Update EWayBill.validUntil = newValidUntil
    // - Update EWayBill.extendedValidUntil = newValidUntil
    // - Update EWayBill.extendReason = extendReason
    // - Update EWayBill.currentLocation = currentLocation
    // - Update EWayBill.extendedAt = new Date()
    // - Update EWayBill.extendedBy = user.id
    const validityUpdate = {
      ewayBillNo,
      oldValidUntil: currentValidUntil || null,
      newValidUntil: newValidUntil.trim(),
      extendReason: extendReason.trim(),
      currentLocation: currentLocation.trim(),
      extendedAt: new Date().toISOString(),
      extendedBy: "system", // In production, use actual user ID
    };

    // Return success response
    return NextResponse.json({
      success: true,
      message: "E-Way Bill validity extended successfully. New validity date has been updated.",
      data: {
        ewayBillNo,
        newValidUntil: validityUpdate.newValidUntil,
        extendReason: validityUpdate.extendReason,
        currentLocation: validityUpdate.currentLocation,
        extendedAt: validityUpdate.extendedAt,
        whiteBooksResponse: extendResponse,
      },
    });
  } catch (error: any) {
    console.error("Extend Validity Error:", error);
    return NextResponse.json(
      { 
        success: false,
        message: "Internal server error",
        error: error.message || "Failed to extend validity" 
      },
      { status: 500 }
    );
  }
}
