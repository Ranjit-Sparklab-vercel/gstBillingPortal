# WhiteBooks E-Way Bill Specification Implementation

## Overview

This document explains how the E-Way Bill portal strictly follows the WhiteBooks E-Way Bill Excel specification, including:
- Complete Json structure
- Mandatory params validation
- Master Codes usage
- Validation rules
- Error handling

## Architecture

### 1. Single Form Structure

The portal implements a **single form** (Government of India style) that internally handles:
- **Part-A**: Transaction, From, To, Items, Value Details
- **Part-B**: Transport Details

Both parts are submitted together in a single API call, matching WhiteBooks "Complete Json" structure.

### 2. Field Name Mapping

All field names match WhiteBooks Excel "Complete Json" sheet exactly:

| Form Field | WhiteBooks JSON Field | Type | Mandatory |
|-----------|----------------------|------|-----------|
| `supplyType` | `supplyType` | String ("O" or "I") | Yes |
| `subSupplyType` | `subSupplyType` | String ("1" to "8") | Conditional |
| `subSupplyDesc` | `subSupplyDesc` | String | If subSupplyType = "8" |
| `transactionType` | `transactionType` | String ("1" to "4") | Optional |
| `docType` | `docType` | String ("INV", "CHL", "BIL", "BOE") | Yes |
| `docNo` | `docNo` | String | Yes |
| `docDate` | `docDate` | String (dd/MM/yyyy) | Yes |
| `fromGstin` | `fromGstin` | String (15 chars or "URP") | Yes |
| `fromTrdName` | `fromTrdName` | String | Yes |
| `fromAddr1` | `fromAddr1` | String | Yes |
| `fromAddr2` | `fromAddr2` | String | Optional |
| `fromPlace` | `fromPlace` | String | Yes |
| `fromPincode` | `fromPincode` | String (6 digits) | Yes |
| `fromStateCode` | `fromStateCode` | String | Yes |
| `actFromStateCode` | `actFromStateCode` | String | Optional |
| `toGstin` | `toGstin` | String (15 chars or "URP") | Yes |
| `toTrdName` | `toTrdName` | String | Yes |
| `toAddr1` | `toAddr1` | String | Yes |
| `toAddr2` | `toAddr2` | String | Optional |
| `toPlace` | `toPlace` | String | Yes |
| `toPincode` | `toPincode` | String (6 digits) | Yes |
| `toStateCode` | `toStateCode` | String | Yes |
| `actToStateCode` | `actToStateCode` | String | Optional |
| `itemList[].productName` | `productName` | String | Yes |
| `itemList[].productDesc` | `productDesc` | String | Optional |
| `itemList[].hsnCode` | `hsnCode` | String (4-8 digits) | Yes |
| `itemList[].quantity` | `quantity` | Number | Yes |
| `itemList[].qtyUnit` | `qtyUnit` | String | Yes |
| `itemList[].taxableAmount` | `taxableAmount` | Number | Yes |
| `itemList[].cgstRate` | `cgstRate` | Number | Optional |
| `itemList[].sgstRate` | `sgstRate` | Number | Optional |
| `itemList[].igstRate` | `igstRate` | Number | Optional |
| `itemList[].cessRate` | `cessRate` | Number | Optional |
| `totalValue` | `totalValue` | Number | Yes |
| `cgstValue` | `cgstValue` | Number | Conditional |
| `sgstValue` | `sgstValue` | Number | Conditional |
| `igstValue` | `igstValue` | Number | Conditional |
| `cessValue` | `cessValue` | Number | Optional |
| `totInvValue` | `totInvValue` | Number | Yes |
| `transMode` | `transMode` | String ("1" to "4") | Yes |
| `distance` | `distance` | Number (>= 0) | Yes |
| `transporterId` | `transporterId` | String | Optional |
| `transporterName` | `transporterName` | String | Optional |
| `vehicleNo` | `vehicleNo` | String | Optional |
| `vehicleType` | `vehicleType` | String ("R" or "O") | Optional |
| `transDocNo` | `transDocNo` | String | Optional |
| `transDocDate` | `transDocDate` | String (dd/MM/yyyy) | Optional |

## Master Codes Implementation

All dropdowns use values from WhiteBooks "Master Codes" sheet:

### Supply Types
- `O` - Outward
- `I` - Inward

