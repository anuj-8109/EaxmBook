import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Test from '../models/Test.js';
import TestQuestion from '../models/TestQuestion.js';
import Question from '../models/Question.js';
import Category from '../models/Category.js';
import Subject from '../models/Subject.js';
import User from '../models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://snehpnp:snehpnp@newsmartalgo.n5bxaxz.mongodb.net/easy-exam-gen';

// Test configurations - Maximum GK/GS, then English, then Mathematics
const testConfigs = [
  // UPSC Tests - Maximum GK/GS
  {
    name: "UPSC CSE General Studies - Paper 1",
    description: "Comprehensive General Studies test covering History, Geography, Polity, and Current Affairs for UPSC CSE preparation.",
    category: "UPSC",
    subject: "General Knowledge",
    duration_minutes: 120,
    total_questions: 100,
    total_marks: 200,
    negative_marking: true,
    negative_marks_per_question: 0.33,
    test_type: "static",
    exam_name: "UPSC CSE",
    difficulty_distribution: { easy: 30, medium: 50, hard: 20 }
  },
  {
    name: "UPSC CSE General Studies - Paper 2",
    description: "General Studies test focusing on Governance, Constitution, Polity, Social Justice, and International Relations.",
    category: "UPSC",
    subject: "General Knowledge",
    duration_minutes: 120,
    total_questions: 80,
    total_marks: 200,
    negative_marking: true,
    negative_marks_per_question: 0.33,
    test_type: "static",
    exam_name: "UPSC CSE",
    difficulty_distribution: { easy: 25, medium: 40, hard: 15 }
  },
  {
    name: "UPSC CSE History - Ancient & Medieval",
    description: "Detailed test on Ancient and Medieval Indian History for UPSC Civil Services Examination.",
    category: "UPSC",
    subject: "General Knowledge",
    duration_minutes: 60,
    total_questions: 50,
    total_marks: 100,
    negative_marking: true,
    negative_marks_per_question: 0.33,
    test_type: "static",
    exam_name: "UPSC CSE",
    difficulty_distribution: { easy: 15, medium: 25, hard: 10 }
  },
  {
    name: "UPSC CSE History - Modern India",
    description: "Comprehensive test on Modern Indian History covering freedom struggle and post-independence era.",
    category: "UPSC",
    subject: "General Knowledge",
    duration_minutes: 60,
    total_questions: 50,
    total_marks: 100,
    negative_marking: true,
    negative_marks_per_question: 0.33,
    test_type: "static",
    exam_name: "UPSC CSE",
    difficulty_distribution: { easy: 15, medium: 25, hard: 10 }
  },
  {
    name: "UPSC CSE Geography - Physical",
    description: "Test on Physical Geography covering landforms, climate, vegetation, and natural resources.",
    category: "UPSC",
    subject: "General Knowledge",
    duration_minutes: 60,
    total_questions: 50,
    total_marks: 100,
    negative_marking: true,
    negative_marks_per_question: 0.33,
    test_type: "static",
    exam_name: "UPSC CSE",
    difficulty_distribution: { easy: 15, medium: 25, hard: 10 }
  },
  {
    name: "UPSC CSE Geography - India",
    description: "Test on Geography of India covering physical features, rivers, climate, and economic geography.",
    category: "UPSC",
    subject: "General Knowledge",
    duration_minutes: 60,
    total_questions: 50,
    total_marks: 100,
    negative_marking: true,
    negative_marks_per_question: 0.33,
    test_type: "static",
    exam_name: "UPSC CSE",
    difficulty_distribution: { easy: 15, medium: 25, hard: 10 }
  },
  {
    name: "UPSC CSE Indian Polity - Complete",
    description: "Comprehensive test on Indian Constitution, Fundamental Rights, Directive Principles, and Governance.",
    category: "UPSC",
    subject: "General Knowledge",
    duration_minutes: 90,
    total_questions: 75,
    total_marks: 150,
    negative_marking: true,
    negative_marks_per_question: 0.33,
    test_type: "static",
    exam_name: "UPSC CSE",
    difficulty_distribution: { easy: 20, medium: 40, hard: 15 }
  },
  {
    name: "UPSC CSE Current Affairs - 2024",
    description: "Latest current affairs test covering important events, policies, and developments of 2024.",
    category: "UPSC",
    subject: "General Knowledge",
    duration_minutes: 60,
    total_questions: 50,
    total_marks: 100,
    negative_marking: true,
    negative_marks_per_question: 0.33,
    test_type: "static",
    exam_name: "UPSC CSE",
    difficulty_distribution: { easy: 15, medium: 25, hard: 10 }
  },
  {
    name: "UPSC CSE Science & Technology",
    description: "Test on Science and Technology covering recent developments, space technology, and innovations.",
    category: "UPSC",
    subject: "General Knowledge",
    duration_minutes: 60,
    total_questions: 50,
    total_marks: 100,
    negative_marking: true,
    negative_marks_per_question: 0.33,
    test_type: "static",
    exam_name: "UPSC CSE",
    difficulty_distribution: { easy: 15, medium: 25, hard: 10 }
  },
  {
    name: "UPSC CSE Economics - Basic Concepts",
    description: "Test on fundamental concepts of Economics including Micro and Macro economics.",
    category: "UPSC",
    subject: "General Knowledge",
    duration_minutes: 60,
    total_questions: 50,
    total_marks: 100,
    negative_marking: true,
    negative_marks_per_question: 0.33,
    test_type: "static",
    exam_name: "UPSC CSE",
    difficulty_distribution: { easy: 15, medium: 25, hard: 10 }
  },
  // UPSC English Tests
  {
    name: "UPSC CSE English - Comprehension",
    description: "English comprehension test with passages and questions for UPSC CSE preparation.",
    category: "UPSC",
    subject: "English",
    duration_minutes: 60,
    total_questions: 30,
    total_marks: 60,
    negative_marking: true,
    negative_marks_per_question: 0.33,
    test_type: "static",
    exam_name: "UPSC CSE",
    difficulty_distribution: { easy: 10, medium: 15, hard: 5 }
  },
  {
    name: "UPSC CSE English - Grammar & Vocabulary",
    description: "Test on English grammar rules, vocabulary, and usage for UPSC CSE.",
    category: "UPSC",
    subject: "English",
    duration_minutes: 45,
    total_questions: 25,
    total_marks: 50,
    negative_marking: true,
    negative_marks_per_question: 0.33,
    test_type: "static",
    exam_name: "UPSC CSE",
    difficulty_distribution: { easy: 8, medium: 12, hard: 5 }
  },

  // SSC Tests - Maximum GK/GS
  {
    name: "SSC CGL General Awareness - Paper 1",
    description: "Comprehensive General Awareness test for SSC CGL covering History, Geography, Science, and Current Affairs.",
    category: "SSC",
    subject: "General Knowledge",
    duration_minutes: 60,
    total_questions: 50,
    total_marks: 50,
    negative_marking: true,
    negative_marks_per_question: 0.25,
    test_type: "static",
    exam_name: "SSC CGL",
    difficulty_distribution: { easy: 20, medium: 25, hard: 5 }
  },
  {
    name: "SSC CGL General Awareness - Paper 2",
    description: "Advanced General Awareness test covering Indian Polity, Economics, and Current Affairs for SSC CGL.",
    category: "SSC",
    subject: "General Knowledge",
    duration_minutes: 60,
    total_questions: 50,
    total_marks: 50,
    negative_marking: true,
    negative_marks_per_question: 0.25,
    test_type: "static",
    exam_name: "SSC CGL",
    difficulty_distribution: { easy: 15, medium: 30, hard: 5 }
  },
  {
    name: "SSC CGL History - Complete",
    description: "Complete test on Indian History from ancient to modern times for SSC CGL preparation.",
    category: "SSC",
    subject: "General Knowledge",
    duration_minutes: 45,
    total_questions: 40,
    total_marks: 40,
    negative_marking: true,
    negative_marks_per_question: 0.25,
    test_type: "static",
    exam_name: "SSC CGL",
    difficulty_distribution: { easy: 15, medium: 20, hard: 5 }
  },
  {
    name: "SSC CGL Geography - India & World",
    description: "Test on Geography of India and World covering physical, economic, and human geography.",
    category: "SSC",
    subject: "General Knowledge",
    duration_minutes: 45,
    total_questions: 40,
    total_marks: 40,
    negative_marking: true,
    negative_marks_per_question: 0.25,
    test_type: "static",
    exam_name: "SSC CGL",
    difficulty_distribution: { easy: 15, medium: 20, hard: 5 }
  },
  {
    name: "SSC CGL Science - Physics, Chemistry, Biology",
    description: "Comprehensive test on Science covering Physics, Chemistry, and Biology for SSC CGL.",
    category: "SSC",
    subject: "General Knowledge",
    duration_minutes: 45,
    total_questions: 40,
    total_marks: 40,
    negative_marking: true,
    negative_marks_per_question: 0.25,
    test_type: "static",
    exam_name: "SSC CGL",
    difficulty_distribution: { easy: 15, medium: 20, hard: 5 }
  },
  {
    name: "SSC CGL Current Affairs - 2024",
    description: "Latest current affairs test covering important events and developments of 2024 for SSC CGL.",
    category: "SSC",
    subject: "General Knowledge",
    duration_minutes: 45,
    total_questions: 40,
    total_marks: 40,
    negative_marking: true,
    negative_marks_per_question: 0.25,
    test_type: "static",
    exam_name: "SSC CGL",
    difficulty_distribution: { easy: 15, medium: 20, hard: 5 }
  },
  {
    name: "SSC CGL Indian Polity & Constitution",
    description: "Test on Indian Constitution, Fundamental Rights, Directive Principles, and Governance for SSC CGL.",
    category: "SSC",
    subject: "General Knowledge",
    duration_minutes: 45,
    total_questions: 40,
    total_marks: 40,
    negative_marking: true,
    negative_marks_per_question: 0.25,
    test_type: "static",
    exam_name: "SSC CGL",
    difficulty_distribution: { easy: 15, medium: 20, hard: 5 }
  },
  // SSC English Tests
  {
    name: "SSC CGL English - Comprehension",
    description: "English comprehension test with passages and questions for SSC CGL Tier 1 and Tier 2.",
    category: "SSC",
    subject: "English",
    duration_minutes: 60,
    total_questions: 25,
    total_marks: 25,
    negative_marking: true,
    negative_marks_per_question: 0.25,
    test_type: "static",
    exam_name: "SSC CGL",
    difficulty_distribution: { easy: 10, medium: 12, hard: 3 }
  },
  {
    name: "SSC CGL English - Grammar",
    description: "Test on English grammar including tenses, articles, prepositions, and sentence correction.",
    category: "SSC",
    subject: "English",
    duration_minutes: 45,
    total_questions: 20,
    total_marks: 20,
    negative_marking: true,
    negative_marks_per_question: 0.25,
    test_type: "static",
    exam_name: "SSC CGL",
    difficulty_distribution: { easy: 8, medium: 10, hard: 2 }
  },
  {
    name: "SSC CGL English - Vocabulary",
    description: "Test on English vocabulary including synonyms, antonyms, idioms, and phrases.",
    category: "SSC",
    subject: "English",
    duration_minutes: 45,
    total_questions: 20,
    total_marks: 20,
    negative_marking: true,
    negative_marks_per_question: 0.25,
    test_type: "static",
    exam_name: "SSC CGL",
    difficulty_distribution: { easy: 8, medium: 10, hard: 2 }
  },
  // SSC Mathematics Tests
  {
    name: "SSC CGL Mathematics - Arithmetic",
    description: "Test on Arithmetic including Percentage, Profit & Loss, Time & Work, and Ratio & Proportion.",
    category: "SSC",
    subject: "Mathematics",
    duration_minutes: 60,
    total_questions: 25,
    total_marks: 25,
    negative_marking: true,
    negative_marks_per_question: 0.5,
    test_type: "static",
    exam_name: "SSC CGL",
    difficulty_distribution: { easy: 10, medium: 12, hard: 3 }
  },
  {
    name: "SSC CGL Mathematics - Algebra",
    description: "Test on Algebra covering equations, inequalities, and algebraic expressions for SSC CGL.",
    category: "SSC",
    subject: "Mathematics",
    duration_minutes: 60,
    total_questions: 25,
    total_marks: 25,
    negative_marking: true,
    negative_marks_per_question: 0.5,
    test_type: "static",
    exam_name: "SSC CGL",
    difficulty_distribution: { easy: 10, medium: 12, hard: 3 }
  },
  {
    name: "SSC CGL Mathematics - Geometry",
    description: "Test on Geometry covering triangles, circles, quadrilaterals, and mensuration for SSC CGL.",
    category: "SSC",
    subject: "Mathematics",
    duration_minutes: 60,
    total_questions: 25,
    total_marks: 25,
    negative_marking: true,
    negative_marks_per_question: 0.5,
    test_type: "static",
    exam_name: "SSC CGL",
    difficulty_distribution: { easy: 10, medium: 12, hard: 3 }
  },

  // Railway Tests - Maximum GK/GS
  {
    name: "RRB NTPC General Awareness - Paper 1",
    description: "Comprehensive General Awareness test for Railway NTPC covering History, Geography, Science, and Current Affairs.",
    category: "Railway",
    subject: "General Knowledge",
    duration_minutes: 90,
    total_questions: 100,
    total_marks: 100,
    negative_marking: true,
    negative_marks_per_question: 0.25,
    test_type: "static",
    exam_name: "RRB NTPC",
    difficulty_distribution: { easy: 40, medium: 50, hard: 10 }
  },
  {
    name: "RRB NTPC General Awareness - Paper 2",
    description: "Advanced General Awareness test covering Indian Polity, Economics, and Railway-specific knowledge.",
    category: "Railway",
    subject: "General Knowledge",
    duration_minutes: 90,
    total_questions: 100,
    total_marks: 100,
    negative_marking: true,
    negative_marks_per_question: 0.25,
    test_type: "static",
    exam_name: "RRB NTPC",
    difficulty_distribution: { easy: 35, medium: 55, hard: 10 }
  },
  {
    name: "RRB NTPC History - Complete",
    description: "Complete test on Indian History from ancient to modern times for Railway NTPC preparation.",
    category: "Railway",
    subject: "General Knowledge",
    duration_minutes: 60,
    total_questions: 50,
    total_marks: 50,
    negative_marking: true,
    negative_marks_per_question: 0.25,
    test_type: "static",
    exam_name: "RRB NTPC",
    difficulty_distribution: { easy: 20, medium: 25, hard: 5 }
  },
  {
    name: "RRB NTPC Geography - India",
    description: "Test on Geography of India covering physical features, rivers, climate, and economic geography.",
    category: "Railway",
    subject: "General Knowledge",
    duration_minutes: 60,
    total_questions: 50,
    total_marks: 50,
    negative_marking: true,
    negative_marks_per_question: 0.25,
    test_type: "static",
    exam_name: "RRB NTPC",
    difficulty_distribution: { easy: 20, medium: 25, hard: 5 }
  },
  {
    name: "RRB NTPC Science - Complete",
    description: "Comprehensive test on Science covering Physics, Chemistry, and Biology for Railway NTPC.",
    category: "Railway",
    subject: "General Knowledge",
    duration_minutes: 60,
    total_questions: 50,
    total_marks: 50,
    negative_marking: true,
    negative_marks_per_question: 0.25,
    test_type: "static",
    exam_name: "RRB NTPC",
    difficulty_distribution: { easy: 20, medium: 25, hard: 5 }
  },
  {
    name: "RRB NTPC Current Affairs - 2024",
    description: "Latest current affairs test covering important events and developments of 2024 for Railway NTPC.",
    category: "Railway",
    subject: "General Knowledge",
    duration_minutes: 60,
    total_questions: 50,
    total_marks: 50,
    negative_marking: true,
    negative_marks_per_question: 0.25,
    test_type: "static",
    exam_name: "RRB NTPC",
    difficulty_distribution: { easy: 20, medium: 25, hard: 5 }
  },
  {
    name: "RRB NTPC Indian Polity",
    description: "Test on Indian Constitution, Fundamental Rights, and Governance for Railway NTPC.",
    category: "Railway",
    subject: "General Knowledge",
    duration_minutes: 60,
    total_questions: 50,
    total_marks: 50,
    negative_marking: true,
    negative_marks_per_question: 0.25,
    test_type: "static",
    exam_name: "RRB NTPC",
    difficulty_distribution: { easy: 20, medium: 25, hard: 5 }
  },
  // Railway English Tests
  {
    name: "RRB NTPC English - Comprehension",
    description: "English comprehension test with passages and questions for Railway NTPC.",
    category: "Railway",
    subject: "English",
    duration_minutes: 90,
    total_questions: 30,
    total_marks: 30,
    negative_marking: true,
    negative_marks_per_question: 0.25,
    test_type: "static",
    exam_name: "RRB NTPC",
    difficulty_distribution: { easy: 12, medium: 15, hard: 3 }
  },
  {
    name: "RRB NTPC English - Grammar & Vocabulary",
    description: "Test on English grammar and vocabulary for Railway NTPC preparation.",
    category: "Railway",
    subject: "English",
    duration_minutes: 60,
    total_questions: 25,
    total_marks: 25,
    negative_marking: true,
    negative_marks_per_question: 0.25,
    test_type: "static",
    exam_name: "RRB NTPC",
    difficulty_distribution: { easy: 10, medium: 12, hard: 3 }
  },
  // Railway Mathematics Tests
  {
    name: "RRB NTPC Mathematics - Arithmetic",
    description: "Test on Arithmetic including Percentage, Profit & Loss, Time & Work for Railway NTPC.",
    category: "Railway",
    subject: "Mathematics",
    duration_minutes: 90,
    total_questions: 30,
    total_marks: 30,
    negative_marking: true,
    negative_marks_per_question: 0.5,
    test_type: "static",
    exam_name: "RRB NTPC",
    difficulty_distribution: { easy: 12, medium: 15, hard: 3 }
  },
  {
    name: "RRB NTPC Mathematics - Algebra & Geometry",
    description: "Test on Algebra and Geometry for Railway NTPC preparation.",
    category: "Railway",
    subject: "Mathematics",
    duration_minutes: 90,
    total_questions: 30,
    total_marks: 30,
    negative_marking: true,
    negative_marks_per_question: 0.5,
    test_type: "static",
    exam_name: "RRB NTPC",
    difficulty_distribution: { easy: 12, medium: 15, hard: 3 }
  }
];

