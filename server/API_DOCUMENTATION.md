# Moonshot Library System API Documentation

## 概述

Moonshot Library System 是一个现代化的校园图书馆管理系统，提供完整的图书借阅、用户管理和权限控制功能。

## 基础信息

- **Base URL**: `http://localhost:3000/api`
- **认证方式**: JWT Bearer Token
- **数据格式**: JSON
- **字符编码**: UTF-8

## 认证

所有需要认证的 API 请求都需要在请求头中包含 JWT Token：

```
Authorization: Bearer <your_jwt_token>
```

## 错误响应格式

```json
{
  "success": false,
  "message": "错误信息",
  "errors": ["可选的详细错误列表"]
}
```

## API 端点

### 认证相关

#### 用户注册
```http
POST /api/auth/register
```

**请求体**:
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "name": "string",
  "role": "admin|librarian|teacher|student"
}
```

**响应**:
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "string",
      "username": "string",
      "email": "string",
      "name": "string",
      "role": "string",
      "createdAt": "string"
    },
    "token": "string",
    "refreshToken": "string"
  }
}
```

#### 用户登录
```http
POST /api/auth/login
```

**请求体**:
```json
{
  "username": "string",
  "password": "string"
}
```

**响应**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "string",
      "username": "string",
      "email": "string",
      "name": "string",
      "role": "string"
    },
    "token": "string",
    "refreshToken": "string"
  }
}
```

#### 刷新 Token
```http
POST /api/auth/refresh
```

**请求体**:
```json
{
  "refreshToken": "string"
}
```

**响应**:
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "token": "string",
    "refreshToken": "string"
  }
}
```

#### 用户登出
```http
POST /api/auth/logout
```

**请求头**:
```
Authorization: Bearer <token>
```

**响应**:
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### 图书管理

#### 获取图书列表
```http
GET /api/books?limit=50&offset=0&category=string&search=string
```

**查询参数**:
- `limit` (可选): 每页数量 (1-100, 默认 50)
- `offset` (可选): 偏移量 (默认 0)
- `category` (可选): 图书分类
- `search` (可选): 搜索关键词

**响应**:
```json
{
  "success": true,
  "message": "Books retrieved successfully",
  "data": {
    "books": [
      {
        "id": "string",
        "title": "string",
        "authors": ["string"],
        "isbn": "string",
        "publisher": "string",
        "publishedYear": 2023,
        "category": "string",
        "description": "string",
        "totalCopies": 5,
        "availableCopies": 3,
        "location": "string",
        "tags": ["string"],
        "createdAt": "string",
        "updatedAt": "string"
      }
    ],
    "pagination": {
      "limit": 50,
      "offset": 0,
      "total": 100
    }
  }
}
```

#### 获取图书详情
```http
GET /api/books/{id}
```

**响应**:
```json
{
  "success": true,
  "message": "Book retrieved successfully",
  "data": {
    "book": {
      "id": "string",
      "title": "string",
      "authors": ["string"],
      "isbn": "string",
      "publisher": "string",
      "publishedYear": 2023,
      "category": "string",
      "description": "string",
      "totalCopies": 5,
      "availableCopies": 3,
      "location": "string",
      "tags": ["string"],
      "createdAt": "string",
      "updatedAt": "string"
    }
  }
}
```

#### 创建图书
```http
POST /api/books
```

**请求头**:
```
Authorization: Bearer <token>
```

**请求体**:
```json
{
  "title": "string",
  "authors": ["string"],
  "isbn": "string",
  "publisher": "string",
  "publishedYear": 2023,
  "category": "string",
  "description": "string",
  "totalCopies": 5,
  "location": "string",
  "tags": ["string"]
}
```

**响应**:
```json
{
  "success": true,
  "message": "Book created successfully",
  "data": {
    "book": {
      "id": "string",
      "title": "string",
      "authors": ["string"],
      "isbn": "string",
      "publisher": "string",
      "publishedYear": 2023,
      "category": "string",
      "description": "string",
      "totalCopies": 5,
      "availableCopies": 5,
      "location": "string",
      "tags": ["string"],
      "createdAt": "string",
      "updatedAt": "string"
    }
  }
}
```

#### 更新图书
```http
PUT /api/books/{id}
```

**请求头**:
```
Authorization: Bearer <token>
```

**请求体**: 同创建图书，所有字段可选

**响应**: 同创建图书响应

#### 删除图书
```http
DELETE /api/books/{id}
```

**请求头**:
```
Authorization: Bearer <token>
```

**响应**:
```json
{
  "success": true,
  "message": "Book deleted successfully"
}
```

#### 获取图书分类
```http
GET /api/books/categories
```

**响应**:
```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": {
    "categories": ["string"]
  }
}
```

### 借阅管理

#### 创建借阅记录
```http
POST /api/borrowings
```

**请求头**:
```
Authorization: Bearer <token>
```

