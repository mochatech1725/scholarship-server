// --- Scholarship Types (merged from scholarship.types.ts) ---
// Interface for scholarship website data
export interface ScholarshipWebsite {
  name: string;
  url: string;
  searchUrl: string;
}

export interface SearchCriteria {
  subjectAreas: string[]
  keywords: string
  academicLevel: string | null
  targetType: string | null
  gender: string | null
  ethnicity: string | null
  geographicRestrictions: string | null
  academicGPA: number | null
  essayRequired: boolean | null
  recommendationRequired: boolean | null
  deadlineRange?: {
    startDate?: string  // ISO date string
    endDate?: string    // ISO date string
  }
  deadlineWithinDays?: number  // e.g., 30 for "due within 30 days"
}

export interface ScholarshipSearchRequest {
  filters?: SearchCriteria;
  maxResults?: number;
  includeDeadlines?: boolean;
  useRealScraping?: boolean;
}

// Interface for scholarship result
export interface ScholarshipResult {
  title: string;
  description: string;
  organization?: string;
  amount?: string;
  deadline?: string;
  eligibility?: string;
  gender?: string;
  ethnicity?: string;
  academicLevel?: string;
  academicGPA?: number;
  essayRequired?: boolean;
  recommendationRequired?: boolean;
  renewable?: boolean;
  geographicRestrictions?: string;
  source: string;
  url?: string;
  relevanceScore: number;
}

export interface SearchResponse {
  success: boolean;
  data: {
    scholarships: ScholarshipResult[];
    totalFound: number;
    searchTimestamp: string;
  };
  metadata: {
    sourcesUsed: string[];
    aiModel: string;
    processingTime: string;
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
    }>;
    totalSources: number;
  };
}
// --- End Scholarship Types ---

// Education Level enum
export const educationLevelsOptions = [
  'High School',
  'Undergraduate',
  'Graduate',
  'High School Junior',
  'High School Senior',
  'College Freshman',
  'College Sophomore',
  'College Junior',
  'College Senior',
  'Graduate Student'] as const;

export type EducationLevel = typeof educationLevelsOptions[number];


export const targetTypeOptions = ['Merit', 'Need', 'Both'] as const;
export type TargetType = typeof targetTypeOptions[number];

// TODO: Store in the database
export const subjectAreasOptions = [
  'Agriculture',
  'Arts',
  'Architecture',
  'Athletics',
  'Aviation',
  'Biology',
  'Business',
  'Chemistry',
  'Communication',
  'Community Service',
  'Criminal Justice',
  'Culinary Arts',
  'Computer Science',
  'Dance',
  'Dentistry',
  'Disablity',
  'Design',
  'Drama',
  'Economics',
  'Education',
  'Engineering',
  'Environmental Science',
  'Healthcare',
  'Humanities',
  'Journalism',
  'Law',
  'Mathematics',
  'Medicine',
  'Music',
  'Military',
  'Nursing',
  'Physics',
  'Psychology',
  'Public Policy',
  'Religion',
  'Science',
  'Social Sciences',
  'STEM',
  'Writing'
] as const;

export type SubjectArea = typeof subjectAreasOptions[number];

// Gender enum
export const genderOptions = [
  'Male',
  'Female',
  'Non-Binary'
] as const;

export type Gender = typeof genderOptions[number];

// Ethnicity enum
export const ethnicityOptions = [
  'Asian/Pacific Islander',
  'Black/African American',
  'Hispanic/Latino',
  'White/Caucasian',
  'Native American/Alaska Native',
  'Native Hawaiian/Pacific Islander',
  'Middle Eastern/North African',
  'South Asian',
  'East Asian',
  'Southeast Asian',
  'Other'
] as const;

export type Ethnicity = typeof ethnicityOptions[number]; 