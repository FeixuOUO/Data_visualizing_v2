import { GoogleGenAI } from "@google/genai";

// Standard Node.js Serverless Function for Vercel
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Attempt to get API Key from environment variables
    const apiKey = process.env.API_KEY || process.env.VITE_API_KEY;

    if (!apiKey) {
      console.error("Server API Key missing");
      return res.status(500).json({ error: 'Server configuration error: API Key missing in Vercel env' });
    }

    // Vercel automatically parses JSON body for standard Node.js functions
    const { prompt, systemInstruction, schema } = req.body || {};

    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt in request body' });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Call Gemini API
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema || undefined,
      }
    });

    const text = response.text || "[]";

    // Return successful response
    return res.status(200).json({ text });

  } catch (error) {
    console.error("Serverless Function Error:", error);
    return res.status(500).json({ 
      error: error.message || 'Internal Server Error',
      details: error.toString()
    });
  }
}