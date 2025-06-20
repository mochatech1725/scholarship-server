import mongoose, { Document, Schema } from 'mongoose';

export type RecommendationStatus = 'Pending' | 'Submitted';
export type SubmissionMethod = 'DirectEmail' | 'StudentUpload' | 'DirectMail';

export interface IRecommendation extends Document {
  recommender: mongoose.Types.ObjectId;
  status: RecommendationStatus;
  submissionMethod: SubmissionMethod;
  requestDate: Date;
  dueDate: Date;
  submissionDate?: Date;
}

const RecommendationSchema: Schema = new Schema({
  recommender: {
    type: Schema.Types.ObjectId,
    ref: 'Recommender',
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Submitted'],
    default: 'Pending'
  },
  submissionMethod: {
    type: String,
    enum: ['DirectEmail', 'StudentUpload', 'DirectMail']
  },
  requestDate: {
    type: Date,
  },
  dueDate: {
    type: Date,
  },
  submissionDate: {
    type: Date
  }
}, {
  timestamps: true
});

export default mongoose.model<IRecommendation>('Recommendation', RecommendationSchema); 