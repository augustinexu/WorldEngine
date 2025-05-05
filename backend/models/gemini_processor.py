"""
Gemini Video Processor Module
Uses Google's Gemini API for video analysis
"""
import os
import json
import time
from google import genai
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env file

class GeminiVideoProcessor:
    def __init__(self, model_name="gemini-1.5-pro-latest"):
        """
        Initializes the GeminiVideoProcessor.

        Args:
            model_name (str): The name of the Gemini model to use
                               (e.g., 'gemini-1.5-pro-latest', 'gemini-2.0-flash').
                               Models like 1.5 Pro or newer are recommended for video.
        """
        # Configure the Gemini API with your API key
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")

        self.client = genai.Client(api_key=api_key)
        self.model_name = model_name  # Store for reference
        print(f"Initializing Gemini model: {model_name}")

    def _robust_json_load(self, text_response):
        """Attempts to extract and load JSON from a text response."""
        # Try finding JSON within ```json ... ``` markdown blocks
        try:
            json_block_start = text_response.find('```json')
            if json_block_start != -1:
                json_start = text_response.find('{', json_block_start)
                json_end = text_response.rfind('}') + 1
                if json_start != -1 and json_end > json_start:
                    json_str = text_response[json_start:json_end]
                    return json.loads(json_str)

            # If no markdown block, try finding the first '{' and last '}'
            json_start = text_response.find('{')
            json_end = text_response.rfind('}') + 1
            if json_start != -1 and json_end > json_start:
                json_str = text_response[json_start:json_end]
                return json.loads(json_str)

            # If still no luck, try parsing the whole thing (might fail)
            return json.loads(text_response)

        except json.JSONDecodeError as e:
            print(f"Warning: Failed to decode JSON from response. Error: {e}")
            print(f"Raw response text was:\n---\n{text_response}\n---")
            return None  # Indicate failure to parse

    def analyze_video(self, video_path: str, request_timeout: int = 600):
        """
        Analyzes a video file using the Gemini API.
        Uses inline video data if < 20MB, otherwise uploads the file.

        Args:
            video_path (str): Path to the local video file.
            request_timeout (int): Timeout in seconds for the API generation request.

        Returns:
            dict: A dictionary containing the analysis results (list of segments)
                  or an empty list if analysis fails. Returns None on critical error.
        """
        print(f"\nStarting video analysis for: {video_path}")
        print(f"Using model: {self.model_name}")

        try:
            # 1. Check if file exists
            if not os.path.exists(video_path):
                print(f"Error: Video file not found at: {video_path}")
                return None  # Critical error

            # 2. Check file size to determine processing method (inline vs upload)
            file_size_mb = os.path.getsize(video_path) / (1024 * 1024)
            print(f"Video file size: {file_size_mb:.2f} MB")

            # 3. Define the prompt for video analysis
            prompt = """
            You are an AI assistant specialized in analyzing robotic videos.
            Analyze the provided video file, which contains footage from a robot's perspective or observing a robot.

            Identify the distinct sequential segments of activities performed by the robot. Examples include:
            - Picking up an object
            - Placing an object
            - Navigating between locations
            - Manipulating a tool or part
            - Interacting with its environment (e.g., opening a door, pressing a button)
            - Performing an inspection task
            - Waiting or idle periods (if significant)

            For each identified segment, determine:
            1. The start time of the segment (in total seconds from the video start, e.g., 12.5).
            2. The end time of the segment (in total seconds from the video start, e.g., 18.0).
            3. A concise, clear description of the robot's primary activity during that segment.

            Format your entire response *only* as a single, valid JSON object. Do not include any text before or after the JSON object.
            Use the following structure:
            {
              "segments": [
                {
                  "start_time": <start_timestamp_in_seconds_float>,
                  "end_time": <end_timestamp_in_seconds_float>,
                  "description": "<Description of the robot's activity>"
                },
                {
                  "start_time": <start_timestamp_in_seconds_float>,
                  "end_time": <end_timestamp_in_seconds_float>,
                  "description": "<Description of the next activity>"
                },
                ...
              ]
            }

            Ensure timestamps are floating-point numbers representing seconds.
            Ensure the segments cover the relevant activities chronologically.
            """

            # 4. Process based on file size
            if file_size_mb < 20:  # Process inline if less than 20MB
                print("[1/2] Processing video inline (file < 20MB)...")

                # Read video file as bytes
                with open(video_path, 'rb') as video_file:
                    video_bytes = video_file.read()

                # Determine video mime type based on extension
                mime_type = 'video/mp4'  # Default
                if video_path.lower().endswith('.avi'):
                    mime_type = 'video/x-msvideo'
                elif video_path.lower().endswith('.mov'):
                    mime_type = 'video/quicktime'
                elif video_path.lower().endswith('.webm'):
                    mime_type = 'video/webm'

                # Create content parts with inline video data
                content = genai.types.Content(
                    parts=[
                        genai.types.Part(
                            inline_data=genai.types.Blob(
                                data=video_bytes,
                                mime_type=mime_type
                            )
                        ),
                        genai.types.Part(text=prompt)
                    ]
                )

                print("[2/2] Sending video and prompt to Gemini for analysis...")
                # Make the API call with inline video data
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=content
                )

            else:  # Upload file if 20MB or larger
                print("[1/4] Video file is >= 20MB. Uploading via File API...")
                # Upload the video file
                uploaded_file = self.client.files.upload(file=video_path)
                print(f"    Upload complete. File ID in API: {uploaded_file.name}")

                # Wait for the video file to be processed
                print("[2/4] Checking file status...")
                file_object = self.client.files.get(name=uploaded_file.name)

                # Simple status check (not a loop in this version)
                print(f"    File state: {file_object.state}")

                # Prepare content with file reference
                content = [prompt, uploaded_file]

                print("[3/4] Sending file reference and prompt to Gemini for analysis...")
                # Make the API call with file reference
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=content,
                    generation_config={"temperature": 0.2, "max_output_tokens": 2048}
                )
                print("[4/4] Analysis received.")

                # Clean up uploaded file
                try:
                    self.client.files.delete(name=file_object.name)
                    print(f"    Uploaded file {file_object.name} deleted successfully.")
                except Exception as delete_error:
                    print(f"    Warning: Failed to delete uploaded file. Error: {delete_error}")

            # 5. Process the response and parse JSON
            if hasattr(response, 'candidates') and response.candidates:
                # For newer API structure
                response_text = response.candidates[0].content.parts[0].text
            else:
                # Fall back to checking text attribute directly
                response_text = response.text

            print(f"Response type: {type(response)}")
            print(f"Response preview: {str(response)[:100]}...")

            # Parse the response text
            analysis_result = self._robust_json_load(response_text)

            if analysis_result and 'segments' in analysis_result:
                print("Successfully parsed analysis results.")
                return analysis_result
            else:
                print("Failed to get valid structured data from the model.")
                # Return empty structure on failure
                return {"segments": []}

        except Exception as e:
            print(f"An error occurred during video analysis: {str(e)}")
            import traceback
            traceback.print_exc()
            return {"segments": []}  # Return empty on general failure