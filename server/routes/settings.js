import express from 'express';
import Setting from '../models/Setting.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { getPublicSettings } from '../services/mailer.js';
import TestAnswer from '../models/TestAnswer.js';
import TestAttempt from '../models/TestAttempt.js';
import TestQuestion from '../models/TestQuestion.js';
import Test from '../models/Test.js';
import Question from '../models/Question.js';
import Topic from '../models/Topic.js';
import Subject from '../models/Subject.js';
import Category from '../models/Category.js';
import Bookmark from '../models/Bookmark.js';
import CategorySubscription from '../models/CategorySubscription.js';
import SkipTestAttempt from '../models/SkipTestAttempt.js';
import LevelProgress from '../models/LevelProgress.js';

const router = express.Router();

const sanitizeSettingBody = (body) => {
  const sanitized = {};
  if (body.smtp) {
    sanitized.smtp = {
      host: body.smtp.host || '',
      port: body.smtp.port || 587,
      secure: Boolean(body.smtp.secure),
      user: body.smtp.user || '',
      password: body.smtp.password || '',
      fromName: body.smtp.fromName || '',
      fromEmail: body.smtp.fromEmail || '',
    };
  }
  if (body.google) {
    sanitized.google = {
      clientId: body.google.clientId || '',
      clientSecret: body.google.clientSecret || '',
    };
  }
  if (body.system) {
    sanitized.system = {
      app_name: body.system.app_name || 'Easy Exam Gen',
      logo: body.system.logo || null,
      favicon: body.system.favicon || null,
    };
  }
  if (body.groq) {
    sanitized.groq = {
      apiKey: body.groq.apiKey || '',
      modelName: body.groq.modelName || 'llama-3.3-70b-versatile',
    };
  }
  return sanitized;
};

router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const settings = await Setting.findOne().sort({ updated_at: -1 }).lean();
    res.json(settings || {});
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.get('/public', async (req, res) => {
  try {
    const settings = await getPublicSettings();
    res.json(settings);
  } catch (error) {
    console.error('Get public settings error:', error);
    res.status(500).json({ error: 'Failed to fetch public settings' });
  }
});

// Get system settings (public endpoint for logo, favicon, app name)
router.get('/system', async (req, res) => {
  try {
    const settings = await Setting.findOne().sort({ updated_at: -1 }).lean();
    const systemSettings = settings?.system || {
      app_name: 'Easy Exam Gen',
      logo: null,
      favicon: null,
    };
    res.json(systemSettings);
  } catch (error) {
    console.error('Get system settings error:', error);
    res.status(500).json({ error: 'Failed to fetch system settings' });
  }
});

router.put('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const payload = sanitizeSettingBody(req.body || {});
    payload.updated_by = req.user?._id;

    const updated = await Setting.findOneAndUpdate(
      {},
      payload,
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    res.json(updated);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Cleanup all test-related data (admin only)
router.post('/cleanup-test-data', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('Starting database cleanup...');

    // Delete in order to respect dependencies
    const results = {};

    // 1. Delete TestAnswers
    results.testAnswers = await TestAnswer.deleteMany({});

    // 2. Delete TestAttempts
    results.testAttempts = await TestAttempt.deleteMany({});

    // 3. Delete SkipTestAttempts
    results.skipTestAttempts = await SkipTestAttempt.deleteMany({});

    // 4. Delete TestQuestions
    results.testQuestions = await TestQuestion.deleteMany({});

    // 5. Delete Tests
    results.tests = await Test.deleteMany({});

    // 6. Delete Bookmarks
    results.bookmarks = await Bookmark.deleteMany({});

    // 7. Delete Questions
    results.questions = await Question.deleteMany({});

    // 8. Delete LevelProgress
    results.levelProgress = await LevelProgress.deleteMany({});

    // 9. Delete Topics
    results.topics = await Topic.deleteMany({});

    // 10. Delete CategorySubscriptions
    results.categorySubscriptions = await CategorySubscription.deleteMany({});

    // 11. Delete Subjects
    results.subjects = await Subject.deleteMany({});

    // 12. Delete Categories
    results.categories = await Category.deleteMany({});

    const summary = {
      testAnswers: results.testAnswers.deletedCount,
      testAttempts: results.testAttempts.deletedCount,
      skipTestAttempts: results.skipTestAttempts.deletedCount,
      testQuestions: results.testQuestions.deletedCount,
      tests: results.tests.deletedCount,
      bookmarks: results.bookmarks.deletedCount,
      questions: results.questions.deletedCount,
      levelProgress: results.levelProgress.deletedCount,
      topics: results.topics.deletedCount,
      categorySubscriptions: results.categorySubscriptions.deletedCount,
      subjects: results.subjects.deletedCount,
      categories: results.categories.deletedCount,
    };

    console.log('Cleanup completed:', summary);

    res.json({
      success: true,
      message: 'All test-related data has been deleted successfully',
      summary,
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ error: 'Failed to cleanup test data', details: error.message });
  }
});

export default router;


