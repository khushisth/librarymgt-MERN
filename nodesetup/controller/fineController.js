import Fine from '../models/fine.js';
import Transaction from '../models/transaction.js';
import User from '../models/user.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// @desc    Create a fine
// @route   POST /api/fines
// @access  Private (Admin/Librarian)
export const createFine = asyncHandler(async (req, res) => {
  const { userId, transactionId, amount, reason, notes } = req.body;

  // Verify user exists
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Verify transaction exists
  const transaction = await Transaction.findById(transactionId);
  if (!transaction) {
    return res.status(404).json({
      success: false,
      message: 'Transaction not found'
    });
  }

  // Check if fine already exists for this transaction
  const existingFine = await Fine.findOne({ transactionId });
  if (existingFine) {
    return res.status(400).json({
      success: false,
      message: 'Fine already exists for this transaction'
    });
  }

  const fine = await Fine.create({
    userId,
    transactionId,
    amount,
    reason,
    notes
  });

  await fine.populate([
    { path: 'userId', select: 'name email username' },
    { path: 'transactionId', select: 'issueDate dueDate returnDate', populate: { path: 'bookId', select: 'title isbn' } }
  ]);

  res.status(201).json({
    success: true,
    message: 'Fine created successfully',
    data: { fine }
  });
});

// @desc    Get all fines with filtering
// @route   GET /api/fines
// @access  Private (Admin/Librarian for all, Users for their own)
export const getAllFines = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build filter
  const filter = {};

  // If user is not admin/librarian, only show their fines
  if (req.user.role === 'borrower') {
    filter.userId = req.user._id;
  }

  // Filter by user ID (admin/librarian only)
  if (req.query.userId && req.user.role !== 'borrower') {
    filter.userId = req.query.userId;
  }

  // Filter by payment status
  if (req.query.paymentStatus) {
    filter.paymentStatus = req.query.paymentStatus;
  }

  // Filter by reason
  if (req.query.reason) {
    filter.reason = req.query.reason;
  }

  // Filter by amount range
  if (req.query.minAmount || req.query.maxAmount) {
    filter.amount = {};
    if (req.query.minAmount) {
      filter.amount.$gte = parseFloat(req.query.minAmount);
    }
    if (req.query.maxAmount) {
      filter.amount.$lte = parseFloat(req.query.maxAmount);
    }
  }

  // Date range filter
  if (req.query.startDate || req.query.endDate) {
    filter.createdAt = {};
    if (req.query.startDate) {
      filter.createdAt.$gte = new Date(req.query.startDate);
    }
    if (req.query.endDate) {
      filter.createdAt.$lte = new Date(req.query.endDate);
    }
  }

  // Sort options
  let sort = { createdAt: -1 };
  if (req.query.sort) {
    switch (req.query.sort) {
      case 'amount':
        sort = { amount: -1 };
        break;
      case 'paymentDate':
        sort = { paymentDate: -1 };
        break;
      case 'created':
        sort = { createdAt: -1 };
        break;
    }
  }

  const fines = await Fine.find(filter)
    .populate('userId', 'name email username')
    .populate({
      path: 'transactionId',
      select: 'issueDate dueDate returnDate',
      populate: { path: 'bookId', select: 'title isbn' }
    })
    .populate('processedBy', 'name username')
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Fine.countDocuments(filter);

  res.json({
    success: true,
    data: {
      fines,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Get fine by ID
// @route   GET /api/fines/:id
// @access  Private
export const getFineById = asyncHandler(async (req, res) => {
  const fine = await Fine.findById(req.params.id)
    .populate('userId', 'name email username phone')
    .populate({
      path: 'transactionId',
      populate: { path: 'bookId', select: 'title isbn authors' }
    })
    .populate('processedBy', 'name username');

  if (!fine) {
    return res.status(404).json({
      success: false,
      message: 'Fine not found'
    });
  }

  // Check if user can access this fine
  if (req.user.role === 'borrower' && fine.userId._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  res.json({
    success: true,
    data: { fine }
  });
});

// @desc    Process fine payment
// @route   PUT /api/fines/:id/pay
// @access  Private (Admin/Librarian)
export const processFinePayment = asyncHandler(async (req, res) => {
  const { paymentMethod, notes } = req.body;

  const fine = await Fine.findById(req.params.id);

  if (!fine) {
    return res.status(404).json({
      success: false,
      message: 'Fine not found'
    });
  }

  if (fine.paymentStatus === 'paid') {
    return res.status(400).json({
      success: false,
      message: 'Fine is already paid'
    });
  }

  if (fine.paymentStatus === 'waived') {
    return res.status(400).json({
      success: false,
      message: 'Fine has been waived'
    });
  }

  fine.paymentStatus = 'paid';
  fine.paymentDate = new Date();
  fine.paymentMethod = paymentMethod;
  fine.processedBy = req.user._id;
  fine.notes = notes ? `${fine.notes || ''}\nPayment: ${notes}` : fine.notes;
  fine.updatedAt = new Date();

  await fine.save();

  await fine.populate([
    { path: 'userId', select: 'name email username' },
    { path: 'processedBy', select: 'name username' }
  ]);

  res.json({
    success: true,
    message: 'Fine payment processed successfully',
    data: { fine }
  });
});

// @desc    Waive fine
// @route   PUT /api/fines/:id/waive
// @access  Private (Admin/Librarian)
export const waiveFine = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const fine = await Fine.findById(req.params.id);

  if (!fine) {
    return res.status(404).json({
      success: false,
      message: 'Fine not found'
    });
  }

  if (fine.paymentStatus === 'paid') {
    return res.status(400).json({
      success: false,
      message: 'Cannot waive a paid fine'
    });
  }

  if (fine.paymentStatus === 'waived') {
    return res.status(400).json({
      success: false,
      message: 'Fine is already waived'
    });
  }

  fine.paymentStatus = 'waived';
  fine.processedBy = req.user._id;
  fine.notes = fine.notes ? 
    `${fine.notes}\nWaived: ${reason}` : 
    `Waived: ${reason}`;
  fine.updatedAt = new Date();

  await fine.save();

  await fine.populate([
    { path: 'userId', select: 'name email username' },
    { path: 'processedBy', select: 'name username' }
  ]);

  res.json({
    success: true,
    message: 'Fine waived successfully',
    data: { fine }
  });
});

// @desc    Update fine
// @route   PUT /api/fines/:id
// @access  Private (Admin/Librarian)
export const updateFine = asyncHandler(async (req, res) => {
  const { amount, reason, notes } = req.body;

  const fine = await Fine.findById(req.params.id);

  if (!fine) {
    return res.status(404).json({
      success: false,
      message: 'Fine not found'
    });
  }

  if (fine.paymentStatus === 'paid') {
    return res.status(400).json({
      success: false,
      message: 'Cannot update a paid fine'
    });
  }

  fine.amount = amount !== undefined ? amount : fine.amount;
  fine.reason = reason || fine.reason;
  fine.notes = notes || fine.notes;
  fine.updatedAt = new Date();

  await fine.save();

  res.json({
    success: true,
    message: 'Fine updated successfully',
    data: { fine }
  });
});

// @desc    Delete fine
// @route   DELETE /api/fines/:id
// @access  Private (Admin)
export const deleteFine = asyncHandler(async (req, res) => {
  const fine = await Fine.findById(req.params.id);

  if (!fine) {
    return res.status(404).json({
      success: false,
      message: 'Fine not found'
    });
  }

  if (fine.paymentStatus === 'paid') {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete a paid fine'
    });
  }

  await Fine.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Fine deleted successfully'
  });
});

