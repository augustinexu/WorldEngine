import React, { useState } from 'react';
import VideoUploader from './components/VideoUploader';
import VideoPlayer from './components/VideoPlayer';
import AnalysisResults from './components/AnalysisResults';
import ModelSelector from './components/ModelSelector';

function App() {
  const [videoUrl, setVideoUrl] = useState('');
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini');

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
      
      const response = await fetch('http://localhost:5000/analyze', {
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
            onModelChange={setSelectedModel}
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