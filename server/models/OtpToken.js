import mongoose from 'mongoose';

const otpTokenSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  code: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['login', 'register', 'reset'],
    required: true,
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
  },
  expires_at: {
    type: Date,
    required: true,
  },
  attempts: {
    type: Number,
    default: 0,
  },
  consumed: {
    type: Boolean,
    default: false,
  },
  consumed_at: {
    type: Date,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

otpTokenSchema.index({ email: 1, type: 1 });
otpTokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('OtpToken', otpTokenSchema);


