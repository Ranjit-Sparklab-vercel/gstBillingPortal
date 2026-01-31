/**
 * WhiteBooks E-Way Bill Master Codes
 * Based on official WhiteBooks E-Way Bill Excel specification
 * These codes must match exactly with WhiteBooks Master Codes sheet
 */

// Supply Types (as per WhiteBooks Master Codes)
export const SUPPLY_TYPES = [
  { value: "O", label: "Outward" },
  { value: "I", label: "Inward" },
] as const;

// Sub Supply Types (as per WhiteBooks Master Codes)
export const SUB_SUPPLY_TYPES = [
  { value: "1", label: "Supply" },
  { value: "2", label: "Import" },
  { value: "3", label: "Export" },
  { value: "4", label: "Job Work" },
  { value: "5", label: "For Own Use" },
  { value: "6", label: "Job Work Returns" },
  { value: "7", label: "Sales Return" },
  { value: "8", label: "Others" },
] as const;

// Document Types (as per WhiteBooks specification)
export const DOCUMENT_TYPES = [
  { value: "INV", label: "Invoice" },
  { value: "CHL", label: "Challan" },
  { value: "BIL", label: "Bill of Supply" },
  { value: "BOE", label: "Bill of Entry" },
] as const;

// Transaction Types (as per WhiteBooks Master Codes)
export const TRANSACTION_TYPES = [
  { value: "1", label: "Regular" },
  { value: "2", label: "Bill to Ship to" },
  { value: "3", label: "Bill to Dispatch from" },
  { value: "4", label: "Combination of 2 and 3" },
] as const;

// Transport Modes (as per WhiteBooks Master Codes)
export const TRANSPORT_MODES = [
  { value: "1", label: "Road" },
  { value: "2", label: "Rail" },
  { value: "3", label: "Air" },
  { value: "4", label: "Ship or Ship Cum Road/Rail" },
] as const;

// Vehicle Types (as per WhiteBooks Master Codes)
export const VEHICLE_TYPES = [
  { value: "R", label: "Regular" },
  { value: "O", label: "Over Dimensional Cargo" },
] as const;

// Quantity Units (as per WhiteBooks Master Codes)
export const QUANTITY_UNITS = [
  { value: "BOX", label: "BOX" },
  { value: "BAG", label: "BAG" },
  { value: "BAL", label: "BAL" },
  { value: "BDL", label: "BDL" },
  { value: "BKL", label: "BKL" },
  { value: "BOU", label: "BOU" },
  { value: "BOX", label: "BOX" },
  { value: "BTL", label: "BTL" },
  { value: "BUN", label: "BUN" },
  { value: "CAN", label: "CAN" },
  { value: "CBM", label: "CBM" },
  { value: "CCM", label: "CCM" },
  { value: "CMS", label: "CMS" },
  { value: "CTN", label: "CTN" },
  { value: "DOZ", label: "DOZ" },
  { value: "DRM", label: "DRM" },
  { value: "GGK", label: "GGK" },
  { value: "GMS", label: "GMS" },
  { value: "GRS", label: "GRS" },
  { value: "GYD", label: "GYD" },
  { value: "KGS", label: "KGS" },
  { value: "KLR", label: "KLR" },
  { value: "KME", label: "KME" },
  { value: "LTR", label: "LTR" },
  { value: "MLT", label: "MLT" },
  { value: "MTR", label: "MTR" },
  { value: "MTS", label: "MTS" },
  { value: "NOS", label: "NOS" },
  { value: "OTH", label: "OTH" },
  { value: "PAC", label: "PAC" },
  { value: "PCS", label: "PCS" },
  { value: "PRS", label: "PRS" },
  { value: "QTL", label: "QTL" },
  { value: "ROL", label: "ROL" },
  { value: "SET", label: "SET" },
  { value: "SQF", label: "SQF" },
  { value: "SQM", label: "SQM" },
  { value: "SQY", label: "SQY" },
  { value: "TBS", label: "TBS" },
  { value: "TGM", label: "TGM" },
  { value: "TON", label: "TON" },
  { value: "TUB", label: "TUB" },
  { value: "UGS", label: "UGS" },
  { value: "UNT", label: "UNT" },
  { value: "YDS", label: "YDS" },
  { value: "OTH", label: "Other" },
] as const;

