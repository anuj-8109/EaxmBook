import mongoose from 'mongoose';

const testAnswerSchema = new mongoose.Schema({
  attempt_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestAttempt',
    required: true,
  },
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
    required: true,
  },
  marks_awarded: {
    type: Number,
    default: 0,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('TestAnswer', testAnswerSchema);

