"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader } from "@/components/common/loader";
import { AlertTriangle, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

/**
 * Extend Validity Dialog Component
 * Government-portal-like flow for extending E-Way Bill validity
 * 
 * Rules:
 * - Allowed ONLY for Active E-Way Bills
 * - Reason mandatory
 * - Current location mandatory
 * - Valid only within govt-allowed window
 */

const extendValiditySchema = z.object({
  extendReason: z
    .string()
    .min(1, "Reason is mandatory")
    .min(10, "Reason must be at least 10 characters"),
  currentLocation: z
    .string()
    .min(1, "Current location is mandatory")
    .min(3, "Current location must be at least 3 characters"),
  newValidUntil: z.string().min(1, "New validity date is mandatory"),
}).refine(
  (data) => {
    // Validate new validity date is in the future
    try {
      const [datePart, timePart] = data.newValidUntil.split(" ");
      const [day, month, year] = datePart.split("/");
      const newDate = new Date(`${year}-${month}-${day} ${timePart || "23:59"}`);
      return newDate > new Date();
    } catch {
      return false;
    }
  },
  {
    message: "New validity date must be in the future",
    path: ["newValidUntil"],
  }
);

type ExtendValidityFormData = z.infer<typeof extendValiditySchema>;

interface ExtendValidityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ewayBill: {
    id: string;
    ewayBillNumber: string;
    status: "ACTIVE" | "EXPIRED" | "CANCELLED";
    validUntil: string;
    fromPlace: string;
    toPlace: string;
  };
  onSuccess?: () => void;
}

