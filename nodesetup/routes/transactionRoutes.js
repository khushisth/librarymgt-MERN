import express from 'express';
import {
  issueBook,
  returnBook,
  getAllTransactions,
  getTransactionById,
  getOverdueTransactions,
  extendDueDate,
  getTransactionStats
} from '../controller/transactionController.js';
import {
  authenticateToken,
  authorize,
  authorizeOwnerOrStaff
} from '../middleware/auth.js';
import {
  validateTransaction,
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

// Protected routes - Transaction management
router.get('/', 
  generalRateLimit,
  authenticateToken,
  validatePagination,
  getAllTransactions
);

router.get('/stats', 
  generalRateLimit,
  authenticateToken,
  authorize('admin', 'librarian'),
  getTransactionStats
);

router.get('/overdue', 
  generalRateLimit,
  authenticateToken,
  authorize('admin', 'librarian'),
  validatePagination,
  getOverdueTransactions
);

router.get('/:id', 
  generalRateLimit,
  authenticateToken,
  validateObjectIdParam('id'),
  getTransactionById
);

// Book issue/return operations (Admin/Librarian only)
router.post('/issue', 
  strictRateLimit,
  authenticateToken,
  authorize('admin', 'librarian'),
  validateTransaction,
  auditLogger('BOOK_ISSUE'),
  issueBook
);

router.put('/:id/return', 
  strictRateLimit,
  authenticateToken,
  authorize('admin', 'librarian'),
  validateObjectIdParam('id'),
  auditLogger('BOOK_RETURN'),
  returnBook
);

router.put('/:id/extend', 
  strictRateLimit,
  authenticateToken,
  authorize('admin', 'librarian'),
  validateObjectIdParam('id'),
  auditLogger('DUE_DATE_EXTEND'),
  extendDueDate
);

export default router;
