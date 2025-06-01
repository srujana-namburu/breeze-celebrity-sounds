
import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Mic, Settings, User } from 'lucide-react';
import { VoiceSynthesisService } from '../services/voiceService';

interface AudioPlayerProps {
  article: {
    id: string;
    title: string;
    summary: string;
    source: string;
  };
  voice: string;
  isPlaying: boolean;
  onPlayPause: (playing: boolean) => void;
  onClose: () => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ 
  article, 
  voice, 
  isPlaying, 
  onPlayPause, 
  onClose 
}) => {
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(180); // Default duration
  const [currentTime, setCurrentTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  // Fetch audio URL when article or voice changes
  useEffect(() => {
    if (!article || !voice) return;
    
    const synthesizeAudio = async () => {
      setIsLoading(true);
      setError('');
      setAudioUrl('');
      
      try {
        console.log(`Synthesizing article with voice ID: ${voice}`);
        console.log(`Article summary: ${article.summary.substring(0, 100)}...`);
        
        // Make a direct fetch call to the backend API for synthesis
        const response = await fetch('http://localhost:5001/api/voice/synthesize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: article.summary,
            voice_id: voice,
            max_length: 500
          })
        });
        
        if (!response.ok) {
          throw new Error(`Synthesis request failed: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('Synthesis result from API:', result);
        
        if (result && result.audioUrl) {
          // Make sure the URL is absolute by prepending the base URL if it's a relative path
          const baseUrl = 'http://localhost:5001';
          const audioUrl = result.audioUrl.startsWith('/') 
            ? `${baseUrl}${result.audioUrl}` 
            : result.audioUrl;
          
          console.log('Setting audio URL:', audioUrl);
          setAudioUrl(audioUrl);
          
          // Pre-load the audio to make sure it's ready to play
          const audioElement = new Audio(audioUrl);
          audioElement.addEventListener('canplaythrough', () => {
            console.log('Audio is ready to play through');
          });
          audioElement.addEventListener('error', (e) => {
            console.error('Audio preload error:', e);
          });
        } else {
          throw new Error('No audio URL returned from synthesis');
        }
      } catch (error) {
        console.error('Error synthesizing article:', error);
        setError('Failed to synthesize audio. Please try again.');
        onPlayPause(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    synthesizeAudio();
  }, [article, voice]);

  // Handle play/pause
  useEffect(() => {
    if (!audioRef.current || !audioUrl) return;
    
    const playAudio = async () => {
      try {
        if (isPlaying) {
          console.log('Attempting to play audio:', audioUrl);
          // Make sure the audio is loaded before playing
          if (audioRef.current.readyState < 2) { // HAVE_CURRENT_DATA
            await new Promise((resolve) => {
              const loadHandler = () => {
                console.log('Audio loaded and ready to play');
                resolve(true);
                audioRef.current?.removeEventListener('canplay', loadHandler);
              };
              audioRef.current?.addEventListener('canplay', loadHandler);
            });
          }
          
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch(error => {
              console.error('Error playing audio:', error);
              setError('Error playing audio. Please try again.');
              // Call onPlayPause to update the parent component's state
              onPlayPause(false);
            });
          }
        } else {
          audioRef.current.pause();
        }
      } catch (error) {
        console.error('Error in audio playback:', error);
        setError('Error playing audio. Please try again.');
        onPlayPause(false);
      }
    };
    
    playAudio();
  }, [isPlaying, audioUrl, onPlayPause]);

  // Update progress and current time
  useEffect(() => {
    if (!audioRef.current) return;
    
    const updateProgress = () => {
      if (!audioRef.current) return;
      
      const current = audioRef.current.currentTime;
      const total = audioRef.current.duration || duration;
      
      setCurrentTime(current);
      setProgress((current / total) * 100);
      
      // Debug logging
      console.log(`Audio progress: ${current}s / ${total}s (${Math.round((current / total) * 100)}%)`);
    };
    
    // Update progress every 500ms for smoother updates
    const interval = setInterval(updateProgress, 500);
    
    // Also update on timeupdate event
    audioRef.current.addEventListener('timeupdate', updateProgress);
    
    // Add additional event listeners for debugging
    audioRef.current.addEventListener('play', () => console.log('Audio play event fired'));
    audioRef.current.addEventListener('pause', () => console.log('Audio pause event fired'));
    audioRef.current.addEventListener('ended', () => console.log('Audio ended event fired'));
    audioRef.current.addEventListener('error', (e) => console.error('Audio error event:', e));
    
    return () => {
      clearInterval(interval);
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', updateProgress);
        audioRef.current.removeEventListener('play', () => {});
        audioRef.current.removeEventListener('pause', () => {});
        audioRef.current.removeEventListener('ended', () => {});
        audioRef.current.removeEventListener('error', () => {});
      }
    };
  }, [duration, audioUrl]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getVoiceName = (voiceId: string) => {
    // Get voice name from VoiceSynthesisService if available
    const voices = VoiceSynthesisService.getAvailableVoices();
    const voice = voices.find(v => v.id === voiceId);
    
    if (voice) {
      return voice.name;
    }
    
    // Fallback to generic voice names if not found
    if (voiceId.startsWith('voice')) {
      return `Voice ${voiceId.replace('voice', '')}`;
    }
    
    return 'Unknown Voice';
  };

  return (
    <Card className="glass-morphic border-t border-white/20 rounded-t-2xl shadow-2xl">
      <div className="p-6">
        {/* Hidden audio element */}
        {audioUrl && (
          <audio 
            ref={audioRef} 
            src={audioUrl} 
            preload="auto"
            controls={false}
            crossOrigin="anonymous"
            onError={(e) => {
              console.error('Audio element error:', e);
              setError('Error loading audio file. Please try again.');
            }}
            onLoadedMetadata={(e) => {
              console.log('Audio metadata loaded', e);
              // Set the duration from the audio element
              if (audioRef.current) {
                setDuration(audioRef.current.duration || 0);
              }
            }}
            onCanPlay={() => console.log('Audio can play now')}
            onEnded={() => {
              console.log('Audio playback ended');
              onPlayPause(false);
              setCurrentTime(0);
              setProgress(0);
            }}
          />
        )}

        {/* Close Button */}
        <div className="flex justify-end mb-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </Button>
        </div>

        {/* Article Info */}
        <div className="flex items-start space-x-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-electric-blue/20 to-aurora-green/20 rounded-xl flex items-center justify-center">
            <Mic className="w-8 h-8 text-electric-blue" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-white mb-1 line-clamp-2">
              {article.title}
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-400 mb-2">
              <User className="w-4 h-4" />
              <span>Voiced by {getVoiceName(voice)}</span>
              <span>•</span>
              <span>{article.source}</span>
            </div>
          </div>
        </div>

        {/* Audio Visualization */}
        <div className="flex items-center justify-center space-x-1 mb-6 h-12">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className={`audio-wave transition-all duration-200 ${
                isPlaying ? 'animate-wave' : 'h-2 bg-gray-600'
              }`}
              style={{ 
                animationDelay: `${i * 0.05}s`,
                height: isPlaying ? `${Math.random() * 40 + 10}px` : '8px'
              }}
            ></div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <Slider
            value={[progress]}
            onValueChange={(value) => {
              const newProgress = value[0];
              setProgress(newProgress);
              setCurrentTime(Math.floor((newProgress / 100) * duration));
            }}
            max={100}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center space-x-6">
          {loading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-electric-blue mb-2"></div>
              <p className="text-sm text-gray-400">Generating audio...</p>
            </div>
          ) : error ? (
            <div className="text-center">
              <p className="text-red-400 mb-2">{error}</p>
              <Button 
                onClick={() => window.location.reload()}
                className="bg-electric-blue hover:bg-electric-blue/80"
              >
                Try Again
              </Button>
            </div>
          ) : (
            <>
              <Button
                size="lg"
                onClick={() => onPlayPause(!isPlaying)}
                disabled={!audioUrl}
                className={`w-16 h-16 rounded-full transition-all duration-300 ${
                  isPlaying
                    ? 'bg-gradient-to-r from-warm-amber to-electric-blue animate-pulse-glow'
                    : 'bg-gradient-to-r from-electric-blue to-aurora-green hover:scale-110'
                }`}
              >
                {isPlaying ? (
                  <span className="text-2xl">❚❚</span>
                ) : (
                  <Play className="w-8 h-8" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-white/10"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </>
          )}
        </div>

        {/* Live Indicator */}
        {isPlaying && (
          <div className="flex items-center justify-center mt-4">
            <div className="flex items-center space-x-2 text-sm text-electric-blue">
              <div className="w-2 h-2 bg-electric-blue rounded-full animate-pulse"></div>
              <span>Live Audio Stream</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default AudioPlayer;
