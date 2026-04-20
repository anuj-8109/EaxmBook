import express from 'express';
import TestAttempt from '../models/TestAttempt.js';
import TestAnswer from '../models/TestAnswer.js';
import Test from '../models/Test.js';
import User from '../models/User.js';
import Question from '../models/Question.js';

const router = express.Router();

// Get comprehensive progress analytics
router.get('/analytics', async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get user enrollment date
    const user = await User.findById(userId);
    const enrollmentDate = user?.created_at || new Date();

    // Get all attempts from enrollment date
    const attempts = await TestAttempt.find({
      user_id: userId,
      created_at: { $gte: enrollmentDate }
    })
      .populate({
        path: 'test_id',
        populate: [
          { path: 'category_id' },
          { path: 'subject_id' }
        ]
      })
      .sort({ created_at: -1 });

    // Calculate overall stats
    const totalAttempts = attempts.length;
    const totalQuestions = attempts.reduce((sum, a) => sum + a.total_questions, 0);
    const totalCorrect = attempts.reduce((sum, a) => sum + a.correct_answers, 0);
    const totalWrong = attempts.reduce((sum, a) => sum + a.wrong_answers, 0);
    const totalTime = attempts.reduce((sum, a) => sum + a.time_taken_seconds, 0);
    const avgAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
    const avgTimePerQuestion = totalQuestions > 0 ? totalTime / totalQuestions : 0;

    // Exam-wise performance
    const examWise = {};
    attempts.forEach(attempt => {
      const examName = attempt.test_id?.category_id?.name || attempt.test_id?.exam_name || 'Other';
      if (!examWise[examName]) {
        examWise[examName] = {
          name: examName,
          attempts: 0,
          totalQuestions: 0,
          correct: 0,
          wrong: 0,
          totalTime: 0,
          scores: []
        };
      }
      examWise[examName].attempts++;
      examWise[examName].totalQuestions += attempt.total_questions;
      examWise[examName].correct += attempt.correct_answers;
      examWise[examName].wrong += attempt.wrong_answers;
      examWise[examName].totalTime += attempt.time_taken_seconds;
      examWise[examName].scores.push((attempt.score / attempt.total_questions) * 100);
    });

    // Calculate exam-wise averages
    Object.keys(examWise).forEach(exam => {
      const data = examWise[exam];
      data.accuracy = data.totalQuestions > 0 ? (data.correct / data.totalQuestions) * 100 : 0;
      data.avgTime = data.totalQuestions > 0 ? data.totalTime / data.totalQuestions : 0;
      data.avgScore = data.scores.length > 0 
        ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length 
        : 0;
      delete data.scores;
    });

    // Subject-wise performance
    const subjectWise = {};
    attempts.forEach(attempt => {
      const subjectName = attempt.test_id?.subject_id?.name || 'Other';
      if (!subjectWise[subjectName]) {
        subjectWise[subjectName] = {
          name: subjectName,
          attempts: 0,
          totalQuestions: 0,
          correct: 0,
          wrong: 0,
          totalTime: 0
        };
      }
      subjectWise[subjectName].attempts++;
      subjectWise[subjectName].totalQuestions += attempt.total_questions;
      subjectWise[subjectName].correct += attempt.correct_answers;
      subjectWise[subjectName].wrong += attempt.wrong_answers;
      subjectWise[subjectName].totalTime += attempt.time_taken_seconds;
    });

    Object.keys(subjectWise).forEach(subject => {
      const data = subjectWise[subject];
      data.accuracy = data.totalQuestions > 0 ? (data.correct / data.totalQuestions) * 100 : 0;
      data.avgTime = data.totalQuestions > 0 ? data.totalTime / data.totalQuestions : 0;
    });

    // Topic-wise performance (from wrong answers)
    const topicWise = {};
    const wrongAnswers = await TestAnswer.find({
      attempt_id: { $in: attempts.map(a => a._id) },
      is_correct: false
    }).populate({
      path: 'question_id',
      populate: [
        { path: 'topic_id' },
        { path: 'subject_id' },
        { path: 'category_id' }
      ]
    });

    wrongAnswers.forEach(answer => {
      const topicName = answer.question_id?.topic_id?.name || 'Other';
      if (!topicWise[topicName]) {
        topicWise[topicName] = {
          name: topicName,
          wrongCount: 0,
          totalAttempts: 0
        };
      }
      topicWise[topicName].wrongCount++;
    });

    // Get all questions answered to calculate topic accuracy
    const allAnswers = await TestAnswer.find({
      attempt_id: { $in: attempts.map(a => a._id) }
    }).populate({
      path: 'question_id',
      populate: [{ path: 'topic_id' }]
    });

    allAnswers.forEach(answer => {
      const topicName = answer.question_id?.topic_id?.name || 'Other';
      if (!topicWise[topicName]) {
        topicWise[topicName] = {
          name: topicName,
          wrongCount: 0,
          totalAttempts: 0,
          correctCount: 0
        };
      }
      topicWise[topicName].totalAttempts++;
      if (answer.is_correct) {
        topicWise[topicName].correctCount = (topicWise[topicName].correctCount || 0) + 1;
      }
    });

    Object.keys(topicWise).forEach(topic => {
      const data = topicWise[topic];
      data.accuracy = data.totalAttempts > 0 
        ? ((data.correctCount || 0) / data.totalAttempts) * 100 
        : 0;
    });

    // Test-wise performance
    const testWise = {};
    attempts.forEach(attempt => {
      const testName = attempt.test_id?.name || 'Unknown Test';
      if (!testWise[testName]) {
        testWise[testName] = {
          name: testName,
          attempts: 0,
          bestScore: 0,
          avgScore: 0,
          scores: []
        };
      }
      testWise[testName].attempts++;
      const scorePercent = (attempt.score / attempt.total_questions) * 100;
      testWise[testName].scores.push(scorePercent);
      if (scorePercent > testWise[testName].bestScore) {
        testWise[testName].bestScore = scorePercent;
      }
    });

    Object.keys(testWise).forEach(test => {
      const data = testWise[test];
      data.avgScore = data.scores.length > 0
        ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length
        : 0;
      delete data.scores;
    });

    // Identify weak areas (topics/subjects with accuracy < 60%)
    const weakTopics = Object.values(topicWise)
      .filter((t) => t.accuracy < 60 && t.totalAttempts >= 5)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 10)
      .map((t) => ({
        name: t.name,
        accuracy: t.accuracy,
        wrongCount: t.wrongCount
      }));

    const weakSubjects = Object.values(subjectWise)
      .filter((s) => s.accuracy < 60 && s.totalQuestions >= 10)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 10)
      .map((s) => ({
        name: s.name,
        accuracy: s.accuracy,
        wrongCount: s.wrong
      }));

    res.json({
      enrollmentDate,
      overall: {
        totalAttempts,
        totalQuestions,
        totalCorrect,
        totalWrong,
        avgAccuracy: Math.round(avgAccuracy * 100) / 100,
        avgTimePerQuestion: Math.round(avgTimePerQuestion),
        totalTimeSpent: totalTime
      },
      examWise: Object.values(examWise),
      subjectWise: Object.values(subjectWise),
      topicWise: Object.values(topicWise),
      testWise: Object.values(testWise),
      weakAreas: {
        topics: weakTopics,
        subjects: weakSubjects
      }
    });
  } catch (error) {
    console.error('Get progress analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch progress analytics' });
  }
});

