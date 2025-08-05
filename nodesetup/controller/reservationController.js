import Reservation from '../models/reservation.js';
import Book from '../models/book.js';
import User from '../models/user.js';
import Transaction from '../models/transaction.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// @desc    Create a book reservation
// @route   POST /api/reservations
// @access  Private
export const createReservation = asyncHandler(async (req, res) => {
  const { bookId, expiryDate } = req.body;
  const userId = req.user._id;

  // Verify book exists
  const book = await Book.findById(bookId);
  if (!book) {
    return res.status(404).json({
      success: false,
      message: 'Book not found'
    });
  }

  // Check if book is available
  if (book.availableCopies > 0 && book.status === 'available') {
    return res.status(400).json({
      success: false,
      message: 'Book is currently available. No need to reserve.'
    });
  }

  // Check if user already has an active reservation for this book
  const existingReservation = await Reservation.findOne({
    userId,
    bookId,
    status: 'active'
  });

  if (existingReservation) {
    return res.status(400).json({
      success: false,
      message: 'You already have an active reservation for this book'
    });
  }

  // Check if user currently has this book issued
  const activeTransaction = await Transaction.findOne({
    userId,
    bookId,
    status: 'issued'
  });

  if (activeTransaction) {
    return res.status(400).json({
      success: false,
      message: 'You currently have this book issued'
    });
  }

  // Check user's reservation limit
  const activeReservations = await Reservation.countDocuments({
    userId,
    status: 'active'
  });

  const reservationLimit = req.user.role === 'borrower' ? 3 : 5;
  if (activeReservations >= reservationLimit) {
    return res.status(400).json({
      success: false,
      message: `You have reached the reservation limit of ${reservationLimit} books`
    });
  }

  // Calculate priority (queue position)
  const queuePosition = await Reservation.countDocuments({
    bookId,
    status: 'active'
  }) + 1;

  const reservation = await Reservation.create({
    userId,
    bookId,
    expiryDate,
    priority: queuePosition
  });

  await reservation.populate([
    { path: 'userId', select: 'name email username' },
    { path: 'bookId', select: 'title isbn authors', populate: { path: 'authors', select: 'name' } }
  ]);

  res.status(201).json({
    success: true,
    message: 'Reservation created successfully',
    data: { 
      reservation,
      queuePosition
    }
  });
});

// @desc    Get all reservations with filtering
// @route   GET /api/reservations
// @access  Private (Admin/Librarian for all, Users for their own)
export const getAllReservations = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build filter
  const filter = {};

  // If user is not admin/librarian, only show their reservations
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

  // Filter by expired reservations
  if (req.query.expired === 'true') {
    filter.expiryDate = { $lt: new Date() };
    filter.status = 'active';
  }

  // Date range filter
  if (req.query.startDate || req.query.endDate) {
    filter.reservationDate = {};
    if (req.query.startDate) {
      filter.reservationDate.$gte = new Date(req.query.startDate);
    }
    if (req.query.endDate) {
      filter.reservationDate.$lte = new Date(req.query.endDate);
    }
  }

  // Sort options
  let sort = { reservationDate: -1 };
  if (req.query.sort) {
    switch (req.query.sort) {
      case 'priority':
        sort = { priority: 1 };
        break;
      case 'expiryDate':
        sort = { expiryDate: 1 };
        break;
      case 'reservationDate':
        sort = { reservationDate: -1 };
        break;
    }
  }

  const reservations = await Reservation.find(filter)
    .populate('userId', 'name email username')
    .populate('bookId', 'title isbn authors')
    .populate('fulfilledBy', 'name username')
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Reservation.countDocuments(filter);

  res.json({
    success: true,
    data: {
      reservations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Get reservation by ID
// @route   GET /api/reservations/:id
// @access  Private
export const getReservationById = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id)
    .populate('userId', 'name email username phone')
    .populate('bookId', 'title isbn authors publisher')
    .populate('fulfilledBy', 'name username');

  if (!reservation) {
    return res.status(404).json({
      success: false,
      message: 'Reservation not found'
    });
  }

  // Check if user can access this reservation
  if (req.user.role === 'borrower' && reservation.userId._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  res.json({
    success: true,
    data: { reservation }
  });
});

// @desc    Cancel reservation
// @route   PUT /api/reservations/:id/cancel
// @access  Private (Owner or Admin/Librarian)
export const cancelReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);

  if (!reservation) {
    return res.status(404).json({
      success: false,
      message: 'Reservation not found'
    });
  }

  // Check if user can cancel this reservation
  const isOwner = reservation.userId.toString() === req.user._id.toString();
  const isStaff = ['admin', 'librarian'].includes(req.user.role);

  if (!isOwner && !isStaff) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  if (reservation.status !== 'active') {
    return res.status(400).json({
      success: false,
      message: 'Can only cancel active reservations'
    });
  }

  reservation.status = 'cancelled';
  reservation.updatedAt = new Date();
  await reservation.save();

  // Update priorities for remaining reservations
  await updateReservationPriorities(reservation.bookId);

  res.json({
    success: true,
    message: 'Reservation cancelled successfully',
    data: { reservation }
  });
});

