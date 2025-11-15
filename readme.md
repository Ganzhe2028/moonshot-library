# Moonshot Library System

A modern campus library management system built with Express.js, TypeScript, and SQLite.

## 🚀 Features

- **User Management**: Multi-role system (Admin, Librarian, Teacher, Student)
- **Book Management**: Complete CRUD operations with search and filtering
- **Borrowing System**: Handle book loans, returns, and renewals
- **Authentication**: JWT-based secure authentication
- **Security**: Rate limiting, input validation, CORS protection
- **API Documentation**: Comprehensive API documentation
- **Testing Suite**: Automated API testing

## 📁 Project Structure

```
moonshot-library/
├── server/                 # Backend server
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── scripts/        # Utility scripts
│   │   ├── types/          # TypeScript definitions
│   │   └── utils/          # Utility functions
│   ├── data/              # Database files
│   └── README.md          # Server documentation
└── client/                # Frontend (if applicable)
```

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js (v16+)
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: SQLite3
- **Authentication**: JWT
- **Validation**: express-validator
- **Security**: helmet, cors, express-rate-limit

## 🚦 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### 1. Clone the Repository
```bash
git clone <repository-url>
cd moonshot-library
```

### 2. Setup Backend Server
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your configuration
npm run init-db
npm run dev
```

### 3. Setup Test Environment
```bash
npm run setup-test
npm test
```

## 📋 Available Scripts

### Server Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start           # Start production server
npm run init-db     # Initialize database
npm run setup-test  # Setup test environment
npm test            # Run API tests
npm run test:watch  # Run tests in watch mode
npm run lint        # Run ESLint
npm run lint:fix    # Fix ESLint issues
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the server directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_SECRET=your-refresh-token-secret-here
REFRESH_TOKEN_EXPIRES_IN=7d

# Database
DATABASE_PATH=./data/library.db

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Borrowing Rules
BORROWING_PERIOD_DAYS=21
RENEWAL_PERIOD_DAYS=14
MAX_RENEWALS=2

# File Upload Limits
MAX_FILE_SIZE=5242880
```

## 📚 API Documentation

Complete API documentation is available in [server/API_DOCUMENTATION.md](./server/API_DOCUMENTATION.md).

### Main API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - User logout

#### Books
- `GET /api/books` - Get books list with pagination
- `GET /api/books/:id` - Get book details
- `POST /api/books` - Create new book (admin/librarian)
- `PUT /api/books/:id` - Update book (admin/librarian)
- `DELETE /api/books/:id` - Delete book (admin/librarian)

#### Borrowings
- `GET /api/borrowings` - Get borrowing records
- `POST /api/borrowings` - Create borrowing record
- `PUT /api/borrowings/:id/return` - Return book
- `PUT /api/borrowings/:id/renew` - Renew borrowing

## 🔐 User Roles

- **Admin**: Full system access
- **Librarian**: Book and borrowing management
- **Teacher**: Book browsing and borrowing
- **Student**: Book browsing and borrowing

## 🧪 Testing

The project includes comprehensive API testing:

```bash
# Setup test environment with sample data
npm run setup-test

# Run all tests
npm test

# Run tests in watch mode during development
npm run test:watch
```

## 🛡️ Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for password security
- **Rate Limiting**: Prevents abuse and DoS attacks
- **Input Validation**: Comprehensive request validation
- **CORS Protection**: Configured for frontend integration
- **Security Headers**: Helmet.js for additional security
- **SQL Injection Prevention**: Parameterized queries

## 🚀 Deployment

### Production Build
```bash
cd server
npm install
npm run build
npm start
```

### Docker Deployment (Optional)
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new features
5. Run the test suite
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For issues and questions:
- Create an issue in the repository
- Check the [server documentation](./server/README.md)
- Review the [API documentation](./server/API_DOCUMENTATION.md)
- Check test cases for usage examples

## 📈 Changelog

### v1.0.0
- Initial release
- Complete authentication system
- Book management functionality
- Borrowing system
- API documentation
- Comprehensive testing suite

---

**Moonshot Library System** - Modernizing campus library management with technology.