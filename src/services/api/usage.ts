import { apiClient } from './client';
import { computeKeyStats, KeyStats } from '@/utils/usage';

const USAGE_TIMEOUT_MS = 60 * 1000;

export interface UsageExportPayload {
  version?: number;
  exported_at?: string;
  usage?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface UsageImportResponse {
  added?: number;
  skipped?: number;
  total_requests?: number;
  failed_requests?: number;
  [key: string]: unknown;
}

export interface ProxyStatItem {
  key?: string;
  proxy_url?: string;
  proxy_display?: string;
  proxy_profile?: string;
  total_attempts?: number;
  success_count?: number;
  failure_count?: number;
  response_count?: number;
  transport_error_count?: number;
  http_error_count?: number;
  success_rate?: number;
  first_byte_avg_ms?: number;
  total_duration_avg_ms?: number;
  last_used_at?: string;
  last_status_code?: number;
  last_error?: string;
  status_counts?: Record<string, number>;
  providers?: Record<string, number>;
  plan_types?: Record<string, number>;
  auth_kinds?: Record<string, number>;
  selection_sources?: Record<string, number>;
  [key: string]: unknown;
}

export interface ProxyStatsPayload {
  total_attempts?: number;
  success_count?: number;
  failure_count?: number;
  response_count?: number;
  proxies?: ProxyStatItem[];
  recent?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export const usageApi = {
  getUsage: () =>
    apiClient.get<Record<string, unknown>>('/usage', {
      timeout: USAGE_TIMEOUT_MS,
      params: { range: '24h', detail_limit: 2000 }
    }),

  exportUsage: () => apiClient.get<UsageExportPayload>('/usage/export', { timeout: USAGE_TIMEOUT_MS }),

  importUsage: (payload: unknown) =>
    apiClient.post<UsageImportResponse>('/usage/import', payload, { timeout: USAGE_TIMEOUT_MS }),

  async getProxyStats(): Promise<ProxyStatsPayload> {
    const response = await apiClient.get<Record<string, unknown>>('/proxy-stats', {
      timeout: USAGE_TIMEOUT_MS
    });
    const payload = (response?.proxy_stats ?? response ?? {}) as ProxyStatsPayload;
    return payload && typeof payload === 'object' ? payload : {};
  },

  async getKeyStats(usageData?: unknown): Promise<KeyStats> {
    let payload = usageData;
    if (!payload) {
      const response = await apiClient.get<Record<string, unknown>>('/usage', {
        timeout: USAGE_TIMEOUT_MS,
        params: { range: '24h', detail_limit: 2000 }
      });
      payload = response?.usage ?? response;
    }
    return computeKeyStats(payload);
  }
};
