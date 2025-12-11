import sqlite3 from 'sqlite3';
import { Database } from 'sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DB_PATH || './database/library.db';
const DB_DIR = path.dirname(DB_PATH);

// 确保数据库目录存在
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

let db: Database | null = null;

export const getDatabase = (): Database => {
  if (!db) {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        throw err;
      }
      console.log('📚 Connected to SQLite database');
    });

    // 启用外键约束
    db.run('PRAGMA foreign_keys = ON');
  }
  return db;
};

const ensureBookColumns = (database: Database): Promise<void> => {
  const requiredColumns = [
    { name: 'title_en', type: 'TEXT' },
    { name: 'category_en', type: 'TEXT' },
    { name: 'tags_en', type: 'TEXT' },
    { name: 'authors_en', type: 'TEXT' },
    { name: 'publisher_en', type: 'TEXT' },
    { name: 'description_en', type: 'TEXT' }
  ];

  return new Promise((resolve, reject) => {
    database.all('PRAGMA table_info(books);', [], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      const existing = new Set((rows || []).map((row: any) => row.name));
      const missing = requiredColumns.filter((col) => !existing.has(col.name));

      if (!missing.length) {
        resolve();
        return;
      }

      Promise.all(
        missing.map(
          (col) =>
            new Promise<void>((res, rej) => {
              database.run(`ALTER TABLE books ADD COLUMN ${col.name} ${col.type}`, (alterErr) => {
                if (alterErr && !String(alterErr.message || alterErr).includes('duplicate column name')) {
                  rej(alterErr);
                } else {
                  res();
                }
              });
            })
        )
      )
        .then(() => resolve())
        .catch(reject);
    });
  });
};

export const initDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const database = getDatabase();

    const createTablesSQL = `
      -- 用户表
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT CHECK(role IN ('student', 'teacher', 'librarian')) NOT NULL DEFAULT 'student',
        grade TEXT,
        membership TEXT CHECK(membership IN ('active', 'suspended')) NOT NULL DEFAULT 'active',
        avatar_color TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- 图书表
      CREATE TABLE IF NOT EXISTS books (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        title_en TEXT,
        authors TEXT NOT NULL, -- JSON array
        authors_en TEXT,
        isbn TEXT,
        publisher TEXT,
        publisher_en TEXT,
        published_year INTEGER,
        category TEXT NOT NULL,
        category_en TEXT,
        description TEXT,
        description_en TEXT,
        cover_image TEXT,
        total_copies INTEGER NOT NULL DEFAULT 1,
        available_copies INTEGER NOT NULL DEFAULT 1,
        status TEXT CHECK(status IN ('available', 'borrowed', 'reserved', 'maintenance')) NOT NULL DEFAULT 'available',
        location TEXT,
        tags TEXT, -- JSON array
        tags_en TEXT, -- JSON array
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- 借阅记录表
      CREATE TABLE IF NOT EXISTS borrowing_records (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        book_id TEXT NOT NULL,
        borrow_date DATE NOT NULL,
        due_date DATE NOT NULL,
        return_date DATE,
        status TEXT CHECK(status IN ('active', 'returned', 'overdue')) NOT NULL DEFAULT 'active',
        renewals INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
      );

      -- 预约记录表
      CREATE TABLE IF NOT EXISTS reservations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        book_id TEXT NOT NULL,
        reservation_date DATE NOT NULL,
        expiry_date DATE NOT NULL,
        status TEXT CHECK(status IN ('active', 'fulfilled', 'cancelled', 'expired')) NOT NULL DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
      );

      -- 收藏表
      CREATE TABLE IF NOT EXISTS favorites (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        book_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
        UNIQUE (user_id, book_id)
      );

      -- 用户信用表
      CREATE TABLE IF NOT EXISTS user_credit (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        score INTEGER NOT NULL DEFAULT 700,
        level TEXT NOT NULL DEFAULT 'good',
        status TEXT NOT NULL DEFAULT 'active',
        remarks TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      -- 创建索引
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);
      CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
      CREATE INDEX IF NOT EXISTS idx_borrowing_user_id ON borrowing_records(user_id);
      CREATE INDEX IF NOT EXISTS idx_borrowing_book_id ON borrowing_records(book_id);
      CREATE INDEX IF NOT EXISTS idx_borrowing_status ON borrowing_records(status);
      CREATE INDEX IF NOT EXISTS idx_reservation_user_id ON reservations(user_id);
      CREATE INDEX IF NOT EXISTS idx_reservation_book_id ON reservations(book_id);
      CREATE INDEX IF NOT EXISTS idx_reservation_status ON reservations(status);
      CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
      CREATE INDEX IF NOT EXISTS idx_favorites_book_id ON favorites(book_id);
      CREATE INDEX IF NOT EXISTS idx_user_credit_user_id ON user_credit(user_id);

      -- 创建触发器，自动更新 updated_at
      CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
      AFTER UPDATE ON users
      FOR EACH ROW
      BEGIN
        UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
      END;

      CREATE TRIGGER IF NOT EXISTS update_books_timestamp 
      AFTER UPDATE ON books
      FOR EACH ROW
      BEGIN
        UPDATE books SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
      END;

      CREATE TRIGGER IF NOT EXISTS update_borrowing_records_timestamp 
      AFTER UPDATE ON borrowing_records
      FOR EACH ROW
      BEGIN
        UPDATE borrowing_records SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
      END;

      CREATE TRIGGER IF NOT EXISTS update_reservations_timestamp 
      AFTER UPDATE ON reservations
      FOR EACH ROW
      BEGIN
        UPDATE reservations SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
      END;

      CREATE TRIGGER IF NOT EXISTS update_favorites_timestamp
      AFTER UPDATE ON favorites
      FOR EACH ROW
      BEGIN
        UPDATE favorites SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
      END;

      CREATE TRIGGER IF NOT EXISTS update_user_credit_timestamp
      AFTER UPDATE ON user_credit
      FOR EACH ROW
      BEGIN
        UPDATE user_credit SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
      END;
    `;

    database.exec(createTablesSQL, (err) => {
      if (err) {
        console.error('Error creating tables:', err);
        reject(err);
      } else {
        ensureBookColumns(database)
          .then(() => {
            console.log('✅ Database tables initialized successfully');
            resolve();
          })
          .catch((ensureError) => {
            console.error('Error ensuring book columns:', ensureError);
            reject(ensureError);
          });
      }
    });
  });
};

export const closeDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
          reject(err);
        } else {
          console.log('📚 Database connection closed');
          db = null;
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
};
