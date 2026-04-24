import express from 'express';
import Test from '../models/Test.js';
import TestQuestion from '../models/TestQuestion.js';
import Question from '../models/Question.js';
import CategorySubscription from '../models/CategorySubscription.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Level from '../models/Level.js';
import { requireAdmin } from '../middleware/auth.js';
import { sendNewTestEmail } from '../services/mailer.js';

const router = express.Router();

// Get all tests with pagination
router.get('/', async (req, res) => {
  try {
    const { category_id, is_active, page, limit, search } = req.query;
    const query = {};
    
    // Filter by category
    if (category_id) query.category_id = category_id;
    
    // Filter by active status
    if (is_active !== undefined) query.is_active = is_active === 'true';

    // Filter by live status
    if (req.query.is_live !== undefined) query.is_live = req.query.is_live === 'true';
    
    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { exam_name: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination parameters
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination metadata
    const total = await Test.countDocuments(query);

    // Fetch paginated tests
    const tests = await Test.find(query)
      .populate('category_id')
      .populate('subject_id')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limitNum);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.json({
      tests,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    console.error('Get tests error:', error);
    res.status(500).json({ error: 'Failed to fetch tests' });
  }
});

// Get single test with questions
router.get('/:id', async (req, res) => {
  try {
    const test = await Test.findById(req.params.id)
      .populate('category_id')
      .populate('subject_id');
    
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    // Get test questions
    const testQuestions = await TestQuestion.find({ test_id: test._id })
      .populate('question_id')
      .sort({ question_order: 1 });

    res.json({
      ...test.toObject(),
      questions: testQuestions.map(tq => tq.question_id),
    });
  } catch (error) {
    console.error('Get test error:', error);
    res.status(500).json({ error: 'Failed to fetch test' });
  }
});

// Create test (admin only)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      category_id,
      subject_id,
      duration_minutes,
      total_marks,
      negative_marking,
      negative_marks_per_question,
      test_type,
      difficulty_distribution,
      is_paid,
      price,
      exam_name,
      subject_wise_distribution,
      show_questions_subject_wise,
      has_cutoff,
      cutoff_by_category,
      total_questions,
      is_live,
      live_start_time,
      live_end_time,
      live_result_time,
    } = req.body;

    if (!name || !duration_minutes || !total_marks) {
      return res.status(400).json({ error: 'Name, duration, and total marks are required' });
    }

    const test = new Test({
      name,
      description,
      category_id,
      subject_id,
      duration_minutes,
      total_marks,
      negative_marking: negative_marking || false,
      negative_marks_per_question: negative_marks_per_question || 0.25,
      test_type: test_type || 'static',
      difficulty_distribution,
      is_paid: is_paid || false,
      price: price || 0,
      exam_name,
      subject_wise_distribution: subject_wise_distribution || [],
      show_questions_subject_wise: show_questions_subject_wise || false,
      has_cutoff: has_cutoff || false,
      cutoff_by_category: cutoff_by_category || [],
      total_questions: total_questions || 0,
      is_live: is_live || false,
      live_start_time,
      live_end_time,
      live_result_time,
      is_active: req.body.is_active !== undefined ? req.body.is_active : true,
      created_by: req.user._id,
    });

    await test.save();
    await test.populate('category_id');
    await test.populate('subject_id');

    // Send notifications to subscribed users (only if test is active)
    try {
      if (category_id && test.is_active) {
        // Find all users subscribed to this category
        const subscriptions = await CategorySubscription.find({ category_id })
          .populate('user_id', 'email name')
          .populate('category_id', 'name icon');

        if (subscriptions.length > 0) {
          const category = subscriptions[0].category_id;
          const categoryName = typeof category === 'object' ? category.name : 'Category';
          const categoryIcon = typeof category === 'object' ? (category.icon || '📝') : '📝';
          
          // Get base URL from environment or use default
          const baseUrl = process.env.FRONTEND_URL || process.env.BASE_URL || 'http://localhost:8080';
          
          // Create notifications for all subscribed users
          const notifications = subscriptions.map(sub => ({
            user_id: sub.user_id._id || sub.user_id,
            title: `${categoryIcon} New Test Available!`,
            message: `A new test "${test.name}" has been added to ${categoryName}. Duration: ${test.duration_minutes} mins, Marks: ${test.total_marks}. Start practicing now!`,
            type: 'new_test',
            related_id: test._id,
            related_type: 'test',
            read: false,
          }));

          if (notifications.length > 0) {
            // Save in-app notifications
            await Notification.insertMany(notifications);
            console.log(`✅ Created ${notifications.length} in-app notifications for new test: ${test.name}`);
            
            // Send email notifications (async, don't wait)
            subscriptions.forEach(async (sub) => {
              try {
                const user = sub.user_id;
                const userEmail = typeof user === 'object' ? user.email : null;
                
                if (userEmail) {
                  await sendNewTestEmail({
                    to: userEmail,
                    testName: test.name,
                    categoryName,
                    duration: test.duration_minutes,
                    marks: test.total_marks,
                    testId: test._id,
                    baseUrl,
                  });
                  console.log(`✅ Sent email notification to ${userEmail}`);
                }
              } catch (emailError) {
                console.error(`❌ Failed to send email to user ${sub.user_id._id}:`, emailError.message);
                // Don't fail the whole process if email fails
              }
            });
          }
        }
      }
    } catch (notifError) {
      console.error('Failed to create notifications for new test:', notifError);
      // Don't fail the request if notification creation fails
    }

    res.status(201).json(test);
  } catch (error) {
    console.error('Create test error:', error);
    res.status(500).json({ error: 'Failed to create test' });
  }
});

