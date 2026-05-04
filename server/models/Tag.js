import mongoose from 'mongoose';

const tagSchema = new mongoose.Schema({
  tag_name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    default: null,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

tagSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

export default mongoose.model('Tag', tagSchema);
