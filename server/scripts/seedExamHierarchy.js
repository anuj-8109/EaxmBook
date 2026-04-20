import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../models/Category.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Test from '../models/Test.js';
import Question from '../models/Question.js';

dotenv.config();

// Real Indian Government Exams Hierarchy Structure
const examHierarchy = {
  "All India Exams": {
    icon: "🇮🇳",
    description: "सभी भारतीय सरकारी परीक्षाएं",
    children: {
      "UPSC": {
        icon: "📜",
        description: "संघ लोक सेवा आयोग",
        children: {
          "Civil Services": {
            icon: "🏛️",
            description: "IAS, IPS, IFS आदि",
            children: {}
          },
          "Engineering Services (ESE)": {
            icon: "⚙️",
            description: "इंजीनियरिंग सेवा परीक्षा",
            children: {}
          },
          "CDS": {
            icon: "🎖️",
            description: "संयुक्त रक्षा सेवा परीक्षा",
            children: {}
          },
          "NDA": {
            icon: "🪖",
            description: "राष्ट्रीय रक्षा अकादमी",
            children: {}
          }
        }
      },
      "SSC": {
        icon: "📋",
        description: "कर्मचारी चयन आयोग",
        children: {
          "SSC CGL": {
            icon: "📊",
            description: "संयुक्त स्नातक स्तर परीक्षा",
            children: {}
          },
          "SSC CHSL": {
            icon: "📝",
            description: "संयुक्त उच्चतर माध्यमिक स्तर परीक्षा",
            children: {}
          },
          "SSC MTS": {
            icon: "🔧",
            description: "मल्टी-टास्किंग स्टाफ परीक्षा",
            children: {}
          },
          "SSC JE": {
            icon: "🔩",
            description: "जूनियर इंजीनियर परीक्षा",
            children: {}
          },
          "SSC GD": {
            icon: "👮",
            description: "सामान्य ड्यूटी कांस्टेबल",
            children: {}
          }
        }
      },
      "Banking": {
        icon: "🏦",
        description: "बैंकिंग परीक्षाएं",
        children: {
          "IBPS PO": {
            icon: "💼",
            description: "IBPS प्रोबेशनरी ऑफिसर",
            children: {}
          },
          "IBPS Clerk": {
            icon: "📄",
            description: "IBPS क्लर्क",
            children: {}
          },
          "SBI PO": {
            icon: "🏛️",
            description: "SBI प्रोबेशनरी ऑफिसर",
            children: {}
          },
          "SBI Clerk": {
            icon: "📑",
            description: "SBI क्लर्क",
            children: {}
          },
          "RBI Grade B": {
            icon: "💰",
            description: "RBI ग्रेड B",
            children: {}
          }
        }
      },
      "Railway": {
        icon: "🚂",
        description: "रेलवे परीक्षाएं",
        children: {
          "RRB NTPC": {
            icon: "🚄",
            description: "रेलवे NTPC",
            children: {}
          },
          "RRB Group D": {
            icon: "🔧",
            description: "रेलवे Group D",
            children: {}
          },
          "RRB JE": {
            icon: "⚙️",
            description: "रेलवे जूनियर इंजीनियर",
            children: {}
          }
        }
      },
      "Defence": {
        icon: "🛡️",
        description: "रक्षा सेवाएं",
        children: {
          "Army": {
            icon: "🎖️",
            description: "थल सेना",
            children: {}
          },
          "Navy": {
            icon: "⚓",
            description: "नौसेना",
            children: {}
          },
          "Air Force": {
            icon: "✈️",
            description: "वायु सेना",
            children: {}
          }
        }
      },
      "Teaching": {
        icon: "👨‍🏫",
        description: "शिक्षक परीक्षाएं",
        children: {
          "CTET": {
            icon: "📚",
            description: "केंद्रीय शिक्षक पात्रता परीक्षा",
            children: {}
          },
          "UGC NET": {
            icon: "🎓",
            description: "UGC NET",
            children: {}
          },
          "DSSSB TGT": {
            icon: "📖",
            description: "DSSSB TGT",
            children: {}
          }
        }
      },
      "State Level Exams": {
        icon: "🗺️",
        description: "राज्य स्तरीय परीक्षाएं",
        children: {
          "VYAPAM": {
            icon: "📑",
            description: "मध्य प्रदेश व्यावसायिक परीक्षा मंडल",
            children: {
              "Teacher": {
                icon: "👨‍🏫",
                description: "शिक्षक भर्ती",
                children: {
                  "Teacher Grade 1": {
                    icon: "⭐",
                    description: "शिक्षक ग्रेड 1",
                    children: {}
                  },
                  "Teacher Grade 2": {
                    icon: "⭐⭐",
                    description: "शिक्षक ग्रेड 2",
                    children: {}
                  },
                  "Teacher Grade 3": {
                    icon: "⭐⭐⭐",
                    description: "शिक्षक ग्रेड 3",
                    children: {}
                  }
                }
              },
              "Patwari": {
                icon: "📋",
                description: "पटवारी भर्ती",
                children: {}
              },
              "Police": {
                icon: "👮",
                description: "पुलिस कांस्टेबल",
                children: {}
              },
              "Nurse": {
                icon: "💉",
                description: "नर्स भर्ती",
                children: {}
              },
              "Lab Assistant": {
                icon: "🧪",
                description: "लेब असिस्टेंट",
                children: {}
              }
            }
          },
          "UPPSC": {
            icon: "🏛️",
            description: "उत्तर प्रदेश लोक सेवा आयोग",
            children: {
              "PCS": {
                icon: "📜",
                description: "प्रांतीय सिविल सेवा",
                children: {}
              },
              "RO/ARO": {
                icon: "📝",
                description: "RO/ARO",
                children: {}
              }
            }
          },
          "BPSC": {
            icon: "📋",
            description: "बिहार लोक सेवा आयोग",
            children: {}
          },
          "RPSC": {
            icon: "📜",
            description: "राजस्थान लोक सेवा आयोग",
            children: {
              "RAS": {
                icon: "🏛️",
                description: "राजस्थान प्रशासनिक सेवा",
                children: {}
              },
              "REET": {
                icon: "👨‍🏫",
                description: "राजस्थान शिक्षक पात्रता परीक्षा",
                children: {}
              }
            }
          }
        }
      },
      "Engineering": {
        icon: "⚙️",
        description: "इंजीनियरिंग परीक्षाएं",
        children: {
          "JEE Main": {
            icon: "🎯",
            description: "JEE मेन",
            children: {}
          },
          "JEE Advanced": {
            icon: "🚀",
            description: "JEE एडवांस",
            children: {}
          },
          "GATE": {
            icon: "🎓",
            description: "ग्रेजुएट एप्टीट्यूड टेस्ट",
            children: {}
          }
        }
      },
      "Medical": {
        icon: "⚕️",
        description: "मेडिकल परीक्षाएं",
        children: {
          "NEET UG": {
            icon: "🏥",
            description: "NEET अंडर ग्रेजुएट",
            children: {}
          },
          "NEET PG": {
            icon: "👨‍⚕️",
            description: "NEET पोस्ट ग्रेजुएट",
            children: {}
          }
        }
      }
    }
  }
};

