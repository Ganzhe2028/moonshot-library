import { getDatabase, initDatabase } from '../models/database';
import { seedDatabase } from './seedData';

async function setupTestEnvironment() {
  console.log('🧪 Setting up test environment...');
  
  try {
    // 初始化数据库
    await initDatabase();
    console.log('✅ Database initialized');

    // 填充测试数据
    await seedDatabase();
    console.log('✅ Test data seeded');

    // 创建测试用户
    const db = getDatabase();
    
    // 创建管理员用户
    const bcrypt = require('bcryptjs');
    const adminPassword = await bcrypt.hash('admin123', 10);
    
    db.run(`
      INSERT OR REPLACE INTO users (id, username, email, password, name, role, created_at, updated_at)
      VALUES ('usr-admin', 'admin', 'admin@library.com', ?, 'Administrator', 'admin', datetime('now'), datetime('now'))
    `, [adminPassword]);

    // 创建图书管理员用户
    const librarianPassword = await bcrypt.hash('librarian123', 10);
    db.run(`
      INSERT OR REPLACE INTO users (id, username, email, password, name, role, created_at, updated_at)
      VALUES ('usr-librarian', 'librarian', 'librarian@library.com', ?, 'Librarian', 'librarian', datetime('now'), datetime('now'))
    `, [librarianPassword]);

    // 创建教师用户
    const teacherPassword = await bcrypt.hash('teacher123', 10);
    db.run(`
      INSERT OR REPLACE INTO users (id, username, email, password, name, role, created_at, updated_at)
      VALUES ('usr-teacher', 'teacher', 'teacher@school.com', ?, 'Teacher', 'teacher', datetime('now'), datetime('now'))
    `, [teacherPassword]);

    // 创建学生用户
    const studentPassword = await bcrypt.hash('student123', 10);
    db.run(`
      INSERT OR REPLACE INTO users (id, username, email, password, name, role, created_at, updated_at)
      VALUES ('usr-student', 'student', 'student@school.com', ?, 'Student', 'student', datetime('now'), datetime('now'))
    `, [studentPassword]);

    console.log('✅ Test users created');
    console.log('🎉 Test environment setup complete!');

  } catch (error) {
    console.error('❌ Failed to setup test environment:', error);
    throw error;
  }
}

if (require.main === module) {
  setupTestEnvironment()
    .then(() => {
      console.log('\n✅ Test environment is ready!');
      console.log('You can now run the API tests.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test environment setup failed:', error);
      process.exit(1);
    });
}

export { setupTestEnvironment };