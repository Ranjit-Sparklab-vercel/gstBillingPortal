import axios from "axios";
import { GST_API_ENV } from "@/constants";

export interface GSTAuthConfig {
  username: string;
  password: string;
  ip_address?: string;
  client_id: string;
  client_secret: string;
  gstin: string;
  email?: string;
  environment?: typeof GST_API_ENV.SANDBOX | typeof GST_API_ENV.PRODUCTION;
}

export interface GSTAuthResponse {
  status_cd: string;
  status_desc: string;
  data: {
    AuthToken: string;
    TokenExpiry: string;
  };
}

class GSTAuthService {
  private baseUrl = process.env.NEXT_PUBLIC_GST_API_URL || "https://api.whitebooks.in";
  private environment: string = GST_API_ENV.SANDBOX;

  /**
   * Authenticate with GST API (Whitebooks format)
   */
  async authenticate(config: GSTAuthConfig): Promise<GSTAuthResponse> {
    try {
      const email = config.email || "";
      const headers = {
        username: config.username,
        password: config.password,
        ip_address: config.ip_address || "192.168.1.6",
        client_id: config.client_id,
        client_secret: config.client_secret,
        gstin: config.gstin,
      };

      // Use axios directly for external API calls
      const response = await axios.get(
        `${this.baseUrl}/einvoice/authenticate?email=${email}`,
        { 
          headers,
          timeout: 30000, // 30 seconds timeout
        }
      );
      
      return response.data;
    } catch (error: any) {
      console.error("GST Auth Error:", error);
      const errorMessage = error.response?.data?.status_desc || error.message || "Authentication failed";
      throw new Error(errorMessage);
    }
  }

  /**
   * Get Auth Token (wrapper for authenticate)
   */
  async getAuthToken(config: GSTAuthConfig): Promise<string> {
    const response = await this.authenticate(config);
    if (response.status_cd === "Sucess") {
      return response.data.AuthToken;
    }
    throw new Error(response.status_desc || "Authentication failed");
  }

  setEnvironment(env: typeof GST_API_ENV.SANDBOX | typeof GST_API_ENV.PRODUCTION) {
    this.environment = env;
  }
}

export const gstAuthService = new GSTAuthService();
