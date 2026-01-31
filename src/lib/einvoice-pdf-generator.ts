/**
 * E-Invoice PDF Generator
 * 
 * Generates government-compliant PDF for E-Invoice
 * Matches exact Government E-Invoice format
 * Uses jsPDF library
 * 
 * PDF includes:
 * - Complete invoice data
 * - IRN
 * - Ack No & Date
 * - Signed QR Code
 * - Transaction Details
 * - Party Details (Supplier, Recipient, Ship To)
 * - Item Details with Tax Rates
 * - E-Waybill Details
 */

import jsPDF from "jspdf";

export interface EInvoicePDFData {
  // IRN Details
  irn: string;
  ackNo: string;
  ackDate: string;
  status: string;
  qrCode?: string;
  
  // Document Details
  docType: string;
  docNo: string;
  docDate: string;
  
  // Transaction Details
  supplyType?: string;
  placeOfSupply?: string;
  
  // Seller Details
  sellerGstin: string;
  sellerTradeName: string;
  sellerLegalName: string;
  sellerAddr1: string;
  sellerAddr2?: string;
  sellerLocation: string;
  sellerPincode: string;
  sellerStateCode: string;
  
  // Buyer Details
  buyerGstin: string;
  buyerTradeName: string;
  buyerLegalName: string;
  buyerAddr1: string;
  buyerAddr2?: string;
  buyerLocation: string;
  buyerPincode: string;
  buyerStateCode: string;
  
  // Ship To Details (optional)
  shipToGstin?: string;
  shipToTradeName?: string;
  shipToLegalName?: string;
  shipToAddr1?: string;
  shipToAddr2?: string;
  shipToLocation?: string;
  shipToPincode?: string;
  shipToStateCode?: string;
  
  // Item List
  items: Array<{
    slNo: string;
    productName: string;
    hsn: string;
    quantity: string;
    unit: string;
    rate: number;
    discount?: number;
    taxableAmount: number;
    taxRate?: number;
    cgstRate?: number;
    sgstRate?: number;
    igstRate?: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    otherCharges?: number;
    total: number;
  }>;
  
  // Value Details
  taxableValue: number;
  cgstValue: number;
  sgstValue: number;
  igstValue: number;
  cessValue: number;
  totalValue: number;
  
  // E-Waybill Details
  ewbNo?: string;
  ewbDate?: string;
  ewbValidTill?: string;
  
  // Footer
  generatedBy?: string;
  printDate?: string;
}

/**
 * Generate E-Invoice PDF - Government Format
 */
