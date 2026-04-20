import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Question from '../models/Question.js';
import Level from '../models/Level.js';
import Topic from '../models/Topic.js';
import Subject from '../models/Subject.js';
import Category from '../models/Category.js';

dotenv.config();

// Current Affairs questions for Level 1
const currentAffairsQuestions = [
  {
    question_text: "Which country hosted the G20 Summit in 2023?",
    option_a: "India",
    option_b: "Brazil",
    option_c: "Indonesia",
    option_d: "Japan",
    correct_answer: 0,
    explanation: "India hosted the G20 Summit in 2023. The summit was held in New Delhi in September 2023."
  },
  {
    question_text: "Who is the current Prime Minister of India (as of 2024)?",
    option_a: "Narendra Modi",
    option_b: "Rahul Gandhi",
    option_c: "Mamata Banerjee",
    option_d: "Arvind Kejriwal",
    correct_answer: 0,
    explanation: "Narendra Modi is the current Prime Minister of India, serving since 2014."
  },
  {
    question_text: "Which Indian state recently became the first to implement a Universal Basic Income scheme?",
    option_a: "Kerala",
    option_b: "Tamil Nadu",
    option_c: "Sikkim",
    option_d: "Goa",
    correct_answer: 0,
    explanation: "Kerala has been working on implementing a Universal Basic Income scheme, making it a pioneer in this area in India."
  },
  {
    question_text: "What is the name of India's first indigenous aircraft carrier?",
    option_a: "INS Vikrant",
    option_b: "INS Vikramaditya",
    option_c: "INS Viraat",
    option_d: "INS Vishal",
    correct_answer: 0,
    explanation: "INS Vikrant is India's first indigenously built aircraft carrier, commissioned in 2022."
  },
  {
    question_text: "Which space mission did ISRO launch to study the Sun in 2023?",
    option_a: "Aditya-L1",
    option_b: "Chandrayaan-3",
    option_c: "Mangalyaan-2",
    option_d: "Gaganyaan",
    correct_answer: 0,
    explanation: "Aditya-L1 is India's first space-based mission to study the Sun, launched in September 2023."
  },
  {
    question_text: "What is the theme of India's G20 Presidency in 2023?",
    option_a: "Vasudhaiva Kutumbakam - One Earth, One Family, One Future",
    option_b: "Building a Better World",
    option_c: "Sustainable Development",
    option_d: "Global Cooperation",
    correct_answer: 0,
    explanation: "The theme of India's G20 Presidency was 'Vasudhaiva Kutumbakam - One Earth, One Family, One Future', reflecting India's philosophy of universal brotherhood."
  },
  {
    question_text: "Which Indian city was declared the cleanest city in India in Swachh Survekshan 2023?",
    option_a: "Indore",
    option_b: "Surat",
    option_c: "Mysuru",
    option_d: "Chandigarh",
    correct_answer: 0,
    explanation: "Indore has consistently been ranked as the cleanest city in India in Swachh Survekshan surveys."
  },
  {
    question_text: "What is the name of India's digital payment system launched by NPCI?",
    option_a: "UPI (Unified Payments Interface)",
    option_b: "BHIM",
    option_c: "Paytm",
    option_d: "PhonePe",
    correct_answer: 0,
    explanation: "UPI (Unified Payments Interface) is India's real-time payment system developed by NPCI, revolutionizing digital payments in India."
  },
  {
    question_text: "Which Indian state became the first to achieve 100% organic farming?",
    option_a: "Sikkim",
    option_b: "Himachal Pradesh",
    option_c: "Kerala",
    option_d: "Goa",
    correct_answer: 0,
    explanation: "Sikkim became the first state in India to achieve 100% organic farming, a milestone achieved in 2016."
  },
  {
    question_text: "What is the name of India's first bullet train project?",
    option_a: "Mumbai-Ahmedabad High Speed Rail",
    option_b: "Delhi-Mumbai High Speed Rail",
    option_c: "Chennai-Bangalore High Speed Rail",
    option_d: "Kolkata-Delhi High Speed Rail",
    correct_answer: 0,
    explanation: "The Mumbai-Ahmedabad High Speed Rail (MAHSR) is India's first bullet train project, being developed with Japanese collaboration."
  },
  {
    question_text: "Which Indian state recently launched the 'Har Ghar Jal' scheme?",
    option_a: "All states (Central Government Scheme)",
    option_b: "Rajasthan",
    option_c: "Gujarat",
    option_d: "Maharashtra",
    correct_answer: 0,
    explanation: "Har Ghar Jal is a central government scheme under Jal Jeevan Mission, aiming to provide tap water connection to every rural household."
  },
  {
    question_text: "What is the name of India's first indigenously developed COVID-19 vaccine?",
    option_a: "Covaxin",
    option_b: "Covishield",
    option_c: "Sputnik V",
    option_d: "Moderna",
    correct_answer: 0,
    explanation: "Covaxin (BBV152) is India's first indigenously developed COVID-19 vaccine, developed by Bharat Biotech."
  },
  {
    question_text: "Which Indian city hosted the 2023 World Cup Cricket final?",
    option_a: "Ahmedabad",
    option_b: "Mumbai",
    option_c: "Kolkata",
    option_d: "Chennai",
    correct_answer: 0,
    explanation: "Ahmedabad's Narendra Modi Stadium hosted the 2023 ICC Cricket World Cup final between India and Australia."
  },
  {
    question_text: "What is the name of India's first semi-high speed train?",
    option_a: "Vande Bharat Express",
    option_b: "Gatimaan Express",
    option_c: "Tejas Express",
    option_d: "Rajdhani Express",
    correct_answer: 0,
    explanation: "Vande Bharat Express is India's first semi-high speed train, also known as Train 18, manufactured indigenously."
  },
  {
    question_text: "Which Indian state recently became the first to implement 100% digital governance?",
    option_a: "Kerala",
    option_b: "Karnataka",
    option_c: "Tamil Nadu",
    option_d: "Andhra Pradesh",
    correct_answer: 0,
    explanation: "Kerala has been a pioneer in digital governance, implementing various e-governance initiatives."
  },
  {
    question_text: "What is the name of India's first private space company to launch a rocket?",
    option_a: "Skyroot Aerospace",
    option_b: "AgniKul Cosmos",
    option_c: "Bellatrix Aerospace",
    option_d: "Dhruva Space",
    correct_answer: 0,
    explanation: "Skyroot Aerospace became India's first private company to successfully launch a rocket (Vikram-S) in November 2022."
  },
  {
    question_text: "Which Indian city was selected as the first UNESCO World Heritage City in India?",
    option_a: "Ahmedabad",
    option_b: "Jaipur",
    option_c: "Delhi",
    option_d: "Mumbai",
    correct_answer: 0,
    explanation: "Ahmedabad became India's first UNESCO World Heritage City in 2017, recognized for its rich architectural heritage."
  },
  {
    question_text: "What is the name of India's first indigenously developed 5G technology?",
    option_a: "5Gi",
    option_b: "5G India",
    option_c: "Bharat 5G",
    option_d: "Make in India 5G",
    correct_answer: 0,
    explanation: "5Gi is India's indigenously developed 5G standard, developed by IIT Hyderabad and IIT Madras."
  },
  {
    question_text: "Which Indian state recently became the first to achieve 100% electrification of households?",
    option_a: "All states (Saubhagya Scheme)",
    option_b: "Gujarat",
    option_c: "Maharashtra",
    option_d: "Karnataka",
    correct_answer: 0,
    explanation: "Under the Saubhagya scheme, all states in India have achieved 100% household electrification."
  },
  {
    question_text: "What is the name of India's first indigenously developed fighter aircraft?",
    option_a: "Tejas",
    option_b: "HAL AMCA",
    option_c: "HAL LCA",
    option_d: "Sukhoi Su-30",
    correct_answer: 0,
    explanation: "Tejas (HAL LCA) is India's first indigenously developed light combat aircraft, designed and manufactured by HAL."
  },
  {
    question_text: "Which Indian state recently launched the 'One Nation, One Ration Card' scheme?",
    option_a: "All states (Central Government Scheme)",
    option_b: "Andhra Pradesh",
    option_c: "Telangana",
    option_d: "Karnataka",
    correct_answer: 0,
    explanation: "One Nation, One Ration Card is a central government scheme that allows beneficiaries to access their food grains from any Fair Price Shop in the country."
  }
];

