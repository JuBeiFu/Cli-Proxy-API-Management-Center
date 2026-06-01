/**
 * 认证文件相关类型
 * 基于原项目 src/modules/auth-files.js
 */

export type AuthFileType =
  | 'qwen'
  | 'kimi'
  | 'gemini'
  | 'gemini-cli'
  | 'aistudio'
  | 'claude'
  | 'codex'
  | 'antigravity'
  | 'iflow'
  | 'vertex'
  | 'empty'
  | 'unknown';

export interface AuthFileQuotaState {
  exceeded?: boolean;
  reason?: string;
  backoff_level?: number;
  next_recover_at?: string;
}

export interface AuthFileModelStatesSummary {
  available?: number;
  cooldown?: number;
  disabled?: number;
}

export interface AuthFileCodexQuotaSnapshot {
  window?: string;
  remaining_ratio?: number | string;
  remainingRatio?: number | string;
  limit?: number | string;
  remaining?: number | string;
  reset_at?: string | number;
  resetAt?: string | number;
  updated_at?: string | number;
  updatedAt?: string | number;
}

export interface AuthFileItem {
  name: string;
  type?: AuthFileType | string;
  provider?: string;
  size?: number;
  authIndex?: string | number | null;
  runtimeOnly?: boolean | string;
  disabled?: boolean;
  unavailable?: boolean;
  status?: string;
  statusMessage?: string;
  lastRefresh?: string | number;
  modified?: number;
  quotaStatus?: string;
  quotaRemaining?: number;
  quotaTotal?: number;
  quotaResetAt?: string | number;
  quota?: AuthFileQuotaState;
  codex_quota_snapshot?: AuthFileCodexQuotaSnapshot;
  codexQuotaSnapshot?: AuthFileCodexQuotaSnapshot;
  model_states_summary?: AuthFileModelStatesSummary;
  plan_type?: string;
  next_retry_after?: string;
  [key: string]: unknown;
}

export interface AuthFilesAvailableResponse {
  files: AuthFileItem[];
  available_count: number;
  total_count: number;
}

export interface QuotaCheckResult {
  auth_id: string;
  auth_index: string;
  email?: string;
  plan_type?: string;
  available: boolean;
  status_code: number;
  error_type?: string;
  message?: string;
  resets_at?: string;
  resets_in_seconds?: number;
  suspended: boolean;
  error?: string;
}

export interface QuotaCheckResponse {
  results: QuotaCheckResult[];
  total: number;
  available: number;
  exhausted: number;
  errored: number;
}

export interface RefreshAccountsResult {
  auth_id: string;
  auth_index?: string;
  email?: string;
  was_cooling: boolean;
  still_cooling: boolean;
  recovered: boolean;
  plan_before?: string;
  plan_after?: string;
  upgraded: boolean;
  downgraded: boolean;
  error?: string;
}

export interface RefreshAccountsResponse {
  total: number;
  recovered: number;
  upgraded: number;
  downgraded: number;
  still_cooling: number;
  errored: number;
  results: RefreshAccountsResult[];
}

// Async refresh: POST returns a job handle; progress is polled via the status endpoint.
export interface RefreshAccountsStartResponse {
  job_id: string;
  started: boolean;
  status: string;
}

export interface RefreshAccountsJobView {
  job_id: string;
  status: 'running' | 'done' | string;
  cooling_only: boolean;
  total: number;
  done: number;
  recovered: number;
  upgraded: number;
  downgraded: number;
  still_cooling: number;
  errored: number;
  started_at?: string;
  finished_at?: string;
  results?: RefreshAccountsResult[];
}

export interface AuthFilesResponse {
  files: AuthFileItem[];
  total?: number;
}

export interface AuthBanRecordItem {
  name?: string;
  account?: string;
  provider?: string;
  source?: string;
  reason: string;
  createdAt?: string;
  bannedAt: string;
}

export interface AuthBanRecordsResponse {
  date?: string;
  total?: number;
  records: AuthBanRecordItem[];
}
