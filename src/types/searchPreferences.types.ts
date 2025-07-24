export interface ScholarshipWebsite {
  name: string;
  url: string;
  searchUrl: string;
}

export interface SearchCriteria {
  subjectAreas: string[]
  keywords: string
  academic_level: string | null
  target_type: string | null
  gender: string | null
  ethnicity: string | null
  geographic_restrictions: string | null
  essay_required: boolean | null
  recommendations_required: boolean | null
  academic_gpa?: number
  minAmount?: number
  maxAmount?: number
  deadlineRange?: {
    startDate?: string  // ISO date string
    endDate?: string    // ISO date string
  }
}

export interface ScholarshipSearchRequest {
  filters?: SearchCriteria;
  maxResults?: number;
  includeDeadlines?: boolean;
  useRealScraping?: boolean;
}

// Interface for scholarship item (used for API responses)
export interface ScholarshipItem {
  scholarship_id?: string;
  name: string;
  deadline?: string;
  url?: string;
  description: string;
  eligibility?: string;
  organization?: string;
  academic_level?: string;
  geographic_restrictions?: string;
  target_type?: string;
  ethnicity?: string;
  gender?: string;
  min_award?: number;
  max_award?: number;
  renewable?: boolean;
  country?: string;
  apply_url?: string;
  is_active?: boolean;
  essay_required?: boolean;
  recommendations_required?: boolean;
  source: string;
  relevanceScore?: number;
}

// Interface for DynamoDB storage (with string boolean values)
export interface ScholarshipDBItem extends Omit<ScholarshipItem, 'essay_required' | 'recommendations_required' | 'renewable' | 'is_active'> {
  essay_required?: string; // "true" or "false" for DynamoDB
  recommendations_required?: string; // "true" or "false" for DynamoDB
  renewable?: string; // "true" or "false" for DynamoDB
  is_active?: string; // "true" or "false" for DynamoDB
  createdAt?: string;
  updatedAt?: string;
}

export interface SearchResponse {
  success: boolean;
  data: {
    scholarships: ScholarshipItem[];
    totalFound: number;
    searchTimestamp: string;
  };
  metadata: {
    sourcesUsed: string[];
    aiModel: string;
    processingTime: string;
  };
}

// Search options for advanced filtering and sorting
export interface SearchOptions {
  maxResults?: number;
  sortBy?: 'relevance' | 'deadline' | 'amount' | 'title';
  sortOrder?: 'asc' | 'desc';
  includeExpired?: boolean;
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