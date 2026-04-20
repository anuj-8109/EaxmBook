import express from 'express';
import User from '../models/User.js';
import TestAttempt from '../models/TestAttempt.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

const buildAttemptStats = (attempts) => {
  const totalAttempts = attempts.length;
  const totalQuestions = attempts.reduce((acc, attempt) => acc + attempt.total_questions, 0);
  const totalCorrect = attempts.reduce((acc, attempt) => acc + attempt.correct_answers, 0);
  const totalWrong = attempts.reduce((acc, attempt) => acc + attempt.wrong_answers, 0);
  const totalScore = attempts.reduce((acc, attempt) => acc + attempt.score, 0);
  const totalTimeSeconds = attempts.reduce((acc, attempt) => acc + attempt.time_taken_seconds, 0);

  const avgScorePercent =
    totalAttempts > 0
      ? attempts.reduce((acc, attempt) => acc + (attempt.score / attempt.total_questions) * 100, 0) /
        totalAttempts
      : 0;

  const bestScorePercent =
    totalAttempts > 0
      ? Math.max(...attempts.map((attempt) => (attempt.score / attempt.total_questions) * 100))
      : 0;

  const avgAccuracyPercent =
    totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

  return {
    totalAttempts,
    totalQuestions,
    totalCorrect,
    totalWrong,
    totalScore,
    avgScorePercent: Math.round(avgScorePercent),
    avgAccuracyPercent: Math.round(avgAccuracyPercent),
    bestScorePercent: Math.round(bestScorePercent),
    totalTimeMinutes: Math.round(totalTimeSeconds / 60),
    lastAttemptAt: attempts[0]?.completed_at || null,
  };
};

const formatAttemptResponse = (attempt) => {
  const scorePercent = attempt.total_questions
    ? (attempt.score / attempt.total_questions) * 100
    : 0;
  const accuracy = attempt.total_questions
    ? (attempt.correct_answers / attempt.total_questions) * 100
    : 0;

  const test = attempt.test_id;
  const category = test?.category_id;

  return {
    id: attempt._id,
    started_at: attempt.started_at,
    completed_at: attempt.completed_at,
    time_taken_seconds: attempt.time_taken_seconds,
    total_questions: attempt.total_questions,
    correct_answers: attempt.correct_answers,
    wrong_answers: attempt.wrong_answers,
    unanswered: attempt.unanswered,
    score: attempt.score,
    score_percent: Math.round(scorePercent),
    accuracy_percent: Math.round(accuracy),
    test: test
      ? {
          id: test._id,
          name: test.name,
          duration_minutes: test.duration_minutes,
          total_marks: test.total_marks,
          negative_marking: test.negative_marking,
        }
      : null,
    category: category
      ? {
          id: category._id || category.id,
          name: category.name,
          icon: category.icon,
        }
      : null,
  };
};

// Get all users (admin only)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const users = await User.find({role:"user"})
      .select('-password')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments({role:"user"});
    
    res.json({
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get single user (admin only)
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user info (admin only)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { full_name, email, username } = req.body;
    const updateData = {};

    if (full_name !== undefined) updateData.full_name = full_name;
    if (email !== undefined) updateData.email = email.toLowerCase();
    if (username !== undefined) updateData.username = username || null;
    updateData.updated_at = new Date();

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Email or username already exists' });
    }
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Update user role (admin only)
router.put('/:id/role', requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;

    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true },
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Get user statistics (admin only)
router.get('/:id/stats', requireAdmin, async (req, res) => {
  try {
    const attempts = await TestAttempt.find({ user_id: req.params.id });
    res.json(buildAttemptStats(attempts));
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

// Get user activity with attempts (admin only)
router.get('/:id/activity', requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const attempts = await TestAttempt.find({ user_id: req.params.id })
      .populate({
        path: 'test_id',
        populate: {
          path: 'category_id',
          select: 'name icon',
        },
        select: 'name duration_minutes total_marks category_id negative_marking',
      })
      .sort({ completed_at: -1 });

    const stats = buildAttemptStats(attempts);
    const formattedAttempts = attempts.map(formatAttemptResponse);

    res.json({
      user,
      stats,
      attempts: formattedAttempts,
    });
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({ error: 'Failed to fetch user activity' });
  }
});

export default router;