export async function generateEInvoicePDF(data: EInvoicePDFData): Promise<Blob> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - 2 * margin;
  let yPos = margin;

  // Helper function to add text with word wrap
  const addText = (
    text: string,
    x: number,
    y: number,
    maxWidth?: number,
    fontSize: number = 10,
    fontStyle: "normal" | "bold" | "italic" = "normal",
    align: "left" | "center" | "right" = "left"
  ) => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", fontStyle);
    if (maxWidth) {
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y, { align });
      return lines.length * (fontSize * 0.4);
    } else {
      doc.text(text, x, y, { align });
      return fontSize * 0.4;
    }
  };

  // Helper function to check if new page needed
  const checkNewPage = (requiredHeight: number) => {
    if (yPos + requiredHeight > pageHeight - margin - 20) {
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // Helper to load image
  const loadImage = async (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      
      if (src.startsWith("data:image")) {
        img.src = src;
      } else if (src.startsWith("http://") || src.startsWith("https://")) {
        // For URLs, try to fetch as blob first to handle CORS
        fetch(src)
          .then((response) => response.blob())
          .then((blob) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              img.src = reader.result as string;
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          })
          .catch(() => {
            // Fallback to direct URL
            img.src = src;
          });
      } else {
        img.src = src;
      }
    });
  };

  // ============================================================================
  // HEADER: Supplier GSTIN + Name (Top Left) | QR Code (Top Right)
  // ============================================================================
  const headerY = yPos;
  
  // Left: Supplier GSTIN + Trade Name
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  const supplierHeader = `${data.sellerGstin} ${data.sellerTradeName}`;
  addText(supplierHeader, margin, headerY, 80, 12, "bold");
  
  // Right: QR Code
  if (data.qrCode) {
    try {
      let qrImageData: string;
      
      if (data.qrCode.startsWith("data:image")) {
        qrImageData = data.qrCode;
      } else if (data.qrCode.startsWith("http://") || data.qrCode.startsWith("https://")) {
        qrImageData = data.qrCode;
      } else if (data.qrCode.startsWith("eyJ")) {
        // JWT token - generate QR code image
        qrImageData = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data.qrCode)}`;
      } else {
        qrImageData = `data:image/png;base64,${data.qrCode}`;
      }
      
      const img = await loadImage(qrImageData);
      const qrSize = 30;
      const qrX = pageWidth - margin - qrSize;
      doc.addImage(img, "PNG", qrX, headerY - 5, qrSize, qrSize);
      
      // Note below QR code
      doc.setFontSize(6);
      doc.setFont("helvetica", "italic");
      doc.text(String("Signed QR Code"), qrX + qrSize / 2, headerY + qrSize + 3, { align: "center" });
    } catch (error) {
      console.error("Error loading QR code:", error);
    }
  }
  
  yPos = headerY + 15;

  // ============================================================================
  // 1. e-Invoice Details
  // ============================================================================
  checkNewPage(20);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  yPos += addText("1. e-Invoice Details", margin, yPos, contentWidth, 10, "bold");
  yPos += 5;
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  yPos += addText(`IRN: ${data.irn}`, margin + 5, yPos, contentWidth - 10, 9);
  yPos += 4;
  yPos += addText(`Ack. No: ${data.ackNo}`, margin + 5, yPos, contentWidth - 10, 9);
  yPos += 4;
  yPos += addText(`Ack. Date: ${data.ackDate}`, margin + 5, yPos, contentWidth - 10, 9);
  yPos += 8;

  // ============================================================================
  // 2. Transaction Details
  // ============================================================================
  checkNewPage(25);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  yPos += addText("2. Transaction Details", margin, yPos, contentWidth, 10, "bold");
  yPos += 5;
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  if (data.supplyType) {
    yPos += addText(`Supply Type Code: ${data.supplyType}`, margin + 5, yPos, contentWidth - 10, 9);
    yPos += 4;
  }
  yPos += addText(`Document No: ${data.docNo}`, margin + 5, yPos, contentWidth - 10, 9);
  yPos += 4;
  if (data.placeOfSupply) {
    yPos += addText(`Place of Supply: ${data.placeOfSupply}`, margin + 5, yPos, contentWidth - 10, 9);
    yPos += 4;
  }
  yPos += addText(`Document Type: ${data.docType || "Tax Invoice"}`, margin + 5, yPos, contentWidth - 10, 9);
  yPos += 4;
  yPos += addText(`Document Date: ${data.docDate}`, margin + 5, yPos, contentWidth - 10, 9);
  yPos += 8;

  // ============================================================================
  // 3. Party Details
  // ============================================================================
  checkNewPage(60);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  yPos += addText("3. Party Details", margin, yPos, contentWidth, 10, "bold");
  yPos += 5;
  
  const partyColWidth = (contentWidth - 20) / 3; // 3 columns: Supplier, Recipient, Ship To
  const partyStartY = yPos;
  let partyMaxY = yPos;
  
  // Supplier
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  let partyY = partyStartY;
  partyY += addText("Supplier:", margin + 5, partyY, partyColWidth, 9, "bold");
  partyY += 3;
  doc.setFont("helvetica", "normal");
  partyY += addText(`GSTIN: ${data.sellerGstin}`, margin + 5, partyY, partyColWidth, 8);
  partyY += 3;
  partyY += addText(`Name: ${data.sellerTradeName}`, margin + 5, partyY, partyColWidth, 8);
  partyY += 3;
  const sellerAddr = `${data.sellerAddr1}${data.sellerAddr2 ? `, ${data.sellerAddr2}` : ""}, ${data.sellerLocation} ${data.sellerPincode}`;
  partyY += addText(`Address: ${sellerAddr}`, margin + 5, partyY, partyColWidth, 8);
  partyMaxY = Math.max(partyMaxY, partyY);
  
  // Recipient
  partyY = partyStartY;
  doc.setFont("helvetica", "bold");
  partyY += addText("Recipient:", margin + 5 + partyColWidth, partyY, partyColWidth, 9, "bold");
  partyY += 3;
  doc.setFont("helvetica", "normal");
  partyY += addText(`GSTIN: ${data.buyerGstin}`, margin + 5 + partyColWidth, partyY, partyColWidth, 8);
  partyY += 3;
  partyY += addText(`Name: ${data.buyerTradeName}`, margin + 5 + partyColWidth, partyY, partyColWidth, 8);
  partyY += 3;
  const buyerAddr = `${data.buyerAddr1}${data.buyerAddr2 ? `, ${data.buyerAddr2}` : ""}, ${data.buyerLocation} ${data.buyerPincode}${data.placeOfSupply ? ` Place of Supply: ${data.placeOfSupply}` : ""}`;
  partyY += addText(`Address: ${buyerAddr}`, margin + 5 + partyColWidth, partyY, partyColWidth, 8);
  partyMaxY = Math.max(partyMaxY, partyY);
  
  // Ship To (if available)
  if (data.shipToGstin) {
    partyY = partyStartY;
    doc.setFont("helvetica", "bold");
    partyY += addText("Ship To:", margin + 5 + (partyColWidth * 2), partyY, partyColWidth, 9, "bold");
    partyY += 3;
    doc.setFont("helvetica", "normal");
    partyY += addText(`GSTIN: ${data.shipToGstin}`, margin + 5 + (partyColWidth * 2), partyY, partyColWidth, 8);
    partyY += 3;
    if (data.shipToTradeName) {
      partyY += addText(`Name: ${data.shipToTradeName}`, margin + 5 + (partyColWidth * 2), partyY, partyColWidth, 8);
      partyY += 3;
    }
    if (data.shipToAddr1) {
      const shipToAddr = `${data.shipToAddr1}${data.shipToAddr2 ? `, ${data.shipToAddr2}` : ""}, ${data.shipToLocation || ""} ${data.shipToPincode || ""}`;
      partyY += addText(`Address: ${shipToAddr}`, margin + 5 + (partyColWidth * 2), partyY, partyColWidth, 8);
    }
    partyMaxY = Math.max(partyMaxY, partyY);
  }
  
  yPos = partyMaxY + 8;

  // ============================================================================
  // 4. Details of Goods / Services
  // ============================================================================
  checkNewPage(80);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  yPos += addText("4. Details of Goods / Services", margin, yPos, contentWidth, 10, "bold");
  yPos += 5;
  
  // Table Header
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  const tableYStart = yPos;
  let tableY = tableYStart;
  
  // Draw table border
  const tableRowHeight = 6;
  const colWidths = [8, 35, 15, 12, 12, 12, 15, 20, 12, 15]; // S.No, Item Desc, HSN, Qty, Unit, Unit Price, Discount, Taxable Amt, Tax Rate, Other charges, Total
  let colX = margin + 5;
  
  // Header row
  doc.rect(margin + 5, tableY - 4, contentWidth - 10, tableRowHeight);
  addText("S.No", colX, tableY, colWidths[0], 7, "bold");
  colX += colWidths[0];
  addText("Item Description", colX, tableY, colWidths[1], 7, "bold");
  colX += colWidths[1];
  addText("HSN Code", colX, tableY, colWidths[2], 7, "bold");
  colX += colWidths[2];
  addText("Quantity", colX, tableY, colWidths[3], 7, "bold");
  colX += colWidths[3];
  addText("Unit", colX, tableY, colWidths[4], 7, "bold");
  colX += colWidths[4];
  addText("Unit Price(Rs)", colX, tableY, colWidths[5], 7, "bold");
  colX += colWidths[5];
  addText("Discount(Rs)", colX, tableY, colWidths[6], 7, "bold");
  colX += colWidths[6];
  addText("Taxable Value (Rs)", colX, tableY, colWidths[7], 7, "bold");
  colX += colWidths[7];
  addText("Tax Rate", colX, tableY, colWidths[8], 7, "bold");
  colX += colWidths[8];
  addText("Other", colX, tableY, colWidths[9], 7, "bold");
  colX += colWidths[9];
  addText("Total (Rs)", colX, tableY, 15, 7, "bold");
  
  tableY += tableRowHeight;
  doc.setFont("helvetica", "normal");
  
  // Table Rows
  data.items.forEach((item) => {
    checkNewPage(tableRowHeight + 2);
    doc.rect(margin + 5, tableY - 4, contentWidth - 10, tableRowHeight);
    colX = margin + 5;
    
    addText(item.slNo, colX, tableY, colWidths[0], 7);
    colX += colWidths[0];
    addText(item.productName.substring(0, 25), colX, tableY, colWidths[1], 7);
    colX += colWidths[1];
    addText(item.hsn, colX, tableY, colWidths[2], 7);
    colX += colWidths[2];
    addText(item.quantity, colX, tableY, colWidths[3], 7);
    colX += colWidths[3];
    addText(item.unit, colX, tableY, colWidths[4], 7);
    colX += colWidths[4];
    addText(item.rate.toFixed(2), colX, tableY, colWidths[5], 7);
    colX += colWidths[5];
    addText((item.discount || 0).toFixed(2), colX, tableY, colWidths[6], 7);
    colX += colWidths[6];
    addText(item.taxableAmount.toFixed(2), colX, tableY, colWidths[7], 7);
    colX += colWidths[7];
    
    // Tax Rate: Format as "18.00" (simple format as per image)
    const taxRateText = item.taxRate 
      ? item.taxRate.toFixed(2)
      : item.cgstRate && item.sgstRate
      ? (parseFloat(String(item.cgstRate)) + parseFloat(String(item.sgstRate))).toFixed(2)
      : item.igstRate
      ? item.igstRate.toFixed(2)
      : "0.00";
    addText(taxRateText, colX, tableY, colWidths[8], 7);
    colX += colWidths[8];
    
    addText((item.otherCharges || 0).toFixed(2), colX, tableY, colWidths[9], 7);
    colX += colWidths[9];
    addText(item.total.toFixed(2), colX, tableY, 15, 7);
    
    tableY += tableRowHeight;
  });
  
  yPos = tableY + 5;
  
  // Summary of Amounts
  checkNewPage(20);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  yPos += addText("Summary of Amounts", margin + 5, yPos, contentWidth - 10, 8, "bold");
  yPos += 4;
  
  doc.setFont("helvetica", "normal");
  const summaryX = margin + 5;
  const summaryWidth = 50;
  yPos += addText(`Tax'ble Amt: ₹${data.taxableValue.toFixed(2)}`, summaryX, yPos, summaryWidth, 8);
  yPos += 4;
  if (data.cgstValue > 0) {
    yPos += addText(`CGST Amt: ₹${data.cgstValue.toFixed(2)}`, summaryX, yPos, summaryWidth, 8);
    yPos += 4;
  }
  if (data.sgstValue > 0) {
    yPos += addText(`SGST Amt: ₹${data.sgstValue.toFixed(2)}`, summaryX, yPos, summaryWidth, 8);
    yPos += 4;
  }
  if (data.igstValue > 0) {
    yPos += addText(`IGST Amt: ₹${data.igstValue.toFixed(2)}`, summaryX, yPos, summaryWidth, 8);
    yPos += 4;
  }
  doc.setFont("helvetica", "bold");
  yPos += addText(`Total Inv. Amt: ₹${data.totalValue.toFixed(2)}`, summaryX, yPos, summaryWidth, 8, "bold");
  yPos += 8;

  // ============================================================================
  // 5. E-Waybill Details
  // ============================================================================
  if (data.ewbNo) {
    checkNewPage(20);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    yPos += addText("5. E-Waybill Details", margin, yPos, contentWidth, 10, "bold");
    yPos += 5;
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    yPos += addText(`Eway Bill No: ${data.ewbNo}`, margin + 5, yPos, contentWidth - 10, 9);
    yPos += 4;
    if (data.ewbDate) {
      yPos += addText(`Eway Bill Date: ${data.ewbDate}`, margin + 5, yPos, contentWidth - 10, 9);
      yPos += 4;
    }
    if (data.ewbValidTill) {
      yPos += addText(`Valid Till Date: ${data.ewbValidTill}`, margin + 5, yPos, contentWidth - 10, 9);
      yPos += 4;
    }
    yPos += 8;
  }

  // ============================================================================
  // FOOTER: Generated By, Print Date, Barcode, eSign
  // ============================================================================
  const footerY = pageHeight - 20;
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  
  // Generated By
  if (data.generatedBy) {
    doc.text(String(`Generated By: ${data.generatedBy}`), margin + 5, footerY, { align: "left" });
  }
  
  // Print Date
  const printDate = data.printDate || new Date().toLocaleString("en-IN", { 
    day: "2-digit", 
    month: "2-digit", 
    year: "numeric", 
    hour: "2-digit", 
    minute: "2-digit", 
    second: "2-digit" 
  });
  doc.text(String(`Print Date: ${printDate}`), pageWidth / 2, footerY, { align: "center" });
  
  // eSign
  doc.text(String(`eSign: Digitally Signed by NIC-IRP on: ${data.ackDate || ""}`), pageWidth - margin - 5, footerY, { align: "right" });
  
  // Barcode (using Ack No)
  const barcodeY = footerY + 5;
  doc.setFontSize(6);
  doc.text(String(data.ackNo || ""), pageWidth / 2, barcodeY, { align: "center" });

  // Generate blob
  const pdfBlob = doc.output("blob");
  return pdfBlob;
}

