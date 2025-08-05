import { body, param, query, validationResult } from 'express-validator';
import mongoose from 'mongoose';

// Middleware to handle validation errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Custom validator for MongoDB ObjectId
export const isValidObjectId = (value) => {
  return mongoose.Types.ObjectId.isValid(value);
};

// User validation rules
export const validateUserRegistration = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('phone')
    .trim()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),
  
  body('address')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Address must be between 5 and 200 characters'),
  
  body('role')
    .optional()
    .isIn(['admin', 'librarian', 'borrower'])
    .withMessage('Role must be admin, librarian, or borrower'),
  
  handleValidationErrors
];

export const validateUserLogin = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Book validation rules
export const validateBook = [
  body('isbn')
    .trim()
    .matches(/^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/)
    .withMessage('Please provide a valid ISBN'),
  
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  
  body('authors')
    .isArray({ min: 1 })
    .withMessage('At least one author is required')
    .custom((authors) => {
      return authors.every(author => isValidObjectId(author));
    })
    .withMessage('All author IDs must be valid'),
  
  body('publisher')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Publisher must be between 1 and 100 characters'),
  
  body('publicationDate')
    .isISO8601()
    .withMessage('Please provide a valid publication date'),
  
  body('categories')
    .isArray({ min: 1 })
    .withMessage('At least one category is required')
    .custom((categories) => {
      return categories.every(category => isValidObjectId(category));
    })
    .withMessage('All category IDs must be valid'),
  
  body('totalCopies')
    .isInt({ min: 1 })
    .withMessage('Total copies must be at least 1'),
  
  body('availableCopies')
    .isInt({ min: 0 })
    .withMessage('Available copies must be 0 or more'),
  
  body('location')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Location must be between 1 and 50 characters'),
  
  body('language')
    .optional()
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('Language must be between 2 and 30 characters'),
  
  body('pages')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Pages must be at least 1'),
  
  handleValidationErrors
];

// Author validation rules
export const validateAuthor = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Author name must be between 2 and 100 characters'),
  
  body('biography')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Biography must not exceed 1000 characters'),
  
  body('birthDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid birth date'),
  
  body('deathDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid death date'),
  
  body('nationality')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Nationality must not exceed 50 characters'),
  
  handleValidationErrors
];

// Category validation rules
export const validateCategory = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category name must be between 2 and 50 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description must not exceed 200 characters'),
  
  body('parentCategory')
    .optional()
    .custom(isValidObjectId)
    .withMessage('Parent category must be a valid ID'),
  
  handleValidationErrors
];

// Transaction validation rules
export const validateTransaction = [
  body('userId')
    .custom(isValidObjectId)
    .withMessage('User ID must be valid'),
  
  body('bookId')
    .custom(isValidObjectId)
    .withMessage('Book ID must be valid'),
  
  body('dueDate')
    .isISO8601()
    .withMessage('Please provide a valid due date'),
  
  handleValidationErrors
];

// Fine validation rules
export const validateFine = [
  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Fine amount must be 0 or greater'),
  
  body('reason')
    .isIn(['overdue', 'damage', 'lost', 'other'])
    .withMessage('Reason must be overdue, damage, lost, or other'),
  
  body('paymentMethod')
    .optional()
    .isIn(['cash', 'card', 'online', 'check'])
    .withMessage('Payment method must be cash, card, online, or check'),
  
  handleValidationErrors
];

// Reservation validation rules
export const validateReservation = [
  body('bookId')
    .custom(isValidObjectId)
    .withMessage('Book ID must be valid'),
  
  body('expiryDate')
    .isISO8601()
    .withMessage('Please provide a valid expiry date'),
  
  handleValidationErrors
];

// Parameter validation
export const validateObjectIdParam = (paramName) => [
  param(paramName)
    .custom(isValidObjectId)
    .withMessage(`${paramName} must be a valid ID`),
  
  handleValidationErrors
];

// Query validation for pagination and filtering
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  handleValidationErrors
];