async function seedTests() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB\n');

    // Get admin user
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('No admin user found. Please create an admin user first.');
      process.exit(1);
    }

    console.log('=== Starting Tests Seeding ===\n');

    // Get categories and subjects
    const categories = await Category.find();
    const subjects = await Subject.find();

    let testCount = 0;
    let testQuestionCount = 0;

    // Create tests
    for (const testConfig of testConfigs) {
      // Find matching category
      const category = categories.find(c => 
        c.name.toLowerCase() === testConfig.category.toLowerCase()
      );
      
      if (!category) {
        console.log(`   ⚠ Category "${testConfig.category}" not found, skipping test: ${testConfig.name}`);
        continue;
      }

      // Find matching subject
      const subject = subjects.find(s => 
        s.name.toLowerCase() === testConfig.subject.toLowerCase() &&
        s.category_id.toString() === category._id.toString()
      );

      if (!subject) {
        console.log(`   ⚠ Subject "${testConfig.subject}" not found for category "${testConfig.category}", skipping test: ${testConfig.name}`);
        continue;
      }

      // Check if test already exists
      const existingTest = await Test.findOne({
        name: testConfig.name,
        category_id: category._id,
        subject_id: subject._id
      });

      if (existingTest) {
        console.log(`   Test "${testConfig.name}" already exists, skipping...`);
        continue;
      }

      // Create test
      const test = await Test.create({
        name: testConfig.name,
        description: testConfig.description,
        category_id: category._id,
        subject_id: subject._id,
        duration_minutes: testConfig.duration_minutes,
        total_marks: testConfig.total_marks,
        total_questions: testConfig.total_questions,
        negative_marking: testConfig.negative_marking,
        negative_marks_per_question: testConfig.negative_marks_per_question,
        test_type: testConfig.test_type,
        difficulty_distribution: testConfig.difficulty_distribution,
        exam_name: testConfig.exam_name,
        is_paid: false,
        price: 0,
        is_active: true,
        status: 'published',
        created_by: adminUser._id
      });

      console.log(`   ✓ Created test: ${testConfig.name}`);

      // Get questions for this test
      const questions = await Question.find({
        category_id: category._id,
        subject_id: subject._id
      }).limit(testConfig.total_questions);

      if (questions.length === 0) {
        console.log(`   ⚠ No questions found for ${testConfig.name}, test created without questions`);
        testCount++;
        continue;
      }

      // Assign questions to test
      for (let i = 0; i < Math.min(questions.length, testConfig.total_questions); i++) {
        await TestQuestion.create({
          test_id: test._id,
          question_id: questions[i]._id,
          question_order: i + 1
        });
        testQuestionCount++;
      }

      // Update test with actual question count
      test.total_questions = Math.min(questions.length, testConfig.total_questions);
      await test.save();

      testCount++;
    }

    console.log(`\n=== Seeding Complete ===`);
    console.log(`\nSummary:`);
    console.log(`- Tests created: ${testCount}`);
    console.log(`- Test questions assigned: ${testQuestionCount}`);
    console.log('\n✅ All tests have been seeded successfully!');
    console.log('\nNote: Tests are created with questions from the database.');
    console.log('Make sure you have run seed-gk script first to populate questions.');

  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed.');
  }
}

// Run the seeding
seedTests()
  .then(() => {
    console.log('\n✅ Seed script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seed script failed:', error);
    process.exit(1);
  });

