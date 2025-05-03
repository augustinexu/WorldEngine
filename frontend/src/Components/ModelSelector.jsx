import React from 'react';
import './ModelSelector.css';

const ModelSelector = ({ selectedModel, onModelChange }) => {
  const models = [
    { id: 'gemini', name: 'Google Gemini', description: 'Google\'s multimodal AI model with strong video understanding' },
    { id: 'gpt4', name: 'OpenAI GPT-4 Vision', description: 'OpenAI\'s multimodal vision model for analyzing visual content' },
    { id: 'claude', name: 'Anthropic Claude 3', description: 'Claude\'s vision capabilities for detailed video analysis' },
    { id: 'custom', name: 'Custom Model', description: 'Use your own fine-tuned model for robotic action recognition' }
  ];

  return (
    <div className="model-selector">
      <h3>Select AI Model</h3>
      <div className="model-options">
        {models.map(model => (
          <div 
            key={model.id}
            className={`model-option ${selectedModel === model.id ? 'selected' : ''}`}
            onClick={() => onModelChange(model.id)}
          >
            <div className="model-header">
              <h4>{model.name}</h4>
              <div className={`model-indicator ${selectedModel === model.id ? 'active' : ''}`}></div>
            </div>
            <p className="model-description">{model.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModelSelector;