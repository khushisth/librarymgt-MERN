import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/user.js';
import Author from '../models/author.js';
import Category from '../models/category.js';
import Book from '../models/book.js';
import Transaction from '../models/transaction.js';
import Fine from '../models/fine.js';
import Reservation from '../models/reservation.js';

// Load environment variables
dotenv.config();

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for seeding...');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

// Sample data
const sampleUsers = [
  {
    username: 'admin',
    email: 'admin@library.com',
    password: 'Admin123!',
    name: 'System Administrator',
    phone: '+1234567890',
    address: '123 Admin Street, City, State',
    role: 'admin',
    status: 'active'
  },
  {
    username: 'librarian1',
    email: 'librarian@library.com',
    password: 'Librarian123!',
    name: 'Jane Smith',
    phone: '+1234567891',
    address: '456 Library Ave, City, State',
    role: 'librarian',
    status: 'active'
  },
  {
    username: 'john_doe',
    email: 'john.doe@email.com',
    password: 'User123!',
    name: 'John Doe',
    phone: '+1234567892',
    address: '789 User Lane, City, State',
    role: 'borrower',
    status: 'active'
  },
  {
    username: 'alice_wonder',
    email: 'alice@email.com',
    password: 'User123!',
    name: 'Alice Wonderland',
    phone: '+1234567893',
    address: '321 Wonder St, City, State',
    role: 'borrower',
    status: 'active'
  },
  {
    username: 'bob_builder',
    email: 'bob@email.com',
    password: 'User123!',
    name: 'Bob Builder',
    phone: '+1234567894',
    address: '654 Build Ave, City, State',
    role: 'borrower',
    status: 'active'
  }
];

const sampleAuthors = [
  {
    name: 'J.K. Rowling',
    biography: 'British author, best known for the Harry Potter series.',
    birthDate: new Date('1965-07-31'),
    nationality: 'British'
  },
  {
    name: 'George Orwell',
    biography: 'English novelist and essayist, journalist and critic.',
    birthDate: new Date('1903-06-25'),
    deathDate: new Date('1950-01-21'),
    nationality: 'British'
  },
  {
    name: 'Jane Austen',
    biography: 'English novelist known for her wit and social commentary.',
    birthDate: new Date('1775-12-16'),
    deathDate: new Date('1817-07-18'),
    nationality: 'British'
  },
  {
    name: 'Stephen King',
    biography: 'American author of horror, supernatural fiction, suspense, and fantasy novels.',
    birthDate: new Date('1947-09-21'),
    nationality: 'American'
  },
  {
    name: 'Agatha Christie',
    biography: 'English writer known for her detective novels.',
    birthDate: new Date('1890-09-15'),
    deathDate: new Date('1976-01-12'),
    nationality: 'British'
  }
];

const sampleCategories = [
  {
    name: 'Fiction',
    description: 'Literary works of imaginative narration'
  },
  {
    name: 'Non-Fiction',
    description: 'Factual and informational books'
  },
  {
    name: 'Science Fiction',
    description: 'Fiction dealing with futuristic concepts'
  },
  {
    name: 'Mystery',
    description: 'Fiction dealing with puzzling crimes'
  },
  {
    name: 'Romance',
    description: 'Fiction focusing on romantic relationships'
  },
  {
    name: 'Horror',
    description: 'Fiction intended to frighten or create suspense'
  },
  {
    name: 'Biography',
    description: 'Accounts of real people\'s lives'
  },
  {
    name: 'History',
    description: 'Books about past events'
  },
  {
    name: 'Science',
    description: 'Books about scientific topics'
  },
  {
    name: 'Technology',
    description: 'Books about technological subjects'
  }
];

// Seed functions
const seedUsers = async () => {
  console.log('Seeding users...');
  
  for (const userData of sampleUsers) {
    const existingUser = await User.findOne({ username: userData.username });
    if (!existingUser) {
      const salt = await bcrypt.genSalt(12);
      userData.password = await bcrypt.hash(userData.password, salt);
      await User.create(userData);
      console.log(`Created user: ${userData.username}`);
    }
  }
};

const seedAuthors = async () => {
  console.log('Seeding authors...');
  
  for (const authorData of sampleAuthors) {
    const existingAuthor = await Author.findOne({ name: authorData.name });
    if (!existingAuthor) {
      await Author.create(authorData);
      console.log(`Created author: ${authorData.name}`);
    }
  }
};

