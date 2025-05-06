import os
import uuid
import urllib.request
from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
from werkzeug.utils import secure_filename
import logging
import time

# Import AI model modules
from models.gemini_processor import GeminiVideoProcessor
from models.gpt4_processor import GPT4VideoProcessor
from models.claude_processor import ClaudeVideoProcessor

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("backend.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

# Configuration
UPLOAD_FOLDER = 'temp_videos'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'webm'}
MAX_CONTENT_LENGTH = 100 * 1024 * 1024  # 100MB max upload size


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# Factory function to get the appropriate model processor
def get_model_processor(model_name):
    processors = {
        'gemini': GeminiVideoProcessor(),
        'gpt4': GPT4VideoProcessor(),
        'claude': ClaudeVideoProcessor(),
    }

    # Check if the selected model is enabled
    try:
        processor = processors.get(model_name)
        if processor:
            return processor
        else:
            logger.warning(f"Unknown model requested: {model_name}, falling back to Gemini")
            return GeminiVideoProcessor()
    except Exception as e:
        logger.error(f"Error initializing {model_name} processor: {e}")
        # If there's an error with the requested model, fall back to Gemini
        return GeminiVideoProcessor()


def extract_frames(video_path, sample_rate=1):
    """
    Extract frames from a video at a given sample rate
    sample_rate: extract one frame every 'sample_rate' seconds
    """
    frames = []
    timestamps = []

    video = cv2.VideoCapture(video_path)
    if not video.isOpened():
        logger.error(f"Failed to open video: {video_path}")
        return [], []

    fps = video.get(cv2.CAP_PROP_FPS)
    frame_interval = int(fps * sample_rate)

    frame_count = 0
    while True:
        ret, frame = video.read()
        if not ret:
            break

        if frame_count % frame_interval == 0:
            # Convert frame from BGR to RGB
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            frames.append(frame_rgb)
            timestamps.append(frame_count / fps)

        frame_count += 1

    video.release()
    logger.info(f"Extracted {len(frames)} frames from video")
    return frames, timestamps


def download_video(url, output_path):
    """Download video from URL to local path"""
    try:
        # Validate URL format
        if not (url.startswith('http://') or url.startswith('https://')):
            raise ValueError("Invalid URL format")

        # Add timeout to prevent hanging on large downloads
        urllib.request.urlretrieve(url, output_path)
        return True
    except Exception as e:
        logger.error(f"Error downloading video: {e}")
        raise ValueError(f"Failed to download video: {str(e)}")


# Add a custom error handler for large files
@app.errorhandler(413)
def request_entity_too_large(error):
    return jsonify({'error': 'File too large. Maximum size is 100MB.'}), 413


@app.route('/analyze', methods=['POST'])
def analyze_video():
    try:
        # Validate input
        if 'video' not in request.files and 'video_url' not in request.form:
            return jsonify({'error': 'No video file or URL provided'}), 400

        # Get selected model
        model_name = request.form.get('model', 'gemini')
        try:
            processor = get_model_processor(model_name)
        except Exception as e:
            logger.error(f"Failed to initialize model processor: {e}")
            return jsonify({'error': 'Failed to initialize AI model. Please try a different model.'}), 500

        video_path = None

        # Process uploaded file
        if 'video' in request.files:
            file = request.files['video']
            if file.filename == '':
                return jsonify({'error': 'No video file selected'}), 400

            if not allowed_file(file.filename):
                return jsonify({'error': 'File type not allowed. Supported formats: MP4, AVI, MOV, WEBM'}), 400

            # Save uploaded file to temp directory
            filename = secure_filename(file.filename)
            unique_filename = f"{uuid.uuid4()}_{filename}"
            video_path = os.path.join(UPLOAD_FOLDER, unique_filename)
            file.save(video_path)
            logger.info(f"Saved uploaded file: {video_path}")

        # Process video URL
        elif 'video_url' in request.form:
            video_url = request.form['video_url']
            # Basic URL validation
            if not (video_url.startswith('http://') or video_url.startswith('https://')):
                return jsonify({'error': 'Invalid URL format. URL must start with http:// or https://'}), 400

            unique_filename = f"{uuid.uuid4()}.mp4"
            video_path = os.path.join(UPLOAD_FOLDER, unique_filename)

            # Download video from URL
            try:
                success = download_video(video_url, video_path)
                if not success:
                    return jsonify({'error': 'Failed to download video from URL'}), 400
                logger.info(f"Downloaded video from URL to: {video_path}")
            except ValueError as e:
                return jsonify({'error': str(e)}), 400

        # Extract frames from video for analysis
        try:
            frames, timestamps = extract_frames(video_path, sample_rate=1)  # 1 frame per second
        except Exception as e:
            logger.error(f"Frame extraction error: {e}")
            return jsonify({'error': 'Failed to extract frames from video. The file may be corrupted.'}), 400

        if not frames:
            return jsonify({'error': 'Failed to extract frames from video. The file may be empty or corrupted.'}), 400

        # Process frames using the selected AI model
        try:
            # Get custom prompt if provided
            custom_prompt = request.form.get('custom_prompt', None)

            if model_name in ['gpt4', 'claude']:
                results = processor.analyze_video(frames, timestamps, video_path, custom_prompt)
            else:  # gemini
                results = processor.analyze_video(video_path)

            logger.info(f"Successfully analyzed video with {model_name} model")

            # Validate results structure
            if not isinstance(results, dict) or 'segments' not in results:
                results = {'segments': []}
        except Exception as e:
            logger.error(f"AI processing error: {e}")
            return jsonify({'error': f'Error during AI analysis: {str(e)}'}), 500

        # Clean up temporary file
        try:
            if os.path.exists(video_path):
                os.remove(video_path)
                logger.info(f"Removed temporary file: {video_path}")
        except Exception as e:
            logger.warning(f"Failed to remove temporary file: {e}")

        return jsonify(results)

    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        return jsonify({'error': 'An unexpected error occurred. Please try again later.'}), 500


# Add a health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'message': 'Server is running'}), 200


# Add a cleanup route to remove old temporary files (could be called by a cron job)
@app.route('/cleanup', methods=['POST'])
def cleanup_temp_files():
    try:
        # Only allow from localhost for security
        if request.remote_addr not in ['127.0.0.1', 'localhost']:
            return jsonify({'error': 'Unauthorized'}), 403

        count = 0
        # Get all files in the temp directory
        for filename in os.listdir(UPLOAD_FOLDER):
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            # Check if older than 24 hours
            if os.path.isfile(file_path) and (time.time() - os.path.getmtime(file_path)) > 86400:
                os.remove(file_path)
                count += 1

        return jsonify({'message': f'Cleaned up {count} temporary files'}), 200
    except Exception as e:
        logger.error(f"Cleanup error: {e}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    # Configure max request size
    app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH
    app.run(debug=True)