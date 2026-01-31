import api from "@/lib/api";
import { Invoice } from "@/types";

export interface CreateInvoiceDTO {
  customerId: string;
  date: string;
  dueDate: string;
  items: Array<{
    description: string;
    quantity: number;
    rate: number;
    taxRate: number;
    hsnCode: string;
  }>;
}

export interface InvoiceResponse {
  invoice: Invoice;
  pdfUrl?: string;
}

class GSTInvoiceService {
  private baseUrl = process.env.NEXT_PUBLIC_GST_API_URL || "";

  async createInvoice(data: CreateInvoiceDTO): Promise<InvoiceResponse> {
    try {
      const response = await api.post(`${this.baseUrl}/invoices`, data);
      return response.data;
    } catch (error) {
      console.error("Create Invoice Error:", error);
      throw error;
    }
  }

  async getInvoices(): Promise<Invoice[]> {
    try {
      const response = await api.get(`${this.baseUrl}/invoices`);
      return response.data || [];
    } catch (error) {
      console.error("Get Invoices Error:", error);
      throw error;
    }
  }

  async getInvoiceById(id: string): Promise<Invoice> {
    try {
      const response = await api.get(`${this.baseUrl}/invoices/${id}`);
      return response.data;
    } catch (error) {
      console.error("Get Invoice Error:", error);
      throw error;
    }
  }

  async generatePDF(invoiceId: string): Promise<string> {
    try {
      const response = await api.get(`${this.baseUrl}/invoices/${invoiceId}/pdf`, {
        responseType: "blob",
      });
      return URL.createObjectURL(response.data);
    } catch (error) {
      console.error("Generate PDF Error:", error);
      throw error;
    }
  }

  async cancelInvoice(invoiceId: string): Promise<void> {
    try {
      await api.post(`${this.baseUrl}/invoices/${invoiceId}/cancel`);
    } catch (error) {
      console.error("Cancel Invoice Error:", error);
      throw error;
    }
  }
}

const gstInvoiceService = new GSTInvoiceService();
export default gstInvoiceService;
