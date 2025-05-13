"use client";
import { useState, useEffect } from "react";
import {
  BarChart2,
  Clock,
  MessageCircle,
  BarChart as LucideBarChart,
  TrendingUp,
  Maximize2,
  X,
} from "lucide-react";
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
} from "recharts";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
interface Clinic {
  id: string;
  name: string;
}
interface CallVolumeData {
  date: string;
  calls: number;
}
interface DurationData {
  date: string;
  avgDuration: number;
}
interface ProtocolAdherenceData {
  date: string;
  protocolAdherence: number;
}
interface SentimentData {
  sentiment: string;
  count: number;
  percentage: number;
}
interface HourData {
  hour: number;
  count: number;
  date: string;
}
interface SummaryData {
  totalCalls: number;
  avgDuration: number;
  avgProtocolAdherence: number;
  needsReviewCount: number;
  changes: {
    calls: number;
    needsReview: number;
  };
}
interface SummaryCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number | React.ReactNode;
  bgColor: string;
  textColor: string;
  tooltip: string;
  change?: number;
  isPositiveGood?: boolean;
}
export function AnalyticsDashboard() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<string>("all");
  const [agents, setAgents] = useState<{ id: string; name: string }[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>("all");
  const [timeFrame, setTimeFrame] = useState<string>("day");
  const [callVolumeData, setCallVolumeData] = useState<CallVolumeData[]>([]);
  const [avgDurationData, setAvgDurationData] = useState<DurationData[]>([]);
  const [sentimentData, setSentimentData] = useState<SentimentData[]>([]);
  const [peakHoursData, setPeakHoursData] = useState<HourData[]>([]);
  const [protocolAdherenceData, setProtocolAdherenceData] = useState<
    ProtocolAdherenceData[]
  >([]);
  const [summaryData, setSummaryData] = useState<SummaryData>({
    totalCalls: 0,
    avgDuration: 0,
    avgProtocolAdherence: 0,
    needsReviewCount: 0,
    changes: {
      calls: 0,
      needsReview: 0,
    },
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedChart, setExpandedChart] = useState<string | null>(null);
  const SENTIMENT_COLORS = {
    very_positive: "#059669", 
    positive: "#10b981", 
    neutral: "#2563eb", 
    negative: "#ef4444", 
    very_negative: "#b91c1c", 
    unknown: "#6b7280", 
  };
  const CHART_COLORS = {
    bar: "#0284c7", 
    line: "#0891b2", 
    protocol: "#0e7490", 
    dot: "#0c4a6e", 
    hover: "#f59e0b", 
    text: "#1e293b", 
    axis: "#475569", 
  };
  const tooltipStyle = {
    backgroundColor: "#ffffff",
    borderColor: "#94a3b8",
    borderWidth: "1px",
    borderRadius: "4px",
    padding: "10px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
    color: "#1e293b",
    fontSize: "12px",
    fontWeight: 600,
  };
  const tooltipItemStyle = {
    color: "#1e293b",
    fontWeight: 600,
    padding: "3px 0",
  };
  useEffect(() => {
    async function fetchClinics() {
      try {
        const response = await fetch("/api/clinics");
        if (!response.ok) throw new Error("Failed to fetch clinics");
        const data = await response.json();
        setClinics(data);
        if (data.length > 0) {
          setSelectedClinic(data[0].id);
        }
      } catch (error) {
        console.error("Error fetching clinics:", error);
      }
    }
    fetchClinics();
  }, []);
  useEffect(() => {
    async function fetchAgents() {
      try {
        const params = new URLSearchParams();
        if (selectedClinic && selectedClinic !== "all")
          params.append("clinicId", selectedClinic);
        const response = await fetch(`/api/agents?${params}`);
        if (!response.ok) throw new Error("Failed to fetch agents");
        const data = await response.json();
        const agentsMap = new Map();
        data.forEach((agent: { id: string; name: string | null }) => {
          if (agent.name && agent.name.trim() !== "") {
            agentsMap.set(agent.id, agent);
          }
        });
        const uniqueAgents = Array.from(agentsMap.values()) as {
          id: string;
          name: string;
        }[];
        uniqueAgents.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        setAgents(uniqueAgents);
        setSelectedAgent("all");
      } catch (error) {
        console.error("Error fetching agents:", error);
        setAgents([]);
        setSelectedAgent("all");
      }
    }
    fetchAgents();
  }, [selectedClinic]);
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    async function fetchAnalyticsData() {
      try {
        const params = new URLSearchParams();
        if (selectedClinic && selectedClinic !== "all")
          params.append("clinicId", selectedClinic);
        if (selectedAgent && selectedAgent !== "all")
          params.append("agentId", selectedAgent);
        params.append("timeFrame", timeFrame);
        const analyticsResponse = await fetch(`/api/analytics?${params}`);
        if (!analyticsResponse.ok) {
          const errorData = await analyticsResponse.json();
          throw new Error(errorData.error || "Failed to fetch analytics");
        }
        const analyticsData = await analyticsResponse.json();
        setCallVolumeData(analyticsData.callVolumeData || []);
        setAvgDurationData(analyticsData.avgCallDuration || []);
        setPeakHoursData(analyticsData.peakCallHours || []);
        setProtocolAdherenceData(analyticsData.protocolAdherenceData || []);
        const sentimentResponse = await fetch(
          `/api/analytics/sentiment?${params}`
        );
        if (!sentimentResponse.ok) {
          const errorData = await sentimentResponse.json();
          throw new Error(errorData.error || "Failed to fetch sentiment data");
        }
        const sentimentData = await sentimentResponse.json();
        if (
          sentimentData.length === 0 ||
          sentimentData.every((item: SentimentData) => item.count === 0)
        ) {
          setSentimentData([
            { sentiment: "very_positive", count: 0, percentage: 0 },
            { sentiment: "positive", count: 0, percentage: 0 },
            { sentiment: "neutral", count: 0, percentage: 0 },
            { sentiment: "negative", count: 0, percentage: 0 },
            { sentiment: "very_negative", count: 0, percentage: 0 },
          ]);
        } else {
          setSentimentData(sentimentData);
        }
        const summaryResponse = await fetch(`/api/analytics/summary?${params}`);
        if (!summaryResponse.ok) {
          const errorData = await summaryResponse.json();
          throw new Error(errorData.error || "Failed to fetch summary data");
        }
        const summaryData = await summaryResponse.json();
        setSummaryData(summaryData);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Error loading dashboard data"
        );
      } finally {
        setIsLoading(false);
      }
    }
    fetchAnalyticsData();
  }, [selectedClinic, selectedAgent, timeFrame]);
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return format(date, "MMM dd");
  };
  const formatHour = (hour: number) => {
    return `${hour % 12 || 12}${hour < 12 ? "am" : "pm"}`;
  };
  const LoadingSpinner = () => (
    <div className="h-full flex flex-col items-center justify-center">
      <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-t-2 border-blue-500 mb-3"></div>
      <div className="text-gray-500 font-medium">Loading data...</div>
      <div className="text-gray-400 text-xs mt-2">This may take a moment</div>
    </div>
  );
  const NoDataDisplay = () => (
    <div className="h-full flex flex-col items-center justify-center">
      <div className="text-gray-400 mb-2">
        <svg
          xmlns="http:
          className="h-12 w-12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 17l-5-5m0 0l5-5m-5 5h12"
          />
        </svg>
      </div>
      <p className="text-gray-600 font-medium">No data available</p>
      <p className="text-gray-400 text-xs mt-2">
        Try changing the selected filters
      </p>
    </div>
  );
  const ErrorDisplay = ({ message }: { message: string }) => (
    <div className="h-full flex flex-col items-center justify-center">
      <div className="text-red-500 mb-2">
        <svg
          xmlns="http:
          className="h-12 w-12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <p className="text-red-600 font-medium">Error loading data</p>
      <p className="text-gray-500 text-sm mt-1">{message}</p>
    </div>
  );
  const formatSentimentLabel = (sentiment: string): string => {
    switch (sentiment) {
      case "very_positive":
        return "Very Positive";
      case "very_negative":
        return "Very Negative";
      default:
        return sentiment.charAt(0).toUpperCase() + sentiment.slice(1);
    }
  };
  const formatChange = (
    change: number | undefined,
    isPositiveGood: boolean = true
  ) => {
    if (change === undefined) return null;
    const isPositive = change >= 0;
    const isGood = isPositiveGood ? isPositive : !isPositive;
    return (
      <div
        className={`flex items-center text-xs ${
          isGood ? "text-green-600" : "text-red-600"
        }`}
      >
        {isPositive ? (
          <svg
            className="w-3 h-3 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 15l7-7 7 7"
            />
          </svg>
        ) : (
          <svg
            className="w-3 h-3 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        )}
        <span>{Math.abs(change).toFixed(1)}%</span>
      </div>
    );
  };
  const SummaryCard = ({
    icon,
    title,
    value,
    bgColor,
    textColor,
    tooltip,
    change,
    isPositiveGood,
  }: SummaryCardProps) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-start shadow-sm hover:shadow-md transition-shadow duration-200">
      <div
        className={`p-2 rounded-md mr-3 flex items-center justify-center ${bgColor}`}
      >
        {icon}
      </div>
      <div className="w-full">
        <div className="flex justify-between items-center mb-1">
          <div className="text-sm font-medium text-gray-700">{title}</div>
          <div className="group relative">
            <div className="text-xs bg-gray-200 text-gray-700 rounded-full h-5 w-5 flex items-center justify-center cursor-help hover:bg-gray-300 transition-colors">
              ?
            </div>
            <div className="absolute right-0 bottom-full mb-2 w-48 rounded bg-black text-xs text-white p-2 hidden group-hover:block z-50 shadow-lg">
              {tooltip}
            </div>
          </div>
        </div>
        <div className="flex items-center">
          <div className={`text-2xl font-semibold ${textColor}`}>{value}</div>
          <div className="ml-2">{formatChange(change, isPositiveGood)}</div>
        </div>
      </div>
    </div>
  );
  const handleExpandChart = (chartId: string) => {
    setExpandedChart(chartId);
  };
  const handleCloseModal = () => {
    setExpandedChart(null);
  };
  const ChartModal = ({
    children,
    title,
  }: {
    children: React.ReactNode;
    title: string;
  }) => {
    if (!expandedChart) return null;
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={handleCloseModal}
      >
        <div
          className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()} 
        >
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
            <button
              onClick={handleCloseModal}
              className="p-1 rounded-full hover:bg-gray-200 transition-colors"
            >
              <X className="h-6 w-6 text-gray-500" />
            </button>
          </div>
          <div className="p-6 flex-1 overflow-auto">{children}</div>
        </div>
      </div>
    );
  };
  const ExpandButton = ({ chartId }: { chartId: string }) => (
    <button
      onClick={() => handleExpandChart(chartId)}
      className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-200 transition-colors"
      aria-label="Expand chart"
    >
      <Maximize2 className="h-5 w-5 text-gray-500" />
    </button>
  );
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <section className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight mb-2 text-gray-800">
          Analytics Dashboard
        </h1>
        <p className="text-gray-600 text-sm">
          View key performance metrics and trends
        </p>
      </section>
      {}
      <section className="mb-8">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Filters</h2>
          <div className="flex flex-wrap gap-6">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Clinic
              </label>
              <Select
                value={selectedClinic}
                onValueChange={(value: string) => setSelectedClinic(value)}
              >
                <SelectTrigger
                  className="h-10"
                  style={{ backgroundColor: "#d0f2e7", color: "#333333" }}
                >
                  <SelectValue placeholder="Select clinic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clinics</SelectItem>
                  {clinics.map((clinic) => (
                    <SelectItem key={clinic.id} value={clinic.id}>
                      {clinic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Agent
              </label>
              <Select
                value={selectedAgent}
                onValueChange={(value: string) => setSelectedAgent(value)}
              >
                <SelectTrigger
                  className="h-10"
                  style={{ backgroundColor: "#d0f2e7", color: "#333333" }}
                >
                  <SelectValue placeholder="Select agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agents</SelectItem>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name || `Agent ID: ${agent.id.substring(0, 8)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Time Period
              </label>
              <Select
                value={timeFrame}
                onValueChange={(value: string) => setTimeFrame(value)}
              >
                <SelectTrigger
                  className="h-10"
                  style={{ backgroundColor: "#d0f2e7", color: "#333333" }}
                >
                  <SelectValue placeholder="Select time period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Last 24 Hours</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                  <SelectItem value="6months">Last 6 Months</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>
      {}
      {error && (
        <div className="mb-8">
          <ErrorDisplay message={error} />
        </div>
      )}
      {}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {}
        <SummaryCard
          icon={<Phone size={18} className="text-blue-700" />}
          title="Total Calls"
          value={isLoading ? "..." : summaryData.totalCalls.toLocaleString()}
          bgColor="bg-blue-100"
          textColor="text-gray-800"
          tooltip="Total number of calls in the selected time period"
          change={summaryData.changes?.calls}
        />
        {}
        <SummaryCard
          icon={<Clock size={18} className="text-purple-700" />}
          title="Most Active Time"
          value={
            isLoading
              ? "..."
              : peakHoursData.length > 0
              ? formatHour(
                  peakHoursData.reduce((prev, current) =>
                    prev.count > current.count ? prev : current
                  ).hour
                )
              : "N/A"
          }
          bgColor="bg-purple-100"
          textColor="text-gray-800"
          tooltip="The hour of day with the highest call volume"
        />
        {}
        <SummaryCard
          icon={<MessageCircle size={18} className="text-green-700" />}
          title="Positive Sentiment"
          value={
            isLoading
              ? "..."
              : (() => {
                  const positiveSentiments = sentimentData.filter((item) =>
                    ["positive", "very_positive"].includes(item.sentiment)
                  );
                  const totalCount = sentimentData.reduce(
                    (acc, item) => acc + item.count,
                    0
                  );
                  const positiveCount = positiveSentiments.reduce(
                    (acc, item) => acc + item.count,
                    0
                  );
                  return totalCount > 0
                    ? `${Math.round((positiveCount / totalCount) * 100)}%`
                    : "N/A";
                })()
          }
          bgColor="bg-green-100"
          textColor="text-gray-800"
          tooltip="Percentage of calls with positive or very positive sentiment"
        />
        {}
        <SummaryCard
          icon={<Info size={18} className="text-red-700" />}
          title="Needs Review"
          value={
            isLoading ? "..." : summaryData.needsReviewCount.toLocaleString()
          }
          bgColor="bg-red-100"
          textColor="text-gray-800"
          tooltip="Number of calls that have been flagged for manual review"
          change={summaryData.changes?.needsReview}
          isPositiveGood={false} 
        />
      </section>
      {}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {}
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm relative">
          <ExpandButton chartId="call-volume" />
          <div className="flex items-center mb-4">
            <div className="p-2 rounded-md mr-3 bg-blue-100">
              <LucideBarChart
                className="h-5 w-5 text-blue-700"
                aria-hidden="true"
              />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">
              Daily Call Volume
            </h2>
          </div>
          <div className="h-64">
            {isLoading ? (
              <LoadingSpinner />
            ) : callVolumeData.length === 0 ? (
              <NoDataDisplay />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={callVolumeData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    stroke={CHART_COLORS.axis}
                    tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
                    axisLine={{ stroke: "#cbd5e1" }}
                  />
                  <YAxis
                    stroke={CHART_COLORS.axis}
                    tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
                    axisLine={{ stroke: "#cbd5e1" }}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value} calls`, "Volume"]}
                    labelFormatter={(label) => formatDate(label)}
                    contentStyle={tooltipStyle}
                    itemStyle={tooltipItemStyle}
                  />
                  <Bar
                    dataKey="calls"
                    fill={CHART_COLORS.bar}
                    activeBar={{ fill: CHART_COLORS.hover }}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        {}
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm relative">
          <ExpandButton chartId="avg-duration" />
          <div className="flex items-center mb-4">
            <div className="p-2 rounded-md mr-3 bg-green-100">
              <Clock className="h-5 w-5 text-green-700" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">
              Average Call Duration
            </h2>
          </div>
          <div className="h-64">
            {isLoading ? (
              <LoadingSpinner />
            ) : avgDurationData.length === 0 ? (
              <NoDataDisplay />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={avgDurationData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    stroke={CHART_COLORS.axis}
                    tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
                    axisLine={{ stroke: "#cbd5e1" }}
                  />
                  <YAxis
                    tickFormatter={(value) => formatDuration(value)}
                    stroke={CHART_COLORS.axis}
                    tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
                    axisLine={{ stroke: "#cbd5e1" }}
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      formatDuration(value),
                      "Duration",
                    ]}
                    labelFormatter={(label) => formatDate(label)}
                    contentStyle={tooltipStyle}
                    itemStyle={tooltipItemStyle}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgDuration"
                    stroke={CHART_COLORS.line}
                    strokeWidth={2}
                    dot={{ fill: CHART_COLORS.dot, r: 4 }}
                    activeDot={{
                      fill: CHART_COLORS.hover,
                      stroke: CHART_COLORS.hover,
                      r: 6,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        {}
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm relative">
          <ExpandButton chartId="sentiment" />
          <div className="flex items-center mb-4">
            <div className="p-2 rounded-md mr-3 bg-purple-100">
              <MessageCircle
                className="h-5 w-5 text-purple-700"
                aria-hidden="true"
              />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">
              Customer Sentiment
            </h2>
          </div>
          <div className="h-64">
            {isLoading ? (
              <LoadingSpinner />
            ) : !sentimentData.length ||
              sentimentData.every((item: SentimentData) => item.count === 0) ? (
              <NoDataDisplay />
            ) : (
              <div className="h-full flex flex-row">
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sentimentData.filter((item) => item.count > 0)}
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        innerRadius={35}
                        dataKey="count"
                        nameKey="sentiment"
                        label={false}
                      >
                        {sentimentData
                          .filter((item) => item.count > 0)
                          .map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                SENTIMENT_COLORS[
                                  entry.sentiment as keyof typeof SENTIMENT_COLORS
                                ] || SENTIMENT_COLORS.unknown
                              }
                            />
                          ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          value,
                          formatSentimentLabel(name),
                        ]}
                        contentStyle={tooltipStyle}
                        itemStyle={tooltipItemStyle}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col justify-center min-w-[100px]">
                  {sentimentData
                    .filter((item) => item.count > 0)
                    .map((entry) => (
                      <div
                        key={entry.sentiment}
                        className="flex items-center mb-1"
                      >
                        <div
                          className="w-3 h-3 mr-1 rounded-sm flex-shrink-0"
                          style={{
                            backgroundColor:
                              SENTIMENT_COLORS[
                                entry.sentiment as keyof typeof SENTIMENT_COLORS
                              ] || SENTIMENT_COLORS.unknown,
                          }}
                        />
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-gray-800">
                            {formatSentimentLabel(entry.sentiment)}
                          </span>
                          <span className="text-xs text-gray-600">
                            {entry.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
        {}
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm relative">
          <ExpandButton chartId="peak-hours" />
          <div className="flex items-center mb-4">
            <div className="p-2 rounded-md mr-3 bg-amber-100">
              <BarChart2
                className="h-5 w-5 text-amber-700"
                aria-hidden="true"
              />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">
              Peak Call Hours
            </h2>
          </div>
          <div className="h-64">
            {isLoading ? (
              <LoadingSpinner />
            ) : peakHoursData.length === 0 ? (
              <NoDataDisplay />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakHoursData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis
                    dataKey="hour"
                    tickFormatter={formatHour}
                    stroke={CHART_COLORS.axis}
                    tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
                    axisLine={{ stroke: "#cbd5e1" }}
                  />
                  <YAxis
                    stroke={CHART_COLORS.axis}
                    tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
                    axisLine={{ stroke: "#cbd5e1" }}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value} calls`, "Count"]}
                    labelFormatter={(hour) => {
                      const currentItem = peakHoursData.find(
                        (item) => item.hour === Number(hour)
                      );
                      return currentItem && currentItem.date
                        ? `${currentItem.date}`
                        : formatHour(Number(hour));
                    }}
                    contentStyle={tooltipStyle}
                    itemStyle={tooltipItemStyle}
                  />
                  <Bar
                    dataKey="count"
                    fill={CHART_COLORS.bar}
                    activeBar={{ fill: CHART_COLORS.hover }}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        {}
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm relative">
          <ExpandButton chartId="protocol-adherence" />
          <div className="flex items-center mb-4">
            <div className="p-2 rounded-md mr-3 bg-teal-100">
              <TrendingUp
                className="h-5 w-5 text-teal-700"
                aria-hidden="true"
              />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">
              Protocol Adherence Trend
            </h2>
          </div>
          <div className="h-64">
            {isLoading ? (
              <LoadingSpinner />
            ) : protocolAdherenceData.length === 0 ? (
              <NoDataDisplay />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={protocolAdherenceData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    stroke={CHART_COLORS.axis}
                    tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
                    axisLine={{ stroke: "#cbd5e1" }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                    stroke={CHART_COLORS.axis}
                    tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
                    axisLine={{ stroke: "#cbd5e1" }}
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      `${value.toFixed(1)}%`,
                      "Adherence",
                    ]}
                    labelFormatter={(label) => formatDate(label)}
                    contentStyle={tooltipStyle}
                    itemStyle={tooltipItemStyle}
                  />
                  <Line
                    type="monotone"
                    dataKey="protocolAdherence"
                    stroke={CHART_COLORS.protocol}
                    strokeWidth={2}
                    dot={{ fill: CHART_COLORS.dot, r: 4 }}
                    activeDot={{
                      fill: CHART_COLORS.hover,
                      stroke: CHART_COLORS.hover,
                      r: 6,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>
      {}
      {expandedChart === "call-volume" && (
        <ChartModal title="Daily Call Volume">
          <div className="h-[500px]">
            {isLoading ? (
              <LoadingSpinner />
            ) : callVolumeData.length === 0 ? (
              <NoDataDisplay />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={callVolumeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    stroke={CHART_COLORS.axis}
                    tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
                    axisLine={{ stroke: "#cbd5e1" }}
                  />
                  <YAxis
                    stroke={CHART_COLORS.axis}
                    tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
                    axisLine={{ stroke: "#cbd5e1" }}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value} calls`, "Volume"]}
                    labelFormatter={(label) => formatDate(label)}
                    contentStyle={tooltipStyle}
                    itemStyle={tooltipItemStyle}
                  />
                  <Bar
                    dataKey="calls"
                    fill={CHART_COLORS.bar}
                    activeBar={{ fill: CHART_COLORS.hover }}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
            <div className="mt-4 text-sm text-gray-600">
              <p>
                Total calls in period:{" "}
                {callVolumeData.reduce((sum, item) => sum + item.calls, 0)}
              </p>
              <p>
                Average calls per day:{" "}
                {(
                  callVolumeData.reduce((sum, item) => sum + item.calls, 0) /
                  (callVolumeData.length || 1)
                ).toFixed(1)}
              </p>
            </div>
          </div>
        </ChartModal>
      )}
      {expandedChart === "avg-duration" && (
        <ChartModal title="Average Call Duration">
          <div className="h-[500px]">
            {isLoading ? (
              <LoadingSpinner />
            ) : avgDurationData.length === 0 ? (
              <NoDataDisplay />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={avgDurationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    stroke={CHART_COLORS.axis}
                    tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
                    axisLine={{ stroke: "#cbd5e1" }}
                  />
                  <YAxis
                    tickFormatter={(value) => formatDuration(value)}
                    stroke={CHART_COLORS.axis}
                    tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
                    axisLine={{ stroke: "#cbd5e1" }}
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      formatDuration(value),
                      "Duration",
                    ]}
                    labelFormatter={(label) => formatDate(label)}
                    contentStyle={tooltipStyle}
                    itemStyle={tooltipItemStyle}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgDuration"
                    stroke={CHART_COLORS.line}
                    strokeWidth={2}
                    dot={{ fill: CHART_COLORS.dot, r: 4 }}
                    activeDot={{
                      fill: CHART_COLORS.hover,
                      stroke: CHART_COLORS.hover,
                      r: 6,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
            <div className="mt-4 text-sm text-gray-600">
              <p>
                Overall average call duration:{" "}
                {formatDuration(
                  avgDurationData.reduce(
                    (sum, item) => sum + item.avgDuration,
                    0
                  ) / (avgDurationData.length || 1)
                )}
              </p>
              <p>
                Longest average duration:{" "}
                {formatDuration(
                  Math.max(
                    ...avgDurationData.map((item) => item.avgDuration || 0)
                  )
                )}
              </p>
            </div>
          </div>
        </ChartModal>
      )}
      {expandedChart === "sentiment" && (
        <ChartModal title="Customer Sentiment">
          <div className="h-[500px]">
            {isLoading ? (
              <LoadingSpinner />
            ) : !sentimentData.length ||
              sentimentData.every((item: SentimentData) => item.count === 0) ? (
              <NoDataDisplay />
            ) : (
              <div className="h-full flex flex-col">
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sentimentData.filter((item) => item.count > 0)}
                        cx="50%"
                        cy="50%"
                        outerRadius={180}
                        innerRadius={90}
                        dataKey="count"
                        nameKey="sentiment"
                        label={(entry) => formatSentimentLabel(entry.sentiment)}
                        labelLine={true}
                      >
                        {sentimentData
                          .filter((item) => item.count > 0)
                          .map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                SENTIMENT_COLORS[
                                  entry.sentiment as keyof typeof SENTIMENT_COLORS
                                ] || SENTIMENT_COLORS.unknown
                              }
                            />
                          ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          value,
                          formatSentimentLabel(name),
                        ]}
                        contentStyle={tooltipStyle}
                        itemStyle={tooltipItemStyle}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-row justify-center mt-4 gap-6">
                  {sentimentData
                    .filter((item) => item.count > 0)
                    .map((entry) => (
                      <div key={entry.sentiment} className="flex items-center">
                        <div
                          className="w-4 h-4 mr-2 rounded-sm flex-shrink-0"
                          style={{
                            backgroundColor:
                              SENTIMENT_COLORS[
                                entry.sentiment as keyof typeof SENTIMENT_COLORS
                              ] || SENTIMENT_COLORS.unknown,
                          }}
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-800">
                            {formatSentimentLabel(entry.sentiment)}
                          </span>
                          <span className="text-xs text-gray-600">
                            {entry.percentage.toFixed(1)}% ({entry.count})
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
            <div className="mt-6 text-sm text-gray-600">
              <p>
                Total calls with sentiment data:{" "}
                {sentimentData.reduce((sum, item) => sum + item.count, 0)}
              </p>
              <p>
                Positive to negative ratio:{" "}
                {(() => {
                  const positive = sentimentData
                    .filter((item) =>
                      ["positive", "very_positive"].includes(item.sentiment)
                    )
                    .reduce((sum, item) => sum + item.count, 0);
                  const negative = sentimentData
                    .filter((item) =>
                      ["negative", "very_negative"].includes(item.sentiment)
                    )
                    .reduce((sum, item) => sum + item.count, 0);
                  return negative === 0
                    ? `${positive}:0`
                    : `${(positive / negative).toFixed(2)}:1`;
                })()}
              </p>
            </div>
          </div>
        </ChartModal>
      )}
      {expandedChart === "peak-hours" && (
        <ChartModal title="Peak Call Hours">
          <div className="h-[500px]">
            {isLoading ? (
              <LoadingSpinner />
            ) : peakHoursData.length === 0 ? (
              <NoDataDisplay />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakHoursData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="hour"
                    tickFormatter={formatHour}
                    stroke={CHART_COLORS.axis}
                    tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
                    axisLine={{ stroke: "#cbd5e1" }}
                  />
                  <YAxis
                    stroke={CHART_COLORS.axis}
                    tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
                    axisLine={{ stroke: "#cbd5e1" }}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value} calls`, "Count"]}
                    labelFormatter={(hour) => {
                      const currentItem = peakHoursData.find(
                        (item) => item.hour === Number(hour)
                      );
                      return currentItem && currentItem.date
                        ? `${currentItem.date}`
                        : formatHour(Number(hour));
                    }}
                    contentStyle={tooltipStyle}
                    itemStyle={tooltipItemStyle}
                  />
                  <Bar
                    dataKey="count"
                    fill={CHART_COLORS.bar}
                    activeBar={{ fill: CHART_COLORS.hover }}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
            <div className="mt-4 text-sm text-gray-600">
              <p>
                Peak hour:{" "}
                {(() => {
                  if (!peakHoursData.length) return "N/A";
                  const peak = peakHoursData.reduce((prev, current) =>
                    prev.count > current.count ? prev : current
                  );
                  return `${formatHour(peak.hour)} (${peak.count} calls) on ${
                    peak.date
                  }`;
                })()}
              </p>
              <p>
                Total calls:{" "}
                {peakHoursData.reduce((sum, item) => sum + item.count, 0)}
              </p>
            </div>
          </div>
        </ChartModal>
      )}
      {expandedChart === "protocol-adherence" && (
        <ChartModal title="Protocol Adherence Trend">
          <div className="h-[500px]">
            {isLoading ? (
              <LoadingSpinner />
            ) : protocolAdherenceData.length === 0 ? (
              <NoDataDisplay />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={protocolAdherenceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    stroke={CHART_COLORS.axis}
                    tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
                    axisLine={{ stroke: "#cbd5e1" }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                    stroke={CHART_COLORS.axis}
                    tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
                    axisLine={{ stroke: "#cbd5e1" }}
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      `${value.toFixed(1)}%`,
                      "Adherence",
                    ]}
                    labelFormatter={(label) => formatDate(label)}
                    contentStyle={tooltipStyle}
                    itemStyle={tooltipItemStyle}
                  />
                  <Line
                    type="monotone"
                    dataKey="protocolAdherence"
                    stroke={CHART_COLORS.protocol}
                    strokeWidth={2}
                    dot={{ fill: CHART_COLORS.dot, r: 4 }}
                    activeDot={{
                      fill: CHART_COLORS.hover,
                      stroke: CHART_COLORS.hover,
                      r: 6,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
            <div className="mt-4 text-sm text-gray-600">
              <p>
                Average protocol adherence:{" "}
                {protocolAdherenceData.length
                  ? (
                      protocolAdherenceData.reduce(
                        (sum, item) => sum + item.protocolAdherence,
                        0
                      ) / protocolAdherenceData.length
                    ).toFixed(1)
                  : "N/A"}
                %
              </p>
              <p>
                Trend:{" "}
                {(() => {
                  if (protocolAdherenceData.length < 2)
                    return "Not enough data";
                  const first = protocolAdherenceData[0].protocolAdherence;
                  const last =
                    protocolAdherenceData[protocolAdherenceData.length - 1]
                      .protocolAdherence;
                  const diff = last - first;
                  if (diff > 0) return "Improving";
                  if (diff < 0) return "Declining";
                  return "Stable";
                })()}
              </p>
            </div>
          </div>
        </ChartModal>
      )}
    </div>
  );
}
const Phone = ({ size = 24, ...props }) => (
  <svg
    xmlns="http:
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
  </svg>
);
const Info = ({ size = 24, ...props }) => (
  <svg
    xmlns="http:
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
);
