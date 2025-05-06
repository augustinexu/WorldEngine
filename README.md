# Robotic Dashcam Video Analyzer

An advanced web application for automatically analyzing and labeling robot activities in videos using Google's Gemini AI. This tool helps robotics researchers, engineers, and developers better understand and document robot behaviors captured in video recordings.

![Robotic Dashcam Video Analyzer](https://img.shields.io/badge/Status-Development-blue)

## Features

- **Video Upload**: Support for both URL and local file uploads
- **AI-Powered Analysis**: Automatic identification of robot activities using Google's Gemini AI vision model
- **Interactive Timeline**: Visualize robot activity segments with an interactive timeline
- **Rich Video Controls**: Full media controls including playback speed, fullscreen mode, and screenshot capture
- **Customizable Analysis Instructions**: Tailor the AI instructions for specific robot types or activities
- **Searchable Results**: Filter analysis results to find specific robot behaviors
- **Export Options**: Save results in multiple formats (TXT, CSV, JSON)
- **Responsive Design**: Works on desktop and mobile devices

## Architecture

- **Frontend**: React.js with functional components and hooks
- **Backend**: Python Flask REST API
- **Video Processing**: OpenCV for frame extraction
- **AI Integration**: Google Gemini Pro Vision API

## Project Structure

```
robotic-video-analyzer/
├── frontend/                # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── VideoPlayer.jsx            # Enhanced video player with advanced controls
│   │   │   ├── VideoUploader.jsx          # File/URL upload component with validation
│   │   │   ├── AnalysisResults.jsx        # Results display with search/sort capabilities
│   │   │   ├── AnalysisProgress.jsx       # Progress indicator for analysis
│   │   │   ├── ErrorMessage.jsx           # User-friendly error messages
│   │   │   ├── ModelSelector.jsx          # AI model selection interface
│   │   │   └── PromptInput.jsx            # Custom instructions editor
│   │   ├── App.jsx                        # Main application component
│   │   └── index.js                       # Application entry point
│   └── package.json                       # Frontend dependencies
├── backend/
│   ├── app.py                             # Flask server with REST API
│   ├── models/                            # Model processors
│   │   ├── gemini_processor.py            # Google Gemini AI integration
│   │   ├── gpt4_processor.py              # (Optional) OpenAI GPT-4 Vision integration
│   │   └── claude_processor.py            # (Optional) Anthropic Claude 3 integration
│   └── temp_videos/                       # Temporary storage for uploads
├── .env                                   # Environment variables (create from .env.example)
├── .env.example                           # Example environment file
├── run.sh                                 # Startup script for both frontend and backend
└── requirements.txt                       # Python dependencies

## Setup Instructions

### Prerequisites

- Node.js and npm (v14.0 or higher)
- Python 3.8 or higher
- Google Gemini API key

### Backend Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/robotic-video-analyzer.git
   cd robotic-video-analyzer
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create your environment file:
   ```bash
   cp .env.example .env
   ```

5. Edit the `.env` file with your API keys:
   - Get a Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Add it to your `.env` file: `GEMINI_API_KEY=your_key_here`

6. Start the Flask backend:
   ```bash
   cd backend
   python app.py
   ```
   The server will run on http://127.0.0.1:5000

### Frontend Setup

1. Install Node.js dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Start the React development server:
   ```bash
   npm start
   ```
   The application will be available at http://localhost:3000

### Using the Run Script (Alternative)

For convenience, a startup script is provided:

```bash
chmod +x run.sh  # Make the script executable (Unix-based systems only)
./run.sh
```

This script will set up the virtual environment, install dependencies, and start both the backend and frontend servers.

## Usage Guide

1. **Select an AI Model**
   - Currently, the application is optimized for Google's Gemini model

2. **Customize Analysis Instructions (Optional)**
   - Use the custom instructions panel to tailor how Gemini analyzes videos
   - You can specify particular robot behaviors to look for or customize terminology

3. **Upload a Video**
   - Option 1: Provide a URL to a video (YouTube, direct links to MP4 files, etc.)
   - Option 2: Upload a video from your local device (supported formats: MP4, AVI, MOV, WEBM)
   - Maximum file size: 100MB

4. **View Analysis Results**
   - The video will be processed and analyzed by the AI
   - Results will appear as a list of time-stamped segments
   - Each segment describes a specific robot activity

5. **Interact with Results**
   - Click on a segment to jump to that position in the video
   - Use the search box to find specific activities
   - Sort segments by time or duration
   - Export results in various formats (TXT, CSV, JSON)

6. **Video Controls**
   - Adjust playback speed (0.5x to 2x)
   - Use timeline markers to navigate between detected segments
   - Take screenshots of specific frames
   - Toggle fullscreen mode

## Enhanced Features

### Improved Error Handling
- Detailed error messages with troubleshooting tips
- Proper handling of network issues, timeouts, and file validation

### Loading States
- Progress indicators showing different stages of analysis
- Ability to cancel long-running analyses

### Mobile Responsiveness
- Adaptive layout that works on devices of all sizes
- Touch-friendly controls for mobile users

### User Experience Improvements
- Enhanced video player with advanced controls
- Searchable and sortable results
- Multiple export options
- Clear visual feedback for all actions

## Development Notes

### Adding New AI Models

The application is designed to be extensible. To add a new AI model:

1. Create a new processor class in `backend/models/`
2. Implement the `analyze_video` method
3. Add the model to the factory function in `app.py`
4. Add the model to the UI options in `ModelSelector.jsx`

### Code Organization Best Practices

- Components use functional style with React hooks
- CSS is modularized by component
- Backend uses class-based model processors for better organization
- Error handling is centralized and consistent

### Future Improvement Ideas

- Add user accounts and saved analysis history
- Implement batch processing for multiple videos
- Add support for more advanced video annotations (bounding boxes, object tracking)
- Create shareable results via unique URLs
- Add options for custom AI models or local inference

## Troubleshooting

### Common Issues

1. **API Key Issues**
   - If you see "GEMINI_API_KEY not found in environment variables", ensure your `.env` file is properly configured
   - Verify that your API key is active and has sufficient quota

2. **Video Processing Problems**
   - Try a shorter video if analysis takes too long
   - Ensure your video is in a supported format (MP4, AVI, MOV, WEBM)
   - Check that the video has clear visibility of robot activities

3. **Frontend Connection to Backend**
   - Verify that the backend server is running on port 5000
   - Check that the React proxy is configured correctly in `package.json`

4. **Dependencies Issues**
   - If you encounter package errors, try updating dependencies: `pip install -r requirements.txt --upgrade`
   - For Node.js issues, try clearing the cache: `npm cache clean --force` followed by `npm install`

### Support and Contributions

This project is actively maintained. For questions, issues, or contributions:

1. Open an issue on GitHub
2. Submit a pull request with improvements
3. Contact the maintainer via email

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Google Gemini API for the advanced video analysis capabilities
- React.js community for frontend libraries and tools
- OpenCV project for video processing capabilities

---

**Note**: This application is designed for research and development purposes. For production use, implement additional security measures and robust error handling.