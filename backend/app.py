import feedparser
from transformers import pipeline
from TTS.api import TTS
import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import uuid
from pydub import AudioSegment
import tempfile
import random
import glob
import requests
import time
from datetime import datetime
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure directories
AUDIO_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "generated_audio")
os.makedirs(AUDIO_DIR, exist_ok=True)

# Set up voice samples directory
VOICE_SAMPLES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "voice_samples")
os.makedirs(VOICE_SAMPLES_DIR, exist_ok=True)

# Initialize TTS model with logging
tts = None  # Initialize as None first

# Import gTTS for text-to-speech synthesis
from gtts import gTTS
import io

# Initialize TTS
tts = None

# Create a wrapper class for gTTS that follows the same interface as TTS
class GTTSWrapper:
    def __init__(self):
        logging.info("Initializing gTTS wrapper for text-to-speech synthesis")
        # Map voice IDs to different language/accent combinations
        # This will create variety in the voices
        self.voice_profiles = {
            # English voices with different accents
            "common_voice_en_40865211": {"lang": "en", "tld": "com", "slow": False},      # US English
            "common_voice_en_40865212": {"lang": "en", "tld": "co.uk", "slow": False},   # UK English
            "common_voice_en_40865213": {"lang": "en", "tld": "com.au", "slow": False},  # Australian English
            "common_voice_en_40865214": {"lang": "en", "tld": "co.in", "slow": False},   # Indian English
            "common_voice_en_40865215": {"lang": "en", "tld": "ca", "slow": False},      # Canadian English
            
            # Other languages
            "common_voice_en_40865221": {"lang": "fr", "tld": "fr", "slow": False},      # French
            "common_voice_en_40865222": {"lang": "de", "tld": "de", "slow": False},      # German
            "common_voice_en_40865223": {"lang": "es", "tld": "es", "slow": False},      # Spanish
            "common_voice_en_40865224": {"lang": "it", "tld": "it", "slow": False},      # Italian
            "common_voice_en_40865225": {"lang": "pt", "tld": "com.br", "slow": False}, # Portuguese
            
            # Speed variations
            "common_voice_en_40865481": {"lang": "en", "tld": "com", "slow": True},     # Slow US English
            "common_voice_en_40865482": {"lang": "en", "tld": "co.uk", "slow": True},  # Slow UK English
            "common_voice_en_40865483": {"lang": "fr", "tld": "fr", "slow": True},     # Slow French
            "common_voice_en_40865484": {"lang": "de", "tld": "de", "slow": True},     # Slow German
            "common_voice_en_40865485": {"lang": "es", "tld": "es", "slow": True},     # Slow Spanish
            
            # Additional voices
            "common_voice_en_40865654": {"lang": "nl", "tld": "nl", "slow": False},     # Dutch
            "common_voice_en_40865655": {"lang": "ja", "tld": "jp", "slow": False},     # Japanese
        }
        
        # Fallback voice settings
        self.default_voice = {"lang": "en", "tld": "com", "slow": False}
    
    def tts_to_file(self, text, speaker_wav, language="en", file_path=None):
        """Generate speech from text and save to file"""
        logging.info(f"Generating speech for text: '{text[:50]}...' using gTTS")
        
        try:
            # Extract the voice ID from the speaker_wav path
            voice_id = os.path.splitext(os.path.basename(speaker_wav))[0]
            logging.info(f"Using voice ID: {voice_id}")
            
            # Get voice settings for this voice ID
            voice_settings = self.voice_profiles.get(voice_id, self.default_voice)
            logging.info(f"Voice settings: {voice_settings}")
            
            # For non-English languages, translate common phrases to make it sound more authentic
            # This is a simple approach - in a real app you'd use a translation service
            if voice_settings["lang"] != "en":
                # Add a simple greeting in the target language
                greetings = {
                    "fr": "Bonjour! Voici les nouvelles: ",
                    "de": "Guten Tag! Hier sind die Nachrichten: ",
                    "es": "¡Hola! Aquí están las noticias: ",
                    "it": "Buongiorno! Ecco le notizie: ",
                    "pt": "Olá! Aqui estão as notícias: ",
                    "nl": "Hallo! Hier is het nieuws: ",
                    "ja": "こんにちは！ニュースをお届けします: "
                }
                
                # Add greeting in the target language
                if voice_settings["lang"] in greetings:
                    text = greetings[voice_settings["lang"]] + text
            
            # Create gTTS object with the appropriate settings
            tts = gTTS(
                text=text,
                lang=voice_settings["lang"],
                tld=voice_settings["tld"],
                slow=voice_settings["slow"]
            )
            
            # Save to file
            tts.save(file_path)
            logging.info(f"Successfully saved speech to {file_path}")
            
            return file_path
            
        except Exception as e:
            logging.error(f"Error generating speech with gTTS: {e}")
            # Fallback to creating a simple audio file
            try:
                # Try to copy the speaker sample as fallback
                import shutil
                shutil.copy(speaker_wav, file_path)
                logging.info(f"Fallback: Copied speaker sample {speaker_wav} to {file_path}")
                return file_path
            except Exception as copy_error:
                logging.error(f"Error in fallback: {copy_error}")
                # Create a simple sine wave as last resort
                try:
                    import numpy as np
                    from scipy.io import wavfile
                    
                    # Create a 3-second sine wave at 440 Hz
                    sample_rate = 22050
                    duration = 3  # seconds
                    t = np.linspace(0, duration, int(sample_rate * duration))
                    audio = np.sin(2 * np.pi * 440 * t) * 0.5
                    
                    # Save as WAV file
                    wavfile.write(file_path, sample_rate, audio.astype(np.float32))
                    logging.info(f"Created sine wave audio file at {file_path}")
                    return file_path
                except Exception as sine_error:
                    logging.error(f"Error creating sine wave: {sine_error}")
                    # Last resort: create a minimal WAV file
                    with open(file_path, 'wb') as f:
                        # Write a minimal WAV header with some actual audio data
                        f.write(b'RIFF\x24\x00\x00\x00WAVE')
                        f.write(b'fmt \x10\x00\x00\x00\x01\x00\x01\x00\x44\xac\x00\x00\x88\x58\x01\x00\x02\x00\x10\x00')
                        f.write(b'data\x00\x10\x00\x00')
                        # Add some simple audio data (a short beep)
                        for i in range(8000):
                            value = int(32767 * 0.5 * np.sin(2 * np.pi * 440 * i / 22050))
                            f.write(value.to_bytes(2, byteorder='little', signed=True))
                    return file_path

