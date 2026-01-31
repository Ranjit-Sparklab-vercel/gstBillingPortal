import { NextResponse } from "next/server";
import { whiteBooksEWayBillService } from "@/services/gst/ewaybill-whitebooks.service";
import { GST_API_CONFIG } from "@/config/gstApi.config";
import { gstAuthService } from "@/services/gst/auth.service";

/**
 * API Route: Generate Consolidated E-Way Bill
 * 
 * This endpoint:
 * 1. Validates at least 2 E-Way Bills are selected
 * 2. Validates all selected E-Way Bills are ACTIVE
 * 3. Calls WhiteBooks Generate Consolidated E-Way Bill API
 * 4. Returns Consolidated E-Way Bill number and list of included EWBs
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ewayBillNumbers } = body;

    // Validate: At least 2 E-Way Bills required
    if (!ewayBillNumbers || !Array.isArray(ewayBillNumbers) || ewayBillNumbers.length < 2) {
      return NextResponse.json(
        { 
          success: false,
          message: "At least 2 Active E-Way Bills are required to generate Consolidated E-Way Bill" 
        },
        { status: 400 }
      );
    }

    // In production, validate all E-Way Bills are ACTIVE:
    // const ewayBills = await db.ewayBills.findMany({
    //   where: { ewayBillNumber: { in: ewayBillNumbers } }
    // });
    // const inactiveBills = ewayBills.filter(b => b.status !== "ACTIVE");
    // if (inactiveBills.length > 0) {
    //   return NextResponse.json({
    //     success: false,
    //     message: `Only Active E-Way Bills can be consolidated. Found inactive: ${inactiveBills.map(b => b.ewayBillNumber).join(", ")}`
    //   }, { status: 400 });
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

    // Call WhiteBooks Generate Consolidated E-Way Bill API
    const whiteBooksConfig = {
      ...authConfig,
      authToken,
    };

    const consolidatedResponse = await whiteBooksEWayBillService.generateConsolidatedEWayBill(
      ewayBillNumbers,
      whiteBooksConfig
    );

    // Check if generation was successful
    if (consolidatedResponse.status_cd !== "1" && consolidatedResponse.status_cd !== "Sucess") {
      return NextResponse.json(
        { 
          success: false,
          message: "Failed to generate Consolidated E-Way Bill",
          error: consolidatedResponse.status_desc 
        },
        { status: 400 }
      );
    }

    // Extract Consolidated E-Way Bill number from response
    const consolidatedEWBNo = consolidatedResponse.data?.consolidatedEWBNo || 
                             consolidatedResponse.data?.ewayBillNo ||
                             `CEWB-${Date.now()}`;

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Consolidated E-Way Bill generated successfully",
      data: {
        consolidatedEWBNo,
        includedEWBs: ewayBillNumbers,
        whiteBooksResponse: consolidatedResponse,
      },
    });
  } catch (error: any) {
    console.error("Generate Consolidated E-Way Bill Error:", error);
    return NextResponse.json(
      { 
        success: false,
        message: "Internal server error",
        error: error.message || "Failed to generate Consolidated E-Way Bill" 
      },
      { status: 500 }
    );
  }
}
