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
  console.log('Personal API key (first 10 chars):', personalApiKey ? personalApiKey.substring(0, 10) + '...' : 'None');

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

    console.log('Using API key source:', personalApiKey ? 'PERSONAL' : 'BACKEND');
    console.log('API key preview:', apiKey.substring(0, 10) + '...');
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    console.log('Sending to Gemini:', prompt);
    
    // **THIS IS WHERE THE ERROR GETS CAUGHT**
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    console.log('Gemini response received successfully');
    console.log('Response preview:', text.substring(0, 100) + '...');

    res.status(200).json({ 
      output: text,
      apiKeySource: personalApiKey ? 'personal' : 'backend',
      debug: {
        promptSent: prompt,
        responseLength: text.length,
        usingPersonalKey: !!personalApiKey
      }
    });

  } catch (err) {
    console.error("=== GEMINI ERROR CAUGHT ===");
    console.error("Error name:", err.name);
    console.error("Error message:", err.message);
    console.error("Full error:", err);
    
    // **HANDLE GOOGLE GENERATIVE AI SPECIFIC ERRORS**
    if (err.message?.includes('[GoogleGenerativeAI Error]')) {
      console.log('GoogleGenerativeAI Error detected');
      
      // Check for API key errors
      if (err.message.includes('API_KEY_INVALID') || 
          err.message.includes('API key not valid') ||
          err.message.includes('400 Bad Request')) {
        
        console.log('ERROR: Invalid API key detected');
        return res.status(401).json({ 
          error: { 
            message: personalApiKey ? 
              "Invalid personal API key. Please check your Gemini API key." : 
              "Invalid backend API key. Contact administrator."
          }
        });
      }
      
      // Check for quota/rate limit errors
      if (err.message.includes('429') || err.message.includes('quota')) {
        console.log('ERROR: Quota/Rate limit exceeded');
        return res.status(429).json({ 
          error: { 
            message: "API quota exceeded or rate limited. Please try again later."
          }
        });
      }
      
      // Check for unsupported location
      if (err.message.includes('User location is not supported')) {
        console.log('ERROR: Location not supported');
        return res.status(403).json({ 
          error: { 
            message: "Your location is not supported for Gemini API access."
          }
        });
      }
      
      // Generic Google AI API error
      console.log('ERROR: Generic Google AI API error');
      return res.status(400).json({ 
        error: { 
          message: "Google AI API Error: " + err.message
        }
      });
    }

    // **HANDLE OTHER ERROR TYPES**
    if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
      console.log('ERROR: Network error');
      return res.status(503).json({ 
        error: { 
          message: "Network error - Unable to connect to Google AI services"
        }
      });
    }

    // **FALLBACK FOR UNKNOWN ERRORS**
    console.log('ERROR: Unknown error type');
    res.status(500).json({ 
      error: { 
        message: "Unexpected error: " + err.message
      },
      details: err.message,
      apiKeySource: personalApiKey ? 'personal' : 'backend'
    });
  }
}
