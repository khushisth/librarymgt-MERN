import express from 'express';
import userRoutes from './userRoutes.js';
import bookRoutes from './bookRoutes.js';
import authorRoutes from './authorRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import transactionRoutes from './transactionRoutes.js';
import fineRoutes from './fineRoutes.js';
import reservationRoutes from './reservationRoutes.js';

const router = express.Router();

// API Routes
router.use('/users', userRoutes);
router.use('/books', bookRoutes);
router.use('/authors', authorRoutes);
router.use('/categories', categoryRoutes);
router.use('/transactions', transactionRoutes);
router.use('/fines', fineRoutes);
router.use('/reservations', reservationRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Library Management System API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API documentation endpoint
router.get('/docs', (req, res) => {
  res.json({
    success: true,
    message: 'Library Management System API Documentation',
    endpoints: {
      users: {
        'POST /api/users/register': 'Register a new user',
        'POST /api/users/login': 'User login',
        'GET /api/users/profile': 'Get current user profile',
        'PUT /api/users/profile': 'Update user profile',
        'PUT /api/users/change-password': 'Change password',
        'GET /api/users': 'Get all users (Admin/Librarian)',
        'GET /api/users/:id': 'Get user by ID (Admin/Librarian)',
        'PUT /api/users/:id/status': 'Update user status (Admin)',
        'DELETE /api/users/:id': 'Delete user (Admin)'
      },
      books: {
        'GET /api/books': 'Get all books with filtering',
        'GET /api/books/:id': 'Get book by ID',
        'GET /api/books/stats': 'Get book statistics (Admin/Librarian)',
        'POST /api/books': 'Create new book (Admin/Librarian)',
        'PUT /api/books/:id': 'Update book (Admin/Librarian)',
        'PUT /api/books/:id/availability': 'Update book availability (Admin/Librarian)',
        'DELETE /api/books/:id': 'Delete book (Admin)'
      },
      authors: {
        'GET /api/authors': 'Get all authors',
        'GET /api/authors/:id': 'Get author by ID with books',
        'GET /api/authors/stats': 'Get author statistics (Admin/Librarian)',
        'POST /api/authors': 'Create new author (Admin/Librarian)',
        'PUT /api/authors/:id': 'Update author (Admin/Librarian)',
        'DELETE /api/authors/:id': 'Delete author (Admin)'
      },
      categories: {
        'GET /api/categories': 'Get all categories',
        'GET /api/categories/tree': 'Get category hierarchy tree',
        'GET /api/categories/:id': 'Get category by ID with books',
        'GET /api/categories/stats': 'Get category statistics (Admin/Librarian)',
        'POST /api/categories': 'Create new category (Admin/Librarian)',
        'PUT /api/categories/:id': 'Update category (Admin/Librarian)',
        'DELETE /api/categories/:id': 'Delete category (Admin)'
      },
      transactions: {
        'GET /api/transactions': 'Get all transactions',
        'GET /api/transactions/:id': 'Get transaction by ID',
        'GET /api/transactions/overdue': 'Get overdue transactions (Admin/Librarian)',
        'GET /api/transactions/stats': 'Get transaction statistics (Admin/Librarian)',
        'POST /api/transactions/issue': 'Issue book to user (Admin/Librarian)',
        'PUT /api/transactions/:id/return': 'Return book (Admin/Librarian)',
        'PUT /api/transactions/:id/extend': 'Extend due date (Admin/Librarian)'
      },
      fines: {
        'GET /api/fines': 'Get all fines',
        'GET /api/fines/:id': 'Get fine by ID',
        'GET /api/fines/user/:userId/outstanding': 'Get user outstanding fines',
        'GET /api/fines/stats': 'Get fine statistics (Admin/Librarian)',
        'POST /api/fines': 'Create fine (Admin/Librarian)',
        'PUT /api/fines/:id': 'Update fine (Admin/Librarian)',
        'PUT /api/fines/:id/pay': 'Process fine payment (Admin/Librarian)',
        'PUT /api/fines/:id/waive': 'Waive fine (Admin/Librarian)',
        'DELETE /api/fines/:id': 'Delete fine (Admin)'
      },
      reservations: {
        'GET /api/reservations': 'Get all reservations',
        'GET /api/reservations/:id': 'Get reservation by ID',
        'GET /api/reservations/expired': 'Get expired reservations (Admin/Librarian)',
        'GET /api/reservations/book/:bookId/queue': 'Get book reservation queue (Admin/Librarian)',
        'GET /api/reservations/stats': 'Get reservation statistics (Admin/Librarian)',
        'POST /api/reservations': 'Create reservation',
        'PUT /api/reservations/:id/cancel': 'Cancel reservation',
        'PUT /api/reservations/:id/fulfill': 'Fulfill reservation (Admin/Librarian)',
        'PUT /api/reservations/auto-expire': 'Auto-expire reservations (Admin/Librarian)'
      }
    },
    authentication: {
      description: 'Most endpoints require authentication via JWT token',
      header: 'Authorization: Bearer <token>',
      roles: {
        admin: 'Full access to all operations',
        librarian: 'Can manage books, transactions, fines, and reservations',
        borrower: 'Can view books, manage own profile, create reservations'
      }
    }
  });
});

export default router;
