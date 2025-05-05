import React, { useState } from 'react';
import './PromptInput.css';

const PromptInput = ({ defaultPrompt, onPromptChange }) => {
  const [isCustomPrompt, setIsCustomPrompt] = useState(false);
  const [promptText, setPromptText] = useState(defaultPrompt);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggleCustomPrompt = () => {
    setIsCustomPrompt(!isCustomPrompt);
    if (!isCustomPrompt && !isExpanded) {
      setIsExpanded(true);
    }
  };

  const handlePromptChange = (e) => {
    setPromptText(e.target.value);
    onPromptChange(e.target.value);
  };

  const handleResetPrompt = () => {
    setPromptText(defaultPrompt);
    onPromptChange(defaultPrompt);
  };

  return (
    <div className="prompt-input-container">
      <div className="prompt-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h3>Analysis Instructions</h3>
        <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
      </div>
      
      {isExpanded && (
        <div className="prompt-content">
          <div className="prompt-options">
            <label className="toggle-container">
              <input 
                type="checkbox" 
                checked={isCustomPrompt}
                onChange={handleToggleCustomPrompt}
              />
              <span className="toggle-switch"></span>
              <span className="toggle-label">Use custom instructions</span>
            </label>
            
            {isCustomPrompt && (
              <button 
                className="reset-button"
                onClick={handleResetPrompt}
              >
                Reset to default
              </button>
            )}
          </div>
          
          {isCustomPrompt ? (
            <textarea
              className="prompt-textarea"
              value={promptText}
              onChange={handlePromptChange}
              placeholder="Enter custom instructions for the AI model..."
              rows={6}
            />
          ) : (
            <div className="default-prompt-display">
              <p>{defaultPrompt}</p>
            </div>
          )}
          
          <div className="prompt-info">
            <p>
              <i>Customize how the AI analyzes the video. You can ask it to focus on specific 
              robot behaviors, identify particular objects, or use specialized terminology.</i>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptInput;