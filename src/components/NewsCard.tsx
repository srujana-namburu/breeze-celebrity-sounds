
import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Calendar, User } from 'lucide-react';

interface NewsCardProps {
  article: {
    id: string;
    title: string;
    summary: string;
    category: string;
    source: string;
    publishedAt: string;
    readTime: string;
    trending?: boolean;
  };
  onPlay: () => void;
  selectedVoice: string;
}

const NewsCard: React.FC<NewsCardProps> = ({ article, onPlay, selectedVoice }) => {
  const [isHovered, setIsHovered] = useState(false);

  const getCategoryColor = (category: string) => {
    const colors = {
      'Politics': 'border-electric-blue/50 text-electric-blue',
      'Technology': 'border-aurora-green/50 text-aurora-green',
      'Sports': 'border-warm-amber/50 text-warm-amber',
      'Entertainment': 'border-purple-400/50 text-purple-400',
      'Science': 'border-cyan-400/50 text-cyan-400',
      'World': 'border-pink-400/50 text-pink-400'
    };
    return colors[category] || 'border-gray-400/50 text-gray-400';
  };

  return (
    <Card 
      className={`news-card relative overflow-hidden group cursor-pointer transition-all duration-500 ${
        isHovered ? 'transform scale-105' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Trending Indicator */}
      {article.trending && (
        <div className="absolute top-4 right-4 z-10">
          <div className="w-3 h-3 bg-electric-blue rounded-full animate-pulse-glow"></div>
        </div>
      )}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-electric-blue/5 via-transparent to-aurora-green/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      <CardHeader className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <Badge 
            variant="outline" 
            className={`${getCategoryColor(article.category)} border backdrop-blur-sm`}
          >
            {article.category}
          </Badge>
          <div className="flex items-center text-xs text-gray-400 space-x-2">
            <Calendar className="w-3 h-3" />
            <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
          </div>
        </div>
        
        <h3 className="text-lg font-semibold leading-tight group-hover:text-electric-blue transition-colors duration-300">
          {article.title}
        </h3>
      </CardHeader>

      <CardContent className="relative z-10">
        <p className="text-gray-300 text-sm mb-4 line-clamp-3">
          {article.summary}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-gray-400">
            <User className="w-3 h-3" />
            <span>{article.source}</span>
            <span>•</span>
            <span>{article.readTime}</span>
          </div>

          <Button 
            size="sm"
            onClick={onPlay}
            className="bg-gradient-to-r from-electric-blue/20 to-aurora-green/20 hover:from-electric-blue hover:to-aurora-green border border-electric-blue/30 hover:border-electric-blue transition-all duration-300 group"
          >
            <Play className="w-4 h-4 mr-1 group-hover:scale-110 transition-transform duration-200" />
            Listen
          </Button>
        </div>
      </CardContent>

      {/* Floating Elements Animation */}
      <div className="absolute -top-10 -right-10 w-20 h-20 bg-electric-blue/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
      <div className="absolute -bottom-10 -left-10 w-16 h-16 bg-aurora-green/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
    </Card>
  );
};

export default NewsCard;
