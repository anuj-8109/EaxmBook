import express from 'express';
import CategorySubscription from '../models/CategorySubscription.js';
import Category from '../models/Category.js';
import Subject from '../models/Subject.js';
import Test from '../models/Test.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Subscribe to a category
router.post('/:categoryId', authenticateToken, async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    // Check if category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if already subscribed
    const existing = await CategorySubscription.findOne({
      user_id: req.user._id,
      category_id: categoryId,
    });

    if (existing) {
      return res.status(400).json({ error: 'Already subscribed to this category' });
    }

    const subscription = new CategorySubscription({
      user_id: req.user._id,
      category_id: categoryId,
    });

    await subscription.save();
    await subscription.populate('category_id', 'name description icon');

    res.status(201).json(subscription);
  } catch (error) {
    console.error('Subscribe error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Already subscribed to this category' });
    }
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

// Unsubscribe from a category
router.delete('/:categoryId', authenticateToken, async (req, res) => {
  try {
    const { categoryId } = req.params;

    const subscription = await CategorySubscription.findOneAndDelete({
      user_id: req.user._id,
      category_id: categoryId,
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    res.json({ message: 'Unsubscribed successfully' });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
});

// Get all subscriptions for current user with related data
router.get('/my-subscriptions', authenticateToken, async (req, res) => {
  try {
    const subscriptions = await CategorySubscription.find({ user_id: req.user._id })
      .populate('category_id', 'name description icon')
      .sort({ created_at: -1 });

    // Get all subscribed category IDs
    const categoryIds = subscriptions.map(sub => sub.category_id._id || sub.category_id);

    // Get subjects for subscribed categories
    const subjects = await Subject.find({ category_id: { $in: categoryIds } })
      .populate('category_id', 'name')
      .sort({ name: 1 });

    // Get tests for subscribed categories
    const tests = await Test.find({ 
      category_id: { $in: categoryIds },
      is_active: true,
    })
      .populate('category_id', 'name')
      .populate('subject_id', 'name')
      .sort({ created_at: -1 });

    res.json({
      subscriptions: subscriptions.map(sub => ({
        _id: sub._id,
        category: sub.category_id,
        created_at: sub.created_at,
      })),
      subjects,
      tests,
    });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// Check if user is subscribed to a category
router.get('/check/:categoryId', authenticateToken, async (req, res) => {
  try {
    const { categoryId } = req.params;

    const subscription = await CategorySubscription.findOne({
      user_id: req.user._id,
      category_id: categoryId,
    });

    res.json({ subscribed: !!subscription });
  } catch (error) {
    console.error('Check subscription error:', error);
    res.status(500).json({ error: 'Failed to check subscription' });
  }
});

export default router;

