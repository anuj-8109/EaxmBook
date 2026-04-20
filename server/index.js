import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import authRoutes from './routes/auth.js';
import categoriesRoutes from './routes/categories.js';
import subjectsRoutes from './routes/subjects.js';
import topicsRoutes from './routes/topics.js';
import testsRoutes from './routes/tests.js';
import questionsRoutes from './routes/questions.js';
import attemptsRoutes from './routes/attempts.js';
import feedbackRoutes from './routes/feedback.js';
import usersRoutes from './routes/users.js';
import settingsRoutes from './routes/settings.js';
import paymentsRoutes from './routes/payments.js';
import dashboardRoutes from './routes/dashboard.js';
import notificationsRoutes from './routes/notifications.js';
import subscriptionsRoutes from './routes/subscriptions.js';
import bookmarksRoutes from './routes/bookmarks.js';
import progressRoutes from './routes/progress.js';
import levelsRoutes from './routes/levels.js';
import aiRoutes from './routes/ai.js';
import jobsRoutes from './routes/jobs.js';
import materialsRoutes from './routes/materials.js';
import bookmarkedMaterialsRoutes from './routes/bookmarkedMaterials.js';
import uploadRoutes from './routes/upload.js';
import examTreeRoutes from './routes/exam-tree.js';
import { authenticateToken } from './middleware/auth.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/easy-exam-gen', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
  process.exit(1);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', authenticateToken, categoriesRoutes);
app.use('/api/subjects', authenticateToken, subjectsRoutes);
app.use('/api/topics', authenticateToken, topicsRoutes);
app.use('/api/tests', authenticateToken, testsRoutes);
app.use('/api/questions', authenticateToken, questionsRoutes);
app.use('/api/attempts', authenticateToken, attemptsRoutes);
app.use('/api/feedback', authenticateToken, feedbackRoutes);
app.use('/api/users', authenticateToken, usersRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);
app.use('/api/notifications', authenticateToken, notificationsRoutes);
app.use('/api/subscriptions', authenticateToken, subscriptionsRoutes);
app.use('/api/bookmarks', authenticateToken, bookmarksRoutes);
app.use('/api/progress', authenticateToken, progressRoutes);
app.use('/api/levels', authenticateToken, levelsRoutes);
app.use('/api/ai', authenticateToken, aiRoutes);
app.use('/api/jobs', jobsRoutes); // Public routes for jobs
app.use('/api/materials', materialsRoutes); // Public routes for materials
app.use('/api/bookmarked-materials', bookmarkedMaterialsRoutes);
app.use('/api/upload', uploadRoutes); // Upload routes
app.use('/api/exam-tree', examTreeRoutes); // Exam tree hierarchy route

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io available to routes
app.set('io', io);

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


// import express from 'express';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import mongoose from 'mongoose';
// import authRoutes from './routes/auth.js';
// import categoriesRoutes from './routes/categories.js';
// import subjectsRoutes from './routes/subjects.js';
// import testsRoutes from './routes/tests.js';
// import questionsRoutes from './routes/questions.js';
// import attemptsRoutes from './routes/attempts.js';
// import feedbackRoutes from './routes/feedback.js';
// import usersRoutes from './routes/users.js';
// import settingsRoutes from './routes/settings.js';
// import { authenticateToken } from './middleware/auth.js';
// import https from 'https';
// import fs from 'fs';

// process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";  // <-- Add this

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 3001;

// // CORS
// app.use(cors({
//   origin: (origin, callback) => callback(null, true),
//   credentials: true,
//   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization"]
// }));

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // MongoDB
// mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/easy-exam-gen')
//   .then(() => console.log('Connected to MongoDB'))
//   .catch(err => {
//     console.error('MongoDB connection error:', err);
//     process.exit(1);
//   });

// // SSL Files
// const privateKey = fs.readFileSync('/var/www/test/server.key', 'utf8');
// const certificate = fs.readFileSync('/var/www/test/server.cert', 'utf8');
// const credentials = { key: privateKey, cert: certificate };

// // Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/categories', authenticateToken, categoriesRoutes);
// app.use('/api/subjects', authenticateToken, subjectsRoutes);
// app.use('/api/tests', authenticateToken, testsRoutes);
// app.use('/api/questions', authenticateToken, questionsRoutes);
// app.use('/api/attempts', authenticateToken, attemptsRoutes);
// app.use('/api/feedback', authenticateToken, feedbackRoutes);
// app.use('/api/users', authenticateToken, usersRoutes);
// app.use('/api/settings', settingsRoutes);

// // Health
// app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// // Error Handler
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).json({ error: 'Something went wrong!', message: err.message });
// });

// // HTTPS Server
// https.createServer(credentials, app).listen(PORT, () => {
//   console.log(`HTTPS Server running on https://https://exampulse.id:${PORT}`);
// });
