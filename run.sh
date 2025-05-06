#!/bin/bash
# Script to run both frontend and backend of the Robotic Dashcam Video Analyzer

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================================${NC}"
echo -e "${BLUE}    Robotic Dashcam Video Analyzer Setup Script      ${NC}"
echo -e "${BLUE}=====================================================${NC}"

# Check for required tools
command -v npm >/dev/null 2>&1 || { echo -e "${YELLOW}npm is required but not installed. Please install Node.js and npm first.${NC}"; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo -e "${YELLOW}python3 is required but not installed. Please install Python 3.8+ first.${NC}"; exit 1; }
command -v pip3 >/dev/null 2>&1 || { echo -e "${YELLOW}pip3 is required but not installed. Please install pip first.${NC}"; exit 1; }

# Get the project root directory
PROJECT_ROOT="$(pwd)"

# Create necessary directories
echo "Creating project directories..."
mkdir -p "${PROJECT_ROOT}/backend/temp_videos"

# Check for .env file
if [ ! -f "${PROJECT_ROOT}/.env" ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    # Create a basic .env file with placeholder API keys
    cat > "${PROJECT_ROOT}/.env" << EOL
# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# OpenAI API
OPENAI_API_KEY=your_openai_api_key_here

# Anthropic API
ANTHROPIC_API_KEY=your_anthropic_api_key_here
EOL
    echo -e "${YELLOW}Please edit .env file with your API keys before continuing.${NC}"
    read -p "Press Enter to continue after editing the .env file (or Ctrl+C to exit)..."
fi

# Function to run backend
run_backend() {
    echo -e "${BLUE}Setting up Python backend...${NC}"
    cd "${PROJECT_ROOT}/backend"

    # Check for virtual environment
    if [ ! -d "venv" ]; then
        echo -e "${YELLOW}Creating new Python virtual environment...${NC}"
        python3 -m venv venv
    fi

    # Activate virtual environment
    echo "Activating virtual environment..."
    source venv/bin/activate || { echo -e "${YELLOW}Failed to activate virtual environment. Aborting.${NC}"; exit 1; }

    # Install requirements using requirements.txt
    echo "Installing Python dependencies in virtual environment..."
    pip install --upgrade pip
    pip install -r "${PROJECT_ROOT}/requirements.txt"

    # Run Flask app
    echo -e "${GREEN}Starting backend server at http://127.0.0.1:5000${NC}"
    python app.py
}

# Function to run frontend
run_frontend() {
    echo -e "${BLUE}Setting up React frontend...${NC}"
    cd "${PROJECT_ROOT}/frontend"

    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        echo "Installing Node.js dependencies (this may take a while)..."
        npm install
    fi

    # Run React app
    echo -e "${GREEN}Starting frontend server at http://localhost:3000${NC}"
    npm start
}

# Display setup instructions
echo -e "${YELLOW}This script will:${NC}"
echo "1. Set up a Python virtual environment for the backend"
echo "2. Install all required Python packages in the virtual environment"
echo "3. Install all required Node.js packages for the frontend"
echo "4. Start both the backend and frontend servers"
echo
echo -e "${YELLOW}Note: First-time setup may take several minutes.${NC}"
echo

read -p "Press Enter to continue or Ctrl+C to exit..."

# Use trap to ensure both processes are terminated when script is interrupted
trap "pkill -P $$; exit 1" INT TERM EXIT

# Run backend and frontend in parallel
run_backend &
BACKEND_PID=$!

run_frontend &
FRONTEND_PID=$!

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID