import { GoogleGenAI, Type } from '@google/genai';
import { Request, Response } from 'express';
import { adminDb } from './firebaseAdmin';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeIssue(req: Request, res: Response): Promise<void> {
  try {
    const { imageBase64, latitude, longitude } = req.body;
    
    if (!imageBase64 || !latitude || !longitude) {
      res.status(400).json({ error: 'Image and location are required' });
      return;
    }

    const prompt = `You are SAHAAY AI, an expert system for analyzing civic issues.
    Analyze the provided image and location coordinates (Lat: ${latitude}, Lng: ${longitude}).
    Determine the following:
    1. Category: (e.g., Pothole, Water Leakage, Damaged Streetlight, Waste Accumulation, Road Damage, Illegal Dumping, Public Infrastructure, Public Transport, Other).
    2. Description: A brief, clear description of the issue.
    3. IsGovernmentConcern: Boolean indicating if this is likely a public/municipal/government issue rather than private property.
       CRITICAL RULES FOR PUBLIC VS PRIVATE/SOCIETY CLASSIFICATION:
       - Public Concerns (isGovernmentConcern = true): Municipal streets, public highways, public walkways/sidewalks, public parks, municipal open drainage, main water supply pipelines on public roads, public electric/streetlight poles, government offices, public transit structures.
       - Private/Society Concerns (isGovernmentConcern = false):
         * Cracks in individual residential house walls, domestic rooms, kitchens, bedrooms, bathrooms, ceilings, structural elements of private buildings.
         * Interior or exterior walls/floors of private housing societies, gated communities, cooperative housing complexes, private balconies, private compound walls, private backyards, personal gardens, personal plumbing.
         * Private business properties or private office interiors.
         * Personal vehicles or private assets.
       - If you detect that the image represents a crack in a domestic wall, a household structure, a private driveway, or lies within private residential boundaries or cooperative housing societies, you MUST set isGovernmentConcern to false.
    4. RejectionReason: If isGovernmentConcern is false, provide a professional, specific, and polite explanation of why the complaint is classified as a private or housing society maintenance issue instead of a municipal/government-managed public concern. If isGovernmentConcern is true, leave this empty.
    5. Severity: Number from 1-10 based on how dangerous/disruptive it is to the general public.
    6. IsLifeThreatening: Boolean indicating if it's an immediate danger to life.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        prompt,
        {
          inlineData: {
            data: imageBase64,
            mimeType: 'image/jpeg'
          }
        }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            description: { type: Type.STRING },
            isGovernmentConcern: { type: Type.BOOLEAN },
            rejectionReason: { type: Type.STRING },
            severity: { type: Type.INTEGER },
            isLifeThreatening: { type: Type.BOOLEAN },
          },
          required: ['category', 'description', 'isGovernmentConcern', 'rejectionReason', 'severity', 'isLifeThreatening']
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    res.json(result);
  } catch (error) {
    console.error('Error analyzing issue:', error);
    res.status(500).json({ error: 'Failed to analyze issue' });
  }
}

export async function chatbotResponse(req: Request, res: Response): Promise<void> {
  try {
    const { message, userRole, locationContext } = req.body;

    const prompt = `You are SAHAAY Chatbot.
    User Role: ${userRole || 'Citizen'}.
    Location Context: ${locationContext || 'Unknown'}.
    You help citizens report issues and officials manage them.
    Keep answers concise, helpful, and polite.
    User Message: ${message}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    res.json({ reply: response.text });
  } catch (error) {
    console.error('Error in chatbot:', error);
    res.status(500).json({ error: 'Failed to get chatbot response' });
  }
}

export async function analyzeFix(req: Request, res: Response): Promise<void> {
  try {
    const { imageBase64, issueDescription } = req.body;
    
    if (!imageBase64 || !issueDescription) {
      res.status(400).json({ error: 'Image and issue description are required' });
      return;
    }

    const prompt = `You are SAHAAY AI, an expert system for verifying resolved civic issues.
    The original issue was: "${issueDescription}".
    Analyze the provided image of the purported fix.
    Determine if the issue appears to be successfully resolved.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        prompt,
        {
          inlineData: {
            data: imageBase64,
            mimeType: 'image/jpeg'
          }
        }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isResolved: { type: Type.BOOLEAN },
            reason: { type: Type.STRING },
          },
          required: ['isResolved', 'reason']
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    res.json(result);
  } catch (error) {
    console.error('Error analyzing fix:', error);
    res.status(500).json({ error: 'Failed to analyze fix' });
  }
}

export async function generateSummary(req: Request, res: Response): Promise<void> {
  try {
    const { issues, officialDetails } = req.body;
    
    if (!issues || !Array.isArray(issues)) {
      res.status(400).json({ error: 'Issues array is required' });
      return;
    }

    const prompt = `You are SAHAAY AI, an expert analytical assistant for government officials.
    Generate a detailed monthly summary report for the past 30 days based on the following issues reported in the official's domain.
    
    Official Details:
    Post/Role: ${officialDetails?.role || 'N/A'}
    Region: ${officialDetails?.region || 'N/A'}
    Department: ${officialDetails?.department || 'N/A'}
    
    Issues Data (JSON):
    ${JSON.stringify(issues)}
    
    Provide a professional, well-structured Markdown summary that includes:
    1. An executive overview of the situation over the past 30 days.
    2. Key metrics (Total reported, resolved, critical issues).
    3. Prominent issues or recurring patterns.
    4. Recommendations for resource allocation or immediate actions.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    res.json({ summary: response.text });
  } catch (error) {
    console.error('Error generating summary:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
}
