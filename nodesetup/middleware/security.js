// Note: Install these packages with: npm install express-rate-limit helmet express-mongo-sanitize xss-clean hpp
// For now, we'll create basic implementations

// Basic rate limiting implementation
const rateLimit = (options) => {
  const requests = new Map();

  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - options.windowMs;

    // Clean old entries
    for (const [ip, timestamps] of requests.entries()) {
      requests.set(ip, timestamps.filter(time => time > windowStart));
      if (requests.get(ip).length === 0) {
        requests.delete(ip);
      }
    }

    // Check current IP
    const ipRequests = requests.get(key) || [];
    if (ipRequests.length >= options.max) {
      return res.status(429).json(options.message);
    }

    // Add current request
    ipRequests.push(now);
    requests.set(key, ipRequests);

    next();
  };
};

// Basic helmet implementation
const helmet = (options = {}) => {
  return (req, res, next) => {
    // Set security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Referrer-Policy', 'no-referrer');
    next();
  };
};

// Basic mongo sanitize
const mongoSanitize = () => {
  return (req, res, next) => {
    // Remove any keys that start with '$' or contain '.'
    const sanitize = (obj) => {
      if (obj && typeof obj === 'object') {
        for (const key in obj) {
          if (key.startsWith('$') || key.includes('.')) {
            delete obj[key];
          } else if (typeof obj[key] === 'object') {
            sanitize(obj[key]);
          }
        }
      }
    };

    if (req.body) sanitize(req.body);
    if (req.query) sanitize(req.query);
    if (req.params) sanitize(req.params);

    next();
  };
};

// Basic XSS clean
const xss = () => {
  return (req, res, next) => {
    const clean = (obj) => {
      if (obj && typeof obj === 'object') {
        for (const key in obj) {
          if (typeof obj[key] === 'string') {
            obj[key] = obj[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
          } else if (typeof obj[key] === 'object') {
            clean(obj[key]);
          }
        }
      }
    };

    if (req.body) clean(req.body);
    if (req.query) clean(req.query);

    next();
  };
};

// Basic HPP
const hpp = () => {
  return (req, res, next) => {
    // Convert arrays to single values for query parameters
    if (req.query) {
      for (const key in req.query) {
        if (Array.isArray(req.query[key])) {
          req.query[key] = req.query[key][req.query[key].length - 1];
        }
      }
    }
    next();
  };
};

// Rate limiting middleware
export const createRateLimit = (windowMs = 15 * 60 * 1000, max = 100, message = 'Too many requests') => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Specific rate limits for different endpoints
export const authRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts
  'Too many authentication attempts, please try again later'
);

export const generalRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests
  'Too many requests from this IP, please try again later'
);

export const strictRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  20, // 20 requests
  'Rate limit exceeded for this operation'
);

// Security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Data sanitization middleware
export const sanitizeData = [
  mongoSanitize(), // Prevent NoSQL injection
  xss(), // Clean user input from malicious HTML
  hpp() // Prevent HTTP Parameter Pollution
];

// CORS configuration
export const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Input validation and sanitization
export const sanitizeInput = (req, res, next) => {
  // Trim whitespace from string inputs
  const sanitizeObject = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key].trim();
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    }
  };

  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);

  next();
};

// File upload security (if needed later)
export const fileUploadSecurity = {
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
};
