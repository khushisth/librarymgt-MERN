import React, { useState, useEffect, createContext, useContext } from 'react';
import './App.css';

// Context for authentication
const AuthContext = createContext();

// API base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Utility function for API calls
const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Authentication Provider
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token and get user profile
      apiCall('/users/profile')
        .then(response => {
          setUser(response.data.user);
        })
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    try {
      const response = await apiCall('/users/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const register = async (userData) => {
    try {
      const response = await apiCall('/users/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      return response;
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Login Component
const Login = ({ onToggleMode }) => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(formData.username, formData.password);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>📚 Library Management System</h2>
        <h3>Login</h3>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username:</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <p>
          Don't have an account?{' '}
          <button onClick={onToggleMode} className="link-button">
            Register here
          </button>
        </p>
      </div>
    </div>
  );
};

// Register Component
const Register = ({ onToggleMode }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    name: '',
    phone: '',
    address: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await register(formData);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>📚 Library Management System</h2>
        <h3>Register</h3>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username:</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label>Full Name:</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label>Phone:</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label>Address:</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              disabled={loading}
              rows="3"
            />
          </div>
          
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        
        <p>
          Already have an account?{' '}
          <button onClick={onToggleMode} className="link-button">
            Login here
          </button>
        </p>
      </div>
    </div>
  );
};

// Header Component
const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <div className="header-content">
        <h1>📚 Library Management System</h1>
        <div className="user-info">
          <span>Welcome, {user?.name} ({user?.role})</span>
          <button onClick={logout} className="btn-secondary">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

// Navigation Component
const Navigation = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();

  const tabs = [
    { id: 'books', label: '📖 Books', roles: ['admin', 'librarian', 'borrower'] },
    { id: 'transactions', label: '🔄 My Transactions', roles: ['borrower'] },
    { id: 'manage-transactions', label: '🔄 Manage Transactions', roles: ['admin', 'librarian'] },
    { id: 'reservations', label: '📅 Reservations', roles: ['admin', 'librarian', 'borrower'] },
    { id: 'fines', label: '💰 Fines', roles: ['admin', 'librarian', 'borrower'] },
    { id: 'users', label: '👥 Users', roles: ['admin', 'librarian'] },
    { id: 'authors', label: '✍️ Authors', roles: ['admin', 'librarian'] },
    { id: 'categories', label: '📂 Categories', roles: ['admin', 'librarian'] },
    { id: 'profile', label: '👤 Profile', roles: ['admin', 'librarian', 'borrower'] },
  ];

  const visibleTabs = tabs.filter(tab => tab.roles.includes(user?.role));

  return (
    <nav className="navigation">
      {visibleTabs.map(tab => (
        <button
          key={tab.id}
          className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => setActiveTab(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
};

// Books Component
const Books = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const { user } = useAuth();

  const [newBook, setNewBook] = useState({
    isbn: '',
    title: '',
    publisher: '',
    publicationDate: '',
    totalCopies: '',
    availableCopies: '',
    location: '',
    description: '',
    language: 'English',
    pages: '',
  });

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await apiCall('/books');
      setBooks(response.data.books);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const endpoint = searchTerm ? `/books?search=${encodeURIComponent(searchTerm)}` : '/books';
      const response = await apiCall(endpoint);
      setBooks(response.data.books);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    try {
      await apiCall('/books', {
        method: 'POST',
        body: JSON.stringify(newBook),
      });
      setShowAddForm(false);
      setNewBook({
        isbn: '',
        title: '',
        publisher: '',
        publicationDate: '',
        totalCopies: '',
        availableCopies: '',
        location: '',
        description: '',
        language: 'English',
        pages: '',
      });
      fetchBooks();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleReserveBook = async (bookId) => {
    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7); // 7 days from now

      await apiCall('/reservations', {
        method: 'POST',
        body: JSON.stringify({
          bookId,
          expiryDate: expiryDate.toISOString(),
        }),
      });

      alert('Book reserved successfully!');
      fetchBooks();
    } catch (error) {
      alert(error.message);
    }
  };

  if (loading) return <div className="loading">Loading books...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="books-container">
      <div className="books-header">
        <h2>📖 Books Catalog</h2>
        {['admin', 'librarian'].includes(user?.role) && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-primary"
          >
            {showAddForm ? 'Cancel' : 'Add New Book'}
          </button>
        )}
      </div>

      <div className="search-container">
        <input
          type="text"
          placeholder="Search books by title, author, or ISBN..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch} className="btn-secondary">
          Search
        </button>
      </div>

      {showAddForm && (
        <div className="add-book-form">
          <h3>Add New Book</h3>
          <form onSubmit={handleAddBook}>
            <div className="form-row">
              <div className="form-group">
                <label>ISBN:</label>
                <input
                  type="text"
                  value={newBook.isbn}
                  onChange={(e) => setNewBook({...newBook, isbn: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Title:</label>
                <input
                  type="text"
                  value={newBook.title}
                  onChange={(e) => setNewBook({...newBook, title: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Publisher:</label>
                <input
                  type="text"
                  value={newBook.publisher}
                  onChange={(e) => setNewBook({...newBook, publisher: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Publication Date:</label>
                <input
                  type="date"
                  value={newBook.publicationDate}
                  onChange={(e) => setNewBook({...newBook, publicationDate: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Total Copies:</label>
                <input
                  type="number"
                  value={newBook.totalCopies}
                  onChange={(e) => setNewBook({...newBook, totalCopies: e.target.value})}
                  required
                  min="1"
                />
              </div>
              <div className="form-group">
                <label>Available Copies:</label>
                <input
                  type="number"
                  value={newBook.availableCopies}
                  onChange={(e) => setNewBook({...newBook, availableCopies: e.target.value})}
                  required
                  min="0"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Location/Shelf:</label>
                <input
                  type="text"
                  value={newBook.location}
                  onChange={(e) => setNewBook({...newBook, location: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Language:</label>
                <input
                  type="text"
                  value={newBook.language}
                  onChange={(e) => setNewBook({...newBook, language: e.target.value})}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Description:</label>
              <textarea
                value={newBook.description}
                onChange={(e) => setNewBook({...newBook, description: e.target.value})}
                rows="3"
              />
            </div>

            <button type="submit" className="btn-primary">Add Book</button>
          </form>
        </div>
      )}

      <div className="books-grid">
        {books.map(book => (
          <div key={book._id} className="book-card">
            <h3>{book.title}</h3>
            <p><strong>ISBN:</strong> {book.isbn}</p>
            <p><strong>Authors:</strong> {book.authors?.map(author => author.name).join(', ')}</p>
            <p><strong>Publisher:</strong> {book.publisher}</p>
            <p><strong>Available:</strong> {book.availableCopies}/{book.totalCopies}</p>
            <p><strong>Location:</strong> {book.location}</p>

            <div className="book-actions">
              {user?.role === 'borrower' && book.availableCopies > 0 && (
                <button
                  onClick={() => handleReserveBook(book._id)}
                  className="btn-primary"
                >
                  Reserve Book
                </button>
              )}

              {book.availableCopies === 0 && (
                <span className="unavailable">Not Available</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Transactions Component
const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await apiCall('/transactions');
      setTransactions(response.data.transactions);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isOverdue = (dueDate, status) => {
    return status === 'issued' && new Date(dueDate) < new Date();
  };

  if (loading) return <div className="loading">Loading transactions...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="transactions-container">
      <h2>🔄 {user?.role === 'borrower' ? 'My Transactions' : 'All Transactions'}</h2>

      {transactions.length === 0 ? (
        <p>No transactions found.</p>
      ) : (
        <div className="transactions-table">
          <table>
            <thead>
              <tr>
                <th>Book</th>
                <th>User</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Return Date</th>
                <th>Status</th>
                <th>Fine</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(transaction => (
                <tr key={transaction._id} className={isOverdue(transaction.dueDate, transaction.status) ? 'overdue' : ''}>
                  <td>{transaction.bookId?.title}</td>
                  <td>{transaction.userId?.name}</td>
                  <td>{formatDate(transaction.issueDate)}</td>
                  <td>{formatDate(transaction.dueDate)}</td>
                  <td>{transaction.returnDate ? formatDate(transaction.returnDate) : '-'}</td>
                  <td>
                    <span className={`status ${transaction.status}`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td>${transaction.fineAmount || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Profile Component
const Profile = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await apiCall('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });
      setSuccess('Profile updated successfully!');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="profile-container">
      <h2>👤 My Profile</h2>

      <div className="profile-info">
        <div className="info-card">
          <h3>Account Information</h3>
          <p><strong>Username:</strong> {user?.username}</p>
          <p><strong>Role:</strong> {user?.role}</p>
          <p><strong>Status:</strong> {user?.status}</p>
          <p><strong>Member Since:</strong> {user?.createdAt ? formatDate(user.createdAt) : 'N/A'}</p>
        </div>
      </div>

      <div className="profile-form">
        <h3>Update Profile</h3>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name:</label>
            <input
              type="text"
              name="name"
              value={profileData.name}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={profileData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Phone:</label>
            <input
              type="tel"
              name="phone"
              value={profileData.phone}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Address:</label>
            <textarea
              name="address"
              value={profileData.address}
              onChange={handleChange}
              required
              disabled={loading}
              rows="3"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString();
};

// Main Dashboard Component
const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('books');
  const { user } = useAuth();

  const renderContent = () => {
    switch (activeTab) {
      case 'books':
        return <Books />;
      case 'transactions':
      case 'manage-transactions':
        return <Transactions />;
      case 'profile':
        return <Profile />;
      case 'reservations':
        return <div className="coming-soon">📅 Reservations - Coming Soon</div>;
      case 'fines':
        return <div className="coming-soon">💰 Fines - Coming Soon</div>;
      case 'users':
        return <div className="coming-soon">👥 Users Management - Coming Soon</div>;
      case 'authors':
        return <div className="coming-soon">✍️ Authors Management - Coming Soon</div>;
      case 'categories':
        return <div className="coming-soon">📂 Categories Management - Coming Soon</div>;
      default:
        return <Books />;
    }
  };

  return (
    <div className="dashboard">
      <Header />
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
};

// Main App Component
const App = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return isLoginMode ? (
      <Login onToggleMode={() => setIsLoginMode(false)} />
    ) : (
      <Register onToggleMode={() => setIsLoginMode(true)} />
    );
  }

  return <Dashboard />;
};

// Root App with Provider
const AppWithProvider = () => {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
};

export default AppWithProvider;
