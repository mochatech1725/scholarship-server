import mongoose, { Schema } from 'mongoose';
import type { Document } from 'mongoose';

export interface IProfile {
  userPreferences: {
    searchPreferences: {
      educationLevel: string;
      targetTypes: string[];
      areas: string[];
      minAmount: number;
    };
  };
}

export interface IUser extends Document {
  userId?: string;
  firstName: string;
  lastName: string;
  emailAddress: string;
  phoneNumber?: string;
  password?: string;
  profile?: IProfile;
}

const ProfileSchema: Schema = new Schema({
  userPreferences: {
    searchPreferences: {
      educationLevel: {
        type: String,
        enum: ['High School Senior', 'College Freshman', 'College Sophomore', 'College Junior', 'College Senior', 'Graduate Student']
      },
      targetTypes: [{
        type: String,
        enum: ['Merit', 'Need', 'Both']
      }],
      areas: [{
        type: String,
        enum: ['STEM', 'Humanities', 'Social Sciences', 'Business', 'Arts', 'Education', 'Healthcare', 'Law', 'Public Policy', 'Environmental Science', 'Computer Science', 'Engineering', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Medicine', 'Psychology', 'Economics', 'Other']
      }],
      minAmount: {
        type: Number,
        default: 0
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
  password: {
    type: String
  },
  profile: ProfileSchema
}, {
  timestamps: true
});

export default mongoose.model<IUser>('User', UserSchema); 