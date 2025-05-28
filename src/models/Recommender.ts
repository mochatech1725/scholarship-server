import mongoose, { Document, Schema } from 'mongoose';
import { IPerson } from './Person';

export interface IRecommender extends IPerson {
  relationship: string;
}

const RecommenderSchema: Schema = new Schema({
  relationship: {
    type: String,
    required: true,
    trim: true
  }
});

// Inherit all fields from Person model
RecommenderSchema.add(new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  emailAddress: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true }
}));

export default mongoose.model<IRecommender>('Recommender', RecommenderSchema); 