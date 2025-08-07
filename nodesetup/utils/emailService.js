import nodemailer from 'nodemailer';

// Create email transporter
const createTransporter = () => {
  // For development, use ethereal email (fake SMTP)
  if (process.env.NODE_ENV === 'development') {
    return nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'ethereal.user@ethereal.email',
        pass: 'ethereal.pass'
      }
    });
  }
  
  // For production, use real SMTP service
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Email templates
const emailTemplates = {
  welcome: (user) => ({
    subject: '📚 Welcome to Library Management System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #667eea;">Welcome to Our Library! 📚</h2>
        <p>Dear ${user.name},</p>
        <p>Welcome to our Library Management System! Your account has been successfully created.</p>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>Account Details:</h3>
          <p><strong>Username:</strong> ${user.username}</p>
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Role:</strong> ${user.role}</p>
        </div>
        <p>You can now log in and start exploring our book collection!</p>
        <p>Best regards,<br>Library Management Team</p>
      </div>
    `
  }),

  bookDueReminder: (user, book, dueDate) => ({
    subject: '📅 Book Due Date Reminder',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ffc107;">Book Due Date Reminder ⏰</h2>
        <p>Dear ${user.name},</p>
        <p>This is a friendly reminder that the following book is due soon:</p>
        <div style="background: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h3>${book.title}</h3>
          <p><strong>ISBN:</strong> ${book.isbn}</p>
          <p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
        </div>
        <p>Please return the book on time to avoid late fees.</p>
        <p>Best regards,<br>Library Management Team</p>
      </div>
    `
  }),

  bookOverdue: (user, book, dueDate, fine) => ({
    subject: '🚨 Overdue Book Notice',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">Overdue Book Notice 🚨</h2>
        <p>Dear ${user.name},</p>
        <p>The following book is now overdue:</p>
        <div style="background: #f8d7da; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
          <h3>${book.title}</h3>
          <p><strong>ISBN:</strong> ${book.isbn}</p>
          <p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
          <p><strong>Fine Amount:</strong> $${fine}</p>
        </div>
        <p>Please return the book as soon as possible to avoid additional charges.</p>
        <p>Best regards,<br>Library Management Team</p>
      </div>
    `
  }),

  reservationAvailable: (user, book) => ({
    subject: '✅ Reserved Book Now Available',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Your Reserved Book is Available! ✅</h2>
        <p>Dear ${user.name},</p>
        <p>Great news! The book you reserved is now available for pickup:</p>
        <div style="background: #d4edda; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
          <h3>${book.title}</h3>
          <p><strong>ISBN:</strong> ${book.isbn}</p>
        </div>
        <p>Please visit the library within 3 days to collect your reserved book.</p>
        <p>Best regards,<br>Library Management Team</p>
      </div>
    `
  }),

  finePaymentConfirmation: (user, fine, transaction) => ({
    subject: '💰 Fine Payment Confirmation',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Payment Confirmation ✅</h2>
        <p>Dear ${user.name},</p>
        <p>Your fine payment has been successfully processed:</p>
        <div style="background: #d4edda; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>Payment Details:</h3>
          <p><strong>Amount:</strong> $${fine.amount}</p>
          <p><strong>Payment Method:</strong> ${fine.paymentMethod}</p>
          <p><strong>Transaction:</strong> ${transaction.bookId?.title}</p>
          <p><strong>Payment Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        <p>Thank you for your payment!</p>
        <p>Best regards,<br>Library Management Team</p>
      </div>
    `
  })
};

// Send email function
export const sendEmail = async (to, templateName, data) => {
  try {
    const transporter = createTransporter();
    const template = emailTemplates[templateName];
    
    if (!template) {
      throw new Error(`Email template '${templateName}' not found`);
    }
    
    const emailContent = template(data);
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'Library Management System <noreply@library.com>',
      to: to,
      subject: emailContent.subject,
      html: emailContent.html
    };
    
    const result = await transporter.sendMail(mailOptions);
    
    console.log('Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Bulk email function
export const sendBulkEmail = async (recipients, templateName, data) => {
  const results = [];
  
  for (const recipient of recipients) {
    try {
      const result = await sendEmail(recipient.email, templateName, { ...data, ...recipient });
      results.push({ email: recipient.email, ...result });
    } catch (error) {
      results.push({ email: recipient.email, success: false, error: error.message });
    }
  }
  
  return results;
};

// Schedule email reminders
export const scheduleReminders = async () => {
  try {
    // This would typically be called by a cron job
    const Transaction = (await import('../models/transaction.js')).default;
    const User = (await import('../models/user.js')).default;
    const Book = (await import('../models/book.js')).default;
    
    // Find books due in 2 days
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    
    const upcomingDue = await Transaction.find({
      status: 'issued',
      dueDate: {
        $gte: new Date(),
        $lte: twoDaysFromNow
      }
    })
    .populate('userId', 'name email')
    .populate('bookId', 'title isbn');
    
    // Send due date reminders
    for (const transaction of upcomingDue) {
      await sendEmail(
        transaction.userId.email,
        'bookDueReminder',
        {
          user: transaction.userId,
          book: transaction.bookId,
          dueDate: transaction.dueDate
        }
      );
    }
    
    // Find overdue books
    const overdue = await Transaction.find({
      status: 'issued',
      dueDate: { $lt: new Date() }
    })
    .populate('userId', 'name email')
    .populate('bookId', 'title isbn');
    
    // Send overdue notices
    for (const transaction of overdue) {
      const overdueDays = Math.ceil((new Date() - transaction.dueDate) / (1000 * 60 * 60 * 24));
      const fine = overdueDays * 1; // $1 per day
      
      await sendEmail(
        transaction.userId.email,
        'bookOverdue',
        {
          user: transaction.userId,
          book: transaction.bookId,
          dueDate: transaction.dueDate,
          fine: fine
        }
      );
    }
    
    console.log(`Sent ${upcomingDue.length} due date reminders and ${overdue.length} overdue notices`);
    
  } catch (error) {
    console.error('Error scheduling reminders:', error);
  }
};
