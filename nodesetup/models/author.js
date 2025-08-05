import mongoose from "mongoose";

// Schema for Author for library management system
// Attributes:
// - name - string
// - biography - string (optional)
// - birthDate - Date (optional)
// - deathDate - Date (optional)
// - nationality - string (optional)
// - createdAt - TimeStamp
// - updatedAt - TimeStamp

const authorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  biography: {
    type: String,
    trim: true,
  },
  birthDate: {
    type: Date,
  },
  deathDate: {
    type: Date,
  },
  nationality: {
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

// Index for efficient searching
authorSchema.index({ name: 1 });

const Author = mongoose.model("Author", authorSchema);

export default Author;
