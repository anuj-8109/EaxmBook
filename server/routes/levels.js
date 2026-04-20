import express from 'express';
import mongoose from 'mongoose';
import Level from '../models/Level.js';
import LevelContent from '../models/LevelContent.js';
import LevelProgress from '../models/LevelProgress.js';
import SkipTestAttempt from '../models/SkipTestAttempt.js';
import Question from '../models/Question.js';
import Topic from '../models/Topic.js';
import Subject from '../models/Subject.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get levels for a topic
router.get('/topic/:topicId', async (req, res) => {
  try {
    const { topicId } = req.params;
    const userId = req.user._id;

    // Get topic with subject and category info
    const topic = await Topic.findById(topicId)
      .populate('subject_id');
    
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    const subjectId = typeof topic.subject_id === 'object' 
      ? topic.subject_id._id || topic.subject_id.id
      : topic.subject_id;

    if (!subjectId) {
      return res.status(400).json({ error: 'Topic has no subject assigned' });
    }

    // Get subject to get category_id
    const subject = await Subject.findById(subjectId)
      .populate('category_id');
    
    if (!subject) {
      return res.status(400).json({ error: 'Subject not found' });
    }

    const categoryId = typeof subject.category_id === 'object'
      ? subject.category_id._id || subject.category_id.id
      : subject.category_id;

    if (!categoryId) {
      return res.status(400).json({ error: 'Subject has no category assigned' });
    }

    // Check existing levels
    let levels = await Level.find({ topic_id: topicId, is_active: true })
      .populate('topic_id')
      .populate('subject_id')
      .populate('category_id')
      .sort({ level_number: 1 });

    // Auto-create levels 1-10 if they don't exist
    if (levels.length === 0) {
      const newLevels = [];
      for (let i = 1; i <= 10; i++) {
        try {
          const newLevel = new Level({
            level_number: i,
            topic_id: topicId,
            subject_id: subjectId,
            category_id: categoryId,
            name: `Level ${i}`,
            description: `Level ${i} for ${topic.name}`,
            total_questions: 1000,
            skip_test_questions: 30,
            skip_test_pass_percentage: 80,
            is_active: true
          });
          await newLevel.save();
          await newLevel.populate('topic_id');
          await newLevel.populate('subject_id');
          await newLevel.populate('category_id');
          newLevels.push(newLevel);
        } catch (error) {
          // Level might already exist (unique constraint), skip it
          console.log(`Level ${i} might already exist, skipping...`);
        }
      }
      levels = newLevels;
    } else if (levels.length < 10) {
      // Create missing levels
      const existingLevelNumbers = levels.map(l => l.level_number);
      for (let i = 1; i <= 10; i++) {
        if (!existingLevelNumbers.includes(i)) {
          try {
            const newLevel = new Level({
              level_number: i,
              topic_id: topicId,
              subject_id: subjectId,
              category_id: categoryId,
              name: `Level ${i}`,
              description: `Level ${i} for ${topic.name}`,
              total_questions: 1000,
              skip_test_questions: 30,
              skip_test_pass_percentage: 80,
              is_active: true
            });
            await newLevel.save();
            await newLevel.populate('topic_id');
            await newLevel.populate('subject_id');
            await newLevel.populate('category_id');
            levels.push(newLevel);
          } catch (error) {
            console.log(`Level ${i} creation error:`, error.message);
          }
        }
      }
      // Re-sort after adding new levels
      levels.sort((a, b) => a.level_number - b.level_number);
    }

    // Get user progress for these levels
    const progress = await LevelProgress.find({
      user_id: userId,
      level_id: { $in: levels.map(l => l._id) }
    });

    const progressMap = {};
    progress.forEach(p => {
      progressMap[p.level_id.toString()] = p;
    });

    // Mark first level as unlocked if no progress exists
    if (levels.length > 0 && progress.length === 0) {
      const firstLevel = levels[0];
      await LevelProgress.create({
        user_id: userId,
        level_id: firstLevel._id,
        category_id: firstLevel.category_id._id || firstLevel.category_id,
        subject_id: firstLevel.subject_id._id || firstLevel.subject_id,
        topic_id: firstLevel.topic_id._id || firstLevel.topic_id,
        level_number: firstLevel.level_number,
        status: 'unlocked',
        unlocked_at: new Date()
      });
      progressMap[firstLevel._id.toString()] = {
        status: 'unlocked',
        practice_questions_attempted: 0,
        practice_questions_correct: 0,
        practice_accuracy: 0,
        skip_test_passed: false
      };
    }

    // Attach progress to levels
    const levelsWithProgress = levels.map(level => {
      const levelProgress = progressMap[level._id.toString()];
      return {
        ...level.toObject(),
        progress: levelProgress || {
          status: level.level_number === 1 ? 'unlocked' : 'locked',
          practice_questions_attempted: 0,
          practice_questions_correct: 0,
          practice_accuracy: 0,
          skip_test_passed: false
        }
      };
    });

    res.json(levelsWithProgress);
  } catch (error) {
    console.error('Get levels error:', error);
    res.status(500).json({ error: 'Failed to fetch levels' });
  }
});

