/**
 * E-Way Bill PDF Generator
 * 
 * Generates government-compliant PDF for E-Way Bill
 * Matches EXACT Government E-Way Bill print format
 * Uses jsPDF library
 * 
 * PDF includes:
 * - Part-A section (Invoice/Consignment Details)
 * - Part-B section (Transport Details)
 * - QR Code placement
 * - Validity section
 * - Footer format
 * 
 * No design deviation allowed - exact replica of govt format
 */

import jsPDF from "jspdf";

export interface EWayBillPDFData {
  // E-Way Bill Details
  ewayBillNumber: string;
  ewayBillDate: string;
  validFrom: string;
  validUntil: string;
  status: string;
  qrCode?: string; // Base64 QR code image
  
  // Part-A: Invoice/Consignment Details
  docType: string; // INV, CHL, BIL, BOE
  docNo: string;
  docDate: string;
  supplyType?: string;
  
  // From Party Details
  fromGstin: string;
  fromTradeName: string;
  fromLegalName?: string;
  fromAddr1: string;
  fromAddr2?: string;
  fromPlace: string;
  fromPincode: string;
  fromStateCode: string;
  fromStateName?: string;
  
  // To Party Details
  toGstin: string;
  toTradeName: string;
  toLegalName?: string;
  toAddr1: string;
  toAddr2?: string;
  toPlace: string;
  toPincode: string;
  toStateCode: string;
  toStateName?: string;
  
  // Item Details
  items: Array<{
    slNo: string;
    productName: string;
    hsn: string;
    quantity: string;
    unit: string;
    taxableValue: number;
    taxRate?: number;
    cgstRate?: number;
    sgstRate?: number;
    igstRate?: number;
    cgstAmount?: number;
    sgstAmount?: number;
    igstAmount?: number;
    total: number;
  }>;
  
  // Value Details
  totalValue: number;
  cgstValue?: number;
  sgstValue?: number;
  igstValue?: number;
  cessValue?: number;
  grandTotal: number;
  
  // Part-B: Transport Details
  transMode: string; // 1=Road, 2=Rail, 3=Air, 4=Ship
  distance?: number;
  transporterId?: string;
  transporterName?: string;
  vehicleNo?: string;
  vehicleType?: string;
  transDocNo?: string;
  transDocDate?: string;
  
  // Additional Details
  generatedBy?: string;
  printDate?: string;
}

/**
 * Generate E-Way Bill PDF - Government Format (Exact Replica)
 */
