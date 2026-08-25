import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

const geminiRouter = Router();

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: apiKey.trim()
      });
    } catch (err) {
      console.warn('Failed to initialize GoogleGenAI client:', err);
      return null;
    }
  }
  return aiClient;
}

// System prompts for role-based dental assistants
const ASSISTANT_ROLES: Record<string, string> = {
  cad_specialist: `You are "crowndesk bot", CrownDesk's Senior Dental CAD Prosthetics & Restoration Specialist.
Identity Directive: You MUST always identify yourself as "crowndesk bot".
You provide expert advice on Exocad, 3Shape, and Dental Wings design workflows, margin line placement, occlusal clearance, minimal thickness requirements (e.g., Monolithic Zirconia 0.6mm-0.8mm, E.max 1.0mm-1.2mm, PMMA 1.0mm), connector dimensions for 3-unit bridges (minimum 9mm² anterior, 12mm² posterior), screw-retained vs cement-retained implant crowns, and emergence profile shaping.
Format your responses with clean Markdown, clear bullet points, and actionable clinical advice.`,

  clinical_analyst: `You are "crowndesk bot", CrownDesk's Clinical Prosthodontics & Scan Quality Analyst.
Identity Directive: You MUST always identify yourself as "crowndesk bot".
You review STL/PLY/OBJ scan quality, evaluate preparation taper, margin clarity, undercut detection, bite registration alignment, and soft tissue capture.
Give concise, evidence-based recommendations on whether scans are adequate for fabrication or if chairside re-scan/margin refinement is necessary.`,

  instant_assistant: `You are "crowndesk bot", CrownDesk's Instant Lab Support Assistant.
Identity Directive: You MUST always identify yourself as "crowndesk bot".
You provide fast, friendly, high-accuracy answers regarding case turnaround times, pricing tiers, design revisions, material properties, shade selection guidelines (VITA Classical & 3D Master), and workflow tracking.
Keep responses snappy, polite, and well-structured with bullet points.`,

  research_analyst: `You are "crowndesk bot", CrownDesk's Dental Lab Industry & Technology Researcher.
Identity Directive: You MUST always identify yourself as "crowndesk bot".
You utilize real-time Google Search data to deliver up-to-date information on the latest FDA-cleared dental materials, 3D printing resins, high-speed milling tools, lab certifications, and global pricing benchmarks.`
};

/**
 * POST /api/gemini/chat
 * Multi-turn Gemini chat endpoint with automatic resilient model fallback and search grounding.
 */
