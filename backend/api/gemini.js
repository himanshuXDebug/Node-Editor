// In your backend/api/gemini.js
import { GoogleGenerativeAI } from "@google/generative-ai";

let lastResponses = new Map(); // Track last responses

export default async function handler(req, res) {
  console.log('=== GEMINI API CALLED ===');
  console.log('Method:', req.method);
  console.log('Body:', req.body);
  
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { prompt, personalApiKey } = req.body;
  
  console.log('Prompt received:', prompt);
  console.log('Personal API provided:', !!personalApiKey);

  if (!prompt || prompt.trim() === '') {
    console.log('ERROR: Empty prompt');
    return res.status(400).json({ error: "Missing or empty prompt" });
  }

  try {
    const apiKey = personalApiKey || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.log('ERROR: No API key available');
      return res.status(500).json({ error: "No API key configured" });
    }

    console.log('Using API key:', apiKey.substring(0, 10) + '...');
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    console.log('Sending to Gemini:', prompt);
    
    // IMPORTANT: Send the actual prompt, not a cached response
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    console.log('Gemini response:', text.substring(0, 100) + '...');

    res.status(200).json({ 
      output: text,
      debug: {
        promptSent: prompt,
        responseLength: text.length
      }
    });
  } catch (err) {
    console.error("Gemini error:", err);
    res.status(500).json({ 
      error: "Gemini API error",
      details: err.message 
    });
  }
}

