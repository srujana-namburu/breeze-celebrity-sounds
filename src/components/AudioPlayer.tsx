
import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Mic, Settings, User } from 'lucide-react';

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
  const [duration] = useState(180); // 3 minutes simulation
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 1;
          setProgress((newTime / duration) * 100);
          if (newTime >= duration) {
            onPlayPause(false);
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration, onPlayPause]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getVoiceName = (voiceId: string) => {
    const voices = {
      'elon': 'Elon Musk',
      'morgan': 'Morgan Freeman', 
      'oprah': 'Oprah Winfrey',
      'david': 'David Attenborough',
      'samuel': 'Samuel L. Jackson'
    };
    return voices[voiceId] || 'Unknown Voice';
  };

  return (
    <Card className="glass-morphic border-t border-white/20 rounded-t-2xl shadow-2xl">
      <div className="p-6">
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
          <Button
            size="lg"
            onClick={() => onPlayPause(!isPlaying)}
            className={`w-16 h-16 rounded-full transition-all duration-300 ${
              isPlaying
                ? 'bg-gradient-to-r from-warm-amber to-electric-blue animate-pulse-glow'
                : 'bg-gradient-to-r from-electric-blue to-aurora-green hover:scale-110'
            }`}
          >
            <Play 
              className={`w-6 h-6 transition-transform duration-300 ${
                isPlaying ? 'scale-90' : 'scale-100'
              }`} 
            />
          </Button>
          
          <Button variant="ghost" size="icon" className="hover-glow">
            <Settings className="w-5 h-5" />
          </Button>
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
