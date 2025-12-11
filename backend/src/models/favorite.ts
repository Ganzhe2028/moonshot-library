import { getDatabase } from './database';
import { Favorite } from '../types';

const deserializeFavorite = (row: any): Favorite => ({
  id: row.id,
  userId: row.user_id,
  bookId: row.book_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const generateFavoriteId = (): string => `fav-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

export const getFavoritesByUser = async (userId: string): Promise<Favorite[]> => {
  const db = getDatabase();
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM favorites WHERE user_id = ? ORDER BY created_at DESC';
    db.all(sql, [userId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows.map(deserializeFavorite));
      }
    });
  });
};

export const getFavoriteByUserAndBook = async (userId: string, bookId: string): Promise<Favorite | null> => {
  const db = getDatabase();
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM favorites WHERE user_id = ? AND book_id = ? LIMIT 1';
    db.get(sql, [userId, bookId], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row ? deserializeFavorite(row) : null);
      }
    });
  });
};

export const addFavorite = async (userId: string, bookId: string): Promise<Favorite> => {
  const db = getDatabase();
  const id = generateFavoriteId();

  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO favorites (id, user_id, book_id)
      VALUES (?, ?, ?)
    `;
    db.run(sql, [id, userId, bookId], async (err) => {
      if (err) {
        reject(err);
      } else {
        const favorite = await getFavoriteByUserAndBook(userId, bookId);
        if (favorite) {
          resolve(favorite);
        } else {
          reject(new Error('Failed to retrieve created favorite'));
        }
      }
    });
  });
};

export const removeFavorite = async (userId: string, bookId: string): Promise<boolean> => {
  const db = getDatabase();
  return new Promise((resolve, reject) => {
    const sql = 'DELETE FROM favorites WHERE user_id = ? AND book_id = ?';
    db.run(sql, [userId, bookId], function (err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.changes > 0);
      }
    });
  });
};
