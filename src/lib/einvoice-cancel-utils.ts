/**
 * E-Invoice Cancel Utility Functions
 * 
 * Government-compliant validation for IRN cancellation
 * 
 * Rules:
 * - Cancellation allowed ONLY within 24 hours of IRN generation
 * - IRN status must be Active (GENERATED)
 */

/**
 * Check if IRN can be cancelled (within 24 hours)
 * @param ackDate - Acknowledgement date from IRN generation (ISO string)
 * @returns true if cancellation is allowed, false otherwise
 */
export function canCancelIRN(ackDate: string): boolean {
  try {
    const ackDateTime = new Date(ackDate);
    const now = new Date();
    const hoursDiff = (now.getTime() - ackDateTime.getTime()) / (1000 * 60 * 60);
    
    // Allow cancellation only within 24 hours
    return hoursDiff <= 24 && hoursDiff >= 0;
  } catch (error) {
    console.error("Error checking cancellation eligibility:", error);
    return false;
  }
}

/**
 * Get hours remaining for cancellation
 * @param ackDate - Acknowledgement date from IRN generation
 * @returns hours remaining (0 if expired or invalid)
 */
export function getHoursRemainingForCancellation(ackDate: string): number {
  try {
    const ackDateTime = new Date(ackDate);
    const now = new Date();
    const hoursDiff = (now.getTime() - ackDateTime.getTime()) / (1000 * 60 * 60);
    const remaining = 24 - hoursDiff;
    return Math.max(0, Math.round(remaining * 10) / 10); // Round to 1 decimal
  } catch (error) {
    return 0;
  }
}

/**
 * Government predefined cancel reasons
 */
export const CANCEL_REASONS = [
  { value: "Duplicate", label: "Duplicate" },
  { value: "Data Entry Mistake", label: "Data Entry Mistake" },
  { value: "Order Cancelled", label: "Order Cancelled" },
  { value: "Other", label: "Other" },
] as const;

export type CancelReason = typeof CANCEL_REASONS[number]["value"];

/**
 * Validate cancel request
 */
export function validateCancelRequest(
  irn: string,
  status: string,
  ackDate: string,
  reason: CancelReason,
  remarks?: string
): { valid: boolean; error?: string } {
  // Validate IRN
  if (!irn || irn.trim().length === 0) {
    return { valid: false, error: "IRN is required" };
  }

  // Validate status - must be GENERATED (Active)
  if (status !== "GENERATED") {
    if (status === "CANCELLED") {
      return { valid: false, error: "This IRN is already cancelled" };
    }
    if (status === "FAILED") {
      return { valid: false, error: "Cannot cancel a failed IRN" };
    }
    return { valid: false, error: "IRN must be in Active (Generated) status to cancel" };
  }

  // Validate 24-hour rule
  if (!canCancelIRN(ackDate)) {
    const hoursRemaining = getHoursRemainingForCancellation(ackDate);
    if (hoursRemaining === 0) {
      return {
        valid: false,
        error: "IRN cancellation is allowed only within 24 hours of generation. The 24-hour period has expired.",
      };
    }
  }

  // Validate reason
  if (!reason || reason.trim().length === 0) {
    return { valid: false, error: "Cancel reason is required" };
  }

  // Validate remarks for "Other" reason
  if (reason === "Other" && (!remarks || remarks.trim().length === 0)) {
    return {
      valid: false,
      error: "Cancel remarks are required when reason is 'Other'",
    };
  }

  return { valid: true };
}
