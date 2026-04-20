import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import Setting from '../models/Setting.js';
dotenv.config();

export const generateCompletion = async (prompt, systemPrompt = "You are a helpful AI assistant for an exam generator application.", isJson = true) => {
  try {
    const settings = await Setting.findOne().lean();
    const apiKey = settings?.groq?.apiKey || process.env.GROQ_API_KEY;
    const modelName = settings?.groq?.modelName || 'llama-3.3-70b-versatile';

    if (!apiKey) {
      throw new Error("Groq API key is not configured in settings or environment variables.");
    }

    const groq = new Groq({
      apiKey: apiKey
    });

    const response = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      model: modelName,
      response_format: isJson ? { type: "json_object" } : { type: "text" },
    });
    return response.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("Groq generation error:", error);
    throw error;
  }
};
