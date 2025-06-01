# Breeze Celebrity Sounds - Python Backend

This backend provides the API for the Breeze Celebrity Sounds web application, implementing:
1. RSS feed fetching and parsing
2. News summarization using Hugging Face transformers
3. Text-to-speech synthesis with celebrity-like voices using XTTS-v2

## Setup Instructions

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Voice Samples

Place your celebrity voice samples in the `voice_samples` directory:



### 3. Run the Server

```bash
python app.py
```

The server will run on http://localhost:5000 by default.

## API Endpoints

### Get News
`GET /api/news`

Query parameters:
- `max_items`: Maximum number of news items to return (default: 3)
- `rss_url`: URL of the RSS feed (default: BBC News)

### Synthesize Voice
`POST /api/voice/synthesize`

Request body:
```json
{
  "text": "Text to synthesize",
  "speaker_wav": "voicesample1.wav",
  "language": "en"
}
```

### Get Audio File
`GET /api/audio/<filename>`

Returns the generated audio file.

## Integration with Frontend

The frontend is configured to connect to this backend at http://localhost:5000. Make sure the backend is running before using the web application.
