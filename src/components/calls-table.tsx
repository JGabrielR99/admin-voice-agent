"use client";

import { Phone, Calendar, Clock, ChevronRight } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { useSearchParams } from "next/navigation";

// Define types based on the Prisma schema
export type Call = {
  id: string;
  sourceCallId: string | null;
  customerPhoneNumber?: string | null;
  callStartTime: Date;
  callEndedTime?: Date | null;
  durationSeconds: number | null;
  endedReason: string | null;
  recordingUrl: string | null;
  summary: string | null;
  vapiScore: string | null;
  checkStatus?: string | null;
  sentiment?: string | null;
  engineerStatus: string | null;
  engineerComments: string | null;
  agentId: string | null;
  agent: {
    name: string | null;
  } | null;
  clinic?: {
    name: string | null;
  } | null;
  // Fields that might be in the formatted call data
  callTypeValue?: string | null;
  protocolAdherence?: number | null;
  outcome?: string | null;
  sentimentReasoning?: string | null;
  llmEvaluation?: {
    sentiment?: string | null;
    protocolAdherenceScore?: number | null;
    callTypeValue?: string | null;
    outcome?: string | null;
  };
  feedback?: string | null;
  needsCheck?: boolean | null;
};

export function CallsTable({ calls }: { calls: Call[] }) {
  const searchParams = useSearchParams();

  // Create a function to generate links that preserve current query params
  const getDetailLink = (callId: string) => {
    const currentParams = new URLSearchParams(searchParams.toString());
    const queryString = currentParams.toString();
    return `/calls/${callId}${queryString ? `?${queryString}` : ""}`;
  };

  return (
    <div className="w-full">
      <div
        className="bg-white rounded-lg border shadow-sm"
        style={{ borderColor: "#d9dbdb" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "#e8f8f6" }}>
                <th
                  className="whitespace-nowrap py-3 px-4 text-left text-sm font-medium"
                  style={{ color: "#333333" }}
                >
                  Call ID
                </th>
                <th
                  className="whitespace-nowrap py-3 px-4 text-left text-sm font-medium"
                  style={{ color: "#333333" }}
                >
                  Agent
                </th>
                <th
                  className="whitespace-nowrap py-3 px-4 text-left text-sm font-medium"
                  style={{ color: "#333333" }}
                >
                  Customer Phone
                </th>
                <th
                  className="whitespace-nowrap py-3 px-4 text-left text-sm font-medium"
                  style={{ color: "#333333" }}
                >
                  Date & Time
                </th>
                <th
                  className="whitespace-nowrap py-3 px-4 text-left text-sm font-medium"
                  style={{ color: "#333333" }}
                >
                  Duration
                </th>
                <th
                  className="whitespace-nowrap py-3 px-4 text-left text-sm font-medium"
                  style={{ color: "#333333" }}
                >
                  Client perception
                </th>
                <th
                  className="whitespace-nowrap py-3 px-4 text-left text-sm font-medium"
                  style={{ color: "#333333" }}
                >
                  QA Review
                </th>
                <th
                  className="whitespace-nowrap py-3 px-4 text-center text-sm font-medium"
                  style={{ color: "#333333" }}
                >
                  Details
                </th>
              </tr>
            </thead>
            <tbody>
              {calls.map((call) => (
                <tr
                  key={call.id}
                  className="border-t hover:bg-gray-50"
                  style={{ borderColor: "#d9dbdb" }}
                >
                  <td
                    className="whitespace-nowrap py-3 px-4 text-sm"
                    style={{ color: "#555555" }}
                  >
                    {call.sourceCallId?.slice(0, 8) || "-"}
                  </td>
                  <td
                    className="py-3 px-4 text-sm"
                    style={{ color: "#555555" }}
                  >
                    {call.agent?.name || "-"}
                  </td>
                  <td
                    className="py-3 px-4 text-sm"
                    style={{ color: "#555555" }}
                  >
                    <div className="flex items-center">
                      <Phone size={16} className="mr-1 text-gray-400" />
                      {call.customerPhoneNumber || "-"}
                    </div>
                  </td>
                  <td
                    className="py-3 px-4 text-sm"
                    style={{ color: "#555555" }}
                  >
                    <div className="flex items-center">
                      <Calendar size={16} className="mr-1 text-gray-400" />
                      {format(
                        new Date(call.callStartTime),
                        "yyyy-MM-dd HH:mm:ss"
                      )}
                    </div>
                  </td>
                  <td
                    className="whitespace-nowrap py-3 px-4 text-sm"
                    style={{ color: "#555555" }}
                  >
                    <div className="flex items-center">
                      <Clock size={16} className="mr-1 text-gray-400" />
                      {call.durationSeconds
                        ? `${Math.floor(call.durationSeconds / 60)}:${String(
                            call.durationSeconds % 60
                          ).padStart(2, "0")}`
                        : "-"}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge call={call} />
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {call.engineerStatus ? (
                      <div
                        className="inline-flex items-center py-1 px-2.5 rounded-md text-xs font-medium"
                        style={{
                          backgroundColor:
                            call.engineerStatus === "Pass"
                              ? "#dcfce7"
                              : "#fee4e2",
                          color:
                            call.engineerStatus === "Pass"
                              ? "#15803d"
                              : "#b42318",
                        }}
                      >
                        {call.engineerStatus === "Pass" ? "Approved" : "Failed"}
                      </div>
                    ) : (
                      <div
                        className="inline-flex items-center py-1 px-2.5 rounded-md text-xs font-medium"
                        style={{
                          backgroundColor: "#fcf3dc",
                          color: "#8f5f00",
                        }}
                      >
                        Pending
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Link
                      href={getDetailLink(call.id)}
                      className="inline-flex items-center justify-center rounded-md w-8 h-8"
                      style={{ backgroundColor: "#d0f2e7" }}
                    >
                      <ChevronRight size={16} style={{ color: "#333333" }} />
                    </Link>
                  </td>
                </tr>
              ))}
              {calls.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="py-10 px-4 text-center text-gray-500"
                  >
                    No calls found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ call }: { call: Call }) {
  let status = "Pendiente";
  let bgColor = "#fcf3dc";
  let textColor = "#8f5f00";

  // First check for human evaluation if available
  if (call.vapiScore) {
    const score = parseFloat(call.vapiScore);

    if (score < 1.5) {
      status = "Very negative";
      bgColor = "#fecaca"; // Darker red
      textColor = "#991b1b";
    } else if (score < 2.5) {
      status = "Negative";
      bgColor = "#fee4e2";
      textColor = "#b42318";
    } else if (score < 3.5) {
      status = "Neutral";
      bgColor = "#e8f8f6";
      textColor = "#0f766e";
    } else if (score < 4.5) {
      status = "Positive";
      bgColor = "#dcfce7";
      textColor = "#15803d";
    } else {
      status = "Very positive";
      bgColor = "#bbf7d0"; // Darker green
      textColor = "#166534";
    }
  }
  // Then check LLM sentiment evaluation
  else if (call.sentiment) {
    const sentiment = call.sentiment.toLowerCase();

    if (
      sentiment.includes("very negative") ||
      sentiment.includes("muy negativo")
    ) {
      status = "Muy negativo";
      bgColor = "#fecaca"; // Darker red
      textColor = "#991b1b";
    } else if (
      sentiment.includes("negative") ||
      sentiment.includes("negativo")
    ) {
      status = "Negativo";
      bgColor = "#fee4e2";
      textColor = "#b42318";
    } else if (sentiment.includes("neutral")) {
      status = "Neutral";
      bgColor = "#e8f8f6";
      textColor = "#0f766e";
    } else if (
      sentiment.includes("positive") ||
      sentiment.includes("positivo")
    ) {
      status = "Positivo";
      bgColor = "#dcfce7";
      textColor = "#15803d";
    } else if (
      sentiment.includes("very positive") ||
      sentiment.includes("muy positivo")
    ) {
      status = "Muy positivo";
      bgColor = "#bbf7d0"; // Darker green
      textColor = "#166534";
    }
  }
  // Finally, fallback to engineer status or needsCheck
  else if (call.engineerStatus === "Pass") {
    status = "Positivo";
    bgColor = "#dcfce7";
    textColor = "#15803d";
  } else if (call.engineerStatus === "Fail") {
    status = "Negativo";
    bgColor = "#fee4e2";
    textColor = "#b42318";
  } else if (call.checkStatus === "pending") {
    status = "Pendiente";
    bgColor = "#f59e0b"; // Color ámbar más oscuro para mejorar contraste
    textColor = "#ffffff"; // Texto blanco para mayor contraste
  }

  return (
    <div
      className="inline-flex items-center py-1 px-2.5 rounded-md text-xs font-medium"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      {status}
    </div>
  );
}

export function CallDetailCard({ call }: { call: Call }) {
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "-";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className="bg-white rounded-lg border shadow-sm p-5"
      style={{ borderColor: "#d9dbdb" }}
    >
      <h2 className="text-lg font-semibold mb-4" style={{ color: "#333333" }}>
        Call Summary
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="mb-4">
            <div
              className="text-sm font-medium mb-1"
              style={{ color: "#555555" }}
            >
              Call ID
            </div>
            <div className="text-base" style={{ color: "#333333" }}>
              {call.sourceCallId || "-"}
            </div>
          </div>

          <div className="mb-4">
            <div
              className="text-sm font-medium mb-1"
              style={{ color: "#555555" }}
            >
              Agent
            </div>
            <div className="text-base" style={{ color: "#333333" }}>
              {call.agent?.name || "-"}
            </div>
          </div>

          <div className="mb-4">
            <div
              className="text-sm font-medium mb-1"
              style={{ color: "#555555" }}
            >
              Customer Phone
            </div>
            <div className="text-base" style={{ color: "#333333" }}>
              {call.customerPhoneNumber || "-"}
            </div>
          </div>

          <div className="mb-4">
            <div
              className="text-sm font-medium mb-1"
              style={{ color: "#555555" }}
            >
              Date & Time
            </div>
            <div className="text-base" style={{ color: "#333333" }}>
              {format(new Date(call.callStartTime), "yyyy-MM-dd HH:mm:ss")}
            </div>
          </div>
        </div>

        <div>
          <div className="mb-4">
            <div
              className="text-sm font-medium mb-1"
              style={{ color: "#555555" }}
            >
              Duration
            </div>
            <div className="text-base" style={{ color: "#333333" }}>
              {formatDuration(call.durationSeconds)}
            </div>
          </div>

          <div className="mb-4">
            <div
              className="text-sm font-medium mb-1"
              style={{ color: "#555555" }}
            >
              Ended Reason
            </div>
            <div className="text-base" style={{ color: "#333333" }}>
              {call.endedReason || "-"}
            </div>
          </div>

          <div className="mb-4">
            <div
              className="text-sm font-medium mb-1"
              style={{ color: "#555555" }}
            >
              Call Type
            </div>
            <div className="text-base" style={{ color: "#333333" }}>
              {call.callTypeValue || call.llmEvaluation?.callTypeValue || "-"}
            </div>
          </div>

          <div className="mb-4">
            <div
              className="text-sm font-medium mb-1"
              style={{ color: "#555555" }}
            >
              Protocol Score
            </div>
            <div className="text-base" style={{ color: "#333333" }}>
              {call.protocolAdherence ||
              call.llmEvaluation?.protocolAdherenceScore
                ? `${Math.round(
                    call.protocolAdherence ||
                      call.llmEvaluation?.protocolAdherenceScore ||
                      0
                  )}%`
                : "-"}
            </div>
          </div>
        </div>
      </div>

      {(call.engineerStatus || call.engineerComments) && (
        <div className="mt-2">
          <div
            className="text-sm font-medium mb-2"
            style={{ color: "#555555" }}
          >
            QA Review
          </div>
          <div
            className="text-sm p-3 rounded-md"
            style={{ backgroundColor: "#f8fafa", color: "#333333" }}
          >
            <div className="mb-2">
              <span className="font-medium">Status: </span>
              <span
                className={`px-2 py-1 rounded-md text-xs font-medium`}
                style={{
                  backgroundColor:
                    call.engineerStatus === "Pass" ? "#dcfce7" : "#fee4e2",
                  color: call.engineerStatus === "Pass" ? "#15803d" : "#b42318",
                }}
              >
                {call.engineerStatus === "Pass" ? "Approved" : "Failed"}
              </span>
            </div>
            {call.engineerComments && (
              <div>
                <span className="font-medium">Comments: </span>
                <p className="mt-1">{call.engineerComments}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {call.summary && (
        <div className="mt-2">
          <div
            className="text-sm font-medium mb-2"
            style={{ color: "#555555" }}
          >
            Summary
          </div>
          <div
            className="text-sm p-3 rounded-md"
            style={{ backgroundColor: "#f8fafa", color: "#333333" }}
          >
            {call.summary}
          </div>
        </div>
      )}

      {call.recordingUrl && (
        <div className="mt-4">
          <div
            className="text-sm font-medium mb-2"
            style={{ color: "#555555" }}
          >
            Recording
          </div>
          <audio controls className="w-full" src={call.recordingUrl}></audio>
        </div>
      )}
    </div>
  );
}