// @desc    Get user's outstanding fines
// @route   GET /api/fines/user/:userId/outstanding
// @access  Private (Admin/Librarian or own data)
export const getUserOutstandingFines = asyncHandler(async (req, res) => {
  const userId = req.params.userId;

  // Check if user can access this data
  if (req.user.role === 'borrower' && userId !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  const fines = await Fine.find({
    userId,
    paymentStatus: 'pending'
  })
    .populate({
      path: 'transactionId',
      populate: { path: 'bookId', select: 'title isbn' }
    })
    .sort({ createdAt: -1 });

  const totalOutstanding = fines.reduce((sum, fine) => sum + fine.amount, 0);

  res.json({
    success: true,
    data: {
      fines,
      totalOutstanding,
      count: fines.length
    }
  });
});

// @desc    Get fine statistics
// @route   GET /api/fines/stats
// @access  Private (Admin/Librarian)
export const getFineStats = asyncHandler(async (req, res) => {
  const totalFines = await Fine.countDocuments();
  const pendingFines = await Fine.countDocuments({ paymentStatus: 'pending' });
  const paidFines = await Fine.countDocuments({ paymentStatus: 'paid' });
  const waivedFines = await Fine.countDocuments({ paymentStatus: 'waived' });

  // Total amounts
  const totalAmount = await Fine.aggregate([
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  const pendingAmount = await Fine.aggregate([
    { $match: { paymentStatus: 'pending' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  const collectedAmount = await Fine.aggregate([
    { $match: { paymentStatus: 'paid' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  // Fines by reason
  const finesByReason = await Fine.aggregate([
    { $group: { _id: '$reason', count: { $sum: 1 }, amount: { $sum: '$amount' } } },
    { $project: { _id: 0, reason: '$_id', count: 1, amount: 1 } }
  ]);

  res.json({
    success: true,
    data: {
      totalFines,
      pendingFines,
      paidFines,
      waivedFines,
      totalAmount: totalAmount[0]?.total || 0,
      pendingAmount: pendingAmount[0]?.total || 0,
      collectedAmount: collectedAmount[0]?.total || 0,
      finesByReason
    }
  });
});
