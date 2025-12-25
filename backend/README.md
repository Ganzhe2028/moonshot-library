# Moonshot Library Server

Backend server for the Moonshot Library System - a modern campus library management system built with Express.js, TypeScript, and SQLite.

## Features

- 🔐 **User Authentication & Authorization** - JWT-based authentication with role-based access control
- 📚 **Book Management** - Complete CRUD operations for books with search and filtering
- 📖 **Borrowing System** - Manage book borrowings, returns, and renewals
- 👥 **User Management** - Multi-role user system (admin, librarian, teacher, student)
- 🛡️ **Security** - Rate limiting, input validation, CORS, and security headers
- 📊 **Database** - SQLite with proper indexing and relationships
- 🧪 **Testing** - Comprehensive API testing suite
- 📖 **Documentation** - Complete API documentation

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: SQLite3
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: express-validator
- **Security**: helmet, cors, express-rate-limit
- **Logging**: morgan

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the backend directory:
   ```bash
   cd backend
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` file with your configuration.

5. Initialize the database:
   ```bash
   npm run init-db
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_SECRET=your-refresh-token-secret-here
REFRESH_TOKEN_EXPIRES_IN=7d
SESSION_SECRET=your-session-secret-here

# Database
DB_PATH=./database/library.db

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
ALLOWED_DOMAINS=your-domain.com,api.your-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=5000
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX=20

# Borrowing Rules
BORROWING_PERIOD_DAYS=21
RENEWAL_PERIOD_DAYS=14
MAX_RENEWALS=2

# File Upload Limits
MAX_FILE_SIZE=5242880
```

## API Documentation

Complete API documentation is available in [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).

### Main Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - User logout

#### Books
- `GET /api/books` - Get books list with pagination and filtering
- `GET /api/books/:id` - Get book details
- `POST /api/books` - Create new book (admin/librarian only)
- `PUT /api/books/:id` - Update book (admin/librarian only)
- `DELETE /api/books/:id` - Delete book (admin/librarian only)
- `GET /api/books/categories` - Get book categories

#### Borrowings
- `GET /api/borrowings` - Get borrowing records
- `GET /api/borrowings/:id` - Get borrowing record details
- `POST /api/borrowings` - Create borrowing record
- `PUT /api/borrowings/:id/return` - Return book
- `PUT /api/borrowings/:id/renew` - Renew borrowing
- `GET /api/borrowings/overdue` - Check overdue books (admin/librarian only)

## User Roles

- **Admin**: Full system access
- **Librarian**: Book and borrowing management
- **Teacher**: Book browsing and borrowing
- **Student**: Book browsing and borrowing

## Testing

### Setup Test Environment
```bash
npm run setup-test
```

### Run API Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

## Database Schema

The system uses SQLite with a well-structured relational database. Below are the main tables with their detailed schemas and relationships, reflecting the actual implementation:

### users Table
Stores user account information and authentication data
- `id`: TEXT PRIMARY KEY - Unique user identifier (UUID format)
- `email`: TEXT NOT NULL UNIQUE - User email address (used for login)
- `password`: TEXT NOT NULL - Hashed user password (bcrypt)
- `name`: TEXT NOT NULL - User's full name
- `role`: TEXT CHECK(role IN ('student', 'teacher', 'librarian')) NOT NULL DEFAULT 'student' - User role
- `grade`: TEXT - User grade level (for students)
- `membership`: TEXT CHECK(membership IN ('active', 'suspended')) NOT NULL DEFAULT 'active' - Account status
- `avatar_color`: TEXT - Color code for user avatar
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP - Account creation time
- `updated_at`: DATETIME DEFAULT CURRENT_TIMESTAMP - Last account update time

### books Table
Contains the complete book catalog information
- `id`: TEXT PRIMARY KEY - Unique book identifier (UUID format)
- `title`: TEXT NOT NULL - Book title
- `authors`: TEXT NOT NULL - Book authors (stored as JSON array)
- `isbn`: TEXT - International Standard Book Number
- `publisher`: TEXT - Publisher name
- `published_year`: INTEGER - Year of publication
- `category`: TEXT NOT NULL - Book category/genre
- `description`: TEXT - Book description/summary
- `cover_image`: TEXT - URL or path to cover image
- `total_copies`: INTEGER NOT NULL DEFAULT 1 - Total number of copies
- `available_copies`: INTEGER NOT NULL DEFAULT 1 - Number of available copies
- `status`: TEXT CHECK(status IN ('available', 'borrowed', 'reserved', 'maintenance')) NOT NULL DEFAULT 'available' - Current status
- `location`: TEXT - Physical location in library
- `tags`: TEXT - Book tags (stored as JSON array)
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP - Record creation time
- `updated_at`: DATETIME DEFAULT CURRENT_TIMESTAMP - Last update time

### borrowing_records Table
Tracks all book borrowing activities
- `id`: TEXT PRIMARY KEY - Unique borrowing record ID (UUID format)
- `user_id`: TEXT NOT NULL - Foreign key referencing users.id
- `book_id`: TEXT NOT NULL - Foreign key referencing books.id
- `borrow_date`: DATE NOT NULL - Date when book was borrowed
- `due_date`: DATE NOT NULL - Date when book is due to be returned
- `return_date`: DATE - Actual return date (NULL if still borrowed)
- `status`: TEXT CHECK(status IN ('active', 'returned', 'overdue')) NOT NULL DEFAULT 'active' - Current status
- `renewals`: INTEGER NOT NULL DEFAULT 0 - Number of times renewed
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP - Record creation time
- `updated_at`: DATETIME DEFAULT CURRENT_TIMESTAMP - Last update time
- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
- FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE

### reservations Table
Manages book reservation requests
- `id`: TEXT PRIMARY KEY - Unique reservation ID (UUID format)
- `user_id`: TEXT NOT NULL - Foreign key referencing users.id
- `book_id`: TEXT NOT NULL - Foreign key referencing books.id
- `reservation_date`: DATE NOT NULL - When reservation was made
- `expiry_date`: DATE NOT NULL - When reservation expires
- `status`: TEXT CHECK(status IN ('active', 'fulfilled', 'cancelled', 'expired')) NOT NULL DEFAULT 'active' - Current status
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP - Record creation time
- `updated_at`: DATETIME DEFAULT CURRENT_TIMESTAMP - Last update time
- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
- FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE

### Database Relationships
- **One-to-Many**: A user can have multiple borrowing records and reservations
- **One-to-Many**: A book can be borrowed multiple times and have multiple reservations
- **Many-to-One**: Each borrowing record and reservation belongs to exactly one user and one book
- **Cascade Deletion**: When a user or book is deleted, related borrowing records and reservations are automatically deleted

### Database Optimization
- **UUID Primary Keys**: All tables use TEXT UUIDs for primary keys instead of auto-incrementing integers
- **Indexes**: Comprehensive indexing on frequently queried fields:
  - users(email)
  - books(category, status)
  - borrowing_records(user_id, book_id, status)
  - reservations(user_id, book_id, status)
- **Check Constraints**: Field-level validation using CHECK constraints
- **Default Values**: Sensible defaults for timestamps and counts
- **Triggers**: Automatic timestamp updates via database triggers
- **Foreign Key Constraints**: Enforced referential integrity with cascade deletion options
- **Date Types**: Uses appropriate DATE vs DATETIME types for different temporal fields

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run init-db` - Initialize database
- `npm run setup-test` - Setup test environment
- `npm test` - Run API tests
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

### Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files (including Swagger)
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── scripts/         # Utility scripts
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   └── server.ts        # Main server file
├── database/            # Database initialization and migrations
├── docs/                # Documentation files
│   └── swagger.json     # Swagger API specification
├── .env.example         # Environment variables template
├── .eslintrc.js         # ESLint configuration
├── API_DOCUMENTATION.md # API architecture overview
├── package.json         # Project dependencies
├── tsconfig.json        # TypeScript configuration
└── README.md            # Project documentation
```

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for password security
- **Rate Limiting**: Prevents abuse and DoS attacks
- **Input Validation**: Comprehensive request validation
- **CORS Protection**: Configured for frontend integration
- **Security Headers**: Helmet.js for additional security
- **SQL Injection Prevention**: Parameterized queries

## Performance Features

- **Database Indexing**: Optimized queries with proper indexes
- **Pagination**: Efficient data loading for large datasets
- **Connection Pooling**: SQLite with connection management
- **Response Caching**: Appropriate cache headers

## Deployment

### Production Build
```bash
npm run build
npm start
```

### Docker Deployment (Optional)
Create a `Dockerfile`:

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

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Run the test suite
6. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue in the repository
- Check existing documentation
- Review test cases for usage examples

## Changelog

### v1.0.0
- Initial release
- Complete authentication system
- Book management functionality
- Borrowing system
- API documentation
- Comprehensive testing suite
