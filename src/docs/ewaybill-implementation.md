# E-Way Bill Portal Implementation

## Overview

This document describes the implementation of the Government of India style E-Way Bill Portal using Next.js (Frontend only) with WhiteBooks API integration.

## Architecture

### 1. Service Layer (`src/services/gst/ewaybill.service.ts`)

The E-Way Bill service handles all E-Way Bill operations:

#### Key Methods:

- **`generateEWayBill(payload, config)`**: 
  - Generates E-Way Bill by first creating an IRN (Invoice Reference Number)
  - Then generates E-Way Bill from that IRN
  - Supports generating E-Way Bill without vehicle number (Part-B can be updated later)

- **`updatePartB(payload, config)`**: 
  - Updates Part-B (Vehicle Details) of an existing E-Way Bill
  - Used when E-Way Bill was generated without vehicle number

- **`getEWayBillByIRN(irn, config)`**: 
  - Retrieves E-Way Bill details by IRN

#### Internal Flow:

1. **IRN Generation**: Converts E-Way Bill payload to IRN payload format
2. **IRN Creation**: Calls WhiteBooks IRN generation API
3. **E-Way Bill Generation**: Uses generated IRN to create E-Way Bill
4. **Response Handling**: Returns E-Way Bill number, validity, and QR code

### 2. Form Component (`src/app/(dashboard)/eway/generate/page.tsx`)

Single-page form following Government portal style with the following sections:

#### A. Transaction Details
- Supply Type (B2B, B2C, SEZWP, etc.)
- Document Type (INV, CRN, DBN)
- Document Number
- Document Date (with future date validation)

#### B. From (Supplier Details)
- GSTIN (15 characters, auto-filled from config)
- Trade Name, Legal Name
- Address (Line 1, Line 2)
- Location, Pincode, State Code
- Phone, Email (Optional)

#### C. To (Recipient Details)
- GSTIN (15 characters, with auto-lookup)
- POS State Code
- Trade Name, Legal Name
- Address fields
- Auto-filled from GSTN lookup API

#### D. Item Details (Dynamic Table)
- Product Name, HSN Code
- Quantity, Unit
- Taxable Value
- CGST, SGST, IGST rates and amounts
- Total Item Value (auto-calculated)
- Summary totals displayed below table

#### E. Transport Details (Part-B)
- Transporter Name (Required)
- Transporter ID/GSTIN (Optional)
- Distance (KM) (Required)
- Transport Mode (Road, Rail, Air, Ship)
- Vehicle Number (Optional - can be added later)
- Vehicle Type (Regular, Over Dimensional Cargo)
- Transporter Document No./Date (Optional)

### 3. Validation Rules

#### Form Validation:
- All required fields must be filled
- GSTIN must be exactly 15 characters
- Pincode must be exactly 6 digits
- Document date cannot be in the future
- At least one item required
- Each item must have: Product Name, HSN, Quantity, Unit, Value > 0
- Distance must be >= 0
- Transport Mode is required

#### GST Rules:
- GSTIN format validation (15 alphanumeric characters)
- HSN code validation
- Invoice date validation (not future)
- Distance validation (> 0 for movement)
- Vehicle number mandatory before movement (but can be added later via Update Part-B)

### 4. WhiteBooks API Integration

#### Authentication:
- Uses existing `gstAuthService.authenticate()`
- Token stored in session storage
- Auto-authentication on page load

#### API Calls:
1. **GSTN Lookup**: `GET /einvoice/type/GSTNDETAILS/version/V1_03`
   - Auto-triggered when 15-character GSTIN entered
   - Auto-fills recipient details

