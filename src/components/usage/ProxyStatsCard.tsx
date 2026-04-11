import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import type { ProxyStatItem, ProxyStatsPayload } from '@/services/api/usage';
import styles from '@/pages/UsagePage.module.scss';

export interface ProxyStatsCardProps {
  proxyStats: ProxyStatsPayload | null;
  loading: boolean;
}

const formatRate = (rate?: number) => {
  if (!Number.isFinite(rate)) return '--';
  const normalized = Number(rate) <= 1 ? Number(rate) * 100 : Number(rate);
  return `${normalized.toFixed(1)}%`;
};

const formatDuration = (value?: number) => {
  if (!Number.isFinite(value) || Number(value) <= 0) return '--';
  if (Number(value) < 1000) return `${Math.round(Number(value))} ms`;
  return `${(Number(value) / 1000).toFixed(2)} s`;
};

const formatDateTime = (value?: string) => {
  if (!value) return '--';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '--' : date.toLocaleString();
};

const summarizeCounters = (input: unknown) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return '';
  return Object.entries(input as Record<string, unknown>)
    .map(([key, value]) => [key, Number(value)] as const)
    .filter(([, value]) => Number.isFinite(value) && value > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([key, value]) => `${key} (${value})`)
    .join(', ');
};

const buildSelectionSummary = (item: ProxyStatItem) => {
  const parts = [
    item.proxy_profile ? `profile: ${item.proxy_profile}` : '',
    summarizeCounters(item.providers) ? `provider: ${summarizeCounters(item.providers)}` : '',
    summarizeCounters(item.plan_types) ? `plan: ${summarizeCounters(item.plan_types)}` : '',
    summarizeCounters(item.auth_kinds) ? `auth: ${summarizeCounters(item.auth_kinds)}` : '',
    summarizeCounters(item.selection_sources)
      ? `source: ${summarizeCounters(item.selection_sources)}`
      : ''
  ].filter(Boolean);
  return parts.join(' | ');
};

export function ProxyStatsCard({ proxyStats, loading }: ProxyStatsCardProps) {
  const { t } = useTranslation();

  const rows = useMemo(
    () => (Array.isArray(proxyStats?.proxies) ? [...proxyStats.proxies] : []),
    [proxyStats?.proxies]
  );

  const totalAttempts = Number(proxyStats?.total_attempts ?? 0);
  const successCount = Number(proxyStats?.success_count ?? 0);
  const failureCount = Number(proxyStats?.failure_count ?? 0);
  const responseCount = Number(proxyStats?.response_count ?? 0);
  const successRate = totalAttempts > 0 ? successCount / totalAttempts : 0;

  return (
    <Card
      title={t('usage_stats.proxy_stats_title', { defaultValue: 'Proxy Health' })}
      extra={
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12 }}>
          <span className={styles.credentialType}>{`${rows.length} nodes`}</span>
          <span className={styles.credentialType}>{`success ${formatRate(successRate)}`}</span>
          <span className={styles.credentialType}>{`${responseCount} responses`}</span>
          <span className={styles.credentialType}>{`${failureCount} failures`}</span>
        </div>
      }
      className={styles.detailsFixedCard}
    >
      {loading && rows.length === 0 ? (
        <div className={styles.hint}>{t('common.loading')}</div>
      ) : rows.length > 0 ? (
        <div className={styles.detailsScroll}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t('usage_stats.proxy_stats_proxy', { defaultValue: 'Proxy' })}</th>
                  <th>{t('usage_stats.proxy_stats_attempts', { defaultValue: 'Attempts' })}</th>
                  <th>{t('usage_stats.success_rate')}</th>
                  <th>{t('usage_stats.proxy_stats_first_byte', { defaultValue: 'Avg TTFB' })}</th>
                  <th>{t('usage_stats.proxy_stats_total_duration', { defaultValue: 'Avg Total' })}</th>
                  <th>{t('usage_stats.proxy_stats_last_used', { defaultValue: 'Last Used' })}</th>
                  <th>{t('usage_stats.proxy_stats_last_error', { defaultValue: 'Last Error' })}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const selectionSummary = buildSelectionSummary(row);
                  const lastError = [
                    Number.isFinite(row.last_status_code) && Number(row.last_status_code) > 0
                      ? `HTTP ${Number(row.last_status_code)}`
                      : '',
                    row.last_error ? String(row.last_error) : ''
                  ]
                    .filter(Boolean)
                    .join(' | ');

                  return (
                    <tr key={row.key || row.proxy_display || row.proxy_url}>
                      <td className={styles.modelCell}>
                        <span>{row.proxy_display || row.proxy_url || '--'}</span>
                        {selectionSummary && (
                          <span className={styles.credentialType} title={selectionSummary}>
                            {selectionSummary}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={styles.requestCountCell}>
                          <span>{Number(row.total_attempts ?? 0).toLocaleString()}</span>
                          <span className={styles.requestBreakdown}>
                            (<span className={styles.statSuccess}>{Number(row.success_count ?? 0)}</span>{' '}
                            <span className={styles.statFailure}>{Number(row.failure_count ?? 0)}</span>)
                          </span>
                        </span>
                      </td>
                      <td>
                        <span
                          className={
                            Number(row.success_rate ?? 0) >= 0.95
                              ? styles.statSuccess
                              : Number(row.success_rate ?? 0) >= 0.8
                                ? styles.statNeutral
                                : styles.statFailure
                          }
                        >
                          {formatRate(row.success_rate)}
                        </span>
                      </td>
                      <td>{formatDuration(row.first_byte_avg_ms)}</td>
                      <td>{formatDuration(row.total_duration_avg_ms)}</td>
                      <td>{formatDateTime(row.last_used_at)}</td>
                      <td title={lastError || undefined}>{lastError || '--'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className={styles.hint}>{t('usage_stats.no_data')}</div>
      )}
    </Card>
  );
}
