import express from 'express';
import Material from '../models/Material.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all materials
router.get('/', async (req, res) => {
  try {
    const { 
      material_type, 
      category_id, 
      subject_id, 
      topic_id, 
      level_number,
      page = 1, 
      limit = 20 
    } = req.query;
    
    const query = { is_active: true };

    if (material_type) query.material_type = material_type;
    if (category_id) query.category_id = category_id;
    if (subject_id) query.subject_id = subject_id;
    if (topic_id) query.topic_id = topic_id;
    if (level_number) query.level_number = parseInt(level_number);

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const materials = await Material.find(query)
      .populate('category_id')
      .populate('subject_id')
      .populate('topic_id')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Material.countDocuments(query);

    res.json({ materials, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    console.error('Get materials error:', error);
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
});

// Get single material
router.get('/:id', async (req, res) => {
  try {
    const material = await Material.findById(req.params.id)
      .populate('category_id')
      .populate('subject_id')
      .populate('topic_id');

    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    // Increment view count
    material.view_count += 1;
    await material.save();

    res.json(material);
  } catch (error) {
    console.error('Get material error:', error);
    res.status(500).json({ error: 'Failed to fetch material' });
  }
});

// Create material (admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      title,
      description,
      material_type,
      file_url,
      file_size,
      duration,
      thumbnail_url,
      category_id,
      subject_id,
      topic_id,
      level_number,
      is_paid,
      price,
    } = req.body;

    if (!title || !material_type) {
      return res.status(400).json({ error: 'Title and material type are required' });
    }

    const material = new Material({
      title,
      description,
      material_type,
      file_url,
      file_size,
      duration,
      thumbnail_url,
      category_id,
      subject_id,
      topic_id,
      level_number,
      is_paid: is_paid || false,
      price: price || 0,
      created_by: req.user._id,
    });

    await material.save();
    await material.populate('category_id');
    await material.populate('subject_id');
    await material.populate('topic_id');

    // Send notifications to all users
    try {
      const users = await User.find({ role: 'user' });
      const notifications = users.map(user => ({
        user_id: user._id,
        title: 'New Study Material Available',
        message: `New ${material_type} added: ${title}`,
        type: 'new_material',
        related_id: material._id,
        related_type: 'Material',
      }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
        console.log(`Sent ${notifications.length} material notifications`);
        
        // Emit real-time notification
        const io = req.app.get('io');
        if (io) {
          io.emit('new_material', {
            material: {
              _id: material._id,
              title: material.title,
              material_type: material.material_type,
              file_url: material.file_url,
            },
            notification: {
              title: 'New Study Material Available',
              message: `New ${material.material_type} added: ${material.title}`,
              type: 'new_material',
            }
          });
        }
      }
    } catch (notifError) {
      console.error('Failed to send material notifications:', notifError);
    }

    res.status(201).json(material);
  } catch (error) {
    console.error('Create material error:', error);
    res.status(500).json({ error: 'Failed to create material' });
  }
});

// Update material (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const material = await Material.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updated_at: Date.now() },
      { new: true, runValidators: true }
    )
      .populate('category_id')
      .populate('subject_id')
      .populate('topic_id');

    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    res.json(material);
  } catch (error) {
    console.error('Update material error:', error);
    res.status(500).json({ error: 'Failed to update material' });
  }
});

// Delete material (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const material = await Material.findByIdAndDelete(req.params.id);
    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    res.json({ message: 'Material deleted successfully' });
  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({ error: 'Failed to delete material' });
  }
});

// Download material (increment download count)
router.post('/:id/download', async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    material.download_count += 1;
    await material.save();

    res.json({ file_url: material.file_url, download_count: material.download_count });
  } catch (error) {
    console.error('Download material error:', error);
    res.status(500).json({ error: 'Failed to download material' });
  }
});

export default router;

