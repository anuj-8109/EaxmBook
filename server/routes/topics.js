import express from 'express';
import Topic from '../models/Topic.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all topics
router.get('/', async (req, res) => {
  try {
    const { subject_id, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const query = subject_id ? { subject_id } : {};
    
    const topics = await Topic.find(query)
      .populate('subject_id')
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Topic.countDocuments(query);
    
    res.json({
      topics,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get topics error:', error);
    res.status(500).json({ error: 'Failed to fetch topics' });
  }
});

// Get single topic
router.get('/:id', async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id).populate('subject_id');
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }
    res.json(topic);
  } catch (error) {
    console.error('Get topic error:', error);
    res.status(500).json({ error: 'Failed to fetch topic' });
  }
});

// Create topic (admin only)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { name, description, subject_id } = req.body;
    
    if (!name || !subject_id) {
      return res.status(400).json({ error: 'Name and subject_id are required' });
    }

    const topic = new Topic({ name, description, subject_id });
    await topic.save();
    await topic.populate('subject_id');
    res.status(201).json(topic);
  } catch (error) {
    console.error('Create topic error:', error);
    res.status(500).json({ error: 'Failed to create topic' });
  }
});

// Update topic (admin only)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { name, description, subject_id } = req.body;
    
    const topic = await Topic.findByIdAndUpdate(
      req.params.id,
      { name, description, subject_id, updated_at: Date.now() },
      { new: true, runValidators: true }
    );

    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    await topic.populate('subject_id');
    res.json(topic);
  } catch (error) {
    console.error('Update topic error:', error);
    res.status(500).json({ error: 'Failed to update topic' });
  }
});

// Delete topic (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const topic = await Topic.findByIdAndDelete(req.params.id);
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }
    res.json({ message: 'Topic deleted successfully' });
  } catch (error) {
    console.error('Delete topic error:', error);
    res.status(500).json({ error: 'Failed to delete topic' });
  }
});

export default router;

