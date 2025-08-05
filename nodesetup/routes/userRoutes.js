import express from 'express';
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  changePassword,
  getAllUsers,
  getUserById,
  updateUserStatus,
  deleteUser
} from '../controller/userController.js';
import {
  authenticateToken,
  authorize,
  authorizeOwnerOrStaff
} from '../middleware/auth.js';
import {
  validateUserRegistration,
  validateUserLogin,
  validateObjectIdParam,
  validatePagination
} from '../middleware/validation.js';
import {
  authRateLimit,
  generalRateLimit
} from '../middleware/security.js';
import {
  auditLogger
} from '../middleware/logger.js';

const router = express.Router();

// Public routes
router.post('/register', 
  authRateLimit,
  validateUserRegistration,
  registerUser
);

router.post('/login', 
  authRateLimit,
  validateUserLogin,
  loginUser
);

// Protected routes - User profile management
router.get('/profile', 
  generalRateLimit,
  authenticateToken,
  getUserProfile
);

router.put('/profile', 
  generalRateLimit,
  authenticateToken,
  updateUserProfile
);

router.put('/change-password', 
  generalRateLimit,
  authenticateToken,
  auditLogger('PASSWORD_CHANGE'),
  changePassword
);

// Admin/Librarian routes - User management
router.get('/', 
  generalRateLimit,
  authenticateToken,
  authorize('admin', 'librarian'),
  validatePagination,
  getAllUsers
);

router.get('/:id', 
  generalRateLimit,
  authenticateToken,
  authorize('admin', 'librarian'),
  validateObjectIdParam('id'),
  getUserById
);

router.put('/:id/status', 
  generalRateLimit,
  authenticateToken,
  authorize('admin'),
  validateObjectIdParam('id'),
  auditLogger('USER_STATUS_UPDATE'),
  updateUserStatus
);

router.delete('/:id', 
  generalRateLimit,
  authenticateToken,
  authorize('admin'),
  validateObjectIdParam('id'),
  auditLogger('USER_DELETE'),
  deleteUser
);

export default router;
