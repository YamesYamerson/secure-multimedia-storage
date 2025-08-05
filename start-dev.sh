#!/bin/bash

# Secure File Sharing System - Development Startup Script
# This script starts both frontend and backend servers simultaneously

set -e  # Exit on any error

echo "🚀 Starting Secure File Sharing System Development Environment..."
echo "================================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the project root
if [ ! -f "package.json" ]; then
    print_error "This script must be run from the project root directory"
    exit 1
fi

print_status "Checking project structure..."

# Check if required directories exist
if [ ! -d "src/frontend" ]; then
    print_error "Frontend directory not found: src/frontend"
    exit 1
fi

if [ ! -d "src/backend" ]; then
    print_error "Backend directory not found: src/backend"
    exit 1
fi

print_success "Project structure verified"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    print_warning "Virtual environment not found. Creating one..."
    python3 -m venv venv
    print_success "Virtual environment created"
fi

# Activate virtual environment
print_status "Activating Python virtual environment..."
source venv/bin/activate

# Check if Python dependencies are installed
if ! python -c "import flask" 2>/dev/null; then
    print_warning "Python dependencies not installed. Installing..."
    pip install -r src/backend/requirements.txt
    print_success "Python dependencies installed"
fi

# Check if Node.js dependencies are installed
if [ ! -d "node_modules" ]; then
    print_warning "Node.js dependencies not installed. Installing..."
    npm install
    print_success "Node.js dependencies installed"
fi

print_success "All dependencies verified"

# Function to cleanup background processes on exit
cleanup() {
    print_status "Shutting down development servers..."
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        print_status "Frontend server stopped"
    fi
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        print_status "Backend server stopped"
    fi
    print_success "Development environment shutdown complete"
    exit 0
}

# Set up signal handlers for graceful shutdown
trap cleanup SIGINT SIGTERM

print_status "Starting backend server..."
cd src/backend
python local_server.py &
BACKEND_PID=$!
cd ../..

# Wait a moment for backend to start
sleep 2

# Check if backend started successfully
if ! curl -s http://localhost:5000/api/health > /dev/null; then
    print_error "Backend server failed to start"
    cleanup
    exit 1
fi

print_success "Backend server started (PID: $BACKEND_PID)"

print_status "Starting frontend server..."
npm run dev &
FRONTEND_PID=$!

# Wait a moment for frontend to start
sleep 3

# Check if frontend started successfully (try multiple ports)
FRONTEND_STARTED=false
for port in 3000 3001 3002 3003 3004; do
    if curl -s http://localhost:$port > /dev/null; then
        FRONTEND_PORT=$port
        FRONTEND_STARTED=true
        break
    fi
done

if [ "$FRONTEND_STARTED" = false ]; then
    print_error "Frontend server failed to start on any port"
    cleanup
    exit 1
fi

print_success "Frontend server started (PID: $FRONTEND_PID)"

echo ""
echo "🎉 Development Environment Started Successfully!"
echo "================================================"
echo -e "${GREEN}Frontend:${NC} http://localhost:$FRONTEND_PORT"
echo -e "${GREEN}Backend:${NC}  http://localhost:5000"
echo -e "${GREEN}Health Check:${NC} http://localhost:5000/api/health"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for user to stop the servers
wait 