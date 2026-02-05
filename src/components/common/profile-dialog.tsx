"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/ui/use-toast";
import { User, Mail, Phone, MapPin, Building, Edit, Save, X, FileText, Calendar, CheckCircle } from "lucide-react";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Static profile data for Glowline (temporary) - moved outside component to prevent re-creation
// GST Details from GSTN Lookup
const STATIC_USER_DATA = {
  id: "1",
  name: "SANGRAM SANTRAM KURADE",
  email: "glowline.thermoplastic@gmail.com",
  phone: "+91 9876543210",
  address: "CTC 3443/A, Sankeshwar, HANUMAN NAGAR",
  city: "Sankeshwar",
  state: "Karnataka",
  pincode: "591313",
  company: "GLOWLINE THERMOPLASTIC PAINTS",
  gstin: "29FTHPK8890K1ZN",
  status: "ACT",
  registrationDate: "2023-11-15",
  taxpayerType: "REG",
};

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Static profile data for Glowline (temporary)
  const displayUser = useMemo(() => STATIC_USER_DATA, []);

  const [formData, setFormData] = useState({
    name: displayUser.name || "",
    email: displayUser.email || "",
    phone: displayUser.phone || "",
    address: displayUser.address || "",
    city: displayUser.city || "",
    state: displayUser.state || "",
    pincode: displayUser.pincode || "",
    company: displayUser.company || "",
    gstin: displayUser.gstin || "",
  });

  // Reset form data when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        name: displayUser.name || "",
        email: displayUser.email || "",
        phone: displayUser.phone || "",
        address: displayUser.address || "",
        city: displayUser.city || "",
        state: displayUser.state || "",
        pincode: displayUser.pincode || "",
        company: displayUser.company || "",
        gstin: displayUser.gstin || "",
      });
      setIsEditMode(false);
    }
  }, [open, displayUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleCancel = () => {
    // Reset form data to original values
    setFormData({
      name: displayUser.name || "",
      email: displayUser.email || "",
      phone: displayUser.phone || "",
      address: displayUser.address || "",
      city: displayUser.city || "",
      state: displayUser.state || "",
      pincode: displayUser.pincode || "",
      company: displayUser.company || "",
    });
    setIsEditMode(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // TODO: Implement actual API call to update profile
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      
      setIsEditMode(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>My Profile</DialogTitle>
              <DialogDescription>
                {isEditMode ? "Edit your account information" : "View your account information"}
              </DialogDescription>
            </div>
            {!isEditMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        </DialogHeader>

        <form onSubmit={handleSave}>
          <div className="grid gap-6 md:grid-cols-2 mt-4">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Your personal details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Full Name
                    </Label>
                    {isEditMode ? (
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter your full name"
                      />
                    ) : (
                      <p className="text-base font-medium">{formData.name || "Not provided"}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Address
                    </Label>
                    {isEditMode ? (
                      <>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="Enter your email"
                          disabled
                          className="bg-muted"
                        />
                        <p className="text-xs text-muted-foreground">
                          Email cannot be changed
                        </p>
                      </>
                    ) : (
                      <p className="text-base font-medium">{formData.email || "Not provided"}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone Number
                    </Label>
                    {isEditMode ? (
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Enter your phone number"
                      />
                    ) : (
                      <p className="text-base font-medium">{formData.phone || "Not provided"}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company" className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Company Name
                    </Label>
                    {isEditMode ? (
                      <Input
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        placeholder="Enter your company name"
                      />
                    ) : (
                      <p className="text-base font-medium">{formData.company || "Not provided"}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gstin" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      GSTIN
                    </Label>
                    {isEditMode ? (
                      <Input
                        id="gstin"
                        name="gstin"
                        value={formData.gstin}
                        onChange={handleChange}
                        placeholder="Enter GSTIN"
                        maxLength={15}
                      />
                    ) : (
                      <p className="text-base font-medium">{formData.gstin || "Not provided"}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Address Information
                </CardTitle>
                <CardDescription>
                  Your address details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Address
                    </Label>
                    {isEditMode ? (
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Enter your address"
                      />
                    ) : (
                      <p className="text-base font-medium">{formData.address || "Not provided"}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      {isEditMode ? (
                        <Input
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          placeholder="Enter city"
                        />
                      ) : (
                        <p className="text-base font-medium">{formData.city || "Not provided"}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      {isEditMode ? (
                        <Input
                          id="state"
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                          placeholder="Enter state"
                        />
                      ) : (
                        <p className="text-base font-medium">{formData.state || "Not provided"}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pincode">Pincode</Label>
                    {isEditMode ? (
                      <Input
                        id="pincode"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleChange}
                        placeholder="Enter pincode"
                      />
                    ) : (
                      <p className="text-base font-medium">{formData.pincode || "Not provided"}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* GST Information */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  GST Information
                </CardTitle>
                <CardDescription>
                  GST registration details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <CheckCircle className="h-4 w-4" />
                      Status
                    </div>
                    <p className="text-base font-medium">{displayUser.status || "Not provided"}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Registration Date
                    </div>
                    <p className="text-base font-medium">{displayUser.registrationDate || "Not provided"}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      Taxpayer Type
                    </div>
                    <p className="text-base font-medium">{displayUser.taxpayerType || "Not provided"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          {isEditMode && (
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
              >
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