/**
 * Download E-Invoice PDF
 */
export async function downloadEInvoicePDF(data: EInvoicePDFData): Promise<void> {
  try {
    const blob = await generateEInvoicePDF(data);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `E-Invoice-${data.docNo}-${data.irn.substring(0, 10)}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
}

/**
 * Print E-Invoice PDF
 */
export async function printEInvoicePDF(data: EInvoicePDFData): Promise<void> {
  try {
    const blob = await generateEInvoicePDF(data);
    const url = URL.createObjectURL(blob);
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = url;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(url);
      }, 1000);
    };
  } catch (error) {
    console.error("Error printing PDF:", error);
    throw error;
  }
}

/**
 * Share E-Invoice PDF (WhatsApp / Email)
 */
export async function shareEInvoicePDF(
  data: EInvoicePDFData,
  method: "whatsapp" | "email"
): Promise<void> {
  try {
    const blob = await generateEInvoicePDF(data);
    
    if (method === "whatsapp") {
      const url = URL.createObjectURL(blob);
      const shareText = `E-Invoice: ${data.docNo}\nIRN: ${data.irn}\nDownload: ${window.location.origin}${window.location.pathname}?irn=${data.irn}`;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
      window.open(whatsappUrl, "_blank");
      setTimeout(() => {
        const link = document.createElement("a");
        link.href = url;
        link.download = `E-Invoice-${data.docNo}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
      }, 1000);
    } else if (method === "email") {
      const subject = encodeURIComponent(`E-Invoice: ${data.docNo}`);
      const body = encodeURIComponent(
        `Please find attached E-Invoice.\n\nInvoice No: ${data.docNo}\nIRN: ${data.irn}\nAck No: ${data.ackNo}`
      );
      const mailtoUrl = `mailto:?subject=${subject}&body=${body}`;
      window.location.href = mailtoUrl;
      setTimeout(() => {
        downloadEInvoicePDF(data);
      }, 500);
    }
  } catch (error) {
    console.error("Error sharing PDF:", error);
    throw error;
  }
}
