import { GoogleGenAI, Type, Schema } from "@google/genai";
import { LeafAnalysisResult } from "../types";

// Initialize the client
// The API key is guaranteed to be available in process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    isLeaf: {
      type: Type.BOOLEAN,
      description: "Whether the image contains a leaf or plant foliage.",
    },
    species: {
      type: Type.STRING,
      description: "The common name of the species if it is a leaf. Null otherwise.",
      nullable: true,
    },
    scientificName: {
      type: Type.STRING,
      description: "The scientific (Latin) name of the species. Null otherwise.",
      nullable: true,
    },
    confidence: {
      type: Type.NUMBER,
      description: "Confidence score between 0 and 1.",
    },
    description: {
      type: Type.STRING,
      description: "A short, interesting botanical description of the leaf features. Null if not a leaf.",
      nullable: true,
    },
    reason: {
      type: Type.STRING,
      description: "If not a leaf, explain what was detected instead.",
      nullable: true,
    }
  },
  required: ["isLeaf", "confidence"],
};

export const analyzeImage = async (base64Image: string, mimeType: string): Promise<LeafAnalysisResult> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: "Analyze this image. Determine if it is a biological leaf. If it is, identify the species. Provide the output in JSON format.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.4, // Lower temperature for more factual analysis
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from Gemini");
    }

    const result = JSON.parse(text) as LeafAnalysisResult;
    return result;

  } catch (error) {
    console.error("Error analyzing leaf:", error);
    throw error;
  }
};