**请求体**:
```json
{
  "bookId": "string",
  "userId": "string",
  "dueDate": "string" // 可选，默认21天后
}
```

**响应**:
```json
{
  "success": true,
  "message": "Book borrowed successfully",
  "data": {
    "borrowingRecord": {
      "id": "string",
      "bookId": "string",
      "userId": "string",
      "borrowDate": "string",
      "dueDate": "string",
      "status": "active",
      "renewalCount": 0
    }
  }
}
```

#### 归还图书
```http
PUT /api/borrowings/{id}/return
```

**请求头**:
```
Authorization: Bearer <token>
```

**响应**:
```json
{
  "success": true,
  "message": "Book returned successfully",
  "data": {
    "borrowingRecord": {
      "id": "string",
      "bookId": "string",
      "userId": "string",
      "borrowDate": "string",
      "dueDate": "string",
      "returnDate": "string",
      "status": "returned",
      "renewalCount": 0
    }
  }
}
```

#### 续借图书
```http
PUT /api/borrowings/{id}/renew
```

**请求头**:
```
Authorization: Bearer <token>
```

**响应**:
```json
{
  "success": true,
  "message": "Book renewed successfully",
  "data": {
    "borrowingRecord": {
      "id": "string",
      "bookId": "string",
      "userId": "string",
      "borrowDate": "string",
      "dueDate": "string",
      "status": "active",
      "renewalCount": 1
    }
  }
}
```

#### 获取借阅记录
```http
GET /api/borrowings?userId=string&bookId=string&status=active|returned|overdue&limit=50&offset=0
```

**请求头**:
```
Authorization: Bearer <token>
```

**查询参数**:
- `userId` (可选): 用户ID
- `bookId` (可选): 图书ID
- `status` (可选): 状态 (active/returned/overdue)
- `limit` (可选): 每页数量 (1-100, 默认 50)
- `offset` (可选): 偏移量 (默认 0)

**响应**:
```json
{
  "success": true,
  "message": "Borrowing records retrieved successfully",
  "data": {
    "records": [
      {
        "id": "string",
        "bookId": "string",
        "userId": "string",
        "borrowDate": "string",
        "dueDate": "string",
        "returnDate": "string",
        "status": "active|returned|overdue",
        "renewalCount": 0,
        "book": {
          "id": "string",
          "title": "string",
          "authors": ["string"]
        },
        "user": {
          "id": "string",
          "name": "string",
          "email": "string"
        }
      }
    ],
    "pagination": {
      "limit": 50,
      "offset": 0,
      "total": 100
    }
  }
}
```

#### 获取借阅记录详情
```http
GET /api/borrowings/{id}
```

**请求头**:
```
Authorization: Bearer <token>
```

**响应**: 同获取借阅记录响应中的单个记录格式

#### 检查逾期图书
```http
GET /api/borrowings/overdue
```

**请求头**:
```
Authorization: Bearer <token>
```

**响应**:
```json
{
  "success": true,
  "message": "Overdue check completed",
  "data": {
    "overdueCount": 5,
    "overdueRecords": [
      {
        "id": "string",
        "bookId": "string",
        "userId": "string",
        "borrowDate": "string",
        "dueDate": "string",
        "status": "overdue"
      }
    ]
  }
}
```

## 状态码说明

- **200 OK**: 请求成功
- **201 Created**: 资源创建成功
- **400 Bad Request**: 请求参数错误
- **401 Unauthorized**: 未认证或认证失败
- **403 Forbidden**: 权限不足
- **404 Not Found**: 资源不存在
- **409 Conflict**: 资源冲突
- **422 Unprocessable Entity**: 请求体验证失败
- **429 Too Many Requests**: 请求过于频繁
- **500 Internal Server Error**: 服务器内部错误

## 分页参数

支持分页的 API 端点：
- `limit`: 每页返回的记录数 (1-100, 默认 50)
- `offset`: 偏移量 (默认 0)

## 限流说明

- 普通 API: 每 IP 每分钟最多 60 次请求
- 认证相关: 每 IP 每 15 分钟最多 5 次请求
- 通用限制: 每 IP 每 15 分钟最多 100 次请求

## 数据模型

### 用户 (User)
```typescript
interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: 'admin' | 'librarian' | 'teacher' | 'student';
  createdAt: string;
  updatedAt: string;
}
```

### 图书 (Book)
```typescript
interface Book {
  id: string;
  title: string;
  authors: string[];
  isbn?: string;
  publisher?: string;
  publishedYear?: number;
  category: string;
  description?: string;
  totalCopies: number;
  availableCopies: number;
  location?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}
```

### 借阅记录 (BorrowingRecord)
```typescript
interface BorrowingRecord {
  id: string;
  bookId: string;
  userId: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'active' | 'returned' | 'overdue';
  renewalCount: number;
  createdAt: string;
  updatedAt: string;
}
```