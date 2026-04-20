import express from 'express';
import Payment from '../models/Payment.js';
import PaymentSettings from '../models/PaymentSettings.js';
import { requireAdmin, authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get payment settings (public)
router.get('/settings', async (req, res) => {
  try {
    const settings = await PaymentSettings.findOne({ is_active: true });
    res.json(settings || {});
  } catch (error) {
    console.error('Get payment settings error:', error);
    res.status(500).json({ error: 'Failed to fetch payment settings' });
  }
});

// Update payment settings (admin only)
router.put('/settings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      upi_id,
      upi_name,
      qr_code_url,
      qr_code_image,
      bank_account_number,
      bank_ifsc,
      bank_name,
      account_holder_name,
    } = req.body;

    let settings = await PaymentSettings.findOne();
    
    if (!settings) {
      settings = new PaymentSettings({
        upi_id,
        upi_name,
        qr_code_url: qr_code_image ? null : qr_code_url, // Use URL only if no image uploaded
        qr_code_image: qr_code_image || null,
        bank_account_number,
        bank_ifsc,
        bank_name,
        account_holder_name,
      });
    } else {
      settings.upi_id = upi_id;
      settings.upi_name = upi_name;
      // If image is uploaded, use image; otherwise use URL
      if (qr_code_image) {
        settings.qr_code_image = qr_code_image;
        settings.qr_code_url = null; // Clear URL if image is uploaded
      } else {
        settings.qr_code_url = qr_code_url;
        settings.qr_code_image = null; // Clear image if URL is provided
      }
      settings.bank_account_number = bank_account_number;
      settings.bank_ifsc = bank_ifsc;
      settings.bank_name = bank_name;
      settings.account_holder_name = account_holder_name;
    }

    await settings.save();
    res.json(settings);
  } catch (error) {
    console.error('Update payment settings error:', error);
    res.status(500).json({ error: 'Failed to update payment settings' });
  }
});

// Create payment/donation (user)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      amount,
      payment_method,
      transaction_id,
      payment_proof_url,
      notes,
    } = req.body;

    if (!amount || !payment_method) {
      return res.status(400).json({ error: 'Amount and payment method are required' });
    }

    const payment = new Payment({
      user_id: req.user._id,
      amount,
      payment_method,
      transaction_id,
      payment_proof_url,
      notes,
      status: 'pending',
    });

    await payment.save();
    await payment.populate('user_id');
    res.status(201).json(payment);
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// Get all payments (admin only)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const query = status ? { status } : {};
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const payments = await Payment.find(query)
      .populate('user_id', 'full_name email')
      .populate('verified_by', 'full_name email')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Payment.countDocuments(query);
    const totalAmount = await Payment.aggregate([
      { $match: { status: 'verified' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    res.json({
      payments,
      total,
      totalRevenue: totalAmount[0]?.total || 0,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Get user's payments
router.get('/my-payments', authenticateToken, async (req, res) => {
  try {
    const payments = await Payment.find({ user_id: req.user._id })
      .sort({ created_at: -1 });
    res.json(payments);
  } catch (error) {
    console.error('Get user payments error:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Verify payment (admin only)
router.put('/:id/verify', requireAdmin, async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      {
        status,
        verified_by: req.user._id,
        verified_at: status === 'verified' ? Date.now() : null,
        notes,
        updated_at: Date.now(),
      },
      { new: true }
    ).populate('user_id', 'full_name email');

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(payment);
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// Get payment statistics (admin only)
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'verified' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const pendingCount = await Payment.countDocuments({ status: 'pending' });
    const verifiedCount = await Payment.countDocuments({ status: 'verified' });
    const rejectedCount = await Payment.countDocuments({ status: 'rejected' });

    const monthlyRevenue = await Payment.aggregate([
      { $match: { status: 'verified' } },
      {
        $group: {
          _id: {
            year: { $year: '$verified_at' },
            month: { $month: '$verified_at' }
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    res.json({
      totalRevenue: totalRevenue[0]?.total || 0,
      pendingCount,
      verifiedCount,
      rejectedCount,
      monthlyRevenue,
    });
  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({ error: 'Failed to fetch payment statistics' });
  }
});

export default router;