// @desc    Fulfill reservation (when book becomes available)
// @route   PUT /api/reservations/:id/fulfill
// @access  Private (Admin/Librarian)
export const fulfillReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);

  if (!reservation) {
    return res.status(404).json({
      success: false,
      message: 'Reservation not found'
    });
  }

  if (reservation.status !== 'active') {
    return res.status(400).json({
      success: false,
      message: 'Can only fulfill active reservations'
    });
  }

  // Check if book is available
  const book = await Book.findById(reservation.bookId);
  if (book.availableCopies <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Book is not available'
    });
  }

  reservation.status = 'fulfilled';
  reservation.fulfilledBy = req.user._id;
  reservation.fulfilledDate = new Date();
  reservation.updatedAt = new Date();
  await reservation.save();

  // Update priorities for remaining reservations
  await updateReservationPriorities(reservation.bookId);

  await reservation.populate([
    { path: 'userId', select: 'name email username' },
    { path: 'bookId', select: 'title isbn' },
    { path: 'fulfilledBy', select: 'name username' }
  ]);

  res.json({
    success: true,
    message: 'Reservation fulfilled successfully',
    data: { reservation }
  });
});

// @desc    Get reservation queue for a book
// @route   GET /api/reservations/book/:bookId/queue
// @access  Private (Admin/Librarian)
export const getBookReservationQueue = asyncHandler(async (req, res) => {
  const bookId = req.params.bookId;

  const reservations = await Reservation.find({
    bookId,
    status: 'active'
  })
    .populate('userId', 'name email username')
    .sort({ priority: 1 });

  res.json({
    success: true,
    data: {
      bookId,
      queueLength: reservations.length,
      reservations
    }
  });
});

// @desc    Get expired reservations
// @route   GET /api/reservations/expired
// @access  Private (Admin/Librarian)
export const getExpiredReservations = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = {
    status: 'active',
    expiryDate: { $lt: new Date() }
  };

  const reservations = await Reservation.find(filter)
    .populate('userId', 'name email username')
    .populate('bookId', 'title isbn')
    .sort({ expiryDate: 1 })
    .skip(skip)
    .limit(limit);

  const total = await Reservation.countDocuments(filter);

  res.json({
    success: true,
    data: {
      reservations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Auto-expire reservations (utility function)
// @route   PUT /api/reservations/auto-expire
// @access  Private (Admin/Librarian)
export const autoExpireReservations = asyncHandler(async (req, res) => {
  const expiredReservations = await Reservation.updateMany(
    {
      status: 'active',
      expiryDate: { $lt: new Date() }
    },
    {
      status: 'expired',
      updatedAt: new Date()
    }
  );

  res.json({
    success: true,
    message: `${expiredReservations.modifiedCount} reservations expired`,
    data: { expiredCount: expiredReservations.modifiedCount }
  });
});

// @desc    Get reservation statistics
// @route   GET /api/reservations/stats
// @access  Private (Admin/Librarian)
export const getReservationStats = asyncHandler(async (req, res) => {
  const totalReservations = await Reservation.countDocuments();
  const activeReservations = await Reservation.countDocuments({ status: 'active' });
  const fulfilledReservations = await Reservation.countDocuments({ status: 'fulfilled' });
  const cancelledReservations = await Reservation.countDocuments({ status: 'cancelled' });
  const expiredReservations = await Reservation.countDocuments({ status: 'expired' });

  // Books with most reservations
  const booksWithMostReservations = await Reservation.aggregate([
    { $match: { status: 'active' } },
    { $group: { _id: '$bookId', count: { $sum: 1 } } },
    { $lookup: { from: 'books', localField: '_id', foreignField: '_id', as: 'book' } },
    { $unwind: '$book' },
    { $project: { _id: 0, book: '$book.title', isbn: '$book.isbn', reservations: '$count' } },
    { $sort: { reservations: -1 } },
    { $limit: 10 }
  ]);

  res.json({
    success: true,
    data: {
      totalReservations,
      activeReservations,
      fulfilledReservations,
      cancelledReservations,
      expiredReservations,
      booksWithMostReservations
    }
  });
});

// Helper function to update reservation priorities
const updateReservationPriorities = async (bookId) => {
  const activeReservations = await Reservation.find({
    bookId,
    status: 'active'
  }).sort({ reservationDate: 1 });

  for (let i = 0; i < activeReservations.length; i++) {
    activeReservations[i].priority = i + 1;
    await activeReservations[i].save();
  }
};
