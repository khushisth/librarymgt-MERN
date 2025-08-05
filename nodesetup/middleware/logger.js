import fs from 'fs';
import path from 'path';

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Request logging middleware
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  
  // Log request
  const requestLog = {
    timestamp,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    userId: req.user ? req.user._id : null,
    userRole: req.user ? req.user.role : null
  };

  console.log(`[${timestamp}] ${req.method} ${req.originalUrl} - ${req.ip}`);

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - start;
    const responseLog = {
      ...requestLog,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      success: data.success !== false
    };

    // Log to console
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);

    // Log to file (async, non-blocking)
    const logEntry = JSON.stringify(responseLog) + '\n';
    const logFile = path.join(logsDir, `${new Date().toISOString().split('T')[0]}.log`);
    
    fs.appendFile(logFile, logEntry, (err) => {
      if (err) console.error('Error writing to log file:', err);
    });

    return originalJson.call(this, data);
  };

  next();
};

// Audit logging for sensitive operations
export const auditLogger = (action, details = {}) => {
  return (req, res, next) => {
    const timestamp = new Date().toISOString();
    
    const auditLog = {
      timestamp,
      action,
      userId: req.user ? req.user._id : null,
      userRole: req.user ? req.user.role : null,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      details: {
        ...details,
        method: req.method,
        url: req.originalUrl,
        params: req.params,
        query: req.query
      }
    };

    // Log to console
    console.log(`[AUDIT] ${timestamp} - ${action} by ${req.user?.username || 'anonymous'}`);

    // Log to audit file
    const logEntry = JSON.stringify(auditLog) + '\n';
    const auditFile = path.join(logsDir, `audit-${new Date().toISOString().split('T')[0]}.log`);
    
    fs.appendFile(auditFile, logEntry, (err) => {
      if (err) console.error('Error writing to audit log:', err);
    });

    next();
  };
};

// Security logging for failed authentication attempts
export const securityLogger = (event, details = {}) => {
  const timestamp = new Date().toISOString();
  
  const securityLog = {
    timestamp,
    event,
    details
  };

  console.log(`[SECURITY] ${timestamp} - ${event}`);

  const logEntry = JSON.stringify(securityLog) + '\n';
  const securityFile = path.join(logsDir, `security-${new Date().toISOString().split('T')[0]}.log`);
  
  fs.appendFile(securityFile, logEntry, (err) => {
    if (err) console.error('Error writing to security log:', err);
  });
};
