# Breeze Celebrity Sounds - News Dashboard with Voice Synthesis

A modern news dashboard application that allows users to browse news articles by category and listen to them using various voice profiles. The application features a React/TypeScript frontend with a Flask backend for news fetching and text-to-speech synthesis.

## Features

- Browse news articles from various sources
- Filter news by categories (Politics, Technology, Sports, Entertainment, Science)
- Listen to news articles with different voice profiles
- Responsive design with modern UI

## Technology Stack

### Frontend
- React with TypeScript
- Vite for fast development and building
- Tailwind CSS for styling
- Shadcn UI components
- Custom audio player component

### Backend
- Flask (Python)
- Google Text-to-Speech (gTTS) for voice synthesis
- RSS feed parsing with feedparser
- Audio processing with pydub

## Setup Instructions

### Prerequisites
- Node.js (v16+) and npm
- Python 3.8+ with pip
- Git

### Backend Setup

1. Clone the repository:
   ```sh
   git clone <repository-url>
   cd breeze-celebrity-sounds
   ```

2. Set up a Python virtual environment (recommended):
   ```sh
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install backend dependencies:
   ```sh
   pip install -r requirements.txt
   ```

4. Install additional dependencies for text-to-speech:
   ```sh
   pip install gTTS
   ```

5. Start the Flask backend server:
   ```sh
   python app.py
   ```
   The backend will run on http://localhost:5001

### Frontend Setup

1. Navigate to the project root directory:
   ```sh
   cd breeze-celebrity-sounds
   ```

2. Install frontend dependencies:
   ```sh
   npm install
   ```

3. Start the development server:
   ```sh
   npm run dev
   ```
   The frontend will run on http://localhost:8080 or another port if 8080 is in use

## Voice Synthesis Models

### Primary TTS Model

The application uses Google Text-to-Speech (gTTS) for voice synthesis. This is a lightweight, reliable TTS service that provides high-quality speech synthesis across multiple languages and accents.

Features of gTTS:
- Multiple language support
- Various accents (US, UK, Australian, Indian, etc.)
- Speed control (normal/slow)
- No local model loading required

### Voice Profiles

The application includes multiple voice profiles mapped to different language and accent combinations:

1. **English Voices**:
   - US English
   - UK English
   - Australian English
   - Indian English
   - Canadian English

2. **Other Languages**:
   - French
   - German
   - Spanish
   - Italian
   - Portuguese
   - Dutch
   - Japanese

3. **Speed Variations**:
   - Slow US English
   - Slow UK English
   - Slow French
   - Slow German
   - Slow Spanish

### Fallback Mechanism

The application includes a robust fallback mechanism:
1. Primary attempt: gTTS synthesis with the selected voice profile
2. Secondary fallback: Direct gTTS with simplified settings
3. Final fallback: Sample audio files or generated sine wave

## Project Structure

- `/src` - Frontend React application
  - `/components` - React components including AudioPlayer and Dashboard
  - `/services` - API services for voice synthesis and news fetching
- `/backend` - Flask backend
  - `app.py` - Main Flask application with API endpoints
  - `setup_voices.py` - Script for setting up voice samples
  - `/voice_samples` - Directory containing voice sample files

## Troubleshooting

- If you encounter issues with audio playback, check browser console for errors
- For backend errors, check the Flask server logs
- Make sure both frontend and backend servers are running simultaneously
- If voice synthesis fails, the system will fall back to sample audio files

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/ced663de-b12d-4743-8f6b-8782fbbab91c) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
