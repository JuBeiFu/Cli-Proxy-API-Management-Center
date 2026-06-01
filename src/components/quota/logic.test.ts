import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCodexQuotaSnapshotState,
  isQuotaManagedAuthAvailable,
  mergeCodexQuotaSnapshots,
  resolvePreferredCodexPlanType,
} from './logic.ts';
import { resolveCodexChatgptAccountId } from '../../utils/quota/resolvers.ts';
import type { AuthFileItem } from '../../types/authFile.ts';

test('resolvePreferredCodexPlanType keeps paid file plan when usage falls back to free', () => {
  assert.equal(resolvePreferredCodexPlanType('free', 'plus'), 'plus');
});

test('resolvePreferredCodexPlanType uses usage plan when file plan is missing', () => {
  assert.equal(resolvePreferredCodexPlanType('team', null), 'team');
});

test('isQuotaManagedAuthAvailable excludes disabled auths', () => {
  assert.equal(
    isQuotaManagedAuthAvailable({
      name: 'disabled.json',
      disabled: true,
    } as AuthFileItem),
    false
  );
});

test('isQuotaManagedAuthAvailable excludes unavailable auths still in cooldown', () => {
  assert.equal(
    isQuotaManagedAuthAvailable({
      name: 'cooldown.json',
      unavailable: true,
      next_retry_after: new Date(Date.now() + 60_000).toISOString(),
    } as AuthFileItem),
    false
  );
});

test('isQuotaManagedAuthAvailable restores unavailable auths after cooldown expires', () => {
  assert.equal(
    isQuotaManagedAuthAvailable({
      name: 'expired-cooldown.json',
      unavailable: true,
      next_retry_after: new Date(Date.now() - 60_000).toISOString(),
    } as AuthFileItem),
    true
  );
});

test('buildCodexQuotaSnapshotState turns auth list snapshot into codex quota state', () => {
  const quota = buildCodexQuotaSnapshotState({
    name: 'codex-plus.json',
    plan_type: 'plus',
    codex_quota_snapshot: {
      remaining_ratio: 0.42,
      reset_at: '2026-04-27T08:30:00Z',
      updated_at: '2026-04-27T08:12:00Z',
    },
  } as AuthFileItem);

  assert.equal(quota?.status, 'success');
  assert.equal(quota?.planType, 'plus');
  assert.equal(quota?.windows.length, 1);
  assert.equal(quota?.windows[0]?.id, 'five-hour-snapshot');
  assert.equal(quota?.windows[0]?.usedPercent, 58);
  assert.notEqual(quota?.windows[0]?.resetLabel, '-');
  assert.equal(quota?.snapshotUpdatedAt, '2026-04-27T08:12:00Z');
});

test('mergeCodexQuotaSnapshots preserves active manual refresh loading state', () => {
  const merged = mergeCodexQuotaSnapshots(
    {
      'codex-plus.json': {
        status: 'loading',
        windows: [],
      },
    },
    [
      {
        name: 'codex-plus.json',
        plan_type: 'plus',
        codex_quota_snapshot: {
          remaining_ratio: 0.42,
          updated_at: '2026-04-27T08:12:00Z',
        },
      } as AuthFileItem,
    ]
  );

  assert.equal(merged['codex-plus.json']?.status, 'loading');
});

test('resolveCodexChatgptAccountId accepts top-level session-only account id fields', () => {
  const file = {
    name: 'codex-session.json',
    type: 'codex_session',
    account_id: 'acct_session_123',
    chatgpt_account_id: 'acct_session_123',
  } as AuthFileItem;

  assert.equal(resolveCodexChatgptAccountId(file), 'acct_session_123');
});
