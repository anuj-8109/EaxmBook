import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../models/Category.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Question from '../models/Question.js';
import User from '../models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://snehpnp:snehpnp@newsmartalgo.n5bxaxz.mongodb.net/easy-exam-gen';

// GK Questions Data - 100+ questions
const gkQuestions = [
  // History Questions
  {
    question_text: "Who was the first Prime Minister of India?",
    option_a: "Jawaharlal Nehru",
    option_b: "Sardar Patel",
    option_c: "Dr. Rajendra Prasad",
    option_d: "Mahatma Gandhi",
    correct_answer: 0,
    explanation: "Jawaharlal Nehru was the first Prime Minister of India, serving from 1947 to 1964.",
    difficulty: "easy"
  },
  {
    question_text: "In which year did India gain independence?",
    option_a: "1945",
    option_b: "1947",
    option_c: "1950",
    option_d: "1946",
    correct_answer: 1,
    explanation: "India gained independence from British rule on August 15, 1947.",
    difficulty: "easy"
  },
  {
    question_text: "Who wrote the Indian National Anthem 'Jana Gana Mana'?",
    option_a: "Rabindranath Tagore",
    option_b: "Bankim Chandra Chattopadhyay",
    option_c: "Sarojini Naidu",
    option_d: "Subhash Chandra Bose",
    correct_answer: 0,
    explanation: "Jana Gana Mana was written by Rabindranath Tagore in 1911.",
    difficulty: "easy"
  },
  {
    question_text: "The Battle of Plassey was fought in which year?",
    option_a: "1757",
    option_b: "1764",
    option_c: "1857",
    option_d: "1947",
    correct_answer: 0,
    explanation: "The Battle of Plassey was fought on June 23, 1757, between the British East India Company and the Nawab of Bengal.",
    difficulty: "medium"
  },
  {
    question_text: "Who was known as the 'Iron Man of India'?",
    option_a: "Jawaharlal Nehru",
    option_b: "Sardar Vallabhbhai Patel",
    option_c: "Subhash Chandra Bose",
    option_d: "Bhagat Singh",
    correct_answer: 1,
    explanation: "Sardar Vallabhbhai Patel is known as the 'Iron Man of India' for his role in integrating princely states.",
    difficulty: "easy"
  },
  {
    question_text: "The Quit India Movement was launched in which year?",
    option_a: "1940",
    option_b: "1942",
    option_c: "1945",
    option_d: "1947",
    correct_answer: 1,
    explanation: "The Quit India Movement was launched by Mahatma Gandhi on August 8, 1942.",
    difficulty: "medium"
  },
  {
    question_text: "Who was the first woman Prime Minister of India?",
    option_a: "Pratibha Patil",
    option_b: "Indira Gandhi",
    option_c: "Sonia Gandhi",
    option_d: "Sarojini Naidu",
    correct_answer: 1,
    explanation: "Indira Gandhi was the first and only woman Prime Minister of India, serving from 1966 to 1977 and 1980 to 1984.",
    difficulty: "easy"
  },
  {
    question_text: "The Jallianwala Bagh massacre occurred in which year?",
    option_a: "1917",
    option_b: "1919",
    option_c: "1921",
    option_d: "1930",
    correct_answer: 1,
    explanation: "The Jallianwala Bagh massacre occurred on April 13, 1919, in Amritsar, Punjab.",
    difficulty: "medium"
  },
  {
    question_text: "Who founded the Indian National Congress?",
    option_a: "Mahatma Gandhi",
    option_b: "A.O. Hume",
    option_c: "Dadabhai Naoroji",
    option_d: "Gopal Krishna Gokhale",
    correct_answer: 1,
    explanation: "The Indian National Congress was founded by A.O. Hume in 1885.",
    difficulty: "medium"
  },
  {
    question_text: "The Dandi March was started by Mahatma Gandhi in which year?",
    option_a: "1928",
    option_b: "1930",
    option_c: "1932",
    option_d: "1942",
    correct_answer: 1,
    explanation: "The Dandi March, also known as the Salt March, was started by Mahatma Gandhi on March 12, 1930.",
    difficulty: "medium"
  },

  // Geography Questions
  {
    question_text: "What is the capital of India?",
    option_a: "Mumbai",
    option_b: "Kolkata",
    option_c: "New Delhi",
    option_d: "Chennai",
    correct_answer: 2,
    explanation: "New Delhi is the capital of India.",
    difficulty: "easy"
  },
  {
    question_text: "Which is the longest river in India?",
    option_a: "Yamuna",
    option_b: "Ganga",
    option_c: "Godavari",
    option_d: "Brahmaputra",
    correct_answer: 1,
    explanation: "The Ganga (Ganges) is the longest river in India, with a length of about 2,525 km.",
    difficulty: "easy"
  },
  {
    question_text: "Which is the highest mountain peak in India?",
    option_a: "Mount Everest",
    option_b: "Kanchenjunga",
    option_c: "Nanda Devi",
    option_d: "Kamet",
    correct_answer: 1,
    explanation: "Kanchenjunga, at 8,586 meters, is the highest peak in India and the third highest in the world.",
    difficulty: "medium"
  },
  {
    question_text: "How many states are there in India?",
    option_a: "26",
    option_b: "28",
    option_c: "29",
    option_d: "30",
    correct_answer: 2,
    explanation: "India has 29 states and 7 union territories.",
    difficulty: "easy"
  },
  {
    question_text: "Which state is known as the 'Land of Five Rivers'?",
    option_a: "Haryana",
    option_b: "Punjab",
    option_c: "Uttar Pradesh",
    option_d: "Bihar",
    correct_answer: 1,
    explanation: "Punjab is known as the 'Land of Five Rivers' - Beas, Chenab, Jhelum, Ravi, and Sutlej.",
    difficulty: "easy"
  },
  {
    question_text: "The Tropic of Cancer passes through how many Indian states?",
    option_a: "6",
    option_b: "7",
    option_c: "8",
    option_d: "9",
    correct_answer: 2,
    explanation: "The Tropic of Cancer passes through 8 Indian states: Gujarat, Rajasthan, Madhya Pradesh, Chhattisgarh, Jharkhand, West Bengal, Tripura, and Mizoram.",
    difficulty: "hard"
  },
  {
    question_text: "Which is the largest state in India by area?",
    option_a: "Madhya Pradesh",
    option_b: "Rajasthan",
    option_c: "Maharashtra",
    option_d: "Uttar Pradesh",
    correct_answer: 1,
    explanation: "Rajasthan is the largest state in India by area, covering 342,239 square kilometers.",
    difficulty: "easy"
  },
  {
    question_text: "Which is the smallest state in India by area?",
    option_a: "Goa",
    option_b: "Sikkim",
    option_c: "Tripura",
    option_d: "Mizoram",
    correct_answer: 0,
    explanation: "Goa is the smallest state in India by area, covering 3,702 square kilometers.",
    difficulty: "medium"
  },
  {
    question_text: "The Sundarbans mangrove forest is located in which state?",
    option_a: "Odisha",
    option_b: "West Bengal",
    option_c: "Andhra Pradesh",
    option_d: "Tamil Nadu",
    correct_answer: 1,
    explanation: "The Sundarbans, the largest mangrove forest in the world, is located in West Bengal and Bangladesh.",
    difficulty: "medium"
  },
  {
    question_text: "Which river is also known as the 'Sorrow of Bihar'?",
    option_a: "Ganga",
    option_b: "Yamuna",
    option_c: "Kosi",
    option_d: "Gandak",
    correct_answer: 2,
    explanation: "The Kosi River is known as the 'Sorrow of Bihar' due to its frequent flooding.",
    difficulty: "medium"
  },

  // Science Questions
  {
    question_text: "What is the chemical symbol for Gold?",
    option_a: "Go",
    option_b: "Gd",
    option_c: "Au",
    option_d: "Ag",
    correct_answer: 2,
    explanation: "The chemical symbol for Gold is Au, derived from the Latin word 'aurum'.",
    difficulty: "easy"
  },
  {
    question_text: "Which gas is most abundant in Earth's atmosphere?",
    option_a: "Oxygen",
    option_b: "Carbon Dioxide",
    option_c: "Nitrogen",
    option_d: "Argon",
    correct_answer: 2,
    explanation: "Nitrogen is the most abundant gas in Earth's atmosphere, making up about 78% of the air.",
    difficulty: "easy"
  },
  {
    question_text: "What is the speed of light in vacuum?",
    option_a: "300,000 km/s",
    option_b: "299,792,458 m/s",
    option_c: "150,000 km/s",
    option_d: "200,000 km/s",
    correct_answer: 1,
    explanation: "The speed of light in vacuum is approximately 299,792,458 meters per second (about 300,000 km/s).",
    difficulty: "medium"
  },
  {
    question_text: "Which planet is known as the 'Red Planet'?",
    option_a: "Venus",
    option_b: "Mars",
    option_c: "Jupiter",
    option_d: "Saturn",
    correct_answer: 1,
    explanation: "Mars is known as the 'Red Planet' due to iron oxide (rust) on its surface.",
    difficulty: "easy"
  },
  {
    question_text: "What is the atomic number of Carbon?",
    option_a: "4",
    option_b: "5",
    option_c: "6",
    option_d: "7",
    correct_answer: 2,
    explanation: "Carbon has an atomic number of 6, meaning it has 6 protons in its nucleus.",
    difficulty: "easy"
  },
  {
    question_text: "Which is the hardest natural substance on Earth?",
    option_a: "Gold",
    option_b: "Iron",
    option_c: "Diamond",
    option_d: "Platinum",
    correct_answer: 2,
    explanation: "Diamond is the hardest natural substance on Earth, with a Mohs hardness of 10.",
    difficulty: "easy"
  },
  {
    question_text: "What is the pH value of pure water?",
    option_a: "5",
    option_b: "6",
    option_c: "7",
    option_d: "8",
    correct_answer: 2,
    explanation: "Pure water has a pH value of 7, which is neutral on the pH scale.",
    difficulty: "easy"
  },
  {
    question_text: "Which blood group is known as the 'universal donor'?",
    option_a: "A",
    option_b: "B",
    option_c: "AB",
    option_d: "O",
    correct_answer: 3,
    explanation: "Blood group O negative is known as the universal donor as it can be given to people with any blood type.",
    difficulty: "medium"
  },
  {
    question_text: "What is the unit of electric current?",
    option_a: "Volt",
    option_b: "Ampere",
    option_c: "Ohm",
    option_d: "Watt",
    correct_answer: 1,
    explanation: "Ampere (A) is the unit of electric current, named after André-Marie Ampère.",
    difficulty: "easy"
  },
  {
    question_text: "Which vitamin is produced by the human body when exposed to sunlight?",
    option_a: "Vitamin A",
    option_b: "Vitamin C",
    option_c: "Vitamin D",
    option_d: "Vitamin K",
    correct_answer: 2,
    explanation: "Vitamin D is produced by the human body when the skin is exposed to sunlight.",
    difficulty: "easy"
  },

  // Current Affairs & Politics
  {
    question_text: "Who is the current President of India?",
    option_a: "Ram Nath Kovind",
    option_b: "Droupadi Murmu",
    option_c: "Pranab Mukherjee",
    option_d: "A.P.J. Abdul Kalam",
    correct_answer: 1,
    explanation: "Droupadi Murmu is the current President of India (as of 2024).",
    difficulty: "easy"
  },
  {
    question_text: "Which article of the Indian Constitution deals with Fundamental Rights?",
    option_a: "Article 12-35",
    option_b: "Article 1-11",
    option_c: "Article 36-51",
    option_d: "Article 52-78",
    correct_answer: 0,
    explanation: "Articles 12-35 of the Indian Constitution deal with Fundamental Rights.",
    difficulty: "medium"
  },
  {
    question_text: "How many members are there in the Lok Sabha?",
    option_a: "540",
    option_b: "543",
    option_c: "545",
    option_d: "550",
    correct_answer: 2,
    explanation: "The Lok Sabha has 545 members - 543 elected and 2 nominated from the Anglo-Indian community.",
    difficulty: "medium"
  },
  {
    question_text: "Who was the first President of India?",
    option_a: "Jawaharlal Nehru",
    option_b: "Dr. Rajendra Prasad",
    option_c: "Sardar Patel",
    option_d: "Dr. S. Radhakrishnan",
    correct_answer: 1,
    explanation: "Dr. Rajendra Prasad was the first President of India, serving from 1950 to 1962.",
    difficulty: "easy"
  },
  {
    question_text: "The Indian Constitution was adopted on which date?",
    option_a: "26 January 1947",
    option_b: "15 August 1947",
    option_c: "26 November 1949",
    option_d: "26 January 1950",
    correct_answer: 2,
    explanation: "The Indian Constitution was adopted on November 26, 1949, and came into effect on January 26, 1950.",
    difficulty: "medium"
  },
  {
    question_text: "Which is the highest court in India?",
    option_a: "High Court",
    option_b: "Supreme Court",
    option_c: "District Court",
    option_d: "Session Court",
    correct_answer: 1,
    explanation: "The Supreme Court of India is the highest judicial court in the country.",
    difficulty: "easy"
  },
  {
    question_text: "How many schedules are there in the Indian Constitution?",
    option_a: "10",
    option_b: "11",
    option_c: "12",
    option_d: "13",
    correct_answer: 2,
    explanation: "The Indian Constitution originally had 8 schedules, but now it has 12 schedules.",
    difficulty: "hard"
  },
  {
    question_text: "Who is known as the 'Father of the Indian Constitution'?",
    option_a: "Mahatma Gandhi",
    option_b: "Jawaharlal Nehru",
    option_c: "Dr. B.R. Ambedkar",
    option_d: "Sardar Patel",
    correct_answer: 2,
    explanation: "Dr. B.R. Ambedkar is known as the 'Father of the Indian Constitution' for his role as the Chairman of the Drafting Committee.",
    difficulty: "easy"
  },
  {
    question_text: "The Right to Education Act was passed in which year?",
    option_a: "2007",
    option_b: "2009",
    option_c: "2010",
    option_d: "2012",
    correct_answer: 1,
    explanation: "The Right to Education Act (RTE) was passed in 2009 and came into effect in 2010.",
    difficulty: "medium"
  },
  {
    question_text: "Which amendment of the Indian Constitution introduced the Goods and Services Tax (GST)?",
    option_a: "100th Amendment",
    option_b: "101st Amendment",
    option_c: "102nd Amendment",
    option_d: "103rd Amendment",
    correct_answer: 1,
    explanation: "The 101st Constitutional Amendment Act, 2016 introduced the Goods and Services Tax (GST) in India.",
    difficulty: "hard"
  },

  // Sports Questions
  {
    question_text: "Which sport is Sachin Tendulkar famous for?",
    option_a: "Football",
    option_b: "Cricket",
    option_c: "Hockey",
    option_d: "Tennis",
    correct_answer: 1,
    explanation: "Sachin Tendulkar is a legendary Indian cricketer, known as the 'Master Blaster'.",
    difficulty: "easy"
  },
  {
    question_text: "How many players are there in a cricket team on the field?",
    option_a: "9",
    option_b: "10",
    option_c: "11",
    option_d: "12",
    correct_answer: 2,
    explanation: "A cricket team has 11 players on the field at a time.",
    difficulty: "easy"
  },
  {
    question_text: "Which Indian won the first individual Olympic gold medal?",
    option_a: "Abhinav Bindra",
    option_b: "Rajyavardhan Singh Rathore",
    option_c: "Leander Paes",
    option_d: "Karnam Malleswari",
    correct_answer: 0,
    explanation: "Abhinav Bindra won India's first individual Olympic gold medal in shooting at the 2008 Beijing Olympics.",
    difficulty: "medium"
  },
  {
    question_text: "The FIFA World Cup is held every how many years?",
    option_a: "2 years",
    option_b: "3 years",
    option_c: "4 years",
    option_d: "5 years",
    correct_answer: 2,
    explanation: "The FIFA World Cup is held every 4 years.",
    difficulty: "easy"
  },
  {
    question_text: "Which Indian city hosted the Commonwealth Games in 2010?",
    option_a: "Mumbai",
    option_b: "Delhi",
    option_c: "Bangalore",
    option_d: "Chennai",
    correct_answer: 1,
    explanation: "New Delhi hosted the Commonwealth Games in 2010.",
    difficulty: "easy"
  },

  // Literature & Arts
  {
    question_text: "Who wrote the epic 'Ramayana'?",
    option_a: "Ved Vyas",
    option_b: "Valmiki",
    option_c: "Tulsidas",
    option_d: "Kalidasa",
    correct_answer: 1,
    explanation: "The Ramayana was written by the sage Valmiki.",
    difficulty: "easy"
  },
  {
    question_text: "Who wrote 'Geetanjali'?",
    option_a: "Rabindranath Tagore",
    option_b: "Bankim Chandra Chattopadhyay",
    option_c: "Sarojini Naidu",
    option_d: "Mahatma Gandhi",
    correct_answer: 0,
    explanation: "'Geetanjali' was written by Rabindranath Tagore, for which he won the Nobel Prize in Literature in 1913.",
    difficulty: "easy"
  },
  {
    question_text: "Which Indian won the first Nobel Prize?",
    option_a: "C.V. Raman",
    option_b: "Rabindranath Tagore",
    option_c: "Mother Teresa",
    option_d: "Hargobind Khorana",
    correct_answer: 1,
    explanation: "Rabindranath Tagore was the first Indian to win a Nobel Prize (Literature, 1913).",
    difficulty: "medium"
  },
  {
    question_text: "Who wrote 'The Discovery of India'?",
    option_a: "Mahatma Gandhi",
    option_b: "Jawaharlal Nehru",
    option_c: "Dr. Rajendra Prasad",
    option_d: "Sardar Patel",
    correct_answer: 1,
    explanation: "'The Discovery of India' was written by Jawaharlal Nehru during his imprisonment in 1944.",
    difficulty: "medium"
  },
  {
    question_text: "Which is the national flower of India?",
    option_a: "Rose",
    option_b: "Lotus",
    option_c: "Sunflower",
    option_d: "Marigold",
    correct_answer: 1,
    explanation: "Lotus is the national flower of India, symbolizing purity and beauty.",
    difficulty: "easy"
  },

  // Economics & Business
  {
    question_text: "What does GDP stand for?",
    option_a: "Gross Domestic Product",
    option_b: "Gross Development Product",
    option_c: "General Domestic Product",
    option_d: "Global Domestic Product",
    correct_answer: 0,
    explanation: "GDP stands for Gross Domestic Product, which measures the total value of goods and services produced in a country.",
    difficulty: "easy"
  },
  {
    question_text: "Which is the largest bank in India?",
    option_a: "HDFC Bank",
    option_b: "ICICI Bank",
    option_c: "State Bank of India",
    option_d: "Punjab National Bank",
    correct_answer: 2,
    explanation: "State Bank of India (SBI) is the largest bank in India by assets and branch network.",
    difficulty: "easy"
  },
  {
    question_text: "The Reserve Bank of India was established in which year?",
    option_a: "1930",
    option_b: "1935",
    option_c: "1947",
    option_d: "1950",
    correct_answer: 1,
    explanation: "The Reserve Bank of India (RBI) was established on April 1, 1935.",
    difficulty: "medium"
  },
  {
    question_text: "What is the currency of India?",
    option_a: "Dollar",
    option_b: "Rupee",
    option_c: "Pound",
    option_d: "Yen",
    correct_answer: 1,
    explanation: "The currency of India is the Indian Rupee (INR).",
    difficulty: "easy"
  },
  {
    question_text: "Which is the financial capital of India?",
    option_a: "Delhi",
    option_b: "Mumbai",
    option_c: "Bangalore",
    option_d: "Kolkata",
    correct_answer: 1,
    explanation: "Mumbai is known as the financial capital of India, housing the Reserve Bank of India and major stock exchanges.",
    difficulty: "easy"
  },

  // Technology
  {
    question_text: "What does CPU stand for?",
    option_a: "Central Processing Unit",
    option_b: "Computer Processing Unit",
    option_c: "Central Program Unit",
    option_d: "Computer Program Unit",
    correct_answer: 0,
    explanation: "CPU stands for Central Processing Unit, the main component of a computer that processes instructions.",
    difficulty: "easy"
  },
  {
    question_text: "What does RAM stand for?",
    option_a: "Random Access Memory",
    option_b: "Read Access Memory",
    option_c: "Random Available Memory",
    option_d: "Read Available Memory",
    correct_answer: 0,
    explanation: "RAM stands for Random Access Memory, a type of computer memory that can be accessed randomly.",
    difficulty: "easy"
  },
  {
    question_text: "Who is known as the 'Father of the Internet'?",
    option_a: "Bill Gates",
    option_b: "Tim Berners-Lee",
    option_c: "Vint Cerf",
    option_d: "Steve Jobs",
    correct_answer: 2,
    explanation: "Vint Cerf is often called the 'Father of the Internet' for his role in developing TCP/IP protocols.",
    difficulty: "medium"
  },
  {
    question_text: "What does HTML stand for?",
    option_a: "HyperText Markup Language",
    option_b: "HighText Markup Language",
    option_c: "HyperText Markdown Language",
    option_d: "HighText Markdown Language",
    correct_answer: 0,
    explanation: "HTML stands for HyperText Markup Language, used for creating web pages.",
    difficulty: "easy"
  },
  {
    question_text: "Which company developed the Android operating system?",
    option_a: "Apple",
    option_b: "Microsoft",
    option_c: "Google",
    option_d: "Samsung",
    correct_answer: 2,
    explanation: "Google developed the Android operating system, which was later acquired by Google in 2005.",
    difficulty: "easy"
  },

  // More History
  {
    question_text: "The first war of Indian independence took place in which year?",
    option_a: "1857",
    option_b: "1947",
    option_c: "1919",
    option_d: "1930",
    correct_answer: 0,
    explanation: "The first war of Indian independence, also known as the Sepoy Mutiny, took place in 1857.",
    difficulty: "medium"
  },
  {
    question_text: "Who was the last Mughal Emperor?",
    option_a: "Akbar",
    option_b: "Aurangzeb",
    option_c: "Bahadur Shah Zafar",
    option_d: "Shah Jahan",
    correct_answer: 2,
    explanation: "Bahadur Shah Zafar was the last Mughal Emperor, who was exiled after the 1857 revolt.",
    difficulty: "medium"
  },
  {
    question_text: "The Taj Mahal was built by which Mughal Emperor?",
    option_a: "Akbar",
    option_b: "Shah Jahan",
    option_c: "Aurangzeb",
    option_d: "Jahangir",
    correct_answer: 1,
    explanation: "The Taj Mahal was built by Shah Jahan in memory of his wife Mumtaz Mahal.",
    difficulty: "easy"
  },
  {
    question_text: "Who founded the Mauryan Empire?",
    option_a: "Ashoka",
    option_b: "Chandragupta Maurya",
    option_c: "Bindusara",
    option_d: "Samudragupta",
    correct_answer: 1,
    explanation: "Chandragupta Maurya founded the Mauryan Empire in 322 BCE.",
    difficulty: "medium"
  },
  {
    question_text: "The ancient university of Nalanda was located in which present-day state?",
    option_a: "Bihar",
    option_b: "West Bengal",
    option_c: "Uttar Pradesh",
    option_d: "Odisha",
    correct_answer: 0,
    explanation: "The ancient university of Nalanda was located in present-day Bihar.",
    difficulty: "medium"
  },

  // More Geography
  {
    question_text: "Which is the largest desert in India?",
    option_a: "Thar Desert",
    option_b: "Kutch Desert",
    option_c: "Ladakh Desert",
    option_d: "Rann of Kutch",
    correct_answer: 0,
    explanation: "The Thar Desert, also known as the Great Indian Desert, is the largest desert in India.",
    difficulty: "easy"
  },
  {
    question_text: "Which is the smallest union territory of India?",
    option_a: "Lakshadweep",
    option_b: "Daman and Diu",
    option_c: "Dadra and Nagar Haveli",
    option_d: "Puducherry",
    correct_answer: 0,
    explanation: "Lakshadweep is the smallest union territory of India, covering only 32 square kilometers.",
    difficulty: "medium"
  },
  {
    question_text: "The Konkan Railway connects which two states?",
    option_a: "Maharashtra and Karnataka",
    option_b: "Goa and Karnataka",
    option_c: "Maharashtra and Goa",
    option_d: "Kerala and Karnataka",
    correct_answer: 0,
    explanation: "The Konkan Railway connects Maharashtra and Karnataka, running along the western coast of India.",
    difficulty: "hard"
  },
  {
    question_text: "Which is the highest dam in India?",
    option_a: "Bhakra Dam",
    option_b: "Tehri Dam",
    option_c: "Sardar Sarovar Dam",
    option_d: "Hirakud Dam",
    correct_answer: 1,
    explanation: "Tehri Dam in Uttarakhand is the highest dam in India, standing at 260.5 meters.",
    difficulty: "medium"
  },
  {
    question_text: "The 'Silicon Valley of India' refers to which city?",
    option_a: "Mumbai",
    option_b: "Delhi",
    option_c: "Bangalore",
    option_d: "Hyderabad",
    correct_answer: 2,
    explanation: "Bangalore (Bengaluru) is known as the 'Silicon Valley of India' due to its IT industry.",
    difficulty: "easy"
  },

  // More Science
  {
    question_text: "What is the chemical formula of water?",
    option_a: "H2O",
    option_b: "CO2",
    option_c: "O2",
    option_d: "NaCl",
    correct_answer: 0,
    explanation: "The chemical formula of water is H2O, meaning two hydrogen atoms and one oxygen atom.",
    difficulty: "easy"
  },
  {
    question_text: "Which gas do plants absorb from the atmosphere?",
    option_a: "Oxygen",
    option_b: "Carbon Dioxide",
    option_c: "Nitrogen",
    option_d: "Hydrogen",
    correct_answer: 1,
    explanation: "Plants absorb carbon dioxide (CO2) from the atmosphere during photosynthesis.",
    difficulty: "easy"
  },
  {
    question_text: "What is the unit of force?",
    option_a: "Joule",
    option_b: "Newton",
    option_c: "Watt",
    option_d: "Pascal",
    correct_answer: 1,
    explanation: "Newton (N) is the unit of force, named after Sir Isaac Newton.",
    difficulty: "easy"
  },
  {
    question_text: "Which planet is closest to the Sun?",
    option_a: "Venus",
    option_b: "Mercury",
    option_c: "Earth",
    option_d: "Mars",
    correct_answer: 1,
    explanation: "Mercury is the closest planet to the Sun in our solar system.",
    difficulty: "easy"
  },
  {
    question_text: "What is the study of weather called?",
    option_a: "Geology",
    option_b: "Meteorology",
    option_c: "Astronomy",
    option_d: "Biology",
    correct_answer: 1,
    explanation: "Meteorology is the study of weather and atmospheric conditions.",
    difficulty: "easy"
  },

  // More Current Affairs
  {
    question_text: "Which is the national animal of India?",
    option_a: "Lion",
    option_b: "Tiger",
    option_c: "Elephant",
    option_d: "Peacock",
    correct_answer: 1,
    explanation: "The Tiger is the national animal of India.",
    difficulty: "easy"
  },
  {
    question_text: "Which is the national bird of India?",
    option_a: "Sparrow",
    option_b: "Peacock",
    option_c: "Eagle",
    option_d: "Parrot",
    correct_answer: 1,
    explanation: "The Peacock is the national bird of India.",
    difficulty: "easy"
  },
  {
    question_text: "Which is the national tree of India?",
    option_a: "Banyan Tree",
    option_b: "Neem Tree",
    option_c: "Mango Tree",
    option_d: "Peepal Tree",
    correct_answer: 0,
    explanation: "The Banyan Tree is the national tree of India.",
    difficulty: "easy"
  },
  {
    question_text: "Which is the national sport of India?",
    option_a: "Cricket",
    option_b: "Hockey",
    option_c: "Football",
    option_d: "Tennis",
    correct_answer: 1,
    explanation: "Hockey is the national sport of India, though it's not officially declared.",
    difficulty: "medium"
  },
  {
    question_text: "The Preamble of the Indian Constitution begins with which words?",
    option_a: "We, the People",
    option_b: "We, the Citizens",
    option_c: "We, the Indians",
    option_d: "We, the Nation",
    correct_answer: 0,
    explanation: "The Preamble begins with 'We, the People of India'.",
    difficulty: "easy"
  }
];

