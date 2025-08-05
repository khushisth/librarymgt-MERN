import Book from '../models/book.js';
import Author from '../models/author.js';
import Category from '../models/category.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// @desc    Create a new book
// @route   POST /api/books
// @access  Private (Admin/Librarian)
export const createBook = asyncHandler(async (req, res) => {
  const {
    isbn,
    title,
    authors,
    publisher,
    publicationDate,
    categories,
    totalCopies,
    availableCopies,
    location,
    description,
    language,
    pages
  } = req.body;

  // Check if book with ISBN already exists
  const existingBook = await Book.findOne({ isbn });
  if (existingBook) {
    return res.status(400).json({
      success: false,
      message: 'Book with this ISBN already exists'
    });
  }

  // Verify authors exist
  const authorDocs = await Author.find({ _id: { $in: authors } });
  if (authorDocs.length !== authors.length) {
    return res.status(400).json({
      success: false,
      message: 'One or more authors not found'
    });
  }

  // Verify categories exist
  const categoryDocs = await Category.find({ _id: { $in: categories } });
  if (categoryDocs.length !== categories.length) {
    return res.status(400).json({
      success: false,
      message: 'One or more categories not found'
    });
  }

  const book = await Book.create({
    isbn,
    title,
    authors,
    publisher,
    publicationDate,
    categories,
    totalCopies,
    availableCopies: availableCopies || totalCopies,
    location,
    description,
    language,
    pages
  });

  // Populate the created book
  await book.populate(['authors', 'categories']);

  res.status(201).json({
    success: true,
    message: 'Book created successfully',
    data: { book }
  });
});

// @desc    Get all books with filtering and pagination
// @route   GET /api/books
// @access  Public
export const getAllBooks = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build filter
  const filter = {};
  
  // Search by title, ISBN, or author name
  if (req.query.search) {
    const searchRegex = { $regex: req.query.search, $options: 'i' };
    
    // Find authors matching the search term
    const matchingAuthors = await Author.find({ name: searchRegex });
    const authorIds = matchingAuthors.map(author => author._id);
    
    filter.$or = [
      { title: searchRegex },
      { isbn: searchRegex },
      { authors: { $in: authorIds } }
    ];
  }

  // Filter by category
  if (req.query.category) {
    filter.categories = req.query.category;
  }

  // Filter by availability
  if (req.query.available === 'true') {
    filter.availableCopies = { $gt: 0 };
    filter.status = 'available';
  }

  // Filter by language
  if (req.query.language) {
    filter.language = req.query.language;
  }

  // Filter by publication year
  if (req.query.year) {
    const year = parseInt(req.query.year);
    filter.publicationDate = {
      $gte: new Date(year, 0, 1),
      $lt: new Date(year + 1, 0, 1)
    };
  }

  // Sort options
  let sort = { createdAt: -1 };
  if (req.query.sort) {
    switch (req.query.sort) {
      case 'title':
        sort = { title: 1 };
        break;
      case 'author':
        sort = { 'authors.name': 1 };
        break;
      case 'publication':
        sort = { publicationDate: -1 };
        break;
      case 'availability':
        sort = { availableCopies: -1 };
        break;
    }
  }

  const books = await Book.find(filter)
    .populate('authors', 'name')
    .populate('categories', 'name')
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Book.countDocuments(filter);

  res.json({
    success: true,
    data: {
      books,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Get book by ID
// @route   GET /api/books/:id
// @access  Public
export const getBookById = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id)
    .populate('authors', 'name biography')
    .populate('categories', 'name description');

  if (!book) {
    return res.status(404).json({
      success: false,
      message: 'Book not found'
    });
  }

  res.json({
    success: true,
    data: { book }
  });
});

