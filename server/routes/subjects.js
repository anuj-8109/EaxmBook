import express from 'express';
import Subject from '../models/Subject.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all subjects
router.get('/', async (req, res) => {
  try {
    const { category_id, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const query = category_id ? { category_id } : {};
    
    const subjects = await Subject.find(query)
      .populate('category_id')
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Subject.countDocuments(query);
    
    res.json({
      subjects,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

// Get single subject
router.get('/:id', async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id).populate('category_id');
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }
    res.json(subject);
  } catch (error) {
    console.error('Get subject error:', error);
    res.status(500).json({ error: 'Failed to fetch subject' });
  }
});

// Create subject (admin only)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { name, description, category_id } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const subject = new Subject({ name, description, category_id });
    await subject.save();
    await subject.populate('category_id');
    res.status(201).json(subject);
  } catch (error) {
    console.error('Create subject error:', error);
    res.status(500).json({ error: 'Failed to create subject' });
  }
});

// Update subject (admin only)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { name, description, category_id } = req.body;
    
    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      { name, description, category_id, updated_at: Date.now() },
      { new: true, runValidators: true }
    );

    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    await subject.populate('category_id');
    res.json(subject);
  } catch (error) {
    console.error('Update subject error:', error);
    res.status(500).json({ error: 'Failed to update subject' });
  }
});

// Delete subject (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }
    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('Delete subject error:', error);
    res.status(500).json({ error: 'Failed to delete subject' });
  }
});

export default router;

