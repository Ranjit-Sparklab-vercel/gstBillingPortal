import { NextResponse } from "next/server";

/**
 * CORS headers helper for API routes
 * Use this when you need to support cross-origin requests
 */
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * Handle OPTIONS request for CORS preflight
 */
export function handleCorsPreflight() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}
