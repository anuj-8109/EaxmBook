import express from 'express';
import BookmarkedMaterial from '../models/BookmarkedMaterial.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all bookmarked materials for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { material_type, page = 1, limit = 20 } = req.query;
    const query = { user_id: req.user._id };

    if (material_type) query.material_type = material_type;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const bookmarks = await BookmarkedMaterial.find(query)
      .populate('category_id')
      .populate('subject_id')
      .populate('topic_id')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await BookmarkedMaterial.countDocuments(query);

    res.json({ bookmarks, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    console.error('Get bookmarked materials error:', error);
    res.status(500).json({ error: 'Failed to fetch bookmarked materials' });
  }
});

// Bookmark a material
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      material_type,
      material_id,
      title,
      description,
      file_url,
      category_id,
      subject_id,
      topic_id,
      notes,
      tags,
    } = req.body;

    if (!material_type || !material_id || !title) {
      return res.status(400).json({ error: 'Material type, ID, and title are required' });
    }

    // Check if already bookmarked
    const existing = await BookmarkedMaterial.findOne({
      user_id: req.user._id,
      material_type,
      material_id,
    });

    if (existing) {
      return res.status(400).json({ error: 'Material already bookmarked' });
    }

    const bookmark = new BookmarkedMaterial({
      user_id: req.user._id,
      material_type,
      material_id,
      material_type_ref: material_type === 'question' ? 'Question' : 
                        material_type === 'test' ? 'Test' :
                        material_type === 'job' ? 'Job' : 'Material',
      title,
      description,
      file_url,
      category_id,
      subject_id,
      topic_id,
      notes,
      tags: tags || [],
    });

    await bookmark.save();
    await bookmark.populate('category_id');
    await bookmark.populate('subject_id');
    await bookmark.populate('topic_id');

    res.status(201).json(bookmark);
  } catch (error) {
    console.error('Bookmark material error:', error);
    res.status(500).json({ error: 'Failed to bookmark material' });
  }
});

// Update bookmarked material (notes, tags)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { notes, tags } = req.body;

    const bookmark = await BookmarkedMaterial.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });

    if (!bookmark) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }

    if (notes !== undefined) bookmark.notes = notes;
    if (tags !== undefined) bookmark.tags = tags;

    await bookmark.save();
    await bookmark.populate('category_id');
    await bookmark.populate('subject_id');
    await bookmark.populate('topic_id');

    res.json(bookmark);
  } catch (error) {
    console.error('Update bookmark error:', error);
    res.status(500).json({ error: 'Failed to update bookmark' });
  }
});

// Remove bookmark
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const bookmark = await BookmarkedMaterial.findOneAndDelete({
      _id: req.params.id,
      user_id: req.user._id,
    });

    if (!bookmark) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }

    res.json({ message: 'Bookmark removed successfully' });
  } catch (error) {
    console.error('Remove bookmark error:', error);
    res.status(500).json({ error: 'Failed to remove bookmark' });
  }
});

// Check if material is bookmarked
router.get('/check/:materialType/:materialId', authenticateToken, async (req, res) => {
  try {
    const { materialType, materialId } = req.params;

    const bookmark = await BookmarkedMaterial.findOne({
      user_id: req.user._id,
      material_type: materialType,
      material_id: materialId,
    });

    res.json({ bookmarked: !!bookmark, bookmark_id: bookmark?._id });
  } catch (error) {
    console.error('Check bookmark error:', error);
    res.status(500).json({ error: 'Failed to check bookmark status' });
  }
});

export default router;