# Initialize our gTTS wrapper
tts = GTTSWrapper()

# Function to get all available voice samples
def get_available_voices():
    # Get all audio files in the voice_samples directory
    mp3_files = glob.glob(os.path.join(VOICE_SAMPLES_DIR, "*.mp3"))
    wav_files = glob.glob(os.path.join(VOICE_SAMPLES_DIR, "*.wav"))
    
    # Combine all files
    all_files = mp3_files + wav_files
    
    if not all_files:
        logging.warning(f"No voice samples found in {VOICE_SAMPLES_DIR}")
        return []
    
    logging.info(f"Found {len(all_files)} voice samples: {len(mp3_files)} MP3, {len(wav_files)} WAV")
    
    # Create voice profiles
    voices = []
    for i, file_path in enumerate(all_files):
        voice_id = os.path.splitext(os.path.basename(file_path))[0]
        # Format the name to be more user-friendly
        name = "Voice " + str(i+1)
        if "common_voice" in voice_id:
            # For common voice samples, use a simpler name
            name = f"Voice {i+1}"
        else:
            # Try to make a readable name from the filename
            name = voice_id.replace("_", " ").title()
        
        voices.append({
            "id": voice_id,
            "name": name,
            "file_path": file_path,  # Store the full path
            "file": os.path.basename(file_path)  # Store just the filename for API responses
        })
    
    logging.info(f"Processed {len(voices)} voice profiles")
    return voices