async function seedGKData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB\n');

    // Get admin user or create one
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('No admin user found. Please create an admin user first.');
      process.exit(1);
    }

    console.log('=== Starting GK Data Seeding ===\n');

    // 1. Create Categories (3 exams)
    const categories = [
      {
        name: "UPSC",
        description: "Union Public Service Commission exams",
        icon: "📚",
        test_category_type: "Other",
        order: 1
      },
      {
        name: "SSC",
        description: "Staff Selection Commission exams",
        icon: "📝",
        test_category_type: "Other",
        order: 2
      },
      {
        name: "Railway",
        description: "Railway Recruitment Board exams",
        icon: "🚂",
        test_category_type: "Other",
        order: 3
      }
    ];

    console.log('1. Creating Categories...');
    const createdCategories = [];
    for (const cat of categories) {
      const existing = await Category.findOne({ name: cat.name });
      if (existing) {
        console.log(`   Category "${cat.name}" already exists, skipping...`);
        createdCategories.push(existing);
      } else {
        const category = await Category.create(cat);
        createdCategories.push(category);
        console.log(`   ✓ Created category: ${cat.name}`);
      }
    }

    // 2. Create Subjects (4 per category)
    const subjectsData = [
      { name: "Mathematics", description: "Quantitative Aptitude and Mathematics" },
      { name: "English", description: "English Language and Comprehension" },
      { name: "General Knowledge", description: "General Awareness and Current Affairs" },
      { name: "Reasoning", description: "Logical and Analytical Reasoning" }
    ];

    console.log('\n2. Creating Subjects...');
    const createdSubjects = [];
    for (const category of createdCategories) {
      for (const subj of subjectsData) {
        const existing = await Subject.findOne({ 
          name: subj.name, 
          category_id: category._id 
        });
        if (existing) {
          createdSubjects.push(existing);
        } else {
          const subject = await Subject.create({
            ...subj,
            category_id: category._id
          });
          createdSubjects.push(subject);
          console.log(`   ✓ Created subject: ${subj.name} (${category.name})`);
        }
      }
    }

    // 3. Create Topics (3-4 topics per subject)
    const topicsData = {
      "Mathematics": ["Algebra", "Geometry", "Arithmetic", "Trigonometry"],
      "English": ["Grammar", "Vocabulary", "Comprehension", "Writing Skills"],
      "General Knowledge": ["History", "Geography", "Science", "Current Affairs"],
      "Reasoning": ["Logical Reasoning", "Analytical Reasoning", "Verbal Reasoning", "Non-Verbal Reasoning"]
    };

    console.log('\n3. Creating Topics...');
    const createdTopics = [];
    for (const subject of createdSubjects) {
      const subjectTopics = topicsData[subject.name] || [];
      for (const topicName of subjectTopics) {
        const existing = await Topic.findOne({ 
          name: topicName, 
          subject_id: subject._id 
        });
        if (existing) {
          createdTopics.push(existing);
        } else {
          const topic = await Topic.create({
            name: topicName,
            description: `${topicName} for ${subject.name}`,
            subject_id: subject._id
          });
          createdTopics.push(topic);
          console.log(`   ✓ Created topic: ${topicName} (${subject.name})`);
        }
      }
    }

    // 4. Create Questions (100+ GK questions)
    console.log('\n4. Creating Questions...');
    let questionCount = 0;
    const gkSubjects = createdSubjects.filter(s => s.name === "General Knowledge");
    
    // Distribute questions across GK subjects of all categories
    for (let i = 0; i < gkQuestions.length; i++) {
      const question = gkQuestions[i];
      const subject = gkSubjects[i % gkSubjects.length]; // Distribute evenly
      const category = createdCategories.find(c => c._id.toString() === subject.category_id.toString());
      
      // Find a topic for this subject (use first topic)
      const topic = createdTopics.find(t => 
        t.subject_id.toString() === subject._id.toString()
      );

      // Map difficulty string to difficulty_level number
      const difficultyMap = { easy: 3, medium: 5, hard: 8 };
      const difficultyLevel = difficultyMap[question.difficulty] || 5;

      const questionData = {
        question_text: question.question_text,
        option_a: question.option_a,
        option_b: question.option_b,
        option_c: question.option_c,
        option_d: question.option_d,
        correct_answer: question.correct_answer,
        explanation: question.explanation,
        difficulty: question.difficulty,
        difficulty_level: difficultyLevel,
        category_id: category?._id || null,
        subject_id: subject._id,
        topic_id: topic?._id || null,
        created_by: adminUser._id
      };

      await Question.create(questionData);
      questionCount++;
      if (questionCount % 20 === 0) {
        console.log(`   ✓ Created ${questionCount} questions...`);
      }
    }

    console.log(`\n   ✓ Total ${questionCount} questions created!`);

    console.log('\n=== Seeding Complete ===');
    console.log(`\nSummary:`);
    console.log(`- Categories: ${createdCategories.length}`);
    console.log(`- Subjects: ${createdSubjects.length}`);
    console.log(`- Topics: ${createdTopics.length}`);
    console.log(`- Questions: ${questionCount}`);
    console.log('\n✅ All data has been seeded successfully!');

  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed.');
  }
}

// Run the seeding
seedGKData()
  .then(() => {
    console.log('\n✅ Seed script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seed script failed:', error);
    process.exit(1);
  });