### Sub Supply Types
- `1` - Supply
- `2` - Import
- `3` - Export
- `4` - Job Work
- `5` - For Own Use
- `6` - Job Work Returns
- `7` - Sales Return
- `8` - Others

### Document Types
- `INV` - Invoice
- `CHL` - Challan
- `BIL` - Bill of Supply
- `BOE` - Bill of Entry

### Transaction Types
- `1` - Regular
- `2` - Bill to Ship to
- `3` - Bill to Dispatch from
- `4` - Combination of 2 and 3

### Transport Modes
- `1` - Road
- `2` - Rail
- `3` - Air
- `4` - Ship or Ship Cum Road/Rail

### Vehicle Types
- `R` - Regular
- `O` - Over Dimensional Cargo

### Quantity Units
All units from WhiteBooks master codes (BOX, BAG, NOS, KGS, LTR, etc.)

## Validation Rules

### From "Specification And Validations" Sheet

#### 1. GSTIN Validation
- **Format**: 15 alphanumeric characters
- **Pattern**: `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$`
- **Special Case**: "URP" allowed for unregistered persons (B2C only)

#### 2. URP Validation
- **Rule**: URP allowed only for Outward (O) supply type
- **Implementation**: Form-level validation using Zod refine

#### 3. Pincode Validation
- **Format**: Exactly 6 digits
- **Pattern**: `^[0-9]{6}$`

#### 4. HSN Code Validation
- **Length**: 4 to 8 digits
- **Pattern**: `^[0-9]{4,8}$`

#### 5. Date Validation
- **Format**: dd/MM/yyyy
- **Rule**: Document date cannot be in the future
- **Implementation**: DatePicker with `maxDate={new Date()}`

#### 6. Distance Validation
- **Rule**: Must be >= 0
- **Type**: Number

#### 7. Sub Supply Description
- **Rule**: Required when subSupplyType = "8" (Others)
- **Implementation**: Conditional validation using Zod refine

#### 8. Item Validation
- **Rule**: At least one item required
- **Rule**: Each item must have productName, hsnCode, quantity, qtyUnit, taxableAmount > 0

#### 9. Vehicle Number
- **Format**: When provided, should match pattern `^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4}$`
- **Rule**: Optional initially, can be added later via Update Part-B

## Complete Json Structure

The final payload sent to WhiteBooks API matches the "Complete Json" sheet structure:

```json
{
  "supplyType": "O",
  "subSupplyType": "1",
  "subSupplyDesc": "",
  "transactionType": "1",
  "docType": "INV",
  "docNo": "INV-001",
  "docDate": "17/05/2024",
  "fromGstin": "05AAACH6188F1ZM",
  "fromTrdName": "Supplier Name",
  "fromAddr1": "Address Line 1",
  "fromAddr2": "Address Line 2",
  "fromPlace": "City",
  "fromPincode": "263652",
  "fromStateCode": "5",
  "actFromStateCode": "5",
  "toGstin": "URP",
  "toTrdName": "Recipient Name",
  "toAddr1": "Address Line 1",
  "toAddr2": "Address Line 2",
  "toPlace": "City",
  "toPincode": "263680",
  "toStateCode": "5",
  "actToStateCode": "5",
  "itemList": [
    {
      "productName": "Wheat",
      "productDesc": "Wheat",
      "hsnCode": "1001",
      "quantity": 4,
      "qtyUnit": "BOX",
      "taxableAmount": 56099,
      "cgstRate": 1.5,
      "sgstRate": 1.5,
      "igstRate": 0,
      "cessRate": 0
    }
  ],
  "totalValue": 56099,
  "cgstValue": 150.34,
  "sgstValue": 150.34,
  "igstValue": 0,
  "cessValue": 0,
  "totInvValue": 57200.24,
  "transMode": "1",
  "distance": 67,
  "transporterId": "05AAACG0904A1ZL",
  "transporterName": "",
  "vehicleNo": "APR3214",
  "vehicleType": "R",
  "transDocNo": "12",
  "transDocDate": ""
}
```

## Mandatory Params Implementation

Based on "Mandatory params Json" sheet, the following fields are mandatory:

### Always Mandatory:
- `supplyType`
- `docType`
- `docNo`
- `docDate`
- `fromGstin`
- `fromTrdName`
- `fromAddr1`
- `fromPlace`
- `fromPincode`
- `fromStateCode`
- `toGstin`
- `toTrdName`
- `toAddr1`
- `toPlace`
- `toPincode`
- `toStateCode`
- `itemList` (at least one item)
- `totalValue`
- `totInvValue`
- `transMode`
- `distance`

