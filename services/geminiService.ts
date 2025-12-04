import { GoogleGenAI, Type } from "@google/genai";
import { DataItem, ProcessingOptions } from "../types";

/**
 * Diagnostic function to check what the environment actually looks like.
 * This helps debug Vercel/Vite environment variable injection issues.
 */
export const getDiagnosticInfo = () => {
  const diagnostics: string[] = [];
  
  // 1. Check import.meta.env (Standard Vite)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      diagnostics.push("Check 1: import.meta.env is available");
      
      // List keys starting with VITE_ or containing KEY to verify injection
      // @ts-ignore
      const allKeys = Object.keys(import.meta.env);
      const visibleKeys = allKeys.filter(k => k.startsWith('VITE_') || k.includes('KEY'));
      diagnostics.push(`Visible keys: [${visibleKeys.join(', ')}]`);
      
      // @ts-ignore
      if (import.meta.env.VITE_API_KEY) diagnostics.push("✅ import.meta.env.VITE_API_KEY is SET");
      else diagnostics.push("❌ import.meta.env.VITE_API_KEY is MISSING");
      
      // @ts-ignore
      if (import.meta.env.API_KEY) diagnostics.push("⚠️ import.meta.env.API_KEY is SET (Non-standard)");
    } else {
      diagnostics.push("❌ import.meta.env is undefined");
    }
  } catch (e: any) {
    diagnostics.push(`Error checking import.meta: ${e.message}`);
  }

  // 2. Check process.env (Fallback)
  try {
    if (typeof process !== 'undefined' && process.env) {
      diagnostics.push("Check 2: process.env is available");
      if (process.env.VITE_API_KEY) diagnostics.push("✅ process.env.VITE_API_KEY is SET");
      if (process.env.API_KEY) diagnostics.push("⚠️ process.env.API_KEY is SET");
    } else {
      diagnostics.push("ℹ️ process.env is undefined (Normal for Vite)");
    }
  } catch (e: any) {
     diagnostics.push(`Error checking process.env: ${e.message}`);
  }

  return diagnostics;
};

// Helper to safely get the API Key in a browser/Vite environment
export const getApiKey = (): string | undefined => {
  let key: string | undefined = undefined;

  // 1. Try standard Vite environment variable (Most reliable in Vite)
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore
    if (import.meta.env.VITE_API_KEY) key = import.meta.env.VITE_API_KEY;
    // @ts-ignore
    else if (import.meta.env.API_KEY) key = import.meta.env.API_KEY;
  }
  
  // 2. Try process.env (Fallback for some Vercel configurations)
  if (!key) {
    try {
      if (typeof process !== 'undefined' && process.env) {
        if (process.env.VITE_API_KEY) key = process.env.VITE_API_KEY;
        else if (process.env.API_KEY) key = process.env.API_KEY;
        else if (process.env.NEXT_PUBLIC_API_KEY) key = process.env.NEXT_PUBLIC_API_KEY; 
      }
    } catch (e) {
      // Ignore ReferenceError
    }
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
  
  if (!apiKey) {
    throw new Error("MISSING_KEY");
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });

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
    throw error;
  }
};

export const generateExampleData = async (): Promise<DataItem[]> => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    throw new Error("MISSING_KEY");
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });
  
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
    console.error("Error generating example data:", e);
    throw e;
  }
}