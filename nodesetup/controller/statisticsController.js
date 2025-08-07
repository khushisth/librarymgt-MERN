import User from '../models/user.js';
import Book from '../models/book.js';
import Author from '../models/author.js';
import Category from '../models/category.js';
import Transaction from '../models/transaction.js';
import Fine from '../models/fine.js';
import Reservation from '../models/reservation.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// @desc    Get dashboard statistics
// @route   GET /api/statistics/dashboard
// @access  Private (Admin/Librarian)
export const getDashboardStats = asyncHandler(async (req, res) => {
  // Basic counts
  const totalUsers = await User.countDocuments();
  const totalBooks = await Book.countDocuments();
  const totalAuthors = await Author.countDocuments();
  const totalCategories = await Category.countDocuments();
  
  // Active statistics
  const activeUsers = await User.countDocuments({ status: 'active' });
  const availableBooks = await Book.countDocuments({ 
    availableCopies: { $gt: 0 }, 
    status: 'available' 
  });
  
  // Transaction statistics
  const activeTransactions = await Transaction.countDocuments({ status: 'issued' });
  const overdueTransactions = await Transaction.countDocuments({
    status: 'issued',
    dueDate: { $lt: new Date() }
  });
  
  // Fine statistics
  const totalFines = await Fine.aggregate([
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  
  const pendingFines = await Fine.aggregate([
    { $match: { paymentStatus: 'pending' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  
  // Reservation statistics
  const activeReservations = await Reservation.countDocuments({ status: 'active' });
  
  // Recent activity (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentTransactions = await Transaction.countDocuments({
    createdAt: { $gte: thirtyDaysAgo }
  });
  
  const recentRegistrations = await User.countDocuments({
    createdAt: { $gte: thirtyDaysAgo }
  });
  
  res.json({
    success: true,
    data: {
      overview: {
        totalUsers,
        totalBooks,
        totalAuthors,
        totalCategories,
        activeUsers,
        availableBooks
      },
      transactions: {
        active: activeTransactions,
        overdue: overdueTransactions,
        recent: recentTransactions
      },
      finances: {
        totalFines: totalFines[0]?.total || 0,
        pendingFines: pendingFines[0]?.total || 0
      },
      reservations: {
        active: activeReservations
      },
      activity: {
        recentTransactions,
        recentRegistrations
      }
    }
  });
});

// @desc    Get monthly statistics
// @route   GET /api/statistics/monthly
// @access  Private (Admin/Librarian)
export const getMonthlyStats = asyncHandler(async (req, res) => {
  const year = parseInt(req.query.year) || new Date().getFullYear();
  
  // Transactions by month
  const transactionsByMonth = await Transaction.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(year, 0, 1),
          $lt: new Date(year + 1, 0, 1)
        }
      }
    },
    {
      $group: {
        _id: { month: { $month: '$createdAt' } },
        issued: { $sum: { $cond: [{ $eq: ['$status', 'issued'] }, 1, 0] } },
        returned: { $sum: { $cond: [{ $eq: ['$status', 'returned'] }, 1, 0] } },
        total: { $sum: 1 }
      }
    },
    { $sort: { '_id.month': 1 } }
  ]);
  
  // New users by month
  const usersByMonth = await User.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(year, 0, 1),
          $lt: new Date(year + 1, 0, 1)
        }
      }
    },
    {
      $group: {
        _id: { month: { $month: '$createdAt' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.month': 1 } }
  ]);
  
  // Fines by month
  const finesByMonth = await Fine.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(year, 0, 1),
          $lt: new Date(year + 1, 0, 1)
        }
      }
    },
    {
      $group: {
        _id: { month: { $month: '$createdAt' } },
        totalAmount: { $sum: '$amount' },
        paidAmount: { 
          $sum: { 
            $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$amount', 0] 
          } 
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.month': 1 } }
  ]);
  
  res.json({
    success: true,
    data: {
      year,
      transactions: transactionsByMonth,
      users: usersByMonth,
      fines: finesByMonth
    }
  });
});

// @desc    Get popular books statistics
// @route   GET /api/statistics/popular-books
// @access  Private (Admin/Librarian)
export const getPopularBooks = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  
  // Most borrowed books
  const mostBorrowed = await Transaction.aggregate([
    { $group: { _id: '$bookId', borrowCount: { $sum: 1 } } },
    { $lookup: { from: 'books', localField: '_id', foreignField: '_id', as: 'book' } },
    { $unwind: '$book' },
    { $lookup: { from: 'authors', localField: 'book.authors', foreignField: '_id', as: 'authors' } },
    {
      $project: {
        _id: 0,
        bookId: '$_id',
        title: '$book.title',
        isbn: '$book.isbn',
        authors: '$authors.name',
        borrowCount: 1
      }
    },
    { $sort: { borrowCount: -1 } },
    { $limit: limit }
  ]);
  
  // Most reserved books
  const mostReserved = await Reservation.aggregate([
    { $group: { _id: '$bookId', reservationCount: { $sum: 1 } } },
    { $lookup: { from: 'books', localField: '_id', foreignField: '_id', as: 'book' } },
    { $unwind: '$book' },
    { $lookup: { from: 'authors', localField: 'book.authors', foreignField: '_id', as: 'authors' } },
    {
      $project: {
        _id: 0,
        bookId: '$_id',
        title: '$book.title',
        isbn: '$book.isbn',
        authors: '$authors.name',
        reservationCount: 1
      }
    },
    { $sort: { reservationCount: -1 } },
    { $limit: limit }
  ]);
  
  // Books with highest fine generation
  const highestFines = await Fine.aggregate([
    {
      $lookup: {
        from: 'transactions',
        localField: 'transactionId',
        foreignField: '_id',
        as: 'transaction'
      }
    },
    { $unwind: '$transaction' },
    { $group: { _id: '$transaction.bookId', totalFines: { $sum: '$amount' } } },
    { $lookup: { from: 'books', localField: '_id', foreignField: '_id', as: 'book' } },
    { $unwind: '$book' },
    { $lookup: { from: 'authors', localField: 'book.authors', foreignField: '_id', as: 'authors' } },
    {
      $project: {
        _id: 0,
        bookId: '$_id',
        title: '$book.title',
        isbn: '$book.isbn',
        authors: '$authors.name',
        totalFines: 1
      }
    },
    { $sort: { totalFines: -1 } },
    { $limit: limit }
  ]);
  
  res.json({
    success: true,
    data: {
      mostBorrowed,
      mostReserved,
      highestFines
    }
  });
});

