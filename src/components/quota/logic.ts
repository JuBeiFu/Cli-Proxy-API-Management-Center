import type { AuthFileItem } from '@/types';
import type { CodexQuotaState } from '@/types/quota';

function normalizePlanType(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed.toLowerCase() : null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toString().trim().toLowerCase() || null;
  }
  return null;
}

export function isQuotaManagedAuthAvailable(file: AuthFileItem): boolean {
  if (!file || typeof file !== 'object') return false;

  const record = file as Record<string, unknown>;
  const disabledRaw = record.disabled;
  if (typeof disabledRaw === 'boolean' && disabledRaw) return false;
  if (typeof disabledRaw === 'number' && disabledRaw !== 0) return false;
  if (typeof disabledRaw === 'string') {
    if (disabledRaw.trim().toLowerCase() === 'true') return false;
  }

  const unavailableRaw = record.unavailable;
  const unavailable =
    typeof unavailableRaw === 'boolean'
      ? unavailableRaw
      : typeof unavailableRaw === 'number'
        ? unavailableRaw !== 0
        : typeof unavailableRaw === 'string'
          ? unavailableRaw.trim().toLowerCase() === 'true'
          : false;

  if (!unavailable) return true;

  const nextRetryRaw = file.next_retry_after ?? file.nextRetryAfter;
  if (nextRetryRaw === undefined || nextRetryRaw === null) return false;

  const nextRetryTime = normalizeTimestamp(nextRetryRaw);
  if (nextRetryTime === null) return false;

  return nextRetryTime <= Date.now();
}

export function resolvePreferredCodexPlanType(
  usagePlanType: unknown,
  filePlanType: unknown
): string | null {
  const normalizedUsage = normalizePlanType(usagePlanType);
  const normalizedFile = normalizePlanType(filePlanType);

  if (!normalizedUsage) return normalizedFile;
  if (!normalizedFile) return normalizedUsage;
  if (normalizedUsage === normalizedFile) return normalizedUsage;

  if (normalizedUsage === 'free' && normalizedFile !== 'free') return normalizedFile;
  return normalizedUsage;
}

export function buildCodexQuotaSnapshotState(file: AuthFileItem): CodexQuotaState | null {
  const snapshot = resolveCodexQuotaSnapshot(file);
  if (!snapshot) return null;

  const remainingRatio = normalizeNumber(snapshot.remaining_ratio ?? snapshot.remainingRatio);
  if (remainingRatio === null) return null;

  const remainingPercent = remainingRatio <= 1 ? remainingRatio * 100 : remainingRatio;
  const clampedRemaining = Math.max(0, Math.min(100, remainingPercent));
  const resetLabel = formatSnapshotTime(snapshot.reset_at ?? snapshot.resetAt);
  const snapshotUpdatedAt = normalizeSnapshotTime(snapshot.updated_at ?? snapshot.updatedAt);

  return {
    status: 'success',
    planType: resolveFilePlanType(file),
    snapshotUpdatedAt,
    windows: [
      {
        id: 'five-hour-snapshot',
        label: '5-hour limit',
        labelKey: 'codex_quota.primary_window',
        usedPercent: Math.max(0, Math.min(100, 100 - clampedRemaining)),
        resetLabel,
      },
    ],
  };
}

export function mergeCodexQuotaSnapshots(
  prev: Record<string, CodexQuotaState>,
  files: AuthFileItem[]
): Record<string, CodexQuotaState> {
  const next = { ...prev };
  files.forEach((file) => {
    const snapshotState = buildCodexQuotaSnapshotState(file);
    if (!snapshotState) return;

    const current = next[file.name];
    if (current?.status === 'loading') return;
    if (current?.status === 'success' && current.snapshotUpdatedAt === snapshotState.snapshotUpdatedAt) {
      return;
    }
    next[file.name] = snapshotState;
  });
  return next;
}

function normalizeTimestamp(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value < 1e12 ? value * 1000 : value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const numeric = Number(trimmed);
    if (Number.isFinite(numeric)) {
      return numeric < 1e12 ? numeric * 1000 : numeric;
    }
    const parsed = Date.parse(trimmed);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return null;
}

function resolveCodexQuotaSnapshot(file: AuthFileItem): Record<string, unknown> | null {
  const snapshot = file.codex_quota_snapshot ?? file.codexQuotaSnapshot;
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
    return null;
  }
  return snapshot as Record<string, unknown>;
}

function resolveFilePlanType(file: AuthFileItem): string | null {
  const candidates = [file.plan_type, file.planType, file['plan_type'], file['planType']];
  for (const candidate of candidates) {
    const planType = normalizePlanType(candidate);
    if (planType) return planType;
  }
  return null;
}

function normalizeNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function normalizeSnapshotTime(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const date = new Date(value < 1e12 ? value * 1000 : value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const numeric = Number(trimmed);
    if (Number.isFinite(numeric)) {
      const date = new Date(numeric < 1e12 ? numeric * 1000 : numeric);
      return Number.isNaN(date.getTime()) ? null : date.toISOString();
    }
    const parsed = Date.parse(trimmed);
    if (!Number.isNaN(parsed)) return trimmed;
  }
  return null;
}

function formatSnapshotTime(value: unknown): string {
  const normalized = normalizeSnapshotTime(value);
  if (!normalized) return '-';
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString(undefined, {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}
