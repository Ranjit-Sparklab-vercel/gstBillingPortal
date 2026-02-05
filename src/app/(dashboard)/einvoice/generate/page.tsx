"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { ROUTES } from "@/constants";
import { einvoiceService, GenerateIRNPayload, GenerateIRNConfig } from "@/services/gst/einvoice.service";
import { gstAuthService } from "@/services/gst/auth.service";
import { GST_API_CONFIG } from "@/config/gstApi.config";
import { einvoiceStorage } from "@/lib/einvoice-storage";
import { Loader } from "@/components/common/loader";
import { Search, Plus, Trash2, Calculator, Building2, Truck, FileText, ChevronDown, ChevronUp, Info, CheckCircle2 } from "lucide-react";
import { Calculator as CalculatorComponent } from "@/components/common/calculator";
import { CalculatorIcon } from "@/components/common/calculator-icon";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import { STATE_CODES, SUPPLY_TYPES, DOCUMENT_TYPES, TRANSPORT_MODES, VEHICLE_TYPES } from "@/constants/stateCodes";
import {
  calculateItemGST,
  calculateUnitPrice,
  calculateTotals,
  calculateFinalInvoiceValue,
  safeParseFloat,
  formatToTwoDecimals,
} from "@/lib/calculations";

// Item Schema - Complete with all fields
const itemSchema = z.object({
  productName: z.string().min(1, "Product name is required"),
  hsn: z.string().min(1, "HSN code is required"),
  isService: z.enum(["Y", "N"]).default("N"), // Y for Service, N for Product
  batchNumber: z.string().optional(), // Batch Details
  quantity: z.string().min(1, "Quantity is required"),
  unit: z.string().min(1, "Unit is required"),
  value: z.string().min(1, "Value is required"),
  cgst: z.string().default("0"),
  sgst: z.string().default("0"),
  igst: z.string().default("0"),
});

// Main Form Schema
const einvoiceFormSchema = z.object({
  // Transaction Details
  supplyType: z.string().min(1, "Supply type is required"),
  documentType: z.enum(["INV", "CRN", "DBN"]),
  documentNo: z.string().min(1, "Document number is required"),
  documentDate: z.date(),

  // Seller Details
  sellerTradeName: z.string().min(1, "Trade name is required"),
  sellerGstNo: z.string().min(15, "GSTIN must be 15 characters").max(15),
  sellerLegalName: z.string().min(1, "Legal name is required"),
  sellerAddress1: z.string().min(1, "Address is required"),
  sellerAddress2: z.string().optional(),
  sellerLocation: z.string().min(1, "Location is required"),
  sellerPincode: z.string().min(6, "Pincode must be 6 digits").max(6),
  sellerStateCode: z.string().min(1, "State code is required"),
  sellerPhone: z.string().optional(),
  sellerEmail: z.string().email().optional().or(z.literal("")),

  // Buyer Details
  buyerGstin: z.string().min(15, "GSTIN must be 15 characters").max(15),
  buyerLegalName: z.string().min(1, "Legal name is required"),
  buyerTradeName: z.string().min(1, "Trade name is required"),
  buyerAddress1: z.string().min(1, "Address is required"),
  buyerAddress2: z.string().optional(),
  buyerLocation: z.string().min(1, "Location is required"),
  buyerPincode: z.string().min(6, "Pincode must be 6 digits").max(6),
  buyerStateCode: z.string().min(1, "State code is required"),
  posStateCode: z.string().min(1, "POS state code is required"),
  buyerPhone: z.string().optional(),
  buyerEmail: z.string().email().optional().or(z.literal("")),

  // Dispatch Details (Optional)
  dispatchName: z.string().optional(),
  dispatchAddress1: z.string().optional(),
  dispatchAddress2: z.string().optional(),
  dispatchLocation: z.string().optional(),
  dispatchPincode: z.string().optional(),
  dispatchStateCode: z.string().optional(),

  // Shipping Details
  shippingAddress: z.string().optional(),
  shippingLocation: z.string().optional(),
  shippingPincode: z.string().optional(),
  shippingStateCode: z.string().optional(),
  sameAsBilling: z.boolean().default(false),

  // Items
  items: z.array(itemSchema).min(1, "At least one item is required"),

  // Transportation Details
  transporterId: z.string().optional(),
  transporterName: z.string().optional(),
  approximateDistance: z.string().default("0"),
  transportMode: z.string().optional(),
  vehicleType: z.string().optional(),
  vehicleNo: z.string().optional(),
  transportDocNo: z.string().optional(),
  transportDocDate: z.string().optional(),

  // Payment Details (Optional)
  paymentName: z.string().optional(),
  paymentAccount: z.string().optional(),
  paymentMode: z.string().optional(),
  paymentIFSC: z.string().optional(),
  paymentTerms: z.string().optional(),
  paymentInstruction: z.string().optional(),
  creditDays: z.string().optional(),
  paidAmount: z.string().optional(),
  paymentDue: z.string().optional(),

  // Reference Details (Optional)
  invoiceRemarks: z.string().optional(),
  invoicePeriodStart: z.string().optional(),
  invoicePeriodEnd: z.string().optional(),

  // Export Details (Optional)
  shippingBillNo: z.string().optional(),
  shippingBillDate: z.string().optional(),
  port: z.string().optional(),
  forCurrency: z.string().optional(),
  countryCode: z.string().optional(),

  // Value Details Additional
  roundOffAmount: z.string().optional(),
  totalCess: z.string().optional(),
});

type EInvoiceFormData = z.infer<typeof einvoiceFormSchema>;

