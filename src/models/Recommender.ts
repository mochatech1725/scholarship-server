import mongoose, { Document, Schema } from 'mongoose';

export interface IRecommender extends Document {
  firstName: string;
  lastName: string;
  relationship: string;
  emailAddress: string;
  phoneNumber: string;
}

const RecommenderSchema: Schema = new Schema({
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
  relationship: {
    type: String,
    required: true,
    trim: true
  },
  emailAddress: {
    type: String,
    trim: true,
    lowercase: true
  },
  phoneNumber: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

export default mongoose.model<IRecommender>('Recommender', RecommenderSchema); 