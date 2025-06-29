// Interface for scholarship website data
export interface ScholarshipWebsite {
  name: string;
  url: string;
  searchUrl: string;
  description: string;
}

// Interface for scholarship search request
export interface ScholarshipSearchRequest {
  keywords: string[];
  maxResults?: number;
  includeDeadlines?: boolean;
  useRealScraping?: boolean;
}

// Interface for scholarship result
export interface ScholarshipResult {
  title: string;
  description: string;
  amount?: string;
  deadline?: string;
  eligibility?: string;
  gender?: string;
  ethnicity?: string;
  academicLevel?: string;
  academicYear?: string;
  academicGPA?: number;
  essayRequired?: boolean;
  recommendationRequired?: boolean;
  source: string;
  url?: string;
  relevanceScore: number;
}

export interface SearchResponse {
  success: boolean;
  data: {
    scholarships: ScholarshipResult[];
    totalFound: number;
    keywords: string[];
    searchTimestamp: string;
  };
  metadata: {
    sourcesUsed: string[];
    aiModel: string;
    processingTime: string;
    realScrapingUsed: boolean;
  };
}

export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  message: string;
  service: string;
  model?: string;
  timestamp?: string;
  error?: any;
}

export interface SourcesResponse {
  success: boolean;
  data: {
    sources: Array<{
      name: string;
      url: string;
      description: string;
    }>;
    totalSources: number;
  };
} 