import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Job from '../models/Job.js';
import Material from '../models/Material.js';
import Category from '../models/Category.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import User from '../models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://snehpnp:snehpnp@newsmartalgo.n5bxaxz.mongodb.net/easy-exam-gen';

// Jobs Data
const jobsData = [
  // Government Jobs - UPSC
  {
    title: "UPSC Civil Services Examination 2024",
    company: "Union Public Service Commission",
    description: "Recruitment for IAS, IPS, IFS and other Group A and Group B services. One of the most prestigious examinations in India.",
    location: "All India",
    salary: "As per 7th Pay Commission (Rs. 56,100 - 2,50,000)",
    job_type: "Full-time",
    category: "Government",
    exam_name: "UPSC CSE",
    application_deadline: new Date("2024-03-20"),
    application_link: "https://upsc.gov.in",
    is_featured: true
  },
  {
    title: "UPSC Engineering Services Examination",
    company: "Union Public Service Commission",
    description: "Recruitment for various engineering services in government departments including Railways, PWD, CPWD, etc.",
    location: "All India",
    salary: "Rs. 56,100 - 1,77,500",
    job_type: "Full-time",
    category: "Government",
    exam_name: "UPSC ESE",
    application_deadline: new Date("2024-04-15"),
    application_link: "https://upsc.gov.in",
    is_featured: true
  },
  {
    title: "UPSC Combined Defence Services (CDS)",
    company: "Union Public Service Commission",
    description: "Recruitment for Indian Military Academy, Indian Naval Academy, Air Force Academy, and Officers Training Academy.",
    location: "All India",
    salary: "As per Defence Pay Matrix",
    job_type: "Full-time",
    category: "Defence",
    exam_name: "UPSC CDS",
    application_deadline: new Date("2024-05-10"),
    application_link: "https://upsc.gov.in"
  },
  {
    title: "UPSC Combined Medical Services",
    company: "Union Public Service Commission",
    description: "Recruitment for Medical Officers in various government hospitals and health services.",
    location: "All India",
    salary: "Rs. 56,100 - 1,77,500",
    job_type: "Full-time",
    category: "Medical",
    exam_name: "UPSC CMS",
    application_deadline: new Date("2024-06-01"),
    application_link: "https://upsc.gov.in"
  },

  // Government Jobs - SSC
  {
    title: "SSC CGL (Combined Graduate Level) 2024",
    company: "Staff Selection Commission",
    description: "Recruitment for various Group B and Group C posts in Ministries, Departments, and Organizations of Government of India.",
    location: "All India",
    salary: "Rs. 25,500 - 1,12,400",
    job_type: "Full-time",
    category: "Government",
    exam_name: "SSC CGL",
    application_deadline: new Date("2024-04-30"),
    application_link: "https://ssc.nic.in",
    is_featured: true
  },
  {
    title: "SSC CHSL (Combined Higher Secondary Level)",
    company: "Staff Selection Commission",
    description: "Recruitment for Lower Division Clerk (LDC), Junior Secretariat Assistant (JSA), Postal Assistant, and Data Entry Operator posts.",
    location: "All India",
    salary: "Rs. 19,900 - 63,200",
    job_type: "Full-time",
    category: "Government",
    exam_name: "SSC CHSL",
    application_deadline: new Date("2024-05-15"),
    application_link: "https://ssc.nic.in"
  },
  {
    title: "SSC MTS (Multi-Tasking Staff)",
    company: "Staff Selection Commission",
    description: "Recruitment for Multi-Tasking Staff in various Central Government Ministries, Departments, and Offices.",
    location: "All India",
    salary: "Rs. 18,000 - 56,900",
    job_type: "Full-time",
    category: "Government",
    exam_name: "SSC MTS",
    application_deadline: new Date("2024-06-20"),
    application_link: "https://ssc.nic.in"
  },
  {
    title: "SSC CPO (Central Police Organization)",
    company: "Staff Selection Commission",
    description: "Recruitment for Sub-Inspector posts in Delhi Police, CAPFs, and Assistant Sub-Inspector in CISF.",
    location: "All India",
    salary: "Rs. 35,400 - 1,12,400",
    job_type: "Full-time",
    category: "Police",
    exam_name: "SSC CPO",
    application_deadline: new Date("2024-07-10"),
    application_link: "https://ssc.nic.in"
  },

  // Railway Jobs
  {
    title: "RRB NTPC (Non-Technical Popular Categories)",
    company: "Railway Recruitment Board",
    description: "Recruitment for various non-technical posts like Commercial Apprentice, Traffic Apprentice, Goods Guard, etc.",
    location: "All India",
    salary: "Rs. 19,900 - 35,400",
    job_type: "Full-time",
    category: "Railway",
    exam_name: "RRB NTPC",
    application_deadline: new Date("2024-05-25"),
    application_link: "https://indianrailways.gov.in",
    is_featured: true
  },
  {
    title: "RRB JE (Junior Engineer)",
    company: "Railway Recruitment Board",
    description: "Recruitment for Junior Engineer posts in Civil, Mechanical, Electrical, Electronics, and Signal & Telecommunication departments.",
    location: "All India",
    salary: "Rs. 35,400 - 1,12,400",
    job_type: "Full-time",
    category: "Railway",
    exam_name: "RRB JE",
    application_deadline: new Date("2024-06-15"),
    application_link: "https://indianrailways.gov.in"
  },
  {
    title: "RRB ALP (Assistant Loco Pilot)",
    company: "Railway Recruitment Board",
    description: "Recruitment for Assistant Loco Pilot and Technician posts in Indian Railways.",
    location: "All India",
    salary: "Rs. 19,900 - 63,200",
    job_type: "Full-time",
    category: "Railway",
    exam_name: "RRB ALP",
    application_deadline: new Date("2024-07-05"),
    application_link: "https://indianrailways.gov.in"
  },
  {
    title: "RRB Group D",
    company: "Railway Recruitment Board",
    description: "Recruitment for Level-1 posts including Track Maintainer, Helper, Porter, Gateman, etc.",
    location: "All India",
    salary: "Rs. 18,000 - 56,900",
    job_type: "Full-time",
    category: "Railway",
    exam_name: "RRB Group D",
    application_deadline: new Date("2024-08-01"),
    application_link: "https://indianrailways.gov.in"
  },

  // Banking Jobs
  {
    title: "IBPS PO (Probationary Officer)",
    company: "Institute of Banking Personnel Selection",
    description: "Recruitment for Probationary Officer posts in various Public Sector Banks across India.",
    location: "All India",
    salary: "Rs. 23,700 - 42,020",
    job_type: "Full-time",
    category: "Banking",
    exam_name: "IBPS PO",
    application_deadline: new Date("2024-04-20"),
    application_link: "https://ibps.in",
    is_featured: true
  },
  {
    title: "IBPS Clerk",
    company: "Institute of Banking Personnel Selection",
    description: "Recruitment for Clerk posts in Public Sector Banks.",
    location: "All India",
    salary: "Rs. 19,900 - 47,920",
    job_type: "Full-time",
    category: "Banking",
    exam_name: "IBPS Clerk",
    application_deadline: new Date("2024-05-10"),
    application_link: "https://ibps.in"
  },
  {
    title: "SBI PO (Probationary Officer)",
    company: "State Bank of India",
    description: "Recruitment for Probationary Officer posts in State Bank of India.",
    location: "All India",
    salary: "Rs. 27,620 - 42,020",
    job_type: "Full-time",
    category: "Banking",
    exam_name: "SBI PO",
    application_deadline: new Date("2024-06-05"),
    application_link: "https://sbi.co.in",
    is_featured: true
  },
  {
    title: "RBI Grade B Officer",
    company: "Reserve Bank of India",
    description: "Recruitment for Grade B Officers in Reserve Bank of India - one of the most prestigious banking jobs.",
    location: "All India",
    salary: "Rs. 55,200 - 99,750",
    job_type: "Full-time",
    category: "Banking",
    exam_name: "RBI Grade B",
    application_deadline: new Date("2024-07-15"),
    application_link: "https://rbi.org.in",
    is_featured: true
  },

  // Defence Jobs
  {
    title: "NDA (National Defence Academy)",
    company: "Union Public Service Commission",
    description: "Recruitment for Army, Navy, and Air Force through National Defence Academy.",
    location: "All India",
    salary: "As per Defence Pay Matrix",
    job_type: "Full-time",
    category: "Defence",
    exam_name: "NDA",
    application_deadline: new Date("2024-05-20"),
    application_link: "https://upsc.gov.in"
  },
  {
    title: "Indian Army Technical Graduate Course",
    company: "Indian Army",
    description: "Recruitment for Technical Graduate Course in Indian Army for Engineering graduates.",
    location: "All India",
    salary: "As per Defence Pay Matrix",
    job_type: "Full-time",
    category: "Defence",
    exam_name: "Indian Army TGC",
    application_deadline: new Date("2024-06-30"),
    application_link: "https://joinindianarmy.nic.in"
  }
];

