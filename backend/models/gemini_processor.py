"""
Gemini Video Processor Module
Uses Google's Gemini Pro Vision API for video analysis
"""
import os
import json
from PIL import Image
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env file


class GeminiVideoProcessor:
    def __init__(self):
        # Configure the Gemini API with your API key
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")

        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-pro-vision')

    def analyze_video(self, frames, timestamps, video_path=None):
        """
        Analyze video frames using Gemini Pro Vision.

        Args:
            frames: List of video frames (numpy arrays)
            timestamps: List of timestamps corresponding to each frame
            video_path: Path to the original video file (optional)

        Returns:
            Dictionary containing analysis results
        """
        try:
            # We'll use a subset of frames to avoid hitting API limits
            max_frames = 20  # Adjust based on API limits

            if len(frames) > max_frames:
                # Sample frames evenly
                step = len(frames) // max_frames
                selected_indices = list(range(0, len(frames), step))[:max_frames]

                selected_frames = [frames[i] for i in selected_indices]
                selected_timestamps = [timestamps[i] for i in selected_indices]
            else:
                selected_frames = frames
                selected_timestamps = timestamps

            # Convert frames to PIL Images for Gemini API
            pil_images = []
            for frame in selected_frames:
                img = Image.fromarray(frame)
                pil_images.append(img)

            # Create prompt for Gemini
            prompt = """
            You are an AI assistant specialized in analyzing robotic videos. 
            Analyze the provided sequence of frames from a robotic dashcam video.

            Identify different segments of activities in the video, such as:
            1. Robot picks up an object
            2. Robot places an object
            3. Robot navigates to a location
            4. Robot manipulates a tool
            5. Robot interacts with a human
            6. Robot performs an inspection

            For each identified segment, provide:
            1. The start and end timestamps
            2. A clear description of what the robot is doing

            Format your response as a valid JSON object with this structure:
            {
              "segments": [
                {
                  "start_time": start_timestamp_in_seconds,
                  "end_time": end_timestamp_in_seconds,
                  "description": "Description of the robot's activity"
                },
                ...
              ]
            }
            """

            # Call Gemini API with the frames
            response = self.model.generate_content([prompt] + pil_images)

            # Extract the JSON response
            response_text = response.text

            # Find JSON content in the response
            try:
                # Try to find a JSON block in the response
                json_start = response_text.find('{')
                json_end = response_text.rfind('}') + 1

                if json_start >= 0 and json_end > json_start:
                    json_content = response_text[json_start:json_end]
                    result = json.loads(json_content)
                else:
                    # If no JSON block found, try to parse the entire response
                    result = json.loads(response_text)

                # Validate the result structure
                if 'segments' not in result:
                    result = {'segments': []}

                return result

            except json.JSONDecodeError:
                # If JSON parsing fails, create default segments based on heuristics
                # This is a fallback in case the model doesn't return valid JSON
                print(f"Failed to parse Gemini response as JSON. Creating default segments.")

                # Simple fallback: divide the video into equal segments
                total_duration = timestamps[-1]
                num_segments = min(3, len(selected_frames) // 2)  # At least 2 frames per segment
                segment_duration = total_duration / num_segments

                segments = []
                for i in range(num_segments):
                    start_time = i * segment_duration
                    end_time = (i + 1) * segment_duration

                    # Generate a basic description
                    description = f"Robot activity detected in segment {i + 1}"

                    segments.append({
                        "start_time": start_time,
                        "end_time": end_time,
                        "description": description
                    })

                return {"segments": segments}

        except Exception as e:
            print(f"Error in Gemini processing: {str(e)}")
            return {"segments": []}