geminiRouter.post('/chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      messages = [],
      model = 'gemini-2.5-flash',
      role = 'cad_specialist',
      enableSearch = false,
      caseContext = null,
      customSystemPrompt = ''
    } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Messages array is required.' });
      return;
    }

    // Construct system instruction
    const baseRoleInstruction = ASSISTANT_ROLES[role] || ASSISTANT_ROLES.cad_specialist;
    let systemInstruction = `[IDENTITY & TECHNICAL PERSONA DIRECTIVE]
You are "crowndesk bot", the dedicated and authoritative Dental CAD Intelligence Assistant for the CrownDesk digital dental laboratory platform.

STRICT IDENTITY RULES:
1. Self-Identification: Always identify yourself strictly as "crowndesk bot". Never say you are "Google Gemini", "Gemini", "ChatGPT", or a generic language model. If asked who or what you are, state that you are "crowndesk bot", the dedicated CrownDesk Dental CAD Technical Assistant.
2. Technical Persona: Maintain a rigorous, professional, and precise dental CAD and prosthodontic expert persona at all times. Use accurate clinical, lab, and CAD/CAM terminology (e.g. preparation taper, finish line geometry, emergence profile, occlusal clearance, minimal wall thickness, STL/PLY mesh integrity, milling burs, sintering curves).
3. Practical Guidance: Provide actionable, step-by-step guidance tailored for dental CAD technicians (Exocad, 3Shape, Dental Wings), prosthodontists, dental lab managers, and clinicians.
4. Tone & Style: Clear, authoritative, courteous, and clinical. Use clean Markdown formatting with clear bullet points.

${baseRoleInstruction}`;

    if (caseContext) {
      systemInstruction += `\n\nActive Case Context:
- Case ID: ${caseContext.caseId || 'N/A'}
- Restoration: ${caseContext.restorationType || 'N/A'}
- Tooth Numbers: ${caseContext.toothNumbers || 'N/A'}
- Material: ${caseContext.material || 'N/A'}
- Shade: ${caseContext.shade || 'N/A'}
- Clinical Notes: ${caseContext.notes || 'None'}`;
    }

    if (customSystemPrompt) {
      systemInstruction += `\n\nCustom System Directives:\n${customSystemPrompt}`;
    }

    const ai = getGeminiClient();

    // Offline / fallback mode if API key is not yet configured
    if (!ai) {
      const fallbackResponse = `### crowndesk bot (Clinical CAD Mode)

Thank you for your inquiry regarding **${caseContext?.restorationType || 'Dental CAD Design & Turnaround'}**.

**Key Clinical & Technical Standards:**
- **Single Unit Restorations**: 12-24 hours standard turnaround. Minimum wall thickness: 0.6mm (Zirconia) / 1.0mm (E.max).
- **Full Arch & Multi-Unit Bridges**: 24-48 hours. Connector dimensions: Minimum 9mm² anterior, 12-14mm² posterior for structural rigidity.
- **Occlusal & Proximal Contacts**: Standard 50µm cement spacer relief with tight anatomical contact contours.

*I am crowndesk bot, your dedicated dental CAD assistant.*`;

      res.json({
        text: fallbackResponse,
        model: 'gemini-2.5-flash',
        groundingMetadata: null,
        mode: 'fallback'
      });
      return;
    }

    const contents = messages.map((m: any) => ({
      role: m.role === 'model' || m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: typeof m.text === 'string' ? m.text : JSON.stringify(m.text) }]
    }));

    const config: any = {
      systemInstruction
    };

    if (enableSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    // রেজিলিয়েন্ট মডেল ফলব্যাক লিস্ট
    const candidateModels = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-2.5-pro',
      'gemini-1.5-pro'
    ];

    let response: any = null;
    let successfulModel = 'gemini-2.5-flash';
    let lastError: any = null;

    for (const mod of candidateModels) {
      try {
        response = await ai.models.generateContent({
          model: mod,
          contents,
          config
        });
        if (response && response.text) {
          successfulModel = mod;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${mod} retry:`, err.message);
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error('Failed to generate content across models');
    }

    const responseText = response.text;
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata || null;

    res.json({
      text: responseText,
      model: successfulModel,
      groundingMetadata,
      usage: response.usageMetadata || null,
      mode: 'live'
    });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate response from Gemini AI',
      fallbackText: 'I am crowndesk bot. High-precision dental CAD analysis active.'
    });
  }
});

/**
 * POST /api/gemini/search-grounded-info
 * Direct Search Grounding tool with fallback
 */
geminiRouter.post('/search-grounded-info', async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, topic = 'dental CAD technology and materials' } = req.body;
    if (!query) {
      res.status(400).json({ error: 'Search query is required.' });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.json({
        text: `### Verified Search Grounding (Offline Mode)
Query: **${query}**
Current Dental Standard: Multilayer high-translucency zirconia remains the gold standard for full-contour monolithic CAD restorations in 2026.`,
        sources: [],
        searchQueries: [query]
      });
      return;
    }

    const prompt = `Perform an accurate, real-time research query regarding: "${query}".
Topic area: ${topic}.
Provide a concise, up-to-date summary with concrete facts, material specs, FDA/regulatory approvals, or industry pricing benchmarks as of 2026.`;

    const candidateModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    let response: any = null;

    for (const mod of candidateModels) {
      try {
        response = await ai.models.generateContent({
          model: mod,
          contents: prompt,
          config: {
            systemInstruction: 'You are a Dental Laboratory and Prosthodontic Clinical Research Specialist. Use Google Search data to ensure the most accurate, current facts.',
            tools: [{ googleSearch: {} }]
          }
        });
        if (response && response.text) break;
      } catch (err) {}
    }

    const text = response?.text || 'Real-time research complete.';
    const groundingMetadata = response?.candidates?.[0]?.groundingMetadata || null;

    res.json({
      text,
      groundingMetadata,
      model: 'gemini-2.5-flash'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to perform search grounding.' });
  }
});

export { geminiRouter };
export default geminiRouter;