// State Codes (as per GST specification)
export const STATE_CODES = [
  { value: "1", label: "JAMMU AND KASHMIR" },
  { value: "2", label: "HIMACHAL PRADESH" },
  { value: "3", label: "PUNJAB" },
  { value: "4", label: "CHANDIGARH" },
  { value: "5", label: "UTTARAKHAND" },
  { value: "6", label: "HARYANA" },
  { value: "7", label: "DELHI" },
  { value: "8", label: "RAJASTHAN" },
  { value: "9", label: "UTTAR PRADESH" },
  { value: "10", label: "BIHAR" },
  { value: "11", label: "SIKKIM" },
  { value: "12", label: "ARUNACHAL PRADESH" },
  { value: "13", label: "NAGALAND" },
  { value: "14", label: "MANIPUR" },
  { value: "15", label: "MIZORAM" },
  { value: "16", label: "TRIPURA" },
  { value: "17", label: "MEGHALAYA" },
  { value: "18", label: "ASSAM" },
  { value: "19", label: "WEST BENGAL" },
  { value: "20", label: "JHARKHAND" },
  { value: "21", label: "ODISHA" },
  { value: "22", label: "CHHATTISGARH" },
  { value: "23", label: "MADHYA PRADESH" },
  { value: "24", label: "GUJARAT" },
  { value: "25", label: "DAMAN AND DIU" },
  { value: "26", label: "DADRA AND NAGAR HAVELI" },
  { value: "27", label: "MAHARASHTRA" },
  { value: "29", label: "KARNATAKA" },
  { value: "30", label: "GOA" },
  { value: "31", label: "LAKSHADWEEP" },
  { value: "32", label: "KERALA" },
  { value: "33", label: "TAMIL NADU" },
  { value: "34", label: "PUDUCHERRY" },
  { value: "35", label: "ANDAMAN AND NICOBAR" },
  { value: "36", label: "TELANGANA" },
  { value: "37", label: "ANDHRA PRADESH" },
  { value: "38", label: "LADAKH" },
  { value: "97", label: "OTHER TERRITORY" },
  { value: "96", label: "OTHER COUNTRY" },
] as const;

/**
 * WhiteBooks E-Way Bill Validation Rules
 * Based on Specification And Validations sheet
 */
export const VALIDATION_RULES = {
  // GSTIN Validation
  GSTIN: {
    pattern: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    length: 15,
    message: "GSTIN must be 15 characters in format: 2 digits + 5 letters + 4 digits + 1 letter + 1 alphanumeric + Z + 1 alphanumeric",
  },
  
  // URP (Unregistered Person) - allowed only for B2C
  URP: {
    allowed: ["URP"],
    message: "URP is allowed only for B2C supplies",
  },
  
  // Pincode Validation
  PINCODE: {
    pattern: /^[0-9]{6}$/,
    length: 6,
    message: "Pincode must be exactly 6 digits",
  },
  
  // HSN Code Validation
  HSN: {
    pattern: /^[0-9]{4,8}$/,
    minLength: 4,
    maxLength: 8,
    message: "HSN code must be 4 to 8 digits",
  },
  
  // Date Validation
  DATE: {
    maxDate: new Date(),
    message: "Document date cannot be in the future",
  },
  
  // Distance Validation
  DISTANCE: {
    min: 0,
    message: "Distance must be greater than or equal to 0",
  },
  
  // Vehicle Number Validation (when provided)
  VEHICLE_NO: {
    pattern: /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4}$/,
    message: "Vehicle number must be in format: XX##XX#### (e.g., MH12AB1234)",
  },
} as const;

/**
 * WhiteBooks Error Codes Mapping
 * Based on Error Codes sheet
 */
export const ERROR_CODES = {
  "EWB001": "Invalid GSTIN format",
  "EWB002": "GSTIN not found",
  "EWB003": "Invalid document date",
  "EWB004": "Document date cannot be in future",
  "EWB005": "Invalid HSN code",
  "EWB006": "Invalid pincode",
  "EWB007": "Invalid state code",
  "EWB008": "Distance must be greater than 0",
  "EWB009": "Vehicle number is mandatory for movement",
  "EWB010": "Invalid vehicle number format",
  "EWB011": "URP allowed only for B2C",
  "EWB012": "Sub supply description required when sub supply type is Others",
  "EWB013": "Invalid transport mode",
  "EWB014": "Invalid vehicle type",
  "EWB015": "At least one item is required",
  "EWB016": "Invalid quantity unit",
} as const;
