import { getDatabase } from './database'
import { Book } from '../types'

export const createBook = async (bookData: {
  id: string
  title: string
  titleEn?: string
  authors: string[]
  authorsEn?: string[]
  isbn?: string
  publisher?: string
  publisherEn?: string
  publishedYear?: number
  category: string
  categoryEn?: string
  description?: string
  descriptionEn?: string
  coverImage?: string
  status?: 'available' | 'borrowed' | 'reserved' | 'maintenance'
  totalCopies: number
  availableCopies?: number
  location?: string
  tags?: string[]
  tagsEn?: string[]
}): Promise<Book> => {
  const db = getDatabase()
  const availableCopies = bookData.availableCopies ?? bookData.totalCopies
  const status = bookData.status ?? 'available'

  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO books (
        id, title, title_en, authors, authors_en, isbn, publisher, publisher_en, published_year,
        category, category_en, description, description_en, cover_image, total_copies, available_copies, status,
        location, tags, tags_en
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

    db.run(
      sql,
      [
        bookData.id,
        bookData.title,
        bookData.titleEn || null,
        JSON.stringify(bookData.authors),
        JSON.stringify(bookData.authorsEn || []),
        bookData.isbn || null,
        bookData.publisher || null,
        bookData.publisherEn || null,
        bookData.publishedYear || null,
        bookData.category,
        bookData.categoryEn || null,
        bookData.description || null,
        bookData.descriptionEn || null,
        bookData.coverImage || null,
        bookData.totalCopies,
        availableCopies,
        status,
        bookData.location || null,
        JSON.stringify(bookData.tags || []),
        JSON.stringify(bookData.tagsEn || []),
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

export const getBookByISBN = async (isbn: string): Promise<Book | null> => {
  const db = getDatabase()

  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM books WHERE isbn = ? LIMIT 1'
    db.get(sql, [isbn], (err, row) => {
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
      sql +=
        ' AND (title LIKE ? OR title_en LIKE ? OR authors LIKE ? OR authors_en LIKE ? OR category LIKE ? OR category_en LIKE ? OR publisher LIKE ? OR publisher_en LIKE ? OR description LIKE ? OR description_en LIKE ?)'
      const searchPattern = `%${search}%`
      params.push(
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
      )
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

  const fieldMap: Record<string, string> = {
    title: 'title',
    titleEn: 'title_en',
    authors: 'authors',
    authorsEn: 'authors_en',
    isbn: 'isbn',
    publisher: 'publisher',
    publisherEn: 'publisher_en',
    publishedYear: 'published_year',
    category: 'category',
    categoryEn: 'category_en',
    description: 'description',
    descriptionEn: 'description_en',
    coverImage: 'cover_image',
    totalCopies: 'total_copies',
    availableCopies: 'available_copies',
    status: 'status',
    location: 'location',
    tags: 'tags',
    tagsEn: 'tags_en',
  }
  const fields: string[] = []
  const values: any[] = []

  Object.entries(updates).forEach(([key, value]) => {
    const column = fieldMap[key]
    if (column && value !== undefined) {
      fields.push(`${column} = ?`)
      if (key === 'authors' || key === 'authorsEn' || key === 'tags' || key === 'tagsEn') {
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
  } else if (nextAvailable === 0) {
    nextStatus = book.status === 'reserved' ? 'reserved' : 'borrowed'
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
    titleEn: row.title_en || undefined,
    authors: JSON.parse(row.authors || '[]'),
    authorsEn: JSON.parse(row.authors_en || '[]'),
    isbn: row.isbn,
    publisher: row.publisher,
    publisherEn: row.publisher_en || undefined,
    publishedYear: row.published_year,
    category: row.category,
    categoryEn: row.category_en || undefined,
    description: row.description,
    descriptionEn: row.description_en || undefined,
    coverImage: row.cover_image,
    totalCopies: row.total_copies,
    availableCopies: row.available_copies,
    status: row.status,
    location: row.location,
    tags: JSON.parse(row.tags || '[]'),
    tagsEn: JSON.parse(row.tags_en || '[]'),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
