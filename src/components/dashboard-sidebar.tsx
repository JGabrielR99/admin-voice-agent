"use client";
import { useState } from "react";
import Link from "next/link";
import {
  BarChart2,
  PhoneCall,
  GripVertical,
  FileInput,
  ClipboardCheck,
} from "lucide-react";
import { usePathname } from "next/navigation";
export function DashboardSidebar({ children }: { children?: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const isActive = (path: string): boolean => {
    return pathname === path || (pathname === "/" && path === "/analytics");
  };
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };
  return (
    <div
      className="flex min-h-screen h-screen"
      style={{ backgroundColor: "#ffffff" }}
    >
      <div
        style={{
          backgroundColor: "#e8f8f6",
          width: collapsed ? "80px" : "280px",
          transition: "width 0.3s ease-in-out",
          position: "relative",
          borderRight: "1px solid #bcebdf",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
        className="shadow-sm"
      >
        <div
          style={{ borderColor: "#bcebdf" }}
          className="p-4 border-b flex items-center justify-between"
        >
          {!collapsed && (
            <h2 style={{ color: "#333333" }} className="text-xl font-bold">
              Admin
            </h2>
          )}
          {collapsed && (
            <div className="w-full flex justify-center">
              <BarChart2 style={{ color: "#333333" }} size={24} />
            </div>
          )}
        </div>
        <div className="py-4 flex-grow overflow-y-auto">
          <nav aria-label="Main Navigation">
            <div className="space-y-2 px-2">
              <div>
                <Link href="/analytics" className="w-full block">
                  <button
                    style={{
                      backgroundColor: isActive("/analytics")
                        ? "#ade0db"
                        : "#d0f2e7",
                      color: "#333333",
                      fontWeight: isActive("/analytics") ? "600" : "normal",
                    }}
                    className="w-full flex items-center justify-start py-3 px-3 rounded-md transition-colors hover:bg-ade0db"
                  >
                    <div className="flex h-6 w-6 items-center justify-center mr-3">
                      <BarChart2
                        style={{ color: "#333333" }}
                        className="h-5 w-5"
                        aria-hidden="true"
                      />
                    </div>
                    {!collapsed && <span className="text-base">Analytics</span>}
                  </button>
                </Link>
              </div>
              <div>
                <Link href="/calls" className="w-full block">
                  <button
                    style={{
                      backgroundColor: isActive("/calls")
                        ? "#ade0db"
                        : "#d0f2e7",
                      color: "#333333",
                      fontWeight: isActive("/calls") ? "600" : "normal",
                    }}
                    className="w-full flex items-center justify-start py-3 px-3 rounded-md transition-colors hover:bg-ade0db"
                  >
                    <div className="flex h-6 w-6 items-center justify-center mr-3">
                      <PhoneCall
                        style={{ color: "#333333" }}
                        className="h-5 w-5"
                        aria-hidden="true"
                      />
                    </div>
                    {!collapsed && <span className="text-base">Calls</span>}
                  </button>
                </Link>
              </div>
              <div>
                <Link href="/admin/qa-review" className="w-full block">
                  <button
                    style={{
                      backgroundColor: isActive("/admin/qa-review")
                        ? "#ade0db"
                        : "#d0f2e7",
                      color: "#333333",
                      fontWeight: isActive("/admin/qa-review")
                        ? "600"
                        : "normal",
                    }}
                    className="w-full flex items-center justify-start py-3 px-3 rounded-md transition-colors hover:bg-ade0db"
                  >
                    <div className="flex h-6 w-6 items-center justify-center mr-3">
                      <ClipboardCheck
                        style={{ color: "#333333" }}
                        className="h-5 w-5"
                        aria-hidden="true"
                      />
                    </div>
                    {!collapsed && <span className="text-base">QA Review</span>}
                  </button>
                </Link>
              </div>
              <div>
                <Link href="/import" className="w-full block">
                  <button
                    style={{
                      backgroundColor: isActive("/import")
                        ? "#ade0db"
                        : "#d0f2e7",
                      color: "#333333",
                      fontWeight: isActive("/import") ? "600" : "normal",
                    }}
                    className="w-full flex items-center justify-start py-3 px-3 rounded-md transition-colors hover:bg-ade0db"
                  >
                    <div className="flex h-6 w-6 items-center justify-center mr-3">
                      <FileInput
                        style={{ color: "#333333" }}
                        className="h-5 w-5"
                        aria-hidden="true"
                      />
                    </div>
                    {!collapsed && <span className="text-base">Import</span>}
                  </button>
                </Link>
              </div>
            </div>
          </nav>
        </div>
        <div style={{ borderColor: "#bcebdf" }} className="p-4 border-t">
          {!collapsed && (
            <div style={{ color: "#333333" }} className="text-sm font-medium">
              Voice Agent Admin
            </div>
          )}
        </div>
        <div
          onClick={toggleSidebar}
          className="absolute -right-3 top-1/2 transform -translate-y-1/2 bg-white rounded-full border border-gray-200 shadow-sm w-6 h-12 flex items-center justify-center cursor-pointer hover:border-primary z-10"
        >
          <GripVertical size={14} color="#555" />
        </div>
      </div>
      <div
        style={{ backgroundColor: "#ffffff" }}
        className="flex-1 overflow-hidden"
      >
        <main
          className="h-full overflow-auto p-6"
          style={{ backgroundColor: "#f8fafa" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
