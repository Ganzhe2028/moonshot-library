import { getDatabase } from './database'
import { Book } from '../types'

export const createBook = async (bookData: {
  id: string
  title: string
  authors: string[]
  isbn?: string
  publisher?: string
  publishedYear?: number
  category: string
  description?: string
  coverImage?: string
  status?: 'available' | 'borrowed' | 'reserved' | 'maintenance'
  totalCopies: number
  availableCopies?: number
  location?: string
  tags?: string[]
}): Promise<Book> => {
  const db = getDatabase()
  const availableCopies = bookData.availableCopies ?? bookData.totalCopies
  const status = bookData.status ?? 'available'

  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO books (
        id, title, authors, isbn, publisher, published_year,
        category, description, cover_image, total_copies, available_copies, status,
        location, tags
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

    db.run(
      sql,
      [
        bookData.id,
        bookData.title,
        JSON.stringify(bookData.authors),
        bookData.isbn || null,
        bookData.publisher || null,
        bookData.publishedYear || null,
        bookData.category,
        bookData.description || null,
        bookData.coverImage || null,
        bookData.totalCopies,
        availableCopies,
        status,
        bookData.location || null,
        JSON.stringify(bookData.tags || []),
      ],
      async (err) => {
        if (err) {
          reject(err)
        } else {
          const book = await getBookById(bookData.id)
          if (book) {
            resolve(book)
          } else {
            reject(new Error('Failed to retrieve created book'))
          }
        }
      },
    )
  })
}

export const getBookById = async (id: string): Promise<Book | null> => {
  const db = getDatabase()

  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM books WHERE id = ?'
    db.get(sql, [id], (err, row) => {
      if (err) {
        reject(err)
      } else {
        resolve(row ? deserializeBook(row) : null)
      }
    })
  })
}

export const getAllBooks = async (
  limit: number = 50,
  offset: number = 0,
  category?: string,
  search?: string,
): Promise<Book[]> => {
  const db = getDatabase()

  return new Promise((resolve, reject) => {
    let sql = 'SELECT * FROM books WHERE 1=1'
    const params: any[] = []

    if (category) {
      sql += ' AND category = ?'
      params.push(category)
    }

    if (search) {
      sql += ' AND (title LIKE ? OR authors LIKE ? OR category LIKE ?)'
      const searchPattern = `%${search}%`
      params.push(searchPattern, searchPattern, searchPattern)
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)

    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err)
      } else {
        resolve(rows.map(deserializeBook))
      }
    })
  })
}

export const updateBook = async (id: string, updates: Partial<Book>): Promise<Book> => {
  const db = getDatabase()

  const allowedFields = [
    'title',
    'authors',
    'isbn',
    'publisher',
    'published_year',
    'category',
    'description',
    'cover_image',
    'total_copies',
    'available_copies',
    'status',
    'location',
    'tags',
  ]
  const fields: string[] = []
  const values: any[] = []

  Object.entries(updates).forEach(([key, value]) => {
    if (allowedFields.includes(key) && value !== undefined) {
      fields.push(`${key} = ?`)
      if (key === 'authors' || key === 'tags') {
        values.push(JSON.stringify(value))
      } else {
        values.push(value)
      }
    }
  })

  if (fields.length === 0) {
    throw new Error('No valid fields to update')
  }

  values.push(id)

  return new Promise((resolve, reject) => {
    const sql = `UPDATE books SET ${fields.join(', ')} WHERE id = ?`
    db.run(sql, values, async (err) => {
      if (err) {
        reject(err)
      } else {
        const book = await getBookById(id)
        if (book) {
          resolve(book)
        } else {
          reject(new Error('Failed to retrieve updated book'))
        }
      }
    })
  })
}

export const deleteBook = async (id: string): Promise<boolean> => {
  const db = getDatabase()

  return new Promise((resolve, reject) => {
    const sql = 'DELETE FROM books WHERE id = ?'
    db.run(sql, [id], function (err) {
      if (err) {
        reject(err)
      } else {
        resolve(this.changes > 0)
      }
    })
  })
}

export const updateBookAvailability = async (bookId: string, change: number): Promise<void> => {
  const db = getDatabase()
  const book = await getBookById(bookId)

  if (!book) {
    throw new Error('Book not found')
  }

  const nextAvailable = Math.max(0, Math.min(book.totalCopies, book.availableCopies + change))

  let nextStatus: Book['status']
  if (book.status === 'maintenance') {
    nextStatus = 'maintenance'
  } else if (book.status === 'reserved' && nextAvailable > 0) {
    nextStatus = 'reserved'
  } else if (nextAvailable < book.totalCopies) {
    nextStatus = 'borrowed'
  } else {
    nextStatus = 'available'
  }

  return new Promise((resolve, reject) => {
    const sql = 'UPDATE books SET available_copies = ?, status = ? WHERE id = ?'
    db.run(sql, [nextAvailable, nextStatus, bookId], (err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

export const getBookCategories = async (): Promise<string[]> => {
  const db = getDatabase()

  return new Promise((resolve, reject) => {
    const sql = 'SELECT DISTINCT category FROM books ORDER BY category'
    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(err)
      } else {
        resolve(rows.map((row: any) => row.category))
      }
    })
  })
}

// 辅助函数：将数据库行转换为 Book 对象
const deserializeBook = (row: any): Book => {
  return {
    id: row.id,
    title: row.title,
    authors: JSON.parse(row.authors || '[]'),
    isbn: row.isbn,
    publisher: row.publisher,
    publishedYear: row.published_year,
    category: row.category,
    description: row.description,
    coverImage: row.cover_image,
    totalCopies: row.total_copies,
    availableCopies: row.available_copies,
    status: row.status,
    location: row.location,
    tags: JSON.parse(row.tags || '[]'),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
