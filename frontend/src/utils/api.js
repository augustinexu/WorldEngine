/**
 * API utilities for the Robotic Dashcam Video Analyzer
 * Provides functions for checking API status and handling common errors
 */

// Base API URL
const API_BASE_URL = 'http://127.0.0.1:5000';

/**
 * Check if the backend API is available and responsive
 * @returns {Promise<boolean>} True if API is available, false otherwise
 */
export const checkApiStatus = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      timeout: 5000 // 5 second timeout
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.status === 'ok';
    }
    return false;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
};

/**
 * Send a video analysis request to the backend
 * @param {FormData} formData - Form data containing video file/URL and other params
 * @param {AbortSignal} signal - AbortController signal for cancellation
 * @returns {Promise<Object>} Analysis results
 * @throws {Error} If the request fails
 */
export const analyzeVideo = async (formData, signal) => {
  try {
    // First check if API is available
    const isApiAvailable = await checkApiStatus();
    if (!isApiAvailable) {
      throw new Error('The analysis service is currently unavailable. Please check if the backend server is running.');
    }
    
    // Send the analysis request
    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      body: formData,
      signal: signal,
    });
    
    // Handle response
    if (!response.ok) {
      // Try to get the error message from the response
      try {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status} ${response.statusText}`);
      } catch (jsonError) {
        // If we can't parse the error as JSON, use a generic error message
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
    }
    
    // Parse and return the successful response
    const data = await response.json();
    return data;
    
  } catch (error) {
    // Re-throw AbortError as is (for cancellation handling)
    if (error.name === 'AbortError') {
      throw error;
    }
    
    // Handle specific error types
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error('Network error. Please check your internet connection and ensure the backend server is running.');
    }
    
    // Re-throw other errors
    throw error;
  }
};

/**
 * Format error messages to be more user-friendly
 * @param {Error|string} error - The error object or message
 * @returns {string} A user-friendly error message
 */
export const formatErrorMessage = (error) => {
  const errorMsg = error.message || error;
  
  // Map known error patterns to user-friendly messages
  if (errorMsg.includes('aborted') || errorMsg.includes('cancelled')) {
    return 'Analysis was cancelled.';
  }
  
  if (errorMsg.includes('timeout')) {
    return 'Analysis timed out. The video may be too long or complex for processing.';
  }
  
  if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
    return 'Network error. Please check your internet connection and ensure the backend server is running.';
  }
  
  if (errorMsg.includes('413') || errorMsg.includes('too large')) {
    return 'The video file is too large. Please try a smaller file (maximum 100MB) or use a URL instead.';
  }
  
  if (errorMsg.includes('Failed to download video')) {
    return 'Failed to access the video URL. Please check if the URL is correct and publicly accessible.';
  }
  
  if (errorMsg.includes('API key') || errorMsg.includes('_API_KEY')) {
    return 'Server configuration error. The API key appears to be missing or invalid. Please check the backend configuration.';
  }
  
  // Return the original message if no patterns match
  return errorMsg;
};

export default {
  checkApiStatus,
  analyzeVideo,
  formatErrorMessage
};