import { initDatabase } from '../models/database';
import { seedDatabase } from './seedData';

const init = async () => {
  try {
    console.log('🚀 Initializing database...');
    await initDatabase();
    console.log('✅ Database initialized successfully');

    console.log('🌱 Seeding initial data...');
    await seedDatabase();
    console.log('✅ Database seeding completed');

    console.log('🎉 Database setup completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  init();
}