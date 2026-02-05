"use client";

import Link from "next/link";
import { ROUTES } from "@/constants";
import { FileText, Calculator, Receipt, TrendingUp, Shield, Zap } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left Side - Simple Branding with Vectors */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary overflow-hidden">
        {/* Background Vectors/Patterns */}
        <div className="absolute inset-0 opacity-10">
          {/* Invoice/Document Icons */}
          <FileText className="absolute top-20 left-20 h-32 w-32 text-white" strokeWidth={1} />
          <FileText className="absolute top-40 right-32 h-24 w-24 text-white" strokeWidth={1} />
          <FileText className="absolute bottom-32 left-32 h-28 w-28 text-white" strokeWidth={1} />
          
          {/* Calculator Icons */}
          <Calculator className="absolute top-60 right-20 h-20 w-20 text-white" strokeWidth={1} />
          <Calculator className="absolute bottom-40 right-40 h-16 w-16 text-white" strokeWidth={1} />
          
          {/* Receipt Icons */}
          <Receipt className="absolute top-32 left-1/3 h-24 w-24 text-white" strokeWidth={1} />
          <Receipt className="absolute bottom-60 left-1/4 h-20 w-20 text-white" strokeWidth={1} />
          
          {/* Chart/Trending Icons */}
          <TrendingUp className="absolute top-1/3 right-1/4 h-28 w-28 text-white" strokeWidth={1} />
          <TrendingUp className="absolute bottom-1/4 right-1/3 h-24 w-24 text-white" strokeWidth={1} />
          
          {/* Shield Icon */}
          <Shield className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-40 w-40 text-white" strokeWidth={1} />
          
          {/* Zap/Lightning Icon */}
          <Zap className="absolute top-1/4 left-1/2 h-20 w-20 text-white" strokeWidth={1} />
        </div>

        {/* Decorative Circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2"></div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <Link href={ROUTES.HOME} className="flex items-center gap-3 mb-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 font-bold text-2xl backdrop-blur-sm">
              G
            </div>
            <span className="text-2xl font-bold">GSTSahayak</span>
          </Link>
          
          <div className="space-y-6">
            <h1 className="text-5xl font-bold leading-tight">
              Welcome Back
            </h1>
            <p className="text-xl text-white/80 max-w-md">
              Sign in to continue to your account
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 overflow-y-auto">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
