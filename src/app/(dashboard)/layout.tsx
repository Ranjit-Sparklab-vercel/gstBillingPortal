"use client";

import { Sidebar } from "@/components/common/sidebar";
import { Topbar } from "@/components/common/topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Authentication check removed - all pages accessible
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto bg-muted/50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
