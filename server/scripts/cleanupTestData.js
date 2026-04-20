import mongoose from 'mongoose';
import dotenv from 'dotenv';
import TestAnswer from '../models/TestAnswer.js';
import TestAttempt from '../models/TestAttempt.js';
import TestQuestion from '../models/TestQuestion.js';
import Test from '../models/Test.js';
import Question from '../models/Question.js';
import Topic from '../models/Topic.js';
import Subject from '../models/Subject.js';
import Category from '../models/Category.js';
import Bookmark from '../models/Bookmark.js';
import CategorySubscription from '../models/CategorySubscription.js';
import SkipTestAttempt from '../models/SkipTestAttempt.js';
import LevelProgress from '../models/LevelProgress.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://snehpnp:snehpnp@newsmartalgo.n5bxaxz.mongodb.net/easy-exam-gen';

async function cleanupTestData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    console.log('\n=== Starting Database Cleanup ===\n');

    // Delete in order to respect dependencies
    
    // 1. Delete TestAnswers (depends on TestAttempts and Questions)
    console.log('1. Deleting TestAnswers...');
    const testAnswersResult = await TestAnswer.deleteMany({});
    console.log(`   Deleted ${testAnswersResult.deletedCount} test answers`);

    // 2. Delete TestAttempts (depends on Tests)
    console.log('2. Deleting TestAttempts...');
    const testAttemptsResult = await TestAttempt.deleteMany({});
    console.log(`   Deleted ${testAttemptsResult.deletedCount} test attempts`);

    // 3. Delete SkipTestAttempts (depends on Questions and Levels)
    console.log('3. Deleting SkipTestAttempts...');
    const skipTestAttemptsResult = await SkipTestAttempt.deleteMany({});
    console.log(`   Deleted ${skipTestAttemptsResult.deletedCount} skip test attempts`);

    // 4. Delete TestQuestions (depends on Tests and Questions)
    console.log('4. Deleting TestQuestions...');
    const testQuestionsResult = await TestQuestion.deleteMany({});
    console.log(`   Deleted ${testQuestionsResult.deletedCount} test questions`);

    // 5. Delete Tests
    console.log('5. Deleting Tests...');
    const testsResult = await Test.deleteMany({});
    console.log(`   Deleted ${testsResult.deletedCount} tests`);

    // 6. Delete Bookmarks (related to questions)
    console.log('6. Deleting Bookmarks...');
    const bookmarksResult = await Bookmark.deleteMany({});
    console.log(`   Deleted ${bookmarksResult.deletedCount} bookmarks`);

    // 7. Delete Questions
    console.log('7. Deleting Questions...');
    const questionsResult = await Question.deleteMany({});
    console.log(`   Deleted ${questionsResult.deletedCount} questions`);

    // 8. Delete LevelProgress (related to categories, subjects, topics)
    console.log('8. Deleting LevelProgress...');
    const levelProgressResult = await LevelProgress.deleteMany({});
    console.log(`   Deleted ${levelProgressResult.deletedCount} level progress records`);

    // 9. Delete Topics (depends on Subjects)
    console.log('9. Deleting Topics...');
    const topicsResult = await Topic.deleteMany({});
    console.log(`   Deleted ${topicsResult.deletedCount} topics`);

    // 10. Delete CategorySubscriptions (related to categories)
    console.log('10. Deleting CategorySubscriptions...');
    const categorySubscriptionsResult = await CategorySubscription.deleteMany({});
    console.log(`   Deleted ${categorySubscriptionsResult.deletedCount} category subscriptions`);

    // 11. Delete Subjects (depends on Categories)
    console.log('11. Deleting Subjects...');
    const subjectsResult = await Subject.deleteMany({});
    console.log(`   Deleted ${subjectsResult.deletedCount} subjects`);

    // 12. Delete Categories
    console.log('12. Deleting Categories...');
    const categoriesResult = await Category.deleteMany({});
    console.log(`   Deleted ${categoriesResult.deletedCount} categories`);

    console.log('\n=== Cleanup Complete ===');
    console.log('\nSummary:');
    console.log(`- TestAnswers: ${testAnswersResult.deletedCount}`);
    console.log(`- TestAttempts: ${testAttemptsResult.deletedCount}`);
    console.log(`- SkipTestAttempts: ${skipTestAttemptsResult.deletedCount}`);
    console.log(`- TestQuestions: ${testQuestionsResult.deletedCount}`);
    console.log(`- Tests: ${testsResult.deletedCount}`);
    console.log(`- Bookmarks: ${bookmarksResult.deletedCount}`);
    console.log(`- Questions: ${questionsResult.deletedCount}`);
    console.log(`- LevelProgress: ${levelProgressResult.deletedCount}`);
    console.log(`- Topics: ${topicsResult.deletedCount}`);
    console.log(`- CategorySubscriptions: ${categorySubscriptionsResult.deletedCount}`);
    console.log(`- Subjects: ${subjectsResult.deletedCount}`);
    console.log(`- Categories: ${categoriesResult.deletedCount}`);
    console.log('\n✅ All test-related data has been deleted.');
    console.log('✅ Users and system data have been preserved.');

  } catch (error) {
    console.error('Error during cleanup:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed.');
  }
}

// Run the cleanup
cleanupTestData()
  .then(() => {
    console.log('\n✅ Cleanup script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Cleanup script failed:', error);
    process.exit(1);
  });

