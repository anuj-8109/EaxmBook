import express from 'express';
import Feedback from '../models/Feedback.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { requireAdmin } from '../middleware/auth.js';
import { sendFeedbackStatusEmail } from '../services/mailer.js';

const router = express.Router();

// Get all feedback for current user
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const query = req.user.role === 'admin' ? {} : { user_id: req.user._id };
    
    const feedback = await Feedback.find(query)
      .populate('user_id', 'email full_name')
      .select('message category rating status admin_response created_at user_id')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const total = await Feedback.countDocuments(query);
    
    res.json({
      feedback,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

// Get single feedback
router.get('/:id', async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id)
      .populate('user_id', 'email full_name')
      .select('message category rating status admin_response created_at user_id')
      .lean();

    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    // Check if user owns this feedback or is admin
    const userId = feedback.user_id?._id || feedback.user_id;
    if (userId?.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(feedback);
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

// Create feedback
router.post('/', async (req, res) => {
  try {
    const { message, category, rating } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const feedback = new Feedback({
      user_id: req.user._id,
      message,
      category,
      rating: rating && rating >= 1 && rating <= 5 ? rating : null,
      status: 'pending',
    });

    await feedback.save();
    await feedback.populate('user_id', 'email full_name');
    
    // Notify all admins about new feedback - non-blocking
    (async () => {
      try {
        const admins = await User.find({ role: 'admin' }).select('_id').lean();
        const notifications = admins.map(admin => ({
          user_id: admin._id,
          title: 'New Feedback Received',
          message: `${req.user.full_name || req.user.email} submitted new feedback: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`,
          type: 'feedback_submitted',
          related_id: feedback._id,
          related_type: 'feedback',
        }));
        
        if (notifications.length > 0) {
          await Notification.insertMany(notifications);
        }
      } catch (notifError) {
        console.error('Failed to create notifications for admins:', notifError);
        // Don't fail the request if notification creation fails
      }
    })();
    
    res.status(201).json(feedback);
  } catch (error) {
    console.error('Create feedback error:', error);
    res.status(500).json({ error: 'Failed to create feedback' });
  }
});

// Update feedback status (admin only)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { status, admin_response } = req.body;

    // Get old status before update
    const oldFeedback = await Feedback.findById(req.params.id);
    const oldStatus = oldFeedback?.status;

    const updateData = { status };
    if (admin_response !== undefined) {
      updateData.admin_response = admin_response || null;
    }

    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    await feedback.populate('user_id', 'email full_name');
    
    // Notify the user who submitted the feedback (in-app notification)
    if (feedback.user_id) {
      try {
        const statusMessages = {
          'reviewed': 'Your feedback has been reviewed',
          'resolved': 'Your feedback has been resolved',
          'pending': 'Your feedback has been reopened',
        };
        
        // Get user_id - handle both populated and non-populated cases
        const userId = feedback.user_id._id ? feedback.user_id._id : feedback.user_id;
        
        if (userId) {
          const notification = new Notification({
            user_id: userId,
            title: 'Feedback Status Updated',
            message: `${statusMessages[status] || 'Your feedback status has been updated'}: "${feedback.message.substring(0, 80)}${feedback.message.length > 80 ? '...' : ''}"`,
            type: 'feedback_responded',
            related_id: feedback._id,
            related_type: 'feedback',
          });
          
          await notification.save();
        }
      } catch (notifError) {
        console.error('Failed to create notification for user:', notifError);
        // Don't fail the request if notification creation fails
      }
    }

    // Send email notification to user (only if status changed) - non-blocking
    if (feedback.user_id && oldStatus !== status) {
      // Don't await - send email in background
      (async () => {
        try {
          const user = feedback.user_id;
          const userEmail = typeof user === 'object' ? user.email : null;
          const userName = typeof user === 'object' ? (user.full_name || user.email?.split('@')[0] || 'User') : 'User';
          
          if (userEmail) {
            const baseUrl = process.env.FRONTEND_URL || process.env.BASE_URL || 'http://localhost:8080';
            
            await sendFeedbackStatusEmail({
              to: userEmail,
              userName,
              status,
              message: feedback.message,
              feedbackId: feedback._id,
              adminResponse: feedback.admin_response || admin_response || null,
              baseUrl,
            });
            
            console.log(`✅ Sent feedback status email to ${userEmail} for status: ${status}`);
          }
        } catch (emailError) {
          console.error('Failed to send feedback status email:', emailError);
          // Don't fail the request if email sending fails
        }
      })();
    }
    
    res.json(feedback);
  } catch (error) {
    console.error('Update feedback error:', error);
    res.status(500).json({ error: 'Failed to update feedback' });
  }
});

// Delete feedback
router.delete('/:id', async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    // Check if user owns this feedback or is admin
    if (feedback.user_id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    await Feedback.findByIdAndDelete(req.params.id);
    res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    console.error('Delete feedback error:', error);
    res.status(500).json({ error: 'Failed to delete feedback' });
  }
});

export default router;

