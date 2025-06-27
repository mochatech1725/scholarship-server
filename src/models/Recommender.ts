import mongoose, { Document, Schema } from 'mongoose';

export interface IRecommender extends Document {
  studentId: string;
  firstName: string;
  lastName: string;
  relationship: string;
  emailAddress: string;
  phoneNumber: string;
}

const RecommenderSchema: Schema = new Schema({
  studentId: {
    type: String,
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
  relationship: {
    type: String,
    trim: true
  },
  emailAddress: {
    type: String,
    trim: true,
    lowercase: true
  },
  phoneNumber: {
    type: String,
    trim: true,
    // validate: {
    //   validator: function(v: string) {
    //     if (!v) return true; // Allow empty/undefined
        
    //     const phoneRegex = /^(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/;
    //     return phoneRegex.test(v);
    //   },
    //   message: 'Phone number must be in a valid format (e.g., (123) 456-7890, 123-456-7890, 1234567890)'
    // }
  }
}, {
  timestamps: true
});

export default mongoose.model<IRecommender>('Recommender', RecommenderSchema); 