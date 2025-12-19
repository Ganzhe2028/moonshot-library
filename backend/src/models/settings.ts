import { getDatabase } from './database';

const DEFAULT_MAX_ACTIVE_BORROWINGS = Number.parseInt(
  process.env.MAX_ACTIVE_BORROWINGS || '5',
  10
);
const FALLBACK_MAX_ACTIVE_BORROWINGS =
  Number.isFinite(DEFAULT_MAX_ACTIVE_BORROWINGS) && DEFAULT_MAX_ACTIVE_BORROWINGS > 0
    ? DEFAULT_MAX_ACTIVE_BORROWINGS
    : 5;
const BORROWING_LIMIT_KEY = 'max_active_borrowings';

export const getSettingValue = async (key: string): Promise<string | null> => {
  const db = getDatabase();

  return new Promise((resolve, reject) => {
    db.get('SELECT value FROM system_settings WHERE key = ?', [key], (err, row: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(row ? String(row.value) : null);
      }
    });
  });
};

export const setSettingValue = async (key: string, value: string): Promise<void> => {
  const db = getDatabase();

  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO system_settings (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
    `;
    db.run(sql, [key, value], (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

export const getBorrowingLimit = async (): Promise<number> => {
  const value = await getSettingValue(BORROWING_LIMIT_KEY);
  const parsed = Number.parseInt(value ?? '', 10);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return FALLBACK_MAX_ACTIVE_BORROWINGS;
};

export const setBorrowingLimit = async (limit: number): Promise<number> => {
  await setSettingValue(BORROWING_LIMIT_KEY, String(limit));
  return limit;
};
