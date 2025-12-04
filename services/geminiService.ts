import { GoogleGenAI } from "@google/genai";
import { DataItem, ProcessingOptions } from "../types";

// Helper to get the API key safely
const getApiKey = (): string => {
  const key = process.env.API_KEY;
  if (!key) {
    console.error("API Key not found in environment variables");
    return "";
  }
  return key;
};

export const parseAndProcessData = async (
  rawInput: string,
  options: ProcessingOptions
): Promise<DataItem[]> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key is missing.");

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    You are a data processing engine. 
    I will provide raw text or CSV-like data. 
    You need to parse it into a clean JSON array of objects.
    
    Each object should ideally have the following fields (infer them if possible, or map close equivalents):
    - date (YYYY-MM-DD format)
    - sales (number)
    - category (string)
    - region (string)
    - units_sold (number)

    Processing Instructions:
    ${options.cleanMissingValues ? "- Fill any missing numeric values with the average of that column. Fill missing strings with 'Unknown'." : "- Leave missing values as null or empty string."}
    ${options.normalizeData ? "- Normalize the 'sales' figures to be between 0 and 1000 for visualization purposes if they are very large." : ""}
    ${options.sortData ? "- Sort the data by Date ascending." : ""}
    ${options.filterRows ? "- Remove any rows that look clearly like garbage data or headers." : ""}

    Return ONLY the raw JSON array. Do not include markdown formatting like \`\`\`json.
    
    Raw Data:
    ${rawInput}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text || "[]";
    // Clean up if the model adds markdown despite instructions
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Gemini processing error:", error);
    throw new Error("Failed to process data with AI.");
  }
};

export const generateExampleData = async (): Promise<DataItem[]> => {
  const apiKey = getApiKey();
  if (!apiKey) return []; // Fallback or handle error

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    Generate a realistic sample dataset for a sales dashboard.
    Return a JSON array with 15 items.
    Fields: date (last 12 months), sales (100-5000), category (Electronics, Apparel, Home Goods), region (North, South, East, West), units_sold (10-500).
    Return ONLY JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    const text = response.text || "[]";
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (e) {
    console.error(e);
    return [];
  }
}
