/**
 * E-Way Bill Print Layout Component
 * 
 * Government-compliant E-Way Bill print layout
 * Exact replica of Government E-Way Bill format
 * 
 * Includes:
 * - Part-A section
 * - Part-B section
 * - QR Code placement
 * - Validity section
 * - Footer format
 */

"use client";

import { EWayBillPDFData } from "@/lib/ewaybill-pdf-generator";
import Image from "next/image";

export interface EWayBillPrintData extends EWayBillPDFData {}

interface EWayBillPrintLayoutProps {
  data: EWayBillPrintData;
}

export function EWayBillPrintLayout({ data }: EWayBillPrintLayoutProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="ewaybill-print-container">
      <style jsx global>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          .ewaybill-print-container {
            margin: 0;
            padding: 0;
          }
        }
        
        .ewaybill-print-container {
          max-width: 210mm;
          margin: 0 auto;
          padding: 20px;
          background: white;
          font-family: Arial, sans-serif;
          font-size: 10pt;
          color: #000;
        }
        
        .ewaybill-header {
          background: #003366;
          color: white;
          padding: 15px;
          text-align: center;
          font-size: 18pt;
          font-weight: bold;
          margin-bottom: 10px;
        }
        
        .ewaybill-number {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-weight: bold;
          font-size: 11pt;
        }
        
        .ewaybill-section {
          margin-bottom: 15px;
        }
        
        .section-header {
          background: #f0f0f0;
          padding: 8px;
          font-weight: bold;
          font-size: 11pt;
          border: 1px solid #000;
        }
        
        .detail-box {
          border: 1px solid #000;
          padding: 10px;
          margin-bottom: 10px;
        }
        
        .detail-box-title {
          font-weight: bold;
          margin-bottom: 8px;
          font-size: 10pt;
        }
        
        .detail-row {
          display: flex;
          margin-bottom: 5px;
          font-size: 9pt;
        }
        
        .detail-label {
          font-weight: bold;
          min-width: 120px;
        }
        
        .detail-value {
          flex: 1;
        }
        
        .two-column {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        
        .item-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 10px;
          font-size: 8pt;
        }
        
        .item-table th,
        .item-table td {
          border: 1px solid #000;
          padding: 5px;
          text-align: left;
        }
        
        .item-table th {
          background: #f0f0f0;
          font-weight: bold;
        }
        
        .item-table td {
          text-align: left;
        }
        
        .value-summary {
          border: 1px solid #000;
          padding: 10px;
          margin-top: 10px;
        }
        
        .value-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
          font-size: 9pt;
        }
        
        .value-total {
          font-weight: bold;
          font-size: 10pt;
          border-top: 2px solid #000;
          padding-top: 5px;
          margin-top: 5px;
        }
        
        .qr-code-container {
          text-align: right;
          margin: 20px 0;
        }
        
        .qr-code-image {
          width: 100px;
          height: 100px;
          border: 1px solid #000;
        }
        
        .footer {
          border-top: 1px solid #000;
          padding-top: 10px;
          margin-top: 20px;
          font-size: 7pt;
          color: #666;
          display: flex;
          justify-content: space-between;
        }
      `}</style>

      {/* Header */}
      <div className="ewaybill-header">
        E-WAY BILL
      </div>

      {/* E-Way Bill Number and Date */}
      <div className="ewaybill-number">
        <span>E-Way Bill No: {data.ewayBillNumber}</span>
        <span>Date: {data.ewayBillDate}</span>
      </div>

      <hr style={{ border: "1px solid #000", marginBottom: "15px" }} />

      {/* Part-A Section */}
      <div className="ewaybill-section">
        <div className="section-header">PART-A</div>

        {/* Document Details */}
        <div className="detail-box">
          <div className="detail-box-title">Document Details</div>
          <div className="detail-row">
            <span className="detail-label">Document Type:</span>
            <span className="detail-value">{data.docType}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Document No:</span>
            <span className="detail-value">{data.docNo}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Document Date:</span>
            <span className="detail-value">{data.docDate}</span>
          </div>
          {data.supplyType && (
            <div className="detail-row">
              <span className="detail-label">Supply Type:</span>
              <span className="detail-value">{data.supplyType}</span>
            </div>
          )}
        </div>

        {/* From and To Party Details */}
        <div className="two-column">
          {/* From Party */}
          <div className="detail-box">
            <div className="detail-box-title">From (Supplier)</div>
            <div className="detail-row">
              <span className="detail-label">GSTIN:</span>
              <span className="detail-value">{data.fromGstin}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Trade Name:</span>
              <span className="detail-value">{data.fromTradeName}</span>
            </div>
            {data.fromLegalName && (
              <div className="detail-row">
                <span className="detail-label">Legal Name:</span>
                <span className="detail-value">{data.fromLegalName}</span>
              </div>
            )}
            <div className="detail-row">
              <span className="detail-label">Address:</span>
              <span className="detail-value">{data.fromAddr1}</span>
            </div>
            {data.fromAddr2 && (
              <div className="detail-row">
                <span className="detail-label"></span>
                <span className="detail-value">{data.fromAddr2}</span>
              </div>
            )}
            <div className="detail-row">
              <span className="detail-label">Place:</span>
              <span className="detail-value">{data.fromPlace}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Pincode:</span>
              <span className="detail-value">{data.fromPincode}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">State:</span>
              <span className="detail-value">{data.fromStateCode} {data.fromStateName ? `(${data.fromStateName})` : ""}</span>
            </div>
          </div>

          {/* To Party */}
          <div className="detail-box">
            <div className="detail-box-title">To (Recipient)</div>
            <div className="detail-row">
              <span className="detail-label">GSTIN:</span>
              <span className="detail-value">{data.toGstin}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Trade Name:</span>
              <span className="detail-value">{data.toTradeName}</span>
            </div>
            {data.toLegalName && (
              <div className="detail-row">
                <span className="detail-label">Legal Name:</span>
                <span className="detail-value">{data.toLegalName}</span>
              </div>
            )}
            <div className="detail-row">
              <span className="detail-label">Address:</span>
              <span className="detail-value">{data.toAddr1}</span>
            </div>
            {data.toAddr2 && (
              <div className="detail-row">
                <span className="detail-label"></span>
                <span className="detail-value">{data.toAddr2}</span>
              </div>
            )}
            <div className="detail-row">
              <span className="detail-label">Place:</span>
              <span className="detail-value">{data.toPlace}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Pincode:</span>
              <span className="detail-value">{data.toPincode}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">State:</span>
              <span className="detail-value">{data.toStateCode} {data.toStateName ? `(${data.toStateName})` : ""}</span>
            </div>
          </div>
        </div>

        {/* Item Details Table */}
        <div className="detail-box">
          <div className="detail-box-title">Item Details</div>
          <table className="item-table">
            <thead>
              <tr>
                <th>Sr</th>
                <th>Product Name</th>
                <th>HSN</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Value</th>
                <th>Tax Rate</th>
                <th>Tax Amt</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, index) => {
                const taxAmt = (item.cgstAmount || 0) + (item.sgstAmount || 0) + (item.igstAmount || 0);
                return (
                  <tr key={index}>
                    <td>{item.slNo}</td>
                    <td>{item.productName}</td>
                    <td>{item.hsn}</td>
                    <td>{item.quantity}</td>
                    <td>{item.unit}</td>
                    <td>{item.taxableValue.toFixed(2)}</td>
                    <td>{item.taxRate || item.igstRate || 0}%</td>
                    <td>{taxAmt.toFixed(2)}</td>
                    <td>{item.total.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Value Summary */}
        <div className="value-summary">
          <div className="value-row">
            <span>Taxable Value:</span>
            <span>₹{data.totalValue.toFixed(2)}</span>
          </div>
          {data.cgstValue && data.cgstValue > 0 && (
            <div className="value-row">
              <span>CGST:</span>
              <span>₹{data.cgstValue.toFixed(2)}</span>
            </div>
          )}
          {data.sgstValue && data.sgstValue > 0 && (
            <div className="value-row">
              <span>SGST:</span>
              <span>₹{data.sgstValue.toFixed(2)}</span>
            </div>
          )}
          {data.igstValue && data.igstValue > 0 && (
            <div className="value-row">
              <span>IGST:</span>
              <span>₹{data.igstValue.toFixed(2)}</span>
            </div>
          )}
          {data.cessValue && data.cessValue > 0 && (
            <div className="value-row">
              <span>CESS:</span>
              <span>₹{data.cessValue.toFixed(2)}</span>
            </div>
          )}
          <div className="value-row value-total">
            <span>Grand Total:</span>
            <span>₹{data.grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <hr style={{ border: "1px solid #000", margin: "15px 0" }} />

      {/* Part-B Section */}
      <div className="ewaybill-section">
        <div className="section-header">PART-B</div>

        <div className="detail-box">
          <div className="detail-box-title">Transport Details</div>
          <div className="detail-row">
            <span className="detail-label">Transport Mode:</span>
            <span className="detail-value">
              {data.transMode === "1" ? "Road" : 
               data.transMode === "2" ? "Rail" : 
               data.transMode === "3" ? "Air" : 
               data.transMode === "4" ? "Ship" : data.transMode}
            </span>
          </div>
          {data.distance && (
            <div className="detail-row">
              <span className="detail-label">Distance:</span>
              <span className="detail-value">{data.distance} KM</span>
            </div>
          )}
          {data.transporterId && (
            <div className="detail-row">
              <span className="detail-label">Transporter ID:</span>
              <span className="detail-value">{data.transporterId}</span>
            </div>
          )}
          {data.transporterName && (
            <div className="detail-row">
              <span className="detail-label">Transporter Name:</span>
              <span className="detail-value">{data.transporterName}</span>
            </div>
          )}
          {data.vehicleNo && (
            <div className="detail-row">
              <span className="detail-label">Vehicle Number:</span>
              <span className="detail-value">{data.vehicleNo}</span>
            </div>
          )}
          {data.vehicleType && (
            <div className="detail-row">
              <span className="detail-label">Vehicle Type:</span>
              <span className="detail-value">
                {data.vehicleType === "R" ? "Regular" : "Over Dimensional Cargo"}
              </span>
            </div>
          )}
          {data.transDocNo && (
            <div className="detail-row">
              <span className="detail-label">Transport Document No:</span>
              <span className="detail-value">{data.transDocNo}</span>
            </div>
          )}
          {data.transDocDate && (
            <div className="detail-row">
              <span className="detail-label">Transport Document Date:</span>
              <span className="detail-value">{data.transDocDate}</span>
            </div>
          )}
        </div>
      </div>

      <hr style={{ border: "1px solid #000", margin: "15px 0" }} />

      {/* Validity Section */}
      <div className="detail-box">
        <div className="detail-box-title">Validity Details</div>
        <div className="detail-row">
          <span className="detail-label">Valid From:</span>
          <span className="detail-value">{data.validFrom}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Valid Until:</span>
          <span className="detail-value">{data.validUntil}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Status:</span>
          <span className="detail-value">{data.status}</span>
        </div>
      </div>

      {/* QR Code */}
      {data.qrCode && (
        <div className="qr-code-container">
          <Image
            src={data.qrCode.startsWith("data:") ? data.qrCode : `data:image/png;base64,${data.qrCode}`}
            alt="E-Way Bill QR Code"
            width={100}
            height={100}
            className="qr-code-image"
            unoptimized
          />
          <div style={{ fontSize: "7pt", marginTop: "5px" }}>Scan QR Code to verify</div>
        </div>
      )}

      {/* Footer */}
      <div className="footer">
        <div>
          {data.generatedBy && <div>Generated By: {data.generatedBy}</div>}
        </div>
        <div>
          Print Date: {data.printDate || new Date().toLocaleString("en-IN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
        <div>
          Generated as per GST E-Way Bill Rules
        </div>
      </div>
    </div>
  );
}
