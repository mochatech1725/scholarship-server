// Education Level enum
export const educationLevelsOptions = [
  'High School',
  'Undergraduate',
  'Graduate'
] as const;

export type EducationLevel = typeof educationLevelsOptions[number];

// Education Year enum (for more specific year targeting)
export const educationYearsOptions = [
  'High School Junior',
  'High School Senior',
  'College Freshman',
  'College Sophomore',
  'College Junior',
  'College Senior',
  'Graduate Student'
] as const;

export type EducationYear = typeof educationYearsOptions[number];

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