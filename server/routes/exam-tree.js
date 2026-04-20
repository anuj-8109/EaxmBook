import express from 'express';
import Category from '../models/Category.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Test from '../models/Test.js';
import Question from '../models/Question.js';
import TestQuestion from '../models/TestQuestion.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Recursive function to build category tree with nested structure
async function buildCategoryTree(categoryId, includeDetails = true) {
  // Get child categories
  const childCategories = await Category.find({ parent_id: categoryId }).sort({ order: 1, name: 1 });
  
  // Build children recursively
  const children = await Promise.all(
    childCategories.map(async (child) => {
      return await buildCategoryTree(child._id, includeDetails);
    })
  );

  // Get current category
  const category = await Category.findById(categoryId);
  if (!category) return null;

  const result = {
    examName: category.name,
    examId: category._id.toString(),
    description: category.description || null,
    icon: category.icon || '📚',
    children: children.filter(c => c !== null),
    subjectCount: 0,
    subjects: [],
  };

  // Only get subjects/topics/tests for leaf categories (categories without children)
  if (includeDetails && children.length === 0) {
    const subjects = await Subject.find({ category_id: category._id }).sort({ name: 1 });
    
    // Build subjects with topics and tests
    const subjectsWithDetails = await Promise.all(
      subjects.map(async (subject) => {
        // Get topics for this subject
        const topics = await Topic.find({ subject_id: subject._id }).sort({ name: 1 });

        // Get questions for each topic
        const topicsWithQuestions = await Promise.all(
          topics.map(async (topic) => {
            const questions = await Question.find({
              $or: [
                { topic_id: topic._id },
                { topic_ids: topic._id }
              ]
            })
              .select('question_text correct_answer difficulty difficulty_level _id')
              .limit(50)
              .sort({ created_at: -1 });

            return {
              topicId: topic._id.toString(),
              topicName: topic.name,
              description: topic.description || null,
              questionCount: await Question.countDocuments({
                $or: [
                  { topic_id: topic._id },
                  { topic_ids: topic._id }
                ]
              }),
              questions: questions.map(q => ({
                id: q._id.toString(),
                questionText: q.question_text?.substring(0, 100) + (q.question_text?.length > 100 ? '...' : ''),
                difficulty: q.difficulty || 'medium',
                difficultyLevel: q.difficulty_level || 5,
              }))
            };
          })
        );

        // Get tests for this subject
        const tests = await Test.find({ subject_id: subject._id }).sort({ name: 1 });

        // Get questions for each test
        const testsWithQuestions = await Promise.all(
          tests.map(async (test) => {
            const testQuestions = await TestQuestion.find({ test_id: test._id })
              .populate({
                path: 'question_id',
                select: 'question_text correct_answer difficulty difficulty_level _id'
              })
              .sort({ question_order: 1 })
              .limit(50);

            const questions = testQuestions
              .map(tq => tq.question_id)
              .filter(q => q !== null);

            return {
              testId: test._id.toString(),
              testName: test.name,
              description: test.description || null,
              durationMinutes: test.duration_minutes,
              totalMarks: test.total_marks,
              totalQuestions: test.total_questions || 0,
              questionCount: await TestQuestion.countDocuments({ test_id: test._id }),
              isActive: test.is_active,
              questions: questions.map(q => ({
                id: q._id.toString(),
                questionText: q.question_text?.substring(0, 100) + (q.question_text?.length > 100 ? '...' : ''),
                difficulty: q.difficulty || 'medium',
                difficultyLevel: q.difficulty_level || 5,
              }))
            };
          })
        );

        return {
          subjectId: subject._id.toString(),
          subjectName: subject.name,
          description: subject.description || null,
          topics: topicsWithQuestions,
          tests: testsWithQuestions,
          topicCount: topics.length,
          testCount: tests.length,
        };
      })
    );

    result.subjects = subjectsWithDetails;
    result.subjectCount = subjects.length;
  }

  return result;
}

// GET /exam-tree - Get full hierarchy using MongoDB aggregation
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Get root categories (categories without parent)
    const rootCategories = await Category.find({ parent_id: null }).sort({ order: 1, name: 1 });

    // Build the full tree structure recursively
    const examTree = await Promise.all(
      rootCategories.map(async (category) => {
        return await buildCategoryTree(category._id, true);
      })
    );

    res.json(examTree.filter(item => item !== null));
  } catch (error) {
    console.error('Get exam tree error:', error);
    res.status(500).json({ error: 'Failed to fetch exam tree', message: error.message });
  }
});

export default router;

