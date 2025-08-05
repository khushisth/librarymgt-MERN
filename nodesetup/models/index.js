// Central export file for all database models
// This file provides a convenient way to import all models

import User from "./user.js";
import Author from "./author.js";
import Category from "./category.js";
import Book from "./book.js";
import Transaction from "./transaction.js";
import Fine from "./fine.js";
import Reservation from "./reservation.js";

export {
  User,
  Author,
  Category,
  Book,
  Transaction,
  Fine,
  Reservation,
};

// Default export for convenience
export default {
  User,
  Author,
  Category,
  Book,
  Transaction,
  Fine,
  Reservation,
};
