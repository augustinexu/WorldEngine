"""
Claude Vision Processor Module
Uses Anthropic's Claude 3 Vision API for video analysis
"""
import os
import base64
import json
from io import BytesIO
from PIL import Image
import anthropic
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env file


class ClaudeVideoProcessor:
    def __init__(self):
        # Configure the Anthropic API client
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY not found in environment variables")

        self.client = anthropic.Anthropic(api_key=api_key)
        self.model = "claude-3-opus-20240229"  # Using Opus for best vision capabilities

    def analyze_video(self, frames, timestamps, video_path=None, custom_prompt=None):
        """
        Analyze video frames using Claude 3's vision capabilities.

        Args:
            frames: List of video frames (numpy arrays)
            timestamps: List of timestamps corresponding to each frame
            video_path: Path to the original video file (optional)
            custom_prompt: Custom prompt to use for analysis (optional)

        Returns:
            Dictionary containing analysis results
        """
        try:
            # We'll use a subset of frames to avoid hitting API limits
            max_frames = 15  # Adjust based on API limits

            if len(frames) > max_frames:
                # Sample frames evenly
                step = len(frames) // max_frames
                selected_indices = list(range(0, len(frames), step))[:max_frames]

                selected_frames = [frames[i] for i in selected_indices]
                selected_timestamps = [timestamps[i] for i in selected_indices]
            else:
                selected_frames = frames
                selected_timestamps = timestamps

            # Convert frames to base64 for API
            content_blocks = []

            # Add the prompt as text block
            if custom_prompt:
                # Use the custom prompt provided by the user
                prompt = f"""
                {custom_prompt}

                The timestamps in seconds for each frame are as follows:
                {', '.join([f"Frame {i + 1}: {ts} seconds" for i, ts in enumerate(selected_timestamps)])}

                Format your response as a valid JSON object with this structure:
                {{
                  "segments": [
                    {{
                      "start_time": start_timestamp_in_seconds,
                      "end_time": end_timestamp_in_seconds,
                      "description": "Description of the robot's activity"
                    }},
                    ...
                  ]
                }}

                Only provide the JSON object with no additional text.
                """
            else:
                # Use the default prompt
                prompt = f"""
                Analyze the provided sequence of frames from a robotic dashcam video.

                The frames are from a video showing a robot performing various tasks.
                The timestamps in seconds for each frame are as follows:
                {', '.join([f"Frame {i + 1}: {ts} seconds" for i, ts in enumerate(selected_timestamps)])}

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
                {{
                  "segments": [
                    {{
                      "start_time": start_timestamp_in_seconds,
                      "end_time": end_timestamp_in_seconds,
                      "description": "Description of the robot's activity"
                    }},
                    ...
                  ]
                }}

                Only provide the JSON object with no additional text.
                """

            content_blocks.append({
                "type": "text",
                "text": prompt
            })

            # Add image blocks for each frame
            for i, (frame, ts) in enumerate(zip(selected_frames, selected_timestamps)):
                # Convert numpy array to PIL Image
                img = Image.fromarray(frame)

                # Convert PIL Image to base64
                buffered = BytesIO()
                img.save(buffered, format="JPEG")
                img_str = base64.b64encode(buffered.getvalue()).decode()

                # Add image block with timestamp
                content_blocks.append({
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": "image/jpeg",
                        "data": img_str
                    }
                })

            # Call Claude API
            response = self.client.messages.create(
                model=self.model,
                max_tokens=1000,
                temperature=0.2,
                system="You are an AI assistant specialized in analyzing robotic videos. You identify and describe robot activities in video frames.",
                messages=[
                    {
                        "role": "user",
                        "content": content_blocks
                    }
                ]
            )

            # Extract the response text
            response_text = response.content[0].text

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
                print(f"Failed to parse Claude response as JSON. Creating default segments.")

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
            print(f"Error in Claude processing: {str(e)}")
            return {"segments": []}