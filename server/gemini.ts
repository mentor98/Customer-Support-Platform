import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

function getAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

export async function summarizeTicketThread(ticketSubject: string, description: string, messages: { authorName: string; authorRole: string; content: string; isInternal: boolean }[]): Promise<string> {
  const ai = getAI();
  if (!ai) {
    return `Summary (Offline Mode):\nTicket Subject: "${ticketSubject}"\nKey Issue: ${description.slice(0, 140)}...\nThread contains ${messages.length} messages between customer and support.`;
  }

  try {
    const formattedThread = messages
      .map(m => `[${m.authorRole.toUpperCase()} - ${m.authorName}${m.isInternal ? ' (INTERNAL NOTE)' : ''}]:\n${m.content}`)
      .join('\n\n');

    const prompt = `You are an expert customer support operations assistant. Summarize the following customer support ticket thread concisely for an agent or supervisor.
Format with:
1. Core Issue / Request
2. Action Taken So Far
3. Current Status & Next Required Action

Ticket Subject: ${ticketSubject}
Initial Description: ${description}

Conversation Thread:
${formattedThread}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
    });

    return response.text || 'Unable to generate summary.';
  } catch (err: any) {
    console.error('Gemini summarize error:', err);
    return `Summary:\nSubject: ${ticketSubject}\nDescription: ${description.slice(0, 160)}...\n(AI service temporarily unavailable, showing fallback summary).`;
  }
}

export async function generateSmartReply(
  ticketSubject: string,
  customerName: string,
  ticketCategory: string,
  latestCustomerMessage: string,
  tone: 'professional' | 'empathetic' | 'technical' | 'concise' = 'professional'
): Promise<string> {
  const ai = getAI();
  if (!ai) {
    return `Hi ${customerName},\n\nThank you for reaching out regarding "${ticketSubject}". We are actively investigating your request and will follow up with complete details shortly.\n\nBest regards,\nSupport Team`;
  }

  try {
    const prompt = `You are a high-performing Tier 2 customer support engineer. Write a ${tone} response to the customer.

Customer Name: ${customerName}
Ticket Subject: ${ticketSubject}
Category: ${ticketCategory}
Latest Customer Message:
"${latestCustomerMessage}"

Tone: ${tone} (e.g. empathetic should acknowledge frustration gently, technical should explain diagnostic steps clearly, concise should be direct and action-oriented).
Do not use placeholders like [Insert name] - use the provided Customer Name (${customerName}).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
    });

    return response.text || 'Hi ' + customerName + ', thank you for your patience while we review your request.';
  } catch (err: any) {
    console.error('Gemini generate reply error:', err);
    return `Hi ${customerName},\n\nThank you for providing those details regarding ${ticketSubject}. We are actively reviewing this and will update you promptly.`;
  }
}

export async function analyzeTicketSentiment(subject: string, description: string): Promise<{
  sentiment: 'positive' | 'neutral' | 'frustrated' | 'urgent';
  suggestedPriority: 'low' | 'medium' | 'high' | 'urgent';
  suggestedTags: string[];
  keyPainPoint: string;
}> {
  const ai = getAI();
  if (!ai) {
    const isUrgent = subject.toLowerCase().includes('fail') || subject.toLowerCase().includes('504') || description.toLowerCase().includes('down');
    return {
      sentiment: isUrgent ? 'urgent' : 'neutral',
      suggestedPriority: isUrgent ? 'urgent' : 'medium',
      suggestedTags: ['customer-issue', 'support'],
      keyPainPoint: 'Customer reported an issue needing attention.'
    };
  }

  try {
    const prompt = `Analyze this support ticket and return strict JSON with sentiment, suggested priority, 3 relevant tags, and a 1-sentence pain point summary.

Subject: ${subject}
Description: ${description}

Respond ONLY with valid JSON in this exact structure:
{
  "sentiment": "positive" | "neutral" | "frustrated" | "urgent",
  "suggestedPriority": "low" | "medium" | "high" | "urgent",
  "suggestedTags": ["tag1", "tag2", "tag3"],
  "keyPainPoint": "one concise sentence explaining the root frustration"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      sentiment: parsed.sentiment || 'neutral',
      suggestedPriority: parsed.suggestedPriority || 'medium',
      suggestedTags: Array.isArray(parsed.suggestedTags) ? parsed.suggestedTags : ['support'],
      keyPainPoint: parsed.keyPainPoint || 'Operational challenge reported.'
    };
  } catch (err) {
    console.error('Gemini sentiment error:', err);
    return {
      sentiment: 'neutral',
      suggestedPriority: 'medium',
      suggestedTags: ['triage'],
      keyPainPoint: 'Customer reported an operational issue.'
    };
  }
}

export async function generateKBArticleFromTicket(ticket: { subject: string; description: string; category: string }, solution: string): Promise<{
  title: string;
  category: string;
  tags: string[];
  content: string;
}> {
  const ai = getAI();
  if (!ai) {
    return {
      title: `How to Resolve: ${ticket.subject}`,
      category: ticket.category,
      tags: ['how-to', 'troubleshooting'],
      content: `## Issue Overview\n${ticket.description}\n\n## Solution & Resolution Steps\n${solution}\n\n### Prevention\nEnsure configurations are verified before deployment.`
    };
  }

  try {
    const prompt = `You are a Technical Knowledge Base Author. Create a polished, markdown-formatted public Knowledge Base article based on this resolved customer ticket and its resolution.

Ticket Subject: ${ticket.subject}
Category: ${ticket.category}
Customer Problem: ${ticket.description}
Resolution Given: ${solution}

Output strictly JSON:
{
  "title": "Clear, searchable article title (e.g. How to Resolve...)",
  "category": "${ticket.category}",
  "tags": ["3-4 relevant tags"],
  "content": "Full markdown content with sections: Overview, Symptoms / Error Codes, Step-by-step Solution, and Best Practices / Prevention."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      title: parsed.title || `Guide: ${ticket.subject}`,
      category: parsed.category || ticket.category,
      tags: Array.isArray(parsed.tags) ? parsed.tags : ['support', 'guide'],
      content: parsed.content || `## Overview\n${ticket.description}\n\n## Resolution\n${solution}`
    };
  } catch (err) {
    console.error('Gemini KB generate error:', err);
    return {
      title: `Troubleshooting: ${ticket.subject}`,
      category: ticket.category,
      tags: ['troubleshooting', 'knowledge-base'],
      content: `## Problem\n${ticket.description}\n\n## Solution\n${solution}`
    };
  }
}
