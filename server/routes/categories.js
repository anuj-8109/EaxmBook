import express from 'express';
import Category from '../models/Category.js';
import { requireAdmin, authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all categories (with tree structure support)
router.get('/', async (req, res) => {
  try {
    const { tree, parent_id } = req.query;
    
    if (tree === 'true') {
      // Return tree structure
      const allCategories = await Category.find().sort({ order: 1, name: 1 });
      const categoryMap = new Map();
      const rootCategories = [];
      
      // Build map
      allCategories.forEach(cat => {
        categoryMap.set(cat._id.toString(), { ...cat.toObject(), children: [] });
      });
      
      // Build tree
      allCategories.forEach(cat => {
        const categoryObj = categoryMap.get(cat._id.toString());
        if (cat.parent_id) {
          const parent = categoryMap.get(cat.parent_id.toString());
          if (parent) {
            parent.children.push(categoryObj);
          } else {
            rootCategories.push(categoryObj);
          }
        } else {
          rootCategories.push(categoryObj);
        }
      });
      
      return res.json(rootCategories);
    }
    
    if (parent_id) {
      const { page = 1, limit = 10 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      const categories = await Category.find({ parent_id })
        .sort({ order: 1, name: 1 })
        .skip(skip)
        .limit(parseInt(limit));
      
      const total = await Category.countDocuments({ parent_id });
      
      return res.json({
        categories,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });
    }
    
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const categories = await Category.find()
      .sort({ order: 1, name: 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Category.countDocuments();
    
    res.json({
      categories,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get single category
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

// Create category (both admin and user can create) - Enhanced with tree structure
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, icon, parent_id, test_category_type, order } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Get max order if not provided
    let categoryOrder = order;
    if (categoryOrder === undefined) {
      const maxOrder = await Category.findOne({ parent_id: parent_id || null })
        .sort({ order: -1 })
        .select('order');
      categoryOrder = maxOrder ? maxOrder.order + 1 : 0;
    }

    const category = new Category({ 
      name, 
      description, 
      icon, 
      parent_id: parent_id || null,
      test_category_type: test_category_type || 'Other',
      order: categoryOrder
    });
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update category (admin only) - Enhanced
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { name, description, icon, parent_id, test_category_type, order } = req.body;
    
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { 
        name, 
        description, 
        icon, 
        parent_id: parent_id !== undefined ? (parent_id || null) : undefined,
        test_category_type,
        order,
        updated_at: Date.now() 
      },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Reorder categories (admin only)
router.post('/reorder', requireAdmin, async (req, res) => {
  try {
    const { categories } = req.body; // Array of { id, order, parent_id }
    
    if (!Array.isArray(categories)) {
      return res.status(400).json({ error: 'Categories array is required' });
    }

    const updatePromises = categories.map(({ id, order, parent_id }) =>
      Category.findByIdAndUpdate(id, { order, parent_id: parent_id || null }, { new: true })
    );

    await Promise.all(updatePromises);
    res.json({ message: 'Categories reordered successfully' });
  } catch (error) {
    console.error('Reorder categories error:', error);
    res.status(500).json({ error: 'Failed to reorder categories' });
  }
});

// Batch delete categories (admin only) - MUST be before /:id route
router.delete('/batch', requireAdmin, async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'IDs array is required' });
    }

    const result = await Category.deleteMany({ _id: { $in: ids } });

    res.json({
      message: 'Categories deleted successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Batch delete categories error:', error);
    res.status(500).json({ error: 'Failed to delete categories' });
  }
});

// Delete category (authenticated users can delete)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;

