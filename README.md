# 🎓 School Management System

A comprehensive, multi-tenant school management system built with Next.js, Prisma, and PostgreSQL. Designed to handle multiple schools with complete data isolation and modern web technologies.

## 🚀 Live Demo

**Production URL**: [https://production-school-management-tonmoybishwas-projects.vercel.app](https://production-school-management-tonmoybishwas-projects.vercel.app)

### Demo Credentials
```
Superadmin Login:
Username: superadmin
Password: super123
```

## ✨ Features

### 👥 User Roles
- **Superadmin**: System-wide management, school creation
- **School Admin**: Complete school management, student/teacher registration
- **Teacher**: Attendance marking, homework assignment, grading
- **Student**: View attendance, homework, grades, schedule
- **Parent**: Monitor child's progress, attendance, grades
- **Accountant**: Financial management, fee collection

### 🏫 Core Functionality
- **Multi-tenant Architecture**: Complete data isolation between schools
- **Student Management**: Registration with 5-20 photos for face recognition
- **Attendance System**: Time-based marking with real-time validation
- **Academic Calendar**: Events, exams, holidays management
- **Schedule/Timetable**: Automated conflict detection
- **Grading System**: Exam creation, marking, report generation
- **Photo Management**: Cloud storage with local sync for ML training

### 🔐 Security Features
- **Row Level Security (RLS)**: Database-level data isolation
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Granular permissions
- **Secure File Storage**: Vercel Blob storage with access controls
- **Environment-specific Secrets**: Production-grade security

## 🛠️ Technology Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **React**: Component-based UI

### Backend
- **Next.js API Routes**: Serverless functions
- **Prisma**: Type-safe database client
- **PostgreSQL**: Robust relational database
- **JWT**: JSON Web Tokens for authentication

### Infrastructure
- **Vercel**: Deployment and hosting
- **Supabase**: Managed PostgreSQL database
- **Vercel Blob**: File storage for images
- **GitHub**: Version control and CI/CD

## 📦 Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- PostgreSQL database (local or cloud)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/TonmoyBishwas/production_school_management.git
   cd production_school_management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database setup**
   ```bash
   # Generate Prisma client
   npm run db:generate

   # Push schema to database
   npm run db:push

   # Open Prisma Studio (optional)
   npm run db:studio
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   ```
   http://localhost:3000
   ```

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Connect to Vercel**
   ```bash
   npm install -g vercel
   vercel login
   vercel link
   ```

2. **Configure Environment Variables**
   Add these to Vercel Dashboard → Settings → Environment Variables:
   ```
   DATABASE_URL=postgresql://...
   JWT_SECRET=your-secret-key
   NEXTAUTH_SECRET=your-nextauth-secret
   VERCEL_BLOB_READ_WRITE_TOKEN=your-blob-token
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

## 📁 Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Authentication pages
│   │   ├── api/               # API routes
│   │   ├── superadmin/        # Superadmin dashboard
│   │   ├── admin/             # School admin dashboard
│   │   ├── teacher/           # Teacher dashboard
│   │   ├── student/           # Student dashboard
│   │   └── parent/            # Parent dashboard
│   ├── components/            # Reusable React components
│   ├── lib/                   # Utility functions
│   └── types/                 # TypeScript type definitions
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── public/                    # Static assets
└── tests/                     # Test files
```

## 🎯 User Guide

### Superadmin Workflow
1. Login with superadmin credentials
2. Create new schools from dashboard
3. Generate admin credentials for each school
4. Monitor school statistics and health

### School Admin Workflow
1. Login with school admin credentials
2. Register students with photo upload (5-20 photos)
3. Create teacher accounts and assign subjects
4. Set up class schedules and academic calendar
5. Manage school settings and configurations

### Teacher Workflow
1. Login with teacher credentials
2. Mark attendance during assigned periods
3. Assign homework to classes
4. Grade exams and assignments
5. View personal schedule

### Student Workflow
1. Login with student credentials
2. View attendance history and statistics
3. Check homework assignments
4. Access grades and exam results
5. View class schedule

### Parent Workflow
1. Login with parent credentials
2. Monitor child's attendance
3. View grades and academic progress
4. Access payment history
5. Receive notifications about child's performance

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `JWT_SECRET` | Secret for JWT tokens (32+ chars) | ✅ |
| `NEXTAUTH_SECRET` | NextAuth secret | ✅ |
| `NEXTAUTH_URL` | Application URL | ✅ |
| `VERCEL_BLOB_READ_WRITE_TOKEN` | Vercel Blob storage token | ✅ |
| `BCRYPT_ROUNDS` | Password hashing rounds | ❌ |
| `SESSION_TIMEOUT_HOURS` | Session timeout | ❌ |

### Database Configuration

The system uses PostgreSQL with Prisma ORM. Key features:
- **Row Level Security**: Ensures data isolation between schools
- **Foreign Key Constraints**: Maintains data integrity
- **Indexes**: Optimized for performance
- **Migrations**: Version-controlled schema changes

## 📊 Database Schema

### Core Tables
- `organizations` - Root level organizations
- `schools` - Individual schools
- `users` - All system users
- `students` - Student-specific data
- `teachers` - Teacher-specific data
- `parents` - Parent-specific data

### Academic Tables
- `subjects` - Course subjects
- `schedules` - Class timetables
- `attendance` - Attendance records
- `exams` - Exam definitions
- `grades` - Student grades
- `homework` - Homework assignments

### Media Tables
- `student_photos` - Photo references for face recognition
- `academic_calendar` - School events and schedules

## 🧪 Testing

### Running Tests
```bash
# Unit tests
npm run test

# E2E tests with Playwright
npm run test:e2e

# Test coverage
npm run test:coverage
```

### Test Structure
- **Unit Tests**: Component and function testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Complete user workflows
- **Security Tests**: Authentication and authorization

## 🔒 Security

### Multi-tenancy
- **Row Level Security (RLS)**: Database-level isolation
- **School Context**: All queries filtered by school ID
- **User Permissions**: Role-based access control

### Authentication
- **JWT Tokens**: Secure session management
- **Password Hashing**: bcrypt with configurable rounds
- **Session Timeout**: Automatic logout

### File Security
- **Secure Upload**: Validated file types and sizes
- **Access Control**: Authenticated access only
- **Cloud Storage**: Vercel Blob with proper permissions

## 📈 Performance

### Optimization Features
- **Database Connection Pooling**: Efficient resource usage
- **Image Optimization**: Automatic compression and resizing
- **Caching**: In-memory caching for frequent queries
- **Serverless Functions**: Auto-scaling Vercel functions

### Monitoring
- **Error Tracking**: Comprehensive error logging
- **Performance Metrics**: Built-in Vercel analytics
- **Health Checks**: Automated system monitoring

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Update documentation
- Follow commit message conventions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [Deployment Guide](DEPLOYMENT.md)
- [Development Workflow](DEVELOPMENT-WORKFLOW.md)
- [API Documentation](API_DOCUMENTATION.md)
- [User Guide](USER_GUIDE.md)

### Getting Help
- **Issues**: Report bugs on GitHub Issues
- **Discussions**: Join GitHub Discussions
- **Documentation**: Check the docs/ folder

### Support Channels
- 📧 Email: support@schoolmanagement.com
- 💬 Discord: [Join our community](https://discord.gg/schoolmanagement)
- 📖 Wiki: [Comprehensive guides](https://github.com/TonmoyBishwas/production_school_management/wiki)

## 🎉 Acknowledgments

- Built with ❤️ using modern web technologies
- Deployed on Vercel for optimal performance
- Database powered by Supabase
- UI components inspired by modern design systems

---

**Last Updated**: September 2025 | **Version**: 1.0.0 | **Status**: ✅ Production Ready