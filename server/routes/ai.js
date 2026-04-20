import express from 'express';
import { generateCompletion } from '../services/groqService.js';

const router = express.Router();

router.post('/generate', async (req, res) => {
  try {
    const { type, context, count = 1 } = req.body;
    
    let prompt = '';
    let systemPrompt = 'You are an AI assistant helping an admin generate content for an exam portal. ALWAYS respond in valid JSON matching the requested structure.';
    
    switch (type) {
      case 'questions':
        prompt = `Generate ${count} multiple choice questions for Subject/Topic: ${context?.subject || 'General Knowledge'} - ${context?.topic || 'General'}. Difficulty Level (1-10): ${context?.difficulty || 5}.
        Return JSON format exactly like this:
        {
          "questions": [
            {
              "question_text": "text of the question",
              "option_a": "option 1",
              "option_b": "option 2",
              "option_c": "option 3",
              "option_d": "option 4",
              "correct_answer": 0, // an integer from 0 to 3 where 0=a, 1=b, 2=c, 3=d
              "explanation": "why this is correct"
            }
          ]
        }`;
        break;
      case 'test':
        prompt = `Generate a test configuration for Subject: ${context?.subject || 'General'}. 
        Return JSON format exactly like this:
        {
          "title": "A catchy title for the test",
          "exam_name": "A relevant real-world exam name (e.g., UPSC Prelims, SSC CGL, RRB Group D, GATE, etc.)",
          "description": "A short engaging description",
          "duration": 60,
          "passing_marks": 40
        }`;
        break;
      case 'topics':
        prompt = `Generate ${count} sub-topics for the Subject/Main Topic: ${context?.subject || 'General Subject'}. 
        Return JSON format exactly like this:
        {
          "topics": [
            {
              "name": "topic name",
              "description": "short description"
            }
          ]
        }`;
        break;
      case 'subjects':
        prompt = `Generate ${count} typical Indian competitive exam or school curriculum subjects. 
        Return JSON format exactly like this:
        {
          "subjects": [
            {
              "name": "subject name",
              "description": "short description"
            }
          ]
        }`;
        break;
      default:
        return res.status(400).json({ error: 'Invalid generation type' });
    }

    const response = await generateCompletion(prompt, systemPrompt, true);
    res.json(JSON.parse(response));
  } catch (error) {
    console.error("AI Generation Route Error:", error);
    res.status(500).json({ error: error.message || 'Failed to generate content' });
  }
});

export default router;