// Get level content (PDFs, notes, videos, etc.)
router.get('/:levelId/content', async (req, res) => {
  try {
    const { levelId } = req.params;

    const content = await LevelContent.find({
      level_id: levelId,
      is_active: true
    }).sort({ display_order: 1, created_at: 1 });

    // Group by content type
    const groupedContent = {
      pdfs: [],
      notes: [],
      formulas: [],
      videos: [],
      theory: [],
      written: []
    };

    content.forEach(item => {
      if (groupedContent[item.content_type + 's']) {
        groupedContent[item.content_type + 's'].push(item);
      } else if (item.content_type === 'written') {
        groupedContent.written.push(item);
      }
    });

    res.json(groupedContent);
  } catch (error) {
    console.error('Get level content error:', error);
    res.status(500).json({ error: 'Failed to fetch level content' });
  }
});

// Get practice questions for a level (paginated, 1000 total)
router.get('/:levelId/practice-questions', async (req, res) => {
  try {
    const { levelId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const level = await Level.findById(levelId)
      .populate('topic_id')
      .populate('subject_id')
      .populate('category_id');

    if (!level) {
      return res.status(404).json({ error: 'Level not found' });
    }

    // Get questions for this topic - support both topic_id (single) and topic_ids (array)
    let topicId = level.topic_id?._id || level.topic_id;
    const subjectId = level.subject_id?._id || level.subject_id;
    const categoryId = level.category_id?._id || level.category_id;

    // Convert to ObjectId if it's a string
    if (topicId && typeof topicId === 'string') {
      try {
        topicId = new mongoose.Types.ObjectId(topicId);
      } catch (err) {
        console.error('Invalid topicId format:', topicId);
      }
    }

    console.log('Level data:', {
      levelId: level._id,
      topicId: topicId?.toString(),
      subjectId: subjectId?.toString(),
      categoryId: categoryId?.toString(),
      topic_id_type: typeof level.topic_id,
      topic_id_value: level.topic_id
    });

    if (!topicId) {
      console.log('No topicId found for level:', level._id);
      return res.json({
        questions: [],
        total: 0,
        page: parseInt(page),
        limit: parseInt(limit),
        level: {
          id: level._id,
          level_number: level.level_number,
          name: level.name
        }
      });
    }

    // Build query - topic is required, subject/category are completely optional
    // Match questions by topic_id or topic_ids
    const query = {
      $or: [
        { topic_id: topicId },
        { topic_ids: topicId }
      ]
    };

    console.log('Fetching practice questions for level:', level._id);
    console.log('Topic ID:', topicId?.toString());
    console.log('Subject ID:', subjectId?.toString());
    console.log('Category ID:', categoryId?.toString());
    console.log('Query:', JSON.stringify(query, null, 2));

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // First, check total count
    const total = await Question.countDocuments(query);
    console.log(`Total questions found for topic ${topicId?.toString()}: ${total}`);
    
    // Then fetch the questions
    const questions = await Question.find(query)
      .select('question_text option_a option_b option_c option_d correct_answer explanation _id')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ created_at: -1 })
      .lean(); // Use lean() for better performance
    
    console.log(`Returning ${questions.length} questions on page ${page} (skip: ${skip}, limit: ${parseInt(limit)})`);
    
    // Ensure questions array is always present
    const response = {
      questions: questions || [],
      total: total || 0,
      page: parseInt(page),
      limit: parseInt(limit),
      level: {
        id: level._id,
        level_number: level.level_number,
        name: level.name
      }
    };

    console.log('Response:', {
      questionsCount: response.questions.length,
      total: response.total,
      page: response.page
    });

    res.json(response);
  } catch (error) {
    console.error('Get practice questions error:', error);
    res.status(500).json({ error: 'Failed to fetch practice questions' });
  }
});