# 1. Fetch latest news using RSS
def fetch_headlines(rss_url="http://feeds.bbci.co.uk/news/rss.xml", max_items=3, max_retries=3):
    # Try to fetch the RSS feed with retries
    for attempt in range(max_retries):
        try:
            # Use requests to fetch the RSS feed first to handle HTTP errors better
            response = requests.get(rss_url, timeout=10)
            response.raise_for_status()  # Raise an exception for HTTP errors
            
            # Parse the RSS feed
            feed = feedparser.parse(response.text)
            
            # Check if we got valid entries
            if not feed.entries:
                logging.warning(f"No entries found in feed from {rss_url}, attempt {attempt+1}/{max_retries}")
                if attempt < max_retries - 1:
                    time.sleep(1)  # Wait before retrying
                    continue
                else:
                    raise ValueError(f"No entries found in feed from {rss_url} after {max_retries} attempts")
            
            # Process the entries
            return [
                {
                    "id": str(uuid.uuid4()),
                    "title": entry.get("title", "Untitled"),
                    "summary": entry.get("summary", entry.get("description", "")),
                    "originalText": entry.get("summary", entry.get("description", "")),
                    "category": determine_category(entry),
                    "source": feed.feed.title if hasattr(feed, 'feed') and hasattr(feed.feed, 'title') else "News Source",
                    "publishedAt": entry.get("published", entry.get("pubDate", datetime.now().isoformat())),
                    "readTime": f"{len(entry.get('summary', entry.get('description', ''))) // 200 + 1} min read",
                    "trending": random.choice([True, False, False])  # Randomly mark some as trending
                }
                for entry in feed.entries[:max_items]
            ]
            
        except requests.exceptions.RequestException as e:
            logging.error(f"HTTP error fetching {rss_url}: {e}, attempt {attempt+1}/{max_retries}")
            if attempt < max_retries - 1:
                time.sleep(1)  # Wait before retrying
            else:
                raise
        except Exception as e:
            logging.error(f"Error parsing feed from {rss_url}: {e}, attempt {attempt+1}/{max_retries}")
            if attempt < max_retries - 1:
                time.sleep(1)  # Wait before retrying
            else:
                raise
    
    # If we get here, all retries failed
    raise Exception(f"Failed to fetch headlines from {rss_url} after {max_retries} attempts")

# 2. Summarize news using Hugging Face summarization pipeline
def summarize_news(news_items):
    summarizer = pipeline("summarization", model="Falconsai/text_summarization")
    
    for item in news_items:
        text_to_summarize = item["title"] + ". " + item["originalText"]
        summary = summarizer(
            text_to_summarize, 
            max_length=60, 
            min_length=15, 
            do_sample=False
        )[0]["summary_text"]
        item["summary"] = summary
    
    return news_items

# Helper function to determine the category of a news article
def determine_category(entry):
    # First check if the entry has a category field
    if entry.get("category"):
        return entry.get("category")
    
    # Check if there are tags
    if entry.get("tags"):
        for tag in entry.get("tags"):
            if tag.get("term"):
                return tag.get("term")
    
    # If no category or tags, try to determine from the title and summary
    title = entry.get("title", "").lower()
    summary = entry.get("summary", entry.get("description", "")).lower()
    content = title + " " + summary
    
    # Define keywords for each category
    politics_keywords = ["politics", "government", "president", "election", "vote", "parliament", "senate", "congress", "minister", "policy", "bill", "law"]
    tech_keywords = ["technology", "tech", "digital", "software", "hardware", "ai", "artificial intelligence", "computer", "internet", "app", "cyber", "robot"]
    sports_keywords = ["sport", "football", "soccer", "basketball", "tennis", "olympic", "championship", "tournament", "match", "game", "player", "team", "league", "cup"]
    entertainment_keywords = ["entertainment", "movie", "film", "music", "celebrity", "actor", "actress", "star", "tv", "show", "concert", "festival", "award"]
    science_keywords = ["science", "research", "study", "discovery", "scientist", "space", "nasa", "physics", "biology", "chemistry", "medicine", "health", "disease", "climate", "environment"]
    
    # Check for keyword matches
    for keyword in politics_keywords:
        if keyword in content:
            return "Politics"
    
    for keyword in tech_keywords:
        if keyword in content:
            return "Technology"
    
    for keyword in sports_keywords:
        if keyword in content:
            return "Sports"
    
    for keyword in entertainment_keywords:
        if keyword in content:
            return "Entertainment"
    
    for keyword in science_keywords:
        if keyword in content:
            return "Science"
    
    # Default category
    return "News"

