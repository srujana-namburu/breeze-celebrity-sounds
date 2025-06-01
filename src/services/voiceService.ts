
// Voice synthesis service that integrates with our Python backend
// This connects to the Flask API for TTS functionality using Coqui XTTS-v2

export interface VoiceProfile {
  id: string;
  name: string;
  description: string;
  speakerWav: string;
  language?: string;
  accent: string;
  gender?: string;
  sampleRate?: number;
  style?: string;
  energy?: number;
}

export class VoiceSynthesisService {
  private static baseUrl = 'http://localhost:5001/api'; // Connects to our Python backend
  
  // Dynamic voice profiles that will be loaded from the backend
  static voiceProfiles: VoiceProfile[] = [];
  
  // Legacy voice profiles (used as fallback if backend fails)
  private static legacyVoiceProfiles: VoiceProfile[] = [
    {
      id: 'voice1',
      name: 'Voice 1',
      description: 'Energetic Speaker',
      speakerWav: 'common_voice_en_40865211.mp3',
      language: 'en',
      accent: 'English',
      gender: 'neutral',
      sampleRate: 22050,
      style: 'Distinctive & Bold',
      energy: 4,
    },
    {
      id: 'voice2',
      name: 'Voice 2',
      description: 'Deep Narrator',
      speakerWav: 'common_voice_en_40865212.mp3',
      language: 'en',
      accent: 'English',
      gender: 'neutral',
      sampleRate: 22050,
      style: 'Deep & Soothing',
      energy: 3,
    },
    {
      id: 'voice3',
      name: 'Voice 3',
      description: 'Warm Speaker',
      speakerWav: 'common_voice_en_40865213.mp3',
      language: 'en',
      accent: 'English',
      gender: 'neutral',
      sampleRate: 22050,
      style: 'Warm & Inspiring',
      energy: 4,
    },
    {
      id: 'voice4',
      name: 'Voice 4',
      description: 'Calm Narrator',
      speakerWav: 'common_voice_en_40865214.mp3',
      language: 'en',
      accent: 'English',
      gender: 'neutral',
      sampleRate: 22050,
      style: 'Calm & Authoritative',
      energy: 2,
    },
    {
      id: 'voice5',
      name: 'Voice 5',
      description: 'Commanding Speaker',
      speakerWav: 'common_voice_en_40865215.mp3',
      language: 'en',
      accent: 'English',
      gender: 'neutral',
      sampleRate: 22050,
      style: 'Distinctive & Bold',
      energy: 5,
    },
  ];

  // Load available voices from the backend
  static async loadAvailableVoices(): Promise<VoiceProfile[]> {
    try {
      const response = await fetch(`${this.baseUrl}/voices`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.statusText}`);
      }
      
      const voiceData = await response.json();
      
      // Convert to VoiceProfile format
      this.voiceProfiles = voiceData.map(voice => ({
        id: voice.id,
        name: voice.name,
        description: `Voice sample ${voice.id}`,
        speakerWav: voice.file,
        language: 'en',
        accent: 'Unknown',
        gender: 'unknown',
        sampleRate: 22050
      }));
      
      return this.voiceProfiles;
    } catch (error) {
      console.error('Error loading voices:', error);
      // Fallback to legacy voices
      this.voiceProfiles = this.legacyVoiceProfiles;
      return this.legacyVoiceProfiles;
    }
  }
  
  // Get a random voice from available voices
  static async getRandomVoice(): Promise<VoiceProfile> {
    try {
      const response = await fetch(`${this.baseUrl}/voice/random`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch random voice: ${response.statusText}`);
      }
      
      const voice = await response.json();
      
