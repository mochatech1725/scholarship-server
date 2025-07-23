import mongoose, { Schema } from 'mongoose';
import type { Document } from 'mongoose';
import { 
  EducationLevel, 
  TargetType, 
  SubjectArea, 
  Gender, 
  Ethnicity,
  subjectAreasOptions,
  educationLevelsOptions,
  targetTypeOptions,
  genderOptions,
  ethnicityOptions,
} from '../types/searchPreferences.types.js';

export interface IProfile {
  userPreferences: {
    searchPreferences: {
      subjectAreas: SubjectArea[];
      educationLevel: EducationLevel;
      targetType: TargetType;
      gender: Gender;
      ethnicity: Ethnicity;
      essayRequired: boolean;
      recommendationRequired: boolean;
    };
  }
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
      subjectAreas: [{
        type: String,
        enum: subjectAreasOptions,
      }],
      educationLevel: {
        type: String,
        enum: educationLevelsOptions,
      },
      targetType: {
        type: String,
        enum: targetTypeOptions,
      },
      gender: {
        type: String,
        enum: genderOptions,
      },
      ethnicity: {
        type: String,
        enum: ethnicityOptions,
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