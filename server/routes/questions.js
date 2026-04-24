import express from 'express';
import Question from '../models/Question.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all questions with advanced filtering
router.get('/', async (req, res) => {
  try {
    const { 
      category_id, 
      subject_id, 
      topic_id,
      difficulty, 
      difficulty_level,
      exam_name,
      question_reference,
      time_duration,
      category_ids,
      subject_ids,
      topic_ids,
      exam_names,
      page = 1,
      limit = 50
    } = req.query;
    
    const query = {};
    
    // Single select filters (backward compatibility)
    if (category_id) query.category_id = category_id;
    if (subject_id) query.subject_id = subject_id;
    if (topic_id) query.topic_id = topic_id;
    if (difficulty) query.difficulty = difficulty;
    if (difficulty_level) query.difficulty_level = parseInt(difficulty_level);
    if (time_duration) query.time_duration = parseInt(time_duration);
    if (question_reference) query.question_reference = { $regex: question_reference, $options: 'i' };
    
    // Multi-select filters
    if (category_ids) {
      const ids = Array.isArray(category_ids) ? category_ids : [category_ids];
      query.$or = [
        { category_id: { $in: ids } },
        { category_ids: { $in: ids } }
      ];
    }
    if (subject_ids) {
      const ids = Array.isArray(subject_ids) ? subject_ids : [subject_ids];
      query.$or = [
        ...(query.$or || []),
        { subject_id: { $in: ids } },
        { subject_ids: { $in: ids } }
      ];
    }
    if (topic_ids) {
      const ids = Array.isArray(topic_ids) ? topic_ids : [topic_ids];
      query.$or = [
        ...(query.$or || []),
        { topic_id: { $in: ids } },
        { topic_ids: { $in: ids } }
      ];
    }
    if (exam_names) {
      const names = Array.isArray(exam_names) ? exam_names : [exam_names];
      query.exam_names = { $in: names };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const questions = await Question.find(query)
      .populate('category_id')
      .populate('subject_id')
      .populate('topic_id')
      .populate('category_ids')
      .populate('subject_ids')
      .populate('topic_ids')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Question.countDocuments(query);
    
    res.json({ questions, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// Get single question
router.get('/:id', async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate('category_id')
      .populate('subject_id');
    
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    res.json(question);
  } catch (error) {
    console.error('Get question error:', error);
    res.status(500).json({ error: 'Failed to fetch question' });
  }
});

// Create question (admin only) - Enhanced with all new fields
router.post('/', requireAdmin, async (req, res) => {
  try {
    const {
      // Question text (multi-language)
      question_text,
      question_text_hindi,
      // Options (5 options with Hindi support)
      option_a, option_a_hindi,
      option_b, option_b_hindi,
      option_c, option_c_hindi,
      option_d, option_d_hindi,
      option_x, option_x_hindi,
      // Answer type and correct answers
      answer_type,
      correct_answer,
      correct_answers,
      // Hint and explanation
      hint, hint_hindi,
      explanation, explanation_hindi,
      // Media URLs
      question_image_url, question_video_url,
      option_a_image_url, option_b_image_url,
      option_c_image_url, option_d_image_url,
      option_x_image_url,
      hint_image_url, explanation_image_url,
      // Multi-select fields
      exam_names,
      category_ids,
      subject_ids,
      topic_ids,
      // Single select (backward compatibility)
      category_id,
      subject_id,
      topic_id,
      // Enhanced fields
      difficulty_level,
      time_duration,
      question_reference,
      // Legacy fields
      difficulty,
      image_url,
    } = req.body;

    // Helper function to check if a string is not empty
    const isNotEmpty = (str) => str && typeof str === 'string' && str.trim().length > 0;
    
    // Validate that at least English or Hindi question text is provided
    if (!isNotEmpty(question_text) && !isNotEmpty(question_text_hindi)) {
      return res.status(400).json({ error: 'Question text is required in English or Hindi (or both)' });
    }
    
    // Validate that at least English or Hindi options are provided
    const hasEnglishOptions = isNotEmpty(option_a) || isNotEmpty(option_b) || 
                              isNotEmpty(option_c) || isNotEmpty(option_d);
    const hasHindiOptions = isNotEmpty(option_a_hindi) || isNotEmpty(option_b_hindi) || 
                            isNotEmpty(option_c_hindi) || isNotEmpty(option_d_hindi);
    
    if (!hasEnglishOptions && !hasHindiOptions) {
      return res.status(400).json({ error: 'At least one option is required in English or Hindi' });
    }
    
    // If English options are provided, all 4 should be filled
    if (hasEnglishOptions) {
      if (!isNotEmpty(option_a) || !isNotEmpty(option_b) || 
          !isNotEmpty(option_c) || !isNotEmpty(option_d)) {
        return res.status(400).json({ error: 'All 4 options (A, B, C, D) must be filled in English' });
      }
    }
    
    // If Hindi options are provided, all 4 should be filled
    if (hasHindiOptions) {
      if (!isNotEmpty(option_a_hindi) || !isNotEmpty(option_b_hindi) || 
          !isNotEmpty(option_c_hindi) || !isNotEmpty(option_d_hindi)) {
        return res.status(400).json({ error: 'All 4 options (A, B, C, D) must be filled in Hindi' });
      }
    }
    
    // Validate based on answer_type
    const finalAnswerType = answer_type || 'single';
    
    if (finalAnswerType === 'single') {
      if (correct_answer === undefined || correct_answer === null) {
        return res.status(400).json({ error: 'Correct answer is required for single answer type' });
      }
    } else if (finalAnswerType === 'multiple') {
      if (!correct_answers || !Array.isArray(correct_answers) || correct_answers.length === 0) {
        return res.status(400).json({ error: 'At least one correct answer is required for multiple answer type' });
      }
    }
    // 'none' answer type doesn't require any correct answer

    if (difficulty_level === undefined || difficulty_level < 1 || difficulty_level > 10) {
      return res.status(400).json({ error: 'Difficulty level (1-10) is required' });
    }

    // Helper to convert empty strings to null
    const toNullIfEmpty = (val) => (val && isNotEmpty(val)) ? val : null;
    
    // For schema compatibility: if only Hindi is provided, use Hindi values for required English fields
    // This allows Hindi-only questions while satisfying schema requirements
    const finalQuestionText = isNotEmpty(question_text) ? question_text : 
                             (isNotEmpty(question_text_hindi) ? question_text_hindi : '');
    const finalOptionA = isNotEmpty(option_a) ? option_a : 
                        (isNotEmpty(option_a_hindi) ? option_a_hindi : '');
    const finalOptionB = isNotEmpty(option_b) ? option_b : 
                        (isNotEmpty(option_b_hindi) ? option_b_hindi : '');
    const finalOptionC = isNotEmpty(option_c) ? option_c : 
                        (isNotEmpty(option_c_hindi) ? option_c_hindi : '');
    const finalOptionD = isNotEmpty(option_d) ? option_d : 
                        (isNotEmpty(option_d_hindi) ? option_d_hindi : '');
    
    const question = new Question({
      question_text: finalQuestionText,
      question_text_hindi: toNullIfEmpty(question_text_hindi),
      option_a: finalOptionA,
      option_a_hindi: toNullIfEmpty(option_a_hindi),
      option_b: finalOptionB,
      option_b_hindi: toNullIfEmpty(option_b_hindi),
      option_c: finalOptionC,
      option_c_hindi: toNullIfEmpty(option_c_hindi),
      option_d: finalOptionD,
      option_d_hindi: toNullIfEmpty(option_d_hindi),
      option_x: toNullIfEmpty(option_x),
      option_x_hindi: toNullIfEmpty(option_x_hindi),
      answer_type: finalAnswerType,
      correct_answer: finalAnswerType === 'single' ? correct_answer : null,
      correct_answers: finalAnswerType === 'multiple' ? (correct_answers || []) : [],
      hint: toNullIfEmpty(hint),
      hint_hindi: toNullIfEmpty(hint_hindi),
      explanation: toNullIfEmpty(explanation),
      explanation_hindi: toNullIfEmpty(explanation_hindi),
      question_image_url: toNullIfEmpty(question_image_url),
      question_video_url: toNullIfEmpty(question_video_url),
      option_a_image_url: toNullIfEmpty(option_a_image_url),
      option_b_image_url: toNullIfEmpty(option_b_image_url),
      option_c_image_url: toNullIfEmpty(option_c_image_url),
      option_d_image_url: toNullIfEmpty(option_d_image_url),
      option_x_image_url: toNullIfEmpty(option_x_image_url),
      hint_image_url: toNullIfEmpty(hint_image_url),
      explanation_image_url: toNullIfEmpty(explanation_image_url),
      exam_names: exam_names || [],
      category_ids: category_ids || [],
      subject_ids: subject_ids || [],
      topic_ids: topic_ids || [],
      category_id: category_id || null,
      subject_id: subject_id || null,
      topic_id: topic_id || null,
      difficulty_level: difficulty_level || 5,
      time_duration: time_duration || null,
      question_reference: toNullIfEmpty(question_reference),
      difficulty: difficulty || 'medium',
      image_url: toNullIfEmpty(image_url),
      created_by: req.user._id,
    });

    await question.save();
    await question.populate('category_id');
    await question.populate('subject_id');
    await question.populate('topic_id');
    await question.populate('category_ids');
    await question.populate('subject_ids');
    await question.populate('topic_ids');
    res.status(201).json(question);
  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({ error: 'Failed to create question', details: error.message });
  }
});

// Bulk create questions (admin only)
router.post('/bulk', requireAdmin, async (req, res) => {
  try {
    const { questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'Questions array is required' });
    }

    const validQuestions = [];
    const errors = [];

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      
      // Validate required fields
      if (!q.question_text || !q.option_a || !q.option_b || !q.option_c || !q.option_d || q.correct_answer === undefined) {
        errors.push(`Row ${i + 1}: Missing required fields`);
        continue;
      }

      if (q.difficulty_level === undefined || q.difficulty_level < 1 || q.difficulty_level > 10) {
        errors.push(`Row ${i + 1}: Invalid difficulty level (must be 1-10)`);
        continue;
      }

      validQuestions.push({
        question_text: q.question_text,
        question_text_hindi: q.question_text_hindi || '',
        option_a: q.option_a,
        option_a_hindi: q.option_a_hindi || '',
        option_b: q.option_b,
        option_b_hindi: q.option_b_hindi || '',
        option_c: q.option_c,
        option_c_hindi: q.option_c_hindi || '',
        option_d: q.option_d,
        option_d_hindi: q.option_d_hindi || '',
        option_x: q.option_x || '',
        option_x_hindi: q.option_x_hindi || '',
        correct_answer: q.correct_answer,
        hint: q.hint || '',
        hint_hindi: q.hint_hindi || '',
        explanation: q.explanation || '',
        explanation_hindi: q.explanation_hindi || '',
        exam_names: Array.isArray(q.exam_names) ? q.exam_names : (q.exam_names ? [q.exam_names] : []),
        category_ids: Array.isArray(q.category_ids) ? q.category_ids : (q.category_ids ? [q.category_ids] : []),
        subject_ids: Array.isArray(q.subject_ids) ? q.subject_ids : (q.subject_ids ? [q.subject_ids] : []),
        topic_ids: Array.isArray(q.topic_ids) ? q.topic_ids : (q.topic_ids ? [q.topic_ids] : []),
        category_id: q.category_id || null,
        subject_id: q.subject_id || null,
        topic_id: q.topic_id || null,
        difficulty_level: q.difficulty_level || 5,
        time_duration: q.time_duration || null,
        question_reference: q.question_reference || '',
        created_by: req.user._id,
      });
    }

    if (validQuestions.length === 0) {
      return res.status(400).json({ 
        error: 'No valid questions to create',
        errors 
      });
    }

    const createdQuestions = await Question.insertMany(validQuestions);
    
    res.status(201).json({
      success: true,
      created: createdQuestions.length,
      total: questions.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Bulk create questions error:', error);
    res.status(500).json({ error: error.message || 'Failed to create questions in bulk' });
  }
});

// Update question (admin only)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const {
      question_text,
      question_text_hindi,
      option_a, option_a_hindi,
      option_b, option_b_hindi,
      option_c, option_c_hindi,
      option_d, option_d_hindi,
      option_x, option_x_hindi,
      answer_type,
      correct_answer,
      correct_answers,
      hint, hint_hindi,
      explanation,
      explanation_hindi,
      image_url,
      difficulty,
      difficulty_level,
      category_id,
      subject_id,
      topic_id,
      category_ids,
      subject_ids,
      topic_ids,
      exam_names,
      time_duration,
      question_reference,
    } = req.body;

    // Helper function to check if a string is not empty
    const isNotEmpty = (str) => str && typeof str === 'string' && str.trim().length > 0;

    // For schema compatibility: if English is empty but Hindi is provided, use Hindi for required fields
    const finalQuestionText = isNotEmpty(question_text) ? question_text : 
                             (isNotEmpty(question_text_hindi) ? question_text_hindi : '');
    const finalOptionA = isNotEmpty(option_a) ? option_a : 
                        (isNotEmpty(option_a_hindi) ? option_a_hindi : '');
    const finalOptionB = isNotEmpty(option_b) ? option_b : 
                        (isNotEmpty(option_b_hindi) ? option_b_hindi : '');
    const finalOptionC = isNotEmpty(option_c) ? option_c : 
                        (isNotEmpty(option_c_hindi) ? option_c_hindi : '');
    const finalOptionD = isNotEmpty(option_d) ? option_d : 
                        (isNotEmpty(option_d_hindi) ? option_d_hindi : '');

    // Handle answer_type logic
    const finalAnswerType = answer_type || 'single';
    const updateData = {
      question_text: finalQuestionText,
      question_text_hindi,
      option_a: finalOptionA,
      option_a_hindi,
      option_b: finalOptionB,
      option_b_hindi,
      option_c: finalOptionC,
      option_c_hindi,
      option_d: finalOptionD,
      option_d_hindi,
      option_x,
      option_x_hindi,
      answer_type: finalAnswerType,
      hint,
      hint_hindi,
      explanation,
      explanation_hindi,
      image_url,
      difficulty,
      difficulty_level,
      category_id,
      subject_id,
      topic_id,
      category_ids,
      subject_ids,
      topic_ids,
      exam_names,
      time_duration,
      question_reference,
      updated_at: Date.now(),
    };

    // Handle correct_answer and correct_answers based on answer_type
    if (finalAnswerType === 'single') {
      updateData.correct_answer = correct_answer;
      updateData.correct_answers = [];
    } else if (finalAnswerType === 'multiple') {
      updateData.correct_answer = null;
      updateData.correct_answers = correct_answers || [];
    } else {
      // 'none' type
      updateData.correct_answer = null;
      updateData.correct_answers = [];
    }

    // Fetch the question first to properly handle validation
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Update all fields
    Object.assign(question, updateData);

    // Save with validation (this properly handles 'this' context in schema validators)
    await question.save();

    await question.populate('category_id');
    await question.populate('subject_id');
    res.json(question);
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ error: 'Failed to update question' });
  }
});