# 3. Synthesize text to speech using gTTS
def synthesize_voice(text, voice_id=None):
    try:
        logging.info(f"Synthesizing voice for text: '{text[:30]}...' with voice_id: {voice_id}")
        
        # Get available voices
        voices = get_available_voices()
        logging.info(f"Found {len(voices)} available voices")
        
        # If no voice_id provided or not found, choose a random voice
        if voice_id is None or not any(v['id'] == voice_id for v in voices):
            selected_voice = random.choice(voices)
            voice_sample = selected_voice['file_path']
            voice_id = selected_voice['id']
            logging.info(f"Using random voice: {selected_voice['name']} ({os.path.basename(voice_sample)})")
        else:
            voice_sample = next(v['file_path'] for v in voices if v['id'] == voice_id)
            logging.info(f"Using selected voice: {voice_id} ({os.path.basename(voice_sample)})")
        
        # Generate a unique filename for the output
        output_file = os.path.join(AUDIO_DIR, f"{uuid.uuid4()}.mp3")
        logging.info(f"Output file will be: {output_file}")
        
        # Prepare the text to be spoken
        # Format it nicely with pauses between title and content
        if len(text) > 500:
            # If text is too long, truncate it
            formatted_text = text[:500] + "... That's all for this article."
        else:
            formatted_text = text
            
        # Synthesize speech
        logging.info("Starting TTS synthesis...")
        tts.tts_to_file(
            text=formatted_text,
            speaker_wav=voice_sample,
            language="en",
            file_path=output_file
        )
        logging.info("TTS synthesis completed successfully")
        
        # Verify the output file exists
        if not os.path.exists(output_file):
            logging.error(f"Output file was not created: {output_file}")
            raise FileNotFoundError(f"TTS failed to create output file: {output_file}")
        
        logging.info(f"Successfully generated audio file: {output_file}")
        return output_file
    
    except Exception as e:
        logging.error(f"Error in synthesize_voice: {e}")
        # Try a fallback approach
        try:
            # Create a simple output file as fallback
            output_file = os.path.join(AUDIO_DIR, f"{uuid.uuid4()}.mp3")
            
            # Use gTTS directly as a fallback
            tts_fallback = gTTS(text=text[:200] + "... That's all for now.", lang="en")
            tts_fallback.save(output_file)
            logging.info(f"Created fallback audio file using direct gTTS: {output_file}")
            return output_file
        except Exception as fallback_error:
            logging.error(f"Fallback TTS also failed: {fallback_error}")
            raise e
    
    return output_file

