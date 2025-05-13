"use client";

import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { QAReviewDashboard } from "@/components/qa-review-dashboard";

export default function QAReviewPage() {
  return (
    <DashboardSidebar>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1
            style={{ color: "#333333" }}
            className="text-2xl font-bold tracking-tight"
          >
            QA Review
          </h1>
        </div>

        <QAReviewDashboard />
      </div>
    </DashboardSidebar>
  );
}
