"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/store/authStore";
import { User, Mail, Phone, MapPin, Building } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuthStore();
  
  // Mock user data when not logged in
  const displayUser = user || {
    id: "1",
    name: "Demo User",
    email: "demo@example.com",
    phone: "+91 9876543210",
    address: "123 Business Street",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
    company: "ABC Enterprises",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">
          View your account information
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
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
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <User className="h-4 w-4" />
                  Full Name
                </div>
                <p className="text-base font-medium">{displayUser.name || "Not provided"}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  Email Address
                </div>
                <p className="text-base font-medium">{displayUser.email || "Not provided"}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </div>
                <p className="text-base font-medium">{displayUser.phone || "Not provided"}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Building className="h-4 w-4" />
                  Company Name
                </div>
                <p className="text-base font-medium">{displayUser.company || "Not provided"}</p>
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
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  Address
                </div>
                <p className="text-base font-medium">{displayUser.address || "Not provided"}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">City</div>
                  <p className="text-base font-medium">{displayUser.city || "Not provided"}</p>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">State</div>
                  <p className="text-base font-medium">{displayUser.state || "Not provided"}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Pincode</div>
                <p className="text-base font-medium">{displayUser.pincode || "Not provided"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
