export interface ExcelRowData {
  call_id: string;
  assistant?: string;
  ended_reason?: string;
  customer_phone?: string;
  call_start_time?: string | Date | number;
  duration?: string | number;
  call_ended_time?: string | Date | number;
  date?: string | Date | number;
  recording_url?: string;
  summary?: string;
  vapi_score?: string;
  check?: string;
  evaluation?: string;
  feedback?: string;
  sentiment?: string;
  protocol_adherence?: string | number;
  llm_feedback?: string;
  outcome?: string;
  call_type_value?: string;
  call_type_confidence?: string | number;
  call_type_reasoning?: string;
  sentiment_reasoning?: string;
  sentiment_confidence?: string | number;
  protocol_reasoning?: string;
  protocol_confidence?: string | number;
  outcome_reasoning?: string;
  outcome_confidence?: string | number;
  status_feedback_engineer?: string;
  comments_engineer?: string;

  customer_phone_number?: string;
  type?: string;
  customer_name?: string;
  insurance?: string;
  dob?: string | Date | number;
  call_reason?: string;
  "Vapi QA Score"?: string | number;
  Reviewer?: string;
  "QA Check"?: string;
  "Feedback QA"?: string;
  "Status Feedback Engineer"?: string;
  "Comments Engineer"?: string;

  [key: string]: unknown;
}

export interface ImportProgress {
  inProgress: boolean;
  jobId: string | null;
  totalRows: number;
  processedRows: number;
  successfulRows: number;
  failedRows: number;
  startTime: Date | null;
  endTime: Date | null;
  status: "idle" | "processing" | "completed" | "error";
  error?: string;
  fileName?: string;
  currentSheet?: string;
}

export interface BatchResult {
  successfulRows: number;
  failedRows: number;
}
