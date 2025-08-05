import express from 'express';
import {
  createReservation,
  getAllReservations,
  getReservationById,
  cancelReservation,
  fulfillReservation,
  getBookReservationQueue,
  getExpiredReservations,
  autoExpireReservations,
  getReservationStats
} from '../controller/reservationController.js';
import {
  authenticateToken,
  authorize
} from '../middleware/auth.js';
import {
  validateReservation,
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

// Protected routes - Reservation management
router.get('/', 
  generalRateLimit,
  authenticateToken,
  validatePagination,
  getAllReservations
);

router.get('/stats', 
  generalRateLimit,
  authenticateToken,
  authorize('admin', 'librarian'),
  getReservationStats
);

router.get('/expired', 
  generalRateLimit,
  authenticateToken,
  authorize('admin', 'librarian'),
  validatePagination,
  getExpiredReservations
);

router.get('/book/:bookId/queue', 
  generalRateLimit,
  authenticateToken,
  authorize('admin', 'librarian'),
  validateObjectIdParam('bookId'),
  getBookReservationQueue
);

router.get('/:id', 
  generalRateLimit,
  authenticateToken,
  validateObjectIdParam('id'),
  getReservationById
);

// Reservation operations
router.post('/', 
  strictRateLimit,
  authenticateToken,
  validateReservation,
  auditLogger('RESERVATION_CREATE'),
  createReservation
);

router.put('/:id/cancel', 
  strictRateLimit,
  authenticateToken,
  validateObjectIdParam('id'),
  auditLogger('RESERVATION_CANCEL'),
  cancelReservation
);

router.put('/:id/fulfill', 
  strictRateLimit,
  authenticateToken,
  authorize('admin', 'librarian'),
  validateObjectIdParam('id'),
  auditLogger('RESERVATION_FULFILL'),
  fulfillReservation
);

router.put('/auto-expire', 
  strictRateLimit,
  authenticateToken,
  authorize('admin', 'librarian'),
  auditLogger('RESERVATION_AUTO_EXPIRE'),
  autoExpireReservations
);

export default router;
