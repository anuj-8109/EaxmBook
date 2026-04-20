import express from 'express';
import Job from '../models/Job.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all jobs (public)
router.get('/', async (req, res) => {
  try {
    const { category, exam_name, job_type, is_featured, page = 1, limit = 20 } = req.query;
    const query = { is_active: true };

    if (category) query.category = category;
    if (exam_name) query.exam_name = exam_name;
    if (job_type) query.job_type = job_type;
    if (is_featured !== undefined) query.is_featured = is_featured === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const jobs = await Job.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Job.countDocuments(query);

    res.json({ jobs, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Get single job
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Increment views
    job.views += 1;
    await job.save();

    res.json(job);
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

// Create job (admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      title,
      company,
      description,
      location,
      salary,
      job_type,
      category,
      exam_name,
      application_deadline,
      application_link,
      is_featured,
    } = req.body;

    if (!title || !company) {
      return res.status(400).json({ error: 'Title and company are required' });
    }

    const job = new Job({
      title,
      company,
      description,
      location,
      salary,
      job_type: job_type || 'Full-time',
      category,
      exam_name,
      application_deadline: application_deadline ? new Date(application_deadline) : null,
      application_link,
      is_featured: is_featured || false,
      source: 'manual',
      created_by: req.user._id,
    });

    await job.save();

    // Get Socket.io instance
    const io = req.app.get('io');

    // Send notifications to all users
    try {
      const users = await User.find({ role: 'user' });
      const notifications = users.map(user => ({
        user_id: user._id,
        title: 'New Job Opportunity',
        message: `${company} is hiring for ${title}`,
        type: 'new_job',
        related_id: job._id,
        related_type: 'Job',
      }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
        console.log(`Sent ${notifications.length} job notifications`);
        
        // Emit real-time notification to all connected clients
        if (io) {
          io.emit('new_job', {
            job: {
              _id: job._id,
              title: job.title,
              company: job.company,
              location: job.location,
              application_link: job.application_link,
            },
            notification: {
              title: 'New Job Opportunity',
              message: `${company} is hiring for ${title}`,
              type: 'new_job',
            }
          });
          console.log('Real-time job notification sent to all clients');
        }
      }
    } catch (notifError) {
      console.error('Failed to send job notifications:', notifError);
    }

    res.status(201).json(job);
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ error: 'Failed to create job' });
  }
});

// Update job (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updated_at: Date.now() },
      { new: true, runValidators: true }
    );

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ error: 'Failed to update job' });
  }
});

// Delete job (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

// Sync jobs from 3rd party API (admin only)
router.post('/sync-api', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { api_url, api_key, api_name = 'custom' } = req.body;

    if (!api_url) {
      return res.status(400).json({ error: 'API URL is required' });
    }

    // Fetch jobs from 3rd party API
    const response = await fetch(api_url, {
      headers: {
        'Authorization': api_key ? `Bearer ${api_key}` : undefined,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const apiJobs = await response.json();
    const createdJobs = [];
    const skippedJobs = [];

    // Process each job from API
    for (const apiJob of apiJobs.data || apiJobs || []) {
      try {
        // Check if job already exists
        const existingJob = await Job.findOne({ external_id: apiJob.id, source_api: api_name });
        
        if (existingJob) {
          skippedJobs.push(apiJob.id);
          continue;
        }

        const job = new Job({
          title: apiJob.title || apiJob.job_title || 'Untitled Job',
          company: apiJob.company || apiJob.company_name || 'Unknown Company',
          description: apiJob.description || apiJob.job_description || null,
          location: apiJob.location || apiJob.city || null,
          salary: apiJob.salary || apiJob.salary_range || null,
          job_type: apiJob.job_type || apiJob.type || 'Full-time',
          category: apiJob.category || null,
          exam_name: apiJob.exam_name || null,
          application_deadline: apiJob.deadline ? new Date(apiJob.deadline) : null,
          application_link: apiJob.url || apiJob.apply_url || null,
          source: 'api',
          source_api: api_name,
          external_id: apiJob.id || apiJob.job_id || null,
          created_by: req.user._id,
        });

        await job.save();
        createdJobs.push(job);

        // Send notifications to all users
        try {
          const users = await User.find({ role: 'user' });
          const notifications = users.map(user => ({
            user_id: user._id,
            title: 'New Job Opportunity',
            message: `${job.company} is hiring for ${job.title}`,
            type: 'new_job',
            related_id: job._id,
            related_type: 'Job',
          }));

          if (notifications.length > 0) {
            await Notification.insertMany(notifications);
            
            // Emit real-time notification
            const io = req.app.get('io');
            if (io) {
              io.emit('new_job', {
                job: {
                  _id: job._id,
                  title: job.title,
                  company: job.company,
                  location: job.location,
                  application_link: job.application_link,
                },
                notification: {
                  title: 'New Job Opportunity',
                  message: `${job.company} is hiring for ${job.title}`,
                  type: 'new_job',
                }
              });
            }
          }
        } catch (notifError) {
          console.error('Failed to send job notifications:', notifError);
        }
      } catch (error) {
        console.error(`Error processing job ${apiJob.id}:`, error);
        skippedJobs.push(apiJob.id);
      }
    }

    res.json({
      success: true,
      message: `Synced ${createdJobs.length} new jobs from ${api_name}`,
      created: createdJobs.length,
      skipped: skippedJobs.length,
    });
  } catch (error) {
    console.error('Sync API jobs error:', error);
    res.status(500).json({ error: 'Failed to sync jobs from API' });
  }
});

export default router;

