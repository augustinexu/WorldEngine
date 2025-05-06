import React, { useState } from 'react';
import VideoUploader from './components/VideoUploader';
import VideoPlayer from './components/VideoPlayer';
import AnalysisResults from './components/AnalysisResults';
import ModelSelector from './components/ModelSelector';
import PromptInput from './components/PromptInput';

function App() {
  const [videoUrl, setVideoUrl] = useState('');
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini');
  const [customPrompt, setCustomPrompt] = useState(getDefaultPrompt('gemini'));

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
    setVideoUrl(url);
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      
      if (fileObject) {
        formData.append('video', fileObject);
      } else {
        formData.append('video_url', url);
      }
      
      formData.append('model', selectedModel);
      formData.append('custom_prompt', customPrompt);
      
      const response = await fetch('http://127.0.0.1:5000/analyze', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze video');
      }
      
      const data = await response.json();
      setAnalysisResults(data.segments);
    } catch (error) {
      console.error('Error analyzing video:', error);
      alert('Failed to analyze video. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header>
        <h1>Robotic Dashcam Video Analyzer</h1>
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
          <VideoUploader onVideoUpload={handleVideoUpload} />
        </div>
        
        <div className="content-panel">
          {videoUrl && (
            <VideoPlayer 
              url={videoUrl} 
              segments={analysisResults}
            />
          )}
          
          {isLoading ? (
            <div className="loading-indicator">
              <p>Analyzing video... This may take a few minutes.</p>
              <div className="spinner"></div>
            </div>
          ) : analysisResults && (
            <AnalysisResults 
              results={analysisResults} 
              onSegmentClick={(startTime) => {
                document.querySelector('video').currentTime = startTime;
              }}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;