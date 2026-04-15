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
