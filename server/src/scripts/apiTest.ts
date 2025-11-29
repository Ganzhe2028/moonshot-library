import axios, { AxiosError, AxiosResponse } from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  response?: Record<string, unknown>;
  error?: Record<string, unknown>;
}

class APITester {
  private token: string = '';
  private refreshToken: string = '';
  private testResults: TestResult[] = [];

  private async makeRequest(method: string, endpoint: string, data?: any, auth: boolean = true) {
    const config: any = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (auth && this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    if (data) {
      config.data = data;
    }

    try {
      const response: AxiosResponse = await axios(config);
      return { success: true, data: response.data };
    } catch (error) {
      const axiosError = error as AxiosError;
      return {
        success: false,
        error: axiosError.response?.data || axiosError.message,
        status: axiosError.response?.status
      };
    }
  }

  private addTestResult(name: string, passed: boolean, message: string, response?: any, error?: any) {
    this.testResults.push({
      name,
      passed,
      message,
      response,
      error
    });
  }

  // 移除sanitizeData方法，直接使用Record<string, unknown>类型

  async runTests() {
    console.log('🚀 Starting API Tests...\n');

    // 1. 测试用户注册
    await this.testUserRegistration();

    // 2. 测试用户登录
    await this.testUserLogin();

    // 3. 测试图书管理
    await this.testBookManagement();

    // 4. 测试借阅管理
    await this.testBorrowingManagement();

    // 5. 测试认证功能
    await this.testAuthentication();

    // 6. 测试错误处理
    await this.testErrorHandling();

    // 显示测试结果
    this.displayResults();
  }

  private async testUserRegistration() {
    console.log('👤 Testing User Registration...');

    const testUser = {
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'testpassword123',
      name: 'Test User',
      role: 'student'
    };

    const result = await this.makeRequest('POST', '/auth/register', testUser, false);

    if (result.success && result.data && result.data.success) {
      this.addTestResult('User Registration', true, 'Registration successful', result.data);
      // 安全地设置token
      if (result.data.data && result.data.data.token) {
        this.token = result.data.data.token;
        this.refreshToken = result.data.data.refreshToken || '';
      }
    } else {
      this.addTestResult('User Registration', false, 'Registration failed', result.data, result.error);
    }
  }

  private async testUserLogin() {
    console.log('🔐 Testing User Login...');

    const loginData = {
      username: 'admin',
      password: 'admin123'
    };

    const result = await this.makeRequest('POST', '/auth/login', loginData, false);

    if (result.success && result.data && result.data.success) {
      this.addTestResult('User Login', true, 'Login successful', result.data);
      // 确保data对象和token存在
      if (result.data.data && result.data.data.token) {
        this.token = result.data.data.token;
        this.refreshToken = result.data.data.refreshToken || '';
      }
    } else {
      this.addTestResult('User Login', false, 'Login failed', result.data, result.error);
    }
  }

  private async testBookManagement() {
    console.log('📚 Testing Book Management...');

    // 测试获取图书列表
    const listResult = await this.makeRequest('GET', '/books?limit=5');
    this.addTestResult(
      'Get Books List',
      listResult.success && listResult.data && listResult.data.success,
      listResult.success ? 'Books list retrieved' : 'Failed to get books list',
      listResult.data,
      listResult.error
    );

    // 测试创建图书（需要管理员权限）
    const newBook = {
      title: 'Test Book',
      authors: ['Test Author'],
      category: 'Test Category',
      totalCopies: 5,
      description: 'A test book for API testing'
    };

    const createResult = await this.makeRequest('POST', '/books', newBook);
    this.addTestResult(
      'Create Book',
      createResult.success && createResult.data.success,
      createResult.success ? 'Book created successfully' : 'Failed to create book',
      createResult.data,
      createResult.error
    );

    if (createResult.success && createResult.data.success) {
      const bookId = String(createResult.data.data.book.id);

      // 测试获取图书详情
      const detailResult = await this.makeRequest('GET', `/books/${bookId}`);
      this.addTestResult(
        'Get Book Detail',
        detailResult.success && detailResult.data.success,
        detailResult.success ? 'Book detail retrieved' : 'Failed to get book detail',
        detailResult.data,
        detailResult.error
      );

      // 测试更新图书
      const updateData = { title: 'Updated Test Book' };
      const updateResult = await this.makeRequest('PUT', `/books/${bookId}`, updateData);
      this.addTestResult(
        'Update Book',
        updateResult.success && updateResult.data.success,
        updateResult.success ? 'Book updated successfully' : 'Failed to update book',
        updateResult.data,
        updateResult.error
      );

      // 测试删除图书
      const deleteResult = await this.makeRequest('DELETE', `/books/${bookId}`);
      this.addTestResult(
        'Delete Book',
        deleteResult.success && deleteResult.data.success,
        deleteResult.success ? 'Book deleted successfully' : 'Failed to delete book',
        deleteResult.data,
        deleteResult.error
      );
    }
  }

  private async testBorrowingManagement() {
    console.log('📖 Testing Borrowing Management...');

    // 首先创建一本图书用于借阅测试
    const testBook = {
      title: 'Borrowing Test Book',
      authors: ['Test Author'],
      category: 'Test Category',
      totalCopies: 5,
      description: 'A test book for borrowing API testing'
    };

    const createBookResult = await this.makeRequest('POST', '/books', testBook);

    if (createBookResult.success && createBookResult.data.success) {
      const bookId = String(createBookResult.data.data.book.id);

      // 创建借阅记录
      // 从当前登录用户中获取ID，避免硬编码
      const userId = 'admin'; // 使用用户名作为userId
      const borrowingData = {
        bookId,
        userId
      };

      const createBorrowingResult = await this.makeRequest('POST', '/borrowings', borrowingData);
      this.addTestResult(
        'Create Borrowing',
        createBorrowingResult.success && createBorrowingResult.data.success,
        createBorrowingResult.success ? 'Borrowing created successfully' : 'Failed to create borrowing',
        createBorrowingResult.data,
        createBorrowingResult.error
      );

      if (createBorrowingResult.success && createBorrowingResult.data.success) {
        const borrowingId = String(createBorrowingResult.data.data.borrowingRecord.id);

        // 获取借阅记录
        const getBorrowingResult = await this.makeRequest('GET', `/borrowings/${borrowingId}`);
        this.addTestResult(
          'Get Borrowing Record',
          getBorrowingResult.success && getBorrowingResult.data.success,
          getBorrowingResult.success ? 'Borrowing record retrieved' : 'Failed to get borrowing record',
          getBorrowingResult.data,
          getBorrowingResult.error
        );

        // 续借图书
        const renewResult = await this.makeRequest('PUT', `/borrowings/${borrowingId}/renew`);
        this.addTestResult(
          'Renew Borrowing',
          renewResult.success && renewResult.data.success,
          renewResult.success ? 'Book renewed successfully' : 'Failed to renew book',
          renewResult.data,
          renewResult.error
        );

        // 归还图书
        const returnResult = await this.makeRequest('PUT', `/borrowings/${borrowingId}/return`);
        this.addTestResult(
          'Return Book',
          returnResult.success && returnResult.data.success,
          returnResult.success ? 'Book returned successfully' : 'Failed to return book',
          returnResult.data,
          returnResult.error
        );
      }

      // 清理：删除测试图书
      await this.makeRequest('DELETE', `/books/${bookId}`);
    }
  }

  private async testAuthentication() {
    console.log('🔑 Testing Authentication...');

    // 测试无认证访问
    const noAuthResult = await this.makeRequest('GET', '/books', undefined, false);
    this.addTestResult(
      'No Authentication Access',
      noAuthResult.success,
      noAuthResult.success ? 'Public access allowed' : 'Public access restricted',
      noAuthResult.data,
      noAuthResult.error
    );

    // 保存当前token以便后续恢复
    const originalToken = this.token;

    // 测试无效 Token - 使用一个肯定无效的token
    this.token = `invalid_token_${Date.now()}`;
    const invalidAuthResult = await this.makeRequest('GET', '/books', undefined, true);
    this.addTestResult(
      'Invalid Token',
      !invalidAuthResult.success,
      !invalidAuthResult.success ? 'Invalid token rejected' : 'Invalid token accepted',
      invalidAuthResult.data,
      invalidAuthResult.error
    );

    // 恢复原始token
    this.token = originalToken;

    // 测试 Token 刷新
    if (this.refreshToken) {
      const refreshData = { refreshToken: this.refreshToken };
      const refreshResult = await this.makeRequest('POST', '/auth/refresh', refreshData, false);
      this.addTestResult(
        'Token Refresh',
        refreshResult.success && refreshResult.data && refreshResult.data.success,
        refreshResult.success ? 'Token refreshed successfully' : 'Failed to refresh token',
        refreshResult.data,
        refreshResult.error
      );
    }
  }

  private async testErrorHandling() {
    console.log('⚠️ Testing Error Handling...');

    // 测试无效图书ID
    const invalidBookResult = await this.makeRequest('GET', '/books/invalid-id');
    this.addTestResult(
      'Invalid Book ID',
      !invalidBookResult.success,
      !invalidBookResult.success ? 'Invalid ID handled correctly' : 'Invalid ID not handled',
      invalidBookResult.data,
      invalidBookResult.error
    );

    // 测试无效借阅记录ID
    const invalidBorrowingResult = await this.makeRequest('GET', '/borrowings/invalid-id');
    this.addTestResult(
      'Invalid Borrowing ID',
      !invalidBorrowingResult.success,
      !invalidBorrowingResult.success ? 'Invalid ID handled correctly' : 'Invalid ID not handled',
      invalidBorrowingResult.data,
      invalidBorrowingResult.error
    );

    // 测试验证错误
    const invalidBookData = {
      title: '', // 空标题应该失败
      authors: [], // 空作者数组应该失败
      category: '', // 空分类应该失败
      totalCopies: 0 // 0副本应该失败
    };

    const validationResult = await this.makeRequest('POST', '/books', invalidBookData);
    this.addTestResult(
      'Validation Error',
      !validationResult.success,
      !validationResult.success ? 'Validation errors handled correctly' : 'Validation errors not handled',
      validationResult.data,
      validationResult.error
    );
  }

  private displayResults() {
    console.log('\n📊 Test Results Summary:');
    console.log('='.repeat(50));

    const passed = this.testResults.filter((r) => r.passed).length;
    const failed = this.testResults.filter((r) => !r.passed).length;
    const total = this.testResults.length;

    this.testResults.forEach((result, index) => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${index + 1}. ${result.name}: ${status}`);
      if (!result.passed) {
        console.log(`   Error: ${result.message}`);
        if (result.error) {
          console.log(`   Details: ${JSON.stringify(result.error, null, 2)}`);
        }
      }
    });

    console.log(`\n${'='.repeat(50)}`);
    console.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

    if (failed > 0) {
      console.log('\n⚠️  Some tests failed. Please check the server logs and fix the issues.');
      process.exit(1);
    } else {
      console.log('\n🎉 All tests passed! The API is working correctly.');
      process.exit(0);
    }
  }
}

// 运行测试
if (require.main === module) {
  const tester = new APITester();
  tester.runTests().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

export default APITester;
