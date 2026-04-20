import mongoose from 'mongoose';

const categorySubscriptionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Ensure one subscription per user per category
categorySubscriptionSchema.index({ user_id: 1, category_id: 1 }, { unique: true });

export default mongoose.model('CategorySubscription', categorySubscriptionSchema);

