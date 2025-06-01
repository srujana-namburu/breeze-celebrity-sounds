
// News service that integrates with the Python backend
// This connects to our Flask API for RSS feeds, summarization, and voice synthesis

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  originalText: string;
  category: string;
  source: string;
  publishedAt: string;
  readTime: string;
  trending?: boolean;
  audioUrl?: string;
}

export interface PaginationData {
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}

export interface NewsResponse {
  items: NewsArticle[];
  pagination: PaginationData;
}

// Mock data representing processed news from your Python backend
export const mockNews: NewsArticle[] = [
  {
    id: '1',
    title: 'Revolutionary AI Breakthrough Changes Tech Industry Forever',
    summary: 'Scientists develop new neural architecture that achieves human-level reasoning across multiple domains, marking a significant milestone in artificial intelligence research.',
    originalText: 'In a groundbreaking development that could reshape the entire technology landscape...',
    category: 'Technology',
    source: 'TechCrunch',
    publishedAt: '2024-01-15T10:30:00Z',
    readTime: '3 min read',
    trending: true,
    audioUrl: '/audio/tech-breakthrough.wav'
  },
  {
    id: '2', 
    title: 'Global Climate Summit Reaches Historic Agreement',
    summary: 'World leaders unite on unprecedented climate action plan, setting ambitious targets for carbon neutrality and renewable energy adoption worldwide.',
    originalText: 'Representatives from 195 countries have reached a consensus...',
    category: 'Politics',
    source: 'Reuters',
    publishedAt: '2024-01-15T08:15:00Z',
    readTime: '4 min read',
    trending: true,
    audioUrl: '/audio/climate-summit.wav'
  },
  {
    id: '3',
    title: 'Space Tourism Reaches New Milestone with Commercial Flights',
    summary: 'Private space companies successfully launch first regular passenger flights to low Earth orbit, making space travel accessible to civilians.',
    originalText: 'The era of commercial space travel has officially begun...',
    category: 'Science',
    source: 'Space News',
    publishedAt: '2024-01-15T06:45:00Z',
    readTime: '2 min read',
    audioUrl: '/audio/space-tourism.wav'
  },
  {
    id: '4',
    title: 'Championship Finals Draw Record Breaking Viewership',
    summary: 'Sports event attracts over 100 million viewers globally, setting new standards for live streaming and digital sports consumption.',
    originalText: 'Last night\'s championship final broke all previous records...',
    category: 'Sports',
    source: 'ESPN',
    publishedAt: '2024-01-14T22:00:00Z',
    readTime: '3 min read',
    audioUrl: '/audio/championship.wav'
  },
  {
    id: '5',
    title: 'Hollywood Studios Embrace AI-Generated Content',
    summary: 'Major entertainment companies announce partnerships with AI studios to create personalized content experiences for streaming platforms.',
    originalText: 'The entertainment industry is experiencing a seismic shift...',
    category: 'Entertainment',
    source: 'Variety',
    publishedAt: '2024-01-14T16:20:00Z',
    readTime: '3 min read',
    audioUrl: '/audio/hollywood-ai.wav'
  },
  {
    id: '6',
    title: 'Medical Breakthrough: Gene Therapy Shows Promise',
    summary: 'New gene editing technique successfully treats rare genetic disorders in clinical trials, offering hope to millions of patients worldwide.',
    originalText: 'Researchers at leading medical institutions have achieved...',
    category: 'Science',
    source: 'Nature Medicine',
    publishedAt: '2024-01-14T14:10:00Z',
    readTime: '4 min read',
    trending: true,
    audioUrl: '/audio/gene-therapy.wav'
  }
];

// API functions that connect to our Python backend
export class NewsService {
  
  private static baseUrl = 'http://localhost:5001/api';
  
