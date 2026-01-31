import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from "axios";
import { API_BASE_URL } from "@/constants";
import { useAuthStore } from "@/store/authStore";

// Default API instance for internal APIs
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token (only for internal APIs)
api.interceptors.request.use(
  (config) => {
    // Skip auth token for external GST APIs (they use custom headers)
    if (config.url?.includes("whitebooks.in") || config.url?.includes("api.whitebooks.in")) {
      return config;
    }
    
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Don't logout for GST API errors
    if (error.config?.url?.includes("whitebooks.in") || error.config?.url?.includes("api.whitebooks.in")) {
      return Promise.reject(error);
    }
    
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
