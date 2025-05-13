import { importProgressTracker } from "./constants";
export function parseDate(
  value: string | Date | number | undefined | null,
  fieldName: string,
  callId?: string
): Date | null {
  if (value === null || value === undefined || String(value).trim() === "")
    return null;
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  let date: Date | null = null;
  const valStr = String(value);
  if (valStr.includes("T") && valStr.endsWith("Z")) {
    const parsed = new Date(valStr);
    if (!isNaN(parsed.getTime())) date = parsed;
  }
  if (!date) {
    const parsed = new Date(valStr);
    if (!isNaN(parsed.getTime())) date = parsed;
  }
  if (!date && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(valStr)) {
    const parts = valStr.split("/");
    const parsed = new Date(
      parseInt(parts[2]),
      parseInt(parts[1]) - 1,
      parseInt(parts[0])
    );
    if (!isNaN(parsed.getTime())) date = parsed;
  }
  if (!date && typeof value === "number" && value > 0 && value < 2958466) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const jsTimestamp =
      excelEpoch.getTime() +
      (value - (value > 60 ? 1 : 0)) * 24 * 60 * 60 * 1000;
    const parsed = new Date(jsTimestamp);
    if (!isNaN(parsed.getTime())) date = parsed;
  }
  if (!date) {
    const progress = importProgressTracker.get();
    console.warn(
      `[Job ${progress.jobId}] Call ${
        callId || "N/A"
      }: Invalid date for ${fieldName}: '${value}'. Storing as null.`
    );
  }
  return date;
}
export function parseFloatOrNull(
  value: string | number | undefined | null
): number | null {
  if (value === null || value === undefined || String(value).trim() === "")
    return null;
  const num = parseFloat(String(value));
  return isNaN(num) ? null : num;
}
export function parseIntOrNull(
  value: string | number | undefined | null
): number | null {
  if (value === null || value === undefined || String(value).trim() === "")
    return null;
  const num = parseInt(String(value), 10);
  return isNaN(num) ? null : num;
}
export function getStringOrNull(value: unknown): string | null {
  return value !== undefined && value !== null && String(value).trim() !== ""
    ? String(value)
    : null;
}
export function getCallIdDisplay(callId: string | undefined | null): string {
  return callId ? String(callId).trim().substring(0, 10) : "MISSING";
}