### Conditionally Mandatory:
- `subSupplyDesc` - When `subSupplyType` = "8"
- `cgstValue`, `sgstValue` - When CGST/SGST rates > 0
- `igstValue` - When IGST rate > 0

## Error Handling

Error codes from "Error Codes" sheet are mapped to user-friendly messages:

- **EWB001**: Invalid GSTIN format
- **EWB002**: GSTIN not found
- **EWB003**: Invalid document date
- **EWB004**: Document date cannot be in future
- **EWB005**: Invalid HSN code
- **EWB006**: Invalid pincode
- **EWB007**: Invalid state code
- **EWB008**: Distance must be greater than 0
- **EWB009**: Vehicle number is mandatory for movement
- **EWB010**: Invalid vehicle number format
- **EWB011**: URP allowed only for B2C
- **EWB012**: Sub supply description required when sub supply type is Others
- **EWB013**: Invalid transport mode
- **EWB014**: Invalid vehicle type
- **EWB015**: At least one item is required
- **EWB016**: Invalid quantity unit

## Special Cases

### 1. B2C Supply (URP)
- `toGstin` can be "URP" for unregistered recipients
- Only allowed when `supplyType` = "O" (Outward)
- Validation prevents URP for Inward supplies

### 2. Delivery Challan
- Use `docType` = "CHL"
- Same structure as Invoice

### 3. Inward Supply
- Use `supplyType` = "I"
- URP not allowed

### 4. Part-B Update
- E-Way Bill can be generated without vehicle number
- Part-B can be updated later using `updatePartB()` method
- Vehicle number becomes mandatory before movement

## API Integration

### Endpoints Used:
1. **Authentication**: `GET /einvoice/authenticate?email={email}`
2. **GSTN Lookup**: `GET /einvoice/type/GSTNDETAILS/version/V1_03`
3. **Generate E-Way Bill**: `POST /ewaybill/generate?email={email}`
4. **Update Part-B**: `POST /ewaybill/update-partb?email={email}`
5. **Get E-Way Bill**: `GET /ewaybill/get?ewayBillNo={ewayBillNo}`

### Request Headers:
```
email: {email}
username: {username}
password: {password}
ip_address: {ip_address}
client_id: {client_id}
client_secret: {client_secret}
gstin: {gstin}
auth-token: {AuthToken}
Content-Type: application/json
```

## Testing Checklist

- [ ] Supply Type validation (O/I only)
- [ ] Sub Supply Type validation (1-8)
- [ ] Sub Supply Description required when type = 8
- [ ] Document Type validation (INV/CHL/BIL/BOE)
- [ ] GSTIN format validation (15 chars or URP)
- [ ] URP allowed only for Outward
- [ ] Pincode validation (6 digits)
- [ ] HSN code validation (4-8 digits)
- [ ] Date validation (not future)
- [ ] Distance validation (>= 0)
- [ ] Item validation (at least one, all required fields)
- [ ] Transport mode validation (1-4)
- [ ] Vehicle type validation (R/O)
- [ ] Master codes usage (all dropdowns)
- [ ] Complete Json structure match
- [ ] Error code mapping

## Notes

1. **No Custom Backend**: All operations use WhiteBooks APIs directly from frontend
2. **Token Management**: Auth token stored in session storage, auto-refreshed when needed
3. **Form Validation**: Client-side validation using Zod schema matching WhiteBooks rules
4. **API Payload**: Final JSON matches WhiteBooks "Complete Json" sheet exactly
5. **Master Codes**: All dropdowns use values from WhiteBooks "Master Codes" sheet
6. **Error Messages**: User-friendly messages mapped from WhiteBooks error codes

## File Structure

```
src/
├── app/(dashboard)/eway/
│   └── generate-whitebooks/
│       └── page.tsx              # Main form component
├── services/gst/
│   └── ewaybill-whitebooks.service.ts  # WhiteBooks API service
├── constants/
│   └── ewaybillMasterCodes.ts    # Master codes and validation rules
└── docs/
    └── whitebooks-ewaybill-specification.md  # This file
```

## Access

Navigate to: `/eway/generate-whitebooks`

This page implements the complete WhiteBooks E-Way Bill specification as per Excel reference file.
