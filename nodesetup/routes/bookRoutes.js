import express from 'express';
import {
  createBook,
  getAllBooks,
  getBookById,
  updateBook,
  deleteBook,
  updateBookAvailability,
  getBookStats
} from '../controller/bookController.js';
import {
  authenticateToken,
  authorize
} from '../middleware/auth.js';
import {
  validateBook,
  validateObjectIdParam,
  validatePagination
} from '../middleware/validation.js';
import {
  generalRateLimit,
  strictRateLimit
} from '../middleware/security.js';
import {
  auditLogger
} from '../middleware/logger.js';

const router = express.Router();

// Public routes
router.get('/', 
  generalRateLimit,
  validatePagination,
  getAllBooks
);

router.get('/stats', 
  generalRateLimit,
  authenticateToken,
  authorize('admin', 'librarian'),
  getBookStats
);

router.get('/:id', 
  generalRateLimit,
  validateObjectIdParam('id'),
  getBookById
);

// Protected routes - Book management (Admin/Librarian)
router.post('/', 
  strictRateLimit,
  authenticateToken,
  authorize('admin', 'librarian'),
  validateBook,
  auditLogger('BOOK_CREATE'),
  createBook
);

router.put('/:id', 
  strictRateLimit,
  authenticateToken,
  authorize('admin', 'librarian'),
  validateObjectIdParam('id'),
  auditLogger('BOOK_UPDATE'),
  updateBook
);

router.put('/:id/availability', 
  strictRateLimit,
  authenticateToken,
  authorize('admin', 'librarian'),
  validateObjectIdParam('id'),
  auditLogger('BOOK_AVAILABILITY_UPDATE'),
  updateBookAvailability
);

router.delete('/:id', 
  strictRateLimit,
  authenticateToken,
  authorize('admin'),
  validateObjectIdParam('id'),
  auditLogger('BOOK_DELETE'),
  deleteBook
);

export default router;
