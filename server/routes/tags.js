import express from 'express';
import Tag from '../models/Tag.js';
import Question from '../models/Question.js';
import { requireAdmin, authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all tags
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 100 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const tags = await Tag.find()
      .sort({ tag_name: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Tag.countDocuments();

    res.json({
      data: tags,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// Get single tag
router.get('/:id', async (req, res) => {
  try {
    const tag = await Tag.findById(req.params.id);
    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }
    res.json(tag);
  } catch (error) {
    console.error('Get tag error:', error);
    res.status(500).json({ error: 'Failed to fetch tag' });
  }
});

// Create tag
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { tag_name, description } = req.body;

    if (!tag_name || !tag_name.trim()) {
      return res.status(400).json({ error: 'Tag name is required' });
    }

    // Check if tag already exists
    const existingTag = await Tag.findOne({ tag_name: tag_name.trim() });
    if (existingTag) {
      return res.status(409).json({ error: 'Tag already exists', tag: existingTag });
    }

    const tag = new Tag({
      tag_name: tag_name.trim(),
      description: description || null
    });
    await tag.save();
    res.status(201).json(tag);
  } catch (error) {
    console.error('Create tag error:', error);
    res.status(500).json({ error: 'Failed to create tag' });
  }
});

// Update tag
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { tag_name, description } = req.body;

    const tag = await Tag.findByIdAndUpdate(
      req.params.id,
      {
        tag_name: tag_name?.trim(),
        description,
        updated_at: Date.now()
      },
      { new: true, runValidators: true }
    );

    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    res.json(tag);
  } catch (error) {
    console.error('Update tag error:', error);
    res.status(500).json({ error: 'Failed to update tag' });
  }
});

// Batch delete tags
router.delete('/batch', requireAdmin, async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'IDs array is required' });
    }

    // Remove tags from all questions
    await Question.updateMany(
      { tag_ids: { $in: ids } },
      { $pull: { tag_ids: { $in: ids } } }
    );

    const result = await Tag.deleteMany({ _id: { $in: ids } });

    res.json({
      message: 'Tags deleted successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Batch delete tags error:', error);
    res.status(500).json({ error: 'Failed to delete tags' });
  }
});

// Delete tag
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    // Remove tag from all questions first
    await Question.updateMany(
      { tag_ids: req.params.id },
      { $pull: { tag_ids: req.params.id } }
    );

    const tag = await Tag.findByIdAndDelete(req.params.id);
    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    res.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Delete tag error:', error);
    res.status(500).json({ error: 'Failed to delete tag' });
  }
});

// Add tags to questions
router.post('/add-to-questions', authenticateToken, async (req, res) => {
  try {
    const { question_ids, tag_ids } = req.body;

    if (!Array.isArray(question_ids) || question_ids.length === 0) {
      return res.status(400).json({ error: 'question_ids array is required' });
    }

    if (!Array.isArray(tag_ids) || tag_ids.length === 0) {
      return res.status(400).json({ error: 'tag_ids array is required' });
    }

    // Verify all tags exist
    const existingTags = await Tag.find({ _id: { $in: tag_ids } });
    if (existingTags.length !== tag_ids.length) {
      return res.status(400).json({ error: 'One or more tags not found' });
    }

    // Add tags to questions (using $addToSet to avoid duplicates)
    const result = await Question.updateMany(
      { _id: { $in: question_ids } },
      { $addToSet: { tag_ids: { $each: tag_ids } } }
    );

    res.json({
      message: 'Tags added to questions successfully',
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount
    });
  } catch (error) {
    console.error('Add tags to questions error:', error);
    res.status(500).json({ error: 'Failed to add tags to questions' });
  }
});

// Get questions by tag
router.get('/:id/questions', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const questions = await Question.find({ tag_ids: req.params.id })
      .populate('category_ids', 'name')
      .populate('subject_ids', 'name')
      .populate('topic_ids', 'name')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Question.countDocuments({ tag_ids: req.params.id });

    res.json({
      questions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get questions by tag error:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

export default router;
