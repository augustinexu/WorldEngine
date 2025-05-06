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
# Update this function to only use Gemini
def get_model_processor(model_name):
    # Always return the Gemini processor regardless of the model_name
    return GeminiVideoProcessor()



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

        # We only use Gemini now
        try:
            processor = get_model_processor('gemini')
        except Exception as e:
            logger.error(f"Failed to initialize model processor: {e}")
            return jsonify({'error': 'Failed to initialize Gemini AI model.'}), 500

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

        # Check if file exists and is accessible
        if not os.path.exists(video_path) or os.path.getsize(video_path) == 0:
            return jsonify({'error': 'Video file is missing or empty'}), 400

        # Process using the Gemini model (direct video processing)
        try:
            results = processor.analyze_video(video_path)
            logger.info(f"Successfully analyzed video with Gemini model")

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