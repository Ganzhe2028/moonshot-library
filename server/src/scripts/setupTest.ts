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

    // Note: Test users are no longer created here. Use demoAccounts from seedData.ts instead.
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