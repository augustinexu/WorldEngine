"""
Gemini Video Processor Module
Uses Google's Gemini API for video analysis
"""
import os
import json
import time
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env file

class GeminiVideoProcessor:
    def __init__(self, model_name="gemini-1.5-pro-latest"):
        """
        Initializes the GeminiVideoProcessor.

        Args:
            model_name (str): The name of the Gemini model to use
                               (e.g., 'gemini-1.5-pro-latest', 'gemini-2.5-pro-latest').
                               Models like 1.5 Pro or newer are recommended for video.
        """
        # Configure the Gemini API with your API key
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")

        genai.configure(api_key=api_key)
        print(f"Initializing Gemini model: {model_name}")
        self.model = genai.GenerativeModel(model_name)
        self.model_name = model_name # Store for reference

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
            return None # Indicate failure to parse

    def analyze_video(self, video_path: str, request_timeout: int = 600):
        """
        Analyzes a video file using the Gemini API by uploading it first.

        Args:
            video_path (str): Path to the local video file.
            request_timeout (int): Timeout in seconds for the API generation request.

        Returns:
            dict: A dictionary containing the analysis results (list of segments)
                  or an empty list if analysis fails. Returns None on critical error.
        """
        print(f"\nStarting video analysis for: {video_path}")
        print(f"Using model: {self.model_name}")

        uploaded_file_object = None # To store the file object for cleanup

        try:
            # 1. Check if file exists
            if not os.path.exists(video_path):
                print(f"Error: Video file not found at: {video_path}")
                return None # Critical error

            # 2. Upload the video file using the File API
            print(f"[1/4] Uploading file via File API: {video_path}...")
            uploaded_file_object = genai.upload_file(
                path=video_path,
                display_name=os.path.basename(video_path)
            )
            print(f"    Upload complete. File Name in API: {uploaded_file_object.name}")
            print(f"    File URI: {uploaded_file_object.uri}")

            # 3. Wait for the video file to be processed ('ACTIVE' state)
            print("[2/4] Processing video (this might take a few minutes)...")
            polling_interval_seconds = 15
            max_processing_time_seconds = 600 # Adjust if needed for very long videos
            start_time = time.time()

            file_state = uploaded_file_object.state.name
            while file_state == "PROCESSING":
                elapsed_time = time.time() - start_time
                if elapsed_time > max_processing_time_seconds:
                    raise TimeoutError(f"Video processing timed out after {max_processing_time_seconds} seconds.")

                print(f"    Status: PROCESSING (checking again in {polling_interval_seconds}s)...")
                time.sleep(polling_interval_seconds)
                # Fetch the latest status
                uploaded_file_object = genai.get_file(uploaded_file_object.name)
                file_state = uploaded_file_object.state.name

            if file_state != "ACTIVE":
                raise Exception(f"Video processing failed. Final state: {file_state}")

            print("    Status: ACTIVE. Video ready for analysis.")

            # 4. Define the Prompt for video analysis
            #    Instructing JSON output clearly is crucial.
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

            # 5. Generate content using the model
            print("[3/4] Sending video and prompt to Gemini for analysis...")

            # Construct the request content
            contents = [
                uploaded_file_object,  # Pass the file object
                prompt
            ]

            # Make the API call
            response = self.model.generate_content(
                contents,
                request_options={'timeout': request_timeout}
            )

            print("[4/4] Analysis received.")

            # 6. Process the response and attempt to parse JSON
            analysis_result = self._robust_json_load(response.text)

            if analysis_result and 'segments' in analysis_result:
                print("Successfully parsed analysis results.")
                return analysis_result
            else:
                print("Failed to get valid structured data from the model.")
                # Return empty structure on failure instead of fabricated data
                return {"segments": []}


        except FileNotFoundError:
             # Already handled logging inside the try block
             return None
        except Exception as e:
            print(f"An error occurred during video analysis: {e}")
            # Depending on severity, you might want to log traceback
            # import traceback
            # traceback.print_exc()
            return {"segments": []} # Return empty on general failure

        finally:
            # 7. Clean up: Delete the uploaded file from API storage
            if uploaded_file_object:
                 try:
                    print(f"\nCleaning up: Attempting to delete uploaded file {uploaded_file_object.name}...")
                    # Re-fetch just in case the object state is stale, though name should persist
                    file_to_delete = genai.get_file(name=uploaded_file_object.name)
                    if file_to_delete:
                        genai.delete_file(name=file_to_delete.name)
                        print("    File deleted successfully.")
                    else:
                        print("    File object not found for deletion (might have already been deleted or failed earlier).")
                 except Exception as delete_error:
                     print(f"    Warning: Failed to delete uploaded file {uploaded_file_object.name}. Error: {delete_error}")
                     print("    You may need to delete it manually via Google AI Studio or the API.")

