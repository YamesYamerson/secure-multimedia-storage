# Secure Family File Storage System

A lightweight, ultra-secure, web-based file sharing system designed for private family use. This system allows family members to upload, download, and manage pictures, documents, and videos with comprehensive metadata tracking and search capabilities.

## 🚀 Features

- **Secure Authentication**: AWS Cognito integration with JWT tokens
- **File Management**: Upload, download, and organize files with metadata
- **Search & Filter**: Find files by name, type, date, and tags
- **Version Control**: Track file history and changes
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- **Security First**: End-to-end encryption, signed URLs, and audit logging

## 🏗️ Architecture

### Frontend
- **Framework**: Vanilla JavaScript with ES6+ modules
- **Styling**: Tailwind CSS with custom design system
- **Build Tool**: Vite for fast development and optimized builds
- **Icons**: Heroicons for consistent iconography

### Backend
- **API**: AWS API Gateway with Lambda functions
- **Language**: Python 3.9 with Boto3 for AWS services
- **Authentication**: AWS Cognito User Pools and Identity Pools
- **Storage**: AWS S3 with server-side encryption and versioning
- **Database**: DynamoDB for metadata and user data
- **Deployment**: Serverless Framework for infrastructure as code

## 📋 Prerequisites

- Node.js 16+ and npm
- Python 3.9+
- AWS CLI configured with appropriate permissions
- Serverless Framework (`npm install -g serverless`)

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd secure-multimedia-storage
```

### 2. Install Dependencies
```bash
# Frontend dependencies
npm install

# Backend dependencies
cd src/backend
pip install -r requirements.txt
cd ../..
```

### 3. AWS Infrastructure Setup
```bash
# Run the AWS setup script
npm run setup:aws
```

This will create:
- S3 bucket with encryption and versioning
- DynamoDB tables for files, users, and file history
- IAM roles and policies
- CloudWatch logging

### 4. Configure Environment Variables
Create a `.env` file in the root directory:
```env
# AWS Configuration
AWS_REGION=us-east-1
USER_POOL_ID=your-cognito-user-pool-id
IDENTITY_POOL_ID=your-cognito-identity-pool-id
CLIENT_ID=your-cognito-client-id

# API Configuration
API_BASE_URL=https://your-api-gateway-url.amazonaws.com/dev
```

### 5. Deploy Backend
```bash
cd src/backend
serverless deploy
```

### 6. Start Development Server
```bash
# Frontend development
npm run dev

# Backend development (if needed)
cd src/backend
serverless offline
```

## 📁 Project Structure

```
secure-multimedia-storage/
├── src/
│   ├── frontend/
│   │   ├── index.html          # Main HTML file
│   │   ├── styles/
│   │   │   └── main.css        # Tailwind CSS and custom styles
│   │   └── js/
│   │       ├── app.js          # Main application entry point
│   │       ├── auth.js         # Authentication manager
│   │       ├── files.js        # File operations manager
│   │       └── ui.js           # UI interactions and display
│   └── backend/
│       ├── auth.py             # Authentication Lambda handler
│       ├── upload.py           # File upload Lambda handler
│       ├── download.py         # File download Lambda handler
│       ├── list.py             # File listing Lambda handler
│       ├── metadata.py         # File metadata Lambda handler
│       ├── requirements.txt    # Python dependencies
│       └── serverless.yml      # Serverless Framework configuration
├── scripts/
│   └── setup-aws.js           # AWS infrastructure setup script
├── prompts/                   # Project planning and documentation
├── docs/                      # Additional documentation
├── package.json               # Frontend dependencies and scripts
├── vite.config.js            # Vite configuration
├── tailwind.config.js        # Tailwind CSS configuration
└── README.md                 # This file
```

## 🔐 Security Features

- **HTTPS Enforcement**: All endpoints require HTTPS
- **IAM Least Privilege**: Minimal required permissions for each service
- **Signed URLs**: Secure file upload/download with time-limited access
- **Server-Side Encryption**: S3 objects encrypted with AES-256
- **Input Validation**: Comprehensive validation of all user inputs
- **Audit Logging**: CloudWatch logs for all operations
- **JWT Tokens**: Secure authentication with automatic refresh

## 🎨 UI/UX Design

- **Design System**: Consistent color palette, typography, and spacing
- **Responsive Layout**: Mobile-first design with Tailwind CSS
- **Loading States**: Smooth transitions and progress indicators
- **Error Handling**: User-friendly error messages and recovery
- **Accessibility**: WCAG 2.1 AA compliant components

## 🚀 Deployment

### Frontend (Netlify)
```bash
npm run build
netlify deploy --prod
```

### Backend (AWS)
```bash
cd src/backend
serverless deploy --stage prod
```

## 📊 Monitoring & Logging

- **CloudWatch Logs**: All Lambda function executions
- **S3 Access Logs**: File access and modification tracking
- **API Gateway Logs**: Request/response monitoring
- **Custom Metrics**: File upload/download statistics

## 🔧 Development

### Adding New Features
1. Follow the established file structure
2. Implement backend Lambda functions first
3. Add corresponding frontend functionality
4. Update documentation and changelog
5. Test thoroughly before deployment

### Code Standards
- **JavaScript**: ES6+ with modules, async/await
- **Python**: PEP 8 style guide, type hints
- **CSS**: Tailwind utility classes, custom components
- **Security**: Input validation, error handling, logging

## 📝 API Documentation

### Authentication Endpoints
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/logout` - User logout
- `POST /auth/verify` - Token verification
- `POST /auth/refresh` - Token refresh

### File Endpoints
- `GET /files` - List user files
- `POST /upload` - Get upload URL
- `GET /download/{fileId}` - Get download URL
- `DELETE /files/{fileId}` - Delete file
- `GET /files/search` - Search files
- `GET /files/{fileId}/metadata` - Get file metadata
- `PUT /files/{fileId}/metadata` - Update file metadata

## 🤝 Contributing

1. Follow the established development workflow
2. Reference the project planning documents in `/prompts/`
3. Update the changelog for all changes
4. Test thoroughly before submitting
5. Follow security best practices

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For questions or issues:
1. Check the project documentation in `/prompts/`
2. Review the changelog for recent changes
3. Check CloudWatch logs for backend issues
4. Verify AWS service configurations

## 🔄 Version History

See `prompts/project_changelog.md` for detailed version history and changes. 