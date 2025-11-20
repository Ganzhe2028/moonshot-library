import { getDatabase } from '../models/database';
import { createUser, getUserByEmail } from '../models/user';
import { createBook } from '../models/book';
import { moonshotBooks } from './moonshotBooks';

const demoAccounts: Array<{
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'student' | 'teacher' | 'librarian';
}> = [
  {
    id: 'demo-student',
    email: 'student@example.com',
    password: 'password123',
    name: 'Demo Student',
    role: 'student'
  },
  {
    id: 'demo-teacher',
    email: 'teacher@example.com',
    password: 'password123',
    name: 'Demo Teacher',
    role: 'teacher'
  },
  {
    id: 'demo-librarian',
    email: 'librarian@example.com',
    password: 'password123',
    name: 'Demo Librarian',
    role: 'librarian'
  }
];

export const ensureDemoAccounts = async (): Promise<void> => {
  console.log('👥 Ensuring demo accounts exist...');

  for (const account of demoAccounts) {
    const existing = await getUserByEmail(account.email);
    if (!existing) {
      await createUser(account);
      console.log(`   • Created demo account: ${account.email}`);
    } else {
      console.log(`   • Demo account already exists: ${account.email}`);
    }
  }
};

export const seedDatabase = async (): Promise<void> => {
  console.log('🌱 Starting database seeding...');
  
  try {
    // 检查是否已有数据
    const db = getDatabase();
    const userCount = await new Promise<number>((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM users', [], (err, row: any) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });

    if (userCount === 0) {
      console.log('📊 Database empty, creating initial data set...');

      // 创建默认用户
      console.log('👥 Creating default users...');
      
      // 管理员用户
      await createUser({
        id: 'admin-001',
        email: 'admin@moonshotacademy.cn',
        password: 'admin123',
        name: '系统管理员',
        role: 'librarian'
      });
  
      // 教师用户
      await createUser({
        id: 'teacher-001',
        email: 'teacher@moonshotacademy.cn',
        password: 'teacher123',
        name: '张老师',
        role: 'teacher'
      });
  
      // 学生用户
      await createUser({
        id: 'stu-2048',
        email: 'nova.li@moonshotacademy.cn',
        password: 'student123',
        name: 'Nova Li',
        role: 'student',
        grade: 'Moonshot Cohort 2025'
      });
  
      await createUser({
        id: 'stu-2049',
        email: 'alex.wang@moonshotacademy.cn',
        password: 'student123',
        name: 'Alex Wang',
        role: 'student',
        grade: 'Moonshot Cohort 2025'
      });
  
      // 创建图书数据
      console.log('📚 Creating sample books...');
      
      const sampleBooks = [
        {
          id: 'bk-systems-thinking',
          title: 'Systems Thinking',
          authors: ['Jamshid Gharajedaghi'],
          isbn: '978-1-118-11928-8',
          publisher: 'Wiley',
          publishedYear: 2011,
          category: 'Systems Science',
          description: 'A comprehensive guide to systems thinking methodology and its applications in complex problem solving.',
          totalCopies: 3,
          location: 'A-01-03',
          tags: ['systems', 'complexity', 'methodology']
        },
        {
          id: 'bk-ai-literacy',
          title: 'Artificial Intelligence: A Guide for Thinking Humans',
          authors: ['Melanie Mitchell'],
          isbn: '978-0-374-25783-5',
          publisher: 'Farrar, Straus and Giroux',
          publishedYear: 2019,
          category: 'Artificial Intelligence',
          description: 'An accessible introduction to AI that separates hype from reality.',
          totalCopies: 5,
          location: 'B-02-01',
          tags: ['AI', 'machine learning', 'technology']
        },
        {
          id: 'bk-design-thinking',
          title: 'Change by Design',
          authors: ['Tim Brown'],
          isbn: '978-0-06-176608-4',
          publisher: 'HarperBusiness',
          publishedYear: 2009,
          category: 'Design',
          description: 'How design thinking transforms organizations and inspires innovation.',
          totalCopies: 4,
          location: 'C-01-02',
          tags: ['design thinking', 'innovation', 'creativity']
        },
        {
          id: 'bk-lean-startup',
          title: 'The Lean Startup',
          authors: ['Eric Ries'],
          isbn: '978-0-307-88789-4',
          publisher: 'Crown Business',
          publishedYear: 2011,
          category: 'Business',
          description: 'How today\'s entrepreneurs use continuous innovation to create radically successful businesses.',
          totalCopies: 6,
          location: 'D-03-01',
          tags: ['startup', 'entrepreneurship', 'innovation']
        },
        {
          id: 'bk-thinking-fast-slow',
          title: 'Thinking, Fast and Slow',
          authors: ['Daniel Kahneman'],
          isbn: '978-0-374-27563-1',
          publisher: 'Farrar, Straus and Giroux',
          publishedYear: 2011,
          category: 'Psychology',
          description: 'A groundbreaking tour of the mind and explains the two systems that drive the way we think.',
          totalCopies: 4,
          location: 'E-02-03',
          tags: ['psychology', 'decision making', 'cognitive science']
        },
        {
          id: 'bk-innovators-dilemma',
          title: "The Innovator's Dilemma",
          authors: ['Clayton M. Christensen'],
          isbn: '978-0-06-206024-2',
          publisher: 'HarperBusiness',
          publishedYear: 1997,
          category: 'Business',
          description: 'When New Technologies Cause Great Firms to Fail.',
          totalCopies: 3,
          location: 'D-01-02',
          tags: ['innovation', 'disruption', 'technology']
        },
        {
          id: 'bk-sapiens',
          title: 'Sapiens: A Brief History of Humankind',
          authors: ['Yuval Noah Harari'],
          isbn: '978-0-06-231609-7',
          publisher: 'Harper',
          publishedYear: 2015,
          category: 'History',
          description: 'A brief history of humankind from the Stone Age to the present.',
          totalCopies: 5,
          location: 'F-01-01',
          tags: ['history', 'anthropology', 'evolution']
        },
        {
          id: 'bk-clean-code',
          title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
          authors: ['Robert C. Martin'],
          isbn: '978-0-13-235088-4',
          publisher: 'Prentice Hall',
          publishedYear: 2008,
          category: 'Programming',
          description: 'A handbook of agile software craftsmanship.',
          totalCopies: 8,
          location: 'G-02-01',
          tags: ['programming', 'software development', 'best practices']
        }
      ];

      const allBooks = [...sampleBooks, ...moonshotBooks];

      for (const bookData of allBooks) {
        await createBook(bookData);
      }

      console.log('✅ Base data created');
    } else {
      console.log('📊 Database already contains data, skipping base dataset');
    }

    await ensureDemoAccounts();

    console.log('✅ Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};
