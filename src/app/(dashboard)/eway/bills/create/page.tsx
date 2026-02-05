"use client";

/**
 * E-Way Bill Generation Form
 * 
 * Systematically organized form following WhiteBooks E-Way Bill specification
 * Structure:
 * 1. Imports (grouped by category)
 * 2. Schema Definitions
 * 3. Type Definitions
 * 4. Component Logic
 * 5. Form Sections (organized by Part-A and Part-B)
 */

// ============================================================================
// IMPORTS - Systematically grouped
// ============================================================================

// React & Next.js
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

// Form Management
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { Loader } from "@/components/common/loader";

// Icons
import { FileText, Truck, Building2, Search, Plus, Trash2, Download, Printer, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";

// Calculator Component
import { Calculator as CalculatorComponent } from "@/components/common/calculator";
import { CalculatorIcon } from "@/components/common/calculator-icon";

// Date Picker
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";

// Services & Config
import { whiteBooksEWayBillService, WhiteBooksEWayBillPayload } from "@/services/gst/ewaybill-whitebooks.service";
import { gstAuthService } from "@/services/gst/auth.service";
import { einvoiceService } from "@/services/gst/einvoice.service";
import { GST_API_CONFIG } from "@/config/gstApi.config";

// Constants & Utils
import { ROUTES } from "@/constants";
import {
  SUPPLY_TYPES,
  SUB_SUPPLY_TYPES,
  DOCUMENT_TYPES,
  TRANSACTION_TYPES,
  TRANSPORT_MODES,
  VEHICLE_TYPES,
  QUANTITY_UNITS,
  STATE_CODES,
} from "@/constants/ewaybillMasterCodes";
import {
  formatToTwoDecimals,
  safeParseFloat,
} from "@/lib/calculations";

// ============================================================================
// SCHEMA DEFINITIONS - WhiteBooks Specification Compliant
// ============================================================================

/**
 * Item Schema - For individual line items in the invoice
 */
const itemSchema = z.object({
  productName: z.string().min(1, "Product name is required"),
  productDesc: z.string().optional(),
  hsnCode: z.string()
    .min(4, "HSN code must be at least 4 digits")
    .max(8, "HSN code must be at most 8 digits"),
  quantity: z.string()
    .min(1, "Quantity is required")
    .refine((val) => parseFloat(val) > 0, "Quantity must be greater than 0"),
  qtyUnit: z.string().min(1, "Unit is required"),
  taxableAmount: z.string()
    .min(1, "Taxable amount is required")
    .refine((val) => parseFloat(val) > 0, "Taxable amount must be greater than 0"),
  cgstRate: z.string().default("0"),
  sgstRate: z.string().default("0"),
  igstRate: z.string().default("0"),
  cessRate: z.string().default("0"),
});

/**
 * Main E-Way Bill Form Schema
 * Follows WhiteBooks Complete Json structure with Part-A and Part-B
 */
const ewayBillSchema = z.object({
  // Transaction Details
  supplyType: z.enum(["O", "I"], { required_error: "Supply type is required" }),
  subSupplyType: z.string().optional(),
  subSupplyDesc: z.string().optional(),
  transactionType: z.string().optional(),
  docType: z.enum(["INV", "CHL", "BIL", "BOE"], { required_error: "Document type is required" }),
  docNo: z.string().min(1, "Document number is required"),
  docDate: z.date({ required_error: "Document date is required" }),

  // From (Supplier) Details - Part A
  fromGstin: z.string().min(1, "GSTIN is required"),
  fromTrdName: z.string().min(1, "Trade name is required"),
  fromAddr1: z.string().min(1, "Address line 1 is required"),
  fromAddr2: z.string().optional(),
  fromPlace: z.string().min(1, "Place is required"),
  fromPincode: z.string().regex(/^[0-9]{6}$/, "Pincode must be 6 digits"),
  fromStateCode: z.string().min(1, "State code is required"),
  actFromStateCode: z.string().optional(),

  // To (Recipient) Details - Part A
  toGstin: z.string().min(1, "GSTIN is required"), // Can be "URP" for B2C
  toTrdName: z.string().min(1, "Trade name is required"),
  toAddr1: z.string().min(1, "Address line 1 is required"),
  toAddr2: z.string().optional(),
  toPlace: z.string().min(1, "Place is required"),
  toPincode: z.string().regex(/^[0-9]{6}$/, "Pincode must be 6 digits"),
  toStateCode: z.string().min(1, "State code is required"),
  actToStateCode: z.string().optional(),

  // Items - Part A
  items: z.array(itemSchema).min(1, "At least one item is required"),

  // Transport Details - Part B
  transMode: z.string().min(1, "Transport mode is required"),
  distance: z.string().min(1, "Distance is required").refine((val) => parseFloat(val) >= 0, "Distance must be >= 0"),
  transporterId: z.string().optional(),
  transporterName: z.string().optional(),
  vehicleNo: z.string().optional(),
  vehicleType: z.string().optional(),
  transDocNo: z.string().optional(),
  transDocDate: z.string().optional(),
}).refine(
  (data) => {
    if (data.subSupplyType === "8" && !data.subSupplyDesc) {
      return false;
    }
    return true;
  },
  {
    message: "Sub supply description is required when sub supply type is Others",
    path: ["subSupplyDesc"],
  }
).refine(
  (data) => {
    if ((data.fromGstin === "URP" || data.toGstin === "URP") && data.supplyType !== "O") {
      return false;
    }
    return true;
  },
  {
    message: "URP is allowed only for Outward (B2C) supplies",
    path: ["toGstin"],
  }
);

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type EWayBillFormData = z.infer<typeof ewayBillSchema>;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function CreateEWayBillPage() {
  // ========================================================================
  // HOOKS & ROUTER
  // ========================================================================
  const router = useRouter();
  const { toast } = useToast();

  // ========================================================================
  // STATE MANAGEMENT - Grouped by purpose
  // ========================================================================
  
  // Form Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [generatedEWayBill, setGeneratedEWayBill] = useState<any>(null);
  
  // Calculator State
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  
  // Authentication State
  const [authToken, setAuthToken] = useState<string>("");
  
  // GSTN Lookup State
  const [isLoadingGSTN, setIsLoadingGSTN] = useState(false);
  
  // Date State
  const [docDate, setDocDate] = useState<Date | null>(new Date());
  
  // Tab Navigation State (like E-Invoice)
  const [activeTab, setActiveTab] = useState("transaction");

  // ========================================================================
  // FORM CONFIGURATION - React Hook Form Setup
  // ========================================================================
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EWayBillFormData>({
    resolver: zodResolver(ewayBillSchema),
    defaultValues: {
      supplyType: "O",
      subSupplyType: "1",
      transactionType: "1",
      docType: "INV",
      docNo: "",
      docDate: new Date(),
      fromGstin: GST_API_CONFIG.SANDBOX.gstin,
      fromTrdName: "GLOWLINE THERMOPLASTIC PAINTS",
      fromAddr1: "HANUMAN NAGAR CTC 3443/A",
      fromAddr2: "HANUMAN NAGARSankeshwar",
      fromPlace: "Belagavi",
      fromPincode: "591313",
      fromStateCode: "29",
      actFromStateCode: "29",
      toGstin: "",
      toTrdName: "",
      toAddr1: "",
      toAddr2: "",
      toPlace: "",
      toPincode: "",
      toStateCode: "",
      actToStateCode: "",
      items: [
        {
          productName: "",
          productDesc: "",
          hsnCode: "",
          quantity: "",
          qtyUnit: "BOX",
          taxableAmount: "",
          cgstRate: "0",
          sgstRate: "0",
          igstRate: "0",
          cessRate: "0",
        },
      ],
      transMode: "1",
      distance: "0",
      transporterId: "",
      transporterName: "",
      vehicleNo: "",
      vehicleType: "R",
      transDocNo: "",
      transDocDate: "",
    },
  });

  // ========================================================================
  // FIELD ARRAY - For Dynamic Item Management
  // ========================================================================
  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  // ========================================================================
  // WATCHED VALUES - For Conditional Rendering & Validation
  // ========================================================================
  const items = watch("items");
  const toGstin = watch("toGstin");
  const subSupplyType = watch("subSupplyType");
  const formDocDate = watch("docDate");

  // ========================================================================
  // EFFECTS - Lifecycle & Side Effects
  // ========================================================================
  
  /**
   * Initialize Authentication on Component Mount
   * Authenticates with WhiteBooks API and stores token
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const config = {
          ...GST_API_CONFIG.SANDBOX,
          email: GST_API_CONFIG.SANDBOX.email,
        };

        const response = await gstAuthService.authenticate(config);
        if (response.status_cd === "Sucess" || response.status_cd === "1") {
          setAuthToken(response.data.AuthToken);
          sessionStorage.setItem("AuthenticationData", JSON.stringify(response.data));
        } else {
          toast({
            title: "Authentication Failed",
            description: response.status_desc || "Please check your credentials",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        console.error("Auth initialization error:", error);
        toast({
          title: "Authentication Error",
          description: error.message || "Failed to authenticate. Please refresh the page.",
          variant: "destructive",
        });
      }
    };

    initializeAuth();
  }, [toast]);

  /**
   * Auto GSTN Lookup when 15 characters entered
   * Triggers automatic lookup after 800ms delay
   */
  useEffect(() => {
    if (toGstin && toGstin.length === 15 && toGstin !== "URP" && authToken) {
      const timer = setTimeout(() => {
        handleGSTNLookup(toGstin);
      }, 800);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toGstin, authToken]);

  // ========================================================================
  // HELPER FUNCTIONS - Organized by purpose
  // ========================================================================
  
  /**
   * Handle GSTN Lookup
   * Fetches recipient details from GSTN and auto-fills form
   */
  const handleGSTNLookup = async (gstin: string) => {
    if (gstin === "URP" || gstin.length !== 15) {
      if (gstin.length !== 15 && gstin !== "URP") {
        toast({
          title: "Invalid GSTIN",
          description: "GSTIN must be exactly 15 characters or 'URP' for unregistered",
          variant: "destructive",
        });
      }
      return;
    }

    if (!authToken) {
      toast({
        title: "Authentication Required",
        description: "Please wait for authentication to complete",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingGSTN(true);
    try {
      const config = {
        email: GST_API_CONFIG.SANDBOX.email,
        username: GST_API_CONFIG.SANDBOX.username,
        ip_address: GST_API_CONFIG.SANDBOX.ip_address,
        client_id: GST_API_CONFIG.SANDBOX.client_id,
        client_secret: GST_API_CONFIG.SANDBOX.client_secret,
        gstin: GST_API_CONFIG.SANDBOX.gstin,
        authToken: authToken,
      };

      const response = await einvoiceService.getGSTNDetails(gstin, config);
      const gstnData = response.data?.data || response.data || response;

      if (gstnData && (gstnData.LegalName || gstnData.TradeName)) {
        const { LegalName, TradeName, AddrBnm, AddrBno, AddrSt, AddrLoc, StateCode, AddrPncd } = gstnData;

        setValue("toTrdName", TradeName || "");
        setValue("toAddr1", `${AddrBno || ""}, ${AddrBnm || ""}`.trim());
        setValue("toAddr2", `${AddrBnm || ""}, ${AddrLoc || ""}`);
        setValue("toPlace", AddrLoc || "");
        setValue("toPincode", AddrPncd || "");
        setValue("toStateCode", StateCode || "");
        setValue("actToStateCode", StateCode || "");

        toast({
          title: "Success",
          description: "GSTN details loaded successfully",
        });
      }
    } catch (error: any) {
      console.error("GSTN Lookup Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch GSTN details",
        variant: "destructive",
      });
    } finally {
      setIsLoadingGSTN(false);
    }
  };

  /**
   * Calculate Totals
   * Computes total value, taxes (CGST, SGST, IGST, Cess) and final invoice value
   */
  const calculateTotals = () => {
    let totalValue = 0;
    let cgstValue = 0;
    let sgstValue = 0;
    let igstValue = 0;
    let cessValue = 0;

    items.forEach((item) => {
      const taxable = safeParseFloat(item.taxableAmount, 0);
      const cgstRate = safeParseFloat(item.cgstRate, 0);
      const sgstRate = safeParseFloat(item.sgstRate, 0);
      const igstRate = safeParseFloat(item.igstRate, 0);
      const cessRate = safeParseFloat(item.cessRate, 0);

      totalValue += taxable;
      cgstValue += (taxable * cgstRate) / 100;
      sgstValue += (taxable * sgstRate) / 100;
      igstValue += (taxable * igstRate) / 100;
      cessValue += (taxable * cessRate) / 100;
    });

    const totInvValue = totalValue + cgstValue + sgstValue + igstValue + cessValue;

    return {
      totalValue: formatToTwoDecimals(totalValue),
      cgstValue: formatToTwoDecimals(cgstValue),
      sgstValue: formatToTwoDecimals(sgstValue),
      igstValue: formatToTwoDecimals(igstValue),
      cessValue: formatToTwoDecimals(cessValue),
      totInvValue: formatToTwoDecimals(totInvValue),
    };
  };

  const totals = calculateTotals();

  /**
   * Build WhiteBooks Payload
   * Converts form data to WhiteBooks API-compatible format
   */
  const buildWhiteBooksPayload = (data: EWayBillFormData): WhiteBooksEWayBillPayload => {
    const itemList = data.items.map((item) => ({
      productName: item.productName,
      productDesc: item.productDesc || item.productName,
      hsnCode: item.hsnCode,
      quantity: parseFloat(item.quantity),
      qtyUnit: item.qtyUnit,
      taxableAmount: parseFloat(item.taxableAmount),
      cgstRate: safeParseFloat(item.cgstRate, 0),
      sgstRate: safeParseFloat(item.sgstRate, 0),
      igstRate: safeParseFloat(item.igstRate, 0),
      cessRate: safeParseFloat(item.cessRate, 0),
    }));

    const totals = calculateTotals();

    const payload: WhiteBooksEWayBillPayload = {
      supplyType: data.supplyType,
      subSupplyType: data.subSupplyType,
      subSupplyDesc: data.subSupplyDesc,
      transactionType: data.transactionType,
      docType: data.docType,
      docNo: data.docNo,
      docDate: format(data.docDate, "dd/MM/yyyy"),
      fromGstin: data.fromGstin,
      fromTrdName: data.fromTrdName,
      fromAddr1: data.fromAddr1,
      fromAddr2: data.fromAddr2,
      fromPlace: data.fromPlace,
      fromPincode: data.fromPincode,
      fromStateCode: data.fromStateCode,
      actFromStateCode: data.actFromStateCode || data.fromStateCode,
      toGstin: data.toGstin,
      toTrdName: data.toTrdName,
      toAddr1: data.toAddr1,
      toAddr2: data.toAddr2,
      toPlace: data.toPlace,
      toPincode: data.toPincode,
      toStateCode: data.toStateCode,
      actToStateCode: data.actToStateCode || data.toStateCode,
      itemList,
      totalValue: parseFloat(totals.totalValue),
      cgstValue: parseFloat(totals.cgstValue) > 0 ? parseFloat(totals.cgstValue) : undefined,
      sgstValue: parseFloat(totals.sgstValue) > 0 ? parseFloat(totals.sgstValue) : undefined,
      igstValue: parseFloat(totals.igstValue) > 0 ? parseFloat(totals.igstValue) : undefined,
      cessValue: parseFloat(totals.cessValue) > 0 ? parseFloat(totals.cessValue) : undefined,
      totInvValue: parseFloat(totals.totInvValue),
      transMode: data.transMode,
      distance: parseFloat(data.distance),
      transporterId: data.transporterId,
      transporterName: data.transporterName,
      vehicleNo: data.vehicleNo,
      vehicleType: data.vehicleType,
      transDocNo: data.transDocNo,
      transDocDate: data.transDocDate,
    };

    return payload;
  };

  // ========================================================================
  // FORM SUBMISSION HANDLER
  // ========================================================================
  
  /**
   * Handle Form Submission
   * Validates, builds payload, and calls WhiteBooks API to generate E-Way Bill
   */
  const onSubmit = async (data: EWayBillFormData) => {
    if (!authToken) {
      toast({
        title: "Authentication Required",
        description: "Please wait for authentication to complete",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = buildWhiteBooksPayload(data);

      const config = {
        email: GST_API_CONFIG.SANDBOX.email,
        username: GST_API_CONFIG.SANDBOX.username,
        password: GST_API_CONFIG.SANDBOX.password,
        ip_address: GST_API_CONFIG.SANDBOX.ip_address,
        client_id: GST_API_CONFIG.SANDBOX.client_id,
        client_secret: GST_API_CONFIG.SANDBOX.client_secret,
        gstin: GST_API_CONFIG.SANDBOX.gstin,
        authToken: authToken,
      };

      const response = await whiteBooksEWayBillService.generateEWayBill(payload, config);

      if (response.status_cd === "1" || response.status_cd === "Sucess") {
        setGeneratedEWayBill(response.data);
        setShowSuccess(true);
        sessionStorage.setItem("ewayBillData", JSON.stringify(response));
        sessionStorage.setItem("ewayBillNo", response.data?.ewayBillNo || "Generated");

        toast({
          title: "Success",
          description: `E-Way Bill generated successfully! E-Way Bill No: ${response.data?.ewayBillNo || "Generated"}`,
        });
      } else {
        toast({
          title: "Error",
          description: response.status_desc || "Failed to generate E-Way Bill",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Generate E-Way Bill Error:", error);
      const errorMessage = error.message || "Failed to generate E-Way Bill";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ========================================================================
  // RENDER - Success View
  // ========================================================================
  
  if (showSuccess && generatedEWayBill) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">E-Way Bill Generated Successfully</h1>
          <p className="text-muted-foreground">Your E-Way Bill has been generated as per WhiteBooks specification</p>
        </div>

        <Card className="border-green-500">
          <CardHeader>
            <CardTitle className="text-green-600 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              E-Way Bill Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-muted-foreground">E-Way Bill Number</Label>
                <p className="text-2xl font-bold">{generatedEWayBill.ewayBillNo || "N/A"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">E-Way Bill Date</Label>
                <p className="text-lg">{generatedEWayBill.ewayBillDate || "N/A"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Valid Till</Label>
                <p className="text-lg">{generatedEWayBill.ewayBillValidTill || generatedEWayBill.ewayBillValidUpto || "N/A"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Status</Label>
                <p className="text-lg">{generatedEWayBill.ewayBillStatus || "Active"}</p>
              </div>
            </div>

            {generatedEWayBill.qrCode && (
              <div className="pt-4 border-t">
                <Label className="text-muted-foreground">QR Code</Label>
                <div className="mt-2">
                  <Image src={generatedEWayBill.qrCode} alt="QR Code" width={128} height={128} className="w-32 h-32" unoptimized />
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Button variant="outline" onClick={() => {
                const dataStr = JSON.stringify(generatedEWayBill, null, 2);
                const dataBlob = new Blob([dataStr], { type: "application/json" });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `eway-bill-${generatedEWayBill.ewayBillNo || "generated"}.json`;
                link.click();
              }}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button variant="outline" onClick={() => {
                setShowSuccess(false);
                setGeneratedEWayBill(null);
              }}>
                Generate Another
              </Button>
              <Button variant="outline" onClick={() => router.push(ROUTES.EWAY.BILLS)}>
                View All E-Way Bills
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ========================================================================
  // RENDER - Main Form View
  // ========================================================================
  
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Generate E-Way Bill</h1>
        <p className="text-muted-foreground">
          Government of India E-Way Bill Portal (WhiteBooks Specification Compliant)
        </p>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* ================================================================
            TAB NAVIGATION (Like E-Invoice)
            ================================================================ */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-2 border-b">
              <button
                type="button"
                onClick={() => setActiveTab("transaction")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "transaction"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Transaction & From
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("to")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "to"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                To Details
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("items")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "items"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Items & Value
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("transport")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "transport"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Transportation
              </button>
            </div>
          </CardContent>
        </Card>

        {/* ================================================================
            TAB CONTENT
            ================================================================ */}
        
        {/* Transaction & From Tab */}
        {activeTab === "transaction" && (
          <div className="space-y-6">
            {/* ================================================================
                PART-A: TRANSACTION DETAILS
                ================================================================ */}
            <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Transaction Details
            </CardTitle>
            <CardDescription>Part-A: Document and Supply Information</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="supplyType">Supply Type <span className="text-red-500">*</span></Label>
              <select
                id="supplyType"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...register("supplyType")}
              >
                {SUPPLY_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {errors.supplyType && (
                <p className="text-sm text-destructive">{errors.supplyType.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="subSupplyType">Sub Supply Type (Optional)</Label>
              <select
                id="subSupplyType"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...register("subSupplyType")}
              >
                <option value="">Select Sub Supply Type</option>
                {SUB_SUPPLY_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {subSupplyType === "8" && (
              <div className="space-y-2">
                <Label htmlFor="subSupplyDesc">Sub Supply Description <span className="text-red-500">*</span></Label>
                <Input
                  id="subSupplyDesc"
                  placeholder="Enter description"
                  {...register("subSupplyDesc")}
                />
                {errors.subSupplyDesc && (
                  <p className="text-sm text-destructive">{errors.subSupplyDesc.message}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="transactionType">Transaction Type (Optional)</Label>
              <select
                id="transactionType"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...register("transactionType")}
              >
                <option value="">Select Transaction Type</option>
                {TRANSACTION_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="docType">Document Type <span className="text-red-500">*</span></Label>
              <select
                id="docType"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...register("docType")}
              >
                {DOCUMENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {errors.docType && (
                <p className="text-sm text-destructive">{errors.docType.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="docNo">Document No <span className="text-red-500">*</span></Label>
              <Input
                id="docNo"
                placeholder="Enter document number"
                {...register("docNo")}
              />
              {errors.docNo && (
                <p className="text-sm text-destructive">{errors.docNo.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="docDate">Document Date <span className="text-red-500">*</span></Label>
              <DatePicker
                selected={docDate}
                onChange={(date) => {
                  setDocDate(date);
                  setValue("docDate", date || new Date());
                }}
                dateFormat="dd/MM/yyyy"
                placeholderText="dd/mm/yyyy"
                maxDate={new Date()}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                wrapperClassName="w-full"
              />
              {errors.docDate && (
                <p className="text-sm text-destructive">{errors.docDate.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

            {/* ================================================================
                PART-A: FROM (SUPPLIER) DETAILS
                ================================================================ */}
            <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              From (Supplier Details) - Part A
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fromGstin">GSTIN <span className="text-red-500">*</span></Label>
              <Input
                id="fromGstin"
                maxLength={15}
                placeholder="15 digit GSTIN"
                {...register("fromGstin")}
              />
              {errors.fromGstin && (
                <p className="text-sm text-destructive">{errors.fromGstin.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fromTrdName">Trade Name <span className="text-red-500">*</span></Label>
              <Input
                id="fromTrdName"
                {...register("fromTrdName")}
              />
              {errors.fromTrdName && (
                <p className="text-sm text-destructive">{errors.fromTrdName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fromAddr1">Address Line 1 <span className="text-red-500">*</span></Label>
              <Input
                id="fromAddr1"
                {...register("fromAddr1")}
              />
              {errors.fromAddr1 && (
                <p className="text-sm text-destructive">{errors.fromAddr1.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fromAddr2">Address Line 2 (Optional)</Label>
              <Input
                id="fromAddr2"
                {...register("fromAddr2")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fromPlace">Place <span className="text-red-500">*</span></Label>
              <Input
                id="fromPlace"
                {...register("fromPlace")}
              />
              {errors.fromPlace && (
                <p className="text-sm text-destructive">{errors.fromPlace.message}</p>
              )}
            </div>

            {/* Location, Pincode, State Code in single row (like E-Invoice) */}
            <div className="col-span-2 grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fromPlace">Location <span className="text-red-500">*</span></Label>
                <Input
                  id="fromPlace"
                  {...register("fromPlace")}
                />
                {errors.fromPlace && (
                  <p className="text-sm text-destructive">{errors.fromPlace.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fromPincode">Pincode <span className="text-red-500">*</span></Label>
                <Input
                  id="fromPincode"
                  maxLength={6}
                  {...register("fromPincode")}
                />
                {errors.fromPincode && (
                  <p className="text-sm text-destructive">{errors.fromPincode.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fromStateCode">State Code <span className="text-red-500">*</span></Label>
                <select
                  id="fromStateCode"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...register("fromStateCode")}
                >
                  <option value="">Select State</option>
                  {STATE_CODES.map((state) => (
                    <option key={state.value} value={state.value}>
                      {state.value} - {state.label}
                    </option>
                  ))}
                </select>
                {errors.fromStateCode && (
                  <p className="text-sm text-destructive">{errors.fromStateCode.message}</p>
                )}
              </div>
            </div>

            {/* Actual From State Code (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="actFromStateCode">Actual From State Code (Optional)</Label>
              <select
                id="actFromStateCode"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...register("actFromStateCode")}
              >
                <option value="">Select State</option>
                {STATE_CODES.map((state) => (
                  <option key={state.value} value={state.value}>
                    {state.value} - {state.label}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>
          </div>
        )}

        {/* To Details Tab */}
        {activeTab === "to" && (
          <div className="space-y-6">
            {/* ================================================================
                PART-A: TO (RECIPIENT) DETAILS
                ================================================================ */}
            <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              To (Recipient Details) - Part A
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="toGstin">GSTIN <span className="text-red-500">*</span></Label>
              <div className="flex gap-2">
                <Input
                  id="toGstin"
                  placeholder="15 digit GSTIN or 'URP' for unregistered"
                  {...register("toGstin")}
                />
                {toGstin && toGstin.length === 15 && toGstin !== "URP" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleGSTNLookup(toGstin)}
                    disabled={isLoadingGSTN || !authToken}
                    className="whitespace-nowrap"
                  >
                    {isLoadingGSTN ? (
                      <Loader size="sm" />
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-1" />
                        Lookup
                      </>
                    )}
                  </Button>
                )}
              </div>
              {errors.toGstin && (
                <p className="text-sm text-destructive">{errors.toGstin.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Enter 15 digit GSTIN or &quot;URP&quot; for unregistered person (B2C only)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="toTrdName">Trade Name <span className="text-red-500">*</span></Label>
              <Input
                id="toTrdName"
                {...register("toTrdName")}
              />
              {errors.toTrdName && (
                <p className="text-sm text-destructive">{errors.toTrdName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="toAddr1">Address Line 1 <span className="text-red-500">*</span></Label>
              <Input
                id="toAddr1"
                {...register("toAddr1")}
              />
              {errors.toAddr1 && (
                <p className="text-sm text-destructive">{errors.toAddr1.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="toAddr2">Address Line 2 (Optional)</Label>
              <Input
                id="toAddr2"
                {...register("toAddr2")}
              />
            </div>

            {/* Location, Pincode, State Code in single row (like E-Invoice) */}
            <div className="col-span-2 grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="toPlace">Location <span className="text-red-500">*</span></Label>
                <Input
                  id="toPlace"
                  {...register("toPlace")}
                />
                {errors.toPlace && (
                  <p className="text-sm text-destructive">{errors.toPlace.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="toPincode">Pincode <span className="text-red-500">*</span></Label>
                <Input
                  id="toPincode"
                  maxLength={6}
                  {...register("toPincode")}
                />
                {errors.toPincode && (
                  <p className="text-sm text-destructive">{errors.toPincode.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="toStateCode">State Code <span className="text-red-500">*</span></Label>
                <select
                  id="toStateCode"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...register("toStateCode")}
                >
                  <option value="">Select State</option>
                  {STATE_CODES.map((state) => (
                    <option key={state.value} value={state.value}>
                      {state.value} - {state.label}
                    </option>
                  ))}
                </select>
                {errors.toStateCode && (
                  <p className="text-sm text-destructive">{errors.toStateCode.message}</p>
                )}
              </div>
            </div>

            {/* Actual To State Code (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="actToStateCode">Actual To State Code (Optional)</Label>
              <select
                id="actToStateCode"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...register("actToStateCode")}
              >
                <option value="">Select State</option>
                {STATE_CODES.map((state) => (
                  <option key={state.value} value={state.value}>
                    {state.value} - {state.label}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>
          </div>
        )}

        {/* Items Tab */}
        {activeTab === "items" && (
          <div className="space-y-6">
            {/* ================================================================
                PART-A: ITEM DETAILS (Dynamic Table)
                ================================================================ */}
            <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Item Details - Part A
                </CardTitle>
                <CardDescription>Enter item details with HSN, quantity, and tax rates</CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({
                    productName: "",
                    productDesc: "",
                    hsnCode: "",
                    quantity: "",
                    qtyUnit: "BOX",
                    taxableAmount: "",
                    cgstRate: "0",
                    sgstRate: "0",
                    igstRate: "0",
                    cessRate: "0",
                  })
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-12 text-center">#</TableHead>
                    <TableHead className="min-w-[250px]">Product Name <span className="text-red-500">*</span></TableHead>
                    <TableHead className="min-w-[150px]">Product Desc</TableHead>
                    <TableHead className="min-w-[100px]">HSN Code <span className="text-red-500">*</span></TableHead>
                    <TableHead className="min-w-[80px]">Quantity <span className="text-red-500">*</span></TableHead>
                    <TableHead className="min-w-[100px]">Unit <span className="text-red-500">*</span></TableHead>
                    <TableHead className="min-w-[120px]">Taxable Amount <span className="text-red-500">*</span></TableHead>
                    <TableHead className="min-w-[80px]">CGST%</TableHead>
                    <TableHead className="min-w-[80px]">SGST%</TableHead>
                    <TableHead className="min-w-[80px]">IGST%</TableHead>
                    <TableHead className="min-w-[80px]">Cess%</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => {
                    const item = items[index];
                    const cgstRate = safeParseFloat(item.cgstRate, 0);
                    const sgstRate = safeParseFloat(item.sgstRate, 0);
                    const igstRate = safeParseFloat(item.igstRate, 0);
                    const cessRate = safeParseFloat(item.cessRate, 0);
                    const taxable = safeParseFloat(item.taxableAmount, 0);
                    const cgstAmt = (taxable * cgstRate) / 100;
                    const sgstAmt = (taxable * sgstRate) / 100;
                    const igstAmt = (taxable * igstRate) / 100;
                    const cessAmt = (taxable * cessRate) / 100;
                    const total = taxable + cgstAmt + sgstAmt + igstAmt + cessAmt;

                    return (
                      <TableRow key={field.id} className="hover:bg-muted/30">
                        <TableCell className="text-center font-medium">{index + 1}</TableCell>
                        <TableCell>
                          <Input
                            {...register(`items.${index}.productName`)}
                            placeholder="Product Name"
                            className="h-10 w-full min-w-[230px]"
                          />
                          {errors.items?.[index]?.productName && (
                            <p className="text-xs text-destructive mt-1">
                              {errors.items[index]?.productName?.message}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Input
                            {...register(`items.${index}.productDesc`)}
                            placeholder="Product Description"
                            className="h-10 w-full min-w-[130px]"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            {...register(`items.${index}.hsnCode`)}
                            placeholder="HSN Code"
                            maxLength={8}
                            className="h-10 min-w-[100px]"
                          />
                          {errors.items?.[index]?.hsnCode && (
                            <p className="text-xs text-destructive mt-1">
                              {errors.items[index]?.hsnCode?.message}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            {...register(`items.${index}.quantity`)}
                            placeholder="Qty"
                            className="h-10 min-w-[80px] text-right"
                          />
                          {errors.items?.[index]?.quantity && (
                            <p className="text-xs text-destructive mt-1">
                              {errors.items[index]?.quantity?.message}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <select
                            className="h-10 w-full min-w-[100px] rounded-md border border-input bg-background px-2 text-sm"
                            {...register(`items.${index}.qtyUnit`)}
                          >
                            {QUANTITY_UNITS.map((unit) => (
                              <option key={unit.value} value={unit.value}>
                                {unit.label}
                              </option>
                            ))}
                          </select>
                          {errors.items?.[index]?.qtyUnit && (
                            <p className="text-xs text-destructive mt-1">
                              {errors.items[index]?.qtyUnit?.message}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            {...register(`items.${index}.taxableAmount`)}
                            placeholder="Amount"
                            className="h-10 min-w-[120px] text-right font-mono"
                          />
                          {errors.items?.[index]?.taxableAmount && (
                            <p className="text-xs text-destructive mt-1">
                              {errors.items[index]?.taxableAmount?.message}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            {...register(`items.${index}.cgstRate`)}
                            placeholder="0%"
                            className="h-10 w-full min-w-[80px] text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            {...register(`items.${index}.sgstRate`)}
                            placeholder="0%"
                            className="h-10 w-full min-w-[80px] text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            {...register(`items.${index}.igstRate`)}
                            placeholder="0%"
                            className="h-10 w-full min-w-[80px] text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            {...register(`items.${index}.cessRate`)}
                            placeholder="0%"
                            className="h-10 w-full min-w-[80px] text-right"
                          />
                        </TableCell>
                        <TableCell>
                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => remove(index)}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Summary */}
            <div className="mt-6 border rounded-lg p-4 bg-muted/20">
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                <div>
                  <Label className="text-muted-foreground">Total Value</Label>
                  <p className="text-lg font-semibold">₹{totals.totalValue}</p>
                </div>
                {parseFloat(totals.cgstValue) > 0 && (
                  <div>
                    <Label className="text-muted-foreground">CGST</Label>
                    <p className="text-lg">₹{totals.cgstValue}</p>
                  </div>
                )}
                {parseFloat(totals.sgstValue) > 0 && (
                  <div>
                    <Label className="text-muted-foreground">SGST</Label>
                    <p className="text-lg">₹{totals.sgstValue}</p>
                  </div>
                )}
                {parseFloat(totals.igstValue) > 0 && (
                  <div>
                    <Label className="text-muted-foreground">IGST</Label>
                    <p className="text-lg">₹{totals.igstValue}</p>
                  </div>
                )}
                {parseFloat(totals.cessValue) > 0 && (
                  <div>
                    <Label className="text-muted-foreground">Cess</Label>
                    <p className="text-lg">₹{totals.cessValue}</p>
                  </div>
                )}
                <div className="col-span-full border-t pt-4">
                  <Label className="text-muted-foreground">Total Invoice Value</Label>
                  <p className="text-2xl font-bold text-primary">₹{totals.totInvValue}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
          </div>
        )}

        {/* Transportation Tab */}
        {activeTab === "transport" && (
          <div className="space-y-6">
            {/* ================================================================
                PART-B: TRANSPORT DETAILS
                ================================================================ */}
            <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Transport Details - Part B
            </CardTitle>
            <CardDescription>Enter transportation information for E-Way Bill movement</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Transport Mode <span className="text-red-500">*</span></Label>
                <div className="flex gap-4">
                  {TRANSPORT_MODES.map((mode) => (
                    <div key={mode.value} className="flex items-center gap-2">
                      <input
                        type="radio"
                        id={`trans-${mode.value}`}
                        value={mode.value}
                        {...register("transMode")}
                        className="h-4 w-4"
                      />
                      <Label htmlFor={`trans-${mode.value}`} className="cursor-pointer">
                        {mode.label}
                      </Label>
                    </div>
                  ))}
                </div>
                {errors.transMode && (
                  <p className="text-sm text-destructive">{errors.transMode.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="distance">Distance (KM) <span className="text-red-500">*</span></Label>
                <Input
                  id="distance"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register("distance")}
                />
                {errors.distance && (
                  <p className="text-sm text-destructive">{errors.distance.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="transporterId">Transporter ID (GSTIN) (Optional)</Label>
                <Input
                  id="transporterId"
                  placeholder="Enter transporter GSTIN"
                  maxLength={15}
                  {...register("transporterId")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="transporterName">Transporter Name (Optional)</Label>
                <Input
                  id="transporterName"
                  placeholder="Enter transporter name"
                  {...register("transporterName")}
                />
                <p className="text-xs text-muted-foreground">
                  Required if transporter ID is not provided
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicleNo">Vehicle Number (Optional)</Label>
                <Input
                  id="vehicleNo"
                  placeholder="MH-12-AB-1234"
                  {...register("vehicleNo")}
                />
                <p className="text-xs text-muted-foreground">
                  Can be added later via Update Part-B
                </p>
              </div>

              <div className="space-y-2">
                <Label>Vehicle Type (Optional)</Label>
                <div className="flex gap-4">
                  {VEHICLE_TYPES.map((type) => (
                    <div key={type.value} className="flex items-center gap-2">
                      <input
                        type="radio"
                        id={`vehicle-${type.value}`}
                        value={type.value}
                        {...register("vehicleType")}
                        className="h-4 w-4"
                      />
                      <Label htmlFor={`vehicle-${type.value}`} className="cursor-pointer">
                        {type.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transDocNo">Transporter Document No. (Optional)</Label>
                <Input
                  id="transDocNo"
                  placeholder="Enter document number"
                  {...register("transDocNo")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="transDocDate">Transporter Document Date (Optional)</Label>
                <Input
                  id="transDocDate"
                  type="text"
                  placeholder="dd/MM/yyyy"
                  {...register("transDocDate")}
                />
              </div>
            </div>
          </CardContent>
        </Card>
          </div>
        )}

        {/* ================================================================
            FORM ACTIONS (Always Visible)
            ================================================================ */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!authToken || isSubmitting} size="lg">
                {isSubmitting ? (
                  <>
                    <Loader size="sm" className="mr-2" />
                    Generating E-Way Bill...
                  </>
                ) : (
                  "Generate E-Way Bill"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Floating Calculator Button - Chatbot Style */}
      <button
        type="button"
        onClick={() => setIsCalculatorOpen(true)}
        className="fixed bottom-10 right-6 z-40 rounded-full shadow-md hover:shadow-lg transition-shadow flex items-center justify-center"
        title="Open Calculator"
        draggable="false"
        onDragStart={(e) => {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }}
        onDrag={(e) => {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }}
        style={{
          WebkitUserDrag: 'none',
          userSelect: 'none',
        }}
      >
        <CalculatorIcon className="h-14 w-14 rounded-full" />
      </button>

      {/* Calculator Dialog */}
      <CalculatorComponent
        open={isCalculatorOpen}
        onOpenChange={setIsCalculatorOpen}
      />
    </div>
  );
}
