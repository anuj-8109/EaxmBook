import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    default: null,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null,
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved'],
    default: 'pending',
  },
  admin_response: {
    type: String,
    default: null,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Add indexes for faster queries
feedbackSchema.index({ user_id: 1, created_at: -1 });
feedbackSchema.index({ status: 1, created_at: -1 });
feedbackSchema.index({ created_at: -1 });

export default mongoose.model('Feedback', feedbackSchema);

