
import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { VoiceSynthesisService, VoiceProfile } from '../services/voiceService';

interface Voice {
  id: string;
  name: string;
  avatar: string;
  description: string;
  accent: string;
}

interface VoiceCarouselProps {
  selectedVoice: string;
  onVoiceSelect: (voiceId: string) => void;
}

// Default voice avatars/emojis to use for generic voices
const voiceAvatars = ['🎙️', '🔊', '🎧', '🎤', '📢', '🔈', '📣', '🗣️'];

// Convert VoiceProfile to Voice interface
const convertToVoice = (profile: VoiceProfile, index: number): Voice => ({
  id: profile.id,
  name: profile.name,
  avatar: voiceAvatars[index % voiceAvatars.length],
  description: profile.description || `Voice sample ${index + 1}`,
  accent: profile.accent || 'Generic Voice'
});


const VoiceCarousel: React.FC<VoiceCarouselProps> = ({ selectedVoice, onVoiceSelect }) => {
  const [hoveredVoice, setHoveredVoice] = useState<string | null>(null);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch voices from backend when component mounts
  useEffect(() => {
    const loadVoices = async () => {
      try {
        setLoading(true);
        const voiceProfiles = await VoiceSynthesisService.loadAvailableVoices();
        const convertedVoices = voiceProfiles.map((profile, index) => convertToVoice(profile, index));
        setVoices(convertedVoices);
        
        // If no voice is selected yet, select the first one
        if (selectedVoice === 'elon' && convertedVoices.length > 0) {
          onVoiceSelect(convertedVoices[0].id);
        }
      } catch (error) {
        console.error('Error loading voices:', error);
        // Fallback to default voices if backend fails
        setVoices([
          {
            id: 'voice1',
            name: 'Voice 1',
            avatar: '🎙️',
            description: 'Generic Voice Sample',
            accent: 'English'
          },
          {
            id: 'voice2',
            name: 'Voice 2',
            avatar: '🔊',
            description: 'Generic Voice Sample',
            accent: 'English'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadVoices();
  }, [selectedVoice, onVoiceSelect]);

  if (loading) {
    return <div className="text-center py-8">Loading voices...</div>;
  }

  return (
    <div className="relative">
      <div className="overflow-x-auto pb-4 flex justify-start" style={{ scrollbarWidth: 'thin', scrollbarColor: '#4a8cff transparent' }}>
        <div className="flex space-x-6 px-4 min-w-max">
        {voices.map((voice, index) => (
          <Card
            key={voice.id}
            className={`voice-card relative cursor-pointer transition-all duration-500 p-6 min-w-[200px] ${
              selectedVoice === voice.id
                ? 'bg-gradient-to-br from-electric-blue/20 to-aurora-green/20 border-electric-blue/50 scale-105'
                : 'glass-morphic hover:scale-105'
            } ${hoveredVoice === voice.id ? 'animate-pulse-glow' : ''}`}
            onClick={() => onVoiceSelect(voice.id)}
            onMouseEnter={() => setHoveredVoice(voice.id)}
            onMouseLeave={() => setHoveredVoice(null)}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {/* Selection Indicator */}
            {selectedVoice === voice.id && (
              <div className="absolute top-2 right-2 w-3 h-3 bg-electric-blue rounded-full animate-pulse"></div>
            )}

            {/* Avatar */}
            <div className={`celebrity-avatar mx-auto mb-4 text-4xl flex items-center justify-center transition-all duration-300 ${
              selectedVoice === voice.id ? 'animate-float' : ''
            }`}>
              {voice.avatar}
            </div>

            {/* Name & Description */}
            <div className="text-center">
              <h4 className={`font-semibold text-lg mb-1 transition-colors duration-300 ${
                selectedVoice === voice.id ? 'gradient-text' : 'text-white'
              }`}>
                {voice.name}
              </h4>
              <p className="text-sm text-gray-400 mb-2">{voice.description}</p>
              <p className="text-xs text-gray-500">{voice.accent}</p>
            </div>

            {/* Hover Effect Overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br from-electric-blue/10 to-aurora-green/10 rounded-lg transition-opacity duration-300 ${
              hoveredVoice === voice.id ? 'opacity-100' : 'opacity-0'
            }`}></div>

            {/* Audio Wave Animation for Selected Voice */}
            {selectedVoice === voice.id && (
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="audio-wave h-2 animate-wave"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  ></div>
                ))}
              </div>
            )}
          </Card>
        ))}
        </div>
      </div>
    </div>
  );
};

export default VoiceCarousel;
