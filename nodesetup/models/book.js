import mongoose from "mongoose";

// Schema for Book for library management system
// Attributes:
// - isbn - string (unique)
// - title - string
// - authors - Array of ObjectId (references to Author)
// - publisher - string
// - publicationDate - Date
// - categories - Array of ObjectId (references to Category)
// - totalCopies - Number
// - availableCopies - Number
// - location - string (shelf information)
// - description - string (optional)
// - language - string
// - pages - Number (optional)
// - status - Enum (available, unavailable, maintenance)
// - createdAt - TimeStamp
// - updatedAt - TimeStamp

const bookSchema = new mongoose.Schema({
  isbn: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  authors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Author",
    required: true,
  }],
  publisher: {
    type: String,
    required: true,
    trim: true,
  },
  publicationDate: {
    type: Date,
    required: true,
  },
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  }],
  totalCopies: {
    type: Number,
    required: true,
    min: 0,
  },
  availableCopies: {
    type: Number,
    required: true,
    min: 0,
  },
  location: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  language: {
    type: String,
    required: true,
    default: "English",
    trim: true,
  },
  pages: {
    type: Number,
    min: 1,
  },
  status: {
    type: String,
    enum: ["available", "unavailable", "maintenance"],
    default: "available",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Validation to ensure availableCopies doesn't exceed totalCopies
bookSchema.pre('save', function(next) {
  if (this.availableCopies > this.totalCopies) {
    next(new Error('Available copies cannot exceed total copies'));
  } else {
    next();
  }
});

// Indexes for efficient searching
bookSchema.index({ isbn: 1 });
bookSchema.index({ title: 1 });
bookSchema.index({ authors: 1 });
bookSchema.index({ categories: 1 });
bookSchema.index({ status: 1 });

const Book = mongoose.model("Book", bookSchema);

export default Book;
