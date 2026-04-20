import mongoose from 'mongoose';

const testAttemptSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  test_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true,
  },
  started_at: {
    type: Date,
    required: true,
  },
  completed_at: {
    type: Date,
    required: true,
  },
  time_taken_seconds: {
    type: Number,
    required: true,
  },
  total_questions: {
    type: Number,
    required: true,
  },
  correct_answers: {
    type: Number,
    default: 0,
  },
  wrong_answers: {
    type: Number,
    default: 0,
  },
  unanswered: {
    type: Number,
    default: 0,
  },
  score: {
    type: Number,
    default: 0,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('TestAttempt', testAttemptSchema);