// Get cutoff comparison
router.get('/cutoff-comparison', async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get attempts with exam names
    const attempts = await TestAttempt.find({ user_id: userId })
      .populate({
        path: 'test_id',
        populate: { path: 'category_id' }
      })
      .sort({ created_at: -1 });

    // Group by exam and get best scores
    const examScores = {};
    attempts.forEach(attempt => {
      const examName = attempt.test_id?.category_id?.name || attempt.test_id?.exam_name || 'Other';
      const scorePercent = (attempt.score / attempt.total_questions) * 100;
      if (!examScores[examName] || scorePercent > examScores[examName]) {
        examScores[examName] = scorePercent;
      }
    });

    // Mock cutoff data (in production, this should come from a database)
    const cutoffs = {
      'SSC CGL': 140,
      'SSC CHSL': 130,
      'SSC MTS': 120,
      'UPSC': 200,
      'Railway NTPC': 90,
      'Bank PO': 120,
      // Add more as needed
    };

    const comparison = Object.keys(examScores).map(exam => ({
      examName: exam,
      userScore: Math.round(examScores[exam] * 100) / 100,
      cutoff: cutoffs[exam] || null,
      status: cutoffs[exam] 
        ? (examScores[exam] >= cutoffs[exam] ? 'above' : 'below')
        : 'no_cutoff'
    }));

    res.json({ comparison });
  } catch (error) {
    console.error('Get cutoff comparison error:', error);
    res.status(500).json({ error: 'Failed to fetch cutoff comparison' });
  }
});

// Clear user progress (requires OTP verification)
router.post('/clear', async (req, res) => {
  try {
    const { otp } = req.body;
    const userId = req.user._id;

    // Verify OTP (you'll need to implement OTP verification)
    // For now, we'll just clear the data
    // In production, verify OTP first

    // Delete all attempts and answers
    const attempts = await TestAttempt.find({ user_id: userId });
    const attemptIds = attempts.map(a => a._id);

    await TestAnswer.deleteMany({ attempt_id: { $in: attemptIds } });
    await TestAttempt.deleteMany({ user_id: userId });

    res.json({ 
      message: 'Progress cleared successfully',
      clearedAt: new Date()
    });
  } catch (error) {
    console.error('Clear progress error:', error);
    res.status(500).json({ error: 'Failed to clear progress' });
  }
});

// Request OTP for clearing progress
router.post('/clear/request-otp', async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate and send OTP (implement your OTP service)
    // For now, return a mock response
    // In production, integrate with SMS service
    
    res.json({ 
      message: 'OTP sent to registered mobile number',
      // In production, don't send OTP in response
    });
  } catch (error) {
    console.error('Request OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

export default router;

