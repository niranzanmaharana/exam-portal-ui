# Exam Portal UI

A modern, responsive Angular frontend application for the Online Exam Portal system. This application provides a comprehensive interface for managing exams, questions, and results with role-based access control.

## 📋 Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Development](#development)
- [Build](#build)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Routing](#routing)
- [Authentication & Authorization](#authentication--authorization)
- [API Integration](#api-integration)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## ✨ Features

### Core Features
- 🔐 **JWT-based Authentication** - Secure login and session management
- 👥 **Role-Based Access Control** - Admin, Organizer, and Candidate roles
- 📝 **Exam Management** - Create, edit, publish, and manage exams
- ❓ **Question Bank** - Comprehensive question management with categories
- 📊 **Bulk Question Upload** - Excel-based bulk question import
- 🎯 **Exam Taking Interface** - User-friendly exam interface with timer
- 📈 **Results & Analytics** - Detailed results with question-by-question analysis
- 👤 **User Profile Management** - Profile editing and password management
- 🎨 **Responsive Design** - Mobile-friendly Bootstrap 5 UI
- 🔍 **Rich Text Editor** - Quill-based editor for question content

### User Roles

#### 👨‍💼 Admin
- View all exams and results
- Manage organizers
- System-wide analytics

#### 🎓 Organizer
- Create and manage exams
- Map questions to exams
- View student results
- Bulk question upload

#### 👨‍🎓 Candidate
- Take exams
- View personal results
- Access exam history
- View detailed answers

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.0 or higher ([Download](https://nodejs.org/))
- **npm** 9.0 or higher (comes with Node.js)
- **Angular CLI** 18.0 or higher

### Install Angular CLI

```bash
npm install -g @angular/cli
```

Verify installation:
```bash
ng version
```

## 🚀 Installation

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd exam-portal/exam-portal-ui
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment** (see [Configuration](#configuration) section)

4. **Start development server**:
   ```bash
   npm start
   # or
   ng serve
   ```

The application will be available at `http://localhost:4200`

## 💻 Development

### Development Server

Start the development server with hot-reload:

```bash
ng serve
```

Options:
- `--port 4200` - Specify port (default: 4200)
- `--open` - Open browser automatically
- `--host 0.0.0.0` - Allow external connections

Example:
```bash
ng serve --port 4200 --open
```

### Code Generation

Generate new components, services, guards:

```bash
# Generate component
ng generate component components/my-component

# Generate service
ng generate service services/my-service

# Generate guard
ng generate guard guards/my-guard
```

### Running Tests

```bash
# Run unit tests
ng test

# Run tests with coverage
ng test --code-coverage
```

## 🏗️ Build

### Development Build

```bash
ng build
```

### Production Build

```bash
ng build --configuration production
```

Build output will be in `dist/exam-portal-ui/`

### Build Options

- `--output-path` - Custom output directory
- `--base-href` - Base href for deployment
- `--source-map` - Generate source maps

Example for production deployment:
```bash
ng build --configuration production --base-href /exam-portal/
```

## 📁 Project Structure

```
exam-portal-ui/
├── src/
│   ├── app/
│   │   ├── components/          # Feature components
│   │   │   ├── auth/            # Authentication components
│   │   │   │   ├── login/
│   │   │   │   ├── register/
│   │   │   │   ├── forgot-password/
│   │   │   │   └── reset-password/
│   │   │   ├── dashboard/       # Dashboard component
│   │   │   ├── exams/           # Exam management
│   │   │   │   ├── exam-list/
│   │   │   │   ├── exam-form/
│   │   │   │   ├── exam-detail/
│   │   │   │   ├── exam-map-questions/
│   │   │   │   ├── exam-access/
│   │   │   │   ├── exam-instructions/
│   │   │   │   ├── exam-taking/
│   │   │   │   └── exam-acknowledgment/
│   │   │   ├── questions/       # Question management
│   │   │   │   ├── question-list/
│   │   │   │   ├── question-form/
│   │   │   │   └── question-bulk-upload/
│   │   │   ├── results/         # Results & analytics
│   │   │   │   ├── result-list/
│   │   │   │   ├── result-detail/
│   │   │   │   └── result-answers/
│   │   │   ├── profile/         # User profile
│   │   │   ├── categories/      # Category management
│   │   │   ├── organizers/      # Organizer management
│   │   │   ├── shared/          # Shared components
│   │   │   │   ├── header/
│   │   │   │   ├── footer/
│   │   │   │   ├── loading-spinner/
│   │   │   │   ├── confirmation-dialog/
│   │   │   │   └── rich-text-editor/
│   │   │   ├── guards/          # Route guards
│   │   │   │   ├── auth.guard.ts
│   │   │   │   ├── candidate.guard.ts
│   │   │   │   └── organizer-admin.guard.ts
│   │   │   ├── services/        # Angular services
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── exam.service.ts
│   │   │   │   ├── question.service.ts
│   │   │   │   ├── result.service.ts
│   │   │   │   ├── user.service.ts
│   │   │   │   ├── category.service.ts
│   │   │   │   ├── exam-session.service.ts
│   │   │   │   └── http-interceptor.service.ts
│   │   │   ├── app.routes.ts    # Route configuration
│   │   │   ├── app.config.ts    # App configuration
│   │   │   └── app.component.*  # Root component
│   │   ├── environments/        # Environment configurations
│   │   │   ├── environment.ts
│   │   │   └── environment.prod.ts
│   │   ├── index.html          # Main HTML file
│   │   ├── main.ts             # Application entry point
│   │   └── styles.css          # Global styles
├── angular.json                 # Angular CLI configuration
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
└── README.md                   # This file
```

## ⚙️ Configuration

### Environment Configuration

Edit `src/environments/environment.ts` for development:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:9090/exam-portal-api/api'
};
```

Edit `src/environments/environment.prod.ts` for production:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-api-domain.com/exam-portal-api/api'
};
```

### API Base URL

The API base URL is configured in environment files. Update it according to your backend deployment:

- **Development**: `http://localhost:9090/exam-portal-api/api`
- **Production**: `https://your-domain.com/exam-portal-api/api`

## 🗺️ Routing

### Public Routes

- `/` - Redirects to `/home`
- `/home` - Home page
- `/login` - User login
- `/register` - User registration
- `/forgot-password` - Password reset request
- `/reset-password` - Password reset (with token)

### Protected Routes (Require Authentication)

#### All Authenticated Users
- `/dashboard` - User dashboard
- `/profile` - User profile management
- `/change-password` - Change password
- `/questions` - Question bank
- `/questions/new` - Create question
- `/questions/:id/edit` - Edit question
- `/questions/bulk-upload` - Bulk upload questions
- `/results` - Results list
- `/results/:id` - Result details
- `/results/:id/answers` - Question-by-question answers
- `/categories` - Category management
- `/organizers` - Organizer management (Admin only)

#### Organizer & Admin Only
- `/exams` - Exam list
- `/exams/new` - Create exam
- `/exams/:id` - Exam details
- `/exams/:id/edit` - Edit exam
- `/exams/:id/map-questions` - Map questions to exam

#### Candidate Only
- `/exam-access/:code` - Access exam with code
- `/exam-instructions/:examId` - Exam instructions
- `/exam-taking/:examId` - Take exam

### Route Guards

- **`authGuard`** - Requires user to be authenticated
- **`candidateGuard`** - Requires CANDIDATE role
- **`organizerAdminGuard`** - Requires ORGANIZER or ADMIN role

## 🔐 Authentication & Authorization

### Authentication Flow

1. User logs in via `/login`
2. JWT token is stored in `localStorage`
3. Token is automatically included in API requests via HTTP interceptor
4. Token expiration is handled automatically
5. User is redirected to login on 401 errors

### Role-Based Access

The application implements three roles:

| Role | Access Level |
|------|-------------|
| **ADMIN** | Full system access, organizer management |
| **ORGANIZER** | Exam and question management, view results |
| **CANDIDATE** | Take exams, view own results |

### Token Management

- Tokens are stored in `localStorage`
- HTTP interceptor adds `Authorization: Bearer <token>` header
- Token expiration: 24 hours (configurable in backend)
- Auto-logout on token expiration

## 🔌 API Integration

### Services

All API communication is handled through Angular services:

- **`AuthService`** - Authentication endpoints
- **`ExamService`** - Exam CRUD operations
- **`QuestionService`** - Question management
- **`ResultService`** - Results and analytics
- **`UserService`** - User management
- **`CategoryService`** - Category management
- **`ExamSessionService`** - Exam session management

### HTTP Interceptor

The `HttpInterceptorService` automatically:
- Adds JWT token to all authenticated requests
- Handles 401 Unauthorized errors
- Redirects to login on authentication failure
- Skips token for public endpoints

### Error Handling

Global error handling is implemented in:
- HTTP interceptor for network errors
- Service-level error handling
- Component-level error display

## 🚢 Deployment

### Build for Production

```bash
ng build --configuration production
```

### Deploy to Web Server

1. Build the application:
   ```bash
   ng build --configuration production --base-href /exam-portal/
   ```

2. Copy `dist/exam-portal-ui/` contents to your web server

3. Configure web server (Apache/Nginx) to serve Angular app

#### Nginx Configuration Example

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/exam-portal-ui;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:9090/exam-portal-api/api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Docker Deployment

See the main project README for Docker deployment instructions.

### Environment Variables

For production, ensure:
- API URL is correctly configured
- CORS is properly set up on backend
- HTTPS is enabled
- Environment files are not committed to version control

## 🛠️ Troubleshooting

### Common Issues

#### 1. CORS Errors

**Problem**: API requests fail with CORS errors

**Solution**: 
- Ensure backend CORS configuration includes your frontend URL
- Check `environment.ts` has correct API URL
- Verify backend is running

#### 2. 401 Unauthorized Errors

**Problem**: User gets logged out unexpectedly

**Solution**:
- Check token expiration
- Verify token is being sent in requests
- Check backend JWT configuration
- Clear localStorage and login again

#### 3. Build Errors

**Problem**: `ng build` fails

**Solution**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
ng build
```

#### 4. Port Already in Use

**Problem**: Port 4200 is already in use

**Solution**:
```bash
# Use different port
ng serve --port 4201
```

#### 5. Module Not Found

**Problem**: Import errors

**Solution**:
```bash
# Reinstall dependencies
npm install
# Restart dev server
ng serve
```

### Debugging

1. **Check Browser Console** - Look for errors in DevTools
2. **Network Tab** - Verify API requests/responses
3. **Application Tab** - Check localStorage for token
4. **Angular DevTools** - Use Angular DevTools extension

### Getting Help

- Check browser console for detailed error messages
- Verify API is running and accessible
- Review network requests in DevTools
- Check Angular CLI version compatibility

## 📚 Dependencies

### Key Dependencies

- **@angular/core** ^18.2.0 - Angular framework
- **@angular/router** ^18.2.0 - Routing
- **@angular/forms** ^18.2.0 - Forms handling
- **bootstrap** ^5.3.3 - UI framework
- **bootstrap-icons** ^1.11.3 - Icons
- **quill** ^2.0.3 - Rich text editor
- **qrcode** ^1.5.4 - QR code generation
- **rxjs** ~7.8.0 - Reactive programming

### Development Dependencies

- **@angular/cli** ^18.2.21 - Angular CLI
- **typescript** ~5.5.2 - TypeScript compiler
- **karma** ~6.4.0 - Test runner

## 📝 Scripts

Available npm scripts:

```bash
# Development
npm start          # Start dev server
npm run ng serve   # Alternative start command

# Build
npm run build      # Production build

# Testing
npm test           # Run unit tests
```

## 🤝 Contributing

1. Follow Angular style guide
2. Use TypeScript strict mode
3. Write meaningful commit messages
4. Test your changes before committing
5. Update documentation as needed

## 📄 License

[Your License Here]

## 👥 Authors

[Your Name/Team]

---

**Note**: Make sure the backend API is running and accessible before starting the frontend application.
