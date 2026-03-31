export const EXCEPTION_THRESHOLDS = {
  authWithoutCaptureMs: 2 * 60 * 1000,
  captureWithoutCloseMs: 5 * 60 * 1000,
  stalePreauthAfterCaptureMs: 30 * 60 * 1000,
  finalReceiptTimeoutMs: 15 * 60 * 1000,
  rewardsPostingDelayMs: 5 * 60 * 1000,
} as const;
