import mongoose, { Schema } from 'mongoose';
import type { Document } from 'mongoose';

export interface IScholarship extends Document {
  name: string;
  organization: string;
  description: string;
  amount: number;
  requirements: string;
  targetType: string;
  theme: string;
  gender: string;
  ethnicity: string;
  academicLevel: string;
  academicGPA: number;
  url: string;
  isActive: boolean;
  deadline: Date;
}

const ScholarshipSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  organization: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
  },
  amount: {
    type: Number,
  },
  targetType: {
    type: String,
    trim: true
  },
  theme: {
    type: String,
    trim: true
  },
  gender: {
    type: String,
    trim: true
  },
  ethnicity: {
    type: String,
    trim: true
  },
  academicLevel: {
    type: String,
    trim: true
  },
  academicGPA: {
    type: Number,
  },
  requirements: {
    type: String,
  },
  url: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  deadline: {
    type: Date,
  }
}, {
  timestamps: true
});

export default mongoose.model<IScholarship>('Scholarship', ScholarshipSchema); 