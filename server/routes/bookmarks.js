import express from 'express';
import Bookmark from '../models/Bookmark.js';

const router = express.Router();

// Get all bookmarks for current user
router.get('/', async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ user_id: req.user._id })
      .populate('question_id')
      .sort({ created_at: -1 });
    res.json(bookmarks);
  } catch (error) {
    console.error('Get bookmarks error:', error);
    res.status(500).json({ error: 'Failed to fetch bookmarks' });
  }
});

// Check if question is bookmarked
router.get('/check/:questionId', async (req, res) => {
  try {
    const bookmark = await Bookmark.findOne({
      user_id: req.user._id,
      question_id: req.params.questionId,
    });
    res.json({ isBookmarked: !!bookmark });
  } catch (error) {
    console.error('Check bookmark error:', error);
    res.status(500).json({ error: 'Failed to check bookmark' });
  }
});

// Toggle bookmark (add or remove)
router.post('/toggle/:questionId', async (req, res) => {
  try {
    const existingBookmark = await Bookmark.findOne({
      user_id: req.user._id,
      question_id: req.params.questionId,
    });

    if (existingBookmark) {
      await Bookmark.findByIdAndDelete(existingBookmark._id);
      res.json({ isBookmarked: false, message: 'Bookmark removed' });
    } else {
      const bookmark = new Bookmark({
        user_id: req.user._id,
        question_id: req.params.questionId,
      });
      await bookmark.save();
      await bookmark.populate('question_id');
      res.json({ isBookmarked: true, bookmark, message: 'Bookmark added' });
    }
  } catch (error) {
    console.error('Toggle bookmark error:', error);
    res.status(500).json({ error: 'Failed to toggle bookmark' });
  }
});

// Get wrong answers for current user
router.get('/wrong-answers', async (req, res) => {
  try {
    const TestAnswer = (await import('../models/TestAnswer.js')).default;
    const TestAttempt = (await import('../models/TestAttempt.js')).default;

    // Get all attempts by user
    const attempts = await TestAttempt.find({ user_id: req.user._id })
      .select('_id')
      .lean();

    const attemptIds = attempts.map(a => a._id);

    // Get all wrong answers
    const wrongAnswers = await TestAnswer.find({
      attempt_id: { $in: attemptIds },
      is_correct: false,
    })
      .populate({
        path: 'question_id',
        populate: [
          { path: 'category_id' },
          { path: 'subject_id' },
          { path: 'topic_id' },
        ],
      })
      .populate({
        path: 'attempt_id',
        populate: {
          path: 'test_id',
          select: 'name category_id',
        },
      })
      .sort({ created_at: -1 });

    // Get unique question IDs
    const questionIds = [...new Set(wrongAnswers.map(a => a.question_id?._id?.toString()).filter(Boolean))];

    res.json({
      wrongAnswers,
      questionIds,
      total: questionIds.length,
    });
  } catch (error) {
    console.error('Get wrong answers error:', error);
    res.status(500).json({ error: 'Failed to fetch wrong answers' });
  }
});

export default router;

