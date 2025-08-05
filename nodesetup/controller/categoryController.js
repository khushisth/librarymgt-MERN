import Category from '../models/category.js';
import Book from '../models/book.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// @desc    Create a new category
// @route   POST /api/categories
// @access  Private (Admin/Librarian)
export const createCategory = asyncHandler(async (req, res) => {
  const { name, description, parentCategory } = req.body;

  // Check if category already exists
  const existingCategory = await Category.findOne({ name });
  if (existingCategory) {
    return res.status(400).json({
      success: false,
      message: 'Category with this name already exists'
    });
  }

  // Verify parent category exists if provided
  if (parentCategory) {
    const parentCat = await Category.findById(parentCategory);
    if (!parentCat) {
      return res.status(400).json({
        success: false,
        message: 'Parent category not found'
      });
    }
  }

  const category = await Category.create({
    name,
    description,
    parentCategory
  });

  await category.populate('parentCategory', 'name');

  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: { category }
  });
});

// @desc    Get all categories with hierarchy
// @route   GET /api/categories
// @access  Public
export const getAllCategories = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;

  // Build filter
  const filter = {};
  
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { description: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  if (req.query.status) {
    filter.status = req.query.status;
  }

  // Filter for parent categories only
  if (req.query.parentOnly === 'true') {
    filter.parentCategory = { $exists: false };
  }

  // Filter for subcategories only
  if (req.query.subcategoriesOnly === 'true') {
    filter.parentCategory = { $exists: true };
  }

  // Sort options
  let sort = { name: 1 };
  if (req.query.sort) {
    switch (req.query.sort) {
      case 'name':
        sort = { name: 1 };
        break;
      case 'created':
        sort = { createdAt: -1 };
        break;
    }
  }

  const categories = await Category.find(filter)
    .populate('parentCategory', 'name')
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Category.countDocuments(filter);

  res.json({
    success: true,
    data: {
      categories,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Get category hierarchy tree
// @route   GET /api/categories/tree
// @access  Public
export const getCategoryTree = asyncHandler(async (req, res) => {
  // Get all active categories
  const categories = await Category.find({ status: 'active' })
    .populate('parentCategory', 'name')
    .sort({ name: 1 });

  // Build hierarchy tree
  const buildTree = (categories, parentId = null) => {
    return categories
      .filter(cat => {
        if (parentId === null) {
          return !cat.parentCategory;
        }
        return cat.parentCategory && cat.parentCategory._id.toString() === parentId.toString();
      })
      .map(cat => ({
        id: cat._id,
        name: cat.name,
        description: cat.description,
        children: buildTree(categories, cat._id)
      }));
  };

  const tree = buildTree(categories);

  res.json({
    success: true,
    data: { tree }
  });
});

// @desc    Get category by ID with books
// @route   GET /api/categories/:id
// @access  Public
export const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id)
    .populate('parentCategory', 'name');

  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Category not found'
    });
  }

  // Get subcategories
  const subcategories = await Category.find({ parentCategory: req.params.id })
    .select('name description');

  // Get books in this category
  const books = await Book.find({ categories: req.params.id })
    .select('title isbn authors availableCopies totalCopies')
    .populate('authors', 'name')
    .limit(20);

  const totalBooks = await Book.countDocuments({ categories: req.params.id });

  res.json({
    success: true,
    data: {
      category,
      subcategories,
      books,
      totalBooks
    }
  });
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (Admin/Librarian)
export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Category not found'
    });
  }

  const { name, description, parentCategory, status } = req.body;

  // Check if name is being changed and if it's already taken
  if (name && name !== category.name) {
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }
  }

  // Verify parent category exists if being updated
  if (parentCategory && parentCategory !== category.parentCategory?.toString()) {
    // Prevent circular reference
    if (parentCategory === req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'Category cannot be its own parent'
      });
    }

    const parentCat = await Category.findById(parentCategory);
    if (!parentCat) {
      return res.status(400).json({
        success: false,
        message: 'Parent category not found'
      });
    }

    // Check if the new parent is a descendant of this category
    const isDescendant = async (categoryId, potentialAncestorId) => {
      const cat = await Category.findById(categoryId);
      if (!cat || !cat.parentCategory) return false;
      if (cat.parentCategory.toString() === potentialAncestorId) return true;
      return await isDescendant(cat.parentCategory, potentialAncestorId);
    };

    if (await isDescendant(parentCategory, req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create circular reference in category hierarchy'
      });
    }
  }

  // Update fields
  category.name = name || category.name;
  category.description = description || category.description;
  category.parentCategory = parentCategory || category.parentCategory;
  category.status = status || category.status;
  category.updatedAt = new Date();

  await category.save();
  await category.populate('parentCategory', 'name');

  res.json({
    success: true,
    message: 'Category updated successfully',
    data: { category }
  });
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (Admin)
export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Category not found'
    });
  }

  // Check if category has books
  const booksCount = await Book.countDocuments({ categories: req.params.id });
  
  if (booksCount > 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot delete category. ${booksCount} book(s) are associated with this category.`
    });
  }

  // Check if category has subcategories
  const subcategoriesCount = await Category.countDocuments({ parentCategory: req.params.id });
  
  if (subcategoriesCount > 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot delete category. ${subcategoriesCount} subcategory(ies) are associated with this category.`
    });
  }

  await Category.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Category deleted successfully'
  });
});

// @desc    Get category statistics
// @route   GET /api/categories/stats
// @access  Private (Admin/Librarian)
export const getCategoryStats = asyncHandler(async (req, res) => {
  const totalCategories = await Category.countDocuments();
  const activeCategories = await Category.countDocuments({ status: 'active' });
  const parentCategories = await Category.countDocuments({ parentCategory: { $exists: false } });
  const subcategories = await Category.countDocuments({ parentCategory: { $exists: true } });

  // Categories with most books
  const categoriesWithBookCount = await Book.aggregate([
    { $unwind: '$categories' },
    { $group: { _id: '$categories', bookCount: { $sum: 1 } } },
    { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
    { $unwind: '$category' },
    { $project: { _id: 0, category: '$category.name', bookCount: 1 } },
    { $sort: { bookCount: -1 } },
    { $limit: 10 }
  ]);

  res.json({
    success: true,
    data: {
      totalCategories,
      activeCategories,
      parentCategories,
      subcategories,
      categoriesWithBookCount
    }
  });
});
