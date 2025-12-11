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
  updatedAt: row.updated_at,
  lastRecoveredAt: row.last_recovered_at
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
        const credit = deserializeCredit(row);
        const recovered = await recoverCreditIfNeeded(credit);
        resolve(recovered);
        return;
      }

      try {
        const created = await createCredit(userId);
        const recovered = await recoverCreditIfNeeded(created);
        resolve(recovered);
      } catch (createErr) {
        reject(createErr);
      }
    });
  });
};

const recoverCreditIfNeeded = async (credit: Credit): Promise<Credit> => {
  const now = new Date();
  const last = credit.lastRecoveredAt ? new Date(credit.lastRecoveredAt) : new Date(credit.updatedAt);
  const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
  const batches = Math.floor(diffDays / 3);
  if (batches <= 0) return credit;

  const increment = batches * 10;
  const newScore = Math.min(100, credit.score + increment);
  if (newScore === credit.score) return credit;

  const nextLevel = computeLevel(newScore);
  const nextStatus: Credit['status'] = nextLevel === 'suspended' ? 'restricted' : 'active';
  await updateCredit(credit.userId, { score: newScore, remarks: credit.remarks });

  return {
    ...credit,
    score: newScore,
    level: nextLevel,
    status: nextStatus,
    lastRecoveredAt: now.toISOString()
  };
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
    fields.push('last_recovered_at = ?');
    values.push(new Date().toISOString());
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
