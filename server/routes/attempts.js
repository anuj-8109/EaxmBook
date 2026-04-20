import express from 'express';
import TestAttempt from '../models/TestAttempt.js';
import TestAnswer from '../models/TestAnswer.js';
import Test from '../models/Test.js';

const router = express.Router();

// Get all attempts for current user
router.get('/', async (req, res) => {
  try {
    const attempts = await TestAttempt.find({ user_id: req.user._id })
      .populate('test_id')
      .sort({ created_at: -1 });
    res.json(attempts);
  } catch (error) {
    console.error('Get attempts error:', error);
    res.status(500).json({ error: 'Failed to fetch attempts' });
  }
});

// Get single attempt with answers
router.get('/:id', async (req, res) => {
  try {
    const attempt = await TestAttempt.findById(req.params.id)
      .populate({
        path: 'test_id',
        populate: {
          path: 'category_id',
        },
      });

    if (!attempt) {
      return res.status(404).json({ error: 'Attempt not found' });
    }

    // Check if user owns this attempt or is admin
    if (attempt.user_id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get answers
    const answers = await TestAnswer.find({ attempt_id: attempt._id })
      .populate('question_id');

    res.json({
      ...attempt.toObject(),
      answers,
    });
  } catch (error) {
    console.error('Get attempt error:', error);
    res.status(500).json({ error: 'Failed to fetch attempt' });
  }
});

// Create test attempt
router.post('/', async (req, res) => {
  try {
    const {
      test_id,
      started_at,
      completed_at,
      time_taken_seconds,
      total_questions,
      correct_answers,
      wrong_answers,
      unanswered,
      score,
      answers,
    } = req.body;

    if (!test_id || !started_at || !completed_at) {
      return res.status(400).json({ error: 'Test ID, start time, and completion time are required' });
    }

    const attempt = new TestAttempt({
      user_id: req.user._id,
      test_id,
      started_at,
      completed_at,
      time_taken_seconds,
      total_questions,
      correct_answers,
      wrong_answers,
      unanswered,
      score,
    });

    await attempt.save();

    // Save answers
    if (answers && answers.length > 0) {
      const answersToSave = answers.map(answer => ({
        attempt_id: attempt._id,
        question_id: answer.question_id,
        selected_answer: answer.selected_answer,
        is_correct: answer.is_correct,
        marks_awarded: answer.marks_awarded,
      }));

      await TestAnswer.insertMany(answersToSave);
    }

    await attempt.populate({
      path: 'test_id',
      populate: {
        path: 'category_id',
      },
    });

    res.status(201).json(attempt);
  } catch (error) {
    console.error('Create attempt error:', error);
    res.status(500).json({ error: 'Failed to create attempt' });
  }
});

// Get all attempts (admin only)
router.get('/admin/all', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // const attempts = await TestAttempt.find().sort({ created_at: -1 }).limit(5);
    const attempts = await TestAttempt.aggregate([
      {
        $lookup: {
          from: 'tests',
          localField: 'test_id',
          foreignField: '_id',
          as: 'test',
        },
      },
      {
        $unwind: '$test',
      },
      {
        $sort: { created_at: -1 },
      },
      {
        $limit: 5,
      },
      {
        $project: {
          _id: 1,
          user_id: 1,
          test_id: 1,
          started_at: 1,
          completed_at: 1,
          time_taken_seconds: 1,
          total_questions: 1,
          correct_answers: 1,
          wrong_answers: 1,
          unanswered: 1,
          score: 1,
          created_at: 1,
          // test: 1,
          test_name: '$test.name',
          test_category_id: '$test.category_id',
          test_category_name: '$test.category_id.name',
          test_category_icon: '$test.category_id.icon',
          test_duration_minutes: '$test.duration_minutes',
          test_total_marks: '$test.total_marks',
          test_negative_marking: '$test.negative_marking',
          test_negative_marks_per_question: '$test.negative_marks_per_question',
          test_test_type: '$test.test_type',
          test_difficulty_distribution: '$test.difficulty_distribution',
          test_is_active: '$test.is_active',
          test_created_at: '$test.created_at',
          test_updated_at: '$test.updated_at',
          test_created_by: '$test.created_by',
          test_created_by_name: '$test.created_by.name',
          test_created_by_email: '$test.created_by.email',
          test_created_by_role: '$test.created_by.role',
        },
      }
    ]);

    console.log("attempts",attempts)

    res.json(attempts);
  } catch (error) {
    console.error('Get all attempts error:', error);
    res.status(500).json({ error: 'Failed to fetch attempts' });
  }
});

export default router;