// Update test (admin only)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      category_id,
      subject_id,
      duration_minutes,
      total_marks,
      negative_marking,
      negative_marks_per_question,
      test_type,
      difficulty_distribution,
      is_active,
      is_paid,
      price,
      exam_name,
      subject_wise_distribution,
      show_questions_subject_wise,
      has_cutoff,
      cutoff_by_category,
      total_questions,
      is_live,
      live_start_time,
      live_end_time,
      live_result_time,
    } = req.body;

    // Get the existing test to check if it's being activated
    const existingTest = await Test.findById(req.params.id);
    const wasInactive = existingTest && !existingTest.is_active;
    const isBeingActivated = wasInactive && is_active === true;

    const test = await Test.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        category_id,
        subject_id,
        duration_minutes,
        total_marks,
        negative_marking,
        negative_marks_per_question,
        test_type,
        difficulty_distribution,
        is_active,
        is_paid,
        price,
        exam_name,
        subject_wise_distribution,
        show_questions_subject_wise,
        has_cutoff,
        cutoff_by_category,
        total_questions,
        is_live,
        live_start_time,
        live_end_time,
        live_result_time,
        updated_at: Date.now(),
      },
      { new: true, runValidators: true }
    );

    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    await test.populate('category_id');
    await test.populate('subject_id');

    // Send notifications if test is being activated (was inactive, now active)
    try {
      if (isBeingActivated && category_id) {
        // Find all users subscribed to this category
        const subscriptions = await CategorySubscription.find({ category_id })
          .populate('user_id', 'email name')
          .populate('category_id', 'name icon');

        if (subscriptions.length > 0) {
          const category = subscriptions[0].category_id;
          const categoryName = typeof category === 'object' ? category.name : 'Category';
          const categoryIcon = typeof category === 'object' ? (category.icon || '📝') : '📝';
          
          // Get base URL from environment or use default
          const baseUrl = process.env.FRONTEND_URL || process.env.BASE_URL || 'http://localhost:8080';
          
          // Create notifications for all subscribed users
          const notifications = subscriptions.map(sub => ({
            user_id: sub.user_id._id || sub.user_id,
            title: `${categoryIcon} New Test Available!`,
            message: `A new test "${test.name}" has been added to ${categoryName}. Duration: ${test.duration_minutes} mins, Marks: ${test.total_marks}. Start practicing now!`,
            type: 'new_test',
            related_id: test._id,
            related_type: 'test',
            read: false,
          }));

          if (notifications.length > 0) {
            // Save in-app notifications
            await Notification.insertMany(notifications);
            console.log(`✅ Created ${notifications.length} in-app notifications for activated test: ${test.name}`);
            
            // Send email notifications (async, don't wait)
            subscriptions.forEach(async (sub) => {
              try {
                const user = sub.user_id;
                const userEmail = typeof user === 'object' ? user.email : null;
                
                if (userEmail) {
                  await sendNewTestEmail({
                    to: userEmail,
                    testName: test.name,
                    categoryName,
                    duration: test.duration_minutes,
                    marks: test.total_marks,
                    testId: test._id,
                    baseUrl,
                  });
                  console.log(`✅ Sent email notification to ${userEmail}`);
                }
              } catch (emailError) {
                console.error(`❌ Failed to send email to user ${sub.user_id._id}:`, emailError.message);
                // Don't fail the whole process if email fails
              }
            });
          }
        }
      }
    } catch (notifError) {
      console.error('Failed to create notifications for activated test:', notifError);
      // Don't fail the request if notification creation fails
    }

    res.json(test);
  } catch (error) {
    console.error('Update test error:', error);
    res.status(500).json({ error: 'Failed to update test' });
  }
});

