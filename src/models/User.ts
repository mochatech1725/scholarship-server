import mongoose, { Schema } from 'mongoose';
import type { Document } from 'mongoose';
import { 
  EducationLevel, 
  EducationYear, 
  TargetType, 
  SubjectArea, 
  Gender, 
  Ethnicity,
  subjectAreasOptions,
  educationLevelsOptions,
  educationYearsOptions,
  targetTypeOptions,
  genderOptions,
  ethnicityOptions,
} from '../types/searchPreferences.types.js';

export interface IProfile {
  userPreferences: {
    searchPreferences: {
      educationLevel: EducationLevel;
      educationYear: EducationYear;
      targetType: TargetType;
      subjectAreas: SubjectArea[];
      gender: Gender;
      ethnicity: Ethnicity;
      academicGPA: number;
      essayRequired: boolean;
      recommendationRequired: boolean;
    };
  };
}

export interface IUser extends Document {
  userId?: string;
  firstName: string;
  lastName: string;
  emailAddress: string;
  password?: string;
  profile?: IProfile;
}

const ProfileSchema: Schema = new Schema({
  userPreferences: {
    searchPreferences: {
      educationLevel: {
        type: String,
        enum: educationLevelsOptions,
      },
      educationYear: {
        type: String,
        enum: educationYearsOptions,
      },
      targetType: {
        type: String,
        enum: targetTypeOptions,
      },
      subjectAreas: [{
        type: String,
        enum: subjectAreasOptions,
      }],
      gender: {
        type: String,
        enum: genderOptions,
      },
      ethnicity: {
        type: String,
        enum: ethnicityOptions,
      },
      academicGPA: {
        type: Number,
        min: 0,
        max: 4.0,
        default: 0
      },
      essayRequired: {
        type: Boolean,
        default: false
      },
      recommendationRequired: {
        type: Boolean,
        default: false
      }
    }
  }
});

const UserSchema: Schema = new Schema({
  userId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  emailAddress: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  profile: ProfileSchema
}, {
  timestamps: true
});

export default mongoose.model<IUser>('User', UserSchema); 