// Batch delete questions (admin only) - MUST be before /:id route
router.delete('/batch', requireAdmin, async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'IDs array is required' });
    }

    const result = await Question.deleteMany({ _id: { $in: ids } });

    res.json({
      message: 'Questions deleted successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Batch delete questions error:', error);
    res.status(500).json({ error: 'Failed to delete questions' });
  }
});

// Delete question (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

// Find duplicate questions (90%+ match)
router.get('/duplicates/check', requireAdmin, async (req, res) => {
  try {
    const questions = await Question.find({}).select('question_text question_text_hindi option_a option_b option_c option_d correct_answer exam_names difficulty_level');
    
    const normalizeText = (text) => {
      if (!text) return '';
      return text
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s]/g, '')
        .trim();
    };
    
    const duplicateGroups = [];
    const processed = new Set();
    
    for (let i = 0; i < questions.length; i++) {
      const q1 = questions[i];
      const id1 = q1._id.toString();
      
      if (processed.has(id1)) continue;
      
      const normalized1 = normalizeText(q1.question_text || '');
      if (!normalized1) continue;
      
      const group = [q1];
      let maxSimilarity = 100;
      
      for (let j = i + 1; j < questions.length; j++) {
        const q2 = questions[j];
        const id2 = q2._id.toString();
        
        if (processed.has(id2) || id1 === id2) continue;
        
        const normalized2 = normalizeText(q2.question_text || '');
        if (!normalized2) continue;
        
        // Check for exact match (normalized)
        if (normalized1 === normalized2) {
          group.push(q2);
          processed.add(id2);
          continue;
        }
        
        // Check for high similarity (90% or more)
        const similarity = calculateSimilarity(normalized1, normalized2);
        
        if (similarity >= 0.90) {
          group.push(q2);
          processed.add(id2);
          if (similarity > maxSimilarity) {
            maxSimilarity = similarity;
          }
        }
      }
      
      if (group.length > 1) {
        duplicateGroups.push({
          questions: group,
          similarity: Math.round(maxSimilarity * 100),
        });
        processed.add(id1);
      }
    }
    
    res.json({ 
      duplicates: duplicateGroups, 
      count: duplicateGroups.length,
      totalQuestions: questions.length
    });
  } catch (error) {
    console.error('Find duplicates error:', error);
    res.status(500).json({ error: 'Failed to find duplicates' });
  }
});

// Helper function to calculate string similarity (Levenshtein distance)
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(str1, str2);
  return (longer.length - distance) / longer.length;
}

function levenshteinDistance(str1, str2) {
  const matrix = [];
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[str2.length][str1.length];
}

export default router;

