import { getDatabase } from './database';
import { Credit } from '../types';

const deserializeCredit = (row: any): Credit => ({
  id: row.id,
  userId: row.user_id,
  score: row.score,
  level: row.level,
  status: row.status,
  remarks: row.remarks || undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const generateCreditId = (): string => `cred-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

const computeLevel = (score: number): Credit['level'] => {
  if (score >= 90) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'warn';
  return 'suspended';
};

export const getCreditByUserId = async (userId: string): Promise<Credit> => {
  const db = getDatabase();
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM user_credit WHERE user_id = ? LIMIT 1';
    db.get(sql, [userId], async (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      if (row) {
        resolve(deserializeCredit(row));
        return;
      }

      try {
        const created = await createCredit(userId);
        resolve(created);
      } catch (createErr) {
        reject(createErr);
      }
    });
  });
};

export const createCredit = async (userId: string, score: number = 80): Promise<Credit> => {
  const db = getDatabase();
  const id = generateCreditId();
  const level = computeLevel(score);
  const status: Credit['status'] = level === 'suspended' ? 'restricted' : 'active';

  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO user_credit (id, user_id, score, level, status)
      VALUES (?, ?, ?, ?, ?)
    `;
    db.run(sql, [id, userId, score, level, status], async (err) => {
      if (err) {
        reject(err);
      } else {
        const credit = await getCreditByUserId(userId);
        resolve(credit);
      }
    });
  });
};

export const updateCredit = async (
  userId: string,
  updates: Partial<Pick<Credit, 'score' | 'remarks'>>
): Promise<Credit> => {
  const db = getDatabase();

  const fields: string[] = [];
  const values: any[] = [];

  const nextScore = updates.score;
  if (nextScore !== undefined) {
    fields.push('score = ?');
    values.push(nextScore);
    const nextLevel = computeLevel(nextScore);
    const nextStatus: Credit['status'] = nextLevel === 'suspended' ? 'restricted' : 'active';
    fields.push('level = ?');
    values.push(nextLevel);
    fields.push('status = ?');
    values.push(nextStatus);
  }

  if (updates.remarks !== undefined) {
    fields.push('remarks = ?');
    values.push(updates.remarks);
  }

  if (!fields.length) {
    return getCreditByUserId(userId);
  }

  values.push(userId);

  return new Promise((resolve, reject) => {
    const sql = `UPDATE user_credit SET ${fields.join(', ')} WHERE user_id = ?`;
    db.run(sql, values, async (err) => {
      if (err) {
        reject(err);
      } else {
        const credit = await getCreditByUserId(userId);
        resolve(credit);
      }
    });
  });
};
