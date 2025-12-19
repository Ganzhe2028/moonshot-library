import { getDatabase } from './database';
import { BorrowingRecord } from '../types';
import { updateBookAvailability } from './book';

const BORROW_PERIOD_DAYS = parseInt(process.env.BORROW_PERIOD_DAYS || '21');
const RENEW_PERIOD_DAYS = parseInt(process.env.RENEW_PERIOD_DAYS || '14');
const MAX_RENEWALS = parseInt(process.env.MAX_RENEWALS || '2');

export const createBorrowingRecord = async (recordData: {
  id: string;
  userId: string;
  bookId: string;
  borrowDate?: string;
  dueDate?: string;
  status?: string;
}): Promise<BorrowingRecord> => {
  const db = getDatabase();
  const borrowDate = recordData.borrowDate || new Date().toISOString().split('T')[0];
  const dueDate = recordData.dueDate || calculateDueDate(borrowDate as string);
  const status = recordData.status || 'active';
  // Ensure dueDate is in YYYY-MM-DD format
  const formattedDueDate = new Date(dueDate).toISOString().split('T')[0];

  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO borrowing_records (id, user_id, book_id, borrow_date, due_date, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    db.run(sql, [
      recordData.id,
      recordData.userId,
      recordData.bookId,
      borrowDate,
      formattedDueDate,
      status
    ], async function(err) {
      if (err) {
        reject(err);
      } else {
        try {
          // 更新图书可用性
          await updateBookAvailability(recordData.bookId, -1);
          const record = await getBorrowingRecordById(recordData.id);
          if (record) {
            resolve(record);
          } else {
            reject(new Error('Failed to retrieve created borrowing record'));
          }
        } catch (updateErr) {
          reject(updateErr);
        }
      }
    });
  });
};

export const getBorrowingRecordById = async (id: string): Promise<BorrowingRecord | null> => {
  const db = getDatabase();

  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM borrowing_records WHERE id = ?';
    db.get(sql, [id], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row ? deserializeBorrowingRecord(row) : null);
      }
    });
  });
};

export const getBorrowingRecordsByUser = async (
  userId: string, 
  status?: string,
  limit: number = 100,
  offset: number = 0
): Promise<BorrowingRecord[]> => {
  const db = getDatabase();

  return new Promise((resolve, reject) => {
    let sql = 'SELECT * FROM borrowing_records WHERE user_id = ?';
    const params: any[] = [userId];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows.map(deserializeBorrowingRecord));
      }
    });
  });
};

export const countActiveBorrowingsByUser = async (userId: string): Promise<number> => {
  const db = getDatabase();

  return new Promise((resolve, reject) => {
    const sql = `
      SELECT COUNT(*) as count
      FROM borrowing_records
      WHERE user_id = ? AND status IN ('active', 'overdue')
    `;
    db.get(sql, [userId], (err, row: { count: number }) => {
      if (err) {
        reject(err);
      } else {
        resolve(row?.count ?? 0);
      }
    });
  });
};

export const getBorrowingRecordsByBook = async (
  bookId: string,
  status?: string
): Promise<BorrowingRecord[]> => {
  const db = getDatabase();

  return new Promise((resolve, reject) => {
    let sql = 'SELECT * FROM borrowing_records WHERE book_id = ?';
    const params: any[] = [bookId];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC';

    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows.map(deserializeBorrowingRecord));
      }
    });
  });
};

export const getAllBorrowingRecords = async (
  status?: string,
  limit: number = 100,
  offset: number = 0
): Promise<BorrowingRecord[]> => {
  const db = getDatabase();

  return new Promise((resolve, reject) => {
    let sql = 'SELECT * FROM borrowing_records';
    const params: any[] = [];

    if (status) {
      sql += ' WHERE status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows.map(deserializeBorrowingRecord));
      }
    });
  });
};

export const updateBorrowingRecord = async (
  id: string, 
  updates: Partial<BorrowingRecord>
): Promise<BorrowingRecord> => {
  const db = getDatabase();
  
  // 扩展允许更新的字段，添加borrow_date以支持管理员修改借阅时间
  const allowedFields = ['borrow_date', 'due_date', 'return_date', 'status', 'renewals'];
  const fields: string[] = [];
  const values: any[] = [];

  Object.entries(updates).forEach(([key, value]) => {
    if (allowedFields.includes(key) && value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  });

  if (fields.length === 0) {
    throw new Error('No valid fields to update');
  }

  values.push(id);

  return new Promise((resolve, reject) => {
    const sql = `UPDATE borrowing_records SET ${fields.join(', ')} WHERE id = ?`;
    db.run(sql, values, function(err) {
      if (err) {
        reject(err);
      } else {
        getBorrowingRecordById(id).then(record => {
          if (record) {
            resolve(record);
          } else {
            reject(new Error('Failed to retrieve updated borrowing record'));
          }
        }).catch(reject);
      }
    });
  });
};

export const returnBook = async (borrowingId: string): Promise<BorrowingRecord> => {
  const record = await getBorrowingRecordById(borrowingId);
  if (!record) {
    throw new Error('Borrowing record not found');
  }

  if (record.status === 'returned') {
    throw new Error('Book already returned');
  }

  const returnDate = new Date().toISOString().split('T')[0];
  const updates = {
    return_date: returnDate,
    status: 'returned' as const
  };

  // 更新借阅记录
  const updatedRecord = await updateBorrowingRecord(borrowingId, updates);
  
  // 更新图书可用性
  await updateBookAvailability(record.bookId, 1);
  
  return updatedRecord;
};

export const renewBorrowing = async (borrowingId: string): Promise<BorrowingRecord> => {
  const record = await getBorrowingRecordById(borrowingId);
  if (!record) {
    throw new Error('Borrowing record not found');
  }

  if (record.status !== 'active') {
    throw new Error('Cannot renew inactive borrowing');
  }

  if (record.renewals >= MAX_RENEWALS) {
    throw new Error(`Maximum renewals (${MAX_RENEWALS}) reached`);
  }

  const newDueDate = calculateDueDate(record.dueDate);
  const updates = {
    due_date: newDueDate,
    renewals: record.renewals + 1
  };

  return updateBorrowingRecord(borrowingId, updates);
};

export const checkOverdueBorrowings = async (): Promise<BorrowingRecord[]> => {
  const db = getDatabase();
  const today = new Date().toISOString().split('T')[0];

  return new Promise((resolve, reject) => {
    const sql = `
      SELECT * FROM borrowing_records 
      WHERE status = 'active' AND due_date < ?
      ORDER BY due_date ASC
    `;
    db.all(sql, [today], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows.map(deserializeBorrowingRecord));
      }
    });
  });
};

export const updateOverdueStatus = async (): Promise<number> => {
  const overdueRecords = await checkOverdueBorrowings();
  
  for (const record of overdueRecords) {
    await updateBorrowingRecord(record.id, { status: 'overdue' });
  }

  return overdueRecords.length;
};

// 辅助函数
const calculateDueDate = (fromDate: string): string => {
  const date = new Date(fromDate);
  date.setDate(date.getDate() + BORROW_PERIOD_DAYS);
  const result = date.toISOString().split('T')[0];
  if (!result) {
    throw new Error('Failed to calculate due date');
  }
  return result;
};

const deserializeBorrowingRecord = (row: any): BorrowingRecord => {
  return {
    id: row.id,
    userId: row.user_id,
    bookId: row.book_id,
    borrowDate: row.borrow_date,
    dueDate: row.due_date,
    returnDate: row.return_date,
    status: row.status,
    renewals: row.renewals,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};
