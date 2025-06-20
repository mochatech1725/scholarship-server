import mongoose, { Document, Schema } from 'mongoose';

export interface IEssay extends Document {
  essayLink: string;
  count: number;
  units: string;
  theme: string;
}

const EssaySchema: Schema = new Schema({
  essayLink: {
    type: String,
    required: true,
    trim: true
  },
  count: {
    type: Number,
  },
  units: {
    type: String,
    trim: true
  },
  theme: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

export default mongoose.model<IEssay>('Essay', EssaySchema); 