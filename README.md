# WorldEngine Robotic Dashcam Video Analyzer

This application automatically labels robotic dashcam videos using various AI models. It identifies and segments different robot activities in the video and generates timestamps and descriptions for each segment.

## Features

- Upload videos via URL or local file
- Video analysis using multiple AI models:
  - Google Gemini Pro Vision
  - OpenAI GPT-4 Vision
  - Anthropic Claude 3
  - Custom fine-tuned model option
- Interactive video player with timeline visualization
- Segment-based navigation
- Export analysis results

## Architecture

- **Frontend**: React.js
- **Backend**: Python Flask
- **Video Processing**: OpenCV, NumPy
- **AI Integration**: Multiple vision model APIs

## Project Structure

```
robotic-video-analyzer/
├── frontend/                # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── App.js           # Main application
│   │   └── ...
│   └── package.json
├── backend/
│   ├── app.py               # Flask server
│   ├── models/              # Model processors
│   │   ├── __init__.py
│   │   ├── gemini_processor.py
│   │   ├── gpt4_processor.py
│   │   ├── claude_processor.py
│   └── temp_videos/         # Temporary storage for uploads
├── .env                     # Environment variables (create from .env.example)
├── .env.example             # Example environment file
└── requirements.txt         # Python dependencies
```

## Setup Instructions

### Prerequisites

- Node.js and npm
- Python 3.8+
- API keys for models you plan to use (Gemini, OpenAI, and/or Anthropic)

### Backend Setup

1. Clone the repository:
   ```
   git clone https://github.com/your-username/robotic-video-analyzer.git
   cd robotic-video-analyzer
   ```

2. Create a virtual environment and activate it:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install Python dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Copy `.env.example` to `.env` and fill in your API keys:
   ```
   cp .env.example .env
   # Edit .env with your API keys
   ```

5. Start the Flask backend:
   ```
   cd backend
   python app.py
   ```
   The server will start on http://localhost:5000

### Frontend Setup

1. Install Node.js dependencies:
   ```
   cd frontend
   npm install
   ```

2. Start the React development server:
   ```
   npm start
   ```
   The frontend will start on http://localhost:3000

3. Open your browser and navigate to http://localhost:3000

## Usage

1. Select an AI model from the dropdown
2. Upload a video via URL or local file
3. Wait for the analysis to complete
4. View the segmented results with timestamps
5. Click on segments to navigate to specific parts of the video
6. Export results as needed

## API Endpoints

- `POST /analyze`: Analyzes a video and returns segmented activities
  - Parameters:
    - `video`: Video file (multipart/form-data)
    - `video_url`: URL to video (alternative to file upload)
    - `model`: AI model to use (gemini, gpt4, claude, or custom)
  - Returns: JSON with segmented activities

## License

This project is licensed under the MIT License - see the LICENSE file for details.