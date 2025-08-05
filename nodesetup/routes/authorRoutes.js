import express from 'express';
import {
  createAuthor,
  getAllAuthors,
  getAuthorById,
  updateAuthor,
  deleteAuthor,
  getAuthorStats
} from '../controller/authorController.js';
import {
  authenticateToken,
  authorize
} from '../middleware/auth.js';
import {
  validateAuthor,
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
  getAllAuthors
);

router.get('/stats', 
  generalRateLimit,
  authenticateToken,
  authorize('admin', 'librarian'),
  getAuthorStats
);

router.get('/:id', 
  generalRateLimit,
  validateObjectIdParam('id'),
  getAuthorById
);

// Protected routes - Author management (Admin/Librarian)
router.post('/', 
  strictRateLimit,
  authenticateToken,
  authorize('admin', 'librarian'),
  validateAuthor,
  auditLogger('AUTHOR_CREATE'),
  createAuthor
);

router.put('/:id', 
  strictRateLimit,
  authenticateToken,
  authorize('admin', 'librarian'),
  validateObjectIdParam('id'),
  auditLogger('AUTHOR_UPDATE'),
  updateAuthor
);

router.delete('/:id', 
  strictRateLimit,
  authenticateToken,
  authorize('admin'),
  validateObjectIdParam('id'),
  auditLogger('AUTHOR_DELETE'),
  deleteAuthor
);

export default router;
