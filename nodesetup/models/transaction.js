import mongoose from "mongoose";

// Schema for Transaction for library management system
// Attributes:
// - userId - ObjectId (reference to User)
// - bookId - ObjectId (reference to Book)
// - issueDate - Date
// - dueDate - Date
// - returnDate - Date (optional)
// - fineAmount - Number
// - status - Enum (issued, returned, overdue, lost)
// - issuedBy - ObjectId (reference to User - librarian/admin)
// - returnedBy - ObjectId (reference to User - librarian/admin, optional)
// - notes - string (optional)
// - createdAt - TimeStamp
// - updatedAt - TimeStamp

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Book",
    required: true,
  },
  issueDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  returnDate: {
    type: Date,
  },
  fineAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  status: {
    type: String,
    enum: ["issued", "returned", "overdue", "lost"],
    default: "issued",
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  returnedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  notes: {
    type: String,
    trim: true,
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

// Validation to ensure return date is after issue date
transactionSchema.pre('save', function(next) {
  if (this.returnDate && this.returnDate < this.issueDate) {
    next(new Error('Return date cannot be before issue date'));
  } else {
    next();
  }
});

// Indexes for efficient searching
transactionSchema.index({ userId: 1 });
transactionSchema.index({ bookId: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ dueDate: 1 });
transactionSchema.index({ issueDate: 1 });

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;
