import os
import uuid
import urllib.request
from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
from werkzeug.utils import secure_filename

# Import AI model modules
from models.gemini_processor import GeminiVideoProcessor
from models.gpt4_processor import GPT4VideoProcessor
from models.claude_processor import ClaudeVideoProcessor

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

# Configuration
UPLOAD_FOLDER = 'temp_videos'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'webm'}


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# Factory function to get the appropriate model processor
def get_model_processor(model_name):
    processors = {
        'gemini': GeminiVideoProcessor(),
        # 'gpt4': GPT4VideoProcessor(),
        # 'claude': ClaudeVideoProcessor(),
    }
    return processors.get(model_name, GeminiVideoProcessor())  # Default to Gemini


def extract_frames(video_path, sample_rate=1):
    """
    Extract frames from a video at a given sample rate
    sample_rate: extract one frame every 'sample_rate' seconds
    """
    frames = []
    timestamps = []

    video = cv2.VideoCapture(video_path)
    fps = video.get(cv2.CAP_PROP_FPS)
    frame_interval = int(fps * sample_rate)

    if not video.isOpened():
        return [], []

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
    return frames, timestamps


def download_video(url, output_path):
    """Download video from URL to local path"""
    try:
        urllib.request.urlretrieve(url, output_path)
        return True
    except Exception as e:
        print(f"Error downloading video: {e}")
        return False


@app.route('/analyze', methods=['POST'])
def analyze_video():
    print(request.form)
    if 'video' not in request.files and 'video_url' not in request.form:
        return jsonify({'error': 'No video file or URL provided'}), 400

    # Get selected model
    model_name = request.form.get('model', 'gemini')
    processor = get_model_processor(model_name)

    video_path = None

    try:
        # Process uploaded file
        if 'video' in request.files:
            file = request.files['video']
            if file.filename == '':
                return jsonify({'error': 'No video file selected'}), 400

            if not allowed_file(file.filename):
                return jsonify({'error': 'File type not allowed'}), 400

            # Save uploaded file to temp directory
            filename = secure_filename(file.filename)
            unique_filename = f"{uuid.uuid4()}_{filename}"
            video_path = os.path.join(UPLOAD_FOLDER, unique_filename)
            file.save(video_path)

        # Process video URL
        elif 'video_url' in request.form:
            video_url = request.form['video_url']
            unique_filename = f"{uuid.uuid4()}.mp4"
            video_path = os.path.join(UPLOAD_FOLDER, unique_filename)

            # Download video from URL
            success = download_video(video_url, video_path)
            if not success:
                return jsonify({'error': 'Failed to download video from URL'}), 400

        # Extract frames from video for analysis
        frames, timestamps = extract_frames(video_path, sample_rate=1)  # 1 frame per second

        if not frames:
            return jsonify({'error': 'Failed to extract frames from video'}), 400

        # Process frames using the selected AI model
        if model_name in ['gpt4', 'claude']:
            frames, timestamps = extract_frames(video_path, sample_rate=1)
            results = processor.analyze_video(frames, timestamps, video_path)
        else:  # gemini
            results = processor.analyze_video(video_path)

        # Clean up temporary file
        try:
            os.remove(video_path)
        except:
            pass  # Ignore errors in cleanup

        return jsonify(results)

    except Exception as e:
        return jsonify({'error': f'Error processing video: {str(e)}'}), 500


if __name__ == '__main__':
    app.run(debug=True)