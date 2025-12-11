export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'student' | 'teacher' | 'librarian';
  grade?: string;
  membership: 'active' | 'suspended';
  avatarColor?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Book {
  id: string;
  title: string;
  titleEn?: string;
  authors: string[];
  authorsEn?: string[];
  isbn?: string;
  publisher?: string;
  publisherEn?: string;
  publishedYear?: number;
  category: string;
  categoryEn?: string;
  description?: string;
  descriptionEn?: string;
  coverImage?: string;
  totalCopies: number;
  availableCopies: number;
  status: 'available' | 'borrowed' | 'reserved' | 'maintenance';
  location?: string;
  tags: string[];
  tagsEn?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BorrowingRecord {
  id: string;
  userId: string;
  bookId: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'active' | 'returned' | 'overdue';
  renewals: number;
  createdAt: string;
  updatedAt: string;
}

export interface Reservation {
  id: string;
  userId: string;
  bookId: string;
  reservationDate: string;
  expiryDate: string;
  status: 'active' | 'fulfilled' | 'cancelled' | 'expired';
  createdAt: string;
  updatedAt: string;
}

export interface Favorite {
  id: string;
  userId: string;
  bookId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Credit {
  id: string;
  userId: string;
  score: number;
  level: 'excellent' | 'good' | 'warn' | 'suspended';
  status: 'active' | 'restricted' | 'suspended';
  remarks?: string;
  createdAt: string;
  updatedAt: string;
  lastRecoveredAt?: string;
}

import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'student' | 'teacher' | 'librarian';
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role: 'student' | 'teacher' | 'librarian';
  grade?: string;
}

export interface BookRequest {
  title: string;
  titleEn?: string;
  authors: string[];
  authorsEn?: string[];
  isbn?: string;
  publisher?: string;
  publisherEn?: string;
  publishedYear?: number;
  category: string;
  categoryEn?: string;
  description?: string;
  descriptionEn?: string;
  coverImage?: string;
  totalCopies: number;
  availableCopies?: number;
  status?: 'available' | 'borrowed' | 'reserved' | 'maintenance';
  location?: string;
  tags?: string[];
  tagsEn?: string[];
}

export interface BorrowRequest {
  bookId: string;
}

export interface ReturnRequest {
  borrowingId: string;
}

export interface RenewRequest {
  borrowingId: string;
}

export interface BorrowingRequest {
  bookId: string;
  userId?: string;
  dueDate?: string;
}
