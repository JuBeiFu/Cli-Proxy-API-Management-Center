import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useHeaderRefresh } from '@/hooks/useHeaderRefresh';
import { authFilesApi } from '@/services/api';
import { useNotificationStore } from '@/stores';
import type { AuthBanRecordItem } from '@/types';
import styles from './AuthBanRecordsPage.module.scss';

const formatDateTime = (value: string | undefined, locale: string, fallback: string) => {
  if (!value) return fallback;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(parsed));
};

export function AuthBanRecordsPage() {
  const { t, i18n } = useTranslation();
  const { showNotification } = useNotificationStore();
  const [records, setRecords] = useState<AuthBanRecordItem[]>([]);
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRecords = useCallback(
    async (notify = false) => {
      setLoading(true);
      setError('');
      try {
        const data = await authFilesApi.listBanRecords();
        setRecords(data.records ?? []);
        setDate(data.date ?? '');
        if (notify) {
          showNotification(t('notification.data_refreshed'), 'success');
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : t('notification.refresh_failed');
        setError(message);
        if (notify) {
          showNotification(`${t('notification.refresh_failed')}: ${message}`, 'error');
        }
      } finally {
        setLoading(false);
      }
    },
    [showNotification, t]
  );

  useHeaderRefresh(() => loadRecords(false));

  useEffect(() => {
    void loadRecords(false);
  }, [loadRecords]);

  const titleNode = (
    <div className={styles.titleWrapper}>
      <span>{t('auth_ban_records.title_section')}</span>
      <span className={styles.countBadge}>{records.length}</span>
    </div>
  );

  const dayLabel = useMemo(() => {
    if (!date) return t('common.not_set');
    const parsed = Date.parse(`${date}T00:00:00`);
    if (Number.isNaN(parsed)) return date;
    return new Intl.DateTimeFormat(i18n.language, {
      dateStyle: 'full',
    }).format(new Date(parsed));
  }, [date, i18n.language, t]);

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{t('auth_ban_records.title')}</h1>
        <p className={styles.description}>{t('auth_ban_records.description')}</p>
      </div>

      <Card
        title={titleNode}
        extra={
          <div className={styles.headerActions}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void loadRecords(true)}
              disabled={loading}
            >
              {t('common.refresh')}
            </Button>
          </div>
        }
      >
        <div className={styles.summaryRow}>
          <span className={styles.summaryChip}>
            {t('auth_ban_records.current_day')}: {dayLabel}
          </span>
          <span className={styles.summaryChip}>
            {t('auth_ban_records.total_count', { count: records.length })}
          </span>
        </div>

        {error && <div className={styles.errorBox}>{error}</div>}

        {loading ? (
          <div className="hint">{t('common.loading')}</div>
        ) : records.length === 0 ? (
          <EmptyState
            title={t('auth_ban_records.empty_title')}
            description={t('auth_ban_records.empty_desc')}
          />
        ) : (
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <div>{t('auth_ban_records.account')}</div>
              <div>{t('auth_ban_records.created_at')}</div>
              <div>{t('auth_ban_records.banned_at')}</div>
              <div>{t('auth_ban_records.reason')}</div>
            </div>

            {records.map((record, index) => {
              const key = `${record.bannedAt}-${record.account ?? record.name ?? index}`;
              const account = record.account || record.name || t('common.not_set');

              return (
                <div key={key} className={styles.row}>
                  <div className={styles.cell} data-label={t('auth_ban_records.account')}>
                    <div className={styles.account}>{account}</div>
                    {record.name && record.name !== account ? (
                      <div className={styles.fileName}>{record.name}</div>
                    ) : null}
                  </div>

                  <div className={styles.cell} data-label={t('auth_ban_records.created_at')}>
                    <span className={styles.dateValue}>
                      {formatDateTime(record.createdAt, i18n.language, t('common.not_set'))}
                    </span>
                  </div>

                  <div className={styles.cell} data-label={t('auth_ban_records.banned_at')}>
                    <span className={styles.dateValue}>
                      {formatDateTime(record.bannedAt, i18n.language, t('common.not_set'))}
                    </span>
                  </div>

                  <div className={styles.cell} data-label={t('auth_ban_records.reason')}>
                    <div className={styles.reason}>{record.reason || t('common.not_set')}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
