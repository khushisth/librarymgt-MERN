import mongoose from "mongoose";

// Schema for User for library management system
// Attributes:
// - username - string
// - password - string
// - role (admin, librarian, borrower) - Enum
// - email - string (With validation)
// - name - string
// - phone - string
// - address - string
// - status(active, inactive) - Enum
// - createdAt - TimeStamp
// - updatedAt - TimeStamp

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["admin", "librarian", "borrower"],
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
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

const User = mongoose.model("User", userSchema);

export default User;