// Materials Data
const materialsData = [
  // PDF Materials
  {
    title: "UPSC CSE Complete Syllabus PDF",
    description: "Comprehensive syllabus guide for UPSC Civil Services Examination covering all subjects and topics.",
    material_type: "pdf",
    file_url: "https://example.com/materials/upsc-cse-syllabus.pdf",
    file_size: 2048000,
    category: "UPSC",
    subject: "General Knowledge",
    is_paid: false
  },
  {
    title: "SSC CGL Previous Year Papers (2020-2023)",
    description: "Collection of previous year question papers with detailed solutions for SSC CGL examination.",
    material_type: "pdf",
    file_url: "https://example.com/materials/ssc-cgl-papers.pdf",
    file_size: 5120000,
    category: "SSC",
    subject: "Mathematics",
    is_paid: false
  },
  {
    title: "Railway NTPC Study Material",
    description: "Complete study material for Railway NTPC examination covering all subjects.",
    material_type: "pdf",
    file_url: "https://example.com/materials/rrb-ntpc-material.pdf",
    file_size: 3072000,
    category: "Railway",
    subject: "General Knowledge",
    is_paid: false
  },
  {
    title: "Indian History Complete Notes",
    description: "Comprehensive notes on Indian History from ancient to modern times, perfect for competitive exams.",
    material_type: "pdf",
    file_url: "https://example.com/materials/indian-history-notes.pdf",
    file_size: 4096000,
    category: "UPSC",
    subject: "General Knowledge",
    is_paid: false
  },
  {
    title: "Geography of India - Complete Guide",
    description: "Detailed study material covering physical, economic, and human geography of India.",
    material_type: "pdf",
    file_url: "https://example.com/materials/india-geography.pdf",
    file_size: 3584000,
    category: "SSC",
    subject: "General Knowledge",
    is_paid: false
  },
  {
    title: "Mathematics Formula Book",
    description: "Complete collection of formulas for Arithmetic, Algebra, Geometry, and Trigonometry.",
    material_type: "formula",
    file_url: "https://example.com/materials/math-formulas.pdf",
    file_size: 1536000,
    category: "Railway",
    subject: "Mathematics",
    is_paid: false
  },
  {
    title: "English Grammar Rules",
    description: "Complete guide to English grammar rules with examples and practice exercises.",
    material_type: "note",
    file_url: "https://example.com/materials/english-grammar.pdf",
    file_size: 2560000,
    category: "UPSC",
    subject: "English",
    is_paid: false
  },
  {
    title: "Reasoning Tricks and Shortcuts",
    description: "Important tricks and shortcuts for solving reasoning questions quickly and accurately.",
    material_type: "note",
    file_url: "https://example.com/materials/reasoning-tricks.pdf",
    file_size: 2048000,
    category: "SSC",
    subject: "Reasoning",
    is_paid: false
  },

  // Video Materials
  {
    title: "UPSC CSE Strategy and Preparation Tips",
    description: "Video lecture on complete strategy for UPSC Civil Services Examination preparation.",
    material_type: "video",
    file_url: "https://example.com/videos/upsc-strategy.mp4",
    duration: 3600,
    thumbnail_url: "https://example.com/thumbnails/upsc-strategy.jpg",
    category: "UPSC",
    subject: "General Knowledge",
    is_paid: false
  },
  {
    title: "SSC CGL Mathematics - Complete Course",
    description: "Comprehensive video course covering all topics of Mathematics for SSC CGL.",
    material_type: "video",
    file_url: "https://example.com/videos/ssc-math-course.mp4",
    duration: 7200,
    thumbnail_url: "https://example.com/thumbnails/ssc-math.jpg",
    category: "SSC",
    subject: "Mathematics",
    is_paid: false
  },
  {
    title: "Railway NTPC General Awareness",
    description: "Video series covering important topics of General Awareness for Railway NTPC.",
    material_type: "video",
    file_url: "https://example.com/videos/railway-gk.mp4",
    duration: 5400,
    thumbnail_url: "https://example.com/thumbnails/railway-gk.jpg",
    category: "Railway",
    subject: "General Knowledge",
    is_paid: false
  },
  {
    title: "English Vocabulary Building",
    description: "Learn important English words with meanings, synonyms, and usage examples.",
    material_type: "video",
    file_url: "https://example.com/videos/english-vocab.mp4",
    duration: 4500,
    thumbnail_url: "https://example.com/thumbnails/english-vocab.jpg",
    category: "UPSC",
    subject: "English",
    is_paid: false
  },
  {
    title: "Reasoning - Logical Puzzles",
    description: "Learn to solve complex logical puzzles and reasoning questions step by step.",
    material_type: "video",
    file_url: "https://example.com/videos/reasoning-puzzles.mp4",
    duration: 4800,
    thumbnail_url: "https://example.com/thumbnails/reasoning-puzzles.jpg",
    category: "SSC",
    subject: "Reasoning",
    is_paid: false
  },

  // Theory Materials
  {
    title: "Indian Polity - Complete Theory",
    description: "Comprehensive theory notes on Indian Constitution, Parliament, Judiciary, and Governance.",
    material_type: "theory",
    file_url: "https://example.com/materials/indian-polity.pdf",
    file_size: 5120000,
    category: "UPSC",
    subject: "General Knowledge",
    is_paid: false
  },
  {
    title: "Economics - Basic Concepts",
    description: "Fundamental concepts of Economics including Micro and Macro economics for competitive exams.",
    material_type: "theory",
    file_url: "https://example.com/materials/economics-basics.pdf",
    file_size: 3072000,
    category: "SSC",
    subject: "General Knowledge",
    is_paid: false
  },
  {
    title: "Science and Technology - Current Affairs",
    description: "Latest developments in Science and Technology relevant for competitive examinations.",
    material_type: "theory",
    file_url: "https://example.com/materials/sci-tech.pdf",
    file_size: 2560000,
    category: "Railway",
    subject: "General Knowledge",
    is_paid: false
  },
  {
    title: "Current Affairs - Monthly Compilation",
    description: "Monthly compilation of important current affairs for competitive exams.",
    material_type: "note",
    file_url: "https://example.com/materials/current-affairs.pdf",
    file_size: 2048000,
    category: "UPSC",
    subject: "General Knowledge",
    is_paid: false
  }
];

