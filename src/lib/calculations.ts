/**
 * E-Invoice Calculation Utilities
 * Handles all calculations for E-Invoice generation
 */

export interface ItemCalculationResult {
  assAmt: string; // Assessable Amount
  cgstAmt: string; // CGST Amount
  sgstAmt: string; // SGST Amount
  igstAmt: string; // IGST Amount
  unitPrice: string; // Unit Price
  totItemVal: string; // Total Item Value
  gstRt: string; // GST Rate
}

export interface TotalCalculationResult {
  totalAssVal: string; // Total Assessable Value
  totalCgstAmt: string; // Total CGST Amount
  totalSgstAmt: string; // Total SGST Amount
  totalIgstAmt: string; // Total IGST Amount
  totalInvVal: string; // Total Invoice Value
}

/**
 * Safe number parsing - handles empty strings, null, undefined
 */
export function safeParseFloat(value: string | number | null | undefined, defaultValue: number = 0): number {
  if (value === null || value === undefined || value === "") {
    return defaultValue;
  }
  const parsed = typeof value === "number" ? value : parseFloat(String(value));
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Format number to 2 decimal places as string
 */
export function formatToTwoDecimals(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0.00";
  return num.toFixed(2);
}

/**
 * Calculate item-level GST amounts
 */
export function calculateItemGST(
  taxableValue: string | number,
  cgstRate: string | number,
  sgstRate: string | number,
  igstRate: string | number
): ItemCalculationResult {
  // Parse all values safely
  const assAmt = safeParseFloat(taxableValue, 0);
  const cgstRateNum = safeParseFloat(cgstRate, 0);
  const sgstRateNum = safeParseFloat(sgstRate, 0);
  const igstRateNum = safeParseFloat(igstRate, 0);

  // Calculate GST amounts
  const cgstAmt = (assAmt * cgstRateNum) / 100;
  const sgstAmt = (assAmt * sgstRateNum) / 100;
  const igstAmt = (assAmt * igstRateNum) / 100;

  // Calculate total item value
  const totItemVal = assAmt + cgstAmt + sgstAmt + igstAmt;

  // Determine GST Rate for API
  let gstRt = "0";
  if (igstRateNum > 0) {
    gstRt = formatToTwoDecimals(igstRateNum);
  } else if (cgstRateNum > 0 || sgstRateNum > 0) {
    gstRt = formatToTwoDecimals(cgstRateNum + sgstRateNum);
  }

  return {
    assAmt: formatToTwoDecimals(assAmt),
    cgstAmt: formatToTwoDecimals(cgstAmt),
    sgstAmt: formatToTwoDecimals(sgstAmt),
    igstAmt: formatToTwoDecimals(igstAmt),
    unitPrice: "0.00", // Will be calculated separately with quantity
    totItemVal: formatToTwoDecimals(totItemVal),
    gstRt: gstRt,
  };
}

/**
 * Calculate unit price from total value and quantity
 */
export function calculateUnitPrice(
  totalValue: string | number,
  quantity: string | number
): string {
  const total = safeParseFloat(totalValue, 0);
  const qty = safeParseFloat(quantity, 1); // Default to 1 to avoid division by zero

  if (qty === 0) {
    return "0.00";
  }

  return formatToTwoDecimals(total / qty);
}

/**
 * Calculate totals from items array
 */
export function calculateTotals(items: Array<{
  value: string | number;
  cgst: string | number;
  sgst: string | number;
  igst: string | number;
}>): TotalCalculationResult {
  let totalAssVal = 0;
  let totalCgstAmt = 0;
  let totalSgstAmt = 0;
  let totalIgstAmt = 0;

  items.forEach((item) => {
    const assAmt = safeParseFloat(item.value, 0);
    const cgstRate = safeParseFloat(item.cgst, 0);
    const sgstRate = safeParseFloat(item.sgst, 0);
    const igstRate = safeParseFloat(item.igst, 0);

    totalAssVal += assAmt;
    totalCgstAmt += (assAmt * cgstRate) / 100;
    totalSgstAmt += (assAmt * sgstRate) / 100;
    totalIgstAmt += (assAmt * igstRate) / 100;
  });

  const totalInvVal = totalAssVal + totalCgstAmt + totalSgstAmt + totalIgstAmt;

  return {
    totalAssVal: formatToTwoDecimals(totalAssVal),
    totalCgstAmt: formatToTwoDecimals(totalCgstAmt),
    totalSgstAmt: formatToTwoDecimals(totalSgstAmt),
    totalIgstAmt: formatToTwoDecimals(totalIgstAmt),
    totalInvVal: formatToTwoDecimals(totalInvVal),
  };
}

/**
 * Apply round off to total invoice value
 */
export function applyRoundOff(
  totalInvVal: string | number,
  roundOffAmount: string | number
): string {
  const total = safeParseFloat(totalInvVal, 0);
  const roundOff = safeParseFloat(roundOffAmount, 0);
  return formatToTwoDecimals(total + roundOff);
}

/**
 * Apply Cess to total invoice value
 */
export function applyCess(
  totalInvVal: string | number,
  cessAmount: string | number
): string {
  const total = safeParseFloat(totalInvVal, 0);
  const cess = safeParseFloat(cessAmount, 0);
  return formatToTwoDecimals(total + cess);
}

/**
 * Calculate final invoice value with round off and cess
 */
export function calculateFinalInvoiceValue(
  baseTotal: string | number,
  roundOffAmount?: string | number,
  cessAmount?: string | number
): string {
  let final = safeParseFloat(baseTotal, 0);
  
  if (roundOffAmount) {
    final += safeParseFloat(roundOffAmount, 0);
  }
  
  if (cessAmount) {
    final += safeParseFloat(cessAmount, 0);
  }
  
  return formatToTwoDecimals(final);
}
