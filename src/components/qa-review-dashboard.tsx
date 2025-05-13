"use client";
import { useState, useEffect } from "react";
import {
  Phone,
  Calendar,
  Clock,
  ArrowLeft,
  ArrowRight,
  Play,
  Pause,
} from "lucide-react";
import { format } from "date-fns";
import { Call } from "./calls-table";
interface QAReviewDashboardProps {
  initialCall?: Call | null;
}
export function QAReviewDashboard({ initialCall }: QAReviewDashboardProps) {
  const [calls, setCalls] = useState<Call[]>(initialCall ? [initialCall] : []);
  const [currentCallIndex, setCurrentCallIndex] = useState(0);
  const [loading, setLoading] = useState(!initialCall);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(
    null
  );
  const [engineerStatus, setEngineerStatus] = useState<string | null>(
    initialCall?.engineerStatus || null
  );
  const [engineerComments, setEngineerComments] = useState<string>(
    initialCall?.engineerComments || ""
  );
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const audio = new Audio();
      setAudioElement(audio);
      return () => {
        if (audio) {
          audio.pause();
          audio.src = "";
        }
      };
    }
  }, []);
  useEffect(() => {
    if (initialCall && page === 1) return;
    const fetchCalls = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/calls/qa-review?page=${page}&pageSize=${pageSize}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch calls");
        }
        const data = await response.json();
        setCalls(data.data);
        setTotalPages(data.pagination.totalPages);
        if (data.data.length > 0) {
          const firstCall = data.data[0];
          setEngineerStatus(firstCall.engineerStatus || null);
          setEngineerComments(firstCall.engineerComments || "");
        }
      } catch (error) {
        setError("Error loading calls for review");
        console.error("Error fetching calls for QA review:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCalls();
  }, [page, pageSize, initialCall]);
  const currentCall = calls[currentCallIndex] || null;
  const toggleAudio = () => {
    if (!audioElement || !currentCall?.recordingUrl) return;
    if (audioPlaying) {
      audioElement.pause();
    } else {
      audioElement.src = currentCall.recordingUrl;
      audioElement.play().catch((error) => {
        console.error("Error playing audio:", error);
      });
    }
    setAudioPlaying(!audioPlaying);
  };
  useEffect(() => {
    if (!audioElement) return;
    const handleEnded = () => setAudioPlaying(false);
    audioElement.addEventListener("ended", handleEnded);
    return () => {
      audioElement.removeEventListener("ended", handleEnded);
    };
  }, [audioElement]);
  const goToPrevCall = () => {
    if (currentCallIndex > 0) {
      if (audioElement && audioPlaying) {
        audioElement.pause();
        setAudioPlaying(false);
      }
      setCurrentCallIndex(currentCallIndex - 1);
      const prevCall = calls[currentCallIndex - 1];
      setEngineerStatus(prevCall.engineerStatus || null);
      setEngineerComments(prevCall.engineerComments || "");
      setSaveMessage(null);
    } else if (page > 1) {
      setPage(page - 1);
      setCurrentCallIndex(pageSize - 1);
    }
  };
  const goToNextCall = () => {
    if (currentCallIndex < calls.length - 1) {
      if (audioElement && audioPlaying) {
        audioElement.pause();
        setAudioPlaying(false);
      }
      setCurrentCallIndex(currentCallIndex + 1);
      const nextCall = calls[currentCallIndex + 1];
      setEngineerStatus(nextCall.engineerStatus || null);
      setEngineerComments(nextCall.engineerComments || "");
      setSaveMessage(null);
    } else if (page < totalPages) {
      setPage(page + 1);
      setCurrentCallIndex(0);
    }
  };
  const saveQAReview = async () => {
    if (!currentCall) return;
    try {
      setSaving(true);
      const response = await fetch(`/api/calls/${currentCall.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          engineerStatus,
          engineerComments,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to save review");
      }
      const updatedCalls = [...calls];
      updatedCalls[currentCallIndex] = {
        ...currentCall,
        engineerStatus,
        engineerComments,
      };
      setCalls(updatedCalls);
      setSaveMessage({ text: "Review saved successfully", type: "success" });
      goToNextCall();
    } catch (error) {
      console.error("Error saving QA review:", error);
      setSaveMessage({ text: "Failed to save review", type: "error" });
    } finally {
      setSaving(false);
    }
  };
  if (loading) {
    return (
      <div className="w-full py-10">
        <div className="text-center">Loading calls for review...</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="w-full">
        <div
          className="bg-white rounded-lg border shadow-sm p-5 text-center"
          style={{ borderColor: "#d9dbdb", color: "#b42318" }}
        >
          {error}
        </div>
      </div>
    );
  }
  if (!currentCall) {
    return (
      <div className="w-full">
        <div
          className="bg-white rounded-lg border shadow-sm p-5 text-center"
          style={{ borderColor: "#d9dbdb", color: "#555555" }}
        >
          No calls available for QA review
        </div>
      </div>
    );
  }
  const formatTime = (seconds: number | null) => {
    if (!seconds) return "-";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };
  return (
    <div className="w-full">
      <div
        className="bg-white rounded-lg border shadow-sm"
        style={{ borderColor: "#d9dbdb" }}
      >
        {}
        <div
          className="flex justify-between items-center border-b p-4"
          style={{ borderColor: "#d9dbdb" }}
        >
          <button
            onClick={goToPrevCall}
            disabled={currentCallIndex === 0 && page === 1}
            className="flex items-center px-3 py-1.5 rounded-md"
            style={{
              backgroundColor: "#d0f2e7",
              color: "#333333",
              opacity: currentCallIndex === 0 && page === 1 ? 0.5 : 1,
            }}
          >
            <ArrowLeft size={16} className="mr-1" />
            Previous
          </button>
          <div className="text-sm" style={{ color: "#555555" }}>
            Call {currentCallIndex + 1} of {calls.length} on page {page} of{" "}
            {totalPages}
          </div>
          <button
            onClick={goToNextCall}
            disabled={
              currentCallIndex === calls.length - 1 && page === totalPages
            }
            className="flex items-center px-3 py-1.5 rounded-md"
            style={{
              backgroundColor: "#d0f2e7",
              color: "#333333",
              opacity:
                currentCallIndex === calls.length - 1 && page === totalPages
                  ? 0.5
                  : 1,
            }}
          >
            Next
            <ArrowRight size={16} className="ml-1" />
          </button>
        </div>
        {}
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2
                className="text-lg font-semibold mb-4"
                style={{ color: "#333333" }}
              >
                Call Information
              </h2>
              <div className="space-y-4">
                <div>
                  <div
                    className="text-sm font-medium mb-1"
                    style={{ color: "#555555" }}
                  >
                    Call ID
                  </div>
                  <div className="text-base" style={{ color: "#333333" }}>
                    {currentCall.sourceCallId?.slice(0, 8) || "-"}
                  </div>
                </div>
                <div>
                  <div
                    className="text-sm font-medium mb-1"
                    style={{ color: "#555555" }}
                  >
                    Agent
                  </div>
                  <div className="text-base" style={{ color: "#333333" }}>
                    {currentCall.agent?.name || "-"}
                  </div>
                </div>
                <div>
                  <div
                    className="text-sm font-medium mb-1"
                    style={{ color: "#555555" }}
                  >
                    Customer Phone
                  </div>
                  <div
                    className="flex items-center text-base"
                    style={{ color: "#333333" }}
                  >
                    <Phone size={16} className="mr-1 text-gray-400" />
                    {currentCall.customerPhoneNumber || "-"}
                  </div>
                </div>
                <div>
                  <div
                    className="text-sm font-medium mb-1"
                    style={{ color: "#555555" }}
                  >
                    Date & Time
                  </div>
                  <div
                    className="flex items-center text-base"
                    style={{ color: "#333333" }}
                  >
                    <Calendar size={16} className="mr-1 text-gray-400" />
                    {format(
                      new Date(currentCall.callStartTime),
                      "yyyy-MM-dd HH:mm:ss"
                    )}
                  </div>
                </div>
                <div>
                  <div
                    className="text-sm font-medium mb-1"
                    style={{ color: "#555555" }}
                  >
                    Duration
                  </div>
                  <div
                    className="flex items-center text-base"
                    style={{ color: "#333333" }}
                  >
                    <Clock size={16} className="mr-1 text-gray-400" />
                    {formatTime(currentCall.durationSeconds)}
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h2
                className="text-lg font-semibold mb-4"
                style={{ color: "#333333" }}
              >
                AI Evaluation
              </h2>
              <div className="space-y-4">
                <div>
                  <div
                    className="text-sm font-medium mb-1"
                    style={{ color: "#555555" }}
                  >
                    Sentiment
                  </div>
                  <div className="text-base" style={{ color: "#333333" }}>
                    {currentCall.sentiment || "-"}
                  </div>
                </div>
                <div>
                  <div
                    className="text-sm font-medium mb-1"
                    style={{ color: "#555555" }}
                  >
                    Call Type
                  </div>
                  <div className="text-base" style={{ color: "#333333" }}>
                    {currentCall.callTypeValue || "-"}
                  </div>
                </div>
                <div>
                  <div
                    className="text-sm font-medium mb-1"
                    style={{ color: "#555555" }}
                  >
                    Protocol Score
                  </div>
                  <div className="text-base" style={{ color: "#333333" }}>
                    {currentCall.protocolAdherence
                      ? `${currentCall.protocolAdherence}%`
                      : "-"}
                  </div>
                </div>
                <div>
                  <div
                    className="text-sm font-medium mb-1"
                    style={{ color: "#555555" }}
                  >
                    VAPI Score
                  </div>
                  <div className="text-base" style={{ color: "#333333" }}>
                    {currentCall.vapiScore || "-"}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2
                className="text-lg font-semibold mb-4"
                style={{ color: "#333333" }}
              >
                Call Recording
              </h2>
              {currentCall.recordingUrl ? (
                <div
                  className="p-4 rounded-md"
                  style={{ backgroundColor: "#f8fafa" }}
                >
                  <div className="flex items-center">
                    <button
                      onClick={toggleAudio}
                      className="flex items-center justify-center w-10 h-10 rounded-full mr-3"
                      style={{ backgroundColor: "#d0f2e7" }}
                    >
                      {audioPlaying ? (
                        <Pause size={18} style={{ color: "#333333" }} />
                      ) : (
                        <Play size={18} style={{ color: "#333333" }} />
                      )}
                    </button>
                    <div className="text-sm" style={{ color: "#555555" }}>
                      Duration: {formatTime(currentCall.durationSeconds)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-base" style={{ color: "#555555" }}>
                  No recording available
                </div>
              )}
            </div>
            <div>
              <h2
                className="text-lg font-semibold mb-4"
                style={{ color: "#333333" }}
              >
                Call Summary
              </h2>
              <div
                className="p-4 rounded-md"
                style={{ backgroundColor: "#f8fafa", color: "#333333" }}
              >
                {currentCall.summary || "No summary available"}
              </div>
            </div>
          </div>
          {}
          <div className="mt-6">
            <h2
              className="text-lg font-semibold mb-4"
              style={{ color: "#333333" }}
            >
              QA Review
            </h2>
            <div className="space-y-4">
              <div>
                <div
                  className="text-sm font-medium mb-2"
                  style={{ color: "#555555" }}
                >
                  Status
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setEngineerStatus("Pass")}
                    className="px-4 py-2 rounded-md"
                    style={{
                      backgroundColor:
                        engineerStatus === "Pass" ? "#dcfce7" : "#f8fafa",
                      color: engineerStatus === "Pass" ? "#15803d" : "#555555",
                      border: "1px solid",
                      borderColor:
                        engineerStatus === "Pass" ? "#15803d" : "#d9dbdb",
                    }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => setEngineerStatus("Fail")}
                    className="px-4 py-2 rounded-md"
                    style={{
                      backgroundColor:
                        engineerStatus === "Fail" ? "#fee4e2" : "#f8fafa",
                      color: engineerStatus === "Fail" ? "#b42318" : "#555555",
                      border: "1px solid",
                      borderColor:
                        engineerStatus === "Fail" ? "#b42318" : "#d9dbdb",
                    }}
                  >
                    Fail
                  </button>
                </div>
              </div>
              <div>
                <div
                  className="text-sm font-medium mb-2"
                  style={{ color: "#555555" }}
                >
                  Comments
                </div>
                <textarea
                  value={engineerComments}
                  onChange={(e) => setEngineerComments(e.target.value)}
                  className="w-full p-3 rounded-md"
                  style={{
                    backgroundColor: "#f8fafa",
                    color: "#333333",
                    border: "1px solid #d9dbdb",
                    minHeight: "100px",
                  }}
                  placeholder="Add your comments here..."
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  {saveMessage && (
                    <div
                      className="px-3 py-1 rounded-md text-sm"
                      style={{
                        backgroundColor:
                          saveMessage.type === "success"
                            ? "#dcfce7"
                            : "#fee4e2",
                        color:
                          saveMessage.type === "success"
                            ? "#15803d"
                            : "#b42318",
                      }}
                    >
                      {saveMessage.text}
                    </div>
                  )}
                </div>
                <button
                  onClick={saveQAReview}
                  disabled={saving || !engineerStatus}
                  className="px-4 py-2 rounded-md"
                  style={{
                    backgroundColor: "#d0f2e7",
                    color: "#333333",
                    opacity: saving || !engineerStatus ? 0.5 : 1,
                  }}
                >
                  {saving ? "Saving..." : "Save & Continue"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
