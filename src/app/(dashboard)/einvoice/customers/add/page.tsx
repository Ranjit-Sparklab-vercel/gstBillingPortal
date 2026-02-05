"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Save, Search } from "lucide-react";
import { ROUTES } from "@/constants";
import { STATE_CODES } from "@/constants/stateCodes";
import { einvoiceService } from "@/services/gst/einvoice.service";
import { gstAuthService } from "@/services/gst/auth.service";
import { GST_API_CONFIG } from "@/config/gstApi.config";
import { Loader } from "@/components/common/loader";

// Customer Form Schema
const customerFormSchema = z.object({
  name: z.string().min(1, "Customer name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  gstin: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 15,
      "GSTIN must be 15 characters if provided"
    ),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pincode: z
    .string()
    .min(6, "Pincode must be 6 digits")
    .max(6, "Pincode must be 6 digits")
    .regex(/^\d+$/, "Pincode must contain only numbers"),
});

type CustomerFormData = z.infer<typeof customerFormSchema>;

export default function AddCustomerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingGSTN, setIsLoadingGSTN] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      gstin: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
    },
  });

  const gstin = watch("gstin");

  // Authenticate on component mount
  useEffect(() => {
    authenticate();
  }, []);

  const authenticate = async () => {
    try {
      const config = {
        email: GST_API_CONFIG.SANDBOX.email,
        username: GST_API_CONFIG.SANDBOX.username,
        password: GST_API_CONFIG.SANDBOX.password,
        ip_address: GST_API_CONFIG.SANDBOX.ip_address,
        client_id: GST_API_CONFIG.SANDBOX.client_id,
        client_secret: GST_API_CONFIG.SANDBOX.client_secret,
        gstin: GST_API_CONFIG.SANDBOX.gstin,
      };
      const response = await gstAuthService.authenticate(config);
      if (response.status_cd === "Sucess" || response.status_cd === "1") {
        setAuthToken(response.data.AuthToken);
      }
    } catch (error) {
      console.error("Authentication error:", error);
      toast({
        title: "Authentication Failed",
        description: "Failed to authenticate. GSTN Lookup may not work.",
        variant: "destructive",
      });
    }
  };

  // Handle GSTN Lookup
  const handleGSTNLookup = async () => {
    if (!gstin || gstin.length !== 15) {
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
      
      // Extract data from response - can be response.data.data or response.data
      const gstnData = response.data?.data || response.data || response;
      
      if (gstnData && (gstnData.LegalName || gstnData.TradeName)) {
        const {
          LegalName,
          TradeName,
          AddrBno,
          AddrBnm,
          AddrSt,
          AddrLoc,
          StateCode,
          AddrPncd,
          Gstin,
        } = gstnData;

        // Set form values from GSTN data
        setValue("name", TradeName || LegalName || "");
        
        // Combine address fields
        const addressParts = [
          AddrBno,
          AddrBnm,
          AddrSt,
        ].filter(Boolean);
        setValue("address", addressParts.join(", ") || "");
        
        setValue("city", AddrLoc || "");
        
        // Find state label from StateCode
        if (StateCode) {
          const stateInfo = STATE_CODES.find((s) => s.value === StateCode.toString());
          if (stateInfo) {
            setValue("state", stateInfo.label);
          }
        }
        
        setValue("pincode", AddrPncd || "");
        setValue("gstin", Gstin || gstin);

        toast({
          title: "Success",
          description: "GSTN details loaded successfully",
        });
      } else {
        toast({
          title: "No Data",
          description: "GSTN details not found or invalid response",
          variant: "destructive",
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

  const onSubmit = (data: CustomerFormData) => {
    setIsSubmitting(true);
    
    // Frontend only - no API or Database call
    // Just show success message and navigate
    setTimeout(() => {
      toast({
        title: "Success",
        description: "Customer form submitted successfully!",
      });

      // Navigate back to E-Invoice dashboard
      router.push(ROUTES.EINVOICE.ROOT);
      setIsSubmitting(false);
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(ROUTES.EINVOICE.ROOT)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Customer</h1>
          <p className="text-muted-foreground">
            Add a new customer to your E-Invoice system
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>
              Enter customer details. Fields marked with * are required.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                {/* GSTIN */}
                <div className="space-y-2">
                  <Label htmlFor="gstin">GSTIN</Label>
                  <div className="flex gap-2">
                    <Input
                      id="gstin"
                      placeholder="29AABCU9603R1ZM"
                      maxLength={15}
                      {...register("gstin")}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGSTNLookup}
                      disabled={isLoadingGSTN || !gstin || gstin.length !== 15}
                      className="shrink-0"
                    >
                      {isLoadingGSTN ? (
                        <Loader size="sm" />
                      ) : (
                        <>
                          <Search className="h-4 w-4 mr-2" />
                          Lookup
                        </>
                      )}
                    </Button>
                  </div>
                  {errors.gstin && (
                    <p className="text-sm text-destructive">
                      {errors.gstin.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Enter 15-character GSTIN and click Lookup to auto-fill details
                  </p>
                </div>

                {/* Customer Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Customer Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="Enter customer name"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="customer@example.com"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    {...register("phone")}
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive">
                      {errors.phone.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Address Information</h3>
              
              <div className="space-y-4">
                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="address">
                    Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="address"
                    placeholder="Enter street address"
                    {...register("address")}
                  />
                  {errors.address && (
                    <p className="text-sm text-destructive">
                      {errors.address.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {/* City */}
                  <div className="space-y-2">
                    <Label htmlFor="city">
                      City <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="city"
                      placeholder="Enter city"
                      {...register("city")}
                    />
                    {errors.city && (
                      <p className="text-sm text-destructive">
                        {errors.city.message}
                      </p>
                    )}
                  </div>

                  {/* State */}
                  <div className="space-y-2">
                    <Label htmlFor="state">
                      State <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="state"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...register("state")}
                    >
                      <option value="">Select State</option>
                      {STATE_CODES.map((state) => (
                        <option key={state.value} value={state.label}>
                          {state.label}
                        </option>
                      ))}
                    </select>
                    {errors.state && (
                      <p className="text-sm text-destructive">
                        {errors.state.message}
                      </p>
                    )}
                  </div>

                  {/* Pincode */}
                  <div className="space-y-2">
                    <Label htmlFor="pincode">
                      Pincode <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="pincode"
                      placeholder="400001"
                      maxLength={6}
                      {...register("pincode")}
                    />
                    {errors.pincode && (
                      <p className="text-sm text-destructive">
                        {errors.pincode.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-4 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(ROUTES.EINVOICE.ROOT)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? "Saving..." : "Save Customer"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