# API Routes
@app.route("/api/news", methods=["GET"])
def get_news():
    max_items = request.args.get("max_items", default=10, type=int)
    offset = request.args.get("offset", default=0, type=int)
    rss_url = request.args.get("rss_url", default="http://feeds.bbci.co.uk/news/rss.xml")
    
    # List of fallback RSS feeds to try if the requested one fails
    fallback_feeds = [
        "http://feeds.bbci.co.uk/news/rss.xml",
        "http://rss.cnn.com/rss/cnn_topstories.rss",
        "http://feeds.bbci.co.uk/news/world/rss.xml",
        "https://www.theguardian.com/world/rss",
        "https://www.reddit.com/r/worldnews/.rss"
    ]
    
    # Remove the requested URL from fallbacks if it's in there
    if rss_url in fallback_feeds:
        fallback_feeds.remove(rss_url)
    
    # Try the requested URL first
    feeds_to_try = [rss_url] + fallback_feeds
    
    # Store all fetched news items
    all_news = []
    
    for feed_url in feeds_to_try:
        try:
            logging.info(f"Attempting to fetch news from {feed_url}")
            # Fetch more items than requested to account for offset
            fetch_count = max_items + offset + 10  # Fetch extra to ensure we have enough after offset
            news = fetch_headlines(rss_url=feed_url, max_items=fetch_count)
            
            if news and len(news) > 0:
                logging.info(f"Successfully fetched {len(news)} headlines from {feed_url}")
                all_news.extend(news)
                # If we have enough news items, break the loop
                if len(all_news) >= max_items + offset:
                    break
            else:
                logging.warning(f"No news items returned from {feed_url}, trying next source")
        except Exception as e:
            logging.error(f"Error fetching news from {feed_url}: {e}")
    
    # If we have news items, summarize and return them with pagination
    if all_news:
        # Remove duplicates based on title
        unique_news = []
        seen_titles = set()
        
        for item in all_news:
            if item['title'] not in seen_titles:
                seen_titles.add(item['title'])
                unique_news.append(item)
        
        # Apply offset and limit
        paginated_news = unique_news[offset:offset + max_items] if offset < len(unique_news) else []
        
        if paginated_news:
            summarized_news = summarize_news(paginated_news)
            # Add pagination metadata
            response = {
                "items": summarized_news,
                "pagination": {
                    "total": len(unique_news),
                    "offset": offset,
                    "limit": max_items,
                    "hasMore": offset + max_items < len(unique_news)
                }
            }
            return jsonify(response)
    
    # If we get here, all sources failed or not enough items
    return jsonify({"error": "Failed to fetch news from all available sources"}), 500

@app.route("/api/voices", methods=["GET"])
def get_voices():
    """Return a list of all available voice samples"""
    try:
        voices = get_available_voices()
        return jsonify(voices)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/voice/random", methods=["GET"])
def get_random_voice():
    """Return a random voice from the available samples"""
    try:
        voices = get_available_voices()
        if not voices:
            return jsonify({"error": "No voice samples found"}), 404
        
        random_voice = random.choice(voices)
        return jsonify(random_voice)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/voice/synthesize", methods=["POST"])
def api_synthesize_voice():
    """Synthesize text to speech"""
    try:
        data = request.json
        text = data.get('text', '')
        voice_id = data.get('voice_id')
        title = data.get('title', '')
        summary = data.get('summary', '')
        
        if not text:
            return jsonify({"error": "No text provided"}), 400
        
        # Format the text for better speech synthesis
        # If title and summary are provided, format them nicely
        if title and summary:
            formatted_text = f"{title}. {summary}"
        else:
            formatted_text = text
            
        logging.info(f"Synthesizing text: '{formatted_text[:50]}...'")
        
        # Synthesize voice
        output_file = synthesize_voice(formatted_text, voice_id)
        
        # Get the filename from the path
        filename = os.path.basename(output_file)
        
        # Get audio duration using pydub if possible
        duration = 10  # Default duration
        try:
            if output_file.lower().endswith('.mp3'):
                audio = AudioSegment.from_mp3(output_file)
                duration = len(audio) / 1000  # Convert ms to seconds
            elif output_file.lower().endswith('.wav'):
                audio = AudioSegment.from_wav(output_file)
                duration = len(audio) / 1000  # Convert ms to seconds
        except Exception as e:
            logging.warning(f"Could not determine audio duration: {e}")
        
        # Create response object matching the frontend's expected format
        response = {
            "audioUrl": f"/api/audio/{filename}",
            "duration": duration,
            "fileSize": os.path.getsize(output_file),
            "voiceId": voice_id or "random"
        }

        logging.info(f"Returning response: {response}")
        return jsonify(response)
    except Exception as e:
        logging.error(f"Error in voice synthesis API: {str(e)}")
        import traceback
        logging.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route("/api/audio/<filename>", methods=["GET"])
def get_audio(filename):
    """Serve generated audio files"""
    try:
        # Determine the MIME type based on file extension
        mime_type = "audio/mpeg" if filename.lower().endswith(".mp3") else "audio/x-wav"
        return send_from_directory(AUDIO_DIR, filename, mimetype=mime_type)
    except Exception as e:
        logging.error(f"Error serving audio file {filename}: {e}")
        return jsonify({"error": f"Audio file not found: {filename}"}), 404

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5001)
