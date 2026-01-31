/**
 * E-Invoice Storage Utility
 * 
 * Manages E-Invoice data in localStorage/sessionStorage
 * Syncs with Whitebooks API when needed
 */

export interface StoredEInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceType: "INV" | "CRN" | "DBN";
  buyerGstin: string;
  invoiceValue: number;
  irn: string;
  status: "GENERATED" | "CANCELLED" | "FAILED";
  ackNo: string;
  ackDate: string;
  qrCode: string;
  createdAt: string;
  updatedAt: string;
  fullData?: any; // Complete API response
}

const STORAGE_KEY = "einvoices_list";

class EInvoiceStorage {
  /**
   * Get all E-Invoices from storage
   */
  getAllEInvoices(): StoredEInvoice[] {
    if (typeof window === "undefined") return [];
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      return JSON.parse(stored);
    } catch (error) {
      console.error("Error reading E-Invoices from storage:", error);
      return [];
    }
  }

  /**
   * Save E-Invoice to storage
   */
  saveEInvoice(einvoice: StoredEInvoice): void {
    if (typeof window === "undefined") return;
    
    try {
      const einvoices = this.getAllEInvoices();
      const existingIndex = einvoices.findIndex((e) => e.irn === einvoice.irn);
      
      if (existingIndex >= 0) {
        // Update existing
        einvoices[existingIndex] = {
          ...einvoice,
          updatedAt: new Date().toISOString(),
        };
      } else {
        // Add new
        einvoices.push({
          ...einvoice,
          createdAt: einvoice.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(einvoices));
    } catch (error) {
      console.error("Error saving E-Invoice to storage:", error);
    }
  }

  /**
   * Update E-Invoice status
   */
  updateEInvoiceStatus(irn: string, status: "GENERATED" | "CANCELLED" | "FAILED"): void {
    if (typeof window === "undefined") return;
    
    try {
      const einvoices = this.getAllEInvoices();
      const index = einvoices.findIndex((e) => e.irn === irn);
      if (index >= 0) {
        einvoices[index].status = status;
        einvoices[index].updatedAt = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(einvoices));
      }
    } catch (error) {
      console.error("Error updating E-Invoice status:", error);
    }
  }

  /**
   * Sync from sessionStorage (when IRN is generated)
   */
  syncFromSessionStorage(): void {
    if (typeof window === "undefined") return;
    
    try {
      const sessionData = sessionStorage.getItem("einvoiceData");
      if (sessionData) {
        const data = JSON.parse(sessionData);
        const irn = data.data?.Irn || data.data?.irn || data.Irn || data.irn;
        const ackNo = data.data?.AckNo || data.data?.ackNo || "";
        const ackDate = data.data?.AckDt || data.data?.ackDt || data.data?.AckDate || data.data?.ackDate || "";
        const qrCode = data.data?.SignedQRCode || data.data?.signedQRCode || "";
        const status = data.data?.Status || data.data?.status || "GENERATED";
        
        const docDetails = data.data?.DocDtls || data.data?.docDtls || {};
        const invoiceNumber = docDetails.No || docDetails.no || "";
        const invoiceDate = docDetails.Dt || docDetails.dt || "";
        const invoiceType = (docDetails.Typ || docDetails.typ || "INV") as "INV" | "CRN" | "DBN";
        
        const buyerDetails = data.data?.BuyerDtls || data.data?.buyerDtls || {};
        const buyerGstin = buyerDetails.Gstin || buyerDetails.gstin || "";
        
        const valDetails = data.data?.ValDtls || data.data?.valDtls || {};
        const invoiceValue = valDetails.TotInvVal || valDetails.totInvVal || 0;
        
        if (irn && invoiceNumber) {
          const storedEInvoice: StoredEInvoice = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            invoiceNumber,
            invoiceDate,
            invoiceType,
            buyerGstin,
            invoiceValue,
            irn,
            status: status === "1" || status === "Active" ? "GENERATED" : status === "Cancelled" ? "CANCELLED" : "FAILED",
            ackNo,
            ackDate,
            qrCode,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            fullData: data.data || data,
          };
          
          this.saveEInvoice(storedEInvoice);
        }
      }
    } catch (error) {
      console.error("Error syncing from sessionStorage:", error);
    }
  }
}

export const einvoiceStorage = new EInvoiceStorage();
