/**
 * E-Invoice Print Layout Component
 * 
 * Government NIC IRP E-Invoice format - Print Ready
 * EXACT match to Government PDF structure
 */

"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import Image from "next/image";
import esignLogo from "@/image/esign_logo.png";

export interface EInvoicePrintData {
  supplierGSTIN: string;
  supplierName: string;
  supplierAddress: {
    line1: string;
    line2?: string;
    city: string;
    district?: string;
    pin: string;
    state: string;
  };

  recipientGSTIN: string;
  recipientName: string;
  recipientAddress: {
    line1: string;
    line2?: string;
    city: string;
    pin: string;
    state: string;
    placeOfSupply: string;
  };

  shipToGSTIN?: string;
  shipToName?: string;
  shipToAddress?: {
    line1: string;
    line2?: string;
    city: string;
    pin: string;
    state: string;
  };

  irn: string;
  ackNo: string;
  ackDateTime: string;

  supplyTypeCode: string;
  documentNo: string;
  documentType: string;
  documentDate: string;
  placeOfSupply: string;

  items: Array<{
    slNo: number;
    description: string;
    hsn: string;
    qty: number;
    unit: string;
    unitPrice: number;
    discount: number;
    taxable: number;
    taxRateText: string;
    otherCharges: number;
    total: number;
  }>;

  summary: {
    taxableAmt: number;
    cgstAmt: number;
    sgstAmt: number;
    igstAmt: number;
    cessAmt: number;
    stateCessAmt: number;
    discount: number;
    otherCharges: number;
    roundOff: number;
    totalInvAmt: number;
  };

  ewaybill?: {
    ewayBillNo: string;
    ewayBillDate: string;
    validTill: string;
  };

  generatedBy: string;
  printDateTime: string;
  signedByText: string;
  signedOnDateTime: string;
  signedQRCodeBase64?: string;
}

interface EInvoicePrintLayoutProps {
  data: EInvoicePrintData;
}