async function seedJobsAndMaterials() {
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

    console.log('=== Starting Jobs and Materials Seeding ===\n');

    // Get categories and subjects for materials
    const categories = await Category.find();
    const subjects = await Subject.find();
    const topics = await Topic.find();

    // 1. Create Jobs
    console.log('1. Creating Jobs...');
    let jobCount = 0;
    for (const jobData of jobsData) {
      const existing = await Job.findOne({ 
        title: jobData.title,
        exam_name: jobData.exam_name
      });
      
      if (existing) {
        console.log(`   Job "${jobData.title}" already exists, skipping...`);
      } else {
        await Job.create({
          ...jobData,
          created_by: adminUser._id,
          source: 'manual'
        });
        jobCount++;
        console.log(`   ✓ Created job: ${jobData.title}`);
      }
    }
    console.log(`\n   Total ${jobCount} jobs created!`);

    // 2. Create Materials
    console.log('\n2. Creating Materials...');
    let materialCount = 0;
    
    for (const materialData of materialsData) {
      // Find matching category
      const category = categories.find(c => 
        c.name.toLowerCase() === materialData.category.toLowerCase()
      );
      
      // Find matching subject
      const subject = subjects.find(s => 
        s.name.toLowerCase() === materialData.subject.toLowerCase() &&
        (category ? s.category_id.toString() === category._id.toString() : true)
      );
      
      // Find matching topic (optional)
      const topic = subject ? topics.find(t => 
        t.subject_id.toString() === subject._id.toString()
      ) : null;

      const material = {
        title: materialData.title,
        description: materialData.description,
        material_type: materialData.material_type,
        file_url: materialData.file_url,
        file_size: materialData.file_size || null,
        duration: materialData.duration || null,
        thumbnail_url: materialData.thumbnail_url || null,
        category_id: category?._id || null,
        subject_id: subject?._id || null,
        topic_id: topic?._id || null,
        is_paid: materialData.is_paid || false,
        price: materialData.is_paid ? 99 : 0,
        is_active: true,
        created_by: adminUser._id
      };

      const existing = await Material.findOne({ 
        title: materialData.title,
        material_type: materialData.material_type
      });
      
      if (existing) {
        console.log(`   Material "${materialData.title}" already exists, skipping...`);
      } else {
        await Material.create(material);
        materialCount++;
        console.log(`   ✓ Created material: ${materialData.title} (${materialData.material_type})`);
      }
    }

    console.log(`\n   Total ${materialCount} materials created!`);

    console.log('\n=== Seeding Complete ===');
    console.log(`\nSummary:`);
    console.log(`- Jobs: ${jobCount}`);
    console.log(`- Materials: ${materialCount}`);
    console.log('\n✅ All jobs and materials have been seeded successfully!');

  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed.');
  }
}

// Run the seeding
seedJobsAndMaterials()
  .then(() => {
    console.log('\n✅ Seed script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seed script failed:', error);
    process.exit(1);
  });

