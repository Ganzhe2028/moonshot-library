import { getDatabase } from './database';
import bcrypt from 'bcryptjs';
import { User } from '../types';

const saltRounds = 10;

export const createUser = async (userData: {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'student' | 'teacher' | 'librarian';
  grade?: string;
}): Promise<User> => {
  const db = getDatabase();
  const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO users (id, email, password, name, role, grade)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    db.run(sql, [
      userData.id,
      userData.email,
      hashedPassword,
      userData.name,
      userData.role,
      userData.grade || null
    ], async function(err) {
      if (err) {
        reject(err);
      } else {
        const user = await getUserById(userData.id);
        if (user) {
          resolve(user);
        } else {
          reject(new Error('Failed to retrieve created user'));
        }
      }
    });
  });
};

export const getUserById = async (id: string): Promise<User | null> => {
  const db = getDatabase();

  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM users WHERE id = ?';
    db.get(sql, [id], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row ? deserializeUser(row) : null);
      }
    });
  });
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const db = getDatabase();

  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM users WHERE email = ?';
    db.get(sql, [email], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row ? deserializeUser(row) : null);
      }
    });
  });
};

export const updateUser = async (id: string, updates: Partial<User>): Promise<User> => {
  const db = getDatabase();
  
  const allowedFields = ['name', 'grade', 'avatar_color', 'membership'];
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
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    db.run(sql, values, async function(err) {
      if (err) {
        reject(err);
      } else {
        const user = await getUserById(id);
        if (user) {
          resolve(user);
        } else {
          reject(new Error('Failed to retrieve updated user'));
        }
      }
    });
  });
};

export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const getAllUsers = async (limit: number = 100, offset: number = 0): Promise<User[]> => {
  const db = getDatabase();

  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?';
    db.all(sql, [limit, offset], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows.map(deserializeUser));
      }
    });
  });
};

export const getUsersByRole = async (role: string): Promise<User[]> => {
  const db = getDatabase();

  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM users WHERE role = ? ORDER BY created_at DESC';
    db.all(sql, [role], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows.map(deserializeUser));
      }
    });
  });
};

// 辅助函数：将数据库行转换为 User 对象
const deserializeUser = (row: any): User => {
  return {
    id: row.id,
    email: row.email,
    password: row.password,
    name: row.name,
    role: row.role,
    grade: row.grade,
    membership: row.membership,
    avatarColor: row.avatar_color,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};