
import { GoogleGenAI, Type } from "@google/genai";
import { DataItem, ProcessingOptions } from "../types";

// Encryption helpers to obscure the key in localStorage
const SALT = "ds_v1_salt_";
export const encryptKey = (key: string) => {
  try {
    return btoa(SALT + key);
  } catch (e) { return key; }
};

export const decryptKey = (encrypted: string) => {
  try {
    const decoded = atob(encrypted);
    if (decoded.startsWith(SALT)) return decoded.slice(SALT.length);
    return encrypted; // Fallback if not salted
  } catch (e) { return encrypted; }
};

export const getDiagnosticInfo = () => {
  const diagnostics: string[] = [];
  try {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('gemini_api_key_enc')) {
      diagnostics.push("✅ Local Custom Key: PRESENT (Encrypted)");
    } else {
      diagnostics.push("ℹ️ Local Custom Key: None");
    }
  } catch (e) {}

  // Check for Backend Proxy availability (inference)
  if (typeof window !== 'undefined') {
    diagnostics.push("ℹ️ Backend Proxy Mode: Ready (will be used if Local Key is missing)");
  }
  
  return diagnostics;
};

export const saveApiKey = (key: string) => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('gemini_api_key_enc', encryptKey(key));
  }
};

export const getLocalApiKey = (): string | undefined => {
  if (typeof localStorage !== 'undefined') {
    const enc = localStorage.getItem('gemini_api_key_enc');
    if (enc) return decryptKey(enc);
  }
  return undefined;
};

// Generic Proxy Caller
const callGemini = async (prompt: string, systemInstruction: string, schema?: any): Promise<any> => {
  const localKey = getLocalApiKey();

  // MODE A: Client-side SDK (if user provided a key)
  if (localKey) {
    console.log("Using Local API Key");
    const ai = new GoogleGenAI({ apiKey: localKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });
    const text = response.text || "[]";
    return JSON.parse(text);
  }

  // MODE B: Backend Proxy (Serverless Function)
  console.log("Using Backend Proxy");
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, systemInstruction, schema })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Backend Processing Failed");
  }

  const data = await response.json();
  return JSON.parse(data.text);
};

export const parseAndProcessData = async (
  rawInput: string,
  options: ProcessingOptions
): Promise<DataItem[]> => {
  
  const systemInstruction = `
    You are an advanced data parsing engine.
    Analyze the user's raw text. It could be CSV, JSON, or just unstructured text.
    Extract the data into a JSON array of objects.
    
    IMPORTANT: Do NOT force specific field names like 'sales' or 'date' unless they exist in the data.
    Preserve the original column names or inferred meaningful names.
    Ensure all objects in the array have the same keys.
    
    Processing Rules:
    ${options.cleanMissingValues ? "- Infer missing values logically." : "- Leave missing values null."}
    ${options.normalizeData ? "- Normalize numerical outliers." : ""}
    ${options.sortData ? "- Sort chronologically if a date column exists." : ""}
    ${options.filterRows ? "- Remove garbage/header/footer rows." : ""}
  `;

  // We do NOT pass a strict schema here to allow dynamic column names
  // But we ask for ARRAY output in system prompt
  return callGemini(
    `Parse this data into a valid JSON array of objects:\n${rawInput.substring(0, 30000)}`,
    systemInstruction
  );
};

export const generateExampleData = async (): Promise<DataItem[]> => {
  // Static data to ensure speed and demonstrate dynamic column mapping (non-standard names)
  return [
    { "Transaction_Date": "2024-01-15", "Sales_Channel": "Online", "Product_Line": "Laptops", "Gross_Revenue": 15000, "Units_Sold": 12 },
    { "Transaction_Date": "2024-02-03", "Sales_Channel": "Retail", "Product_Line": "Smartphones", "Gross_Revenue": 28000, "Units_Sold": 35 },
    { "Transaction_Date": "2024-02-20", "Sales_Channel": "Online", "Product_Line": "Tablets", "Gross_Revenue": 8500, "Units_Sold": 20 },
    { "Transaction_Date": "2024-03-10", "Sales_Channel": "Wholesale", "Product_Line": "Laptops", "Gross_Revenue": 45000, "Units_Sold": 40 },
    { "Transaction_Date": "2024-03-25", "Sales_Channel": "Retail", "Product_Line": "Accessories", "Gross_Revenue": 3200, "Units_Sold": 150 },
    { "Transaction_Date": "2024-04-05", "Sales_Channel": "Online", "Product_Line": "Smartphones", "Gross_Revenue": 31000, "Units_Sold": 38 },
    { "Transaction_Date": "2024-04-18", "Sales_Channel": "Online", "Product_Line": "Laptops", "Gross_Revenue": 18000, "Units_Sold": 15 },
    { "Transaction_Date": "2024-05-02", "Sales_Channel": "Retail", "Product_Line": "Tablets", "Gross_Revenue": 9200, "Units_Sold": 22 },
    { "Transaction_Date": "2024-05-20", "Sales_Channel": "Wholesale", "Product_Line": "Accessories", "Gross_Revenue": 5600, "Units_Sold": 200 },
    { "Transaction_Date": "2024-06-12", "Sales_Channel": "Online", "Product_Line": "Smartphones", "Gross_Revenue": 29500, "Units_Sold": 36 },
    { "Transaction_Date": "2024-06-28", "Sales_Channel": "Retail", "Product_Line": "Laptops", "Gross_Revenue": 21000, "Units_Sold": 18 },
    { "Transaction_Date": "2024-07-08", "Sales_Channel": "Online", "Product_Line": "Accessories", "Gross_Revenue": 4100, "Units_Sold": 180 },
    { "Transaction_Date": "2024-07-25", "Sales_Channel": "Wholesale", "Product_Line": "Tablets", "Gross_Revenue": 11000, "Units_Sold": 25 },
    { "Transaction_Date": "2024-08-05", "Sales_Channel": "Retail", "Product_Line": "Smartphones", "Gross_Revenue": 33000, "Units_Sold": 42 },
    { "Transaction_Date": "2024-08-22", "Sales_Channel": "Online", "Product_Line": "Laptops", "Gross_Revenue": 16500, "Units_Sold": 14 }
  ];
}
