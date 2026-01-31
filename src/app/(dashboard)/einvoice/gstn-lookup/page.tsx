"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { einvoiceService } from "@/services/gst/einvoice.service";
import { gstAuthService } from "@/services/gst/auth.service";
import { GST_API_CONFIG } from "@/config/gstApi.config";
import { Loader } from "@/components/common/loader";
import { Search, Building2, MapPin, FileText, RefreshCw } from "lucide-react";

const gstnLookupSchema = z.object({
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GSTIN format"),
});

type GSTNLookupFormData = z.infer<typeof gstnLookupSchema>;

export default function GSTNLookupPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [gstnDetails, setGstnDetails] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

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
        description: "Failed to authenticate. Please refresh the page.",
        variant: "destructive",
      });
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<GSTNLookupFormData>({
    resolver: zodResolver(gstnLookupSchema),
  });

  const gstin = watch("gstin");

  const onSubmit = async (data: GSTNLookupFormData) => {
    if (!authToken) {
      toast({
        title: "Authentication Required",
        description: "Please wait for authentication to complete.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
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

      const details = await einvoiceService.getGSTNDetails(data.gstin, config);
      
      // Debug: Log the response to understand the structure
      console.log("GSTN API Response:", details);
      console.log("Response status_cd:", details.status_cd);
      console.log("Response data:", details.data);
      
      setGstnDetails(details);
      toast({
        title: "Success",
        description: "GSTN details retrieved successfully",
      });
    } catch (error: any) {
      console.error("GSTN Lookup Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to get GSTN details",
        variant: "destructive",
      });
      setGstnDetails(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncFromCP = async () => {
    if (!gstin) {
      toast({
        title: "Error",
        description: "Please enter GSTIN first",
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

    setIsSyncing(true);
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
      const details = await einvoiceService.syncGSTINFromCP(gstin, config);
      setGstnDetails(details);
      toast({
        title: "Success",
        description: "GSTIN synced from Common Portal successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to sync GSTIN",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">GSTN Lookup</h1>
        <p className="text-muted-foreground">
          Get GSTN details for a given GST Number
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Search Form */}
        <Card>
          <CardHeader>
            <CardTitle>Search GSTN</CardTitle>
            <CardDescription>Enter GSTIN to get details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gstin">GSTIN</Label>
                <Input
                  id="gstin"
                  placeholder="29ABCDE1234F1Z5"
                  maxLength={15}
                  {...register("gstin")}
                />
                {errors.gstin && (
                  <p className="text-sm text-destructive">{errors.gstin.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Format: 15 characters (2 digits + 5 letters + 4 digits + 1 letter + 1 digit + 1 letter + 1 alphanumeric)
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? (
                    <>
                      <Loader size="sm" className="mr-2" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Search
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSyncFromCP}
                  disabled={isSyncing || !gstin}
                >
                  {isSyncing ? (
                    <Loader size="sm" />
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Sync from CP
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>GSTN Details</CardTitle>
            <CardDescription>Retrieved information</CardDescription>
          </CardHeader>
          <CardContent>
            {!gstnDetails || (gstnDetails.status_cd !== "1" && gstnDetails.status_cd !== "Sucess") ? (
              <div className="text-center py-12 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Enter GSTIN to view details</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <FileText className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">GSTIN</p>
                      <p className="font-medium">{gstnDetails.data?.Gstin || gstnDetails.Gstin || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <Building2 className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Trade Name</p>
                      <p className="font-medium">{gstnDetails.data?.TradeName || gstnDetails.TradeName || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <Building2 className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Legal Name</p>
                      <p className="font-medium">{gstnDetails.data?.LegalName || gstnDetails.LegalName || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Address</p>
                      <p className="font-medium">
                        {[
                          gstnDetails.data?.AddrBno || gstnDetails.AddrBno,
                          gstnDetails.data?.AddrFlno || gstnDetails.AddrFlno,
                          gstnDetails.data?.AddrLoc || gstnDetails.AddrLoc,
                          gstnDetails.data?.AddrSt || gstnDetails.AddrSt
                        ].filter(Boolean).join(", ") || "N/A"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Pincode: {gstnDetails.data?.AddrPncd || gstnDetails.AddrPncd || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <FileText className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Status</p>
                      <p className="font-medium">{gstnDetails.data?.Status || gstnDetails.Status || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <FileText className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Registration Date</p>
                      <p className="font-medium">{gstnDetails.data?.DtReg || gstnDetails.DtReg || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <FileText className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Taxpayer Type</p>
                      <p className="font-medium">{gstnDetails.data?.TxpType || gstnDetails.TxpType || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <FileText className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">State Code</p>
                      <p className="font-medium">{gstnDetails.data?.StateCode || gstnDetails.StateCode || "N/A"}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
