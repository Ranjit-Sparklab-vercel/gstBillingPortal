# E-Invoice System Overview

## System Architecture

### 1. **API Configuration** (`src/config/gstApi.config.ts`)
   - Centralized API credentials
   - Sandbox and Production environments
   - All API endpoints defined

### 2. **Service Layer** (`src/services/gst/`)

#### **Auth Service** (`auth.service.ts`)
   - **API**: `GET /einvoice/authenticate?email={email}`
   - **Purpose**: Get authentication token
   - **Headers**: username, password, ip_address, client_id, client_secret, gstin
   - **Response**: AuthToken, TokenExpiry

#### **E-Invoice Service** (`einvoice.service.ts`)
   - **Generate IRN**: `POST /einvoice/type/GENERATE/version/V1_03`
   - **Get GSTN Details**: `GET /einvoice/type/GSTNDETAILS/version/V1_03`
   - **Sync GSTIN**: `POST /einvoice/type/SYNCGSTIN/version/V1_03`
   - **Get IRN**: `GET /einvoice/type/GETIRN/version/V1_03`
   - **Get IRN by Doc**: `POST /einvoice/type/GETIRNBYDOC/version/V1_03`
   - **Cancel IRN**: `POST /einvoice/type/CANCELIRN/version/V1_03`
   - **Get Rejected IRN**: `GET /einvoice/type/GETREJECTEDIRN/version/V1_03`
   - **Generate E-Way Bill**: `POST /einvoice/type/GENERATEEWAYBILL/version/V1_03`
   - **Get E-Way Bill**: `GET /einvoice/type/GETEWAYBILL/version/V1_03`
   - **Get B2C QR Code**: `POST /einvoice/type/GETB2CQR/version/V1_03`

### 3. **Form Structure** (`src/app/(dashboard)/einvoice/generate/page.tsx`)

#### **Sections**:
1. **Transaction Details**
   - Supply Type (B2B, B2C, SEZWP, etc.)
   - Document Type (INV, CRN, DBN)
   - Document Number
   - Document Date (DatePicker)

2. **Seller Details (Bill From)**
   - Trade Name, Legal Name
   - GSTIN (15 characters)
   - Address (Line 1, Line 2)
   - Location, Pincode, State Code

3. **Buyer Details (Bill To)**
   - GSTIN (with auto-lookup)
   - POS State Code
   - Trade Name, Legal Name
   - Address fields
   - Auto-filled from GSTN lookup

4. **Shipping Details**
   - Optional section
   - "Same as Billing" checkbox
   - Auto-fills from buyer details

5. **Item Details**
   - Dynamic add/remove items
   - Product Name, HSN Code
   - Quantity, Unit, Taxable Value
   - CGST%, SGST%, IGST%
   - Real-time calculations per item

6. **Value Details**
   - Total Taxable Amount
   - Total CGST Amount
   - Total SGST Amount
   - Total IGST Amount
   - Total Invoice Amount
   - All auto-calculated

7. **Transportation Details**
   - Part A: Transporter Name, Distance
   - Part B: Transport Mode, Vehicle Type, Vehicle No, Doc No

### 4. **Calculations**

#### **Per Item**:
```
AssAmt = parseFloat(item.value)
CgstAmt = (AssAmt * CgstRate) / 100
SgstAmt = (AssAmt * SgstRate) / 100
IgstAmt = (AssAmt * IgstRate) / 100
UnitPrice = AssAmt / Quantity
TotItemVal = AssAmt + CgstAmt + SgstAmt + IgstAmt
GstRt = (Igst > 0) ? Igst : (Cgst + Sgst)
```

#### **Totals**:
```
TotalAssVal = Sum of all AssAmt
TotalCgstAmt = Sum of all CgstAmt
TotalSgstAmt = Sum of all SgstAmt
TotalIgstAmt = Sum of all IgstAmt
TotalInvVal = TotalAssVal + TotalCgstAmt + TotalSgstAmt + TotalIgstAmt
```

### 5. **Payload Structure**

The payload matches exactly with Whitebooks API format:
- Version: "1.1"
- TranDtls: TaxSch, SupTyp
- DocDtls: Typ, No, Dt
- SellerDtls: All seller fields
- BuyerDtls: All buyer fields with Pos
- ShipDtls: Optional shipping details
- ItemList: Array of items with all calculations
- ValDtls: Total values
- EwbDtls: Optional transportation details

### 6. **Features**

✅ Auto Authentication on page load
✅ Auto GSTN Lookup when 15 characters entered
✅ Real-time GST calculations
✅ Dynamic item add/remove
✅ "Same as Billing" for shipping
✅ Form validation with Zod
✅ Session storage for responses
✅ Error handling with toast notifications
✅ Date picker with dd/MM/yyyy format
✅ State codes dropdown
✅ All APIs systematically integrated

### 7. **Constants** (`src/constants/stateCodes.ts`)

- STATE_CODES: All Indian state codes (1-38, 96, 97)
- SUPPLY_TYPES: B2B, B2C, SEZWP, SEZWOP, EXPWP, EXPWOP, DEXP
- DOCUMENT_TYPES: INV, CRN, DBN
- TRANSPORT_MODES: Road (1), Rail (2), Air (3), Ship (4)
- VEHICLE_TYPES: Regular (R), Over Dimensional Cargo (O)

## Usage Flow

1. **Page Load** → Auto authenticate → Get AuthToken
2. **Enter Buyer GSTIN** → Auto lookup when 15 chars → Fill buyer details
3. **Fill Form** → All sections with validation
4. **Add Items** → Dynamic items with calculations
5. **Submit** → Build payload → Call Generate IRN API
6. **Success** → Store in session → Redirect to invoices list

## API Response Handling

- **Success**: `status_cd === "1"` or `"Sucess"`
- **Error**: `status_desc` contains error message
- **Data**: Response stored in `sessionStorage` for later use
