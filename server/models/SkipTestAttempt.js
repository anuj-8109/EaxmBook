import mongoose from 'mongoose';

const skipTestAttemptSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  level_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Level',
    required: true,
  },
  level_progress_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LevelProgress',
    required: true,
  },
  questions: [{
    question_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    selected_answer: {
      type: Number,
      default: null,
    },
    is_correct: {
      type: Boolean,
      default: false,
    },
  }],
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
  score_percentage: {
    type: Number,
    required: true,
  },
  passed: {
    type: Boolean,
    default: false,
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
  created_at: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('SkipTestAttempt', skipTestAttemptSchema);

