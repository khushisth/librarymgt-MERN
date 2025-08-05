import mongoose from "mongoose";

// Schema for Reservation for library management system
// Attributes:
// - userId - ObjectId (reference to User)
// - bookId - ObjectId (reference to Book)
// - reservationDate - Date
// - expiryDate - Date
// - status - Enum (active, fulfilled, expired, cancelled)
// - priority - Number (for queue management)
// - notificationSent - Boolean
// - fulfilledBy - ObjectId (reference to User - librarian/admin, optional)
// - fulfilledDate - Date (optional)
// - notes - string (optional)
// - createdAt - TimeStamp
// - updatedAt - TimeStamp

const reservationSchema = new mongoose.Schema({
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
  reservationDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  expiryDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["active", "fulfilled", "expired", "cancelled"],
    default: "active",
  },
  priority: {
    type: Number,
    default: 1,
    min: 1,
  },
  notificationSent: {
    type: Boolean,
    default: false,
  },
  fulfilledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  fulfilledDate: {
    type: Date,
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

// Validation to ensure user doesn't have multiple active reservations for the same book
reservationSchema.index({ userId: 1, bookId: 1, status: 1 }, { 
  unique: true, 
  partialFilterExpression: { status: "active" } 
});

// Validation to ensure expiry date is after reservation date
reservationSchema.pre('save', function(next) {
  if (this.expiryDate <= this.reservationDate) {
    next(new Error('Expiry date must be after reservation date'));
  } else {
    next();
  }
});

// Indexes for efficient searching
reservationSchema.index({ userId: 1 });
reservationSchema.index({ bookId: 1 });
reservationSchema.index({ status: 1 });
reservationSchema.index({ expiryDate: 1 });
reservationSchema.index({ priority: 1 });

const Reservation = mongoose.model("Reservation", reservationSchema);

export default Reservation;
