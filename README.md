# Loan Application Management System

A full-stack loan application management system built with React frontend and Node.js backend. The system supports multiple user roles (customers, loan officers, and admins) and provides a complete loan application workflow from application to approval and loan management.

## 🚀 Features

### Frontend (React)
- **Multi-step Loan Application**: Interactive loan application with real-time calculations
- **Dashboard**: Role-based dashboards with personalized data and statistics  
- **Authentication**: Complete user registration and login system
- **Responsive Design**: Mobile-friendly interface with modern UI
- **Real-time Updates**: Live data synchronization with backend

### Backend (Node.js/Express)
- **RESTful API**: 30+ endpoints covering all functionality
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Customer, Loan Officer, and Admin roles
- **File Upload**: Document upload for loan applications
- **Risk Assessment**: Automated loan risk scoring
- **Loan Management**: Complete loan lifecycle management
- **Payment Processing**: Payment tracking and history

## 🛠 Tech Stack

### Frontend
- React 19 with hooks and context
- React Router for navigation
- Axios for API calls
- CSS3 with modern styling

### Backend
- Node.js with Express.js
- MongoDB with Mongoose ODM
- JWT for authentication
- Bcrypt for password hashing
- Multer for file uploads
- Winston for logging

## 📁 Project Structure

```
loan app/
├── backend/                 # Node.js backend
│   ├── config/             # Database configuration
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Authentication, validation, etc.
│   ├── models/            # MongoDB models
│   ├── routes/            # Express routes
│   ├── utils/             # Utilities and helpers
│   └── server.js          # Main server file
│
└── welfare/               # React frontend
    ├── public/
    └── src/
        ├── components/    # React components
        ├── contexts/      # React contexts
        ├── services/      # API services
        ├── utils/         # Frontend utilities
        └── App.jsx        # Main app component
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file:
   ```env
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

The backend will start on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd welfare
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will start on `http://localhost:5173`

## 👥 User Roles & Access

### Customer
- Apply for loans
- View application status
- Manage active loans
- Make payments
- View payment history

### Loan Officer
- Review loan applications
- Approve/reject applications
- Assign applications to officers
- View dashboard statistics

### Admin
- All loan officer permissions
- Create and manage loan products
- View system-wide analytics
- Manage users and officers

## 🔐 Default Login Credentials

The system includes seeded accounts for testing:

**Admin Account:**
- Email: `admin@loanapp.com`
- Password: `Admin123456789!`

**Loan Officer Account:**
- Email: `officer@loanapp.com`
- Password: `Officer123456789!`

## 📱 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Loan Endpoints
- `GET /api/loans/products` - Get available loan products
- `POST /api/loans/calculate` - Calculate loan terms
- `GET /api/loans/my-loans` - Get user's loans
- `POST /api/loans/my-loans/:id/payments` - Make payment

### Application Endpoints
- `POST /api/applications` - Create loan application
- `GET /api/applications/my-applications` - Get user's applications
- `POST /api/applications/:id/submit` - Submit application
- `POST /api/applications/:id/documents` - Upload documents

### Admin Endpoints
- `GET /api/users/dashboard` - Get dashboard statistics
- `GET /api/users/applications` - Get all applications
- `PUT /api/users/applications/:id/review` - Review application
- `POST /api/users/loan-products` - Create loan product

## 🎨 Features Showcase

### Loan Application Process
1. **Product Selection**: Choose from 5 loan types (personal, home, auto, business, student)
2. **Amount & Terms**: Configure loan amount and repayment terms
3. **Financial Info**: Provide income, expenses, and asset information
4. **Document Upload**: Upload required documents
5. **Risk Assessment**: Automated scoring and recommendation
6. **Review & Approval**: Admin/officer workflow for approval

### Dashboard Analytics
- Application statistics and trends
- Loan portfolio overview
- Payment tracking and overdue alerts
- User activity monitoring

### Security Features
- JWT token authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Role-based route protection
- File upload restrictions
- Rate limiting

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd welfare
npm test
```

## 📦 Deployment

### Backend Deployment
1. Set environment variables for production
2. Use PM2 or similar process manager
3. Configure MongoDB connection
4. Set up reverse proxy with Nginx

### Frontend Deployment
1. Build the application:
   ```bash
   npm run build
   ```
2. Serve with static file server or CDN
3. Configure environment variables

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in the `/docs` folder
- Review the API endpoints in the backend README

## 🔄 Version History

- **v1.0.0** - Initial release with full loan management system
  - Complete authentication system
  - Loan application workflow
  - Admin panel and dashboard
  - Payment processing
  - Document management
  - Risk assessment system