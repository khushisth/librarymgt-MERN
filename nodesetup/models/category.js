import mongoose from "mongoose";

// Schema for Category/Genre for library management system
// Attributes:
// - name - string
// - description - string (optional)
// - parentCategory - ObjectId (optional, for subcategories)
// - status - Enum (active, inactive)
// - createdAt - TimeStamp
// - updatedAt - TimeStamp

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
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

// Index for efficient searching
categorySchema.index({ name: 1 });
categorySchema.index({ status: 1 });

const Category = mongoose.model("Category", categorySchema);

export default Category;