export async function generateEWayBillPDF(data: EWayBillPDFData): Promise<Blob> {
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
      const lines = doc.splitTextToSize(String(text), maxWidth);
      doc.text(lines, x, y, { align });
      return lines.length * (fontSize * 0.4);
    } else {
      doc.text(String(text), x, y, { align });
      return fontSize * 0.4;
    }
  };

  // Helper function to draw line
  const drawLine = (x1: number, y1: number, x2: number, y2: number) => {
    doc.setLineWidth(0.5);
    doc.line(x1, y1, x2, y2);
  };

  // Helper function to draw box
  const drawBox = (x: number, y: number, width: number, height: number) => {
    doc.setLineWidth(0.5);
    doc.rect(x, y, width, height);
  };

  // Helper to check if new page needed
  const checkNewPage = (requiredHeight: number) => {
    if (yPos + requiredHeight > pageHeight - margin - 30) {
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // Helper to load image
  const loadImage = async (src: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (src.startsWith("data:image")) {
        // Already a data URL
        resolve(src);
        return;
      }
      
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        } else {
          reject(new Error("Could not get canvas context"));
        }
      };
      img.onerror = reject;
      
      if (src.startsWith("http://") || src.startsWith("https://")) {
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
        // Base64 string without data: prefix
        img.src = src.startsWith("data:") ? src : `data:image/png;base64,${src}`;
      }
    });
  };

  // ============================================
  // HEADER SECTION - Government Format
  // ============================================
  doc.setFillColor(0, 51, 102); // Dark blue header
  doc.rect(margin, yPos, contentWidth, 15, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("E-WAY BILL", pageWidth / 2, yPos + 10, { align: "center" });
  
  yPos += 18;
  doc.setTextColor(0, 0, 0);

  // E-Way Bill Number and Date
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  addText(`E-Way Bill No: ${data.ewayBillNumber}`, margin, yPos);
  addText(`Date: ${data.ewayBillDate}`, pageWidth - margin, yPos, undefined, 12, "bold", "right");
  
  yPos += 8;
  drawLine(margin, yPos, pageWidth - margin, yPos);
  yPos += 5;

  // ============================================
  // PART-A SECTION - Government Format
  // ============================================
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPos, contentWidth, 8, "F");
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  addText("PART-A", margin + 2, yPos + 6);
  
  yPos += 10;

  // Document Details Box
  drawBox(margin, yPos, contentWidth, 20);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  addText("Document Details", margin + 2, yPos + 5);
  
  doc.setFont("helvetica", "normal");
  let xPos = margin + 5;
  addText(`Document Type: ${data.docType}`, xPos, yPos + 10);
  addText(`Document No: ${data.docNo}`, xPos + 60, yPos + 10);
  addText(`Document Date: ${data.docDate}`, xPos + 120, yPos + 10);
  
  if (data.supplyType) {
    addText(`Supply Type: ${data.supplyType}`, xPos, yPos + 16);
  }
  
  yPos += 23;

  // From Party Details Box
  checkNewPage(35);
  drawBox(margin, yPos, contentWidth / 2 - 2, 35);
  doc.setFont("helvetica", "bold");
  addText("From (Supplier)", margin + 2, yPos + 5);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  addText(`GSTIN: ${data.fromGstin}`, margin + 5, yPos + 10);
  addText(`Trade Name: ${data.fromTradeName}`, margin + 5, yPos + 14);
  if (data.fromLegalName) {
    addText(`Legal Name: ${data.fromLegalName}`, margin + 5, yPos + 18);
  }
  addText(`Address: ${data.fromAddr1}`, margin + 5, yPos + 22);
  if (data.fromAddr2) {
    addText(data.fromAddr2, margin + 5, yPos + 26);
    yPos += 4;
  }
  addText(`Place: ${data.fromPlace}`, margin + 5, yPos + 30);
  addText(`Pincode: ${data.fromPincode} | State: ${data.fromStateCode}${data.fromStateName ? ` (${data.fromStateName})` : ""}`, margin + 5, yPos + 34);

  // To Party Details Box
  const toXPos = margin + contentWidth / 2 + 2;
  drawBox(toXPos, yPos - 35, contentWidth / 2 - 2, 35);
  doc.setFont("helvetica", "bold");
  addText("To (Recipient)", toXPos + 2, yPos - 30);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  addText(`GSTIN: ${data.toGstin}`, toXPos + 5, yPos - 25);
  addText(`Trade Name: ${data.toTradeName}`, toXPos + 5, yPos - 21);
  if (data.toLegalName) {
    addText(`Legal Name: ${data.toLegalName}`, toXPos + 5, yPos - 17);
  }
  addText(`Address: ${data.toAddr1}`, toXPos + 5, yPos - 13);
  if (data.toAddr2) {
    addText(data.toAddr2, toXPos + 5, yPos - 9);
    yPos += 4;
  }
  addText(`Place: ${data.toPlace}`, toXPos + 5, yPos - 5);
  addText(`Pincode: ${data.toPincode} | State: ${data.toStateCode}${data.toStateName ? ` (${data.toStateName})` : ""}`, toXPos + 5, yPos - 1);
  
  yPos += 5;

  // Item Details Table
  checkNewPage(30 + data.items.length * 8);
  yPos += 5;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  addText("Item Details", margin, yPos);
  yPos += 5;

  // Table Header
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPos, contentWidth, 8, "F");
  doc.setFontSize(7);
  addText("Sr", margin + 2, yPos + 6);
  addText("Product Name", margin + 12, yPos + 6);
  addText("HSN", margin + 70, yPos + 6);
  addText("Qty", margin + 85, yPos + 6);
  addText("Unit", margin + 95, yPos + 6);
  addText("Value", margin + 105, yPos + 6);
  addText("Tax Rate", margin + 120, yPos + 6);
  addText("Tax Amt", margin + 135, yPos + 6);
  addText("Total", margin + 150, yPos + 6);
  
  yPos += 9;
  drawLine(margin, yPos, pageWidth - margin, yPos);

  // Table Rows
  doc.setFont("helvetica", "normal");
  data.items.forEach((item) => {
    yPos += 8;
    addText(item.slNo, margin + 2, yPos);
    addText(item.productName.substring(0, 30), margin + 12, yPos, 50);
    addText(item.hsn, margin + 70, yPos);
    addText(item.quantity, margin + 85, yPos);
    addText(item.unit, margin + 95, yPos);
    addText(item.taxableValue.toFixed(2), margin + 105, yPos);
    addText(`${item.taxRate || item.igstRate || 0}%`, margin + 120, yPos);
    const taxAmt = (item.cgstAmount || 0) + (item.sgstAmount || 0) + (item.igstAmount || 0);
    addText(taxAmt.toFixed(2), margin + 135, yPos);
    addText(item.total.toFixed(2), margin + 150, yPos);
    drawLine(margin, yPos + 2, pageWidth - margin, yPos + 2);
  });

  yPos += 5;

  // Value Summary
  checkNewPage(20);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  addText("Value Summary", margin, yPos);
  yPos += 5;

  doc.setFont("helvetica", "normal");
  addText(`Taxable Value: ₹${data.totalValue.toFixed(2)}`, margin + 5, yPos);
  if (data.cgstValue) {
    addText(`CGST: ₹${data.cgstValue.toFixed(2)}`, margin + 60, yPos);
  }
  if (data.sgstValue) {
    addText(`SGST: ₹${data.sgstValue.toFixed(2)}`, margin + 90, yPos);
  }
  if (data.igstValue) {
    addText(`IGST: ₹${data.igstValue.toFixed(2)}`, margin + 120, yPos);
  }
  yPos += 5;
  if (data.cessValue) {
    addText(`CESS: ₹${data.cessValue.toFixed(2)}`, margin + 5, yPos);
  }
  addText(`Grand Total: ₹${data.grandTotal.toFixed(2)}`, margin + 120, yPos, undefined, 9, "bold");
  
  yPos += 10;
  drawLine(margin, yPos, pageWidth - margin, yPos);
  yPos += 5;

  // ============================================
  // PART-B SECTION - Government Format
  // ============================================
  checkNewPage(50);
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPos, contentWidth, 8, "F");
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  addText("PART-B", margin + 2, yPos + 6);
  
  yPos += 10;

  // Transport Details Box
  drawBox(margin, yPos, contentWidth, 40);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  addText("Transport Details", margin + 2, yPos + 5);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  let transModeText = "";
  switch (data.transMode) {
    case "1": transModeText = "Road"; break;
    case "2": transModeText = "Rail"; break;
    case "3": transModeText = "Air"; break;
    case "4": transModeText = "Ship"; break;
    default: transModeText = data.transMode;
  }
  
  addText(`Transport Mode: ${transModeText}`, margin + 5, yPos + 12);
  if (data.distance) {
    addText(`Distance: ${data.distance} KM`, margin + 60, yPos + 12);
  }
  
  if (data.transporterId) {
    addText(`Transporter ID: ${data.transporterId}`, margin + 5, yPos + 18);
  }
  if (data.transporterName) {
    addText(`Transporter Name: ${data.transporterName}`, margin + 60, yPos + 18);
  }
  
  if (data.vehicleNo) {
    addText(`Vehicle Number: ${data.vehicleNo}`, margin + 5, yPos + 24);
  }
  if (data.vehicleType) {
    const vehicleTypeText = data.vehicleType === "R" ? "Regular" : "Over Dimensional Cargo";
    addText(`Vehicle Type: ${vehicleTypeText}`, margin + 60, yPos + 24);
  }
  
  if (data.transDocNo) {
    addText(`Transport Document No: ${data.transDocNo}`, margin + 5, yPos + 30);
  }
  if (data.transDocDate) {
    addText(`Transport Document Date: ${data.transDocDate}`, margin + 60, yPos + 30);
  }
  
  yPos += 45;

  // ============================================
  // VALIDITY SECTION - Government Format
  // ============================================
  checkNewPage(25);
  drawBox(margin, yPos, contentWidth, 20);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  addText("Validity Details", margin + 2, yPos + 5);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  addText(`Valid From: ${data.validFrom}`, margin + 5, yPos + 12);
  addText(`Valid Until: ${data.validUntil}`, margin + 60, yPos + 12);
  addText(`Status: ${data.status}`, margin + 120, yPos + 12);
  
  yPos += 25;

  // ============================================
  // QR CODE SECTION - Government Format
  // ============================================
  if (data.qrCode) {
    checkNewPage(40);
    try {
      const qrCodeData = data.qrCode.startsWith("data:") 
        ? data.qrCode 
        : `data:image/png;base64,${data.qrCode}`;
      
      const qrCodeImg = await loadImage(qrCodeData);
      const qrSize = 30;
      const qrX = pageWidth - margin - qrSize - 5;
      const qrY = yPos;
      
      doc.addImage(qrCodeImg, "PNG", qrX, qrY, qrSize, qrSize);
      
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      addText("Scan QR Code to verify", qrX, qrY + qrSize + 3, qrSize, 7, "normal", "center");
      
      yPos += qrSize + 10;
    } catch (error) {
      console.error("Error loading QR code:", error);
    }
  }

  // ============================================
  // FOOTER SECTION - Government Format
  // ============================================
  const footerY = pageHeight - 20;
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  
  // Footer line
  drawLine(margin, footerY - 5, pageWidth - margin, footerY - 5);
  
  // Generated By
  if (data.generatedBy) {
    addText(`Generated By: ${data.generatedBy}`, margin + 5, footerY, undefined, 7);
  }
  
  // Print Date
  const printDate = data.printDate || new Date().toLocaleString("en-IN", { 
    day: "2-digit", 
    month: "2-digit", 
    year: "numeric", 
    hour: "2-digit", 
    minute: "2-digit" 
  });
  addText(`Print Date: ${printDate}`, pageWidth / 2, footerY, undefined, 7, "normal", "center");
  
  // Government Notice
  addText("Generated as per GST E-Way Bill Rules", pageWidth - margin - 5, footerY, undefined, 7, "normal", "right");

  // Generate blob
  const pdfBlob = doc.output("blob");
  return pdfBlob;
}

/**
 * Download E-Way Bill PDF
 */
export async function downloadEWayBillPDF(data: EWayBillPDFData): Promise<void> {
  try {
    const blob = await generateEWayBillPDF(data);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `E-Way-Bill-${data.ewayBillNumber}-${data.docNo}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading PDF:", error);
    throw error;
  }
}

/**
 * Print E-Way Bill PDF
 */
export async function printEWayBillPDF(data: EWayBillPDFData): Promise<void> {
  try {
    const blob = await generateEWayBillPDF(data);
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