async function addCurrentAffairsQuestions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/easy-exam-gen');
    console.log('Connected to MongoDB');

    // Find Railways category
    const railwaysCategory = await Category.findOne({ 
      name: { $regex: /railway/i } 
    });
    
    if (!railwaysCategory) {
      console.error('Railways category not found!');
      process.exit(1);
    }
    console.log(`Found category: ${railwaysCategory.name}`);

    // Find General Knowledge subject under Railways
    const gkSubject = await Subject.findOne({ 
      category_id: railwaysCategory._id,
      name: { $regex: /general knowledge|gk/i } 
    });
    
    if (!gkSubject) {
      console.error('General Knowledge subject not found under Railways!');
      process.exit(1);
    }
    console.log(`Found subject: ${gkSubject.name}`);

    // Find Current Affairs topic under General Knowledge
    const currentAffairsTopic = await Topic.findOne({ 
      subject_id: gkSubject._id,
      name: { $regex: /current affair/i } 
    });
    
    if (!currentAffairsTopic) {
      console.error('Current Affairs topic not found under General Knowledge!');
      process.exit(1);
    }
    console.log(`Found topic: ${currentAffairsTopic.name}`);

    // Find or create Level 1
    let level1 = await Level.findOne({ 
      topic_id: currentAffairsTopic._id, 
      level_number: 1 
    });

    if (!level1) {
      // Create Level 1 if it doesn't exist
      level1 = new Level({
        level_number: 1,
        topic_id: currentAffairsTopic._id,
        subject_id: gkSubject._id,
        category_id: railwaysCategory._id,
        name: "Level 1 - Current Affairs Basics",
        description: "Basic level questions on current affairs",
        total_questions: 1000,
        skip_test_questions: 30,
        skip_test_pass_percentage: 80,
        is_active: true
      });
      await level1.save();
      console.log('Created Level 1');
    } else {
      console.log('Level 1 already exists');
    }

    // Check existing questions for this topic and level
    const existingQuestions = await Question.find({
      $or: [
        { topic_id: currentAffairsTopic._id },
        { topic_ids: currentAffairsTopic._id }
      ],
      difficulty_level: 1
    });

    console.log(`Found ${existingQuestions.length} existing questions for Level 1`);

    // Add questions
    let addedCount = 0;
    const categoryId = railwaysCategory._id;
    const subjectId = gkSubject._id;
    const topicId = currentAffairsTopic._id;

    for (let i = 0; i < currentAffairsQuestions.length; i++) {
      const qData = currentAffairsQuestions[i];
      const questionNum = existingQuestions.length + i + 1;

      // Check if question already exists
      const existing = await Question.findOne({
        question_text: qData.question_text,
        topic_id: topicId
      });

      if (existing) {
        console.log(`Question ${questionNum} already exists, skipping...`);
        continue;
      }

      const question = new Question({
        question_text: qData.question_text,
        option_a: qData.option_a,
        option_b: qData.option_b,
        option_c: qData.option_c,
        option_d: qData.option_d,
        correct_answer: qData.correct_answer,
        explanation: qData.explanation,
        category_id: categoryId,
        subject_id: subjectId,
        topic_id: topicId,
        category_ids: [categoryId],
        subject_ids: [subjectId],
        topic_ids: [topicId],
        difficulty_level: 1,
        time_duration: 60,
        question_reference: `L1-CA-${questionNum}`,
        exam_names: [railwaysCategory.name]
      });

      await question.save();
      addedCount++;
      console.log(`✓ Added question ${questionNum}: ${qData.question_text.substring(0, 50)}...`);
    }

    console.log(`\n✅ Successfully added ${addedCount} questions for Railways > General Knowledge > Current Affairs > Level 1`);
    console.log(`Total questions now: ${existingQuestions.length + addedCount}`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the script
addCurrentAffairsQuestions();