const seedCategories = async () => {
  console.log('Seeding categories...');
  
  for (const categoryData of sampleCategories) {
    const existingCategory = await Category.findOne({ name: categoryData.name });
    if (!existingCategory) {
      await Category.create(categoryData);
      console.log(`Created category: ${categoryData.name}`);
    }
  }
};

const seedBooks = async () => {
  console.log('Seeding books...');
  
  const authors = await Author.find();
  const categories = await Category.find();
  
  if (authors.length === 0 || categories.length === 0) {
    console.log('No authors or categories found. Skipping book seeding.');
    return;
  }
  
  const sampleBooks = [
    {
      isbn: '978-0-7475-3269-9',
      title: 'Harry Potter and the Philosopher\'s Stone',
      authors: [authors.find(a => a.name === 'J.K. Rowling')?._id],
      publisher: 'Bloomsbury',
      publicationDate: new Date('1997-06-26'),
      categories: [categories.find(c => c.name === 'Fiction')?._id],
      totalCopies: 5,
      availableCopies: 3,
      location: 'A1-001',
      description: 'The first book in the Harry Potter series.',
      language: 'English',
      pages: 223
    },
    {
      isbn: '978-0-452-28423-4',
      title: '1984',
      authors: [authors.find(a => a.name === 'George Orwell')?._id],
      publisher: 'Secker & Warburg',
      publicationDate: new Date('1949-06-08'),
      categories: [categories.find(c => c.name === 'Fiction')?._id, categories.find(c => c.name === 'Science Fiction')?._id],
      totalCopies: 4,
      availableCopies: 2,
      location: 'B2-045',
      description: 'A dystopian social science fiction novel.',
      language: 'English',
      pages: 328
    },
    {
      isbn: '978-0-14-143951-8',
      title: 'Pride and Prejudice',
      authors: [authors.find(a => a.name === 'Jane Austen')?._id],
      publisher: 'T. Egerton',
      publicationDate: new Date('1813-01-28'),
      categories: [categories.find(c => c.name === 'Fiction')?._id, categories.find(c => c.name === 'Romance')?._id],
      totalCopies: 3,
      availableCopies: 3,
      location: 'C1-012',
      description: 'A romantic novel of manners.',
      language: 'English',
      pages: 432
    },
    {
      isbn: '978-0-385-12167-8',
      title: 'The Shining',
      authors: [authors.find(a => a.name === 'Stephen King')?._id],
      publisher: 'Doubleday',
      publicationDate: new Date('1977-01-28'),
      categories: [categories.find(c => c.name === 'Horror')?._id, categories.find(c => c.name === 'Fiction')?._id],
      totalCopies: 2,
      availableCopies: 1,
      location: 'D3-078',
      description: 'A horror novel about a haunted hotel.',
      language: 'English',
      pages: 447
    },
    {
      isbn: '978-0-00-712498-5',
      title: 'Murder on the Orient Express',
      authors: [authors.find(a => a.name === 'Agatha Christie')?._id],
      publisher: 'Collins Crime Club',
      publicationDate: new Date('1934-01-01'),
      categories: [categories.find(c => c.name === 'Mystery')?._id, categories.find(c => c.name === 'Fiction')?._id],
      totalCopies: 3,
      availableCopies: 0,
      location: 'E1-023',
      description: 'A detective novel featuring Hercule Poirot.',
      language: 'English',
      pages: 256
    }
  ];
  
  for (const bookData of sampleBooks) {
    const existingBook = await Book.findOne({ isbn: bookData.isbn });
    if (!existingBook) {
      await Book.create(bookData);
      console.log(`Created book: ${bookData.title}`);
    }
  }
};

// Main seeding function
const seedDatabase = async () => {
  try {
    await connectDB();
    
    console.log('🌱 Starting database seeding...');
    
    await seedUsers();
    await seedAuthors();
    await seedCategories();
    await seedBooks();
    
    console.log('✅ Database seeding completed successfully!');
    console.log('\n📋 Default accounts created:');
    console.log('Admin: admin / Admin123!');
    console.log('Librarian: librarian1 / Librarian123!');
    console.log('Borrower: john_doe / User123!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  }
};

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
}

export default seedDatabase;
