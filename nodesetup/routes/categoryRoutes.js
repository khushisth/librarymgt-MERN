import express from 'express';
import {
  createCategory,
  getAllCategories,
  getCategoryTree,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getCategoryStats
} from '../controller/categoryController.js';
import {
  authenticateToken,
  authorize
} from '../middleware/auth.js';
import {
  validateCategory,
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
  getAllCategories
);

router.get('/tree', 
  generalRateLimit,
  getCategoryTree
);

router.get('/stats', 
  generalRateLimit,
  authenticateToken,
  authorize('admin', 'librarian'),
  getCategoryStats
);

router.get('/:id', 
  generalRateLimit,
  validateObjectIdParam('id'),
  getCategoryById
);

// Protected routes - Category management (Admin/Librarian)
router.post('/', 
  strictRateLimit,
  authenticateToken,
  authorize('admin', 'librarian'),
  validateCategory,
  auditLogger('CATEGORY_CREATE'),
  createCategory
);

router.put('/:id', 
  strictRateLimit,
  authenticateToken,
  authorize('admin', 'librarian'),
  validateObjectIdParam('id'),
  auditLogger('CATEGORY_UPDATE'),
  updateCategory
);

router.delete('/:id', 
  strictRateLimit,
  authenticateToken,
  authorize('admin'),
  validateObjectIdParam('id'),
  auditLogger('CATEGORY_DELETE'),
  deleteCategory
);

export default router;
