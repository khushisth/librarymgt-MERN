import Transaction from '../models/transaction.js';
import Book from '../models/book.js';
import User from '../models/user.js';
import Fine from '../models/fine.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// @desc    Issue a book to a user
// @route   POST /api/transactions/issue
// @access  Private (Admin/Librarian)
export const issueBook = asyncHandler(async (req, res) => {
  const { userId, bookId, dueDate } = req.body;

  // Verify user exists and is active
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (user.status !== 'active') {
    return res.status(400).json({
      success: false,
      message: 'User account is not active'
    });
  }

  // Verify book exists and is available
  const book = await Book.findById(bookId);
  if (!book) {
    return res.status(404).json({
      success: false,
      message: 'Book not found'
    });
  }

  if (book.availableCopies <= 0 || book.status !== 'available') {
    return res.status(400).json({
      success: false,
      message: 'Book is not available for borrowing'
    });
  }

  // Check if user already has this book issued
  const existingTransaction = await Transaction.findOne({
    userId,
    bookId,
    status: 'issued'
  });

  if (existingTransaction) {
    return res.status(400).json({
      success: false,
      message: 'User already has this book issued'
    });
  }

  // Check user's borrowing limit (e.g., max 5 books)
  const activeTransactions = await Transaction.countDocuments({
    userId,
    status: 'issued'
  });

  const borrowingLimit = user.role === 'borrower' ? 5 : 10; // Different limits for different roles
  if (activeTransactions >= borrowingLimit) {
    return res.status(400).json({
      success: false,
      message: `User has reached the borrowing limit of ${borrowingLimit} books`
    });
  }

  // Check for outstanding fines
  const outstandingFines = await Fine.findOne({
    userId,
    paymentStatus: 'pending'
  });

  if (outstandingFines) {
    return res.status(400).json({
      success: false,
      message: 'User has outstanding fines. Please clear them before borrowing.'
    });
  }

  // Create transaction
  const transaction = await Transaction.create({
    userId,
    bookId,
    dueDate,
    issuedBy: req.user._id
  });

  // Update book availability
  book.availableCopies -= 1;
  await book.save();

  // Populate transaction data
  await transaction.populate([
    { path: 'userId', select: 'name email username' },
    { path: 'bookId', select: 'title isbn authors', populate: { path: 'authors', select: 'name' } },
    { path: 'issuedBy', select: 'name username' }
  ]);

  res.status(201).json({
    success: true,
    message: 'Book issued successfully',
    data: { transaction }
  });
});

// @desc    Return a book
// @route   PUT /api/transactions/:id/return
// @access  Private (Admin/Librarian)
export const returnBook = asyncHandler(async (req, res) => {
  const { notes } = req.body;

  const transaction = await Transaction.findById(req.params.id)
    .populate('userId', 'name email')
    .populate('bookId', 'title isbn');

  if (!transaction) {
    return res.status(404).json({
      success: false,
      message: 'Transaction not found'
    });
  }

  if (transaction.status !== 'issued') {
    return res.status(400).json({
      success: false,
      message: 'Book is not currently issued'
    });
  }

  const returnDate = new Date();
  
  // Calculate fine if overdue
  let fineAmount = 0;
  if (returnDate > transaction.dueDate) {
    const overdueDays = Math.ceil((returnDate - transaction.dueDate) / (1000 * 60 * 60 * 24));
    fineAmount = overdueDays * 1; // $1 per day fine
    
    // Create fine record
    await Fine.create({
      userId: transaction.userId._id,
      transactionId: transaction._id,
      amount: fineAmount,
      reason: 'overdue'
    });
  }

  // Update transaction
  transaction.returnDate = returnDate;
  transaction.status = 'returned';
  transaction.fineAmount = fineAmount;
  transaction.returnedBy = req.user._id;
  transaction.notes = notes;
  await transaction.save();

  // Update book availability
  const book = await Book.findById(transaction.bookId._id);
  book.availableCopies += 1;
  await book.save();

  await transaction.populate('returnedBy', 'name username');

  res.json({
    success: true,
    message: 'Book returned successfully',
    data: { 
      transaction,
      fineAmount: fineAmount > 0 ? fineAmount : null
    }
  });
});

