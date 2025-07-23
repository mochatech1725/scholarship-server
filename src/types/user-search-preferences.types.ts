import { 
  EducationLevel, 
  TargetType, 
  SubjectArea, 
  Gender, 
  Ethnicity,
} from './searchPreferences.types.js';

export interface UserSearchPreferences {
  user_id: number;
  target_type?: TargetType;
  subject_areas?: SubjectArea[];
  gender?: Gender;
  ethnicity?: Ethnicity;
  academic_gpa?: number;
  essay_required?: boolean;
  recommendation_required?: boolean;
  academic_level?: EducationLevel;
  created_at?: Date;
  updated_at?: Date;
}

// Legacy interface for backward compatibility
export interface IUserSearchPreferences {
  user_id: number;
  target_type?: TargetType;
  subject_areas?: SubjectArea[];
  gender?: Gender;
  ethnicity?: Ethnicity;
  academic_gpa?: number;
  essay_required?: boolean;
  recommendation_required?: boolean;
  academic_level?: EducationLevel;
  created_at?: Date;
  updated_at?: Date;
} 