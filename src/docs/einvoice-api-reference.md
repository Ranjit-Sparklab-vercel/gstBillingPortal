# E-Invoice API Reference

This document provides complete API reference for E-Invoice integration based on Whitebooks API.

## Base URL
- Sandbox: `https://apisandbox.whitebooks.in`
- Production: `https://api.whitebooks.in`

## Authentication

### Endpoint
```
GET /einvoice/authenticate?email={email}
```

### Headers
```
username: API_{GSTIN}
password: {password}
ip_address: {ip_address}
client_id: {client_id}
client_secret: {client_secret}
gstin: {gstin}
```

### Response
```json
{
  "status_cd": "Sucess",
  "status_desc": "Success",
  "data": {
    "AuthToken": "token_string",
    "TokenExpiry": "expiry_date"
  }
}
```

---

## Get GSTN Details

### Endpoint
```
GET /einvoice/type/GSTNDETAILS/version/V1_03?param1={gstin}&email={email}
```

### Headers
```
username: API_{GSTIN}
ip_address: {ip_address}
client_id: {client_id}
client_secret: {client_secret}
gstin: {gstin}
auth-token: {AuthToken}
```

### Parameters
- `param1`: GSTIN (15 characters)
- `email`: Email address

### Response Fields
- `LegalName`: Legal name
- `TradeName`: Trade name
- `AddrBnm`: Building name
- `AddrBno`: Building number
- `AddrSt`: Street
- `AddrLoc`: Location
- `StateCode`: State code
- `AddrPncd`: Pincode

---

## Generate IRN

### Endpoint
```
POST /einvoice/type/GENERATE/version/V1_03?email={email}
```

### Headers
```
email: {email}
username: API_{GSTIN}
password: {password}
ip_address: {ip_address}
client_id: {client_id}
client_secret: {client_secret}
gstin: {gstin}
auth-token: {AuthToken}
```

### Payload Structure

```typescript
{
  Version: "1.1",
  TranDtls: {
    TaxSch: "GST",
    SupTyp: "B2B" | "B2C" | "SEZWP" | "SEZWOP" | "EXPWP" | "EXPWOP" | "DEXP"
  },
  DocDtls: {
    Typ: "INV" | "CRN" | "DBN",
    No: "Document Number",
    Dt: "dd/MM/yyyy"
  },
  SellerDtls: {
    Gstin: "15 character GSTIN",
    LglNm: "Legal Name",
    TrdNm: "Trade Name",
    Addr1: "Address Line 1",
    Addr2: "Address Line 2",
    Loc: "Location",
    Pin: "Pincode",
    Stcd: "State Code"
  },
  BuyerDtls: {
    Gstin: "15 character GSTIN",
    LglNm: "Legal Name",
    TrdNm: "Trade Name",
    Pos: "Place of Supply State Code",
    Addr1: "Address Line 1",
    Addr2: "Address Line 2",
    Loc: "Location",
    Pin: "Pincode",
    Stcd: "State Code"
  },
  ShipDtls: {
    Gstin: "15 character GSTIN",
    LglNm: "Legal Name",
    Addr1: "Address",
    Loc: "Location",
    Pin: "Pincode",
    Stcd: "State Code"
  },
  ItemList: [
    {
      SlNo: "1",
      IsServc: "N" | "Y",
      PrdDesc: "Product Description",
      HsnCd: "HSN Code",
      Qty: "Quantity",
      Unit: "Unit",
      UnitPrice: "Unit Price",
      TotAmt: "Total Amount",
      AssAmt: "Assessable Amount",
      GstRt: "GST Rate",
      SgstAmt: "SGST Amount",
      IgstAmt: "IGST Amount",
      CgstAmt: "CGST Amount",
      TotItemVal: "Total Item Value"
    }
  ],
  ValDtls: {
    AssVal: "Assessable Value",
    CgstVal: "CGST Value",
    SgstVal: "SGST Value",
    IgstVal: "IGST Value",
    TotInvVal: "Total Invoice Value"
  },
  EwbDtls: {
    Transname: "Transporter Name",
    Distance: "Distance in KM",
    Transdocno: "Transport Document Number",
    Vehno: "Vehicle Number",
    Vehtype: "R" | "O",
    TransMode: "1" | "2" | "3" | "4"
  }
}
```

### Response
```json
{
  "status_cd": "1",
  "status_desc": "Success",
  "data": {
    "Irn": "IRN string",
    "AckNo": "Acknowledgment Number",
    "AckDt": "Acknowledgment Date",
    "EwayBillNo": "E-Way Bill Number (if generated)",
    "EwayBillDate": "E-Way Bill Date",
    "QRCode": "QR Code URL"
  }
}
```

---

## Get IRN by Document Details

### Endpoint
```
POST /einvoice/type/GETIRNBYDOC/version/V1_03?email={email}
```

### Headers
Same as GSTN Details

### Body
```json
{
  "docNo": "Document Number",
  "docDt": "dd/MM/yyyy",
  "docTyp": "INV" | "CRN" | "DBN"
}
```

---

## Cancel IRN

### Endpoint
```
POST /einvoice/type/CANCELIRN/version/V1_03?email={email}
```

### Headers
Same as Generate IRN

### Body
```json
{
  "irn": "IRN to cancel",
  "reason": "Cancellation reason",
  "remark": "Optional remark"
}
```

---

## Get Rejected IRNs

### Endpoint
```
GET /einvoice/type/GETREJECTEDIRN/version/V1_03?email={email}&param1={fromDate}&param2={toDate}&param3={gstin}
```

### Headers
Same as GSTN Details

---

## Get E-Way Bill by IRN

### Endpoint
```
GET /einvoice/type/GETEWAYBILL/version/V1_03?param1={irn}&email={email}
```

### Headers
Same as GSTN Details

---

## Get B2C QR Code

### Endpoint
```
POST /einvoice/type/GETB2CQR/version/V1_03?email={email}
```

### Headers
Same as GSTN Details

### Body
```json
{
  "docNo": "Document Number",
  "docDt": "dd/MM/yyyy",
  "docTyp": "INV"
}
```

---

## Important Notes

1. **Authentication**: Token expires after certain time, re-authenticate when needed
2. **Date Format**: Always use `dd/MM/yyyy` format
3. **GSTIN**: Must be exactly 15 characters
4. **GST Rate Calculation**: 
   - If IGST > 0, use IGST rate only
   - If IGST = 0, use CGST + SGST combined rate
5. **State Codes**: Use numeric state codes (1-38, 96, 97)
6. **Transport Mode**: 1=Road, 2=Rail, 3=Air, 4=Ship
7. **Vehicle Type**: R=Regular, O=Over Dimensional Cargo