// @desc    Get all transactions with filtering
// @route   GET /api/transactions
// @access  Private (Admin/Librarian for all, Users for their own)
export const getAllTransactions = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build filter
  const filter = {};

  // If user is not admin/librarian, only show their transactions
  if (req.user.role === 'borrower') {
    filter.userId = req.user._id;
  }

  // Filter by user ID (admin/librarian only)
  if (req.query.userId && req.user.role !== 'borrower') {
    filter.userId = req.query.userId;
  }

  // Filter by book ID
  if (req.query.bookId) {
    filter.bookId = req.query.bookId;
  }

  // Filter by status
  if (req.query.status) {
    filter.status = req.query.status;
  }

  // Filter by overdue
  if (req.query.overdue === 'true') {
    filter.dueDate = { $lt: new Date() };
    filter.status = 'issued';
  }

  // Date range filter
  if (req.query.startDate || req.query.endDate) {
    filter.issueDate = {};
    if (req.query.startDate) {
      filter.issueDate.$gte = new Date(req.query.startDate);
    }
    if (req.query.endDate) {
      filter.issueDate.$lte = new Date(req.query.endDate);
    }
  }

  // Sort options
  let sort = { issueDate: -1 };
  if (req.query.sort) {
    switch (req.query.sort) {
      case 'issueDate':
        sort = { issueDate: -1 };
        break;
      case 'dueDate':
        sort = { dueDate: 1 };
        break;
      case 'returnDate':
        sort = { returnDate: -1 };
        break;
    }
  }

  const transactions = await Transaction.find(filter)
    .populate('userId', 'name email username')
    .populate('bookId', 'title isbn authors')
    .populate('issuedBy', 'name username')
    .populate('returnedBy', 'name username')
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Transaction.countDocuments(filter);

  res.json({
    success: true,
    data: {
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Get transaction by ID
// @route   GET /api/transactions/:id
// @access  Private
export const getTransactionById = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findById(req.params.id)
    .populate('userId', 'name email username phone')
    .populate('bookId', 'title isbn authors publisher')
    .populate('issuedBy', 'name username')
    .populate('returnedBy', 'name username');

  if (!transaction) {
    return res.status(404).json({
      success: false,
      message: 'Transaction not found'
    });
  }

  // Check if user can access this transaction
  if (req.user.role === 'borrower' && transaction.userId._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  res.json({
    success: true,
    data: { transaction }
  });
});

// @desc    Get overdue transactions
// @route   GET /api/transactions/overdue
// @access  Private (Admin/Librarian)
export const getOverdueTransactions = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = {
    status: 'issued',
    dueDate: { $lt: new Date() }
  };

  const transactions = await Transaction.find(filter)
    .populate('userId', 'name email username phone')
    .populate('bookId', 'title isbn')
    .sort({ dueDate: 1 })
    .skip(skip)
    .limit(limit);

  const total = await Transaction.countDocuments(filter);

  // Calculate overdue days for each transaction
  const transactionsWithOverdue = transactions.map(transaction => ({
    ...transaction.toObject(),
    overdueDays: Math.ceil((new Date() - transaction.dueDate) / (1000 * 60 * 60 * 24))
  }));

  res.json({
    success: true,
    data: {
      transactions: transactionsWithOverdue,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Extend due date
// @route   PUT /api/transactions/:id/extend
// @access  Private (Admin/Librarian)
export const extendDueDate = asyncHandler(async (req, res) => {
  const { newDueDate, reason } = req.body;

  const transaction = await Transaction.findById(req.params.id);

  if (!transaction) {
    return res.status(404).json({
      success: false,
      message: 'Transaction not found'
    });
  }

  if (transaction.status !== 'issued') {
    return res.status(400).json({
      success: false,
      message: 'Can only extend due date for issued books'
    });
  }

  transaction.dueDate = newDueDate;
  transaction.notes = transaction.notes ? 
    `${transaction.notes}\nDue date extended: ${reason}` : 
    `Due date extended: ${reason}`;
  transaction.updatedAt = new Date();

  await transaction.save();

  res.json({
    success: true,
    message: 'Due date extended successfully',
    data: { 
      transactionId: transaction._id,
      newDueDate: transaction.dueDate 
    }
  });
});

// @desc    Get transaction statistics
// @route   GET /api/transactions/stats
// @access  Private (Admin/Librarian)
export const getTransactionStats = asyncHandler(async (req, res) => {
  const totalTransactions = await Transaction.countDocuments();
  const activeTransactions = await Transaction.countDocuments({ status: 'issued' });
  const overdueTransactions = await Transaction.countDocuments({
    status: 'issued',
    dueDate: { $lt: new Date() }
  });
  const returnedTransactions = await Transaction.countDocuments({ status: 'returned' });

  // Transactions by month (last 12 months)
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const transactionsByMonth = await Transaction.aggregate([
    { $match: { issueDate: { $gte: twelveMonthsAgo } } },
    {
      $group: {
        _id: {
          year: { $year: '$issueDate' },
          month: { $month: '$issueDate' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  res.json({
    success: true,
    data: {
      totalTransactions,
      activeTransactions,
      overdueTransactions,
      returnedTransactions,
      transactionsByMonth
    }
  });
});