// @desc    Update book
// @route   PUT /api/books/:id
// @access  Private (Admin/Librarian)
export const updateBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);

  if (!book) {
    return res.status(404).json({
      success: false,
      message: 'Book not found'
    });
  }

  const {
    isbn,
    title,
    authors,
    publisher,
    publicationDate,
    categories,
    totalCopies,
    availableCopies,
    location,
    description,
    language,
    pages,
    status
  } = req.body;

  // Check if ISBN is being changed and if it's already taken
  if (isbn && isbn !== book.isbn) {
    const existingBook = await Book.findOne({ isbn });
    if (existingBook) {
      return res.status(400).json({
        success: false,
        message: 'Book with this ISBN already exists'
      });
    }
  }

  // Verify authors exist if being updated
  if (authors) {
    const authorDocs = await Author.find({ _id: { $in: authors } });
    if (authorDocs.length !== authors.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more authors not found'
      });
    }
  }

  // Verify categories exist if being updated
  if (categories) {
    const categoryDocs = await Category.find({ _id: { $in: categories } });
    if (categoryDocs.length !== categories.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more categories not found'
      });
    }
  }

  // Update fields
  book.isbn = isbn || book.isbn;
  book.title = title || book.title;
  book.authors = authors || book.authors;
  book.publisher = publisher || book.publisher;
  book.publicationDate = publicationDate || book.publicationDate;
  book.categories = categories || book.categories;
  book.totalCopies = totalCopies !== undefined ? totalCopies : book.totalCopies;
  book.availableCopies = availableCopies !== undefined ? availableCopies : book.availableCopies;
  book.location = location || book.location;
  book.description = description || book.description;
  book.language = language || book.language;
  book.pages = pages || book.pages;
  book.status = status || book.status;
  book.updatedAt = new Date();

  await book.save();
  await book.populate(['authors', 'categories']);

  res.json({
    success: true,
    message: 'Book updated successfully',
    data: { book }
  });
});

// @desc    Delete book
// @route   DELETE /api/books/:id
// @access  Private (Admin)
export const deleteBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);

  if (!book) {
    return res.status(404).json({
      success: false,
      message: 'Book not found'
    });
  }

  // Check if book has active transactions
  // This would require importing Transaction model
  // For now, we'll just delete the book
  
  await Book.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Book deleted successfully'
  });
});

// @desc    Update book availability
// @route   PUT /api/books/:id/availability
// @access  Private (Admin/Librarian)
export const updateBookAvailability = asyncHandler(async (req, res) => {
  const { availableCopies, totalCopies } = req.body;

  const book = await Book.findById(req.params.id);

  if (!book) {
    return res.status(404).json({
      success: false,
      message: 'Book not found'
    });
  }

  if (totalCopies !== undefined) {
    book.totalCopies = totalCopies;
  }

  if (availableCopies !== undefined) {
    book.availableCopies = availableCopies;
  }

  book.updatedAt = new Date();
  await book.save();

  res.json({
    success: true,
    message: 'Book availability updated successfully',
    data: {
      book: {
        id: book._id,
        title: book.title,
        totalCopies: book.totalCopies,
        availableCopies: book.availableCopies
      }
    }
  });
});

// @desc    Get book statistics
// @route   GET /api/books/stats
// @access  Private (Admin/Librarian)
export const getBookStats = asyncHandler(async (req, res) => {
  const totalBooks = await Book.countDocuments();
  const availableBooks = await Book.countDocuments({ 
    availableCopies: { $gt: 0 }, 
    status: 'available' 
  });
  const unavailableBooks = await Book.countDocuments({ 
    $or: [
      { availableCopies: 0 },
      { status: { $ne: 'available' } }
    ]
  });

  // Get books by category
  const booksByCategory = await Book.aggregate([
    { $unwind: '$categories' },
    { $group: { _id: '$categories', count: { $sum: 1 } } },
    { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
    { $unwind: '$category' },
    { $project: { _id: 0, category: '$category.name', count: 1 } }
  ]);

  // Get books by language
  const booksByLanguage = await Book.aggregate([
    { $group: { _id: '$language', count: { $sum: 1 } } },
    { $project: { _id: 0, language: '$_id', count: 1 } }
  ]);

  res.json({
    success: true,
    data: {
      totalBooks,
      availableBooks,
      unavailableBooks,
      booksByCategory,
      booksByLanguage
    }
  });
});
