const OpenAI = require('openai');

/**
 * Brief Highlight Service
 * Extracts key project information from a brief using OpenAI GPT-5 nano
 */
class BriefHighlightService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Sanitize brief description text before including in prompt
   * This prevents special characters from causing issues in the AI response
   */
  sanitizeBriefText(briefText) {
    if (!briefText || typeof briefText !== 'string') {
      return '';
    }
    
    let sanitized = briefText;
    
    // Escape backslashes that might be interpreted as escape sequences
    // But preserve valid escape sequences if they exist
    sanitized = sanitized.replace(/\\(?!["\\/bfnrtu]|u[0-9a-fA-F]{4})/g, '\\\\');
    
    // Escape quotes to prevent breaking JSON structure in prompt
    sanitized = sanitized.replace(/"/g, '\\"');
    
    // Normalize newlines (convert to spaces or preserve as \n)
    sanitized = sanitized.replace(/\r\n/g, ' ');
    sanitized = sanitized.replace(/\n/g, ' ');
    sanitized = sanitized.replace(/\r/g, ' ');
    
    // Remove or convert LaTeX notation to plain text
    sanitized = sanitized.replace(/\$(\d+)\s*\\?\{?\s*\\circ\s*\}?\s*\$/g, '$1 degrees');
    sanitized = sanitized.replace(/(\d+)\s*\\?\{?\s*\\circ\s*\}?/g, '$1 degrees');
    
    // Trim and limit length to prevent prompt injection
    sanitized = sanitized.trim();
    if (sanitized.length > 8000) {
      sanitized = sanitized.substring(0, 8000) + '...';
    }
    
    return sanitized;
  }

  /**
   * Extract key highlights from a project brief
   * @param {string} briefText - The project brief text
   * @returns {Promise<Object>} Extracted highlights
   */
  async extractHighlights(briefText) {
    const startTime = Date.now();
    
    try {
      if (!briefText || briefText.trim().length === 0) {
        throw new Error('Brief text is required');
      }

      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key not configured');
      }

      const systemPrompt = `You are an expert event production project manager. Your task is to extract key data from project briefs while ignoring PDF artifacts like headers, footers, page numbers, and legal boilerplate.

CRITICAL RULES:
1. FOCUS: Prioritize Event Specifications, Dimensions (Spatial Layout), and Talent (DJs/Headline Acts).
2. SANITIZE: Always convert LaTeX (e.g., 360^{\\circ}) into plain text (e.g., '360 degrees').
3. FORMAT: Output ONLY valid JSON. All backslashes and quotes must be properly escaped according to JSON standards.
4. DIMENSIONS: Standardize spatial data as 'Length m x Width m' (e.g., '50 m x 40 m') whenever possible.
5. NOISE: Ignore repeated branding, document metadata, and table of contents.

You must respond with ONLY a valid JSON object. Do not include any explanatory text, markdown formatting, code blocks, or any characters outside of the JSON structure.

The JSON object must conform to this exact schema:
{
  "projectName": string | null,
  "clientName": string | null,
  "budget": number | null,
  "deadline": string | null,
  "physicalParameters": string | null
}

Extraction Rules:
- If information cannot be found in the brief, set the value to null
- For projectName: Extract the project/event name (ignore document titles and headers)
- For clientName: Extract the client/company/organization name (ignore repeated branding)
- For budget: Extract only numeric values (convert from any currency format to a number)
- For deadline: Extract dates in YYYY-MM-DD format. If only month/year is given, use the last day of that month
- For physicalParameters: Extract dimensions (standardize as 'X m x Y m'), venue details, capacity, and spatial layout. Focus on Event Specifications section.`;

      // Sanitize the brief text before sending to API
      const sanitizedBriefText = this.sanitizeBriefText(briefText);
      const userPrompt = `Analyze this project brief and extract the key information:\n\n${sanitizedBriefText}`;

      console.log('Calling OpenAI API for brief highlight extraction...');

      const response = await this.openai.chat.completions.create({
        model: "gpt-5-nano",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        response_format: { type: "json_object" }, // Force JSON output
        temperature: 0.3, // Low temperature for consistent extraction
        max_completion_tokens: 500
      });

      const content = response.choices[0].message.content;
      console.log('Raw AI response:', content);

      // Parse the JSON response
      const highlights = JSON.parse(content);

      const processingTime = Date.now() - startTime;
      console.log(`Brief highlights extracted in ${processingTime}ms`);

      // Validate the response structure
      const validatedHighlights = {
        projectName: highlights.projectName || null,
        clientName: highlights.clientName || null,
        budget: typeof highlights.budget === 'number' ? highlights.budget : null,
        deadline: highlights.deadline || null,
        physicalParameters: highlights.physicalParameters || null
      };

      return {
        success: true,
        data: validatedHighlights,
        processingTime
      };

    } catch (error) {
      console.error('Brief highlight extraction failed:', error);
      const processingTime = Date.now() - startTime;

      return {
        success: false,
        error: {
          message: error.message,
          type: error.name
        },
        processingTime
      };
    }
  }

  /**
   * Check if AI service is healthy
   */
  async checkHealth() {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return {
          healthy: false,
          error: 'OpenAI API key not configured'
        };
      }

      // Test with a simple request
      const response = await this.openai.chat.completions.create({
        model: "gpt-5-nano",
        messages: [{ role: "user", content: "Hello" }],
        max_completion_tokens: 5
      });

      return {
        healthy: true,
        model: "gpt-5-nano",
        service: 'briefHighlights'
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }
}

module.exports = BriefHighlightService;

