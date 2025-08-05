import mongoose from "mongoose";

// Schema for Fine for library management system
// Attributes:
// - userId - ObjectId (reference to User)
// - transactionId - ObjectId (reference to Transaction)
// - amount - Number
// - reason - string (overdue, damage, lost, etc.)
// - paymentStatus - Enum (pending, paid, waived)
// - paymentDate - Date (optional)
// - paymentMethod - string (optional)
// - processedBy - ObjectId (reference to User - librarian/admin, optional)
// - notes - string (optional)
// - createdAt - TimeStamp
// - updatedAt - TimeStamp

const fineSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Transaction",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  reason: {
    type: String,
    required: true,
    enum: ["overdue", "damage", "lost", "other"],
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "waived"],
    default: "pending",
  },
  paymentDate: {
    type: Date,
  },
  paymentMethod: {
    type: String,
    enum: ["cash", "card", "online", "check"],
  },
  processedBy: {
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

// Validation to ensure payment date is set when status is paid
fineSchema.pre('save', function(next) {
  if (this.paymentStatus === 'paid' && !this.paymentDate) {
    this.paymentDate = new Date();
  }
  next();
});

// Indexes for efficient searching
fineSchema.index({ userId: 1 });
fineSchema.index({ transactionId: 1 });
fineSchema.index({ paymentStatus: 1 });
fineSchema.index({ createdAt: 1 });

const Fine = mongoose.model("Fine", fineSchema);

export default Fine;
