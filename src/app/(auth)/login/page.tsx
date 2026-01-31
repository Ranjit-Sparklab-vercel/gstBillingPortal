"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/ui/use-toast";
import { ROUTES } from "@/constants";
import { UserRole } from "@/types";
import api from "@/lib/api";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const emailValue = watch("email");
  const passwordValue = watch("password");

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await api.post("/auth/login", data);
      
      const authData = response.data || {
        user: {
          id: "1",
          email: data.email,
          name: "Demo User",
          role: UserRole.USER,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        token: "mock-jwt-token-" + Date.now(),
      };

      setAuth(authData);
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
      
      if (rememberMe) {
        localStorage.setItem("rememberEmail", data.email);
      } else {
        localStorage.removeItem("rememberEmail");
      }
      
      router.push(ROUTES.DASHBOARD);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Login failed. Using demo mode.",
        variant: "destructive",
      });
      const authData = {
        user: {
          id: "1",
          email: data.email,
          name: "Demo User",
          role: UserRole.USER,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        token: "mock-jwt-token-" + Date.now(),
      };
      setAuth(authData);
      router.push(ROUTES.DASHBOARD);
    } finally {
      setIsLoading(false);
    }
  };

  // Load remembered email
  useEffect(() => {
    const rememberedEmail = localStorage.getItem("rememberEmail");
    if (rememberedEmail) {
      setValue("email", rememberedEmail);
      setRememberMe(true);
    }
  }, [setValue]);

  return (
    <div className="w-full">
      {/* Login Form Card */}
      <Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
        <CardContent className="p-8">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <ArrowRight className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Sign In</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to access your account
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <div className="relative">
                <Mail 
                  className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors ${
                    focusedField === "email" ? "text-primary" : "text-muted-foreground"
                  }`} 
                />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className={`pl-11 h-12 text-base ${
                    errors.email 
                      ? "border-destructive focus-visible:ring-destructive" 
                      : focusedField === "email"
                      ? "border-primary ring-2 ring-primary/20"
                      : ""
                  }`}
                  {...register("email")}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                />
                {emailValue && !errors.email && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
              {errors.email && (
                <p className="text-sm text-destructive mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock 
                  className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors ${
                    focusedField === "password" ? "text-primary" : "text-muted-foreground"
                  }`} 
                />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className={`pl-11 pr-11 h-12 text-base ${
                    errors.password 
                      ? "border-destructive focus-visible:ring-destructive" 
                      : focusedField === "password"
                      ? "border-primary ring-2 ring-primary/20"
                      : ""
                  }`}
                  {...register("password")}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-muted"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
                {passwordValue && !errors.password && passwordValue.length >= 6 && (
                  <div className="absolute right-11 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
              {errors.password && (
                <p className="text-sm text-destructive mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                />
                <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                  Remember me
                </label>
              </div>
              <Link
                href={ROUTES.FORGOT_PASSWORD}
                className="text-sm text-primary hover:underline font-medium transition-all"
              >
                Forgot password?
              </Link>
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold group"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Signing in...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </Button>
          </form>

          {/* Create Account Link */}
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Don&apos;t have an account? </span>
            <Link
              href={ROUTES.REGISTER}
              className="text-primary hover:underline font-semibold transition-all"
            >
              Create account
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
