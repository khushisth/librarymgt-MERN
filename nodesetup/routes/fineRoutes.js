import express from 'express';
import {
  createFine,
  getAllFines,
  getFineById,
  processFinePayment,
  waiveFine,
  updateFine,
  deleteFine,
  getUserOutstandingFines,
  getFineStats
} from '../controller/fineController.js';
import {
  authenticateToken,
  authorize,
  authorizeOwnerOrStaff
} from '../middleware/auth.js';
import {
  validateFine,
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

// Protected routes - Fine management
router.get('/', 
  generalRateLimit,
  authenticateToken,
  validatePagination,
  getAllFines
);

router.get('/stats', 
  generalRateLimit,
  authenticateToken,
  authorize('admin', 'librarian'),
  getFineStats
);

router.get('/user/:userId/outstanding', 
  generalRateLimit,
  authenticateToken,
  authorizeOwnerOrStaff,
  validateObjectIdParam('userId'),
  getUserOutstandingFines
);

router.get('/:id', 
  generalRateLimit,
  authenticateToken,
  validateObjectIdParam('id'),
  getFineById
);

// Fine management operations (Admin/Librarian only)
router.post('/', 
  strictRateLimit,
  authenticateToken,
  authorize('admin', 'librarian'),
  validateFine,
  auditLogger('FINE_CREATE'),
  createFine
);

router.put('/:id', 
  strictRateLimit,
  authenticateToken,
  authorize('admin', 'librarian'),
  validateObjectIdParam('id'),
  auditLogger('FINE_UPDATE'),
  updateFine
);

router.put('/:id/pay', 
  strictRateLimit,
  authenticateToken,
  authorize('admin', 'librarian'),
  validateObjectIdParam('id'),
  auditLogger('FINE_PAYMENT'),
  processFinePayment
);

router.put('/:id/waive', 
  strictRateLimit,
  authenticateToken,
  authorize('admin', 'librarian'),
  validateObjectIdParam('id'),
  auditLogger('FINE_WAIVE'),
  waiveFine
);

router.delete('/:id', 
  strictRateLimit,
  authenticateToken,
  authorize('admin'),
  validateObjectIdParam('id'),
  auditLogger('FINE_DELETE'),
  deleteFine
);

export default router;