// Sample subjects for each exam category
const defaultSubjects = [
  { name: "Mathematics", icon: "🔢" },
  { name: "General Knowledge", icon: "📚" },
  { name: "English", icon: "🔤" },
  { name: "Reasoning", icon: "🧠" },
  { name: "Hindi", icon: "📖" }
];

async function createCategoryHierarchy(parentId, hierarchy, order = 0) {
  const categories = [];
  
  for (const [name, data] of Object.entries(hierarchy)) {
    // Check if category already exists
    const existingCategory = await Category.findOne({ 
      name, 
      parent_id: parentId || null 
    });

    let category;
    if (existingCategory) {
      category = existingCategory;
      console.log(`✓ Category already exists: ${name}`);
    } else {
      category = new Category({
        name,
        description: data.description || null,
        icon: data.icon || '📚',
        parent_id: parentId || null,
        order: order++,
        test_category_type: 'Other'
      });
      await category.save();
      console.log(`✅ Created category: ${name}`);
    }

    categories.push(category);

    // Recursively create children
    if (data.children && Object.keys(data.children).length > 0) {
      await createCategoryHierarchy(category._id, data.children, 0);
    }

    // Create default subjects for leaf categories (categories without children)
    if (!data.children || Object.keys(data.children).length === 0) {
      const existingSubjects = await Subject.find({ category_id: category._id });
      
      if (existingSubjects.length === 0) {
        for (const subjectData of defaultSubjects) {
          const subject = new Subject({
            name: subjectData.name,
            description: `${subjectData.name} for ${name}`,
            category_id: category._id
          });
          await subject.save();
          console.log(`  └─ ✅ Created subject: ${subjectData.name} for ${name}`);
        }
      }
    }
  }

  return categories;
}

async function seedExamHierarchy() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/easy-exam-gen');
    console.log('✅ Connected to MongoDB');

    // Clear existing categories (optional - comment out if you want to keep existing data)
    // await Category.deleteMany({});
    // console.log('🗑️  Cleared existing categories');

    console.log('\n🌳 Creating Exam Hierarchy Structure...\n');

    // Create the hierarchy
    await createCategoryHierarchy(null, examHierarchy, 0);

    console.log('\n✅ Exam hierarchy created successfully!');
    console.log('\n📊 Summary:');
    
    const totalCategories = await Category.countDocuments();
    const rootCategories = await Category.countDocuments({ parent_id: null });
    
    console.log(`   - Total Categories: ${totalCategories}`);
    console.log(`   - Root Categories: ${rootCategories}`);
    
    const totalSubjects = await Subject.countDocuments();
    console.log(`   - Total Subjects: ${totalSubjects}`);

    console.log('\n🎉 Seeding completed!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding exam hierarchy:', error);
    process.exit(1);
  }
}

// Run the seed function
seedExamHierarchy();