// @desc    Get user activity statistics
// @route   GET /api/statistics/user-activity
// @access  Private (Admin/Librarian)
export const getUserActivity = asyncHandler(async (req, res) => {
  // Most active borrowers
  const mostActiveBorrowers = await Transaction.aggregate([
    { $group: { _id: '$userId', transactionCount: { $sum: 1 } } },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    {
      $project: {
        _id: 0,
        userId: '$_id',
        name: '$user.name',
        email: '$user.email',
        transactionCount: 1
      }
    },
    { $sort: { transactionCount: -1 } },
    { $limit: 10 }
  ]);
  
  // Users with most fines
  const usersWithMostFines = await Fine.aggregate([
    { $group: { _id: '$userId', totalFines: { $sum: '$amount' }, fineCount: { $sum: 1 } } },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    {
      $project: {
        _id: 0,
        userId: '$_id',
        name: '$user.name',
        email: '$user.email',
        totalFines: 1,
        fineCount: 1
      }
    },
    { $sort: { totalFines: -1 } },
    { $limit: 10 }
  ]);
  
  // User registration trends (last 12 months)
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  
  const registrationTrends = await User.aggregate([
    { $match: { createdAt: { $gte: twelveMonthsAgo } } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);
  
  res.json({
    success: true,
    data: {
      mostActiveBorrowers,
      usersWithMostFines,
      registrationTrends
    }
  });
});

// @desc    Get inventory statistics
// @route   GET /api/statistics/inventory
// @access  Private (Admin/Librarian)
export const getInventoryStats = asyncHandler(async (req, res) => {
  // Books by category
  const booksByCategory = await Book.aggregate([
    { $unwind: '$categories' },
    { $group: { _id: '$categories', count: { $sum: 1 } } },
    { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
    { $unwind: '$category' },
    { $project: { _id: 0, category: '$category.name', count: 1 } },
    { $sort: { count: -1 } }
  ]);
  
  // Books by language
  const booksByLanguage = await Book.aggregate([
    { $group: { _id: '$language', count: { $sum: 1 } } },
    { $project: { _id: 0, language: '$_id', count: 1 } },
    { $sort: { count: -1 } }
  ]);
  
  // Books by publication year
  const booksByYear = await Book.aggregate([
    {
      $group: {
        _id: { $year: '$publicationDate' },
        count: { $sum: 1 }
      }
    },
    { $project: { _id: 0, year: '$_id', count: 1 } },
    { $sort: { year: -1 } },
    { $limit: 10 }
  ]);
  
  // Availability statistics
  const availabilityStats = await Book.aggregate([
    {
      $group: {
        _id: null,
        totalBooks: { $sum: '$totalCopies' },
        availableBooks: { $sum: '$availableCopies' },
        borrowedBooks: { $sum: { $subtract: ['$totalCopies', '$availableCopies'] } }
      }
    }
  ]);
  
  res.json({
    success: true,
    data: {
      booksByCategory,
      booksByLanguage,
      booksByYear,
      availability: availabilityStats[0] || { totalBooks: 0, availableBooks: 0, borrowedBooks: 0 }
    }
  });
});

// @desc    Export statistics to CSV
// @route   GET /api/statistics/export
// @access  Private (Admin)
export const exportStatistics = asyncHandler(async (req, res) => {
  const { type, startDate, endDate } = req.query;
  
  let data = [];
  let filename = 'statistics.csv';
  
  const dateFilter = {};
  if (startDate) dateFilter.$gte = new Date(startDate);
  if (endDate) dateFilter.$lte = new Date(endDate);
  
  switch (type) {
    case 'transactions':
      data = await Transaction.find(dateFilter.length ? { createdAt: dateFilter } : {})
        .populate('userId', 'name email')
        .populate('bookId', 'title isbn')
        .lean();
      filename = 'transactions.csv';
      break;
      
    case 'fines':
      data = await Fine.find(dateFilter.length ? { createdAt: dateFilter } : {})
        .populate('userId', 'name email')
        .lean();
      filename = 'fines.csv';
      break;
      
    case 'users':
      data = await User.find(dateFilter.length ? { createdAt: dateFilter } : {})
        .select('-password')
        .lean();
      filename = 'users.csv';
      break;
      
    default:
      return res.status(400).json({
        success: false,
        message: 'Invalid export type'
      });
  }
  
  // Convert to CSV format
  if (data.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'No data found for export'
    });
  }
  
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => Object.values(row).join(',')).join('\n');
  const csv = `${headers}\n${rows}`;
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  res.send(csv);
});
