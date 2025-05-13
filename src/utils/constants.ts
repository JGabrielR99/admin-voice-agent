// Constants used in the application
export const EXCEL_IMPORT = {
  MAX_BATCH_SIZE: 50,
  DELAY_BETWEEN_BATCHES: 1000, // ms
};

// Singleton import progress state
import { ImportProgress } from "../types/import-excel";

// Default import progress state
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

// Singleton to track import progress across API calls
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
