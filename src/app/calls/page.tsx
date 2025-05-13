"use client";

import { useState, useEffect, Suspense } from "react";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { CallsTable } from "@/components/calls-table";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Call } from "@/components/calls-table";

// Definir interfaces para los datos
interface Clinic {
  id: string;
  name: string;
  companyId?: string;
}

interface Agent {
  id: string;
  name: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

function CallsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [calls, setCalls] = useState<Call[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
  });

  // Get filter values from URL params
  const page = searchParams.get("page") || "1";
  const clinicId = searchParams.get("clinicId") || "all";
  const agentId = searchParams.get("agentId") || "all";
  const timeFrame = searchParams.get("timeFrame") || "day";
  const sortBy = searchParams.get("sortBy") || "recent";

  // Fetch clinics for filter dropdown
  useEffect(() => {
    async function fetchClinics() {
      try {
        const response = await fetch(`/api/clinics`);

        if (response.ok) {
          const data = await response.json();
          setClinics(data);
        } else {
          console.error("Failed to fetch clinics");
        }
      } catch (error) {
        console.error("Error fetching clinics:", error);
      }
    }

    fetchClinics();
  }, []);

  // Fetch agents for filter dropdown
  useEffect(() => {
    async function fetchAgents() {
      try {
        let url = `/api/agents`;
        if (clinicId && clinicId !== "all") {
          url += `?clinicId=${clinicId}`;
        }

        const response = await fetch(url);

        if (response.ok) {
          const data = (await response.json()) as Agent[];

          // Create a map to deduplicate by ID and filter out agents without names
          const agentsMap = new Map();
          data.forEach((agent) => {
            if (agent.name && agent.name.trim() !== "") {
              agentsMap.set(agent.id, agent);
            }
          });

          // Convert back to array and sort
          const uniqueAgents = Array.from(agentsMap.values());

          // Sort agents by name
          uniqueAgents.sort((a, b) =>
            (a.name || "").localeCompare(b.name || "")
          );

          setAgents(uniqueAgents);
        } else {
          console.error("Failed to fetch agents");
        }
      } catch (error) {
        console.error("Error fetching agents:", error);
      }
    }

    fetchAgents();
  }, [clinicId]);

  // Fetch calls with filters
  useEffect(() => {
    async function fetchCalls() {
      try {
        setLoading(true);

        let url = `/api/calls?page=${page}&pageSize=10&timeFrame=${timeFrame}&sortBy=${sortBy}`;
        if (clinicId && clinicId !== "all") url += `&clinicId=${clinicId}`;
        if (agentId && agentId !== "all") url += `&agentId=${agentId}`;

        const response = await fetch(url);

        if (response.ok) {
          const data = await response.json();
          setCalls(data.data);
          setPagination(data.pagination);
        } else {
          console.error("Failed to fetch calls");
        }
      } catch (error) {
        console.error("Error fetching calls:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchCalls();
  }, [page, clinicId, agentId, timeFrame, sortBy]);

  // Update URL with filters
  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    // Reset page to 1 when changing filters
    if (key !== "page") {
      params.set("page", "1");
    }

    // Usar replace en lugar de push para evitar la página en blanco
    router.replace(`/calls?${params.toString()}`, { scroll: false });
  };

  const handlePageChange = (newPage: number) => {
    updateFilters("page", newPage.toString());
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1
          style={{ color: "#333333" }}
          className="text-2xl font-bold tracking-tight"
        >
          Calls
        </h1>
        <div className="flex gap-2">
          <div className="flex gap-2">
            {/* Clinic filter */}
            <Select
              value={clinicId}
              onValueChange={(value: string) =>
                updateFilters("clinicId", value)
              }
            >
              <SelectTrigger
                className="h-10 w-[180px]"
                style={{ backgroundColor: "#d0f2e7", color: "#333333" }}
              >
                <SelectValue placeholder="Select clinic" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All clinics</SelectItem>
                {clinics.map((clinic) => (
                  <SelectItem key={clinic.id} value={clinic.id}>
                    {clinic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Agent filter */}
            <Select
              value={agentId}
              onValueChange={(value: string) => updateFilters("agentId", value)}
            >
              <SelectTrigger
                className="h-10 w-[180px]"
                style={{ backgroundColor: "#d0f2e7", color: "#333333" }}
              >
                <SelectValue placeholder="Select agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All agents</SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Time frame filter */}
            <Select
              value={timeFrame}
              onValueChange={(value: string) =>
                updateFilters("timeFrame", value)
              }
            >
              <SelectTrigger
                className="h-10 w-[180px]"
                style={{ backgroundColor: "#d0f2e7", color: "#333333" }}
              >
                <SelectValue placeholder="Time frame" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Last 24 hours</SelectItem>
                <SelectItem value="week">Last week</SelectItem>
                <SelectItem value="month">Last month</SelectItem>
                <SelectItem value="6months">Last 6 months</SelectItem>
                <SelectItem value="year">Last year</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort by filter */}
            <Select
              value={sortBy}
              onValueChange={(value: string) => updateFilters("sortBy", value)}
            >
              <SelectTrigger
                className="h-10 w-[180px]"
                style={{ backgroundColor: "#d0f2e7", color: "#333333" }}
              >
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most recent</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="duration-asc">
                  Duration (Ascending)
                </SelectItem>
                <SelectItem value="duration-desc">
                  Duration (Descending)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <CallsTable
        calls={calls}
        loading={loading}
        onPageChange={handlePageChange}
        pagination={pagination}
      />
    </div>
  );
}

// Componente principal envuelto en Suspense
export default function CallsPage() {
  return (
    <DashboardSidebar>
      <Suspense fallback={<div>Loading calls data...</div>}>
        <CallsPageContent />
      </Suspense>
    </DashboardSidebar>
  );
}
