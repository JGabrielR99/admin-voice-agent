export const EXCEL_IMPORT = {
  MAX_BATCH_SIZE: 50,
  DELAY_BETWEEN_BATCHES: 1000, 
};
import { ImportProgress } from "../types/import-excel";
const DEFAULT_IMPORT_PROGRESS: ImportProgress = {
  inProgress: false,
  jobId: null,
  totalRows: 0,
  processedRows: 0,
  successfulRows: 0,
  failedRows: 0,
  startTime: null,
  endTime: null,
  status: "idle",
};
let importProgress: ImportProgress = { ...DEFAULT_IMPORT_PROGRESS };
export const importProgressTracker = {
  get: (): ImportProgress => ({ ...importProgress }),
  set: (progress: Partial<ImportProgress>): ImportProgress => {
    importProgress = { ...importProgress, ...progress };
    return { ...importProgress };
  },
  reset: (): ImportProgress => {
    importProgress = { ...DEFAULT_IMPORT_PROGRESS };
    return { ...importProgress };
  },
  generateJobId: (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  },
};
