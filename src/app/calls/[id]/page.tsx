"use client";

import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { CallDetailCard } from "@/components/calls-table";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";

// Definir la interfaz para los datos de la llamada
interface CallData {
  id: string;
  sourceCallId: string | null;
  customerPhoneNumber: string | null;
  callStartTime: Date;
  callEndedTime: Date | null;
  durationSeconds: number | null;
  endedReason: string | null;
  recordingUrl: string | null;
  summary: string | null;
  vapiScore: string | null;
  checkStatus: string | null;
  sentiment: string | null;
  engineerStatus: string | null;
  engineerComments: string | null;
  agentId: string | null;
  agent: {
    name: string | null;
  } | null;
  clinic: {
    name: string | null;
  } | null;
  callTypeValue?: string | null;
  protocolAdherence?: number | null;
  outcome?: string | null;
  sentimentReasoning?: string | null;
  feedback?: string | null;
  needsCheck?: boolean | null;
}

// Interfaz para la llamada formateada
interface FormattedCall extends CallData {
  llmEvaluation: {
    sentiment: string | null;
    protocolAdherenceScore: number | null;
    outcome: string | null;
    callTypeValue: string | null;
  };
  humanEvaluation: {
    score: string | null;
    feedback: string | null;
  };
}

// Helper functions for sentiment display
function getSentimentLabel(sentiment: string | null): string {
  if (!sentiment) return "Neutral";

  const sentimentLower = sentiment.toLowerCase();

  if (
    sentimentLower.includes("very negative") ||
    sentimentLower.includes("muy negativo")
  ) {
    return "Very negative";
  } else if (
    sentimentLower.includes("negative") ||
    sentimentLower.includes("negativo")
  ) {
    return "Negative";
  } else if (sentimentLower.includes("neutral")) {
    return "Neutral";
  } else if (
    sentimentLower.includes("very positive") ||
    sentimentLower.includes("muy positivo")
  ) {
    return "Very positive";
  } else if (
    sentimentLower.includes("positive") ||
    sentimentLower.includes("positivo")
  ) {
    return "Positive";
  }

  return "Neutral";
}

function getSentimentColor(sentiment: string | null): string {
  if (!sentiment) return "#e8f8f6"; // Default neutral color

  const sentimentLower = sentiment.toLowerCase();

  if (
    sentimentLower.includes("very negative") ||
    sentimentLower.includes("muy negativo")
  ) {
    return "#fecaca"; // Darker red
  } else if (
    sentimentLower.includes("negative") ||
    sentimentLower.includes("negativo")
  ) {
    return "#fee4e2";
  } else if (sentimentLower.includes("neutral")) {
    return "#e8f8f6";
  } else if (
    sentimentLower.includes("very positive") ||
    sentimentLower.includes("muy positivo")
  ) {
    return "#bbf7d0"; // Darker green
  } else if (
    sentimentLower.includes("positive") ||
    sentimentLower.includes("positivo")
  ) {
    return "#dcfce7";
  }

  return "#e8f8f6"; // Default neutral color
}

function getSentimentTextColor(sentiment: string | null): string {
  if (!sentiment) return "#0f766e"; // Default neutral text color

  const sentimentLower = sentiment.toLowerCase();

  if (
    sentimentLower.includes("very negative") ||
    sentimentLower.includes("muy negativo")
  ) {
    return "#991b1b"; // Darker red text
  } else if (
    sentimentLower.includes("negative") ||
    sentimentLower.includes("negativo")
  ) {
    return "#b42318";
  } else if (sentimentLower.includes("neutral")) {
    return "#0f766e";
  } else if (
    sentimentLower.includes("very positive") ||
    sentimentLower.includes("muy positivo")
  ) {
    return "#166534"; // Darker green text
  } else if (
    sentimentLower.includes("positive") ||
    sentimentLower.includes("positivo")
  ) {
    return "#15803d";
  }

  return "#0f766e"; // Default neutral text color
}