// Batch delete tests (admin only) - MUST be before /:id route
router.delete('/batch', requireAdmin, async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'IDs array is required' });
    }

    // Delete tests
    const result = await Test.deleteMany({ _id: { $in: ids } });

    // Delete associated test questions
    await TestQuestion.deleteMany({ test_id: { $in: ids } });

    res.json({
      message: 'Tests deleted successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Batch delete tests error:', error);
    res.status(500).json({ error: 'Failed to delete tests' });
  }
});

// Delete test (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const test = await Test.findByIdAndDelete(req.params.id);
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    // Delete associated test questions
    await TestQuestion.deleteMany({ test_id: req.params.id });

    res.json({ message: 'Test deleted successfully' });
  } catch (error) {
    console.error('Delete test error:', error);
    res.status(500).json({ error: 'Failed to delete test' });
  }
});

// Add question to test (admin only)
router.post('/:id/questions', requireAdmin, async (req, res) => {
  try {
    const { question_id, question_order } = req.body;

    if (!question_id) {
      return res.status(400).json({ error: 'Question ID is required' });
    }

    const testQuestion = new TestQuestion({
      test_id: req.params.id,
      question_id,
      question_order: question_order || 0,
    });

    await testQuestion.save();
    await testQuestion.populate('question_id');
    res.status(201).json(testQuestion);
  } catch (error) {
    console.error('Add question to test error:', error);
    res.status(500).json({ error: 'Failed to add question to test' });
  }
});

// Get test questions
router.get('/:id/questions', async (req, res) => {
  try {
    const testQuestions = await TestQuestion.find({ test_id: req.params.id })
      .populate({
        path: 'question_id',
        populate: [
          { path: 'category_id' },
          { path: 'subject_id' }
        ]
      })
      .sort({ question_order: 1 });

    res.json(testQuestions.map(tq => ({
      question_id: tq.question_id,
      question_order: tq.question_order,
      _id: tq._id,
    })));
  } catch (error) {
    console.error('Get test questions error:', error);
    res.status(500).json({ error: 'Failed to fetch test questions' });
  }
});

