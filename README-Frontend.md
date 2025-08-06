# 📚 Library Management System - Frontend

A modern, responsive React frontend for the Library Management System API.

## 🚀 Features

### 🔐 Authentication & Authorization
- **User Registration & Login** - Secure authentication with JWT tokens
- **Role-based Access Control** - Different interfaces for Admin, Librarian, and Borrower roles
- **Profile Management** - Users can update their personal information

### 📖 Book Management
- **Book Catalog** - Browse and search through the library's book collection
- **Advanced Search** - Search by title, author, ISBN, or keywords
- **Book Details** - View comprehensive book information including availability
- **Add New Books** - Admin/Librarian can add new books to the catalog
- **Book Reservations** - Borrowers can reserve unavailable books

### 🔄 Transaction Management
- **My Transactions** - Borrowers can view their borrowing history
- **Transaction Overview** - Staff can manage all library transactions
- **Due Date Tracking** - Visual indicators for overdue books
- **Return Management** - Process book returns and calculate fines

### 👤 User Experience
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Modern UI** - Clean, intuitive interface with smooth animations
- **Real-time Updates** - Dynamic content updates without page refresh
- **Error Handling** - Comprehensive error messages and loading states

## 🛠️ Technology Stack

- **React 18** - Modern React with hooks and functional components
- **CSS3** - Custom styling with flexbox and grid layouts
- **Fetch API** - HTTP client for API communication
- **Context API** - State management for authentication
- **Local Storage** - Persistent authentication token storage

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager
- Library Management System API running on `http://localhost:5000`

## 🔧 Installation & Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

4. **Run Tests**
   ```bash
   npm test
   ```

## 🌐 API Configuration

The frontend is configured to connect to the backend API at `http://localhost:5000/api`. 

To change the API URL, update the `API_BASE_URL` constant in `app.jsx`:

```javascript
const API_BASE_URL = 'http://your-api-url:port/api';
```

## 👥 User Roles & Permissions

### 🔴 Admin
- Full access to all features
- User management
- System configuration
- All book and transaction operations

### 🟡 Librarian
- Book catalog management
- Transaction processing
- Fine management
- User assistance

### 🟢 Borrower
- Browse book catalog
- View personal transactions
- Reserve books
- Update profile
- View fines

## 📱 Responsive Design

The application is fully responsive and optimized for:
- **Desktop** - Full-featured interface with sidebar navigation
- **Tablet** - Adapted layout with touch-friendly controls
- **Mobile** - Compact interface with hamburger menu

## 🎨 UI Components

### Authentication
- Login form with validation
- Registration form with comprehensive fields
- Password strength indicators
- Error handling and success messages

### Dashboard
- Role-based navigation menu
- Quick stats and overview cards
- Recent activity feed
- Search functionality

### Book Management
- Grid/list view toggle
- Advanced filtering options
- Book detail modals
- Add/edit book forms

### Transaction Management
- Sortable transaction tables
- Status indicators
- Date range filters
- Export functionality

## 🔒 Security Features

- **JWT Token Management** - Secure token storage and automatic refresh
- **Route Protection** - Role-based route access control
- **Input Validation** - Client-side form validation
- **XSS Protection** - Sanitized user inputs
- **CSRF Protection** - Token-based request authentication

## 🚀 Performance Optimizations

- **Code Splitting** - Lazy loading of components
- **Image Optimization** - Responsive images with proper sizing
- **Caching** - Efficient API response caching
- **Minification** - Optimized production builds

## 📊 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🔧 Development

### Project Structure
```
src/
├── app.jsx          # Main application component
├── App.css          # Global styles
├── index.js         # React DOM rendering
└── components/      # Reusable components
    ├── Auth/        # Authentication components
    ├── Books/       # Book management components
    ├── Dashboard/   # Dashboard components
    └── Common/      # Shared components

public/
├── index.html       # HTML template
├── manifest.json    # PWA manifest
└── favicon.ico      # App icon
```

### Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run test suite
- `npm run eject` - Eject from Create React App

## 🐛 Troubleshooting

### Common Issues

1. **API Connection Error**
   - Ensure backend server is running on port 5000
   - Check CORS configuration
   - Verify API endpoints

2. **Authentication Issues**
   - Clear browser local storage
   - Check JWT token expiration
   - Verify user credentials

3. **Build Errors**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility
   - Update dependencies

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**Built with ❤️ for efficient library management**
