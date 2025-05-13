"use client";

import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { AnalyticsDashboard } from "@/components/analytics-dashboard";
import { Suspense } from "react";

export default function AnalyticsPage() {
  return (
    <DashboardSidebar>
      <Suspense fallback={<div>Loading dashboard...</div>}>
        <AnalyticsDashboard />
      </Suspense>
    </DashboardSidebar>
  );
}
