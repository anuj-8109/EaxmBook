import express from 'express';
import User from '../models/User.js';
import TestAttempt from '../models/TestAttempt.js';
import Test from '../models/Test.js';
import Feedback from '../models/Feedback.js';
import Payment from '../models/Payment.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get comprehensive dashboard stats (admin only)
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    // User statistics
    const totalUsers = await User.countDocuments({ role: 'user' });
    const activeUsers = await User.countDocuments({
      role: 'user',
      updated_at: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Active in last 30 days
    });

    // Payment/Revenue statistics
    const paymentStats = await Payment.aggregate([
      { $match: { status: 'verified' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalTransactions: { $sum: 1 },
        }
      }
    ]);
    const totalRevenue = paymentStats[0]?.totalRevenue || 0;
    const totalTransactions = paymentStats[0]?.totalTransactions || 0;
    const pendingPayments = await Payment.countDocuments({ status: 'pending' });

    // Security threats (placeholder - can be enhanced with actual threat detection)
    const securityWarnings = [];
    const recentFailedLogins = 0; // Can be tracked separately
    const suspiciousActivity = 0; // Can be tracked separately

    // Pending testimonials/comments
    const pendingTestimonials = await Feedback.countDocuments({ status: 'pending' });

    // Test demand graph data
    const testDemandData = await TestAttempt.aggregate([
      {
        $group: {
          _id: '$test_id',
          attempts: { $sum: 1 },
          avgScore: { $avg: { $divide: ['$score', '$total_questions'] } },
        }
      },
      {
        $lookup: {
          from: 'tests',
          localField: '_id',
          foreignField: '_id',
          as: 'test'
        }
      },
      {
        $unwind: {
          path: '$test',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          test_id: '$_id',
          test_name: '$test.name',
          attempts: 1,
          avgScore: { $multiply: ['$avgScore', 100] },
        }
      },
      { $sort: { attempts: -1 } },
      { $limit: 10 }
    ]);

    // Additional statistics
    const totalTests = await Test.countDocuments({ status: 'published' });
    const totalAttempts = await TestAttempt.countDocuments();
    const recentAttempts = await TestAttempt.countDocuments({
      completed_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    res.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
      },
      revenue: {
        total: totalRevenue,
        transactions: totalTransactions,
        pending: pendingPayments,
      },
      security: {
        warnings: securityWarnings,
        threats: securityWarnings.length,
      },
      testimonials: {
        pending: pendingTestimonials,
      },
      testDemand: testDemandData,
      overview: {
        totalTests,
        totalAttempts,
        recentAttempts,
      },
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

export default router;