// Get skip test questions (30 random questions)
router.get('/:levelId/skip-test-questions', async (req, res) => {
  try {
    const { levelId } = req.params;
    const userId = req.user._id;

    const level = await Level.findById(levelId)
      .populate('topic_id')
      .populate('subject_id')
      .populate('category_id');

    if (!level) {
      return res.status(404).json({ error: 'Level not found' });
    }

    // Get user progress
    const progress = await LevelProgress.findOne({
      user_id: userId,
      level_id: levelId
    });

    if (!progress || progress.status === 'locked') {
      return res.status(403).json({ error: 'Level is locked' });
    }

    // Get 30 random questions for this topic - support both topic_id (single) and topic_ids (array)
    const topicId = level.topic_id?._id || level.topic_id;
    const subjectId = level.subject_id?._id || level.subject_id;
    const categoryId = level.category_id?._id || level.category_id;

    if (!topicId) {
      return res.status(400).json({ error: 'Level is missing topic association' });
    }

    // Build query - prioritize topic_id/topic_ids
    const query = {
      $or: [
        { topic_id: topicId },
        { topic_ids: topicId }
      ]
    };

    // Add subject filter if available (optional)
    if (subjectId) {
      if (!query.$and) query.$and = [];
      query.$and.push({
        $or: [
          { subject_id: subjectId },
          { subject_ids: subjectId }
        ]
      });
    }

    // Add category filter if available (optional)
    if (categoryId) {
      if (!query.$and) query.$and = [];
      query.$and.push({
        $or: [
          { category_id: categoryId },
          { category_ids: categoryId }
        ]
      });
    }

    const allQuestions = await Question.find(query)
      .select('question_text option_a option_b option_c option_d correct_answer explanation');

    // Shuffle and get 30 random questions
    const shuffled = allQuestions.sort(() => 0.5 - Math.random());
    const questions = shuffled.slice(0, level.skip_test_questions);

    res.json({
      questions,
      level: {
        id: level._id,
        level_number: level.level_number,
        name: level.name,
        skip_test_questions: level.skip_test_questions,
        skip_test_pass_percentage: level.skip_test_pass_percentage
      }
    });
  } catch (error) {
    console.error('Get skip test questions error:', error);
    res.status(500).json({ error: 'Failed to fetch skip test questions' });
  }
});

// Submit skip test
router.post('/:levelId/skip-test', async (req, res) => {
  try {
    const { levelId } = req.params;
    const userId = req.user._id;
    const { answers, time_taken_seconds, started_at } = req.body;

    const level = await Level.findById(levelId);
    if (!level) {
      return res.status(404).json({ error: 'Level not found' });
    }

    // Get user progress
    let progress = await LevelProgress.findOne({
      user_id: userId,
      level_id: levelId
    });

    if (!progress) {
      return res.status(404).json({ error: 'Progress not found' });
    }

    // Calculate score
    let correct = 0;
    let wrong = 0;
    const questionsWithAnswers = [];

    for (const answer of answers) {
      const question = await Question.findById(answer.question_id);
      if (!question) continue;

      const isCorrect = answer.selected_answer === question.correct_answer;
      if (isCorrect) {
        correct++;
      } else {
        wrong++;
      }

      questionsWithAnswers.push({
        question_id: answer.question_id,
        selected_answer: answer.selected_answer,
        is_correct: isCorrect
      });
    }

    const totalQuestions = answers.length;
    const scorePercentage = (correct / totalQuestions) * 100;
    const passed = scorePercentage >= level.skip_test_pass_percentage;

    // Save skip test attempt
    const attempt = new SkipTestAttempt({
      user_id: userId,
      level_id: levelId,
      level_progress_id: progress._id,
      questions: questionsWithAnswers,
      total_questions: totalQuestions,
      correct_answers: correct,
      wrong_answers: wrong,
      score_percentage: scorePercentage,
      passed: passed,
      started_at: new Date(started_at),
      completed_at: new Date(),
      time_taken_seconds: time_taken_seconds
    });

    await attempt.save();

    // Update progress
    progress.skip_test_attempts += 1;
    if (scorePercentage > progress.skip_test_best_score) {
      progress.skip_test_best_score = scorePercentage;
    }

    if (passed) {
      progress.skip_test_passed = true;
      progress.status = 'skipped';
      progress.skipped_at = new Date();

      // Unlock next level
      const nextLevel = await Level.findOne({
        topic_id: level.topic_id,
        level_number: level.level_number + 1
      });

      if (nextLevel) {
        const nextProgress = await LevelProgress.findOne({
          user_id: userId,
          level_id: nextLevel._id
        });

        if (!nextProgress) {
          await LevelProgress.create({
            user_id: userId,
            level_id: nextLevel._id,
            category_id: level.category_id,
            subject_id: level.subject_id,
            topic_id: level.topic_id,
            level_number: nextLevel.level_number,
            status: 'unlocked',
            unlocked_at: new Date()
          });
        } else if (nextProgress.status === 'locked') {
          nextProgress.status = 'unlocked';
          nextProgress.unlocked_at = new Date();
          await nextProgress.save();
        }
      }
    }

    await progress.save();

    res.json({
      attempt: attempt.toObject(),
      passed,
      scorePercentage,
      requiredPercentage: level.skip_test_pass_percentage,
      nextLevelUnlocked: passed && (await Level.findOne({
        topic_id: level.topic_id,
        level_number: level.level_number + 1
      })) ? true : false
    });
  } catch (error) {
    console.error('Submit skip test error:', error);
    res.status(500).json({ error: 'Failed to submit skip test' });
  }
});

