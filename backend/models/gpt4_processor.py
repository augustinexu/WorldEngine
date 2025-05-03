"""
GPT-4 Vision Processor Module
Uses OpenAI's GPT-4 Vision API for video analysis
"""
import os
import base64
import json
from io import BytesIO
from PIL import Image
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env file


class GPT4VideoProcessor:
    def __init__(self):
        # Configure the OpenAI API client
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY not found in environment variables")

        self.client = OpenAI(api_key=api_key)
        self.model = "gpt-4-vision-preview"

    def analyze_video(self, frames, timestamps, video_path=None):
        """
        Analyze video frames using GPT-4 Vision.

        Args:
            frames: List of video frames (numpy arrays)
            timestamps: List of timestamps corresponding to each frame
            video_path: Path to the original video file (optional)

        Returns:
            Dictionary containing analysis results
        """
        try:
            # We'll use a subset of frames to avoid hitting API limits
            max_frames = 10  # GPT-4 Vision has a limit on the number of images

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
            base64_images = []
            for i, frame in enumerate(selected_frames):
                # Convert numpy array to PIL Image
                img = Image.fromarray(frame)

                # Convert PIL Image to base64
                buffered = BytesIO()
                img.save(buffered, format="JPEG")
                img_str = base64.b64encode(buffered.getvalue()).decode()

                # Add timestamp to each frame
                base64_images.append({
                    "image": img_str,
                    "timestamp": selected_timestamps[i]
                })

            # Create content messages with images
            messages = [
                {
                    "role": "system",
                    "content": "You are an AI assistant specialized in analyzing robotic videos. Your task is to identify different segments of activities in the video frames provided."
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": """
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

                            The timestamps in seconds for each frame are as follows:
                            """
                                    + "\n".join(
                                [f"Frame {i + 1}: {ts} seconds" for i, ts in enumerate(selected_timestamps)])
                        }
                    ]
                }
            ]

            # Add images to the message
            for i, img_data in enumerate(base64_images):
                messages[1]["content"].append({
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{img_data['image']}",
                        "detail": "high"
                    }
                })

            # Call GPT-4 Vision API
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=1000
            )

            # Extract the response text
            response_text = response.choices[0].message.content

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
                print(f"Failed to parse GPT-4 response as JSON. Creating default segments.")

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
            print(f"Error in GPT-4 processing: {str(e)}")
            return {"segments": []}