export function EInvoicePrintLayout({ data }: EInvoicePrintLayoutProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="einvoice-print-container">
      {/* Action Buttons - Hidden in Print */}
      <div className="no-print mb-4 flex justify-end gap-2">
        <Button onClick={handlePrint} variant="outline" size="sm">
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
      </div>

       {/* Main Invoice Container - A4 Size */}
       <div className="einvoice-page bg-white text-black">
         <div className="einvoice-page-inner">
           {/* Header - EXACT as per Screenshot */}
        <div className="einvoice-header">
          <div className="header-container">
            <div className="header-left">
              <div className="header-gstin">{data.supplierGSTIN}</div>
              <div className="header-name">{data.supplierName}</div>
            </div>
            <div className="header-right">
              {data.signedQRCodeBase64 && (
                <Image
                  src={data.signedQRCodeBase64}
                  alt="QR Code"
                  className="header-qrcode"
                  width={100}
                  height={100}
                  unoptimized
                />
              )}
            </div>
          </div>
        </div>

        {/* Section 1: e-Invoice Details - Table Style */}
        <div className="einvoice-section">
          <table className="einvoice-details-table">
            <thead>
              <tr>
                <th colSpan={2} className="einvoice-details-header">1.e-Invoice Details</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="einvoice-detail-cell-left">
                  <span className="einvoice-label">IRN : </span>
                  <span className="einvoice-value break-all">{data.irn}</span>
                </td>
                <td className="einvoice-detail-cell-right">
                  <span className="einvoice-label">Ack. No : </span>
                  <span className="einvoice-value">{data.ackNo}</span>
                  <span className="einvoice-label einvoice-label-spaced">Ack. Date : </span>
                  <span className="einvoice-value">{data.ackDateTime}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 2: Transaction Details - Table Style */}
        <div className="einvoice-section">
          <table className="transaction-details-table">
            <thead>
              <tr>
                <th colSpan={2} className="transaction-details-header">2. Transaction Details</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="transaction-detail-cell">
                  <span className="einvoice-label">Supply Type Code : </span>
                  <span className="einvoice-value">{data.supplyTypeCode}</span>
                </td>
                <td className="transaction-detail-cell">
                  <span className="einvoice-label">Document No : </span>
                  <span className="einvoice-value">{data.documentNo}</span>
                </td>
              </tr>
              <tr>
                <td className="transaction-detail-cell">
                  <span className="einvoice-label">Place of Supply : </span>
                  <span className="einvoice-value">{data.placeOfSupply}</span>
                </td>
                <td className="transaction-detail-cell">
                  <span className="einvoice-label">Document Type : </span>
                  <span className="einvoice-value">{data.documentType}</span>
                </td>
              </tr>
              <tr>
                <td className="transaction-detail-cell" colSpan={2}>
                  <span className="einvoice-label">Document Date : </span>
                  <span className="einvoice-value">{data.documentDate}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 3: Party Details - EXACT as per Screenshot */}
        <div className="einvoice-section">
          <table className="party-details-table">
            <thead>
              <tr>
                <th colSpan={3} className="party-details-header">3. Party Details</th>
              </tr>
            </thead>
            <tbody>
              {/* Row 1: Supplier and Recipient */}
              <tr>
                {/* Supplier - Left Column */}
                <td className="party-block-cell">
                  <div className="party-title">Supplier:</div>
                  <div className="party-content">
                    <div>
                      <span className="einvoice-label">GSTIN : </span>
                      <span className="einvoice-value">{data.supplierGSTIN}</span>
                    </div>
                    <div className="party-name">{data.supplierName}</div>
                    <div>{data.supplierAddress.line1}{data.supplierAddress.line2 ? `, ${data.supplierAddress.line2}` : ''}</div>
                    <div>
                      {data.supplierAddress.city}
                      {data.supplierAddress.district && `, ${data.supplierAddress.district}`}
                    </div>
                    <div>
                      {data.supplierAddress.pin} {data.supplierAddress.state}
                    </div>
                  </div>
                </td>

                {/* Recipient - Right Column */}
                <td className="party-block-cell" colSpan={2}>
                  <div className="party-title">Recipient:</div>
                  <div className="party-content">
                    <div>
                      <span className="einvoice-label">GSTIN : </span>
                      <span className="einvoice-value">{data.recipientGSTIN}</span>
                    </div>
                    <div className="party-name">{data.recipientName}</div>
                    <div>{data.recipientAddress.line1}{data.recipientAddress.line2 ? `, ${data.recipientAddress.line2}` : ''}</div>
                    <div>{data.recipientAddress.city}</div>
                    <div>
                      {data.recipientAddress.pin} {data.recipientAddress.state}
                    </div>
                    <div>
                      Place of Supply: {data.recipientAddress.placeOfSupply}
                    </div>
                  </div>
                </td>
              </tr>
              {/* Row 2: Ship To */}
              {data.shipToGSTIN && data.shipToAddress && (
                <tr>

                  <td className="party-block-cell" style={{ borderRight: "none" }}>
                    <div className="party-title">Ship To:</div>
                    <div className="party-content">
                      <div>
                        <span className="einvoice-label">GSTIN : </span>
                        <span className="einvoice-value">{data.shipToGSTIN}</span>
                      </div>
                      {data.shipToName && <div className="party-name">{data.shipToName}</div>}
                      <div>{data.shipToAddress.line1}{data.shipToAddress.line2 ? `, ${data.shipToAddress.line2}` : ''}</div>
                      <div>{data.shipToAddress.city}</div>
                      <div>
                        {data.shipToAddress.pin} {data.shipToAddress.state}
                      </div>
                    </div>
                  </td>
                  <td className="party-block-cell" colSpan={2}></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Section 4: Details of Goods / Services - Separate Table */}
        <div className="einvoice-section">
          <table className="goods-services-table">
            <thead>
              <tr>
                <th colSpan={11} className="goods-services-header">4. Details of Goods / Services</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={11} className="goods-services-content-cell">
                  {/* Main Items Table */}
                  <div className="items-table-container">
                    <table className="einvoice-items-table">
                      <thead>
                        <tr>
                          <th>S.No</th>
                          <th>Item Description</th>
                          <th>HSN Code</th>
                          <th>Quantity</th>
                          <th>Unit</th>
                          <th>Unit Price(Rs)</th>
                          <th>Discount(Rs)</th>
                          <th>Taxable Amount(Rs)</th>
                          <th className="tax-rate-header">
                            Tax Rate<br />
                            (GST+Cess | State Cess+Cess Non.Advol)
                          </th>
                          <th>Other charges(Rs)</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="text-center">{item.slNo}</td>
                            <td>{item.description}</td>
                            <td className="text-center">{item.hsn}</td>
                            <td className="text-center">{item.qty}</td>
                            <td className="text-center">{item.unit}</td>
                            <td className="text-right">{item.unitPrice.toFixed(2)}</td>
                            <td className="text-right">{item.discount > 0 ? item.discount.toFixed(2) : ""}</td>
                            <td className="text-right">{item.taxable.toFixed(2)}</td>
                            <td className="text-center tax-rate-cell">{item.taxRateText}</td>
                            <td className="text-right">{item.otherCharges > 0 ? item.otherCharges.toFixed(2) : ""}</td>
                            <td className="text-right font-semibold">{item.total.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Summary of Amounts - Separate Table */}
        <div className="einvoice-section">
          <table className="summary-amounts-table">
            <thead>
              <tr>
                <th colSpan={10} className="summary-amounts-header">Summary of Amounts</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={10} className="summary-amounts-content-cell">
                  <table className="einvoice-summary-table">
                    <tbody>
                      <tr>
                        <td className="summary-label">Tax&apos;ble Amt</td>
                        <td className="summary-label">CGST Amt</td>
                        <td className="summary-label">SGST Amt</td>
                        <td className="summary-label">IGST Amt</td>
                        <td className="summary-label">CESS Amt</td>
                        <td className="summary-label">State CESS Amt</td>
                        <td className="summary-label">Discount</td>
                        <td className="summary-label">Other Charges</td>
                        <td className="summary-label">Round off</td>
                        <td className="summary-label-total">Total Inv. Amt</td>
                      </tr>
                      <tr>
                        <td className="summary-value">{data.summary.taxableAmt.toFixed(2)}</td>
                        <td className="summary-value">{data.summary.cgstAmt.toFixed(2)}</td>
                        <td className="summary-value">{data.summary.sgstAmt.toFixed(2)}</td>
                        <td className="summary-value">{data.summary.igstAmt.toFixed(2)}</td>
                        <td className="summary-value">
                          {data.summary.cessAmt > 0 ? data.summary.cessAmt.toFixed(2) : ""}
                        </td>
                        <td className="summary-value">
                          {data.summary.stateCessAmt > 0 ? data.summary.stateCessAmt.toFixed(2) : ""}
                        </td>
                        <td className="summary-value">
                          {data.summary.discount > 0 ? data.summary.discount.toFixed(2) : ""}
                        </td>
                        <td className="summary-value">
                          {data.summary.otherCharges > 0 ? data.summary.otherCharges.toFixed(2) : ""}
                        </td>
                        <td className="summary-value">
                          {data.summary.roundOff !== 0 ? data.summary.roundOff.toFixed(2) : ""}
                        </td>
                        <td className="summary-value-total">{data.summary.totalInvAmt.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 5: E-Waybill Details - Table Format */}
        {data.ewaybill && (
          <div className="einvoice-section">
            <table className="ewaybill-details-table">
              <thead>
                <tr>
                  <th colSpan={3} className="ewaybill-details-header">5. E-Waybill Details</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="ewaybill-detail-cell">
                    <span className="einvoice-label">Eway Bill No : </span>
                    <span className="einvoice-value">{data.ewaybill.ewayBillNo}</span>
                  </td>
                  <td className="ewaybill-detail-cell">
                    <span className="einvoice-label">Eway Bill Date : </span>
                    <span className="einvoice-value">{data.ewaybill.ewayBillDate}</span>
                  </td>
                  <td className="ewaybill-detail-cell">
                    <span className="einvoice-label">Valid Till Date : </span>
                    <span className="einvoice-value">{data.ewaybill.validTill}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Footer - Table Format */}
        <div className="einvoice-section">
          <table className="footer-table">
            <tbody>
              <tr>
                <td className="footer-cell">
                  <div>
                    <span className="einvoice-label">Generated By : </span>
                    <span className="einvoice-value">{data.generatedBy}</span>
                  </div>
                  <div>
                    <span className="einvoice-label">Print Date : </span>
                    <span className="einvoice-value">{data.printDateTime}</span>
                  </div>
                </td>
                <td className="footer-cell">
                  {data.ewaybill && data.ewaybill.ewayBillNo ? (
                    <div className="ewaybill-barcode-container">
                      <Image
                        src={`https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(data.ewaybill.ewayBillNo)}&code=Code128&dpi=96&dataseparator=&hidehrt=true`}
                        alt={`E-Waybill Barcode: ${data.ewaybill.ewayBillNo}`}
                        className="ewaybill-barcode"
                        width={200}
                        height={50}
                        unoptimized
                      />
                      <div className="ewaybill-barcode-number">{data.ewaybill.ewayBillNo}</div>
                    </div>
                  ) : (
                    <div className="ack-no-barcode">{data.ackNo}</div>
                  )}
                </td>
                <td className="footer-cell">
                  <div className="esign-logo-container">
                    <Image
                      src={esignLogo}
                      alt="eSign Logo"
                      className="esign-logo"
                      width={60}
                      height={40}
                      priority
                    />
                  </div>
                  <div>{data.signedByText}</div>
                  <div>
                    <span className="einvoice-label">on: </span>
                    <span className="einvoice-value">{data.signedOnDateTime}</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        </div>
      </div>
    </div>
  );
}