  // Fetch headlines from RSS feeds using our Python backend
  static async fetchLatestNews(maxItems: number = 10, offset: number = 0, rssUrl: string = 'http://feeds.bbci.co.uk/news/rss.xml'): Promise<NewsResponse> {
    console.log(`📡 Fetching news with offset ${offset}, limit ${maxItems}...`);
    
    try {
      // Try to fetch with pagination
      const response = await fetch(`${this.baseUrl}/news?max_items=${maxItems}&offset=${offset}&rss_url=${encodeURIComponent(rssUrl)}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.items && data.items.length > 0) {
          console.log(`Successfully fetched ${data.items.length} news items with offset ${offset}`);
          return {
            items: data.items,
            pagination: data.pagination || {
              total: data.items.length,
              offset: offset,
              limit: maxItems,
              hasMore: false
            }
          };
        }
      }
      
      throw new Error('Failed to fetch news');
    } catch (error) {
      console.error('Error fetching news:', error);
      // Only use mock data as absolute last resort
      if (offset === 0) {
        alert('Could not fetch latest news. Using sample news instead. Please check your internet connection and try again.');
        return {
          items: mockNews.slice(0, maxItems),
          pagination: {
            total: mockNews.length,
            offset: 0,
            limit: maxItems,
            hasMore: mockNews.length > maxItems
          }
        };
      } else {
        // For pagination requests beyond the first page, return empty results
        return {
          items: [],
          pagination: {
            total: 0,
            offset: offset,
            limit: maxItems,
            hasMore: false
          }
        };
      }
    }
  }

  // Articles are already summarized by the backend
  // This method is kept for compatibility but doesn't need to do additional summarization
  static async summarizeArticles(articles: string[]): Promise<string[]> {
    console.log('📝 Articles already summarized by backend');
    return articles;
  }

  // Generate voice audio using our Python backend's TTS system
  static async generateVoiceAudio(
    text: string, 
    voiceId: string,
    speakerWav: string = 'elon.wav'
  ): Promise<string> {
    console.log(`🎙️ Generating ${voiceId} voice audio with XTTS-v2...`);
    
    try {
      const response = await fetch(`${this.baseUrl}/voice/synthesize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice_id: voiceId,
          speaker_wav: speakerWav,
          language: 'en'
        })
      });
      
      if (!response.ok) {
        throw new Error(`Voice synthesis failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      return result.audioUrl;
    } catch (error) {
      console.error('Error generating voice audio:', error);
      // Fallback to mock audio URL if API fails
      return `/audio/generated/${voiceId}_${Date.now()}.wav`;
    }
  }

  // Simulate real-time news updates
  static subscribeToUpdates(callback: (news: NewsArticle[]) => void) {
    const interval = setInterval(async () => {
      const response = await this.fetchLatestNews();
      callback(response.items);
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }

  // Simulate category filtering
  static async getNewsByCategory(category: string): Promise<NewsArticle[]> {
    const response = await this.fetchLatestNews();
    return response.items.filter(article => 
      article.category.toLowerCase() === category.toLowerCase()
    );
  }

  // Simulate search functionality
  static async searchNews(query: string): Promise<NewsArticle[]> {
    const response = await this.fetchLatestNews();
    return response.items.filter(article =>
      article.title.toLowerCase().includes(query.toLowerCase()) ||
      article.summary.toLowerCase().includes(query.toLowerCase())
    );
  }
}

// Voice synthesis service (maps to your TTS functionality)
export class VoiceService {
  static voices = {
    'elon': { name: 'Elon Musk', wavFile: 'elon.wav' },
    'morgan': { name: 'Morgan Freeman', wavFile: 'morgan.wav' },
    'oprah': { name: 'Oprah Winfrey', wavFile: 'oprah.wav' },
    'david': { name: 'David Attenborough', wavFile: 'david.wav' },
    'samuel': { name: 'Samuel L. Jackson', wavFile: 'samuel.wav' }
  };

  static async synthesizeArticle(
    article: NewsArticle, 
    voiceId: string
  ): Promise<string> {
    const voice = this.voices[voiceId];
    if (!voice) throw new Error(`Voice ${voiceId} not found`);

    console.log(`🎭 Synthesizing article with ${voice.name}'s voice...`);
    
    // This would call your read_aloud_with_voice function
    return await NewsService.generateVoiceAudio(
      article.summary, 
      voiceId, 
      voice.wavFile
    );
  }
}

// Analytics service for tracking usage
export class AnalyticsService {
  static trackArticlePlay(articleId: string, voiceId: string) {
    console.log(`📊 Tracking: Article ${articleId} played with ${voiceId} voice`);
    // Would send analytics to backend
  }

  static trackVoiceSelection(voiceId: string) {
    console.log(`📊 Tracking: Voice ${voiceId} selected`);
    // Would send analytics to backend
  }
}