// Remove question from test (admin only)
router.delete('/:id/questions/:questionId', requireAdmin, async (req, res) => {
  try {
    const { id, questionId } = req.params;
    
    const result = await TestQuestion.deleteOne({
      test_id: id,
      question_id: questionId,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Question not found in test' });
    }

    res.json({ message: 'Question removed from test successfully' });
  } catch (error) {
    console.error('Remove question from test error:', error);
    res.status(500).json({ error: 'Failed to remove question from test' });
  }
});

// Bulk assign questions (admin only)
router.post('/:id/questions/bulk', requireAdmin, async (req, res) => {
  try {
    const { question_ids } = req.body;
    
    if (!Array.isArray(question_ids) || question_ids.length === 0) {
      return res.status(400).json({ error: 'Question IDs array is required' });
    }

    const testQuestions = question_ids.map((questionId, index) => ({
      test_id: req.params.id,
      question_id: questionId,
      question_order: index + 1,
    }));

    await TestQuestion.insertMany(testQuestions);
    res.json({ message: `${question_ids.length} questions assigned successfully` });
  } catch (error) {
    console.error('Bulk assign questions error:', error);
    res.status(500).json({ error: 'Failed to bulk assign questions' });
  }
});

// Generate tests with topics and 100+ questions (admin only)
router.post('/generate/with-topics', requireAdmin, async (req, res) => {
  try {
    const { testCount = 10, questionsPerTest = 100 } = req.body;

    // Get categories, subjects, and topics
    const categories = await Category.find().limit(5);
    if (categories.length === 0) {
      return res.status(400).json({ error: 'No categories found. Please create categories first.' });
    }

    const subjects = await Subject.find().populate('category_id');
    if (subjects.length === 0) {
      return res.status(400).json({ error: 'No subjects found. Please create subjects first.' });
    }

    const createdTests = [];
    const allQuestions = [];
    const createdTopics = [];
    const createdLevels = [];

    // Step 1: Create topics for each subject (if they don't exist)
    const commonTopics = [
      'Algebra', 'Trigonometry', 'Geometry', 'Mensuration', 'Number System',
      'Profit & Loss', 'Percentage', 'Ratio & Proportion', 'Time & Work', 'Time & Distance',
      'Simple Interest', 'Compound Interest', 'Average', 'LCM & HCF', 'Square & Cube',
      'Verbal Reasoning', 'Non-Verbal Reasoning', 'Analytical Reasoning', 'Logical Reasoning',
      'Grammar', 'Vocabulary', 'Comprehension', 'Synonyms & Antonyms', 'Idioms & Phrases',
      'History', 'Geography', 'Polity', 'Economics', 'Science & Technology',
      'Current Affairs', 'General Knowledge', 'Static GK'
    ];

    for (const subject of subjects) {
      const subjectId = subject._id || subject.id;
      const categoryId = typeof subject.category_id === 'object'
        ? (subject.category_id._id || subject.category_id.id)
        : subject.category_id;

      // Get existing topics for this subject
      const existingTopics = await Topic.find({ subject_id: subjectId });
      
      // Create 3-5 topics per subject if they don't exist
      const topicsToCreate = Math.max(0, 5 - existingTopics.length);
      
      for (let i = 0; i < topicsToCreate; i++) {
        const topicName = commonTopics[Math.floor(Math.random() * commonTopics.length)];
        
        // Check if this topic already exists for this subject
        const topicExists = existingTopics.some(t => t.name === topicName || t.name.includes(topicName));
        if (topicExists) continue;

        try {
          const newTopic = new Topic({
            name: `${topicName} - ${subject.name}`,
            description: `${topicName} topic for ${subject.name}`,
            subject_id: subjectId,
          });
          await newTopic.save();
          createdTopics.push(newTopic);
          console.log(`✅ Created topic: ${newTopic.name} for subject: ${subject.name}`);
        } catch (error) {
          console.log(`Topic ${topicName} might already exist, skipping...`);
        }
      }
    }

    // Get all topics (existing + newly created)
    const allTopics = await Topic.find().populate('subject_id');
    console.log(`Total topics available: ${allTopics.length}`);

    // Step 2: Create levels 1-10 for each topic and distribute questions
    for (const topic of allTopics) {
      const topicId = topic._id;
      const subjectId = typeof topic.subject_id === 'object' 
        ? topic.subject_id._id || topic.subject_id.id
        : topic.subject_id;
      
      const subject = subjects.find(s => {
        const sId = s._id || s.id;
        const tSubId = typeof topic.subject_id === 'object'
          ? (topic.subject_id._id || topic.subject_id.id)
          : topic.subject_id;
        return sId?.toString() === tSubId?.toString();
      });
      
      if (!subject) continue;

      const categoryId = typeof subject.category_id === 'object'
        ? (subject.category_id._id || subject.category_id.id)
        : subject.category_id;

      // Create levels 1-10 for this topic if they don't exist
      const existingLevels = await Level.find({ topic_id: topicId });
      const questionsPerLevel = 100; // 100 questions per level

      for (let levelNum = 1; levelNum <= 10; levelNum++) {
        let level = existingLevels.find(l => l.level_number === levelNum);
        
        if (!level) {
          try {
            level = new Level({
              level_number: levelNum,
              topic_id: topicId,
              subject_id: subjectId,
              category_id: categoryId,
              name: `Level ${levelNum} - ${topic.name}`,
              description: `Level ${levelNum} practice questions for ${topic.name}`,
              total_questions: 1000,
              skip_test_questions: 30,
              skip_test_pass_percentage: 80,
              is_active: true,
            });
            await level.save();
            createdLevels.push(level);
            console.log(`✅ Created Level ${levelNum} for topic: ${topic.name}`);
          } catch (error) {
            // Level might already exist, try to find it
            level = await Level.findOne({ topic_id: topicId, level_number: levelNum });
            if (!level) continue;
          }
        }

        // Check existing questions for this topic and level
        const existingQuestionsForLevel = await Question.find({
          $or: [
            { topic_id: topicId },
            { topic_ids: topicId }
          ],
          difficulty_level: levelNum
        });

        // Always create 100 questions per level (if less than 100 exist)
        const questionsNeeded = Math.max(0, questionsPerLevel - existingQuestionsForLevel.length);
        
        if (questionsNeeded > 0) {
          console.log(`Creating ${questionsNeeded} questions for Level ${levelNum} of topic: ${topic.name} (${existingQuestionsForLevel.length} already exist)`);
          
          for (let i = 1; i <= questionsNeeded; i++) {
            const correctAnswer = Math.floor(Math.random() * 4);
            const difficultyLevel = levelNum; // Level number determines difficulty (1-10)
            const questionNum = existingQuestionsForLevel.length + i;
            
            const question = new Question({
              question_text: `${topic.name} - Level ${levelNum} - Question ${questionNum}: What is the solution to problem ${questionNum} in ${topic.name}?`,
              option_a: `Option A for Level ${levelNum} - ${topic.name} question ${questionNum}`,
              option_b: `Option B for Level ${levelNum} - ${topic.name} question ${questionNum}`,
              option_c: `Option C for Level ${levelNum} - ${topic.name} question ${questionNum}`,
              option_d: `Option D for Level ${levelNum} - ${topic.name} question ${questionNum}`,
              correct_answer: correctAnswer,
              explanation: `This is the explanation for Level ${levelNum} question ${questionNum} in ${topic.name}. The correct answer is ${String.fromCharCode(65 + correctAnswer)}. This question tests your understanding of ${topic.name} concepts at Level ${levelNum}.`,
              category_id: categoryId,
              subject_id: subjectId,
              topic_id: topicId,
              category_ids: categoryId ? [categoryId] : [],
              subject_ids: subjectId ? [subjectId] : [],
              topic_ids: [topicId],
              difficulty_level: difficultyLevel,
              time_duration: 60,
              question_reference: `L${levelNum}-${topic.name.toUpperCase().replace(/\s+/g, '-')}-${questionNum}`,
              exam_names: subject.category_id?.name ? [subject.category_id.name] : [],
            });

            await question.save();
            allQuestions.push(question);
          }
        } else {
          console.log(`✅ Level ${levelNum} of topic ${topic.name} already has ${existingQuestionsForLevel.length} questions`);
        }
      }
    }

    // Step 3: Get all questions for tests
    const allAvailableQuestions = await Question.find({
      $or: [
        { topic_id: { $in: allTopics.map(t => t._id) } },
        { topic_ids: { $in: allTopics.map(t => t._id) } }
      ]
    });

    // Step 4: Create tests with 100+ questions
    const testNames = [
      'SSC CGL Tier 1 - Full Mock Test',
      'SSC CGL Tier 1 - Mathematics Focus',
      'SSC CGL Tier 1 - Reasoning Focus',
      'SSC CGL Tier 1 - English Focus',
      'SSC CGL Tier 1 - GK Focus',
      'UPSC Prelims - Full Mock Test',
      'UPSC Prelims - History Focus',
      'UPSC Prelims - Geography Focus',
      'Bank PO - Full Mock Test',
      'Bank PO - Quantitative Aptitude',
      'SSC CHSL - Full Mock Test',
      'SSC MTS - Full Mock Test',
      'Railway NTPC - Full Mock Test',
      'IBPS PO - Full Mock Test',
      'SBI PO - Full Mock Test',
    ];

    for (let i = 0; i < testCount && i < testNames.length; i++) {
      // Find a suitable category and subject
      const category = categories[Math.floor(Math.random() * categories.length)];
      const categorySubjects = subjects.filter(s => {
        const subCatId = typeof s.category_id === 'object'
          ? (s.category_id._id || s.category_id.id)
          : s.category_id;
        return subCatId?.toString() === category._id.toString();
      });

      if (categorySubjects.length === 0) continue;

      const subject = categorySubjects[Math.floor(Math.random() * categorySubjects.length)];
      const subjectTopics = allTopics.filter(t => {
        const tSubId = typeof t.subject_id === 'object'
          ? (t.subject_id._id || t.subject_id.id)
          : t.subject_id;
        return tSubId?.toString() === subject._id.toString();
      });

      if (subjectTopics.length === 0) continue;

      // Get questions from these topics
      const topicIds = subjectTopics.map(t => t._id);
      const availableQuestions = allAvailableQuestions.filter(q => {
        const qTopicId = q.topic_id?.toString();
        const qTopicIds = (q.topic_ids || []).map((tid) => tid?.toString());
        return (qTopicId && topicIds.some(tid => tid.toString() === qTopicId)) ||
               qTopicIds.some(tid => topicIds.some(t => t.toString() === tid));
      });

      if (availableQuestions.length < questionsPerTest) {
        console.log(`⚠️ Not enough questions for ${testNames[i]}. Available: ${availableQuestions.length}, Required: ${questionsPerTest}`);
        continue;
      }

      // Select random questions
      const selectedQuestions = availableQuestions
        .sort(() => Math.random() - 0.5)
        .slice(0, questionsPerTest);

      // Create test
      const test = new Test({
        name: testNames[i],
        description: `Comprehensive ${testNames[i]} with ${questionsPerTest} questions covering multiple topics.`,
        category_id: category._id,
        subject_id: subject._id,
        duration_minutes: Math.ceil(questionsPerTest * 1.2), // 1.2 minutes per question
        total_marks: questionsPerTest,
        total_questions: questionsPerTest,
        negative_marking: true,
        negative_marks_per_question: 0.25,
        test_type: 'static',
        status: 'published',
        is_active: true,
        created_by: req.user._id,
        difficulty_distribution: {
          easy: Math.floor(questionsPerTest * 0.3),
          medium: Math.floor(questionsPerTest * 0.5),
          hard: Math.floor(questionsPerTest * 0.2),
        },
      });

      await test.save();

      // Assign questions to test
      const testQuestions = selectedQuestions.map((question, index) => ({
        test_id: test._id,
        question_id: question._id,
        question_order: index + 1,
      }));

      await TestQuestion.insertMany(testQuestions);
      createdTests.push({
        id: test._id,
        name: test.name,
        questions: questionsPerTest,
      });

      console.log(`✅ Created test: ${testNames[i]} with ${questionsPerTest} questions`);
    }

    res.json({
      success: true,
      message: `Successfully created ${createdTests.length} tests with ${questionsPerTest}+ questions each`,
      tests: createdTests,
      totalQuestionsCreated: allQuestions.length,
      topicsCreated: createdTopics.length,
      levelsCreated: createdLevels.length,
      summary: {
        tests: createdTests.length,
        questions: allQuestions.length,
        topics: createdTopics.length,
        levels: createdLevels.length,
      }
    });
  } catch (error) {
    console.error('Generate tests with topics error:', error);
    res.status(500).json({ error: 'Failed to generate tests with topics' });
  }
});

// Add questions to existing topics and levels (admin only)
router.post('/add-questions-to-topics', requireAdmin, async (req, res) => {
  try {
    const { categoryName = 'SSC', questionsPerLevel = 100 } = req.body;

    // Find category by name (case insensitive)
    const category = await Category.findOne({ 
      name: { $regex: new RegExp(categoryName, 'i') } 
    });
    
    if (!category) {
      return res.status(400).json({ error: `Category "${categoryName}" not found. Please create it first.` });
    }

    // Get all subjects for this category
    const subjects = await Subject.find({ category_id: category._id }).populate('category_id');
    if (subjects.length === 0) {
      return res.status(400).json({ error: `No subjects found for category "${categoryName}". Please create subjects first.` });
    }

    console.log(`Found ${subjects.length} subjects for category: ${categoryName}`);

    // Get all topics for these subjects
    const allTopics = await Topic.find({ 
      subject_id: { $in: subjects.map(s => s._id) } 
    }).populate('subject_id');

    if (allTopics.length === 0) {
      return res.status(400).json({ error: `No topics found for category "${categoryName}". Please create topics first.` });
    }

    console.log(`Found ${allTopics.length} topics for category: ${categoryName}`);

    const createdQuestions = [];
    const createdLevels = [];

    // Process each topic
    for (const topic of allTopics) {
      const topicId = topic._id;
      const subjectId = typeof topic.subject_id === 'object' 
        ? topic.subject_id._id || topic.subject_id.id
        : topic.subject_id;
      
      const subject = subjects.find(s => {
        const sId = s._id || s.id;
        return sId?.toString() === subjectId?.toString();
      });
      
      if (!subject) continue;

      const categoryId = category._id;

      // Ensure levels 1-10 exist for this topic
      for (let levelNum = 1; levelNum <= 10; levelNum++) {
        let level = await Level.findOne({ topic_id: topicId, level_number: levelNum });
        
        if (!level) {
          try {
            level = new Level({
              level_number: levelNum,
              topic_id: topicId,
              subject_id: subjectId,
              category_id: categoryId,
              name: `Level ${levelNum} - ${topic.name}`,
              description: `Level ${levelNum} practice questions for ${topic.name}`,
              total_questions: 1000,
              skip_test_questions: 30,
              skip_test_pass_percentage: 80,
              is_active: true,
            });
            await level.save();
            createdLevels.push(level);
            console.log(`✅ Created Level ${levelNum} for topic: ${topic.name}`);
          } catch (error) {
            console.log(`Level ${levelNum} might already exist for topic ${topic.name}, skipping creation...`);
            level = await Level.findOne({ topic_id: topicId, level_number: levelNum });
            if (!level) continue;
          }
        }

        // Check existing questions for this topic and level
        const existingQuestionsForLevel = await Question.find({
          $or: [
            { topic_id: topicId },
            { topic_ids: topicId }
          ],
          difficulty_level: levelNum
        });

        // Create questions for this level (always ensure 100 questions per level)
        const questionsNeeded = Math.max(0, questionsPerLevel - existingQuestionsForLevel.length);
        
        if (questionsNeeded > 0) {
          console.log(`Creating ${questionsNeeded} questions for Level ${levelNum} of topic: ${topic.name} (${existingQuestionsForLevel.length} already exist)`);
          
          for (let i = 1; i <= questionsNeeded; i++) {
            const correctAnswer = Math.floor(Math.random() * 4);
            const difficultyLevel = levelNum;
            const questionNum = existingQuestionsForLevel.length + i;
            
            const question = new Question({
              question_text: `${topic.name} - Level ${levelNum} - Question ${questionNum}: What is the solution to problem ${questionNum} in ${topic.name}?`,
              option_a: `Option A for Level ${levelNum} - ${topic.name} question ${questionNum}`,
              option_b: `Option B for Level ${levelNum} - ${topic.name} question ${questionNum}`,
              option_c: `Option C for Level ${levelNum} - ${topic.name} question ${questionNum}`,
              option_d: `Option D for Level ${levelNum} - ${topic.name} question ${questionNum}`,
              correct_answer: correctAnswer,
              explanation: `This is the explanation for Level ${levelNum} question ${questionNum} in ${topic.name}. The correct answer is ${String.fromCharCode(65 + correctAnswer)}. This question tests your understanding of ${topic.name} concepts at Level ${levelNum}.`,
              category_id: categoryId,
              subject_id: subjectId,
              topic_id: topicId,
              category_ids: categoryId ? [categoryId] : [],
              subject_ids: subjectId ? [subjectId] : [],
              topic_ids: [topicId],
              difficulty_level: difficultyLevel,
              time_duration: 60,
              question_reference: `L${levelNum}-${topic.name.toUpperCase().replace(/\s+/g, '-')}-${questionNum}`,
              exam_names: category.name ? [category.name] : [],
            });

            await question.save();
            createdQuestions.push(question);
          }
        } else {
          console.log(`✅ Level ${levelNum} of topic ${topic.name} already has ${existingQuestionsForLevel.length} questions`);
        }
      }
    }

    res.json({
      success: true,
      message: `Successfully added questions to topics and levels for category "${categoryName}"`,
      summary: {
        category: categoryName,
        subjects: subjects.length,
        topics: allTopics.length,
        levelsCreated: createdLevels.length,
        questionsCreated: createdQuestions.length,
        questionsPerLevel: questionsPerLevel,
      }
    });
  } catch (error) {
    console.error('Add questions to topics error:', error);
    res.status(500).json({ error: 'Failed to add questions to topics' });
  }
});

export default router;

