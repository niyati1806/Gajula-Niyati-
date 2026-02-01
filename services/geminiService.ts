
import { GoogleGenAI, Type } from "@google/genai";
import { TriageResult, Language } from "../types";

// Schema for structured JSON output
const doctorSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    name: { type: Type.STRING },
    specialty: { type: Type.STRING },
    distance: { type: Type.STRING },
    rating: { type: Type.NUMBER },
    availability: { type: Type.STRING },
    consultationFee: { type: Type.STRING, description: "Cost of consultation, e.g., '₹500'" },
    hospitalName: { type: Type.STRING, description: "Name of the clinic or hospital" },
    address: { type: Type.STRING, description: "Full physical address or landmark-based location" },
  },
  required: ["id", "name", "specialty", "distance", "rating", "availability", "consultationFee", "hospitalName", "address"],
};

const triageSchema = {
  type: Type.OBJECT,
  properties: {
    urgency: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
    specialty: { type: Type.STRING },
    specialistReason: { type: Type.STRING, description: "Detailed explanation of why this specific specialist is the best fit for these symptoms." },
    summary: { type: Type.STRING },
    careAdvice: { type: Type.STRING, description: "Actionable, evidence-based self-care advice for the immediate period." },
    followUpQuestion: { type: Type.STRING, description: "A high-quality medical clarifying question. E.g., 'Does the pain radiate to your arm?' or 'Is the fever accompanied by chills?' Use this to narrow down possibilities." },
    recommendedDoctors: {
      type: Type.ARRAY,
      items: doctorSchema,
    },
  },
  required: ["urgency", "specialty", "specialistReason", "summary", "careAdvice", "recommendedDoctors"],
};

export const analyzeSymptoms = async (
  symptoms: string,
  language: Language,
  previousHistory: string = "",
  isFollowUp: boolean = false
): Promise<TriageResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    You are HealthEase, a world-class clinical triage AI. 
    The user is interacting in ${language}.
    
    Current Interaction History: "${previousHistory}"
    Newest Input: "${symptoms}"
    Is this a follow-up answer: ${isFollowUp}

    Goal: Provide a highly accurate specialty recommendation and actionable advice.
    
    Clinical Strategy:
    1. If this is the FIRST time the user is describing symptoms, ALWAYS provide a 'followUpQuestion' to refine the assessment (unless it is a High Urgency emergency).
    2. If this IS a follow-up answer, summarize the findings and provide the specialist recommendation.
    3. Accuracy: Match symptoms to the narrowest possible specialist (e.g., 'Gastroenterologist' over 'GP' for persistent acid reflux).
    4. Advice: Provide 3-4 specific bullet points of self-care.
    5. Context: Generate 3 realistic doctors for a major city where ${language} is a primary language.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: triageSchema,
        temperature: 0.1, // Near-deterministic for medical safety
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text) as TriageResult;
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      urgency: "Medium",
      specialty: "General Physician",
      specialistReason: "Based on the generalized nature of the symptoms, a primary care physician is the best first point of contact.",
      summary: "Your symptoms require further professional investigation.",
      careAdvice: "Monitor your temperature, stay hydrated, and rest. If you experience difficulty breathing or severe pain, seek emergency care.",
      recommendedDoctors: [
        { 
          id: "1", 
          name: "Dr. A. Kumar", 
          specialty: "General Physician", 
          distance: "2 km", 
          rating: 4.5, 
          availability: "Today, 4:00 PM", 
          consultationFee: "₹400",
          hospitalName: "Central Health Clinic",
          address: "Sector 12, Main Market"
        }
      ]
    };
  }
};

export const getAssistantHelp = async (
  userQuestion: string,
  currentStep: string,
  language: Language
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    You are the "HealthEase Helper". Respond in ${language}.
    The user is at: "${currentStep}".
    User asks: "${userQuestion}"
    
    Help with: App navigation, explaining medical terms in simple words, or explaining why they are being asked certain questions. Keep it under 50 words.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { temperature: 0.7 },
    });
    return response.text || "Connection error. Please try again.";
  } catch (e) {
    return "I am here to help. How can I assist you with your health today?";
  }
};