export function ExtendValidityDialog({
  open,
  onOpenChange,
  ewayBill,
  onSuccess,
}: ExtendValidityDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [newValidUntilDate, setNewValidUntilDate] = useState<Date | null>(null);
  const [newValidUntilTime, setNewValidUntilTime] = useState<string>("23:59");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ExtendValidityFormData>({
    resolver: zodResolver(extendValiditySchema),
    defaultValues: {
      extendReason: "",
      currentLocation: "",
      newValidUntil: "",
    },
  });

  // Calculate default new validity (current validUntil + 1 day, max 72 hours from now as per govt rules)
  useEffect(() => {
    if (open && ewayBill.validUntil) {
      const currentValidUntil = new Date(ewayBill.validUntil);
      const now = new Date();
      const maxValidUntil = new Date(now.getTime() + 72 * 60 * 60 * 1000); // 72 hours from now
      
      // Default: current validUntil + 1 day, but not more than 72 hours from now
      const defaultDate = new Date(currentValidUntil);
      defaultDate.setDate(defaultDate.getDate() + 1);
      
      const finalDate = defaultDate > maxValidUntil ? maxValidUntil : defaultDate;
      setNewValidUntilDate(finalDate);
      setValue("newValidUntil", format(finalDate, "dd/MM/yyyy HH:mm"));
    }
  }, [open, ewayBill.validUntil, setValue]);

  // Reset form when dialog opens/closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset();
      setNewValidUntilDate(null);
      setNewValidUntilTime("23:59");
    }
    onOpenChange(newOpen);
  };

  const onSubmit = async (data: ExtendValidityFormData) => {
    // Validate: Only Active E-Way Bills allowed
    if (ewayBill.status !== "ACTIVE") {
      toast({
        title: "Extension Not Allowed",
        description: "Only Active E-Way Bills can be extended. Current status: " + ewayBill.status,
        variant: "destructive",
      });
      return;
    }

    // Validate: New validity must be within govt-allowed window (72 hours from now)
    const now = new Date();
    const maxValidUntil = new Date(now.getTime() + 72 * 60 * 60 * 1000); // 72 hours from now
    
    try {
      const [datePart, timePart] = data.newValidUntil.split(" ");
      const [day, month, year] = datePart.split("/");
      const newDate = new Date(`${year}-${month}-${day} ${timePart || "23:59"}`);
      
      if (newDate > maxValidUntil) {
        toast({
          title: "Extension Not Allowed",
          description: "E-Way Bill validity can be extended only up to 72 hours from current time as per Government rules.",
          variant: "destructive",
        });
        return;
      }

      if (newDate <= new Date(ewayBill.validUntil)) {
        toast({
          title: "Invalid Date",
          description: "New validity date must be after current validity date.",
          variant: "destructive",
        });
        return;
      }
    } catch (error) {
      toast({
        title: "Invalid Date Format",
        description: "Please enter a valid date and time.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        extendReason: data.extendReason.trim(),
        currentLocation: data.currentLocation.trim(),
        newValidUntil: data.newValidUntil.trim(),
        status: ewayBill.status,
        currentValidUntil: ewayBill.validUntil,
      };

      // Call API route
      const response = await fetch(
        `/api/eway-bills/${ewayBill.ewayBillNumber}/extend-validity`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to extend validity");
      }

      toast({
        title: "Success",
        description: "E-Way Bill validity extended successfully. New validity date has been updated.",
      });

      handleOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Extend Validity Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to extend validity",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (date: Date | null) => {
    setNewValidUntilDate(date);
    if (date) {
      const formatted = format(date, "dd/MM/yyyy") + " " + newValidUntilTime;
      setValue("newValidUntil", formatted);
    }
  };

  const handleTimeChange = (time: string) => {
    setNewValidUntilTime(time);
    if (newValidUntilDate) {
      const formatted = format(newValidUntilDate, "dd/MM/yyyy") + " " + time;
      setValue("newValidUntil", formatted);
    }
  };

  const currentValidUntil = ewayBill.validUntil ? new Date(ewayBill.validUntil) : null;
  const maxValidUntil = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours from now
  const isDisabled = ewayBill.status !== "ACTIVE" || isLoading;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Extend E-Way Bill Validity
          </DialogTitle>
          <DialogDescription className="space-y-2">
            <div>
              E-Way Bill: <strong>{ewayBill.ewayBillNumber}</strong>
            </div>
            {ewayBill.status !== "ACTIVE" && (
              <div className="text-destructive font-medium">
                ⚠️ Extension not allowed: Only Active E-Way Bills can be extended. Current status: {ewayBill.status}
              </div>
            )}
            {currentValidUntil && (
              <div className="text-sm text-muted-foreground">
                Current Validity: {format(currentValidUntil, "dd/MM/yyyy HH:mm")}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Government-style Warning */}
        <div className="rounded-lg border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/20 p-4 space-y-2">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
                Government Rules for Validity Extension
              </p>
              <ul className="text-xs text-amber-800 dark:text-amber-300 space-y-1 list-disc list-inside ml-2">
                <li>Validity can be extended only up to 72 hours from current time</li>
                <li>Extension is allowed only for Active E-Way Bills</li>
                <li>Current location must be provided accurately</li>
                <li>Reason for extension is mandatory</li>
              </ul>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Current Location */}
          <div className="space-y-2">
            <Label htmlFor="currentLocation">
              Current Location <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="currentLocation"
                placeholder="Enter current location (e.g., Mumbai, Maharashtra)"
                {...register("currentLocation")}
                className={errors.currentLocation ? "border-destructive pl-10" : "pl-10"}
                disabled={isDisabled}
              />
            </div>
            {errors.currentLocation && (
              <p className="text-sm text-destructive">{errors.currentLocation.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Enter the current location where the goods are present
            </p>
          </div>

          {/* Extend Reason */}
          <div className="space-y-2">
            <Label htmlFor="extendReason">
              Reason for Extension <span className="text-red-500">*</span>
            </Label>
            <textarea
              id="extendReason"
              placeholder="Enter detailed reason for extending validity (minimum 10 characters)"
              rows={3}
              {...register("extendReason")}
              disabled={isDisabled}
              className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                errors.extendReason ? "border-destructive" : ""
              }`}
            />
            {errors.extendReason && (
              <p className="text-sm text-destructive">{errors.extendReason.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Provide detailed reason for extending validity (minimum 10 characters required)
            </p>
          </div>

          {/* New Validity Date & Time */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="newValidUntilDate">
                New Validity Date <span className="text-red-500">*</span>
              </Label>
              <DatePicker
                selected={newValidUntilDate}
                onChange={handleDateChange}
                dateFormat="dd/MM/yyyy"
                placeholderText="dd/mm/yyyy"
                minDate={currentValidUntil || new Date()}
                maxDate={maxValidUntil}
                disabled={isDisabled}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                wrapperClassName="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newValidUntilTime">
                New Validity Time <span className="text-red-500">*</span>
              </Label>
              <Input
                id="newValidUntilTime"
                type="time"
                value={newValidUntilTime}
                onChange={(e) => handleTimeChange(e.target.value)}
                disabled={isDisabled}
                className="disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>
          {errors.newValidUntil && (
            <p className="text-sm text-destructive">{errors.newValidUntil.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Maximum validity extension allowed: {format(maxValidUntil, "dd/MM/yyyy HH:mm")} (72 hours from now)
          </p>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isDisabled || isLoading}
              title={ewayBill.status !== "ACTIVE" ? "Only Active E-Way Bills can be extended" : ""}
            >
              {isLoading ? (
                <>
                  <Loader size="sm" className="mr-2" />
                  Extending...
                </>
              ) : (
                "Extend Validity"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