// Update practice progress
router.post('/:levelId/practice-progress', async (req, res) => {
  try {
    const { levelId } = req.params;
    const userId = req.user._id;
    const { correct, wrong, total } = req.body;

    let progress = await LevelProgress.findOne({
      user_id: userId,
      level_id: levelId
    });

    if (!progress) {
      return res.status(404).json({ error: 'Progress not found' });
    }

    progress.practice_questions_attempted += total;
    progress.practice_questions_correct += correct;
    progress.practice_questions_wrong += wrong;
    progress.practice_accuracy = progress.practice_questions_attempted > 0
      ? (progress.practice_questions_correct / progress.practice_questions_attempted) * 100
      : 0;

    if (progress.status === 'unlocked') {
      progress.status = 'in_progress';
    }

    await progress.save();

    res.json(progress);
  } catch (error) {
    console.error('Update practice progress error:', error);
    res.status(500).json({ error: 'Failed to update practice progress' });
  }
});

// Get user progress for all levels (exam-wise)
router.get('/progress/exam-wise', async (req, res) => {
  try {
    const userId = req.user._id;

    const progress = await LevelProgress.find({ user_id: userId })
      .populate({
        path: 'level_id',
        populate: [
          { path: 'category_id' },
          { path: 'subject_id' },
          { path: 'topic_id' }
        ]
      })
      .sort({ category_id: 1, subject_id: 1, topic_id: 1, level_number: 1 });

    // Group by exam (category)
    const examWise = {};
    progress.forEach(p => {
      const examName = p.level_id?.category_id?.name || 'Other';
      if (!examWise[examName]) {
        examWise[examName] = {
          examName,
          subjects: {}
        };
      }

      const subjectName = p.level_id?.subject_id?.name || 'Other';
      if (!examWise[examName].subjects[subjectName]) {
        examWise[examName].subjects[subjectName] = {
          subjectName,
          topics: {}
        };
      }

      const topicName = p.level_id?.topic_id?.name || 'Other';
      if (!examWise[examName].subjects[subjectName].topics[topicName]) {
        examWise[examName].subjects[subjectName].topics[topicName] = {
          topicName,
          levels: []
        };
      }

      examWise[examName].subjects[subjectName].topics[topicName].levels.push({
        levelNumber: p.level_number,
        status: p.status,
        practiceAccuracy: p.practice_accuracy,
        practiceAttempted: p.practice_questions_attempted,
        skipTestPassed: p.skip_test_passed,
        skipTestBestScore: p.skip_test_best_score,
        completedAt: p.completed_at
      });
    });

    res.json(examWise);
  } catch (error) {
    console.error('Get exam-wise progress error:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// Admin routes
router.post('/', requireAdmin, async (req, res) => {
  try {
    const {
      level_number,
      topic_id,
      subject_id,
      category_id,
      name,
      description,
      total_questions,
      skip_test_questions,
      skip_test_pass_percentage
    } = req.body;

    const level = new Level({
      level_number,
      topic_id,
      subject_id,
      category_id,
      name,
      description,
      total_questions: total_questions || 1000,
      skip_test_questions: skip_test_questions || 30,
      skip_test_pass_percentage: skip_test_pass_percentage || 80
    });

    await level.save();
    await level.populate(['topic_id', 'subject_id', 'category_id']);

    res.status(201).json(level);
  } catch (error) {
    console.error('Create level error:', error);
    res.status(500).json({ error: 'Failed to create level' });
  }
});

router.post('/:levelId/content', requireAdmin, async (req, res) => {
  try {
    const { levelId } = req.params;
    const {
      content_type,
      title,
      description,
      file_url,
      content_text,
      formula_text,
      video_duration,
      display_order
    } = req.body;

    const content = new LevelContent({
      level_id: levelId,
      content_type,
      title,
      description,
      file_url,
      content_text,
      formula_text,
      video_duration,
      display_order: display_order || 0
    });

    await content.save();
    res.status(201).json(content);
  } catch (error) {
    console.error('Create level content error:', error);
    res.status(500).json({ error: 'Failed to create level content' });
  }
});

export default router;

