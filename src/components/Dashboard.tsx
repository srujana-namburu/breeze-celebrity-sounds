
import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Headphones, Settings, Search, Bell } from 'lucide-react';
import NewsCard from './NewsCard';
import VoiceCarousel from './VoiceCarousel';
import AudioPlayer from './AudioPlayer';
import { mockNews } from '../services/newsService';

const Dashboard = () => {
  const [news, setNews] = useState(mockNews);
  const [selectedVoice, setSelectedVoice] = useState('elon');
  const [currentArticle, setCurrentArticle] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setNews(prev => [...prev].sort(() => Math.random() - 0.5));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handlePlayArticle = (article) => {
    setCurrentArticle(article);
    setIsPlaying(true);
  };

  return (
    <div className="min-h-screen bg-midnight relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-radial from-electric-blue/5 via-transparent to-transparent"></div>
      <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-aurora-green/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-warm-amber/5 rounded-full blur-3xl"></div>

      {/* Header */}
      <header className="relative z-10 p-6 glass-morphic border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-electric-blue to-aurora-green rounded-xl flex items-center justify-center">
              <Headphones className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text">NewsBreeze</h1>
              <p className="text-sm text-gray-400">Premium Audio News Experience</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="hover-glow">
              <Search className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="hover-glow">
              <Bell className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="hover-glow">
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto p-6 space-y-8">
        {/* Hero Section */}
        <section className="text-center py-12 animate-fade-in-scale">
          <h2 className="text-5xl font-bold mb-4 gradient-text">
            Your News, Voiced by Icons
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Experience the latest headlines with celebrity voices. AI-powered summaries delivered in premium audio quality.
          </p>
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-electric-blue to-aurora-green hover:from-electric-blue/80 hover:to-aurora-green/80 transition-all duration-300 animate-pulse-glow"
          >
            <Play className="w-5 h-5 mr-2" />
            Start Listening
          </Button>
        </section>

        {/* Voice Selection */}
        <section className="animate-slide-up">
          <h3 className="text-2xl font-bold mb-6 text-center">Choose Your Voice</h3>
          <VoiceCarousel 
            selectedVoice={selectedVoice} 
            onVoiceSelect={setSelectedVoice} 
          />
        </section>

        {/* Categories */}
        <section className="flex flex-wrap gap-3 justify-center animate-fade-in-scale">
          {['All', 'Politics', 'Technology', 'Sports', 'Entertainment', 'Science'].map((category) => (
            <Badge 
              key={category}
              variant="outline" 
              className="px-4 py-2 hover:bg-electric-blue/20 hover:border-electric-blue transition-all duration-300 cursor-pointer"
            >
              {category}
            </Badge>
          ))}
        </section>

        {/* News Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 parallax-scroll">
          {news.map((article, index) => (
            <div 
              key={article.id}
              className="animate-float"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <NewsCard 
                article={article} 
                onPlay={() => handlePlayArticle(article)}
                selectedVoice={selectedVoice}
              />
            </div>
          ))}
        </section>
      </main>

      {/* Audio Player */}
      {currentArticle && (
        <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
          <AudioPlayer 
            article={currentArticle}
            voice={selectedVoice}
            isPlaying={isPlaying}
            onPlayPause={setIsPlaying}
            onClose={() => setCurrentArticle(null)}
          />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
