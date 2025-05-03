import React, { useState } from 'react';
import './VideoUploader.css';

const VideoUploader = ({ onVideoUpload }) => {
  const [urlInput, setUrlInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadMethod, setUploadMethod] = useState('url'); // 'url' or 'file'
  
  const handleUrlSubmit = (e) => {
    e.preventDefault();
    if (urlInput.trim()) {
      onVideoUpload(urlInput);
    }
  };
  
  const handleFileUpload = (file) => {
    if (!file) return;
    
    // Check if it's a video file
    if (!file.type.startsWith('video/')) {
      alert('Please upload a video file.');
      return;
    }
    
    // Create URL for the uploaded file
    const fileUrl = URL.createObjectURL(file);
    onVideoUpload(fileUrl, file);
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };
  
  return (
    <div className="video-uploader">
      <div className="upload-method-selector">
        <button 
          className={uploadMethod === 'url' ? 'active' : ''} 
          onClick={() => setUploadMethod('url')}
        >
          URL
        </button>
        <button 
          className={uploadMethod === 'file' ? 'active' : ''} 
          onClick={() => setUploadMethod('file')}
        >
          Local File
        </button>
      </div>
      
      {uploadMethod === 'url' ? (
        <form onSubmit={handleUrlSubmit} className="url-form">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Enter video URL"
            className="url-input"
          />
          <button type="submit" className="submit-button">Analyze</button>
        </form>
      ) : (
        <div 
          className={`file-drop-area ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <p>Drag & drop video file here</p>
          <p>or</p>
          <input
            type="file"
            id="file-input"
            accept="video/*"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
            style={{ display: 'none' }}
          />
          <label htmlFor="file-input" className="file-select-button">
            Select Video
          </label>
        </div>
      )}
    </div>
  );
};

export default VideoUploader;