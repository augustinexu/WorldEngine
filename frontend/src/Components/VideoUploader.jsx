import React, { useState, useRef, useEffect } from 'react';
import './VideoUploader.css';

const VideoUploader = ({ onVideoUpload, isLoading }) => {
  const [urlInput, setUrlInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadMethod, setUploadMethod] = useState('url'); // 'url' or 'file'
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [urlError, setUrlError] = useState(null);
  const [showFileTip, setShowFileTip] = useState(false);
  
  const fileInputRef = useRef(null);
  const dropAreaRef = useRef(null);
  
  // Reset errors when upload method changes
  useEffect(() => {
    setFileError(null);
    setUrlError(null);
    setSelectedFile(null);
    setUrlInput('');
  }, [uploadMethod]);
  
  // Reset file error when a new file is selected
  useEffect(() => {
    if (selectedFile) {
      setFileError(null);
    }
  }, [selectedFile]);
  
  // Validate URL format
  const isValidVideoUrl = (url) => {
    // Basic URL validation
    const urlPattern = /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})(\/[\w.-]*)*\/?(\?([^&=]+=[^&=]+&?)*)?$/i;
    if (!urlPattern.test(url)) {
      return false;
    }
    
    // Check for common video hosts and extensions
    const videoHosts = ['youtube.com', 'youtu.be', 'vimeo.com', 'dailymotion.com', 'twitch.tv'];
    const videoExtensions = ['.mp4', '.avi', '.mov', '.webm', '.mkv', '.wmv'];
    
    const hasVideoHost = videoHosts.some(host => url.includes(host));
    const hasVideoExtension = videoExtensions.some(ext => url.toLowerCase().endsWith(ext));
    
    return hasVideoHost || hasVideoExtension;
  };
  
  const handleUrlSubmit = (e) => {
    e.preventDefault();
    setUrlError(null);
    
    const url = urlInput.trim();
    if (!url) {
      setUrlError('Please enter a video URL');
      return;
    }
    
    if (!isValidVideoUrl(url)) {
      setUrlError('Please enter a valid video URL');
      return;
    }
    
    onVideoUpload(url);
  };
  
  const validateFileType = (file) => {
    const validTypes = ['video/mp4', 'video/x-msvideo', 'video/quicktime', 'video/webm'];
    if (!validTypes.includes(file.type)) {
      return false;
    }
    return true;
  };
  
  const validateFileSize = (file) => {
    const maxSize = 100 * 1024 * 1024; // 100MB max size
    if (file.size > maxSize) {
      return false;
    }
    return true;
  };
  
  const handleFileUpload = (file) => {
    if (!file) {
      setFileError('No file selected');
      return;
    }
    
    // Check if it's a video file
    if (!validateFileType(file)) {
      setFileError('Please upload a valid video file (MP4, AVI, MOV, WEBM)');
      return;
    }
    
    // Check file size
    if (!validateFileSize(file)) {
      setFileError('File size exceeds the limit (100MB)');
      return;
    }
    
    // Store selected file information
    setSelectedFile(file);
    
    // Create URL for the uploaded file
    const fileUrl = URL.createObjectURL(file);
    
    // Pass the file to parent component
    onVideoUpload(fileUrl, file);
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e) => {
    // Only set dragging to false if the drag leave is from the drop area itself
    // and not from a child element
    if (e.target === dropAreaRef.current) {
      setIsDragging(false);
    }
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };
  
  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };
  
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };
  
  // Format file size display
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    else return (bytes / 1073741824).toFixed(1) + ' GB';
  };
  
  return (
    <div className="video-uploader">
      <div className="upload-method-selector">
        <button 
          className={uploadMethod === 'url' ? 'active' : ''} 
          onClick={() => setUploadMethod('url')}
          disabled={isLoading}
        >
          <span className="material-icons">link</span>
          URL
        </button>
        <button 
          className={uploadMethod === 'file' ? 'active' : ''} 
          onClick={() => setUploadMethod('file')}
          disabled={isLoading}
        >
          <span className="material-icons">upload_file</span>
          Local File
        </button>
      </div>
      
      {uploadMethod === 'url' ? (
        <div className="url-upload-section">
          <form onSubmit={handleUrlSubmit} className="url-form">
            <div className="input-container">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  setUrlError(null);
                }}
                placeholder="Enter video URL (YouTube, Vimeo, direct MP4 links, etc.)"
                className={`url-input ${urlError ? 'error' : ''}`}
                disabled={isLoading}
              />
              {urlError && <div className="error-message">{urlError}</div>}
            </div>
            
            <button 
              type="submit" 
              className="submit-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="material-icons spinning">sync</span>
              ) : (
                <span className="button-content">
                  <span className="material-icons">movie</span>
                  Analyze
                </span>
              )}
            </button>
          </form>
          
          <div className="url-examples">
            <p>Example URLs: YouTube video, Vimeo video, or direct links to MP4 files</p>
          </div>
        </div>
      ) : (
        <div className="file-upload-section">
          <div 
            ref={dropAreaRef}
            className={`file-drop-area ${isDragging ? 'dragging' : ''} ${fileError ? 'error' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={triggerFileInput}
          >
            {selectedFile ? (
              <div className="selected-file-info">
                <span className="material-icons file-icon">video_file</span>
                <div className="file-details">
                  <div className="file-name">{selectedFile.name}</div>
                  <div className="file-meta">{formatFileSize(selectedFile.size)}</div>
                </div>
                <button 
                  className="file-action-button" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                  disabled={isLoading}
                >
                  <span className="material-icons">close</span>
                </button>
              </div>
            ) : (
              <>
                <span className="material-icons drop-icon">cloud_upload</span>
                <p className="drop-title">Drag & drop video file here</p>
                <p className="drop-subtitle">or click to browse files</p>
                
                <label className="file-select-button" onClick={e => e.stopPropagation()}>
                  <span className="material-icons">folder_open</span>
                  Browse Files
                </label>
                
                {fileError && <div className="file-error-message">{fileError}</div>}
              </>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
              disabled={isLoading}
            />
          </div>
          
          <div className="file-upload-info">
            <button 
              className="info-button"
              onClick={() => setShowFileTip(!showFileTip)}
              type="button"
            >
              <span className="material-icons">info</span>
              File requirements
            </button>
            
            {showFileTip && (
              <div className="file-tip">
                <ul>
                  <li>Supported formats: MP4, AVI, MOV, WEBM</li>
                  <li>Maximum file size: 100MB</li>
                  <li>For best results, use videos with clear visibility of robot activities</li>
                  <li>Videos longer than 5 minutes may take longer to analyze</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoUploader;