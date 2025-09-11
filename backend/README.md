# Loan App Backend API

A comprehensive Node.js backend API for a loan application management system built with Express.js, MongoDB, and JWT authentication.

## Features

- **User Management**: Registration, authentication, and profile management
- **Loan Products**: Multiple loan types (personal, home, auto, business, student)
- **Loan Applications**: Complete application workflow with document uploads
- **Loan Management**: Active loan tracking, payments, and payment history
- **Admin Dashboard**: Application review, approval workflow, and analytics
- **Role-based Access**: Customer, loan officer, and admin roles
- **File Uploads**: Secure document upload with validation
- **Risk Assessment**: Automated risk scoring for applications
- **Payment Processing**: Loan payment tracking and history

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Validation**: Express Validator
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Winston
- **Password Hashing**: Bcrypt

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/loanapp
   JWT_SECRET=your-secret-key-here-change-in-production
   JWT_EXPIRES_IN=7d
   BCRYPT_SALT_ROUNDS=12
   ```
4. Start the server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/upload-profile-picture` - Upload profile picture

### Loan Products
- `GET /api/loans/products` - Get all active loan products
- `GET /api/loans/products/:id` - Get specific loan product
- `POST /api/loans/calculate` - Calculate loan terms

### User Loans
- `GET /api/loans/my-loans` - Get user's loans
- `GET /api/loans/my-loans/:id` - Get specific loan details
- `POST /api/loans/my-loans/:id/payments` - Make a payment
- `GET /api/loans/my-loans/:id/payments` - Get payment history

### Applications
- `POST /api/applications` - Create new application
- `GET /api/applications/my-applications` - Get user's applications
- `GET /api/applications/:id` - Get application details
- `PUT /api/applications/:id` - Update application
- `POST /api/applications/:id/submit` - Submit application
- `POST /api/applications/:id/documents` - Upload document
- `DELETE /api/applications/:id/documents/:docType` - Remove document

### Admin/Loan Officer Routes
- `GET /api/users/dashboard` - Dashboard statistics
- `GET /api/users/applications` - Get all applications
- `GET /api/users/applications/:id` - Get application details
- `PUT /api/users/applications/:id/assign` - Assign loan officer
- `PUT /api/users/applications/:id/review` - Review application
- `POST /api/users/loan-products` - Create loan product (Admin only)
- `PUT /api/users/loan-products/:id` - Update loan product (Admin only)
- `GET /api/users/loans` - Get all loans
- `GET /api/users/officers` - Get loan officers

## Data Models

### User
- Personal information, contact details, employment info
- Address and financial details
- Role-based access (customer, loan_officer, admin)
- Document uploads and verification status

### Loan Product
- Product details (name, description, type)
- Interest rates, loan amounts, terms
- Eligibility criteria and required documents
- Fee structure

### Loan Application
- Application details and financial information
- Document management
- Status tracking and review history
- Risk assessment scoring

### Loan
- Active loan management
- Repayment schedule generation
- Payment tracking and history
- Loan status management

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting
- CORS protection
- Helmet security headers
- File upload restrictions

## Default Users

The system seeds with default users for testing:

**Admin User:**
- Email: admin@loanapp.com
- Password: Admin123!

**Loan Officer:**
- Email: officer@loanapp.com
- Password: Officer123!

## File Structure

```
backend/
├── config/
│   └── database.js
├── controllers/
│   ├── authController.js
│   ├── loanController.js
│   ├── applicationController.js
│   └── adminController.js
├── middleware/
│   ├── auth.js
│   ├── errorHandler.js
│   ├── validation.js
│   └── upload.js
├── models/
│   ├── User.js
│   ├── LoanProduct.js
│   ├── LoanApplication.js
│   └── Loan.js
├── routes/
│   ├── auth.js
│   ├── loans.js
│   ├── applications.js
│   └── users.js
├── utils/
│   ├── logger.js
│   ├── jwt.js
│   └── seedData.js
├── uploads/
├── logs/
└── server.js
```

## Development

- Run in development mode: `npm run dev`
- Run tests: `npm test`
- Start production server: `npm start`

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.