export default function GenerateEInvoicePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingGSTN, setIsLoadingGSTN] = useState(false);
  const [authToken, setAuthToken] = useState<string>("");
  const [documentDate, setDocumentDate] = useState<Date | null>(new Date());
  const [activeTab, setActiveTab] = useState("transaction");
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  
  // State for optional sections visibility
  const [showOptionalSections, setShowOptionalSections] = useState({
    dispatch: false,
    payment: false,
    reference: false,
    export: false,
    roundOffCess: false,
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EInvoiceFormData>({
    resolver: zodResolver(einvoiceFormSchema),
    defaultValues: {
      supplyType: "",
      documentType: "INV",
      documentNo: "",
      documentDate: new Date(),
      sellerTradeName: "GLOWLINE THERMOPLASTIC PAINTS",
      sellerGstNo: "29FTHPK8890K1ZN",
      sellerLegalName: "GLOWLINE",
      sellerAddress1: "HANUMAN NAGAR CTC 3443/A",
      sellerAddress2: "HANUMAN NAGARSankeshwar",
      sellerLocation: "Belagavi",
      sellerPincode: "591313",
      sellerStateCode: "29",
      sellerPhone: "",
      sellerEmail: "",
      buyerGstin: "",
      buyerLegalName: "",
      buyerTradeName: "",
      buyerAddress1: "",
      buyerAddress2: "",
      buyerLocation: "",
      buyerPincode: "",
      buyerStateCode: "",
      posStateCode: "",
      buyerPhone: "",
      buyerEmail: "",
      dispatchName: "",
      dispatchAddress1: "",
      dispatchAddress2: "",
      dispatchLocation: "",
      dispatchPincode: "",
      dispatchStateCode: "",
      shippingAddress: "",
      shippingLocation: "",
      shippingPincode: "",
      shippingStateCode: "",
      sameAsBilling: false,
      items: [
        {
          productName: "",
          hsn: "",
          isService: "N",
          batchNumber: "",
          quantity: "",
          unit: "",
          value: "",
          cgst: "0",
          sgst: "0",
          igst: "0",
        },
      ],
      transporterId: "",
      transporterName: "",
      approximateDistance: "0",
      transportMode: "",
      vehicleType: "",
      vehicleNo: "",
      transportDocNo: "",
      transportDocDate: "",
      paymentName: "",
      paymentAccount: "",
      paymentMode: "",
      paymentIFSC: "",
      paymentTerms: "",
      paymentInstruction: "",
      creditDays: "",
      paidAmount: "",
      paymentDue: "",
      invoiceRemarks: "",
      invoicePeriodStart: "",
      invoicePeriodEnd: "",
      shippingBillNo: "",
      shippingBillDate: "",
      port: "",
      forCurrency: "",
      countryCode: "",
      roundOffAmount: "",
      totalCess: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const items = watch("items");
  const sameAsBilling = watch("sameAsBilling");
  
  // Watch all required fields for validation and other uses
  const supplyType = watch("supplyType");
  const documentNo = watch("documentNo");
  const formDocumentDate = watch("documentDate");
  const sellerTradeName = watch("sellerTradeName");
  const sellerGstNo = watch("sellerGstNo");
  const sellerLegalName = watch("sellerLegalName");
  const sellerAddress1 = watch("sellerAddress1");
  const sellerLocation = watch("sellerLocation");
  const sellerPincode = watch("sellerPincode");
  const sellerStateCode = watch("sellerStateCode");
  const buyerGstin = watch("buyerGstin");
  const buyerLegalName = watch("buyerLegalName");
  const buyerTradeName = watch("buyerTradeName");
  const buyerAddress1 = watch("buyerAddress1");
  const buyerAddress2 = watch("buyerAddress2");
  const buyerLocation = watch("buyerLocation");
  const buyerPincode = watch("buyerPincode");
  const buyerStateCode = watch("buyerStateCode");
  const posStateCode = watch("posStateCode");

  // Initialize Authentication
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
          // Store token in session storage
          sessionStorage.setItem("AuthenticationData", JSON.stringify(response.data));
          console.log("Authentication successful");
        } else {
          console.error("Authentication Error:", response.status_desc);
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

  // Handle Same as Billing
  useEffect(() => {
    if (sameAsBilling) {
      setValue("shippingAddress", `${buyerAddress1} ${buyerAddress2 || ""}`.trim());
      setValue("shippingLocation", buyerLocation);
      setValue("shippingPincode", buyerPincode);
      setValue("shippingStateCode", posStateCode);
    } else {
      setValue("shippingAddress", "");
      setValue("shippingLocation", "");
      setValue("shippingPincode", "");
      setValue("shippingStateCode", "");
    }
  }, [sameAsBilling, buyerAddress1, buyerAddress2, buyerLocation, buyerPincode, posStateCode, setValue]);

  // Calculate Totals using utility function
  const totals = calculateTotals(items);
  
  // Calculate final invoice value with round off and cess
  const roundOffAmount = watch("roundOffAmount");
  const totalCess = watch("totalCess");
  const finalInvoiceValue = calculateFinalInvoiceValue(
    totals.totalInvVal,
    roundOffAmount,
    totalCess
  );

  // Check if all required fields are filled
  const isFormValid = () => {
    // Transaction Details
    if (!supplyType || !documentNo || !formDocumentDate) return false;
    
    // Seller Details
    if (!sellerTradeName || !sellerGstNo || sellerGstNo.length !== 15 || 
        !sellerLegalName || !sellerAddress1 || !sellerLocation || 
        !sellerPincode || sellerPincode.length !== 6 || !sellerStateCode) return false;
    
    // Buyer Details
    if (!buyerGstin || buyerGstin.length !== 15 || !buyerLegalName || 
        !buyerTradeName || !buyerAddress1 || !buyerLocation || 
        !buyerPincode || buyerPincode.length !== 6 || !buyerStateCode || !posStateCode) return false;
    
    // Items - at least one item with all required fields
    if (!items || items.length === 0) return false;
    
    const allItemsValid = items.every(item => 
      item.productName && item.productName.trim() !== "" &&
      item.hsn && item.hsn.trim() !== "" &&
      item.quantity && item.quantity.trim() !== "" &&
      item.unit && item.unit.trim() !== "" &&
      item.value && item.value.trim() !== "" && parseFloat(item.value) > 0
    );
    
    if (!allItemsValid) return false;
    
    return true;
  };

  const canSubmit = isFormValid() && authToken && !isSubmitting;

  // Handle GSTN Lookup
  const handleGSTNLookup = async (gstin: string) => {
    if (gstin.length !== 15) {
      toast({
        title: "Invalid GSTIN",
        description: "GSTIN must be exactly 15 characters",
        variant: "destructive",
      });
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
      
      // Response structure as per reference code: response.data.data contains the GSTN details
      // Reference code: const { LegalName, TradeName, AddrBnm, AddrBno, AddrSt, AddrLoc, StateCode, AddrPncd } = response.data.data;
      console.log("GST Details Response:", response);
      
      // Extract data from response - can be response.data.data or response.data
      const gstnData = response.data?.data || response.data || response;
      
      if (gstnData && (gstnData.LegalName || gstnData.TradeName)) {
        const { LegalName, TradeName, AddrBnm, AddrBno, AddrSt, AddrLoc, StateCode, AddrPncd } = gstnData;
        
        // Map fields exactly as per reference code
        // Reference: setBuyerAddress1(`${AddrBno}, ${AddrBnm}`.trim());
        // Reference: setBuyerAddress2(`${AddrBnm}, ${AddrLoc}`);
        setValue("buyerLegalName", LegalName || "");
        setValue("buyerTradeName", TradeName || "");
        setValue("buyerAddress1", `${AddrBno || ""}, ${AddrBnm || ""}`.trim());
        setValue("buyerAddress2", `${AddrBnm || ""}, ${AddrLoc || ""}`);
        setValue("buyerLocation", AddrLoc || "");
        setValue("buyerPincode", AddrPncd || "");
        setValue("buyerStateCode", StateCode || "");
        setValue("posStateCode", StateCode || "");

        toast({
          title: "Success",
          description: "GSTN details loaded successfully",
        });
      } else {
        toast({
          title: "Warning",
          description: "GSTN details not found in response",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("GSTN Lookup Error:", error);
      const errorMessage = error.message || error.response?.data?.status_desc || "Failed to fetch GSTN details";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoadingGSTN(false);
    }
  };

  // Auto lookup GSTN when 15 characters entered
  // As per reference code: useEffect triggers getGstDetails when inputGstNumber changes
  useEffect(() => {
    if (buyerGstin && buyerGstin.length === 15 && authToken) {
      // Debounce to avoid multiple calls while typing
      const timer = setTimeout(() => {
        handleGSTNLookup(buyerGstin);
      }, 800);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buyerGstin, authToken]);

  const onSubmit = async (data: EInvoiceFormData) => {
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
      // Build ItemList with proper calculations
      const itemList = data.items.map((item, index) => {
        // Use calculation utility for accurate calculations
        const itemCalc = calculateItemGST(item.value, item.cgst, item.sgst, item.igst);
        
        // Calculate unit price safely (avoid division by zero)
        const unitPrice = calculateUnitPrice(item.value, item.quantity);

        const itemPayload: any = {
          SlNo: String(index + 1),
          IsServc: item.isService || "N",
          PrdDesc: String(item.productName).trim(),
          HsnCd: String(item.hsn).trim(),
          Qty: String(item.quantity || "1").trim(), // Ensure quantity is never empty
          Unit: String(item.unit || "NOS").trim().toUpperCase(), // Default unit, uppercase
          UnitPrice: unitPrice, // Already formatted as string
          TotAmt: itemCalc.assAmt, // Already formatted as string
          AssAmt: itemCalc.assAmt, // Already formatted as string
          GstRt: itemCalc.gstRt, // Already formatted as string
          SgstAmt: itemCalc.sgstAmt, // Already formatted as string
          IgstAmt: itemCalc.igstAmt, // Already formatted as string
          CgstAmt: itemCalc.cgstAmt, // Already formatted as string
          TotItemVal: itemCalc.totItemVal, // Already formatted as string
        };

        // Add Batch Details if provided
        if (item.batchNumber && item.batchNumber.trim() !== "") {
          itemPayload.BchDtls = {
            Nm: item.batchNumber.trim(),
          };
        }

        return itemPayload;
      });

      // Build Payload with proper data types
      const payload: GenerateIRNPayload = {
        Version: "1.1",
        TranDtls: {
          TaxSch: "GST",
          SupTyp: data.supplyType,
        },
        DocDtls: {
          Typ: data.documentType,
          No: String(data.documentNo).trim(), // Ensure string type
          Dt: format(data.documentDate, "dd/MM/yyyy"),
        },
        SellerDtls: {
          Gstin: String(data.sellerGstNo).trim().toUpperCase(),
          LglNm: String(data.sellerLegalName).trim(),
          TrdNm: String(data.sellerTradeName).trim(),
          Addr1: String(data.sellerAddress1).trim(),
          Addr2: String(data.sellerAddress2 || "").trim(),
          Loc: String(data.sellerLocation).trim(),
          Pin: String(data.sellerPincode).trim(),
          Stcd: String(data.sellerStateCode).trim(),
          ...(data.sellerPhone && data.sellerPhone.trim() !== "" && { Ph: String(data.sellerPhone).trim() }),
          ...(data.sellerEmail && data.sellerEmail.trim() !== "" && { Em: String(data.sellerEmail).trim() }),
        },
        BuyerDtls: {
          Gstin: String(data.buyerGstin).trim().toUpperCase(),
          LglNm: String(data.buyerLegalName).trim(),
          TrdNm: String(data.buyerTradeName).trim(),
          Pos: String(data.posStateCode).trim(),
          Addr1: String(data.buyerAddress1).trim(),
          Addr2: String(data.buyerAddress2 || "").trim(),
          Loc: String(data.buyerLocation).trim(),
          Pin: String(data.buyerPincode).trim(),
          Stcd: String(data.buyerStateCode).trim(),
          ...(data.buyerPhone && data.buyerPhone.trim() !== "" && { Ph: String(data.buyerPhone).trim() }),
          ...(data.buyerEmail && data.buyerEmail.trim() !== "" && { Em: String(data.buyerEmail).trim() }),
        },
        ItemList: itemList,
        ValDtls: {
          AssVal: totals.totalAssVal,
          CgstVal: totals.totalCgstAmt,
          SgstVal: totals.totalSgstAmt,
          IgstVal: totals.totalIgstAmt,
          TotInvVal: finalInvoiceValue, // Use final value with round off and cess
          ...(data.roundOffAmount && data.roundOffAmount.trim() !== "" && {
            RndOffAmt: formatToTwoDecimals(data.roundOffAmount),
          }),
          ...(data.totalCess && data.totalCess.trim() !== "" && {
            TotCess: formatToTwoDecimals(data.totalCess),
          }),
        },
      };

      // Add Dispatch Details if provided
      if (data.dispatchName && data.dispatchName.trim() !== "" && data.dispatchLocation && data.dispatchLocation.trim() !== "") {
        payload.DispDtls = {
          Nm: String(data.dispatchName).trim(),
          Addr1: String(data.dispatchAddress1 || "").trim(),
          Addr2: String(data.dispatchAddress2 || "").trim(),
          Loc: String(data.dispatchLocation).trim(),
          Pin: String(data.dispatchPincode || "").trim(),
          Stcd: String(data.dispatchStateCode || "").trim(),
        };
      }

      // Add Shipping Details if provided
      if (data.shippingAddress && data.shippingAddress.trim() !== "" && data.shippingLocation && data.shippingLocation.trim() !== "") {
        payload.ShipDtls = {
          Gstin: String(data.buyerGstin).trim().toUpperCase(),
          LglNm: String(data.buyerLegalName).trim(),
          Addr1: String(data.shippingAddress).trim(),
          Loc: String(data.shippingLocation).trim(),
          Pin: String(data.shippingPincode || "").trim(),
          Stcd: String(data.shippingStateCode || "").trim(),
        };
      }

      // Add Transportation Details if provided
      if (data.transporterName && data.transporterName.trim() !== "" && data.transportMode) {
        payload.EwbDtls = {
          ...(data.transporterId && data.transporterId.trim() !== "" && { Transid: String(data.transporterId).trim() }),
          Transname: String(data.transporterName).trim(),
          Distance: String(data.approximateDistance || "0").trim(),
          Transdocno: String(data.transportDocNo || "").trim(),
          ...(data.transportDocDate && data.transportDocDate.trim() !== "" && { TransdocDt: String(data.transportDocDate).trim() }),
          Vehno: String(data.vehicleNo || "").trim(),
          Vehtype: String(data.vehicleType || "").trim(),
          TransMode: String(data.transportMode).trim(),
        };
      }

      // Add Payment Details if provided
      if (data.paymentName && data.paymentName.trim() !== "" && data.paymentAccount && data.paymentAccount.trim() !== "") {
        payload.PayDtls = {
          Nm: String(data.paymentName).trim(),
          Accdet: String(data.paymentAccount).trim(),
          Mode: String(data.paymentMode || "").trim(),
          ...(data.paymentIFSC && data.paymentIFSC.trim() !== "" && { Fininsbr: String(data.paymentIFSC).trim().toUpperCase() }),
          ...(data.paymentTerms && data.paymentTerms.trim() !== "" && { Payterm: String(data.paymentTerms).trim() }),
          ...(data.paymentInstruction && data.paymentInstruction.trim() !== "" && { Payinstr: String(data.paymentInstruction).trim() }),
          ...(data.creditDays && data.creditDays.trim() !== "" && { Crday: String(data.creditDays).trim() }),
          ...(data.paidAmount && data.paidAmount.trim() !== "" && { Paidamt: formatToTwoDecimals(data.paidAmount) }),
          ...(data.paymentDue && data.paymentDue.trim() !== "" && { Paymtdue: formatToTwoDecimals(data.paymentDue) }),
        };
      }

      // Add Reference Details if provided
      if ((data.invoiceRemarks && data.invoiceRemarks.trim() !== "") || (data.invoicePeriodStart && data.invoicePeriodStart.trim() !== "")) {
        payload.RefDtls = {
          ...(data.invoiceRemarks && data.invoiceRemarks.trim() !== "" && { InvRm: String(data.invoiceRemarks).trim() }),
          ...(data.invoicePeriodStart && data.invoicePeriodStart.trim() !== "" && data.invoicePeriodEnd && data.invoicePeriodEnd.trim() !== "" && {
            DocPerdDtls: {
              InvStDt: String(data.invoicePeriodStart).trim(),
              InvEndDt: String(data.invoicePeriodEnd).trim(),
            },
          }),
        };
      }

      // Add Export Details if provided
      if (data.shippingBillNo && data.shippingBillNo.trim() !== "" && data.port && data.port.trim() !== "") {
        payload.ExpDtls = {
          ShipBNo: String(data.shippingBillNo).trim(),
          ShipBDt: data.shippingBillDate && data.shippingBillDate.trim() !== "" 
            ? String(data.shippingBillDate).trim() 
            : format(data.documentDate, "dd/MM/yyyy"),
          Port: String(data.port).trim().toUpperCase(),
          RefClm: "N",
          ForCur: String(data.forCurrency || "INR").trim().toUpperCase(),
          CntCode: String(data.countryCode || "IN").trim().toUpperCase(),
        };
      }

      const config: GenerateIRNConfig = {
        email: GST_API_CONFIG.SANDBOX.email,
        username: GST_API_CONFIG.SANDBOX.username,
        password: GST_API_CONFIG.SANDBOX.password,
        ip_address: GST_API_CONFIG.SANDBOX.ip_address,
        client_id: GST_API_CONFIG.SANDBOX.client_id,
        client_secret: GST_API_CONFIG.SANDBOX.client_secret,
        gstin: GST_API_CONFIG.SANDBOX.gstin,
        authToken: authToken,
      };

      const response = await einvoiceService.generateIRN(payload, config);

      // Store response in session storage as per reference code
      if (response.status_cd === "1" || response.status_cd === "Sucess") {
        sessionStorage.setItem("einvoiceData", JSON.stringify(response));
        sessionStorage.setItem("documentDetails", JSON.stringify(data.documentNo));
        
        // Extract IRN from response (can be in different formats)
        const irn = response.data?.Irn || response.data?.irn || response.Irn || response.irn || "Generated";
        
        // Sync to localStorage for list page
        einvoiceStorage.syncFromSessionStorage();
        
        toast({
          title: "Success",
          description: `E-Invoice generated successfully! IRN: ${irn}`,
        });
        
        // Small delay before redirect to show success message
        setTimeout(() => {
          router.push(ROUTES.EINVOICE.INVOICES);
        }, 1500);
      } else {
        toast({
          title: "Error",
          description: response.status_desc || "Failed to generate E-Invoice",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Generate E-Invoice Error:", error);
      const errorMessage = error.message || error.response?.data?.status_desc || error.response?.data?.message || "Failed to generate E-Invoice";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Generate E-Invoice</h1>
        <p className="text-muted-foreground">
          Create E-Invoice with IRN generation
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Tabs Navigation */}
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
                Transaction & Seller
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("buyer")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "buyer"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Buyer Details
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("dispatch")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "dispatch"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Dispatch & Shipping
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
              <button
                type="button"
                onClick={() => setActiveTab("payment")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "payment"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Payment & Additional
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Tab Content */}
        {activeTab === "transaction" && (
          <div className="space-y-6">
              {/* Transaction Details */}
              <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Transaction Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="supplyType">Supply Type <span className="text-red-500">*</span></Label>
              <select
                id="supplyType"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...register("supplyType")}
              >
                <option value="">Select Supply Type</option>
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
              <Label htmlFor="documentType">Document Type <span className="text-red-500">*</span></Label>
              <select
                id="documentType"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...register("documentType")}
              >
                {DOCUMENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {errors.documentType && (
                <p className="text-sm text-destructive">{errors.documentType.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentNo">Document No <span className="text-red-500">*</span></Label>
              <Input
                id="documentNo"
                placeholder="Enter document number"
                {...register("documentNo")}
              />
              {errors.documentNo && (
                <p className="text-sm text-destructive">{errors.documentNo.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentDate">Document Date <span className="text-red-500">*</span></Label>
              <DatePicker
                selected={documentDate}
                onChange={(date) => {
                  setDocumentDate(date);
                  setValue("documentDate", date || new Date());
                }}
                dateFormat="dd/MM/yyyy"
                placeholderText="dd/mm/yyyy"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                wrapperClassName="w-full"
              />
              {errors.documentDate && (
                <p className="text-sm text-destructive">{errors.documentDate.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Seller Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Bill From (Seller Details)
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sellerTradeName">Trade Name <span className="text-red-500">*</span></Label>
              <Input
                id="sellerTradeName"
                {...register("sellerTradeName")}
              />
              {errors.sellerTradeName && (
                <p className="text-sm text-destructive">{errors.sellerTradeName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sellerGstNo">GSTIN <span className="text-red-500">*</span></Label>
              <Input
                id="sellerGstNo"
                maxLength={15}
                {...register("sellerGstNo")}
              />
              {errors.sellerGstNo && (
                <p className="text-sm text-destructive">{errors.sellerGstNo.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sellerLegalName">Legal Name <span className="text-red-500">*</span></Label>
              <Input
                id="sellerLegalName"
                {...register("sellerLegalName")}
              />
              {errors.sellerLegalName && (
                <p className="text-sm text-destructive">{errors.sellerLegalName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sellerStateCode">State Code <span className="text-red-500">*</span></Label>
              <select
                id="sellerStateCode"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...register("sellerStateCode")}
              >
                <option value="">Select State</option>
                {STATE_CODES.map((state) => (
                  <option key={state.value} value={state.value}>
                    {state.value} - {state.label}
                  </option>
                ))}
              </select>
              {errors.sellerStateCode && (
                <p className="text-sm text-destructive">{errors.sellerStateCode.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sellerAddress1">Address Line 1 <span className="text-red-500">*</span></Label>
              <Input
                id="sellerAddress1"
                {...register("sellerAddress1")}
              />
              {errors.sellerAddress1 && (
                <p className="text-sm text-destructive">{errors.sellerAddress1.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sellerAddress2">Address Line 2</Label>
              <Input
                id="sellerAddress2"
                {...register("sellerAddress2")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sellerLocation">Location <span className="text-red-500">*</span></Label>
              <Input
                id="sellerLocation"
                {...register("sellerLocation")}
              />
              {errors.sellerLocation && (
                <p className="text-sm text-destructive">{errors.sellerLocation.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sellerPincode">Pincode <span className="text-red-500">*</span></Label>
              <Input
                id="sellerPincode"
                maxLength={6}
                {...register("sellerPincode")}
              />
              {errors.sellerPincode && (
                <p className="text-sm text-destructive">{errors.sellerPincode.message}</p>
              )}
            </div>

            {/* Optional Seller Fields - Always Visible */}
            <div className="space-y-2">
              <Label htmlFor="sellerPhone">Phone (Optional)</Label>
              <Input
                id="sellerPhone"
                type="tel"
                placeholder="Enter phone number"
                {...register("sellerPhone")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sellerEmail">Email (Optional)</Label>
              <Input
                id="sellerEmail"
                type="email"
                placeholder="Enter email address"
                {...register("sellerEmail")}
              />
              {errors.sellerEmail && (
                <p className="text-sm text-destructive">{errors.sellerEmail.message}</p>
              )}
            </div>
          </CardContent>
        </Card>
          </div>
        )}

        {activeTab === "buyer" && (
          <div className="space-y-6">
              {/* Buyer Details */}
              <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Bill To (Buyer Details)
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="buyerGstin">GSTIN <span className="text-red-500">*</span></Label>
              <div className="flex gap-2">
                <Input
                  id="buyerGstin"
                  placeholder="Enter 15 digit GSTIN"
                  maxLength={15}
                  {...register("buyerGstin")}
                />
                {buyerGstin && buyerGstin.length === 15 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleGSTNLookup(buyerGstin)}
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
              {errors.buyerGstin && (
                <p className="text-sm text-destructive">{errors.buyerGstin.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                GSTN details will be auto-filled when 15 characters are entered
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="posStateCode">POS State Code <span className="text-red-500">*</span></Label>
              <select
                id="posStateCode"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...register("posStateCode")}
              >
                <option value="">Select State</option>
                {STATE_CODES.map((state) => (
                  <option key={state.value} value={state.value}>
                    {state.value} - {state.label}
                  </option>
                ))}
              </select>
              {errors.posStateCode && (
                <p className="text-sm text-destructive">{errors.posStateCode.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="buyerTradeName">Trade Name <span className="text-red-500">*</span></Label>
              <Input
                id="buyerTradeName"
                {...register("buyerTradeName")}
              />
              {errors.buyerTradeName && (
                <p className="text-sm text-destructive">{errors.buyerTradeName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="buyerLegalName">Legal Name <span className="text-red-500">*</span></Label>
              <Input
                id="buyerLegalName"
                {...register("buyerLegalName")}
              />
              {errors.buyerLegalName && (
                <p className="text-sm text-destructive">{errors.buyerLegalName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="buyerAddress1">Address Line 1 <span className="text-red-500">*</span></Label>
              <Input
                id="buyerAddress1"
                {...register("buyerAddress1")}
              />
              {errors.buyerAddress1 && (
                <p className="text-sm text-destructive">{errors.buyerAddress1.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="buyerAddress2">Address Line 2</Label>
              <Input
                id="buyerAddress2"
                {...register("buyerAddress2")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="buyerLocation">Location <span className="text-red-500">*</span></Label>
              <Input
                id="buyerLocation"
                {...register("buyerLocation")}
              />
              {errors.buyerLocation && (
                <p className="text-sm text-destructive">{errors.buyerLocation.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="buyerPincode">Pincode <span className="text-red-500">*</span></Label>
              <Input
                id="buyerPincode"
                maxLength={6}
                {...register("buyerPincode")}
              />
              {errors.buyerPincode && (
                <p className="text-sm text-destructive">{errors.buyerPincode.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="buyerStateCode">State Code <span className="text-red-500">*</span></Label>
              <select
                id="buyerStateCode"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...register("buyerStateCode")}
              >
                <option value="">Select State</option>
                {STATE_CODES.map((state) => (
                  <option key={state.value} value={state.value}>
                    {state.value} - {state.label}
                  </option>
                ))}
              </select>
              {errors.buyerStateCode && (
                <p className="text-sm text-destructive">{errors.buyerStateCode.message}</p>
              )}
            </div>

            {/* Optional Buyer Fields - Always Visible */}
            <div className="space-y-2">
              <Label htmlFor="buyerPhone">Phone (Optional)</Label>
              <Input
                id="buyerPhone"
                type="tel"
                placeholder="Enter phone number"
                {...register("buyerPhone")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="buyerEmail">Email (Optional)</Label>
              <Input
                id="buyerEmail"
                type="email"
                placeholder="Enter email address"
                {...register("buyerEmail")}
              />
              {errors.buyerEmail && (
                <p className="text-sm text-destructive">{errors.buyerEmail.message}</p>
              )}
            </div>
          </CardContent>
        </Card>
          </div>
        )}

        {activeTab === "dispatch" && (
          <div className="space-y-6">
              {/* Dispatch Details (Optional) */}
              <Card className="border-dashed">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-muted-foreground" />
                  Dispatch Details
                  <span className="text-sm font-normal text-muted-foreground ml-2">(Optional)</span>
                </CardTitle>
                <CardDescription>Fill if dispatch location is different from seller location</CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowOptionalSections(prev => ({ ...prev, dispatch: !prev.dispatch }))}
                className="flex items-center gap-2"
              >
                {showOptionalSections.dispatch ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Hide
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Show
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          {!showOptionalSections.dispatch && (watch("dispatchName") || watch("dispatchLocation") || watch("dispatchAddress1")) && (
            <CardContent>
              <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded border border-dashed">
                <div className="flex items-center gap-1 mb-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span className="font-medium">Some dispatch details are filled</span>
                </div>
                <div className="space-y-1 pl-4">
                  {watch("dispatchName") && <div>• Name: {watch("dispatchName")}</div>}
                  {watch("dispatchLocation") && <div>• Location: {watch("dispatchLocation")}</div>}
                  {watch("dispatchAddress1") && <div>• Address: {watch("dispatchAddress1")}</div>}
                </div>
              </div>
            </CardContent>
          )}
          {showOptionalSections.dispatch && (
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dispatchName">Dispatch Name</Label>
              <Input
                id="dispatchName"
                placeholder="Enter dispatch name"
                {...register("dispatchName")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dispatchLocation">Dispatch Location</Label>
              <Input
                id="dispatchLocation"
                placeholder="Enter location"
                {...register("dispatchLocation")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dispatchAddress1">Address Line 1</Label>
              <Input
                id="dispatchAddress1"
                placeholder="Enter address"
                {...register("dispatchAddress1")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dispatchAddress2">Address Line 2</Label>
              <Input
                id="dispatchAddress2"
                placeholder="Enter address"
                {...register("dispatchAddress2")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dispatchPincode">Pincode</Label>
              <Input
                id="dispatchPincode"
                maxLength={6}
                placeholder="Enter pincode"
                {...register("dispatchPincode")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dispatchStateCode">State Code</Label>
              <select
                id="dispatchStateCode"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...register("dispatchStateCode")}
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
          )}
        </Card>

        {/* Shipping Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Shipping Details
                </CardTitle>
                <CardDescription>Shipping address for the invoice</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sameAsBilling"
                  {...register("sameAsBilling")}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="sameAsBilling" className="cursor-pointer text-sm">
                  Same as Billing Details
                </Label>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="shippingAddress">Shipping Address</Label>
              <Input
                id="shippingAddress"
                {...register("shippingAddress")}
                disabled={sameAsBilling}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shippingLocation">Shipping Location</Label>
              <Input
                id="shippingLocation"
                {...register("shippingLocation")}
                disabled={sameAsBilling}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shippingPincode">Shipping Pincode</Label>
              <Input
                id="shippingPincode"
                maxLength={6}
                {...register("shippingPincode")}
                disabled={sameAsBilling}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shippingStateCode">Shipping State Code</Label>
              <select
                id="shippingStateCode"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...register("shippingStateCode")}
                disabled={sameAsBilling}
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

        {activeTab === "items" && (
          <div className="space-y-6">
            {/* Item Details - Tally Style Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Item Details
                  </CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      append({
                        productName: "",
                        hsn: "",
                        isService: "N",
                        batchNumber: "",
                        quantity: "",
                        unit: "NOS",
                        value: "",
                        cgst: "0",
                        sgst: "0",
                        igst: "0",
                      })
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Row
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-12 text-center">#</TableHead>
                        <TableHead className="min-w-[280px]">Product Name *</TableHead>
                        <TableHead className="min-w-[100px]">HSN *</TableHead>
                        <TableHead className="min-w-[80px]">Qty *</TableHead>
                        <TableHead className="min-w-[80px]">Unit</TableHead>
                        <TableHead className="min-w-[100px]">Rate</TableHead>
                        <TableHead className="min-w-[120px]">Taxable Value *</TableHead>
                        <TableHead className="min-w-[80px]">CGST%</TableHead>
                        <TableHead className="min-w-[100px]">CGST Amt</TableHead>
                        <TableHead className="min-w-[80px]">SGST%</TableHead>
                        <TableHead className="min-w-[100px]">SGST Amt</TableHead>
                        <TableHead className="min-w-[80px]">IGST%</TableHead>
                        <TableHead className="min-w-[100px]">IGST Amt</TableHead>
                        <TableHead className="min-w-[120px]">Total</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.map((field, index) => {
                        const item = items[index];
                        const itemCalc = calculateItemGST(item.value, item.cgst, item.sgst, item.igst);
                        const rate = calculateUnitPrice(item.value, item.quantity);

                        return (
                          <TableRow key={field.id} className="hover:bg-muted/30">
                            <TableCell className="text-center font-medium">{index + 1}</TableCell>
                            <TableCell>
                              <Input
                                {...register(`items.${index}.productName`)}
                                placeholder="Product Name"
                                className="h-10 min-w-[260px] w-full border border-input/50 bg-background/50 focus:bg-background focus:border-input focus:ring-1 focus:ring-ring"
                              />
                              {errors.items?.[index]?.productName && (
                                <p className="text-xs text-destructive mt-1">
                                  {errors.items[index]?.productName?.message}
                                </p>
                              )}
                            </TableCell>
                            <TableCell>
                              <Input
                                {...register(`items.${index}.hsn`)}
                                placeholder="HSN"
                                className="h-10 min-w-[90px] border border-input/50 bg-background/50 focus:bg-background focus:border-input focus:ring-1 focus:ring-ring"
                              />
                              {errors.items?.[index]?.hsn && (
                                <p className="text-xs text-destructive mt-1">
                                  {errors.items[index]?.hsn?.message}
                                </p>
                              )}
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                {...register(`items.${index}.quantity`)}
                                placeholder="Qty"
                                className="h-10 min-w-[70px] border border-input/50 bg-background/50 focus:bg-background focus:border-input focus:ring-1 focus:ring-ring text-right"
                              />
                              {errors.items?.[index]?.quantity && (
                                <p className="text-xs text-destructive mt-1">
                                  {errors.items[index]?.quantity?.message}
                                </p>
                              )}
                            </TableCell>
                            <TableCell>
                              <Input
                                {...register(`items.${index}.unit`)}
                                placeholder="Unit"
                                className="h-10 min-w-[70px] border border-input/50 bg-background/50 focus:bg-background focus:border-input focus:ring-1 focus:ring-ring"
                              />
                              {errors.items?.[index]?.unit && (
                                <p className="text-xs text-destructive mt-1">
                                  {errors.items[index]?.unit?.message}
                                </p>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              ₹{rate}
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.01"
                                {...register(`items.${index}.value`)}
                                placeholder="Value"
                                className="h-10 min-w-[110px] border border-input/50 bg-background/50 focus:bg-background focus:border-input focus:ring-1 focus:ring-ring text-right font-mono"
                              />
                              {errors.items?.[index]?.value && (
                                <p className="text-xs text-destructive mt-1">
                                  {errors.items[index]?.value?.message}
                                </p>
                              )}
                            </TableCell>
                            <TableCell>
                              <select
                                className="h-10 min-w-[70px] w-full border border-input/50 bg-background/50 focus:bg-background focus:border-input focus:ring-1 focus:ring-ring text-sm rounded-md px-2"
                                {...register(`items.${index}.cgst`)}
                              >
                                <option value="0">0%</option>
                                <option value="2.5">2.5%</option>
                                <option value="6">6%</option>
                                <option value="9">9%</option>
                                <option value="14">14%</option>
                              </select>
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              ₹{itemCalc.cgstAmt}
                            </TableCell>
                            <TableCell>
                              <select
                                className="h-10 min-w-[70px] w-full border border-input/50 bg-background/50 focus:bg-background focus:border-input focus:ring-1 focus:ring-ring text-sm rounded-md px-2"
                                {...register(`items.${index}.sgst`)}
                              >
                                <option value="0">0%</option>
                                <option value="2.5">2.5%</option>
                                <option value="6">6%</option>
                                <option value="9">9%</option>
                                <option value="14">14%</option>
                              </select>
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              ₹{itemCalc.sgstAmt}
                            </TableCell>
                            <TableCell>
                              <select
                                className="h-10 min-w-[70px] w-full border border-input/50 bg-background/50 focus:bg-background focus:border-input focus:ring-1 focus:ring-ring text-sm rounded-md px-2"
                                {...register(`items.${index}.igst`)}
                              >
                                <option value="0">0%</option>
                                <option value="5">5%</option>
                                <option value="12">12%</option>
                                <option value="18">18%</option>
                                <option value="28">28%</option>
                              </select>
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              ₹{itemCalc.igstAmt}
                            </TableCell>
                            <TableCell className="text-right font-mono font-semibold">
                              ₹{itemCalc.totItemVal}
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
              </CardContent>
            </Card>

            {/* Value Details - Tally Style Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Summary Table */}
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableBody>
                        <TableRow className="bg-muted/30">
                          <TableCell className="font-semibold w-1/3">Total Taxable Amount</TableCell>
                          <TableCell className="text-right font-mono font-semibold">₹{totals.totalAssVal}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-8 text-muted-foreground">CGST</TableCell>
                          <TableCell className="text-right font-mono">₹{totals.totalCgstAmt}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-8 text-muted-foreground">SGST</TableCell>
                          <TableCell className="text-right font-mono">₹{totals.totalSgstAmt}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-8 text-muted-foreground">IGST</TableCell>
                          <TableCell className="text-right font-mono">₹{totals.totalIgstAmt}</TableCell>
                        </TableRow>
                        {watch("roundOffAmount") && parseFloat(watch("roundOffAmount") || "0") !== 0 && (
                          <TableRow>
                            <TableCell className="pl-8 text-muted-foreground">Round Off</TableCell>
                            <TableCell className="text-right font-mono">₹{formatToTwoDecimals(watch("roundOffAmount") || "0")}</TableCell>
                          </TableRow>
                        )}
                        {watch("totalCess") && parseFloat(watch("totalCess") || "0") !== 0 && (
                          <TableRow>
                            <TableCell className="pl-8 text-muted-foreground">Cess</TableCell>
                            <TableCell className="text-right font-mono">₹{formatToTwoDecimals(watch("totalCess") || "0")}</TableCell>
                          </TableRow>
                        )}
                        <TableRow className="bg-primary/10 border-t-2 border-primary">
                          <TableCell className="font-bold text-lg">Total Invoice Amount</TableCell>
                          <TableCell className="text-right font-mono font-bold text-lg text-primary">
                            ₹{finalInvoiceValue}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  {/* Additional Value Fields - Collapsible */}
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">Additional Value Adjustments (Optional)</span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowOptionalSections(prev => ({ ...prev, roundOffCess: !prev.roundOffCess }))}
                        className="flex items-center gap-2"
                      >
                        {showOptionalSections.roundOffCess ? (
                          <>
                            <ChevronUp className="h-4 w-4" />
                            Hide
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4" />
                            Show
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {!showOptionalSections.roundOffCess && (parseFloat(watch("roundOffAmount") || "0") !== 0 || parseFloat(watch("totalCess") || "0") !== 0) && (
                      <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded border border-dashed mb-3">
                        <div className="flex items-center gap-1 mb-2">
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                          <span className="font-medium">Additional adjustments are set</span>
                        </div>
                        <div className="space-y-1 pl-4">
                          {parseFloat(watch("roundOffAmount") || "0") !== 0 && (
                            <div>• Round Off: ₹{formatToTwoDecimals(watch("roundOffAmount") || "0")}</div>
                          )}
                          {parseFloat(watch("totalCess") || "0") !== 0 && (
                            <div>• Cess: ₹{formatToTwoDecimals(watch("totalCess") || "0")}</div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {showOptionalSections.roundOffCess && (
                      <div className="grid gap-4 md:grid-cols-2 border rounded-lg p-4 bg-muted/20">
                        <div className="space-y-2">
                          <Label htmlFor="roundOffAmount" className="text-sm">
                            Round Off Amount <span className="text-muted-foreground text-xs">(Optional)</span>
                          </Label>
                          <Input
                            id="roundOffAmount"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...register("roundOffAmount")}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="totalCess" className="text-sm">
                            Total Cess <span className="text-muted-foreground text-xs">(Optional)</span>
                          </Label>
                          <Input
                            id="totalCess"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...register("totalCess")}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "transport" && (
          <div className="space-y-6">
              {/* Transportation Details */}
              <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Transportation Details
              </CardTitle>
              <CardDescription>Required for E-Way Bill generation</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="transporterName">Transporter Name</Label>
                <Input
                  id="transporterName"
                  {...register("transporterName")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="approximateDistance">Approximate Distance (KM)</Label>
                <Input
                  id="approximateDistance"
                  type="number"
                  {...register("approximateDistance")}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-4">Part-B</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Transport Mode</Label>
                  <div className="flex gap-4">
                    {TRANSPORT_MODES.map((mode) => (
                      <div key={mode.value} className="flex items-center gap-2">
                        <input
                          type="radio"
                          id={`transport-${mode.value}`}
                          value={mode.value}
                          {...register("transportMode")}
                          className="h-4 w-4"
                        />
                        <Label htmlFor={`transport-${mode.value}`} className="cursor-pointer">
                          {mode.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Vehicle Type</Label>
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
                  <Label htmlFor="vehicleNo">Vehicle Number</Label>
                  <Input
                    id="vehicleNo"
                    {...register("vehicleNo")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transportDocNo">Transporter Doc. No.</Label>
                  <Input
                    id="transportDocNo"
                    placeholder="Enter document number"
                    {...register("transportDocNo")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transportDocDate">Transporter Doc. Date (Optional)</Label>
                  <Input
                    id="transportDocDate"
                    type="text"
                    placeholder="dd/MM/yyyy"
                    {...register("transportDocDate")}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
          </div>
        )}

        {activeTab === "payment" && (
          <div className="space-y-6">
              {/* Payment Details (Optional) */}
              <Card className="border-dashed">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  Payment Details
                  <span className="text-sm font-normal text-muted-foreground ml-2">(Optional)</span>
                </CardTitle>
                <CardDescription>Payment information for the invoice</CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowOptionalSections(prev => ({ ...prev, payment: !prev.payment }))}
                className="flex items-center gap-2"
              >
                {showOptionalSections.payment ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Hide
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Show
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          {!showOptionalSections.payment && (watch("paymentName") || watch("paymentAccount") || watch("paymentMode")) && (
            <CardContent>
              <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded border border-dashed">
                <div className="flex items-center gap-1 mb-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span className="font-medium">Some payment details are filled</span>
                </div>
                <div className="space-y-1 pl-4">
                  {watch("paymentName") && <div>• Name: {watch("paymentName")}</div>}
                  {watch("paymentAccount") && <div>• Account: {watch("paymentAccount")}</div>}
                  {watch("paymentMode") && <div>• Mode: {watch("paymentMode")}</div>}
                </div>
              </div>
            </CardContent>
          )}
          {showOptionalSections.payment && (
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="paymentName">Payment Name</Label>
              <Input
                id="paymentName"
                placeholder="Enter payment name"
                {...register("paymentName")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentAccount">Account Number</Label>
              <Input
                id="paymentAccount"
                placeholder="Enter account number"
                {...register("paymentAccount")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMode">Payment Mode</Label>
              <select
                id="paymentMode"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...register("paymentMode")}
              >
                <option value="">Select Mode</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
                <option value="DD">Demand Draft</option>
                <option value="RTGS">RTGS</option>
                <option value="NEFT">NEFT</option>
                <option value="IMPS">IMPS</option>
                <option value="UPI">UPI</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentIFSC">IFSC Code</Label>
              <Input
                id="paymentIFSC"
                placeholder="Enter IFSC code"
                {...register("paymentIFSC")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentTerms">Payment Terms</Label>
              <Input
                id="paymentTerms"
                placeholder="Enter payment terms"
                {...register("paymentTerms")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="creditDays">Credit Days</Label>
              <Input
                id="creditDays"
                type="number"
                placeholder="Enter credit days"
                {...register("creditDays")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paidAmount">Paid Amount</Label>
              <Input
                id="paidAmount"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register("paidAmount")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentDue">Payment Due</Label>
              <Input
                id="paymentDue"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register("paymentDue")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentInstruction">Payment Instruction</Label>
              <Input
                id="paymentInstruction"
                placeholder="Enter payment instruction"
                {...register("paymentInstruction")}
              />
            </div>
          </CardContent>
          )}
        </Card>

        {/* Reference Details (Optional) */}
        <Card className="border-dashed">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  Reference Details
                  <span className="text-sm font-normal text-muted-foreground ml-2">(Optional)</span>
                </CardTitle>
                <CardDescription>Additional reference information</CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowOptionalSections(prev => ({ ...prev, reference: !prev.reference }))}
                className="flex items-center gap-2"
              >
                {showOptionalSections.reference ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Hide
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Show
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          {!showOptionalSections.reference && (watch("invoiceRemarks") || watch("invoicePeriodStart") || watch("invoicePeriodEnd")) && (
            <CardContent>
              <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded border border-dashed">
                <div className="flex items-center gap-1 mb-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span className="font-medium">Some reference details are filled</span>
                </div>
                <div className="space-y-1 pl-4">
                  {watch("invoiceRemarks") && <div>• Remarks: {watch("invoiceRemarks")}</div>}
                  {watch("invoicePeriodStart") && <div>• Period: {watch("invoicePeriodStart")} to {watch("invoicePeriodEnd") || "..."}</div>}
                </div>
              </div>
            </CardContent>
          )}
          {showOptionalSections.reference && (
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="invoiceRemarks">Invoice Remarks</Label>
              <Input
                id="invoiceRemarks"
                placeholder="Enter remarks"
                {...register("invoiceRemarks")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoicePeriodStart">Invoice Period Start Date</Label>
              <Input
                id="invoicePeriodStart"
                type="text"
                placeholder="dd/MM/yyyy"
                {...register("invoicePeriodStart")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoicePeriodEnd">Invoice Period End Date</Label>
              <Input
                id="invoicePeriodEnd"
                type="text"
                placeholder="dd/MM/yyyy"
                {...register("invoicePeriodEnd")}
              />
            </div>
          </CardContent>
          )}
        </Card>

        {/* Export Details (Optional) */}
        <Card className="border-dashed">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-muted-foreground" />
                  Export Details
                  <span className="text-sm font-normal text-muted-foreground ml-2">(Optional)</span>
                </CardTitle>
                <CardDescription>Required for export invoices</CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowOptionalSections(prev => ({ ...prev, export: !prev.export }))}
                className="flex items-center gap-2"
              >
                {showOptionalSections.export ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Hide
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Show
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          {!showOptionalSections.export && (watch("shippingBillNo") || watch("port") || watch("forCurrency")) && (
            <CardContent>
              <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded border border-dashed">
                <div className="flex items-center gap-1 mb-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span className="font-medium">Some export details are filled</span>
                </div>
                <div className="space-y-1 pl-4">
                  {watch("shippingBillNo") && <div>• Shipping Bill: {watch("shippingBillNo")}</div>}
                  {watch("port") && <div>• Port: {watch("port")}</div>}
                  {watch("forCurrency") && <div>• Currency: {watch("forCurrency")}</div>}
                </div>
              </div>
            </CardContent>
          )}
          {showOptionalSections.export && (
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="shippingBillNo">Shipping Bill No.</Label>
              <Input
                id="shippingBillNo"
                placeholder="Enter shipping bill number"
                {...register("shippingBillNo")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shippingBillDate">Shipping Bill Date</Label>
              <Input
                id="shippingBillDate"
                type="text"
                placeholder="dd/MM/yyyy"
                {...register("shippingBillDate")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                placeholder="Enter port code"
                {...register("port")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="forCurrency">Foreign Currency</Label>
              <Input
                id="forCurrency"
                placeholder="e.g., USD, EUR"
                {...register("forCurrency")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="countryCode">Country Code</Label>
              <Input
                id="countryCode"
                placeholder="e.g., US, AE"
                maxLength={2}
                {...register("countryCode")}
              />
            </div>
          </CardContent>
          )}
        </Card>
          </div>
        )}

        {/* Tab Navigation Buttons */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {activeTab !== "transaction" && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const tabs = ["transaction", "buyer", "dispatch", "items", "transport", "payment"];
                      const currentIndex = tabs.indexOf(activeTab);
                      if (currentIndex > 0) {
                        setActiveTab(tabs[currentIndex - 1]);
                      }
                    }}
                  >
                    ← Previous
                  </Button>
                )}
                {activeTab !== "payment" && (
                  <Button
                    type="button"
                    onClick={() => {
                      const tabs = ["transaction", "buyer", "dispatch", "items", "transport", "payment"];
                      const currentIndex = tabs.indexOf(activeTab);
                      if (currentIndex < tabs.length - 1) {
                        setActiveTab(tabs[currentIndex + 1]);
                      }
                    }}
                  >
                    Next →
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={!canSubmit} size="lg">
                  {isSubmitting ? (
                    <>
                      <Loader size="sm" className="mr-2" />
                      Generating...
                    </>
                  ) : (
                    "Generate E-Invoice"
                  )}
                </Button>
              </div>
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
