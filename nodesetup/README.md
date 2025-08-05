# Library Management System API

A comprehensive RESTful API for managing library operations including user management, book catalog, transactions, fines, and reservations.

## 🚀 Features

- **User Management**: Registration, authentication, profile management with role-based access control
- **Book Catalog**: Complete book management with authors, categories, and availability tracking
- **Transaction System**: Book borrowing and returning with due date management
- **Fine Management**: Automated fine calculation and payment processing
- **Reservation System**: Book reservation queue with priority management
- **Security**: JWT authentication, rate limiting, input validation, and audit logging
- **Role-based Access**: Admin, Librarian, and Borrower roles with appropriate permissions

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, CORS, Rate Limiting, Input Sanitization
- **Validation**: Express Validator
- **Logging**: Custom audit and security logging

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd library-management-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   MONGODB_URI=mongodb://localhost:27017/library_management
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRE=7d
   PORT=5000
   NODE_ENV=development
   ```

4. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
Most endpoints require authentication via JWT token:
```
Authorization: Bearer <your-jwt-token>
```

### User Roles
- **Admin**: Full access to all operations
- **Librarian**: Can manage books, transactions, fines, and reservations
- **Borrower**: Can view books, manage own profile, create reservations

### Endpoints Overview

#### 🔐 Authentication & Users
- `POST /users/register` - Register new user
- `POST /users/login` - User login
- `GET /users/profile` - Get current user profile
- `PUT /users/profile` - Update user profile
- `PUT /users/change-password` - Change password
- `GET /users` - Get all users (Admin/Librarian)
- `GET /users/:id` - Get user by ID (Admin/Librarian)
- `PUT /users/:id/status` - Update user status (Admin)
- `DELETE /users/:id` - Delete user (Admin)

#### 📖 Books
- `GET /books` - Get all books with filtering
- `GET /books/:id` - Get book by ID
- `GET /books/stats` - Get book statistics (Admin/Librarian)
- `POST /books` - Create new book (Admin/Librarian)
- `PUT /books/:id` - Update book (Admin/Librarian)
- `PUT /books/:id/availability` - Update book availability (Admin/Librarian)
- `DELETE /books/:id` - Delete book (Admin)

#### ✍️ Authors
- `GET /authors` - Get all authors
- `GET /authors/:id` - Get author by ID with books
- `GET /authors/stats` - Get author statistics (Admin/Librarian)
- `POST /authors` - Create new author (Admin/Librarian)
- `PUT /authors/:id` - Update author (Admin/Librarian)
- `DELETE /authors/:id` - Delete author (Admin)

#### 📂 Categories
- `GET /categories` - Get all categories
- `GET /categories/tree` - Get category hierarchy tree
- `GET /categories/:id` - Get category by ID with books
- `GET /categories/stats` - Get category statistics (Admin/Librarian)
- `POST /categories` - Create new category (Admin/Librarian)
- `PUT /categories/:id` - Update category (Admin/Librarian)
- `DELETE /categories/:id` - Delete category (Admin)

#### 🔄 Transactions
- `GET /transactions` - Get all transactions
- `GET /transactions/:id` - Get transaction by ID
- `GET /transactions/overdue` - Get overdue transactions (Admin/Librarian)
- `GET /transactions/stats` - Get transaction statistics (Admin/Librarian)
- `POST /transactions/issue` - Issue book to user (Admin/Librarian)
- `PUT /transactions/:id/return` - Return book (Admin/Librarian)
- `PUT /transactions/:id/extend` - Extend due date (Admin/Librarian)

#### 💰 Fines
- `GET /fines` - Get all fines
- `GET /fines/:id` - Get fine by ID
- `GET /fines/user/:userId/outstanding` - Get user outstanding fines
- `GET /fines/stats` - Get fine statistics (Admin/Librarian)
- `POST /fines` - Create fine (Admin/Librarian)
- `PUT /fines/:id` - Update fine (Admin/Librarian)
- `PUT /fines/:id/pay` - Process fine payment (Admin/Librarian)
- `PUT /fines/:id/waive` - Waive fine (Admin/Librarian)
- `DELETE /fines/:id` - Delete fine (Admin)

#### 📅 Reservations
- `GET /reservations` - Get all reservations
- `GET /reservations/:id` - Get reservation by ID
- `GET /reservations/expired` - Get expired reservations (Admin/Librarian)
- `GET /reservations/book/:bookId/queue` - Get book reservation queue (Admin/Librarian)
- `GET /reservations/stats` - Get reservation statistics (Admin/Librarian)
- `POST /reservations` - Create reservation
- `PUT /reservations/:id/cancel` - Cancel reservation
- `PUT /reservations/:id/fulfill` - Fulfill reservation (Admin/Librarian)
- `PUT /reservations/auto-expire` - Auto-expire reservations (Admin/Librarian)

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Prevents API abuse with configurable limits
- **Input Validation**: Comprehensive request validation using express-validator
- **Data Sanitization**: Protection against NoSQL injection and XSS attacks
- **Security Headers**: Helmet.js for security headers
- **CORS**: Configurable cross-origin resource sharing
- **Audit Logging**: Comprehensive logging for security and compliance

## 📊 Response Format

All API responses follow a consistent format:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    // Validation errors (if any)
  ]
}
```

## 🚦 Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## 📝 Example Usage

### Register a new user
```bash
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "SecurePass123",
    "name": "John Doe",
    "phone": "+1234567890",
    "address": "123 Main St, City, State"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "password": "SecurePass123"
  }'
```

### Get books with filtering
```bash
curl -X GET "http://localhost:5000/api/books?search=javascript&available=true&page=1&limit=10"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions, please contact the development team or create an issue in the repository.
