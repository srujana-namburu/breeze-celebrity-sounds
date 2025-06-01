
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Headphones, Settings, Search, Bell, Loader } from 'lucide-react';
import NewsCard from './NewsCard';
import VoiceCarousel from './VoiceCarousel';
import AudioPlayer from './AudioPlayer';
import { NewsService } from '../services/newsService';
import { VoiceSynthesisService } from '../services/voiceService';

// Use the NewsArticle interface from the NewsService
import type { NewsArticle } from '../services/newsService';

const Dashboard = () => {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [filteredNews, setFilteredNews] = useState<NewsArticle[]>([]);
  const [selectedVoice, setSelectedVoice] = useState('voice1');
  const [currentArticle, setCurrentArticle] = useState<NewsArticle | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // State for pagination and infinite scrolling
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const newsContainerRef = useRef<HTMLDivElement>(null);

  // Fetch initial news from backend when component mounts
  const fetchInitialNews = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await NewsService.fetchLatestNews(10, 0);
      setNews(response.items);
      setFilteredNews(response.items); // Initialize filtered news with all news
      setHasMore(response.pagination.hasMore);
      setOffset(response.pagination.offset + response.pagination.limit);
    } catch (error) {
      console.error('Error fetching initial news:', error);
      setError('Failed to fetch news. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch more news when scrolling
  const fetchMoreNews = async () => {
    if (!hasMore || loadingMore) return;
    
    try {
      setLoadingMore(true);
      const response = await NewsService.fetchLatestNews(10, offset);
      
      if (response.items.length > 0) {
        // Append new items to existing news
        setNews(prevNews => [...prevNews, ...response.items]);
        
        // Update filtered news if a category is selected
        if (selectedCategory === 'All') {
          setFilteredNews(prevFiltered => [...prevFiltered, ...response.items]);
        } else {
          const newFilteredItems = response.items.filter(item => {
            const itemCategory = item.category.toLowerCase();
            const selectedCategoryLower = selectedCategory.toLowerCase();
            
            // Exact match
            if (itemCategory === selectedCategoryLower) return true;
            
            // Partial match (e.g., "tech" matches "technology")
            if (itemCategory.includes(selectedCategoryLower) || selectedCategoryLower.includes(itemCategory)) return true;
            
            // Common variations
            if (selectedCategoryLower === 'tech' && itemCategory.includes('technology')) return true;
            if (selectedCategoryLower === 'technology' && itemCategory.includes('tech')) return true;
            if (selectedCategoryLower === 'politics' && itemCategory.includes('government')) return true;
            if (selectedCategoryLower === 'entertainment' && (itemCategory.includes('celeb') || itemCategory.includes('movie') || itemCategory.includes('music'))) return true;
            
            return false;
          });
          
          setFilteredNews(prevFiltered => [...prevFiltered, ...newFilteredItems]);
        }
        
        // Update pagination state
        setOffset(response.pagination.offset + response.pagination.limit);
        setHasMore(response.pagination.hasMore);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching more news:', error);
    } finally {
      setLoadingMore(false);
    }
  };
  
  // Handle scroll events to implement infinite scrolling
  const handleScroll = useCallback(() => {
    if (!newsContainerRef.current) return;
    
    const container = newsContainerRef.current;
    const scrollPosition = window.innerHeight + window.scrollY;
    const threshold = container.offsetTop + container.offsetHeight - 800; // Load more when 800px from bottom
    
    if (scrollPosition > threshold && hasMore && !loadingMore && !loading) {
      fetchMoreNews();
    }
  }, [hasMore, loadingMore, loading, offset]);
  
  // Add scroll event listener
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);
  
  // Fetch initial news when component mounts
  useEffect(() => {
    fetchInitialNews();

    // Refresh news every 5 minutes
    const interval = setInterval(() => {
      fetchInitialNews();
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, []);
  
  // Filter news by category
  useEffect(() => {
    if (selectedCategory === 'All') {
      setFilteredNews(news);
    } else {
      const filtered = news.filter(article => {
        // Case-insensitive comparison of categories
        // First check for exact match with the category name
        if (!article.category) return false;
        
        const articleCategory = article.category.toLowerCase();
        const selected = selectedCategory.toLowerCase();
        
        // Exact match check
        if (articleCategory === selected) return true;
        
        // Check for partial matches and variations
        if (selected === 'politics') {
          return articleCategory === 'politics' || 
                 articleCategory.includes('politic') || 
                 articleCategory.includes('government') || 
                 articleCategory.includes('election');
        }
        
        if (selected === 'technology') {
          return articleCategory === 'technology' || 
                 articleCategory.includes('tech') || 
                 articleCategory.includes('digital') || 
                 articleCategory.includes('software');
        }
        
        if (selected === 'sports') {
          return articleCategory === 'sports' || 
                 articleCategory.includes('sport') || 
                 articleCategory.includes('football') || 
                 articleCategory.includes('soccer');
        }
        
        if (selected === 'entertainment') {
          return articleCategory === 'entertainment' || 
                 articleCategory.includes('entertain') || 
                 articleCategory.includes('media') || 
                 articleCategory.includes('celebrity');
        }
        
        if (selected === 'science') {
          return articleCategory === 'science' || 
                 articleCategory.includes('scienc') || 
                 articleCategory.includes('health') || 
                 articleCategory.includes('research');
        }
        
        // Fallback to partial match
        return articleCategory.includes(selected) || selected.includes(articleCategory);
      });
      
      console.log(`Filtered news for category '${selectedCategory}':`, filtered);
      setFilteredNews(filtered);
    }
  }, [selectedCategory, news]);

  const handlePlayArticle = async (article: NewsArticle) => {
    // Simply set the current article and isPlaying state
    // The AudioPlayer component will handle the audio synthesis and playback
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
              variant={selectedCategory === category ? "default" : "outline"}
              className={`px-4 py-2 transition-all duration-300 cursor-pointer ${selectedCategory === category 
                ? 'bg-electric-blue text-white' 
                : 'hover:bg-electric-blue/20 hover:border-electric-blue'}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Badge>
          ))}
        </section>

        {/* News Grid */}
        <section className="px-4 py-6">
          {loading ? (
            // Loading state
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <Card className="h-64 bg-gray-800/50">
                    <div className="p-6 space-y-4">
                      <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                      <div className="h-20 bg-gray-700 rounded"></div>
                      <div className="flex justify-between items-center">
                        <div className="h-3 bg-gray-700 rounded w-1/4"></div>
                        <div className="h-8 bg-gray-700 rounded w-24"></div>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          ) : error ? (
            // Error state
            <div className="text-center py-12">
              <div className="text-red-400 mb-4">{error}</div>
              <Button onClick={() => NewsService.fetchLatestNews(10).then(response => setNews(response.items)).catch(console.error)}>
                Try Again
              </Button>
            </div>
          ) : filteredNews.length === 0 ? (
            // Empty state
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                {news.length === 0 ? 'No news articles available' : `No ${selectedCategory} news articles available`}
              </div>
              <Button onClick={() => NewsService.fetchLatestNews(10).then(response => setNews(response.items)).catch(console.error)}>
                Refresh
              </Button>
            </div>
          ) : (
            <div ref={newsContainerRef}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredNews.map((article) => (
                  <div key={article.id}>
                    <NewsCard
                      article={article}
                      onPlay={() => handlePlayArticle(article)}
                      selectedVoice={selectedVoice}
                    />
                  </div>
                ))}
              </div>
              
              {loadingMore && (
                <div className="flex justify-center items-center py-4 mt-6">
                  <Loader className="animate-spin mr-2" />
                  <span>Loading more news...</span>
                </div>
              )}
              
              {!hasMore && filteredNews.length > 0 && (
                <div className="text-center py-4 mt-4 text-gray-500">
                  No more news to load
                </div>
              )}
            </div>
          )}
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
