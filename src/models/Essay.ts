import mongoose, { Document, Schema } from 'mongoose';

export interface IEssay extends Document {
  scholarshipId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  count: string;
  units: string;
  theme: string;
  createdAt: Date;
  updatedAt: Date;
}

const EssaySchema: Schema = new Schema({
  scholarshipId: {
    type: Schema.Types.ObjectId,
    ref: 'Scholarship',
    required: true
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'Person',
    required: true
  },
  count: {
    type: String,
    required: true,
    trim: true
  },
  units: {
    type: String,
    required: true,
    trim: true
  },
  theme: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

export default mongoose.model<IEssay>('Essay', EssaySchema); 