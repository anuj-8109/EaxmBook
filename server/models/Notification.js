import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['feedback_submitted', 'feedback_responded', 'system', 'info', 'new_test', 'new_job', 'new_material'],
    default: 'info',
  },
  related_id: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  related_type: {
    type: String,
    default: null,
  },
  read: {
    type: Boolean,
    default: false,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient queries
notificationSchema.index({ user_id: 1, read: 1, created_at: -1 });

export default mongoose.model('Notification', notificationSchema);

