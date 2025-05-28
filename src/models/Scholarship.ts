import mongoose, { Document, Schema } from 'mongoose';

export interface IScholarship extends Document {
  title: string;
  description: string;
  amount: number;
  deadline: Date;
  requirements: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ScholarshipSchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  deadline: {
    type: Date,
    required: true
  },
  requirements: [{
    type: String,
    required: true
  }]
}, {
  timestamps: true
});

export default mongoose.model<IScholarship>('Scholarship', ScholarshipSchema); 