2. **IRN Generation**: `POST /einvoice/type/GENERATE/version/V1_03`
   - Internal call (user doesn't see this)
   - Converts form data to IRN payload

3. **E-Way Bill Generation**: `POST /einvoice/type/GENERATEEWAYBILL/version/V1_03`
   - Uses generated IRN
   - Can be called without vehicle number

4. **Update Part-B**: Same endpoint as E-Way Bill generation
   - Used to add vehicle details later

### 5. Data Mapping

#### Form Data → IRN Payload:
- Transaction details → `DocDtls`
- From details → `SellerDtls`
- To details → `BuyerDtls`
- Items → `ItemList` (with GST calculations)
- Totals → `ValDtls`

#### IRN → E-Way Bill:
- IRN number → `irn` field
- Transport details → Part-B fields
- Vehicle number (optional) → `vehicleNumber`

### 6. User Experience Features

#### Auto-Fill:
- GSTN lookup auto-fills recipient details
- Seller details pre-filled from config
- Item calculations auto-update

#### Validation Feedback:
- Real-time field validation
- Button disabled until all required fields filled
- Clear error messages

#### Success Flow:
- Shows E-Way Bill number, date, validity
- Displays QR code if available
- Print and Download options
- Option to generate another E-Way Bill

### 7. Government Portal Compliance

#### UI/UX:
- Single form (no multi-step wizard)
- Clear section headers with icons
- Required fields marked with red asterisk
- Government-style card layout
- Responsive design

#### Business Rules:
- Follows GST E-Way Bill rules exactly
- Supports all transport modes
- Handles optional vehicle number scenario
- Validates dates, GSTINs, pincodes
- Calculates validity based on distance

### 8. File Structure

```
src/
├── services/gst/
│   ├── ewaybill.service.ts      # E-Way Bill service
│   ├── einvoice.service.ts      # IRN generation (used internally)
│   └── auth.service.ts          # Authentication
├── app/(dashboard)/eway/
│   └── generate/
│       └── page.tsx              # Main E-Way Bill form
├── constants/
│   ├── index.ts                  # Routes
│   └── stateCodes.ts             # State codes, supply types, etc.
├── lib/
│   └── calculations.ts           # GST calculation utilities
└── config/
    └── gstApi.config.ts          # WhiteBooks API configuration
```

### 9. Usage

#### Generate E-Way Bill:
1. Navigate to `/eway/generate`
2. Fill in all required fields
3. Add items with GST details
4. Enter transport details (vehicle number optional)
5. Click "Generate E-Way Bill"
6. View generated E-Way Bill with number and validity

#### Update Part-B (Vehicle Details):
1. If E-Way Bill generated without vehicle number
2. Use `updatePartB()` method with IRN
3. Provide vehicle number and other Part-B details
4. E-Way Bill will be updated

### 10. Error Handling

- Authentication errors: Clear message, retry option
- API errors: Display status_desc from response
- Validation errors: Field-level error messages
- Network errors: Timeout handling, retry mechanism

### 11. Security

- Auth token stored in session storage
- No sensitive data in URL
- API credentials in environment variables
- HTTPS required for production

### 12. Future Enhancements

- Cancel E-Way Bill functionality
- Reject E-Way Bill functionality
- E-Way Bill history/list view
- Bulk E-Way Bill generation
- Print/PDF generation
- Email E-Way Bill

## API Reference

### Generate E-Way Bill

**Endpoint**: Internal (uses WhiteBooks APIs)

**Flow**:
1. Generate IRN → `POST /einvoice/type/GENERATE/version/V1_03`
2. Generate E-Way Bill → `POST /einvoice/type/GENERATEEWAYBILL/version/V1_03`

**Response**:
```json
{
  "status_cd": "1",
  "status_desc": "Success",
  "data": {
    "EwbNo": "EWB123456789012",
    "EwbDt": "01/01/2024",
    "EwbValidTill": "02/01/2024",
    "Irn": "IRN...",
    "QRCode": "data:image/png;base64,..."
  }
}
```

### Update Part-B

**Method**: `ewayBillService.updatePartB(payload, config)`

**Payload**:
```typescript
{
  irn: string;
  transporterName: string;
  vehicleNo: string;
  approximateDistance: string;
  transportMode: string;
  vehicleType?: string;
  transporterId?: string;
  transportDocNo?: string;
  transportDocDate?: string;
}
```

## Notes

- E-Way Bill generation requires IRN first (handled internally)
- Vehicle number is optional initially but required before movement
- Part-B can be updated using `updatePartB()` method
- All calculations follow GST rules exactly
- Date format: `dd/MM/yyyy`
- GSTIN format: 15 alphanumeric characters
- Pincode format: 6 digits
