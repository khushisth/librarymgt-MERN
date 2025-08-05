import Author from '../models/author.js';
import Book from '../models/book.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// @desc    Create a new author
// @route   POST /api/authors
// @access  Private (Admin/Librarian)
export const createAuthor = asyncHandler(async (req, res) => {
  const { name, biography, birthDate, deathDate, nationality } = req.body;

  // Check if author already exists
  const existingAuthor = await Author.findOne({ name });
  if (existingAuthor) {
    return res.status(400).json({
      success: false,
      message: 'Author with this name already exists'
    });
  }

  const author = await Author.create({
    name,
    biography,
    birthDate,
    deathDate,
    nationality
  });

  res.status(201).json({
    success: true,
    message: 'Author created successfully',
    data: { author }
  });
});

// @desc    Get all authors with pagination and search
// @route   GET /api/authors
// @access  Public
export const getAllAuthors = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build filter
  const filter = {};
  
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { nationality: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  if (req.query.nationality) {
    filter.nationality = { $regex: req.query.nationality, $options: 'i' };
  }

  // Sort options
  let sort = { name: 1 };
  if (req.query.sort) {
    switch (req.query.sort) {
      case 'name':
        sort = { name: 1 };
        break;
      case 'birthDate':
        sort = { birthDate: -1 };
        break;
      case 'created':
        sort = { createdAt: -1 };
        break;
    }
  }

  const authors = await Author.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Author.countDocuments(filter);

  res.json({
    success: true,
    data: {
      authors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Get author by ID with their books
// @route   GET /api/authors/:id
// @access  Public
export const getAuthorById = asyncHandler(async (req, res) => {
  const author = await Author.findById(req.params.id);

  if (!author) {
    return res.status(404).json({
      success: false,
      message: 'Author not found'
    });
  }

  // Get books by this author
  const books = await Book.find({ authors: req.params.id })
    .select('title isbn publicationDate availableCopies totalCopies')
    .populate('categories', 'name');

  res.json({
    success: true,
    data: {
      author,
      books
    }
  });
});

// @desc    Update author
// @route   PUT /api/authors/:id
// @access  Private (Admin/Librarian)
export const updateAuthor = asyncHandler(async (req, res) => {
  const author = await Author.findById(req.params.id);

  if (!author) {
    return res.status(404).json({
      success: false,
      message: 'Author not found'
    });
  }

  const { name, biography, birthDate, deathDate, nationality } = req.body;

  // Check if name is being changed and if it's already taken
  if (name && name !== author.name) {
    const existingAuthor = await Author.findOne({ name });
    if (existingAuthor) {
      return res.status(400).json({
        success: false,
        message: 'Author with this name already exists'
      });
    }
  }

  // Update fields
  author.name = name || author.name;
  author.biography = biography || author.biography;
  author.birthDate = birthDate || author.birthDate;
  author.deathDate = deathDate || author.deathDate;
  author.nationality = nationality || author.nationality;
  author.updatedAt = new Date();

  await author.save();

  res.json({
    success: true,
    message: 'Author updated successfully',
    data: { author }
  });
});

// @desc    Delete author
// @route   DELETE /api/authors/:id
// @access  Private (Admin)
export const deleteAuthor = asyncHandler(async (req, res) => {
  const author = await Author.findById(req.params.id);

  if (!author) {
    return res.status(404).json({
      success: false,
      message: 'Author not found'
    });
  }

  // Check if author has books
  const booksCount = await Book.countDocuments({ authors: req.params.id });
  
  if (booksCount > 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot delete author. ${booksCount} book(s) are associated with this author.`
    });
  }

  await Author.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Author deleted successfully'
  });
});

// @desc    Get author statistics
// @route   GET /api/authors/stats
// @access  Private (Admin/Librarian)
export const getAuthorStats = asyncHandler(async (req, res) => {
  const totalAuthors = await Author.countDocuments();

  // Authors with most books
  const authorsWithBookCount = await Book.aggregate([
    { $unwind: '$authors' },
    { $group: { _id: '$authors', bookCount: { $sum: 1 } } },
    { $lookup: { from: 'authors', localField: '_id', foreignField: '_id', as: 'author' } },
    { $unwind: '$author' },
    { $project: { _id: 0, author: '$author.name', bookCount: 1 } },
    { $sort: { bookCount: -1 } },
    { $limit: 10 }
  ]);

  // Authors by nationality
  const authorsByNationality = await Author.aggregate([
    { $match: { nationality: { $exists: true, $ne: null } } },
    { $group: { _id: '$nationality', count: { $sum: 1 } } },
    { $project: { _id: 0, nationality: '$_id', count: 1 } },
    { $sort: { count: -1 } }
  ]);

  res.json({
    success: true,
    data: {
      totalAuthors,
      authorsWithBookCount,
      authorsByNationality
    }
  });
});
