import express from 'express';
import {
  getDashboardStats,
  getMonthlyStats,
  getPopularBooks,
  getUserActivity,
  getInventoryStats,
  exportStatistics
} from '../controller/statisticsController.js';
import {
  authenticateToken,
  authorize
} from '../middleware/auth.js';
import {
  generalRateLimit,
  strictRateLimit
} from '../middleware/security.js';
import {
  auditLogger
} from '../middleware/logger.js';

const router = express.Router();

// All statistics routes require authentication and admin/librarian role
router.use(authenticateToken);
router.use(authorize('admin', 'librarian'));

// Dashboard statistics
router.get('/dashboard', 
  generalRateLimit,
  getDashboardStats
);

// Monthly statistics
router.get('/monthly', 
  generalRateLimit,
  getMonthlyStats
);

// Popular books statistics
router.get('/popular-books', 
  generalRateLimit,
  getPopularBooks
);

// User activity statistics
router.get('/user-activity', 
  generalRateLimit,
  getUserActivity
);

// Inventory statistics
router.get('/inventory', 
  generalRateLimit,
  getInventoryStats
);

// Export statistics (Admin only)
router.get('/export', 
  strictRateLimit,
  authorize('admin'),
  auditLogger('STATISTICS_EXPORT'),
  exportStatistics
);

export default router;