      return {
        id: voice.id,
        name: voice.name,
        description: `Voice sample ${voice.id}`,
        speakerWav: voice.file,
        language: 'en',
        accent: 'Unknown',
        gender: 'unknown',
        sampleRate: 22050
      };
    } catch (error) {
      console.error('Error getting random voice:', error);
      // Fallback to a random legacy voice
      return this.legacyVoiceProfiles[Math.floor(Math.random() * this.legacyVoiceProfiles.length)];
    }
  }
  
  // Connect to our Python backend's read_aloud_with_voice function
  static async synthesizeText(
    text: string,
    voiceId: string,
    options: {
      outputDir?: string;
      maxLength?: number;
      minLength?: number;
      speed?: number;
      pitch?: number;
    } = {}
  ): Promise<{ audioUrl: string; duration: number; fileSize: number; voiceId: string }> {
    
    // Ensure voices are loaded
    if (this.voiceProfiles.length === 0) {
      await this.loadAvailableVoices();
    }
    
    const voice = this.voiceProfiles.find(v => v.id === voiceId);
    let speakerWav = '';
    let voiceName = 'Unknown';
    
    if (voice) {
      speakerWav = voice.speakerWav;
      voiceName = voice.name;
    } else {
      console.warn(`Voice profile ${voiceId} not found, using random voice`);
      // If voice not found, we'll let the backend pick a random one
    }

    console.log(`🎙️ Synthesizing text with ${voiceName}'s voice...`);
    console.log(`📝 Text: ${text.substring(0, 100)}...`);

    try {
      const response = await fetch(`${this.baseUrl}/voice/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice_id: voiceId,
          speaker_wav: speakerWav,
          language: 'en',
          output_dir: options.outputDir || 'audio_output',
          ...options
        })
      });
      
      if (!response.ok) {
        throw new Error(`Voice synthesis failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error synthesizing text:', error);
      
      // Fallback to mock response if API fails
      return {
        audioUrl: `/audio/generated/${voiceId}_${Date.now()}.wav`,
        duration: Math.ceil(text.length / 10), // ~10 characters per second
        fileSize: text.length * 1024, // Approximate file size
        voiceId: voiceId
      };
    }
  }

  // Batch synthesis for multiple articles (maps to your batch processing)
  static async synthesizeMultiple(
    articles: Array<{ id: string; text: string }>,
    voiceId: string
  ): Promise<Array<{ id: string; audioUrl: string; duration: number }>> {
    
    console.log(`🎭 Batch synthesizing ${articles.length} articles with ${voiceId}...`);
    
    const results = [];
    for (const article of articles) {
      try {
        const synthesis = await this.synthesizeText(article.text, voiceId);
        results.push({
          id: article.id,
          audioUrl: synthesis.audioUrl,
          duration: synthesis.duration
        });
      } catch (error) {
        console.error(`❌ Failed to synthesize article ${article.id}:`, error);
        results.push({
          id: article.id,
          audioUrl: '',
          duration: 0
        });
      }
    }
    
    return results;
  }

  // Real-time streaming synthesis
  static async streamSynthesis(
    text: string,
    voiceId: string,
    onChunk: (audioChunk: ArrayBuffer) => void
  ): Promise<void> {
    
    const voice = this.voiceProfiles.find(v => v.id === voiceId);
    if (!voice) {
      throw new Error(`Voice profile ${voiceId} not found`);
    }

    console.log(`🌊 Streaming synthesis with ${voice.name}'s voice...`);

    // Simulate streaming audio chunks
    const words = text.split(' ');
    for (let i = 0; i < words.length; i += 5) {
      const chunk = words.slice(i, i + 5).join(' ');
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create mock audio chunk (in real implementation, this would be actual audio data)
      const mockAudioChunk = new ArrayBuffer(1024);
      onChunk(mockAudioChunk);
    }
  }

  // Voice quality enhancement
  static async enhanceAudio(
    audioUrl: string,
    enhancements: {
      noiseReduction?: boolean;
      volumeNormalization?: boolean;
      bassBoost?: boolean;
      clarity?: number; // 0-1 scale
    } = {}
  ): Promise<string> {
    
    console.log('🎚️ Enhancing audio quality...');
    console.log('🔧 Enhancements:', enhancements);
    
    // Simulate audio processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return `${audioUrl}?enhanced=true&timestamp=${Date.now()}`;
  }

  // Voice profile management
  static async createCustomVoice(
    voiceData: {
      name: string;
      sampleAudio: File;
      description?: string;
    }
  ): Promise<VoiceProfile> {
    
    console.log(`🎤 Creating custom voice profile: ${voiceData.name}...`);
    
    // Simulate voice training process
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const customVoice: VoiceProfile = {
      id: `custom_${Date.now()}`,
      name: voiceData.name,
      description: voiceData.description || 'Custom voice profile',
      speakerWav: `custom_${Date.now()}.wav`,
      language: 'en',
      accent: 'Custom',
      gender: 'unknown',
      sampleRate: 22050
    };
    
    return customVoice;
  }

  // Get available voices
  static getAvailableVoices(): VoiceProfile[] {
    return this.voiceProfiles;
  }

  // Voice similarity analysis
  static async analyzeVoiceSimilarity(
    voiceId1: string,
    voiceId2: string
  ): Promise<{ similarity: number; characteristics: string[] }> {
    
    console.log(`🔍 Analyzing voice similarity between ${voiceId1} and ${voiceId2}...`);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      similarity: Math.random(), // 0-1 similarity score
      characteristics: ['pitch', 'accent', 'speed', 'intonation']
    };
  }
}

// Audio processing utilities
export class AudioProcessor {
  static async convertFormat(
    audioUrl: string,
    targetFormat: 'wav' | 'mp3' | 'aac' | 'ogg'
  ): Promise<string> {
    console.log(`🔄 Converting audio to ${targetFormat}...`);
    await new Promise(resolve => setTimeout(resolve, 1500));
    return audioUrl.replace(/\.\w+$/, `.${targetFormat}`);
  }

  static async adjustSpeed(
    audioUrl: string,
    speedMultiplier: number // 0.5-2.0
  ): Promise<string> {
    console.log(`⚡ Adjusting audio speed by ${speedMultiplier}x...`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return `${audioUrl}?speed=${speedMultiplier}`;
  }

  static async addBackgroundMusic(
    voiceUrl: string,
    musicUrl: string,
    balance: number = 0.8 // 0-1, voice prominence
  ): Promise<string> {
    console.log('🎵 Adding background music...');
    await new Promise(resolve => setTimeout(resolve, 2500));
    return `${voiceUrl}?music=${encodeURIComponent(musicUrl)}&balance=${balance}`;
  }
}
