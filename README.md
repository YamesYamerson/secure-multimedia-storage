# Secure File Sharing System

A secure file sharing system designed for private family use with local development capabilities.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- Python 3.9 or higher
- npm or yarn

### Single Command Startup

#### macOS/Linux:
```bash
# Option 1: Using the shell script
./start-dev.sh

# Option 2: Using npm script
npm run dev:full
```

#### Windows:
```bash
# Option 1: Using the batch file
start-dev.bat

# Option 2: Using npm script
npm run dev:windows
```

### Manual Startup (Alternative)
If you prefer to start servers manually:

```bash
# Terminal 1: Start backend
cd src/backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python local_server.py

# Terminal 2: Start frontend
npm run dev
```

## 🌐 Access Points

Once started, you can access:

- **Frontend**: http://localhost:3000 (or next available port)
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

## 🔧 Development Features

### Placeholder Authentication
- Accepts any non-empty username/password for development
- Mock tokens and user data stored in localStorage
- Ready for OAuth integration later

### Local File Storage
- SQLite database for file metadata
- Local file system storage in `uploads/` directory
- File upload, download, and delete functionality
- No AWS setup required for development

## 📁 Project Structure

```
secure-multimedia-storage/
├── src/
│   ├── frontend/          # Vite + Vanilla JS frontend
│   └── backend/           # Flask + SQLite backend
├── tests/                 # Test files
├── prompts/               # Project planning documents
├── start-dev.sh          # Unix startup script
├── start-dev.bat         # Windows startup script
└── package.json          # Project configuration
```

## 🛠️ Available Scripts

- `npm run dev` - Start frontend only
- `npm run dev:full` - Start both frontend and backend (Unix)
- `npm run dev:windows` - Start both frontend and backend (Windows)
- `npm run test` - Run all tests
- `npm run build` - Build for production

## 🔒 Security Notes

This is a development setup with placeholder authentication. For production:
- Replace placeholder auth with OAuth
- Use AWS S3 for file storage
- Implement proper JWT token validation
- Add HTTPS and security headers

## 📝 Development Workflow

1. Use the master prompt template for all development work
2. Follow the testing framework requirements
3. Update changelog for all changes
4. Run tests before committing changes

## 🆘 Troubleshooting

### Port Already in Use
If you get port conflicts:
- Frontend will automatically try ports 3000, 3001, 3002, etc.
- Backend runs on port 5000 by default
- Check `lsof -i :5000` (Unix) or `netstat -an | findstr :5000` (Windows)

### Dependencies Not Found
The startup scripts will automatically install missing dependencies, but you can also run:
```bash
npm install
pip install -r src/backend/requirements.txt
```

### Virtual Environment Issues
If Python virtual environment has issues:
```bash
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r src/backend/requirements.txt
``` 