# 🌬️ Breeze Celebrity Sounds - Python Backend

This backend powers the **Breeze Celebrity Sounds** web application, offering:

- 📰 **News aggregation** from RSS feeds
- 🧠 **News summarization** using Hugging Face transformer models
- 🗣️ **Text-to-speech synthesis** via voice cloning using XTTS-v2

---

## 🔧 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/breeze-celebrity-sounds.git
cd breeze-celebrity-sounds/backend
pip install -r requirements.txt
python app.py
```
### 🔌 API Endpoints
#### 1. GET /api/news
Fetch summarized news from an RSS feed.

Query Parameters:
rss_url (optional): URL of the RSS feed. Default is BBC News.

max_items (optional): Number of headlines to return. Default is 3.

#### 2. POST /api/voice/synthesize
Generate audio in a celebrity-like voice from input text.

JSON Body:

{
  "text": "Text to synthesize",
  "speaker_wav": "elon.wav",
  "language": "en"
}
Returns:
Path to the generated .wav file.

#### 3. GET /api/audio/<filename>
Download the synthesized audio file.

### 🤖 Models Used
#### 1. 🧠 News Summarization
Model: Falconsai/text_summarization

Framework: Hugging Face Transformers

Usage: Summarizes raw RSS feed headlines

#### 2. 🗣️ Voice Cloning
Model: coqui/XTTS-v2

Framework: Hugging Face Transformers + Coqui TTS

Usage: Converts text into speech mimicking a speaker from the provided .wav file

### 🧩 Integration with Frontend
Ensure the backend is running at http://localhost:5000 before starting the frontend.

The frontend will call backend endpoints to:

Fetch news

Generate summaries

Play synthesized celebrity-style audio

## ⚠️ Ethical Use Notice
This application uses voice cloning. If you are using real celebrity voices:

Do not use for public or commercial deployment without consent.

For demos and educational purposes, synthetic or placeholder voices are recommended.

