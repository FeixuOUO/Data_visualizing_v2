import { GoogleGenAI, Type } from "@google/genai";
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

// Define the schema for consistent AI output
const dataItemSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      date: { type: Type.STRING, description: "Date in YYYY-MM-DD format" },
      sales: { type: Type.NUMBER, description: "Total sales amount" },
      category: { type: Type.STRING, description: "Product category (e.g., Electronics, Apparel)" },
      region: { type: Type.STRING, description: "Sales region (e.g., North, West)" },
      units_sold: { type: Type.NUMBER, description: "Number of units sold" },
    },
    required: ["date", "sales", "category", "region", "units_sold"],
  }
};

export const parseAndProcessData = async (
  rawInput: string,
  options: ProcessingOptions
): Promise<DataItem[]> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key is missing.");

  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `
    You are an advanced data processing engine. 
    Your goal is to parse raw input text (CSV, JSON, or unstructured text) into a structured dataset.
    
    Processing Rules applied by user:
    ${options.cleanMissingValues ? "- Clean Missing Values: Infer missing numbers with averages, and strings with 'Unknown'." : "- Keep missing values as is (null/empty)."}
    ${options.normalizeData ? "- Normalize Data: Ensure 'sales' values are scaled realistically (0-5000 range) if they seem outlier-ish." : ""}
    ${options.sortData ? "- Sort Data: Sort the result chronologically by Date." : ""}
    ${options.filterRows ? "- Filter Rows: Exclude header rows, footer rows, or garbage/corrupted data lines." : ""}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Parse this raw data:\n${rawInput}`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: dataItemSchema,
      }
    });

    const text = response.text || "[]";
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini processing error:", error);
    throw new Error("Failed to process data with AI.");
  }
};

export const generateExampleData = async (): Promise<DataItem[]> => {
  const apiKey = getApiKey();
  if (!apiKey) return [];

  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "Generate a realistic sales dataset with 15 records spanning the last 12 months.",
      config: {
        systemInstruction: "Generate realistic business data for visualization.",
        responseMimeType: "application/json",
        responseSchema: dataItemSchema,
      }
    });
    
    const text = response.text || "[]";
    return JSON.parse(text);
  } catch (e) {
    console.error(e);
    return [];
  }
}