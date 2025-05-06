import React, { useState, useRef } from 'react';
import VideoUploader from './components/VideoUploader';
import VideoPlayer from './components/VideoPlayer';
import AnalysisResults from './components/AnalysisResults';
import ModelSelector from './components/ModelSelector';
import PromptInput from './components/PromptInput';
import AnalysisProgress from './components/AnalysisProgress';
import ErrorMessage from './components/ErrorMessage';
import './App.css';

function App() {
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progressStage, setProgressStage] = useState(0);
  const [selectedModel, setSelectedModel] = useState('gemini');
  const [customPrompt, setCustomPrompt] = useState(getDefaultPrompt('gemini'));
  const [error, setError] = useState(null);
  
  // Use a ref for the abort controller to maintain it across renders
  const abortControllerRef = useRef(null);

  // Get default prompt based on selected model
  function getDefaultPrompt(model) {
    const prompts = {
      gemini: `Analyze the provided video file, which contains footage from a robot's perspective or observing a robot.

Identify the distinct sequential segments of activities performed by the robot. Examples include:
- Picking up an object
- Placing an object
- Navigating between locations
- Manipulating a tool or part
- Interacting with its environment
- Performing an inspection task
- Waiting or idle periods (if significant)

For each identified segment, determine:
1. The start time of the segment (in seconds from video start)
2. The end time of the segment (in seconds from video start)
3. A clear description of the robot's primary activity during that segment.`,
      
      // These models are commented out in the ModelSelector but keeping the prompts in case they're re-enabled later
      gpt4: `Analyze the provided sequence of frames from a robotic dashcam video.
Identify different segments of activities in the video, such as:
1. Robot picks up an object
2. Robot places an object
3. Robot navigates to a location
4. Robot manipulates a tool
5. Robot interacts with a human
6. Robot performs an inspection

For each identified segment, provide:
1. The start and end timestamps
2. A clear description of what the robot is doing`,
      
      claude: `Analyze the provided sequence of frames from a robotic dashcam video.
The frames are from a video showing a robot performing various tasks.

Identify different segments of activities in the video, such as:
1. Robot picks up an object
2. Robot places an object
3. Robot navigates to a location
4. Robot manipulates a tool
5. Robot interacts with a human
6. Robot performs an inspection

For each identified segment, provide:
1. The start and end timestamps
2. A clear description of what the robot is doing`,
      
      custom: `Analyze the provided video to identify distinct robot activities.
For each segment, provide start time, end time, and description.`
    };
    
    return prompts[model] || prompts.gemini;
  }

  // When model changes, update the default prompt
  const handleModelChange = (model) => {
    setSelectedModel(model);
    setCustomPrompt(getDefaultPrompt(model));
  };

  const handleVideoUpload = async (url, fileObject) => {
    // Clear previous results and errors
    setAnalysisResults(null);
    setError(null);
    
    // Store video information
    setVideoUrl(url);
    setVideoFile(fileObject);
    
    // Start analysis process
    startAnalysis(url, fileObject);
  };
  
  const startAnalysis = async (url = videoUrl, fileObject = videoFile) => {
    if (!url) return;
    
    // Clear any previous errors
    setError(null);
    
    // Create new abort controller for this request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort(); // Cancel any previous request
    }
    abortControllerRef.current = new AbortController();
    
    setIsLoading(true);
    setProgressStage(0);
    
    try {
      // Create form data for the request
      const formData = new FormData();
      
      if (fileObject) {
        formData.append('video', fileObject);
      } else {
        formData.append('video_url', url);
      }
      
      formData.append('model', selectedModel);
      formData.append('custom_prompt', customPrompt);
      
      // Set a timeout (5 minutes)
      const timeoutId = setTimeout(() => {
        abortControllerRef.current.abort();
        throw new Error('Analysis timed out. The video may be too large or complex.');
      }, 5 * 60 * 1000);
      
      // Add progress simulation
      let progressInterval = simulateProgress();
      
      // Make the API request
      const response = await fetch('http://127.0.0.1:5000/analyze', {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current.signal,
      });
      
      // Clear timeout and progress simulation
      clearTimeout(timeoutId);
      clearInterval(progressInterval);
      
      // Process response
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status} ${response.statusText}`);
      }
      
      // Set progress to the last stage
      setProgressStage(3); // Processing results stage
      
      // Parse and store results
      const data = await response.json();
      setAnalysisResults(data.segments || []);
      
      // Complete loading
      setIsLoading(false);
      
    } catch (error) {
      console.error('Error analyzing video:', error);
      
      // Only show error if it wasn't aborted manually
      if (error.name !== 'AbortError' || !abortControllerRef.current.signal.aborted) {
        setError(error.message || 'Failed to analyze video');
      }
      
      setIsLoading(false);
    }
  };
  
  const cancelAnalysis = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  };
  
  const dismissError = () => {
    setError(null);
  };
  
  // Function to simulate progress for better UX
  const simulateProgress = () => {
    return setInterval(() => {
      setProgressStage(prev => {
        // Don't advance to final stage (3) automatically - that happens on success
        return prev < 2 ? prev + 1 : prev;
      });
    }, 5000);
  };

  return (
    <div className="app-container">
      <header>
        <h1>Robotic Dashcam Video Analyzer</h1>
        <p className="app-description">
          Automatically identify and label robot activities in videos using AI
        </p>
      </header>
      
      <main>
        <div className="control-panel">
          <ModelSelector
            selectedModel={selectedModel}
            onModelChange={handleModelChange}
          />
          
          <PromptInput 
            defaultPrompt={getDefaultPrompt(selectedModel)}
            onPromptChange={setCustomPrompt}
          />
          
          <VideoUploader 
            onVideoUpload={handleVideoUpload}
            isLoading={isLoading}
          />
        </div>
        
        <div className="content-panel">
          {/* Error Message Component */}
          <ErrorMessage 
            error={error}
            onRetry={() => startAnalysis()}
            onDismiss={dismissError}
          />
          
          {/* Loading Progress Indicator */}
          <AnalysisProgress 
            isLoading={isLoading}
            progressStage={progressStage}
            onCancel={cancelAnalysis}
          />
          
          {/* Video Player Component */}
          {videoUrl && !isLoading && (
            <VideoPlayer 
              url={videoUrl} 
              segments={analysisResults}
            />
          )}
          
          {/* Analysis Results Component */}
          {!isLoading && analysisResults && (
            <AnalysisResults 
              results={analysisResults} 
              onSegmentClick={(startTime) => {
                const videoElement = document.querySelector('video');
                if (videoElement) {
                  videoElement.currentTime = startTime;
                  videoElement.play().catch(e => console.error('Error playing video:', e));
                }
              }}
            />
          )}
          
          {/* No Results Message */}
          {!isLoading && !error && analysisResults && analysisResults.length === 0 && (
            <div className="no-results-message">
              <div className="message-icon">
                <span className="material-icons">search_off</span>
              </div>
              <h3>No Activities Detected</h3>
              <p>The AI model couldn't identify any distinct robot activities in this video.</p>
              <button onClick={() => startAnalysis()} className="retry-button">
                Try Again with Different Settings
              </button>
            </div>
          )}
        </div>
      </main>
      
      <footer>
        <p>
          This application uses Google's Gemini AI for video analysis. 
          <br />
          For best results, use videos that clearly show robot movements and activities.
        </p>
      </footer>
    </div>
  );
}

export default App;