export default function CallDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const [call, setCall] = useState<CallData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Construct back link with original filters
  const getBackLink = () => {
    const backParams = new URLSearchParams();

    // Preserve all filter parameters
    const page = searchParams.get("page");
    const clinicId = searchParams.get("clinicId");
    const agentId = searchParams.get("agentId");
    const timeFrame = searchParams.get("timeFrame");
    const sortBy = searchParams.get("sortBy");

    if (page) backParams.set("page", page);
    if (clinicId) backParams.set("clinicId", clinicId);
    if (agentId) backParams.set("agentId", agentId);
    if (timeFrame) backParams.set("timeFrame", timeFrame);
    if (sortBy) backParams.set("sortBy", sortBy);

    const queryString = backParams.toString();
    return `/calls${queryString ? `?${queryString}` : ""}`;
  };

  useEffect(() => {
    async function fetchCallDetails() {
      try {
        setLoading(true);
        const response = await fetch(`/api/calls/${id}`);

        if (response.ok) {
          const data = await response.json();
          setCall(data);
        } else {
          const errorData = await response.json();
          setError(errorData.error || "Failed to fetch call details");
        }
      } catch (error) {
        setError("Error fetching call details");
        console.error("Error fetching call details:", error);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchCallDetails();
    }
  }, [id]);

  if (loading) {
    return (
      <DashboardSidebar>
        <div className="max-w-7xl mx-auto text-center py-10">
          Loading call details...
        </div>
      </DashboardSidebar>
    );
  }

  if (error) {
    return (
      <DashboardSidebar>
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Link
              href={getBackLink()}
              className="flex items-center text-sm font-medium mb-2"
              style={{ color: "#555555" }}
            >
              <ArrowLeft size={16} className="mr-1" />
              Back to calls
            </Link>
          </div>
          <div
            className="bg-white rounded-lg border shadow-sm p-5 text-center"
            style={{ borderColor: "#d9dbdb", color: "#b42318" }}
          >
            {error}
          </div>
        </div>
      </DashboardSidebar>
    );
  }

  if (!call) {
    return (
      <DashboardSidebar>
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Link
              href={getBackLink()}
              className="flex items-center text-sm font-medium mb-2"
              style={{ color: "#555555" }}
            >
              <ArrowLeft size={16} className="mr-1" />
              Back to calls
            </Link>
          </div>
          <div
            className="bg-white rounded-lg border shadow-sm p-5 text-center"
            style={{ borderColor: "#d9dbdb", color: "#555555" }}
          >
            Call not found
          </div>
        </div>
      </DashboardSidebar>
    );
  }

  // Format llmEvaluation and humanEvaluation for compatibility
  const formattedCall: FormattedCall = {
    ...call,
    llmEvaluation: {
      sentiment: call.sentiment,
      protocolAdherenceScore: call.protocolAdherence || 0,
      outcome: call.outcome || null,
      callTypeValue: call.callTypeValue || null,
    },
    humanEvaluation: {
      score: call.vapiScore,
      feedback: call.feedback || null,
    },
  };

  return (
    <DashboardSidebar>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link
            href={getBackLink()}
            className="flex items-center text-sm font-medium mb-2"
            style={{ color: "#555555" }}
          >
            <ArrowLeft size={16} className="mr-1" />
            Back to calls
          </Link>
          <h1
            style={{ color: "#333333" }}
            className="text-2xl font-bold tracking-tight"
          >
            Call Details
          </h1>
        </div>

        <CallDetailCard call={formattedCall} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div
            className="bg-white rounded-lg border shadow-sm p-5"
            style={{ borderColor: "#d9dbdb" }}
          >
            <h2
              className="text-lg font-semibold mb-4"
              style={{ color: "#333333" }}
            >
              AI Analysis
            </h2>
            {formattedCall.llmEvaluation ? (
              <>
                <div className="mb-4">
                  <div
                    className="text-sm font-medium mb-1"
                    style={{ color: "#555555" }}
                  >
                    Customer Perception
                  </div>
                  <div className="flex items-center">
                    <div
                      className="px-2 py-1 rounded-md text-sm font-medium"
                      style={{
                        backgroundColor: getSentimentColor(
                          formattedCall.llmEvaluation.sentiment
                        ),
                        color: getSentimentTextColor(
                          formattedCall.llmEvaluation.sentiment
                        ),
                      }}
                    >
                      {getSentimentLabel(formattedCall.llmEvaluation.sentiment)}
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div
                    className="text-sm font-medium mb-1"
                    style={{ color: "#555555" }}
                  >
                    Protocol Score
                  </div>
                  <div className="flex items-center">
                    <div
                      className="h-2 rounded-full overflow-hidden w-full bg-gray-100"
                      style={{ backgroundColor: "#f0f0f0" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${
                            formattedCall.llmEvaluation
                              .protocolAdherenceScore || 0
                          }%`,
                          backgroundColor:
                            (formattedCall.llmEvaluation
                              .protocolAdherenceScore || 0) > 75
                              ? "#15803d"
                              : (formattedCall.llmEvaluation
                                  .protocolAdherenceScore || 0) > 50
                              ? "#8f5f00"
                              : "#b42318",
                        }}
                      ></div>
                    </div>
                    <span
                      className="ml-2 text-sm font-semibold"
                      style={{ color: "#333333" }}
                    >
                      {formattedCall.llmEvaluation.protocolAdherenceScore || 0}%
                    </span>
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
                    {formattedCall.llmEvaluation.callTypeValue || "-"}
                  </div>
                </div>

                <div>
                  <div
                    className="text-sm font-medium mb-1"
                    style={{ color: "#555555" }}
                  >
                    Outcome
                  </div>
                  <div
                    className="px-2 py-1 rounded-md text-sm font-medium inline-block"
                    style={{
                      backgroundColor:
                        formattedCall.llmEvaluation.outcome === "TRUE"
                          ? "#dcfce7"
                          : "#fee4e2",
                      color:
                        formattedCall.llmEvaluation.outcome === "TRUE"
                          ? "#15803d"
                          : "#b42318",
                    }}
                  >
                    {formattedCall.llmEvaluation.outcome === "TRUE"
                      ? "Successful"
                      : "Unsuccessful"}
                  </div>
                </div>

                {formattedCall.sentimentReasoning && (
                  <div className="mt-4">
                    <div
                      className="text-sm font-medium mb-1"
                      style={{ color: "#555555" }}
                    >
                      Sentiment Analysis
                    </div>
                    <div
                      className="text-sm p-3 rounded-md"
                      style={{ backgroundColor: "#f8fafa", color: "#333333" }}
                    >
                      {(() => {
                        try {
                          // Parse the JSON string
                          const sentimentData = JSON.parse(
                            formattedCall.sentimentReasoning || "{}"
                          );
                          // Extract just the explanation field
                          return (
                            sentimentData.explanation ||
                            formattedCall.sentimentReasoning
                          );
                        } catch {
                          // If parsing fails, return the original string
                          return formattedCall.sentimentReasoning;
                        }
                      })()}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm" style={{ color: "#555555" }}>
                No AI analysis available for this call.
              </div>
            )}
          </div>

          <div
            className="bg-white rounded-lg border shadow-sm p-5"
            style={{ borderColor: "#d9dbdb" }}
          >
            <h2
              className="text-lg font-semibold mb-4"
              style={{ color: "#333333" }}
            >
              QA Review
            </h2>

            {formattedCall.engineerStatus ? (
              <>
                <div className="mb-4">
                  <div
                    className="text-sm font-medium mb-1"
                    style={{ color: "#555555" }}
                  >
                    Status
                  </div>
                  <div
                    className="px-2 py-1 rounded-md text-sm font-medium inline-block"
                    style={{
                      backgroundColor:
                        formattedCall.engineerStatus === "Pass"
                          ? "#dcfce7"
                          : "#fee4e2",
                      color:
                        formattedCall.engineerStatus === "Pass"
                          ? "#15803d"
                          : "#b42318",
                    }}
                  >
                    {formattedCall.engineerStatus === "Pass"
                      ? "Approved"
                      : "Failed"}
                  </div>
                </div>

                {formattedCall.engineerComments && (
                  <div className="mb-4">
                    <div
                      className="text-sm font-medium mb-1"
                      style={{ color: "#555555" }}
                    >
                      Comments
                    </div>
                    <div
                      className="text-sm p-3 rounded-md"
                      style={{ backgroundColor: "#f8fafa", color: "#333333" }}
                    >
                      {formattedCall.engineerComments}
                    </div>
                  </div>
                )}
              </>
            ) : formattedCall.needsCheck ? (
              <div
                className="px-2 py-1 rounded-md text-sm font-medium inline-block"
                style={{
                  backgroundColor: "#fcf3dc",
                  color: "#8f5f00",
                }}
              >
                Pending Review
              </div>
            ) : (
              <div className="text-sm" style={{ color: "#555555" }}>
                No QA review required for this call.
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardSidebar>
  );
}
