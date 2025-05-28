import mongoose, { Document, Schema } from 'mongoose';
import { IPerson } from './Person';

export interface IRecommendation extends Document {
  recommenderId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  submissionMethod: string;
  status: string;
  dueDate: Date;
  completionDate?: Date;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const RecommendationSchema: Schema = new Schema({
  recommenderId: {
    type: Schema.Types.ObjectId,
    ref: 'Recommender',
    required: true
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'Person',
    required: true
  },
  submissionMethod: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'submitted', 'completed', 'cancelled'],
    default: 'pending'
  },
  dueDate: {
    type: Date,
    required: true
  },
  completionDate: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

export default mongoose.model<IRecommendation>('Recommendation', RecommendationSchema); 