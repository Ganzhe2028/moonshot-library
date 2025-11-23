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
  
  // 扩展允许更新的字段，支持更多从Microsoft Graph获取的信息
  const allowedFields = ['name', 'grade', 'avatar_color', 'membership', 'email'];
  const fields: string[] = [];
  const values: any[] = [];
  
  // 处理驼峰命名到下划线命名的转换
  const fieldMappings: Record<string, string> = {
    avatarColor: 'avatar_color',
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  };

  Object.entries(updates).forEach(([key, value]) => {
    // 获取数据库字段名
    const dbField = fieldMappings[key] || key;
    
    if (allowedFields.includes(dbField) && value !== undefined) {
      fields.push(`${dbField} = ?`);
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

// 生成随机密码辅助函数
const generateRandomPassword = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// 从Microsoft Graph创建或更新用户
export const createUserFromMicrosoft = async (microsoftData: {
  id: string;
  email: string;
  name: string;
  role?: 'student' | 'teacher' | 'librarian';
  grade?: string;
}): Promise<User> => {
  // 首先检查用户是否已存在
  const existingUser = await getUserByEmail(microsoftData.email);
  if (existingUser) {
    // 如果用户存在，更新信息
    return updateUser(existingUser.id, {
      name: microsoftData.name,
      ...(microsoftData.grade && { grade: microsoftData.grade })
    });
  }
  
  // 创建新用户（为M365用户生成随机密码）
  return createUser({
    id: microsoftData.id,
    email: microsoftData.email,
    password: generateRandomPassword(),
    name: microsoftData.name,
    role: microsoftData.role || 'student',
    grade: microsoftData.grade
  });
};