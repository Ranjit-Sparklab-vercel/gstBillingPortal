import api from "@/lib/api";
import { EWayBill } from "@/types";

export interface CreateEWayBillDTO {
  invoiceId: string;
  transporterName: string;
  vehicleNumber: string;
  fromPlace: string;
  toPlace: string;
  distance?: number;
  modeOfTransport?: "Road" | "Rail" | "Air" | "Ship";
}

export interface EWayBillResponse {
  ewayBill: EWayBill;
  ewayBillNumber: string;
}

class EWayBillService {
  private baseUrl = process.env.NEXT_PUBLIC_GST_API_URL || "";

  async generateEWayBill(data: CreateEWayBillDTO): Promise<EWayBillResponse> {
    try {
      const response = await api.post(`${this.baseUrl}/eway-bills`, data);
      return response.data;
    } catch (error) {
      console.error("Generate E-Way Bill Error:", error);
      throw error;
    }
  }

  async getEWayBills(): Promise<EWayBill[]> {
    try {
      const response = await api.get(`${this.baseUrl}/eway-bills`);
      return response.data || [];
    } catch (error) {
      console.error("Get E-Way Bills Error:", error);
      throw error;
    }
  }

  async getEWayBillById(id: string): Promise<EWayBill> {
    try {
      const response = await api.get(`${this.baseUrl}/eway-bills/${id}`);
      return response.data;
    } catch (error) {
      console.error("Get E-Way Bill Error:", error);
      throw error;
    }
  }

  async cancelEWayBill(ewayBillId: string, reason: string): Promise<void> {
    try {
      await api.post(`${this.baseUrl}/eway-bills/${ewayBillId}/cancel`, {
        reason,
      });
    } catch (error) {
      console.error("Cancel E-Way Bill Error:", error);
      throw error;
    }
  }

  async updateEWayBill(ewayBillId: string, data: Partial<CreateEWayBillDTO>): Promise<EWayBill> {
    try {
      const response = await api.put(`${this.baseUrl}/eway-bills/${ewayBillId}`, data);
      return response.data;
    } catch (error) {
      console.error("Update E-Way Bill Error:", error);
      throw error;
    }
  }
}

export const ewayBillService = new EWayBillService();
